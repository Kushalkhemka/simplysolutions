import { notFound } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Package, Mail, Phone, MapPin, CreditCard, Calendar, Copy } from 'lucide-react';

interface AdminOrderPageProps {
    params: Promise<{ id: string }>;
}

export default async function AdminOrderDetailPage({ params }: AdminOrderPageProps) {
    const { id } = await params;
    const supabase = await createClient();

    // Check admin access
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) notFound();

    const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
    if (profile?.role !== 'admin') notFound();

    // Fetch order
    const { data: order, error } = await supabase
        .from('orders')
        .select(`
      *,
      items:order_items(*, product:products(name, main_image_url)),
      profile:profiles(full_name, email, phone)
    `)
        .eq('id', id)
        .single();

    if (error || !order) notFound();

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'delivered': return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400';
            case 'paid': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400';
            case 'pending': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400';
            case 'cancelled': return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400';
            default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400';
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Link href="/admin/orders">
                        <Button variant="ghost" size="icon">
                            <ArrowLeft className="h-5 w-5" />
                        </Button>
                    </Link>
                    <div>
                        <h1 className="text-2xl font-bold">Order {order.order_number}</h1>
                        <p className="text-muted-foreground">
                            <Calendar className="h-4 w-4 inline mr-1" />
                            {new Date(order.created_at).toLocaleString('en-IN')}
                        </p>
                    </div>
                </div>
                <Badge className={getStatusColor(order.status)}>{order.status}</Badge>
            </div>

            <div className="grid lg:grid-cols-3 gap-6">
                {/* Order Items */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="bg-card border rounded-lg">
                        <div className="p-4 border-b">
                            <h2 className="font-semibold">Order Items</h2>
                        </div>
                        <div className="divide-y">
                            {(order.items as any[])?.map((item: any) => (
                                <div key={item.id} className="p-4">
                                    <div className="flex gap-4">
                                        {item.product?.main_image_url && (
                                            <img
                                                src={item.product.main_image_url}
                                                alt={item.product_name}
                                                className="w-16 h-16 object-contain bg-muted rounded"
                                            />
                                        )}
                                        <div className="flex-1">
                                            <p className="font-medium">{item.product_name}</p>
                                            <p className="text-sm text-muted-foreground">SKU: {item.product_sku}</p>
                                            <p className="text-sm">Qty: {item.quantity} × ₹{item.unit_price}</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="font-medium">₹{item.total_price.toLocaleString('en-IN')}</p>
                                        </div>
                                    </div>

                                    {/* License Keys */}
                                    {item.license_keys?.length > 0 && (
                                        <div className="mt-4 bg-muted/50 rounded-lg p-3">
                                            <p className="text-sm font-medium mb-2">License Keys:</p>
                                            {item.license_keys.map((key: string, idx: number) => (
                                                <div key={idx} className="flex items-center justify-between bg-background rounded px-2 py-1 mb-1">
                                                    <code className="text-xs font-mono">{key}</code>
                                                    <Button size="sm" variant="ghost">
                                                        <Copy className="h-3 w-3" />
                                                    </Button>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Payment Details */}
                    <div className="bg-card border rounded-lg p-4 space-y-3">
                        <h2 className="font-semibold flex items-center gap-2">
                            <CreditCard className="h-4 w-4" />
                            Payment Details
                        </h2>
                        <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                                <p className="text-muted-foreground">Payment Status</p>
                                <p className="font-medium capitalize">{order.payment_status}</p>
                            </div>
                            <div>
                                <p className="text-muted-foreground">Razorpay Payment ID</p>
                                <p className="font-mono text-xs">{order.razorpay_payment_id || '-'}</p>
                            </div>
                            <div>
                                <p className="text-muted-foreground">Subtotal</p>
                                <p className="font-medium">₹{order.subtotal?.toLocaleString('en-IN')}</p>
                            </div>
                            <div>
                                <p className="text-muted-foreground">Discount</p>
                                <p className="font-medium text-green-600">-₹{order.discount_amount?.toLocaleString('en-IN') || 0}</p>
                            </div>
                            <div className="col-span-2 pt-2 border-t">
                                <p className="text-muted-foreground">Total Amount</p>
                                <p className="text-xl font-bold">₹{order.total_amount?.toLocaleString('en-IN')}</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Customer Info */}
                <div className="space-y-6">
                    <div className="bg-card border rounded-lg p-4 space-y-4">
                        <h2 className="font-semibold">Customer</h2>
                        <div className="space-y-2 text-sm">
                            <p className="flex items-center gap-2">
                                <Package className="h-4 w-4 text-muted-foreground" />
                                {order.billing_name}
                            </p>
                            <p className="flex items-center gap-2">
                                <Mail className="h-4 w-4 text-muted-foreground" />
                                {order.billing_email}
                            </p>
                            {order.billing_phone && (
                                <p className="flex items-center gap-2">
                                    <Phone className="h-4 w-4 text-muted-foreground" />
                                    {order.billing_phone}
                                </p>
                            )}
                        </div>
                    </div>

                    {order.admin_notes && (
                        <div className="bg-card border rounded-lg p-4">
                            <h2 className="font-semibold mb-2">Admin Notes</h2>
                            <p className="text-sm text-muted-foreground">{order.admin_notes}</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
