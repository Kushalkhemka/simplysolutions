'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Eye, CheckCircle, XCircle, Download, Loader2, Calendar } from 'lucide-react';
import { toast } from 'sonner';

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
    profile?: { full_name: string; email: string } | null;
}

export default function OrdersClient() {
    const [orders, setOrders] = useState<Order[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isExporting, setIsExporting] = useState(false);
    const [dateFrom, setDateFrom] = useState('');
    const [dateTo, setDateTo] = useState('');
    const [showExportModal, setShowExportModal] = useState(false);

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
                profile:profiles(full_name, email)
            `)
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Error fetching orders:', error);
            toast.error('Failed to load orders');
        } else {
            setOrders(data || []);
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

            {/* Orders Table */}
            <div className="bg-card border rounded-lg overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead className="bg-muted/50 border-b">
                            <tr>
                                <th className="text-left p-4 font-medium">Order</th>
                                <th className="text-left p-4 font-medium hidden sm:table-cell">Customer</th>
                                <th className="text-left p-4 font-medium hidden md:table-cell">Date</th>
                                <th className="text-center p-4 font-medium">Status</th>
                                <th className="text-center p-4 font-medium hidden sm:table-cell">Payment</th>
                                <th className="text-right p-4 font-medium">Amount</th>
                                <th className="text-right p-4 font-medium">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y">
                            {orders.map((order) => (
                                <tr key={order.id} className="hover:bg-muted/30">
                                    <td className="p-4 font-medium">{order.order_number}</td>
                                    <td className="p-4 hidden sm:table-cell">
                                        <div>
                                            <p className="truncate max-w-[150px]">{order.billing_name}</p>
                                            <p className="text-xs text-muted-foreground truncate max-w-[150px]">{order.billing_email}</p>
                                        </div>
                                    </td>
                                    <td className="p-4 text-muted-foreground hidden md:table-cell">
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
                                    <td className="p-4 text-center hidden sm:table-cell">
                                        {order.payment_status === 'completed' ? (
                                            <CheckCircle className="h-5 w-5 text-green-500 mx-auto" />
                                        ) : (
                                            <XCircle className="h-5 w-5 text-red-500 mx-auto" />
                                        )}
                                    </td>
                                    <td className="p-4 text-right font-medium">
                                        ₹{order.total_amount?.toLocaleString('en-IN')}
                                    </td>
                                    <td className="p-4 text-right">
                                        <Link href={`/admin/orders/${order.id}`}>
                                            <Button size="sm" variant="outline" className="gap-1">
                                                <Eye className="h-4 w-4" />
                                                <span className="hidden sm:inline">View</span>
                                            </Button>
                                        </Link>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {orders.length === 0 && (
                    <div className="p-8 text-center text-muted-foreground">
                        No orders yet.
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
        </div>
    );
}
