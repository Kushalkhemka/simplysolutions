'use client';

import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Search, Filter, Eye, CheckCircle, XCircle, Clock, ChevronLeft, ChevronRight, X, Package, Key, Fingerprint, ShieldCheck, Calendar, Loader2 } from 'lucide-react';

interface AmazonOrder {
    id: string;
    order_id: string;
    fsn: string | null;
    contact_email: string | null;
    contact_phone: string | null;
    warranty_status: string;
    fulfillment_type: string;
    getcid_used: boolean;
    installation_id: string | null;
    confirmation_id: string | null;
    product_title: string | null;
    license_key_id: string | null;
    created_at: string;
    updated_at: string;
}

interface LicenseKey {
    id: string;
    license_key: string;
    fsn: string | null;
    is_redeemed: boolean;
    created_at: string;
}

interface OrderDetails extends AmazonOrder {
    license_key?: LicenseKey | null;
}

export default function AmazonOrdersClient() {
    const [orders, setOrders] = useState<AmazonOrder[]>([]);
    const [totalCount, setTotalCount] = useState(0);
    const [currentPage, setCurrentPage] = useState(1);
    const [searchQuery, setSearchQuery] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [selectedOrder, setSelectedOrder] = useState<OrderDetails | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isLoadingDetails, setIsLoadingDetails] = useState(false);

    const pageSize = 50;
    const supabase = createClient();

    const fetchOrders = useCallback(async () => {
        setIsLoading(true);
        const from = (currentPage - 1) * pageSize;
        const to = from + pageSize - 1;

        let query = supabase
            .from('amazon_orders')
            .select('*', { count: 'exact' })
            .order('created_at', { ascending: false });

        if (searchQuery) {
            query = query.or(`order_id.ilike.%${searchQuery}%,fsn.ilike.%${searchQuery}%`);
        }

        const { data, count, error } = await query.range(from, to);

        if (error) {
            console.error('Error fetching orders:', error);
        } else {
            setOrders(data || []);
            setTotalCount(count || 0);
        }
        setIsLoading(false);
    }, [currentPage, searchQuery, supabase]);

    useEffect(() => {
        fetchOrders();
    }, [fetchOrders]);

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        setCurrentPage(1);
        fetchOrders();
    };

    const viewOrderDetails = async (order: AmazonOrder) => {
        setIsLoadingDetails(true);
        setIsModalOpen(true);

        let licenseKey: LicenseKey | null = null;

        if (order.license_key_id) {
            const { data } = await supabase
                .from('amazon_activation_license_keys')
                .select('id, license_key, fsn, is_redeemed, created_at')
                .eq('id', order.license_key_id)
                .single();

            licenseKey = data;
        }

        setSelectedOrder({
            ...order,
            license_key: licenseKey
        });
        setIsLoadingDetails(false);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setSelectedOrder(null);
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'APPROVED':
                return <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800"><CheckCircle className="h-3 w-3" /> Approved</span>;
            case 'REJECTED':
                return <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800"><XCircle className="h-3 w-3" /> Rejected</span>;
            default:
                return <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800"><Clock className="h-3 w-3" /> Pending</span>;
        }
    };

    const totalPages = Math.ceil(totalCount / pageSize);

    const formatDate = (dateString: string | null) => {
        if (!dateString) return '-';
        return new Date(dateString).toLocaleString('en-IN', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold">Amazon Orders</h1>
                    <p className="text-muted-foreground">Manage Amazon activation orders ({totalCount.toLocaleString()} total)</p>
                </div>
            </div>

            {/* Search and Filter */}
            <form onSubmit={handleSearch} className="flex gap-4">
                <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <input
                        type="text"
                        placeholder="Search by Order ID or FSN..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 border rounded-lg bg-background"
                    />
                </div>
                <button type="submit" className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90">
                    Search
                </button>
                <button type="button" className="flex items-center gap-2 px-4 py-2 border rounded-lg hover:bg-accent">
                    <Filter className="h-4 w-4" />
                    Filter
                </button>
            </form>

            {/* Orders Table */}
            <div className="bg-card border rounded-lg overflow-hidden">
                {isLoading ? (
                    <div className="p-8 text-center">
                        <Loader2 className="h-8 w-8 animate-spin mx-auto text-muted-foreground" />
                        <p className="mt-2 text-muted-foreground">Loading orders...</p>
                    </div>
                ) : (
                    <>
                        <table className="w-full">
                            <thead className="bg-muted/50">
                                <tr>
                                    <th className="px-4 py-3 text-left text-sm font-medium">Order ID</th>
                                    <th className="px-4 py-3 text-left text-sm font-medium">FSN</th>
                                    <th className="px-4 py-3 text-left text-sm font-medium">Contact</th>
                                    <th className="px-4 py-3 text-left text-sm font-medium">Warranty</th>
                                    <th className="px-4 py-3 text-left text-sm font-medium">Type</th>
                                    <th className="px-4 py-3 text-left text-sm font-medium">GetCID</th>
                                    <th className="px-4 py-3 text-left text-sm font-medium">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y">
                                {orders.map((order) => (
                                    <tr key={order.id} className="hover:bg-muted/30">
                                        <td className="px-4 py-3 font-mono text-sm">{order.order_id}</td>
                                        <td className="px-4 py-3 text-sm text-muted-foreground">{order.fsn || '-'}</td>
                                        <td className="px-4 py-3 text-sm">{order.contact_email || order.contact_phone || '-'}</td>
                                        <td className="px-4 py-3">{getStatusBadge(order.warranty_status)}</td>
                                        <td className="px-4 py-3 text-sm">
                                            <span className={`px-2 py-1 rounded text-xs ${order.fulfillment_type === 'amazon_fba' ? 'bg-blue-100 text-blue-800' : 'bg-purple-100 text-purple-800'}`}>
                                                {order.fulfillment_type === 'amazon_fba' ? 'FBA' : 'Digital'}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3">
                                            {order.getcid_used ? (
                                                <span className="text-green-600 text-sm">Used</span>
                                            ) : (
                                                <span className="text-muted-foreground text-sm">-</span>
                                            )}
                                        </td>
                                        <td className="px-4 py-3">
                                            <button
                                                onClick={() => viewOrderDetails(order)}
                                                className="text-primary hover:text-primary/80 transition-colors"
                                            >
                                                <Eye className="h-4 w-4" />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>

                        {orders.length === 0 && (
                            <div className="p-8 text-center text-muted-foreground">
                                No orders found
                            </div>
                        )}
                    </>
                )}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
                <div className="flex items-center justify-between">
                    <p className="text-sm text-muted-foreground">
                        Showing {((currentPage - 1) * pageSize) + 1} to {Math.min(currentPage * pageSize, totalCount)} of {totalCount.toLocaleString()} orders
                    </p>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                            disabled={currentPage === 1}
                            className="p-2 border rounded-lg hover:bg-accent disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <ChevronLeft className="h-4 w-4" />
                        </button>
                        <span className="px-3 py-2 text-sm">
                            Page {currentPage} of {totalPages}
                        </span>
                        <button
                            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                            disabled={currentPage === totalPages}
                            className="p-2 border rounded-lg hover:bg-accent disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <ChevronRight className="h-4 w-4" />
                        </button>
                    </div>
                </div>
            )}

            {/* Order Details Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center">
                    <div className="absolute inset-0 bg-black/50" onClick={closeModal} />
                    <div className="relative bg-card border rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto m-4">
                        <div className="sticky top-0 bg-card border-b px-6 py-4 flex items-center justify-between">
                            <h2 className="text-xl font-bold">Order Details</h2>
                            <button onClick={closeModal} className="p-2 hover:bg-muted rounded-full transition-colors">
                                <X className="h-5 w-5" />
                            </button>
                        </div>

                        {isLoadingDetails ? (
                            <div className="p-8 text-center">
                                <Loader2 className="h-8 w-8 animate-spin mx-auto text-muted-foreground" />
                                <p className="mt-2 text-muted-foreground">Loading order details...</p>
                            </div>
                        ) : selectedOrder && (
                            <div className="p-6 space-y-4">
                                {/* Product Name */}
                                <div className="flex items-start gap-4 p-4 bg-muted/30 rounded-lg">
                                    <div className="p-2 bg-orange-100 rounded-lg">
                                        <Package className="h-5 w-5 text-orange-600" />
                                    </div>
                                    <div className="flex-1">
                                        <p className="text-xs text-muted-foreground uppercase tracking-wide">Product Name</p>
                                        <p className="font-medium text-lg">{selectedOrder.product_title || selectedOrder.fsn || 'Not Available'}</p>
                                    </div>
                                </div>

                                {/* Order ID */}
                                <div className="flex items-start gap-4 p-4 bg-muted/30 rounded-lg">
                                    <div className="p-2 bg-blue-100 rounded-lg">
                                        <Package className="h-5 w-5 text-blue-600" />
                                    </div>
                                    <div className="flex-1">
                                        <p className="text-xs text-muted-foreground uppercase tracking-wide">Order ID</p>
                                        <p className="font-mono font-medium">{selectedOrder.order_id}</p>
                                    </div>
                                </div>

                                {/* License Key */}
                                <div className="flex items-start gap-4 p-4 bg-muted/30 rounded-lg">
                                    <div className="p-2 bg-green-100 rounded-lg">
                                        <Key className="h-5 w-5 text-green-600" />
                                    </div>
                                    <div className="flex-1">
                                        <p className="text-xs text-muted-foreground uppercase tracking-wide">License Key</p>
                                        <p className="font-mono font-medium break-all">
                                            {selectedOrder.license_key?.license_key || <span className="text-muted-foreground italic">Not Assigned</span>}
                                        </p>
                                    </div>
                                </div>

                                {/* FSN */}
                                <div className="flex items-start gap-4 p-4 bg-muted/30 rounded-lg">
                                    <div className="p-2 bg-purple-100 rounded-lg">
                                        <Package className="h-5 w-5 text-purple-600" />
                                    </div>
                                    <div className="flex-1">
                                        <p className="text-xs text-muted-foreground uppercase tracking-wide">FSN</p>
                                        <p className="font-mono font-medium">
                                            {selectedOrder.fsn || selectedOrder.license_key?.fsn || <span className="text-muted-foreground italic">Not Available</span>}
                                        </p>
                                    </div>
                                </div>

                                {/* Installation ID */}
                                <div className="flex items-start gap-4 p-4 bg-muted/30 rounded-lg">
                                    <div className="p-2 bg-amber-100 rounded-lg">
                                        <Fingerprint className="h-5 w-5 text-amber-600" />
                                    </div>
                                    <div className="flex-1">
                                        <p className="text-xs text-muted-foreground uppercase tracking-wide">Installation ID</p>
                                        <p className="font-mono font-medium break-all">
                                            {selectedOrder.installation_id || <span className="text-muted-foreground italic">Not Available</span>}
                                        </p>
                                    </div>
                                </div>

                                {/* Confirmation ID */}
                                <div className="flex items-start gap-4 p-4 bg-muted/30 rounded-lg">
                                    <div className="p-2 bg-teal-100 rounded-lg">
                                        <ShieldCheck className="h-5 w-5 text-teal-600" />
                                    </div>
                                    <div className="flex-1">
                                        <p className="text-xs text-muted-foreground uppercase tracking-wide">Confirmation ID</p>
                                        <p className="font-mono font-medium break-all">
                                            {selectedOrder.confirmation_id || <span className="text-muted-foreground italic">Not Available</span>}
                                        </p>
                                    </div>
                                </div>

                                {/* Timestamps */}
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="flex items-start gap-4 p-4 bg-muted/30 rounded-lg">
                                        <div className="p-2 bg-gray-100 rounded-lg">
                                            <Calendar className="h-5 w-5 text-gray-600" />
                                        </div>
                                        <div className="flex-1">
                                            <p className="text-xs text-muted-foreground uppercase tracking-wide">Created At</p>
                                            <p className="font-medium text-sm">{formatDate(selectedOrder.created_at)}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-start gap-4 p-4 bg-muted/30 rounded-lg">
                                        <div className="p-2 bg-indigo-100 rounded-lg">
                                            <Calendar className="h-5 w-5 text-indigo-600" />
                                        </div>
                                        <div className="flex-1">
                                            <p className="text-xs text-muted-foreground uppercase tracking-wide">Last Modified</p>
                                            <p className="font-medium text-sm">{formatDate(selectedOrder.updated_at)}</p>
                                        </div>
                                    </div>
                                </div>

                                {/* Status Info */}
                                <div className="flex items-center justify-between p-4 bg-muted/30 rounded-lg">
                                    <div>
                                        <p className="text-xs text-muted-foreground uppercase tracking-wide">Warranty Status</p>
                                        <div className="mt-1">{getStatusBadge(selectedOrder.warranty_status)}</div>
                                    </div>
                                    <div>
                                        <p className="text-xs text-muted-foreground uppercase tracking-wide">GetCID Status</p>
                                        <div className="mt-1">
                                            {selectedOrder.getcid_used ? (
                                                <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                                    <CheckCircle className="h-3 w-3" /> Used
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                                                    Not Used
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
