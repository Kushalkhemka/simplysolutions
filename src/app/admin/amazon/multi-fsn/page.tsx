'use client';

import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { AlertTriangle, Package, CheckCircle, Clock, Eye, X, Loader2 } from 'lucide-react';

interface MultiItemOrder {
    id: string;
    order_id: string;
    order_date: string | null;
    buyer_email: string | null;
    contact_email: string | null;
    items: {
        asin: string;
        sku: string;
        fsn: string;
        title: string;
        quantity: number;
        price: string;
    }[];
    item_count: number;
    total_amount: number | null;
    currency: string;
    status: string;
    admin_notes: string | null;
    created_at: string;
    processed_at: string | null;
}

export default function MultiFsnOrdersPage() {
    const [orders, setOrders] = useState<MultiItemOrder[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedOrder, setSelectedOrder] = useState<MultiItemOrder | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [adminNotes, setAdminNotes] = useState('');
    const [isSaving, setIsSaving] = useState(false);
    const [filter, setFilter] = useState<'all' | 'PENDING' | 'PROCESSED'>('PENDING');

    const supabase = createClient();

    const fetchOrders = useCallback(async () => {
        setIsLoading(true);
        let query = supabase
            .from('multi_fsn_orders')
            .select('*')
            .order('created_at', { ascending: false });

        if (filter !== 'all') {
            query = query.eq('status', filter);
        }

        const { data, error } = await query;

        if (error) {
            console.error('Error fetching multi-FSN orders:', error);
        } else {
            setOrders(data || []);
        }
        setIsLoading(false);
    }, [supabase, filter]);

    useEffect(() => {
        fetchOrders();
    }, [fetchOrders]);

    const openModal = (order: MultiItemOrder) => {
        setSelectedOrder(order);
        setAdminNotes(order.admin_notes || '');
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setSelectedOrder(null);
        setAdminNotes('');
    };

    const markAsProcessed = async () => {
        if (!selectedOrder) return;

        setIsSaving(true);
        const { error } = await supabase
            .from('multi_fsn_orders')
            .update({
                status: 'PROCESSED',
                admin_notes: adminNotes,
                processed_at: new Date().toISOString()
            })
            .eq('id', selectedOrder.id);

        if (error) {
            console.error('Error updating order:', error);
            alert('Failed to update order');
        } else {
            await fetchOrders();
            closeModal();
        }
        setIsSaving(false);
    };

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

    const pendingCount = orders.filter(o => o.status === 'PENDING').length;

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <div className="flex items-center gap-3">
                        <h1 className="text-2xl font-bold">Multi-Product Orders</h1>
                        {pendingCount > 0 && (
                            <span className="px-2 py-1 bg-amber-100 text-amber-800 rounded-full text-sm font-medium flex items-center gap-1">
                                <AlertTriangle className="h-4 w-4" />
                                {pendingCount} pending
                            </span>
                        )}
                    </div>
                    <p className="text-muted-foreground">
                        Orders with multiple different products require manual handling
                    </p>
                </div>
            </div>

            {/* Filter Tabs */}
            <div className="flex gap-2">
                {(['PENDING', 'PROCESSED', 'all'] as const).map((tab) => (
                    <button
                        key={tab}
                        onClick={() => setFilter(tab)}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${filter === tab
                                ? 'bg-primary text-primary-foreground'
                                : 'bg-muted hover:bg-muted/80'
                            }`}
                    >
                        {tab === 'all' ? 'All' : tab}
                    </button>
                ))}
            </div>

            {/* Orders Table */}
            <div className="bg-card border rounded-lg overflow-hidden">
                {isLoading ? (
                    <div className="p-8 text-center">
                        <Loader2 className="h-8 w-8 animate-spin mx-auto text-muted-foreground" />
                        <p className="mt-2 text-muted-foreground">Loading orders...</p>
                    </div>
                ) : orders.length === 0 ? (
                    <div className="p-8 text-center text-muted-foreground">
                        <Package className="h-12 w-12 mx-auto mb-3 opacity-50" />
                        <p>No {filter !== 'all' ? filter.toLowerCase() : ''} multi-product orders found</p>
                    </div>
                ) : (
                    <table className="w-full">
                        <thead className="bg-muted/50">
                            <tr>
                                <th className="px-4 py-3 text-left text-sm font-medium">Order ID</th>
                                <th className="px-4 py-3 text-left text-sm font-medium">Products</th>
                                <th className="px-4 py-3 text-left text-sm font-medium">Total</th>
                                <th className="px-4 py-3 text-left text-sm font-medium">Status</th>
                                <th className="px-4 py-3 text-left text-sm font-medium">Created</th>
                                <th className="px-4 py-3 text-left text-sm font-medium">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y">
                            {orders.map((order) => (
                                <tr key={order.id} className="hover:bg-muted/30">
                                    <td className="px-4 py-3 font-mono text-sm">{order.order_id}</td>
                                    <td className="px-4 py-3">
                                        <div className="flex flex-wrap gap-1">
                                            {order.items.slice(0, 3).map((item, i) => (
                                                <span
                                                    key={i}
                                                    className="px-2 py-0.5 bg-purple-100 text-purple-700 rounded text-xs"
                                                >
                                                    {item.fsn}
                                                </span>
                                            ))}
                                            {order.items.length > 3 && (
                                                <span className="text-xs text-muted-foreground">
                                                    +{order.items.length - 3} more
                                                </span>
                                            )}
                                        </div>
                                    </td>
                                    <td className="px-4 py-3 text-sm">
                                        {order.total_amount ? `₹${order.total_amount.toLocaleString()}` : '-'}
                                    </td>
                                    <td className="px-4 py-3">
                                        {order.status === 'PROCESSED' ? (
                                            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                                <CheckCircle className="h-3 w-3" /> Processed
                                            </span>
                                        ) : (
                                            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-800">
                                                <Clock className="h-3 w-3" /> Pending
                                            </span>
                                        )}
                                    </td>
                                    <td className="px-4 py-3 text-sm text-muted-foreground">
                                        {formatDate(order.created_at)}
                                    </td>
                                    <td className="px-4 py-3">
                                        <button
                                            onClick={() => openModal(order)}
                                            className="text-primary hover:text-primary/80 transition-colors"
                                        >
                                            <Eye className="h-4 w-4" />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>

            {/* Detail Modal */}
            {isModalOpen && selectedOrder && (
                <div className="fixed inset-0 z-50 flex items-center justify-center">
                    <div className="absolute inset-0 bg-black/50" onClick={closeModal} />
                    <div className="relative bg-card border rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto m-4">
                        <div className="sticky top-0 bg-card border-b px-6 py-4 flex items-center justify-between">
                            <h2 className="text-xl font-bold">Multi-Product Order Details</h2>
                            <button onClick={closeModal} className="p-2 hover:bg-muted rounded-full">
                                <X className="h-5 w-5" />
                            </button>
                        </div>

                        <div className="p-6 space-y-6">
                            {/* Order Info */}
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <p className="text-xs text-muted-foreground uppercase">Order ID</p>
                                    <p className="font-mono font-medium">{selectedOrder.order_id}</p>
                                </div>
                                <div>
                                    <p className="text-xs text-muted-foreground uppercase">Customer Email</p>
                                    <p className="font-medium">{selectedOrder.buyer_email || '-'}</p>
                                </div>
                                <div>
                                    <p className="text-xs text-muted-foreground uppercase">Order Date</p>
                                    <p className="font-medium">{formatDate(selectedOrder.order_date)}</p>
                                </div>
                                <div>
                                    <p className="text-xs text-muted-foreground uppercase">Total Amount</p>
                                    <p className="font-medium">
                                        {selectedOrder.total_amount ? `₹${selectedOrder.total_amount.toLocaleString()}` : '-'}
                                    </p>
                                </div>
                            </div>

                            {/* Products List */}
                            <div>
                                <h3 className="font-semibold mb-3 flex items-center gap-2">
                                    <Package className="h-4 w-4" />
                                    Products ({selectedOrder.item_count})
                                </h3>
                                <div className="space-y-3">
                                    {selectedOrder.items.map((item, i) => (
                                        <div key={i} className="p-4 bg-muted/30 rounded-lg">
                                            <div className="flex items-center gap-2 mb-2">
                                                <span className="text-xs font-medium text-muted-foreground">#{i + 1}</span>
                                                <span className="px-2 py-0.5 bg-purple-100 text-purple-700 rounded text-xs font-medium">
                                                    {item.fsn}
                                                </span>
                                                <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded text-xs">
                                                    Qty: {item.quantity}
                                                </span>
                                            </div>
                                            <p className="text-sm line-clamp-2">{item.title}</p>
                                            <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                                                <span>ASIN: {item.asin}</span>
                                                <span>Price: ₹{item.price}</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Admin Notes */}
                            <div>
                                <label className="block text-sm font-medium mb-2">
                                    Admin Notes (what was done)
                                </label>
                                <textarea
                                    value={adminNotes}
                                    onChange={(e) => setAdminNotes(e.target.value)}
                                    placeholder="Document what you did to handle this order..."
                                    className="w-full p-3 border rounded-lg bg-background min-h-[100px]"
                                />
                            </div>

                            {/* Actions */}
                            {selectedOrder.status === 'PENDING' && (
                                <div className="flex justify-end gap-3 pt-4 border-t">
                                    <button
                                        onClick={closeModal}
                                        className="px-4 py-2 border rounded-lg hover:bg-muted"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={markAsProcessed}
                                        disabled={isSaving}
                                        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 flex items-center gap-2"
                                    >
                                        {isSaving ? (
                                            <Loader2 className="h-4 w-4 animate-spin" />
                                        ) : (
                                            <CheckCircle className="h-4 w-4" />
                                        )}
                                        Mark as Processed
                                    </button>
                                </div>
                            )}

                            {selectedOrder.status === 'PROCESSED' && (
                                <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                                    <p className="text-sm text-green-800 dark:text-green-300">
                                        <strong>Processed:</strong> {formatDate(selectedOrder.processed_at)}
                                    </p>
                                    {selectedOrder.admin_notes && (
                                        <p className="text-sm mt-2">{selectedOrder.admin_notes}</p>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
