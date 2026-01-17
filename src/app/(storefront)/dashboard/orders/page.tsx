import Link from 'next/link';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { Package, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default async function OrdersPage() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        redirect('/login');
    }

    const { data: orders } = await supabase
        .from('orders')
        .select(`
      id,
      order_number,
      status,
      payment_status,
      total_amount,
      created_at,
      items:order_items(id, product_name, product_image, quantity)
    `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'delivered': return 'bg-green-100 text-green-800';
            case 'paid': return 'bg-blue-100 text-blue-800';
            case 'processing': return 'bg-yellow-100 text-yellow-800';
            case 'cancelled': return 'bg-red-100 text-red-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    return (
        <div className="container-dense py-8">
            <h1 className="text-2xl md:text-3xl font-bold mb-8">My Orders</h1>

            {orders && orders.length > 0 ? (
                <div className="space-y-4">
                    {orders.map((order) => (
                        <Link key={order.id} href={`/dashboard/orders/${order.id}`}>
                            <div className="border rounded-lg p-6 hover:border-primary transition-colors">
                                <div className="flex flex-wrap items-start justify-between gap-4 mb-4">
                                    <div>
                                        <p className="font-semibold text-lg">{order.order_number}</p>
                                        <p className="text-sm text-muted-foreground">
                                            {new Date(order.created_at).toLocaleDateString('en-IN', {
                                                day: 'numeric',
                                                month: 'long',
                                                year: 'numeric',
                                            })}
                                        </p>
                                    </div>
                                    <div className="text-right">
                                        <p className="font-bold text-lg">₹{order.total_amount.toLocaleString('en-IN')}</p>
                                        <span className={`text-xs px-2 py-1 rounded ${getStatusColor(order.status)}`}>
                                            {order.status.replace('_', ' ')}
                                        </span>
                                    </div>
                                </div>

                                <div className="flex items-center justify-between">
                                    <p className="text-sm text-muted-foreground">
                                        {order.items?.length || 0} item(s)
                                    </p>
                                    <span className="text-sm text-primary flex items-center gap-1">
                                        View Details <ArrowRight className="h-4 w-4" />
                                    </span>
                                </div>
                            </div>
                        </Link>
                    ))}
                </div>
            ) : (
                <div className="text-center py-16">
                    <Package className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                    <h2 className="text-xl font-semibold mb-2">No orders yet</h2>
                    <p className="text-muted-foreground mb-6">When you make a purchase, your orders will appear here.</p>
                    <Link href="/products">
                        <Button>Browse Products</Button>
                    </Link>
                </div>
            )}
        </div>
    );
}
