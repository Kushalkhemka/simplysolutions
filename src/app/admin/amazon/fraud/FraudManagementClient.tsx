'use client';

import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Search, ShieldX, Trash2, ChevronLeft, ChevronRight, Loader2, X, AlertTriangle, Upload, CheckCircle, Globe } from 'lucide-react';

interface FraudOrder {
    id: string;
    order_id: string;
    fsn: string | null;
    license_key_id: string | null;
    is_fraud: boolean;
    fraud_reason: string | null;
    fraud_marked_at: string | null;
    is_returned: boolean;
    returned_at: string | null;
    last_access_ip: string | null;
    created_at: string;
}

interface BlockedIP {
    id: string;
    ip_address: string;
    reason: string | null;
    blocked_at: string;
}

interface ProductData {
    fsn: string;
    product_title: string;
}

export default function FraudManagementClient() {
    const [fraudOrders, setFraudOrders] = useState<FraudOrder[]>([]);
    const [blockedIPs, setBlockedIPs] = useState<BlockedIP[]>([]);
    const [productMappings, setProductMappings] = useState<Map<string, string>>(new Map());
    const [totalCount, setTotalCount] = useState(0);
    const [currentPage, setCurrentPage] = useState(1);
    const [searchQuery, setSearchQuery] = useState('');
    const [activeTab, setActiveTab] = useState<'orders' | 'ips'>('orders');
    const [isLoading, setIsLoading] = useState(true);

    // Add fraud modal
    const [showAddModal, setShowAddModal] = useState(false);
    const [newOrderId, setNewOrderId] = useState('');
    const [newReason, setNewReason] = useState<string>('refund_after_redeem');
    const [newIP, setNewIP] = useState('');
    const [blockIP, setBlockIP] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // CSV upload
    const [showCsvModal, setShowCsvModal] = useState(false);
    const [csvFile, setCsvFile] = useState<File | null>(null);
    const [csvUploading, setCsvUploading] = useState(false);
    const [csvProgress, setCsvProgress] = useState('');

    const pageSize = 50;
    const supabase = createClient();

    // Fetch product mappings
    const fetchProductMappings = useCallback(async () => {
        const { data } = await supabase.from('products_data').select('fsn, product_title');
        if (data) {
            const map = new Map<string, string>();
            data.forEach((p: ProductData) => map.set(p.fsn, p.product_title));
            setProductMappings(map);
        }
    }, [supabase]);

    // Fetch fraud orders from amazon_orders
    const fetchFraudOrders = useCallback(async () => {
        setIsLoading(true);
        const from = (currentPage - 1) * pageSize;
        const to = from + pageSize - 1;

        let query = supabase
            .from('amazon_orders')
            .select('id, order_id, fsn, license_key_id, is_fraud, fraud_reason, fraud_marked_at, is_returned, returned_at, last_access_ip, created_at', { count: 'exact' })
            .eq('is_fraud', true)
            .order('fraud_marked_at', { ascending: false, nullsFirst: false });

        if (searchQuery) {
            query = query.or(`order_id.ilike.%${searchQuery}%,fsn.ilike.%${searchQuery}%`);
        }

        const { data, count, error } = await query.range(from, to);

        if (error) {
            console.error('Error fetching fraud orders:', error);
        } else {
            setFraudOrders(data || []);
            setTotalCount(count || 0);
        }
        setIsLoading(false);
    }, [currentPage, searchQuery, supabase]);

    // Fetch blocked IPs
    const fetchBlockedIPs = useCallback(async () => {
        const { data } = await supabase.from('blocked_ips').select('*').order('blocked_at', { ascending: false });
        setBlockedIPs(data || []);
    }, [supabase]);

    useEffect(() => {
        fetchProductMappings();
    }, [fetchProductMappings]);

    useEffect(() => {
        if (activeTab === 'orders') {
            fetchFraudOrders();
        } else {
            fetchBlockedIPs();
        }
    }, [activeTab, fetchFraudOrders, fetchBlockedIPs]);

    // Mark order as fraud
    const handleAddFraud = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newOrderId.trim()) return;

        setIsSubmitting(true);

        try {
            // Update amazon_order to mark as fraud
            const { error } = await supabase
                .from('amazon_orders')
                .update({
                    is_fraud: true,
                    fraud_reason: newReason,
                    fraud_marked_at: new Date().toISOString(),
                    last_access_ip: newIP || null,
                })
                .eq('order_id', newOrderId.trim());

            if (error) {
                // Order might not exist - show error
                alert(`Order not found: ${newOrderId}`);
                setIsSubmitting(false);
                return;
            }

            // Block IP if requested
            if (blockIP && newIP) {
                await supabase
                    .from('blocked_ips')
                    .upsert({
                        ip_address: newIP,
                        reason: `Fraud order: ${newOrderId}`,
                        order_id: newOrderId,
                    }, { onConflict: 'ip_address' });
            }

            setShowAddModal(false);
            setNewOrderId('');
            setNewReason('refund_after_redeem');
            setNewIP('');
            setBlockIP(false);
            fetchFraudOrders();

        } catch (error: any) {
            alert(`Error: ${error.message}`);
        }

        setIsSubmitting(false);
    };

    // Remove fraud mark
    const handleRemoveFraud = async (order: FraudOrder) => {
        if (!confirm('Remove fraud mark? Order will be accessible again.')) return;

        await supabase
            .from('amazon_orders')
            .update({
                is_fraud: false,
                fraud_reason: null,
                fraud_marked_at: null,
            })
            .eq('id', order.id);

        fetchFraudOrders();
    };

    // Unblock IP
    const handleUnblockIP = async (ip: BlockedIP) => {
        if (!confirm(`Unblock ${ip.ip_address}?`)) return;
        await supabase.from('blocked_ips').delete().eq('id', ip.id);
        fetchBlockedIPs();
    };

    // CSV upload for bulk fraud marking
    const handleCsvUpload = async () => {
        if (!csvFile) return;

        setCsvUploading(true);
        setCsvProgress('Reading file...');

        try {
            const text = await csvFile.text();
            const lines = text.split('\n').filter(l => l.trim());
            const dataLines = lines.slice(1);

            let marked = 0, errors = 0;

            for (const line of dataLines) {
                const [orderId, reason] = line.split(',').map(p => p.trim().replace(/^"|"$/g, ''));
                if (!orderId) continue;

                const { error } = await supabase
                    .from('amazon_orders')
                    .update({
                        is_fraud: true,
                        fraud_reason: reason || 'refund_after_redeem',
                        fraud_marked_at: new Date().toISOString(),
                    })
                    .eq('order_id', orderId);

                if (error) errors++;
                else marked++;

                setCsvProgress(`Processed ${marked + errors}/${dataLines.length}...`);
            }

            setCsvProgress(`Done! Marked: ${marked}, Errors: ${errors}`);
            fetchFraudOrders();
        } catch (error: any) {
            setCsvProgress(`Error: ${error.message}`);
        }

        setCsvUploading(false);
    };

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        setCurrentPage(1);
        fetchFraudOrders();
    };

    const totalPages = Math.ceil(totalCount / pageSize);
    const getProductName = (fsn: string | null) => fsn ? (productMappings.get(fsn) || fsn) : '-';

    const getReasonBadge = (reason: string | null) => {
        const colors: Record<string, string> = {
            refund_after_redeem: 'bg-red-100 text-red-800',
            return_request: 'bg-orange-100 text-orange-800',
            suspicious_activity: 'bg-yellow-100 text-yellow-800',
            chargeback: 'bg-purple-100 text-purple-800',
        };
        const labels: Record<string, string> = {
            refund_after_redeem: 'Refund After Use',
            return_request: 'Return Request',
            suspicious_activity: 'Suspicious',
            chargeback: 'Chargeback',
        };
        return (
            <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${colors[reason || ''] || 'bg-gray-100 text-gray-800'}`}>
                <AlertTriangle className="h-3 w-3" />
                {labels[reason || ''] || reason || 'Unknown'}
            </span>
        );
    };

    const formatDate = (d: string | null) => d ? new Date(d).toLocaleString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '-';

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold">Fraud Management</h1>
                    <p className="text-muted-foreground">Manage fraud orders and blocked IPs</p>
                </div>
                <div className="flex gap-2">
                    <button onClick={() => setShowCsvModal(true)} className="flex items-center gap-2 px-4 py-2 border rounded-lg hover:bg-accent">
                        <Upload className="h-4 w-4" />Import CSV
                    </button>
                    <button onClick={() => setShowAddModal(true)} className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700">
                        <ShieldX className="h-4 w-4" />Mark Fraud
                    </button>
                </div>
            </div>

            {/* Tabs */}
            <div className="grid grid-cols-2 gap-4">
                <button onClick={() => setActiveTab('orders')} className={`bg-red-50 border border-red-200 rounded-lg p-4 text-left transition-all ${activeTab === 'orders' ? 'ring-2 ring-red-400' : 'hover:ring-2 hover:ring-red-400'}`}>
                    <p className="text-2xl font-bold text-red-800">{totalCount}</p>
                    <p className="text-sm text-red-600">Fraud Orders</p>
                </button>
                <button onClick={() => setActiveTab('ips')} className={`bg-gray-50 border border-gray-200 rounded-lg p-4 text-left transition-all ${activeTab === 'ips' ? 'ring-2 ring-gray-400' : 'hover:ring-2 hover:ring-gray-400'}`}>
                    <p className="text-2xl font-bold text-gray-800">{blockedIPs.length}</p>
                    <p className="text-sm text-gray-600">Blocked IPs</p>
                </button>
            </div>

            {activeTab === 'orders' ? (
                <>
                    <form onSubmit={handleSearch} className="flex gap-4">
                        <div className="relative flex-1 max-w-md">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <input type="text" placeholder="Search Order ID or FSN..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full pl-10 pr-4 py-2 border rounded-lg bg-background" />
                        </div>
                        <button type="submit" className="px-4 py-2 bg-primary text-primary-foreground rounded-lg">Search</button>
                    </form>

                    <div className="bg-card border rounded-lg overflow-hidden">
                        {isLoading ? (
                            <div className="p-8 text-center"><Loader2 className="h-8 w-8 animate-spin mx-auto" /></div>
                        ) : (
                            <>
                                <table className="w-full">
                                    <thead className="bg-red-50">
                                        <tr>
                                            <th className="px-4 py-3 text-left text-sm font-medium">Order ID</th>
                                            <th className="px-4 py-3 text-left text-sm font-medium">Product</th>
                                            <th className="px-4 py-3 text-left text-sm font-medium">Reason</th>
                                            <th className="px-4 py-3 text-left text-sm font-medium">IP</th>
                                            <th className="px-4 py-3 text-left text-sm font-medium">Marked</th>
                                            <th className="px-4 py-3 text-left text-sm font-medium">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y">
                                        {fraudOrders.map((o) => (
                                            <tr key={o.id} className="hover:bg-red-50/50">
                                                <td className="px-4 py-3 font-mono text-sm">{o.order_id}</td>
                                                <td className="px-4 py-3">
                                                    <p className="text-sm font-medium">{o.fsn || '-'}</p>
                                                    <p className="text-xs text-muted-foreground truncate max-w-[150px]">{getProductName(o.fsn)}</p>
                                                </td>
                                                <td className="px-4 py-3">{getReasonBadge(o.fraud_reason)}</td>
                                                <td className="px-4 py-3 text-xs font-mono">{o.last_access_ip || '-'}</td>
                                                <td className="px-4 py-3 text-sm text-muted-foreground">{formatDate(o.fraud_marked_at)}</td>
                                                <td className="px-4 py-3">
                                                    <button onClick={() => handleRemoveFraud(o)} className="text-red-500 hover:text-red-700"><Trash2 className="h-4 w-4" /></button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                                {fraudOrders.length === 0 && (
                                    <div className="p-8 text-center text-muted-foreground">
                                        <CheckCircle className="h-12 w-12 mx-auto mb-2 text-green-500" />No fraud orders
                                    </div>
                                )}
                            </>
                        )}
                    </div>

                    {totalPages > 1 && (
                        <div className="flex items-center justify-between">
                            <p className="text-sm text-muted-foreground">Page {currentPage} of {totalPages}</p>
                            <div className="flex gap-2">
                                <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} className="p-2 border rounded-lg disabled:opacity-50"><ChevronLeft className="h-4 w-4" /></button>
                                <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} className="p-2 border rounded-lg disabled:opacity-50"><ChevronRight className="h-4 w-4" /></button>
                            </div>
                        </div>
                    )}
                </>
            ) : (
                <div className="bg-card border rounded-lg overflow-hidden">
                    <table className="w-full">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-4 py-3 text-left text-sm font-medium">IP Address</th>
                                <th className="px-4 py-3 text-left text-sm font-medium">Reason</th>
                                <th className="px-4 py-3 text-left text-sm font-medium">Blocked At</th>
                                <th className="px-4 py-3 text-left text-sm font-medium">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y">
                            {blockedIPs.map((ip) => (
                                <tr key={ip.id} className="hover:bg-muted/30">
                                    <td className="px-4 py-3 font-mono text-sm flex items-center gap-2"><Globe className="h-4 w-4" />{ip.ip_address}</td>
                                    <td className="px-4 py-3 text-sm">{ip.reason || '-'}</td>
                                    <td className="px-4 py-3 text-sm text-muted-foreground">{formatDate(ip.blocked_at)}</td>
                                    <td className="px-4 py-3">
                                        <button onClick={() => handleUnblockIP(ip)} className="text-xs px-2 py-1 bg-green-100 text-green-700 rounded hover:bg-green-200">Unblock</button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    {blockedIPs.length === 0 && <div className="p-8 text-center text-muted-foreground">No blocked IPs</div>}
                </div>
            )}

            {/* Add Fraud Modal */}
            {showAddModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center">
                    <div className="absolute inset-0 bg-black/50" onClick={() => setShowAddModal(false)} />
                    <div className="relative bg-card border rounded-xl shadow-xl w-full max-w-md m-4">
                        <div className="border-b px-6 py-4 flex items-center justify-between bg-red-50">
                            <h2 className="text-xl font-bold text-red-800">Mark as Fraud</h2>
                            <button onClick={() => setShowAddModal(false)} className="p-2 hover:bg-red-100 rounded-full"><X className="h-5 w-5" /></button>
                        </div>
                        <form onSubmit={handleAddFraud} className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium mb-1">Order ID *</label>
                                <input type="text" value={newOrderId} onChange={(e) => setNewOrderId(e.target.value)} placeholder="XXX-XXXXXXX-XXXXXXX" className="w-full px-4 py-2 border rounded-lg font-mono" required />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">Reason</label>
                                <select value={newReason} onChange={(e) => setNewReason(e.target.value)} className="w-full px-4 py-2 border rounded-lg">
                                    <option value="refund_after_redeem">Refund After Use</option>
                                    <option value="return_request">Return Request</option>
                                    <option value="suspicious_activity">Suspicious Activity</option>
                                    <option value="chargeback">Chargeback</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">IP Address (optional)</label>
                                <input type="text" value={newIP} onChange={(e) => setNewIP(e.target.value)} placeholder="xxx.xxx.xxx.xxx" className="w-full px-4 py-2 border rounded-lg font-mono" />
                            </div>
                            {newIP && (
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input type="checkbox" checked={blockIP} onChange={(e) => setBlockIP(e.target.checked)} className="rounded" />
                                    <span className="text-sm">Block this IP</span>
                                </label>
                            )}
                            <div className="flex gap-3 pt-4">
                                <button type="button" onClick={() => setShowAddModal(false)} className="flex-1 px-4 py-2 border rounded-lg hover:bg-accent">Cancel</button>
                                <button type="submit" disabled={isSubmitting || !newOrderId} className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg disabled:opacity-50 flex items-center justify-center gap-2">
                                    {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShieldX className="h-4 w-4" />}Mark
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* CSV Modal */}
            {showCsvModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center">
                    <div className="absolute inset-0 bg-black/50" onClick={() => !csvUploading && setShowCsvModal(false)} />
                    <div className="relative bg-card border rounded-xl shadow-xl w-full max-w-lg m-4">
                        <div className="border-b px-6 py-4 flex items-center justify-between">
                            <h2 className="text-xl font-bold">Import Fraud Orders</h2>
                            <button onClick={() => !csvUploading && setShowCsvModal(false)} className="p-2 hover:bg-muted rounded-full" disabled={csvUploading}><X className="h-5 w-5" /></button>
                        </div>
                        <div className="p-6 space-y-4">
                            <div className="p-4 bg-muted/30 rounded-lg">
                                <code className="text-xs">Order ID, Reason</code>
                                <p className="text-xs text-muted-foreground mt-1">Reasons: refund_after_redeem, return_request, suspicious_activity, chargeback</p>
                            </div>
                            <input type="file" accept=".csv" onChange={(e) => setCsvFile(e.target.files?.[0] || null)} className="w-full px-4 py-2 border rounded-lg" disabled={csvUploading} />
                            {csvProgress && <div className="p-3 bg-muted/30 rounded-lg text-sm">{csvProgress}</div>}
                            <div className="flex gap-3 pt-4">
                                <button onClick={() => !csvUploading && setShowCsvModal(false)} disabled={csvUploading} className="flex-1 px-4 py-2 border rounded-lg disabled:opacity-50">Cancel</button>
                                <button onClick={handleCsvUpload} disabled={csvUploading || !csvFile} className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg disabled:opacity-50 flex items-center justify-center gap-2">
                                    {csvUploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}Import
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
