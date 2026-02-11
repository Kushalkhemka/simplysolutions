'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Eye, CheckCircle, XCircle, Download, Loader2, Calendar, Filter, Trash2, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';

interface OrderItem {
    secret_codes: string[] | null;
}

interface Order {
    id: string;
    order_number: string;
    billing_name: string;
    billing_email: string;
    billing_phone: string;
    billing_address: string;
    billing_city: string;
    billing_state: string;
    billing_pincode: string;
    status: string;
    payment_status: string;
    total_amount: number;
    created_at: string;
    order_items?: OrderItem[];
    profile?: { full_name: string; email: string } | null;
    // Computed field for display
    _allSecretCodes?: string[];
}

export default function OrdersClient() {
    const [orders, setOrders] = useState<Order[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isExporting, setIsExporting] = useState(false);
    const [dateFrom, setDateFrom] = useState('');
    const [dateTo, setDateTo] = useState('');
    const [showExportModal, setShowExportModal] = useState(false);
    const [statusFilter, setStatusFilter] = useState<string>('all');
    const [deleteOrderId, setDeleteOrderId] = useState<string | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    const supabase = createClient();

    useEffect(() => {
        fetchOrders();
    }, []);

    const fetchOrders = async () => {
        setIsLoading(true);
        const { data, error } = await supabase
            .from('orders')
            .select(`
                *,
                profile:profiles(full_name, email),
                order_items(secret_codes)
            `)
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Error fetching orders:', error);
            toast.error('Failed to load orders');
        } else {
            // Flatten secret codes from all order items into each order
            const processedOrders = (data || []).map(order => {
                const allCodes: string[] = [];
                if (order.order_items) {
                    for (const item of order.order_items as OrderItem[]) {
                        if (item.secret_codes && item.secret_codes.length > 0) {
                            allCodes.push(...item.secret_codes);
                        }
                    }
                }
                return { ...order, _allSecretCodes: allCodes };
            });
            setOrders(processedOrders);
        }
        setIsLoading(false);
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'delivered': return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400';
            case 'paid': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400';
            case 'pending': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400';
            case 'cancelled': return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400';
            default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400';
        }
    };

    const getPaymentStatusColor = (status: string) => {
        switch (status) {
            case 'completed': return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400';
            case 'pending': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400';
            case 'failed': return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400';
            default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400';
        }
    };

    // Filter orders based on status filter
    const filteredOrders = orders.filter(order => {
        if (statusFilter === 'all') return true;
        if (statusFilter === 'pending') return order.status === 'pending';
        if (statusFilter === 'payment_pending') return order.payment_status === 'pending';
        if (statusFilter === 'delivered') return order.status === 'delivered';
        return true;
    });

    const deleteOrder = async () => {
        if (!deleteOrderId) return;

        setIsDeleting(true);
        try {
            const response = await fetch(`/api/admin/orders/${deleteOrderId}`, {
                method: 'DELETE',
            });

            if (response.ok) {
                setOrders(orders.filter(o => o.id !== deleteOrderId));
                toast.success('Order deleted successfully');
            } else {
                const data = await response.json();
                toast.error(data.error || 'Failed to delete order');
            }
        } catch (error) {
            console.error('Delete error:', error);
            toast.error('Failed to delete order');
        } finally {
            setIsDeleting(false);
            setDeleteOrderId(null);
        }
    };

    const exportToCSV = async () => {
        setIsExporting(true);

        try {
            // Filter orders by date range if provided
            let filteredOrders = orders;
            if (dateFrom) {
                filteredOrders = filteredOrders.filter(o => new Date(o.created_at) >= new Date(dateFrom));
            }
            if (dateTo) {
                const toDate = new Date(dateTo);
                toDate.setHours(23, 59, 59);
                filteredOrders = filteredOrders.filter(o => new Date(o.created_at) <= toDate);
            }

            if (filteredOrders.length === 0) {
                toast.error('No orders found for the selected date range');
                setIsExporting(false);
                return;
            }

            // Build CSV content
            const headers = [
                'Order Number',
                'Customer Name',
                'Email',
                'Phone',
                'Address',
                'City',
                'State',
                'Pincode',
                'Status',
                'Payment Status',
                'Amount (₹)',
                'Date'
            ];

            const rows = filteredOrders.map(order => [
                order.order_number,
                order.billing_name || '',
                order.billing_email || '',
                order.billing_phone || '',
                `"${(order.billing_address || '').replace(/"/g, '""')}"`,
                order.billing_city || '',
                order.billing_state || '',
                order.billing_pincode || '',
                order.status,
                order.payment_status,
                order.total_amount?.toString() || '0',
                new Date(order.created_at).toLocaleDateString('en-IN')
            ]);

            const csvContent = [
                headers.join(','),
                ...rows.map(row => row.join(','))
            ].join('\n');

            // Download the file
            const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
            const link = document.createElement('a');
            const url = URL.createObjectURL(blob);
            link.setAttribute('href', url);

            const filename = dateFrom || dateTo
                ? `orders_${dateFrom || 'all'}_to_${dateTo || 'now'}.csv`
                : `orders_export_${new Date().toISOString().split('T')[0]}.csv`;

            link.setAttribute('download', filename);
            link.style.visibility = 'hidden';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);

            toast.success(`Exported ${filteredOrders.length} orders`);
            setShowExportModal(false);
        } catch (err) {
            console.error('Export error:', err);
            toast.error('Failed to export orders');
        } finally {
            setIsExporting(false);
        }
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center p-8">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold">Orders</h1>
                    <p className="text-muted-foreground">Manage customer orders ({orders.length} total)</p>
                </div>
                <Button
                    variant="outline"
                    className="gap-2"
                    onClick={() => setShowExportModal(true)}
                >
                    <Download className="h-4 w-4" />
                    <span className="hidden sm:inline">Export to Excel</span>
                    <span className="sm:hidden">Export</span>
                </Button>
            </div>

            {/* Status Filters */}
            <div className="flex flex-wrap gap-2">
                <Button
                    variant={statusFilter === 'all' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setStatusFilter('all')}
                    className="gap-1"
                >
                    <Filter className="h-3 w-3" />
                    All ({orders.length})
                </Button>
                <Button
                    variant={statusFilter === 'pending' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setStatusFilter('pending')}
                    className="gap-1"
                >
                    Pending ({orders.filter(o => o.status === 'pending').length})
                </Button>
                <Button
                    variant={statusFilter === 'payment_pending' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setStatusFilter('payment_pending')}
                    className="gap-1"
                >
                    Payment Pending ({orders.filter(o => o.payment_status === 'pending').length})
                </Button>
                <Button
                    variant={statusFilter === 'delivered' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setStatusFilter('delivered')}
                    className="gap-1"
                >
                    Delivered ({orders.filter(o => o.status === 'delivered').length})
                </Button>
            </div>

            {/* Orders - Mobile Cards View */}
            <div className="lg:hidden space-y-3">
                {filteredOrders.map((order) => (
                    <div key={order.id} className="bg-card border rounded-lg p-4">
                        <div className="flex items-start justify-between gap-3">
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 flex-wrap">
                                    <span className="font-semibold text-sm">{order.order_number}</span>
                                    <span className={`text-xs px-2 py-0.5 rounded ${getStatusColor(order.status)}`}>
                                        {order.status}
                                    </span>
                                    {order.payment_status === 'completed' ? (
                                        <CheckCircle className="h-4 w-4 text-green-500" />
                                    ) : (
                                        <XCircle className="h-4 w-4 text-red-500" />
                                    )}
                                </div>
                                <p className="text-lg font-bold mt-1">₹{order.total_amount?.toLocaleString('en-IN')}</p>
                                <p className="text-sm text-muted-foreground truncate">{order.billing_name}</p>
                                {order._allSecretCodes && order._allSecretCodes.length > 0 && (
                                    <p className="text-xs font-mono text-emerald-700 dark:text-emerald-300 mt-0.5">
                                        🔑 {order._allSecretCodes.join(', ')}
                                    </p>
                                )}
                                <p className="text-xs text-muted-foreground">
                                    {new Date(order.created_at).toLocaleDateString('en-IN', {
                                        day: 'numeric',
                                        month: 'short',
                                        year: 'numeric',
                                    })}
                                </p>
                            </div>
                            <div className="flex gap-2">
                                <Link href={`/admin/orders/${order.id}`}>
                                    <Button size="sm" variant="outline" className="shrink-0">
                                        <Eye className="h-4 w-4" />
                                    </Button>
                                </Link>
                                {order.payment_status === 'pending' && (
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        className="shrink-0 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
                                        onClick={() => setDeleteOrderId(order.id)}
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                )}
                            </div>
                        </div>
                    </div>
                ))}
                {filteredOrders.length === 0 && (
                    <div className="p-8 text-center text-muted-foreground bg-card border rounded-lg">
                        {orders.length === 0 ? 'No orders yet.' : 'No orders match the selected filter.'}
                    </div>
                )}
            </div>

            {/* Orders Table - Desktop View */}
            <div className="hidden lg:block bg-card border rounded-lg overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead className="bg-muted/50 border-b">
                            <tr>
                                <th className="text-left p-4 font-medium">Order</th>
                                <th className="text-left p-4 font-medium">Customer</th>
                                <th className="text-left p-4 font-medium">Date</th>
                                <th className="text-center p-4 font-medium">Status</th>
                                <th className="text-center p-4 font-medium">Payment</th>
                                <th className="text-left p-4 font-medium">Secret Code</th>
                                <th className="text-right p-4 font-medium">Amount</th>
                                <th className="text-right p-4 font-medium">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y">
                            {filteredOrders.map((order) => (
                                <tr key={order.id} className="hover:bg-muted/30">
                                    <td className="p-4 font-medium">{order.order_number}</td>
                                    <td className="p-4">
                                        <div>
                                            <p className="truncate max-w-[150px]">{order.billing_name}</p>
                                            <p className="text-xs text-muted-foreground truncate max-w-[150px]">{order.billing_email}</p>
                                        </div>
                                    </td>
                                    <td className="p-4 text-muted-foreground">
                                        {new Date(order.created_at).toLocaleDateString('en-IN', {
                                            day: 'numeric',
                                            month: 'short',
                                            year: 'numeric',
                                        })}
                                    </td>
                                    <td className="p-4 text-center">
                                        <span className={`text-xs px-2 py-1 rounded ${getStatusColor(order.status)}`}>
                                            {order.status}
                                        </span>
                                    </td>
                                    <td className="p-4 text-center">
                                        {order.payment_status === 'completed' ? (
                                            <CheckCircle className="h-5 w-5 text-green-500 mx-auto" />
                                        ) : (
                                            <XCircle className="h-5 w-5 text-red-500 mx-auto" />
                                        )}
                                    </td>
                                    <td className="p-4">
                                        {order._allSecretCodes && order._allSecretCodes.length > 0 ? (
                                            <span className="font-mono text-xs text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-900/30 px-2 py-1 rounded">
                                                {order._allSecretCodes.join(', ')}
                                            </span>
                                        ) : (
                                            <span className="text-xs text-muted-foreground">—</span>
                                        )}
                                    </td>
                                    <td className="p-4 text-right font-medium">
                                        ₹{order.total_amount?.toLocaleString('en-IN')}
                                    </td>
                                    <td className="p-4 text-right">
                                        <div className="flex items-center justify-end gap-2">
                                            <Link href={`/admin/orders/${order.id}`}>
                                                <Button size="sm" variant="outline" className="gap-1">
                                                    <Eye className="h-4 w-4" />
                                                    View
                                                </Button>
                                            </Link>
                                            {order.payment_status === 'pending' && (
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
                                                    onClick={() => setDeleteOrderId(order.id)}
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {filteredOrders.length === 0 && (
                    <div className="p-8 text-center text-muted-foreground">
                        {orders.length === 0 ? 'No orders yet.' : 'No orders match the selected filter.'}
                    </div>
                )}
            </div>

            {/* Export Modal */}
            {showExportModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/50" onClick={() => !isExporting && setShowExportModal(false)} />
                    <div className="relative bg-card border rounded-xl shadow-xl w-full max-w-md">
                        <div className="px-6 py-4 border-b">
                            <h2 className="text-lg font-bold">Export Orders</h2>
                            <p className="text-sm text-muted-foreground">Download orders as CSV file</p>
                        </div>

                        <div className="p-6 space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium mb-2">From Date</label>
                                    <div className="relative">
                                        <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                        <input
                                            type="date"
                                            value={dateFrom}
                                            onChange={(e) => setDateFrom(e.target.value)}
                                            className="w-full pl-10 pr-3 py-2 border rounded-lg bg-background text-sm"
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-2">To Date</label>
                                    <div className="relative">
                                        <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                        <input
                                            type="date"
                                            value={dateTo}
                                            onChange={(e) => setDateTo(e.target.value)}
                                            className="w-full pl-10 pr-3 py-2 border rounded-lg bg-background text-sm"
                                        />
                                    </div>
                                </div>
                            </div>

                            <p className="text-xs text-muted-foreground">
                                Leave dates empty to export all orders. Total orders: {orders.length}
                            </p>

                            <div className="flex gap-3 pt-2">
                                <Button
                                    variant="outline"
                                    className="flex-1"
                                    onClick={() => setShowExportModal(false)}
                                    disabled={isExporting}
                                >
                                    Cancel
                                </Button>
                                <Button
                                    className="flex-1 gap-2"
                                    onClick={exportToCSV}
                                    disabled={isExporting}
                                >
                                    {isExporting ? (
                                        <>
                                            <Loader2 className="h-4 w-4 animate-spin" />
                                            Exporting...
                                        </>
                                    ) : (
                                        <>
                                            <Download className="h-4 w-4" />
                                            Export CSV
                                        </>
                                    )}
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Delete Confirmation Modal */}
            {deleteOrderId && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/50" onClick={() => !isDeleting && setDeleteOrderId(null)} />
                    <div className="relative bg-card border rounded-xl shadow-xl w-full max-w-sm">
                        <div className="p-6 text-center">
                            <div className="mx-auto w-12 h-12 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center mb-4">
                                <AlertTriangle className="h-6 w-6 text-red-600 dark:text-red-400" />
                            </div>
                            <h2 className="text-lg font-bold mb-2">Delete Order?</h2>
                            <p className="text-sm text-muted-foreground mb-6">
                                This will permanently delete the order and all associated items. This action cannot be undone.
                            </p>
                            <div className="flex gap-3">
                                <Button
                                    variant="outline"
                                    className="flex-1"
                                    onClick={() => setDeleteOrderId(null)}
                                    disabled={isDeleting}
                                >
                                    Cancel
                                </Button>
                                <Button
                                    variant="destructive"
                                    className="flex-1 gap-2"
                                    onClick={deleteOrder}
                                    disabled={isDeleting}
                                >
                                    {isDeleting ? (
                                        <>
                                            <Loader2 className="h-4 w-4 animate-spin" />
                                            Deleting...
                                        </>
                                    ) : (
                                        <>
                                            <Trash2 className="h-4 w-4" />
                                            Delete
                                        </>
                                    )}
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
