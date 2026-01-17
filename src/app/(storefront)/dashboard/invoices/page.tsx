'use client';

import { useEffect, useState } from 'react';
import { FileText, Download, Eye, Loader2, Receipt } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface Order {
    id: string;
    order_number: string;
    total_amount: number;
    status: string;
    created_at: string;
    items: { product: { name: string }; quantity: number; price: number }[];
}

export default function InvoicesPage() {
    const [orders, setOrders] = useState<Order[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        fetchOrders();
    }, []);

    const fetchOrders = async () => {
        try {
            const res = await fetch('/api/orders');
            const data = await res.json();
            if (data.success) {
                // Only show completed orders for invoices
                setOrders(data.data.filter((o: Order) => o.status === 'completed' || o.status === 'delivered'));
            }
        } catch (error) {
            console.error('Failed to fetch orders:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const downloadInvoice = (order: Order) => {
        // Generate simple invoice as text download
        const invoiceContent = `
INVOICE
=====================================
SimplySolutions
support@simplysolutions.store
=====================================

Invoice Number: INV-${order.order_number}
Date: ${new Date(order.created_at).toLocaleDateString('en-IN')}

-------------------------------------
ITEMS
-------------------------------------
${order.items?.map(item =>
            `${item.product?.name || 'Product'}\n  Qty: ${item.quantity} x ₹${item.price} = ₹${item.quantity * item.price}`
        ).join('\n\n') || 'No items'}

-------------------------------------
TOTAL: ₹${order.total_amount}
-------------------------------------

Thank you for your purchase!
        `.trim();

        const blob = new Blob([invoiceContent], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `invoice-${order.order_number}.txt`;
        a.click();
        URL.revokeObjectURL(url);
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center py-16">
                <Loader2 className="h-8 w-8 animate-spin" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold">Invoices</h1>
                <p className="text-muted-foreground">Download invoices for your completed orders</p>
            </div>

            {orders.length === 0 ? (
                <div className="text-center py-16 border rounded-lg bg-card">
                    <Receipt className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <h3 className="font-semibold mb-2">No Invoices Yet</h3>
                    <p className="text-muted-foreground">
                        Invoices will appear here after you complete an order.
                    </p>
                </div>
            ) : (
                <div className="space-y-4">
                    {orders.map(order => (
                        <div
                            key={order.id}
                            className="border rounded-lg p-4 bg-card hover:border-primary/50 transition-colors"
                        >
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                <div className="flex items-start gap-4">
                                    <div className="p-3 bg-primary/10 rounded-lg">
                                        <FileText className="h-6 w-6 text-primary" />
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-2 mb-1">
                                            <h3 className="font-semibold">INV-{order.order_number}</h3>
                                            <Badge variant="secondary" className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
                                                Paid
                                            </Badge>
                                        </div>
                                        <p className="text-sm text-muted-foreground">
                                            {new Date(order.created_at).toLocaleDateString('en-IN', {
                                                year: 'numeric',
                                                month: 'long',
                                                day: 'numeric',
                                            })}
                                        </p>
                                        <p className="text-sm font-medium mt-1">₹{order.total_amount}</p>
                                    </div>
                                </div>
                                <div className="flex gap-2 sm:ml-auto">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => window.open(`/dashboard/orders/${order.id}`, '_blank')}
                                        className="gap-2"
                                    >
                                        <Eye className="h-4 w-4" />
                                        View
                                    </Button>
                                    <Button
                                        size="sm"
                                        onClick={() => downloadInvoice(order)}
                                        className="gap-2"
                                    >
                                        <Download className="h-4 w-4" />
                                        Download
                                    </Button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
