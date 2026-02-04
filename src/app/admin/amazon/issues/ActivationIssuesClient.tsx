'use client';

import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Search, CheckCircle, Mail, Phone, Key, ChevronLeft, ChevronRight, Loader2, X, Clock, Bell, XCircle } from 'lucide-react';

interface OrderWithIssue {
    id: string;
    order_id: string;
    fsn: string | null;
    license_key_id: string | null;
    has_activation_issue: boolean;
    issue_status: string | null;
    issue_created_at: string | null;
    contact_email: string | null;
    contact_phone: string | null;
    created_at: string;
}

interface AvailableKey {
    id: string;
    license_key: string;
}

interface ProductData {
    fsn: string;
    product_title: string;
}

export default function ActivationIssuesClient() {
    const [orders, setOrders] = useState<OrderWithIssue[]>([]);
    const [productMappings, setProductMappings] = useState<Map<string, string>>(new Map());
    const [totalCount, setTotalCount] = useState(0);
    const [currentPage, setCurrentPage] = useState(1);
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState<string>('pending');
    const [isLoading, setIsLoading] = useState(true);

    // Modal state
    const [selectedOrder, setSelectedOrder] = useState<OrderWithIssue | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [availableKeys, setAvailableKeys] = useState<AvailableKey[]>([]);
    const [selectedKeyId, setSelectedKeyId] = useState('');
    const [resolutionNotes, setResolutionNotes] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Stats
    const [pendingCount, setPendingCount] = useState(0);
    const [resolvedCount, setResolvedCount] = useState(0);
    const [notifiedCount, setNotifiedCount] = useState(0);

    const pageSize = 50;
    const supabase = createClient();

    // Fetch product mappings for FSN -> product name
    const fetchProductMappings = useCallback(async () => {
        const { data } = await supabase
            .from('products_data')
            .select('fsn, product_title');

        if (data) {
            const map = new Map<string, string>();
            data.forEach((p: ProductData) => map.set(p.fsn, p.product_title));
            setProductMappings(map);
        }
    }, [supabase]);

    // Fetch stats
    const fetchStats = useCallback(async () => {
        const { count: pending } = await supabase
            .from('amazon_orders')
            .select('*', { count: 'exact', head: true })
            .eq('has_activation_issue', true)
            .eq('issue_status', 'pending');

        const { count: resolved } = await supabase
            .from('amazon_orders')
            .select('*', { count: 'exact', head: true })
            .eq('has_activation_issue', true)
            .eq('issue_status', 'resolved');

        const { count: notified } = await supabase
            .from('amazon_orders')
            .select('*', { count: 'exact', head: true })
            .eq('has_activation_issue', true)
            .eq('issue_status', 'notified');

        setPendingCount(pending || 0);
        setResolvedCount(resolved || 0);
        setNotifiedCount(notified || 0);
    }, [supabase]);

    // Fetch orders with issues
    const fetchOrders = useCallback(async () => {
        setIsLoading(true);
        const from = (currentPage - 1) * pageSize;
        const to = from + pageSize - 1;

        let query = supabase
            .from('amazon_orders')
            .select('id, order_id, fsn, license_key_id, has_activation_issue, issue_status, issue_created_at, contact_email, contact_phone, created_at', { count: 'exact' })
            .eq('has_activation_issue', true)
            .order('issue_created_at', { ascending: false, nullsFirst: false });

        if (searchQuery) {
            query = query.or(`order_id.ilike.%${searchQuery}%,customer_notify_email.ilike.%${searchQuery}%,customer_notify_phone.ilike.%${searchQuery}%`);
        }

        if (statusFilter !== 'all') {
            query = query.eq('issue_status', statusFilter);
        }

        const { data, count, error } = await query.range(from, to);

        if (error) {
            console.error('Error fetching orders:', error);
        } else {
            setOrders(data || []);
            setTotalCount(count || 0);
        }
        setIsLoading(false);
    }, [currentPage, searchQuery, statusFilter, supabase]);

    useEffect(() => {
        fetchProductMappings();
        fetchStats();
    }, [fetchProductMappings, fetchStats]);

    useEffect(() => {
        fetchOrders();
    }, [fetchOrders]);

    // Open modal and fetch available keys
    const openResolveModal = async (order: OrderWithIssue) => {
        setSelectedOrder(order);
        setSelectedKeyId('');
        setResolutionNotes('');
        setIsModalOpen(true);

        if (order.fsn) {
            const { data } = await supabase
                .from('amazon_activation_license_keys')
                .select('id, license_key')
                .eq('fsn', order.fsn)
                .eq('is_redeemed', false)
                .limit(100);

            setAvailableKeys(data || []);
        }
    };

    // Resolve issue by assigning a key
    const handleResolve = async () => {
        if (!selectedOrder) return;

        setIsSubmitting(true);

        try {
            // Update the order
            await supabase
                .from('amazon_orders')
                .update({
                    issue_status: 'resolved',
                    issue_notes: resolutionNotes,
                    license_key_id: selectedKeyId || selectedOrder.license_key_id,
                })
                .eq('id', selectedOrder.id);

            // If a key was assigned, mark it as redeemed
            if (selectedKeyId) {
                await supabase
                    .from('amazon_activation_license_keys')
                    .update({
                        is_redeemed: true,
                        order_id: selectedOrder.order_id,
                    })
                    .eq('id', selectedKeyId);
            }

            setIsModalOpen(false);
            fetchOrders();
            fetchStats();
        } catch (error) {
            console.error('Error resolving issue:', error);
        }

        setIsSubmitting(false);
    };

    // Mark as notified
    const handleNotify = async (order: OrderWithIssue) => {
        await supabase
            .from('amazon_orders')
            .update({ issue_status: 'notified' })
            .eq('id', order.id);

        fetchOrders();
        fetchStats();
    };

    // Cancel issue
    const handleCancel = async (order: OrderWithIssue) => {
        if (!confirm('Cancel this activation issue?')) return;

        await supabase
            .from('amazon_orders')
            .update({
                issue_status: 'cancelled',
                has_activation_issue: false,
            })
            .eq('id', order.id);

        fetchOrders();
        fetchStats();
    };

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        setCurrentPage(1);
        fetchOrders();
    };

    const totalPages = Math.ceil(totalCount / pageSize);

    const getProductName = (fsn: string | null) => {
        if (!fsn) return '-';
        return productMappings.get(fsn) || fsn;
    };

    const getStatusBadge = (status: string | null) => {
        switch (status) {
            case 'resolved':
                return <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"><CheckCircle className="h-3 w-3" /> Resolved</span>;
            case 'notified':
                return <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400"><Bell className="h-3 w-3" /> Notified</span>;
            case 'cancelled':
                return <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400"><XCircle className="h-3 w-3" /> Cancelled</span>;
            default:
                return <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400"><Clock className="h-3 w-3" /> Pending</span>;
        }
    };

    const formatDate = (dateString: string | null) => {
        if (!dateString) return '-';
        return new Date(dateString).toLocaleString('en-IN', {
            day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
        });
    };

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold">Activation Issues</h1>
                <p className="text-muted-foreground">Orders where customers had activation problems</p>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-4">
                <button
                    onClick={() => { setStatusFilter('pending'); setCurrentPage(1); }}
                    className={`bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4 text-left hover:ring-2 hover:ring-yellow-400 transition-all ${statusFilter === 'pending' ? 'ring-2 ring-yellow-400' : ''}`}
                >
                    <p className="text-2xl font-bold text-yellow-800 dark:text-yellow-400">{pendingCount}</p>
                    <p className="text-sm text-yellow-600 dark:text-yellow-500">Pending</p>
                </button>
                <button
                    onClick={() => { setStatusFilter('notified'); setCurrentPage(1); }}
                    className={`bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 text-left hover:ring-2 hover:ring-blue-400 transition-all ${statusFilter === 'notified' ? 'ring-2 ring-blue-400' : ''}`}
                >
                    <p className="text-2xl font-bold text-blue-800 dark:text-blue-400">{notifiedCount}</p>
                    <p className="text-sm text-blue-600 dark:text-blue-500">Notified</p>
                </button>
                <button
                    onClick={() => { setStatusFilter('resolved'); setCurrentPage(1); }}
                    className={`bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4 text-left hover:ring-2 hover:ring-green-400 transition-all ${statusFilter === 'resolved' ? 'ring-2 ring-green-400' : ''}`}
                >
                    <p className="text-2xl font-bold text-green-800 dark:text-green-400">{resolvedCount}</p>
                    <p className="text-sm text-green-600 dark:text-green-500">Resolved</p>
                </button>
            </div>

            {/* Search */}
            <form onSubmit={handleSearch} className="flex gap-4">
                <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <input
                        type="text"
                        placeholder="Search by Order ID, Email, or Phone..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 border rounded-lg bg-background"
                    />
                </div>
                <button type="submit" className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90">
                    Search
                </button>
                {statusFilter !== 'pending' && (
                    <button type="button" onClick={() => { setStatusFilter('all'); setCurrentPage(1); }} className="px-4 py-2 border rounded-lg hover:bg-accent">
                        Show All
                    </button>
                )}
            </form>

            {/* Orders - Mobile Cards View */}
            <div className="lg:hidden space-y-3">
                {isLoading ? (
                    <div className="p-8 text-center bg-card border rounded-lg">
                        <Loader2 className="h-8 w-8 animate-spin mx-auto text-muted-foreground" />
                    </div>
                ) : orders.length === 0 ? (
                    <div className="p-8 text-center text-muted-foreground bg-card border rounded-lg">No activation issues found</div>
                ) : (
                    orders.map((order) => (
                        <div key={order.id} className="bg-card border rounded-lg p-4">
                            <div className="flex items-start justify-between gap-3">
                                <div className="flex-1 min-w-0">
                                    <p className="font-mono text-sm font-medium truncate">{order.order_id}</p>
                                    <p className="text-xs text-muted-foreground mt-1 truncate">{order.fsn || '-'} • {getProductName(order.fsn)}</p>
                                    <div className="flex items-center flex-wrap gap-2 mt-2">
                                        {getStatusBadge(order.issue_status)}
                                    </div>
                                    {(order.contact_email || order.contact_phone) && (
                                        <div className="text-xs text-muted-foreground mt-2">
                                            {order.contact_email && <p className="flex items-center gap-1"><Mail className="h-3 w-3" /> {order.contact_email}</p>}
                                            {order.contact_phone && <p className="flex items-center gap-1"><Phone className="h-3 w-3" /> {order.contact_phone}</p>}
                                        </div>
                                    )}
                                    <p className="text-xs text-muted-foreground mt-2">{formatDate(order.issue_created_at || order.created_at)}</p>
                                </div>
                                <div className="flex flex-col gap-1 shrink-0">
                                    {order.issue_status === 'pending' && (
                                        <>
                                            <button onClick={() => openResolveModal(order)} className="text-xs px-2 py-1 bg-green-100 text-green-700 rounded hover:bg-green-200 dark:bg-green-900/30 dark:text-green-400">
                                                <Key className="h-3 w-3 inline mr-1" />Assign
                                            </button>
                                            <button onClick={() => handleNotify(order)} className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200 dark:bg-blue-900/30 dark:text-blue-400">
                                                <Bell className="h-3 w-3 inline" />
                                            </button>
                                        </>
                                    )}
                                    {order.issue_status === 'notified' && (
                                        <>
                                            <button onClick={() => openResolveModal(order)} className="text-xs px-2 py-1 bg-green-100 text-green-700 rounded hover:bg-green-200 dark:bg-green-900/30 dark:text-green-400">
                                                <Key className="h-3 w-3 inline mr-1" />Assign
                                            </button>
                                            <button onClick={() => handleCancel(order)} className="text-xs px-2 py-1 bg-red-100 text-red-700 rounded hover:bg-red-200 dark:bg-red-900/30 dark:text-red-400">
                                                <XCircle className="h-3 w-3" />
                                            </button>
                                        </>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Orders Table - Desktop View */}
            <div className="hidden lg:block bg-card border rounded-lg overflow-hidden">
                {isLoading ? (
                    <div className="p-8 text-center">
                        <Loader2 className="h-8 w-8 animate-spin mx-auto text-muted-foreground" />
                    </div>
                ) : (
                    <>
                        <table className="w-full">
                            <thead className="bg-muted/50">
                                <tr>
                                    <th className="px-4 py-3 text-left text-sm font-medium">Order ID</th>
                                    <th className="px-4 py-3 text-left text-sm font-medium">FSN / Product</th>
                                    <th className="px-4 py-3 text-left text-sm font-medium">Customer Contact</th>
                                    <th className="px-4 py-3 text-left text-sm font-medium">Status</th>
                                    <th className="px-4 py-3 text-left text-sm font-medium">Date</th>
                                    <th className="px-4 py-3 text-left text-sm font-medium">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y">
                                {orders.map((order) => (
                                    <tr key={order.id} className="hover:bg-muted/30">
                                        <td className="px-4 py-3 font-mono text-sm">{order.order_id}</td>
                                        <td className="px-4 py-3">
                                            <p className="text-sm font-medium">{order.fsn || '-'}</p>
                                            <p className="text-xs text-muted-foreground truncate max-w-[200px]">{getProductName(order.fsn)}</p>
                                        </td>
                                        <td className="px-4 py-3">
                                            {order.contact_email && (
                                                <p className="text-sm flex items-center gap-1">
                                                    <Mail className="h-3 w-3" /> {order.contact_email}
                                                </p>
                                            )}
                                            {order.contact_phone && (
                                                <p className="text-sm flex items-center gap-1">
                                                    <Phone className="h-3 w-3" /> {order.contact_phone}
                                                </p>
                                            )}
                                        </td>

                                        <td className="px-4 py-3">{getStatusBadge(order.issue_status)}</td>
                                        <td className="px-4 py-3 text-sm text-muted-foreground">
                                            {formatDate(order.issue_created_at || order.created_at)}
                                        </td>
                                        <td className="px-4 py-3">
                                            {order.issue_status === 'pending' && (
                                                <div className="flex items-center gap-2">
                                                    <button onClick={() => openResolveModal(order)} className="text-xs px-2 py-1 bg-green-100 text-green-700 rounded hover:bg-green-200 dark:bg-green-900/30 dark:text-green-400 dark:hover:bg-green-900/50">
                                                        <Key className="h-3 w-3 inline mr-1" />Assign
                                                    </button>
                                                    <button onClick={() => handleNotify(order)} className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:hover:bg-blue-900/50">
                                                        <Bell className="h-3 w-3 inline" />
                                                    </button>
                                                    <button onClick={() => handleCancel(order)} className="text-xs px-2 py-1 bg-red-100 text-red-700 rounded hover:bg-red-200 dark:bg-red-900/30 dark:text-red-400 dark:hover:bg-red-900/50">
                                                        <XCircle className="h-3 w-3" />
                                                    </button>
                                                </div>
                                            )}
                                            {order.issue_status === 'notified' && (
                                                <div className="flex items-center gap-2">
                                                    <button onClick={() => openResolveModal(order)} className="text-xs px-2 py-1 bg-green-100 text-green-700 rounded hover:bg-green-200 dark:bg-green-900/30 dark:text-green-400 dark:hover:bg-green-900/50">
                                                        <Key className="h-3 w-3 inline mr-1" />Assign
                                                    </button>
                                                    <button onClick={() => handleCancel(order)} className="text-xs px-2 py-1 bg-red-100 text-red-700 rounded hover:bg-red-200 dark:bg-red-900/30 dark:text-red-400 dark:hover:bg-red-900/50">
                                                        <XCircle className="h-3 w-3" />
                                                    </button>
                                                </div>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        {orders.length === 0 && (
                            <div className="p-8 text-center text-muted-foreground">No activation issues found</div>
                        )}
                    </>
                )}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
                <div className="flex items-center justify-between">
                    <p className="text-sm text-muted-foreground">
                        Showing {((currentPage - 1) * pageSize) + 1} to {Math.min(currentPage * pageSize, totalCount)} of {totalCount}
                    </p>
                    <div className="flex items-center gap-2">
                        <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} className="p-2 border rounded-lg hover:bg-accent disabled:opacity-50">
                            <ChevronLeft className="h-4 w-4" />
                        </button>
                        <span className="px-3 py-2 text-sm">Page {currentPage} of {totalPages}</span>
                        <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} className="p-2 border rounded-lg hover:bg-accent disabled:opacity-50">
                            <ChevronRight className="h-4 w-4" />
                        </button>
                    </div>
                </div>
            )}

            {/* Resolve Modal */}
            {isModalOpen && selectedOrder && (
                <div className="fixed inset-0 z-50 flex items-center justify-center">
                    <div className="absolute inset-0 bg-black/50" onClick={() => setIsModalOpen(false)} />
                    <div className="relative bg-card border rounded-xl shadow-xl w-full max-w-md m-4">
                        <div className="border-b px-6 py-4 flex items-center justify-between">
                            <h2 className="text-xl font-bold">Resolve Issue</h2>
                            <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-muted rounded-full"><X className="h-5 w-5" /></button>
                        </div>
                        <div className="p-6 space-y-4">
                            <div className="p-4 bg-muted/30 rounded-lg space-y-2">
                                <p className="text-sm"><strong>Order:</strong> {selectedOrder.order_id}</p>
                                <p className="text-sm"><strong>FSN:</strong> {selectedOrder.fsn || '-'}</p>
                                <p className="text-sm"><strong>Product:</strong> {getProductName(selectedOrder.fsn)}</p>
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">Assign Key</label>
                                <select value={selectedKeyId} onChange={(e) => setSelectedKeyId(e.target.value)} className="w-full px-4 py-2 border rounded-lg bg-background font-mono text-sm">
                                    <option value="">Select a key</option>
                                    {availableKeys.map(k => (<option key={k.id} value={k.id}>{k.license_key}</option>))}
                                </select>
                                <p className="text-xs text-muted-foreground mt-1">{availableKeys.length} keys available</p>
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">Notes</label>
                                <textarea value={resolutionNotes} onChange={(e) => setResolutionNotes(e.target.value)} className="w-full px-4 py-2 border rounded-lg bg-background text-sm" rows={2} />
                            </div>
                            <div className="flex gap-3 pt-4">
                                <button onClick={() => setIsModalOpen(false)} className="flex-1 px-4 py-2 border rounded-lg hover:bg-accent">Cancel</button>
                                <button onClick={handleResolve} disabled={isSubmitting} className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 flex items-center justify-center gap-2">
                                    {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle className="h-4 w-4" />}
                                    Resolve
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
