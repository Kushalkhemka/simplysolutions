import Link from 'next/link';
import Image from 'next/image';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { Package, ArrowRight, Key, Download } from 'lucide-react';
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
      items:order_items(id, product_name, product_image, quantity, license_keys)
    `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

    const getStatusColor = (status: string, paymentStatus: string) => {
        if (paymentStatus !== 'completed') return 'bg-orange-100 text-orange-800';
        switch (status) {
            case 'delivered': return 'bg-green-100 text-green-800';
            case 'paid': return 'bg-blue-100 text-blue-800';
            case 'processing': return 'bg-yellow-100 text-yellow-800';
            case 'cancelled': return 'bg-red-100 text-red-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    const getStatusText = (status: string, paymentStatus: string) => {
        if (paymentStatus !== 'completed') return 'Payment Pending';
        return status.replace('_', ' ');
    };

    const hasLicenseKeys = (items: any[]) => {
        return items?.some((item: any) => item.license_keys && item.license_keys.length > 0);
    };

    return (
        <div className="container-dense py-8">
            <h1 className="text-2xl md:text-3xl font-bold mb-8">My Orders</h1>

            {orders && orders.length > 0 ? (
                <div className="space-y-4">
                    {orders.map((order) => (
                        <div key={order.id} className="border rounded-lg p-6 hover:border-primary hover:shadow-md transition-all bg-white dark:bg-card">
                            <Link href={`/dashboard/orders/${order.id}`}>
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
                                        <span className={`text-xs px-2 py-1 rounded capitalize ${getStatusColor(order.status, order.payment_status)}`}>
                                            {getStatusText(order.status, order.payment_status)}
                                        </span>
                                    </div>
                                </div>

                                {/* Product Thumbnails */}
                                <div className="flex items-center gap-3 mb-4 py-3 border-t border-b border-gray-100">
                                    <div className="flex -space-x-2">
                                        {order.items?.slice(0, 4).map((item: { id: string; product_name: string; product_image: string; quantity: number; license_keys: string[] }, index: number) => (
                                            <div
                                                key={item.id}
                                                className="relative w-12 h-12 rounded-lg border-2 border-white bg-gray-50 shadow-sm overflow-hidden"
                                                style={{ zIndex: 4 - index }}
                                            >
                                                {item.product_image ? (
                                                    <Image
                                                        src={item.product_image}
                                                        alt={item.product_name}
                                                        fill
                                                        className="object-contain p-1"
                                                        sizes="48px"
                                                    />
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center">
                                                        <Package className="w-5 h-5 text-gray-400" />
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                        {order.items && order.items.length > 4 && (
                                            <div
                                                className="relative w-12 h-12 rounded-lg border-2 border-white bg-gradient-to-br from-orange-500 to-orange-600 shadow-sm flex items-center justify-center"
                                                style={{ zIndex: 0 }}
                                            >
                                                <span className="text-white text-xs font-bold">+{order.items.length - 4}</span>
                                            </div>
                                        )}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="space-y-1">
                                            {order.items?.map((item: { id: string; product_name: string; product_image: string; quantity: number; license_keys: string[] }) => (
                                                <p key={item.id} className="text-sm text-gray-700 dark:text-gray-200">
                                                    • {item.product_name} {item.quantity > 1 && <span className="text-gray-500 dark:text-gray-400">×{item.quantity}</span>}
                                                </p>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </Link>

                            <div className="flex items-center justify-between">
                                <p className="text-sm text-muted-foreground">
                                    {order.items?.length || 0} item(s)
                                </p>
                                <div className="flex items-center gap-3">
                                    {hasLicenseKeys(order.items as any[]) && (
                                        <Link href={`/dashboard/orders/${order.id}`}>
                                            <Button size="sm" variant="outline" className="gap-2 text-green-600 border-green-200 hover:bg-green-50">
                                                <Key className="h-4 w-4" />
                                                View License Keys
                                            </Button>
                                        </Link>
                                    )}
                                    <Link href={`/dashboard/orders/${order.id}`} className="text-sm text-primary flex items-center gap-1 font-medium hover:underline">
                                        View Details <ArrowRight className="h-4 w-4" />
                                    </Link>
                                </div>
                            </div>
                        </div>
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
