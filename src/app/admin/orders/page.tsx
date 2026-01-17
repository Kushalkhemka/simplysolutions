import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Eye, CheckCircle, XCircle } from 'lucide-react';

export default async function AdminOrdersPage() {
    const supabase = await createClient();

    const { data: orders } = await supabase
        .from('orders')
        .select(`
      *,
      profile:profiles(full_name, email)
    `)
        .order('created_at', { ascending: false });

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'delivered': return 'bg-green-100 text-green-800';
            case 'paid': return 'bg-blue-100 text-blue-800';
            case 'pending': return 'bg-yellow-100 text-yellow-800';
            case 'cancelled': return 'bg-red-100 text-red-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold">Orders</h1>
                <p className="text-muted-foreground">Manage customer orders</p>
            </div>

            {/* Orders Table */}
            <div className="bg-card border rounded-lg overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead className="bg-muted/50 border-b">
                            <tr>
                                <th className="text-left p-4 font-medium">Order</th>
                                <th className="text-left p-4 font-medium">Customer</th>
                                <th className="text-left p-4 font-medium">Date</th>
                                <th className="text-center p-4 font-medium">Status</th>
                                <th className="text-center p-4 font-medium">Payment</th>
                                <th className="text-right p-4 font-medium">Amount</th>
                                <th className="text-right p-4 font-medium">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y">
                            {orders?.map((order: any) => (
                                <tr key={order.id} className="hover:bg-muted/30">
                                    <td className="p-4 font-medium">{order.order_number}</td>
                                    <td className="p-4">
                                        <div>
                                            <p>{order.billing_name}</p>
                                            <p className="text-xs text-muted-foreground">{order.billing_email}</p>
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
                                    <td className="p-4 text-right font-medium">
                                        ₹{order.total_amount?.toLocaleString('en-IN')}
                                    </td>
                                    <td className="p-4 text-right">
                                        <Link href={`/admin/orders/${order.id}`}>
                                            <Button size="sm" variant="outline" className="gap-1">
                                                <Eye className="h-4 w-4" />
                                                View
                                            </Button>
                                        </Link>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {(!orders || orders.length === 0) && (
                    <div className="p-8 text-center text-muted-foreground">
                        No orders yet.
                    </div>
                )}
            </div>
        </div>
    );
}
