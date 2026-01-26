import { notFound, redirect } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { createClient } from '@/lib/supabase/server';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Check, Download, Mail, Package } from 'lucide-react';
import { CopyButton } from '@/components/ui/copy-button';

interface OrderDetailPageProps {
    params: Promise<{ id: string }>;
}

export default async function OrderDetailPage({ params }: OrderDetailPageProps) {
    const { id } = await params;
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        redirect('/login');
    }

    const { data: order, error } = await supabase
        .from('orders')
        .select(`
      *,
      items:order_items(
        id,
        product_id,
        product_name,
        product_sku,
        product_image,
        quantity,
        unit_price,
        total_price,
        license_keys,
        secret_codes,
        product_fsn,
        status
      )
    `)
        .eq('id', id)
        .eq('user_id', user.id)
        .single();

    if (error || !order) {
        notFound();
    }

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
        <div className="container mx-auto px-4 py-8">
            {/* Back button */}
            <Link href="/dashboard/orders" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6">
                <ArrowLeft className="h-4 w-4" />
                Back to Orders
            </Link>

            {/* Order Header */}
            <div className="flex flex-wrap items-start justify-between gap-4 mb-8">
                <div>
                    <h1 className="text-2xl md:text-3xl font-bold">{order.order_number}</h1>
                    <p className="text-muted-foreground">
                        Placed on {new Date(order.created_at).toLocaleDateString('en-IN', {
                            day: 'numeric',
                            month: 'long',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                        })}
                    </p>
                </div>
                <Badge className={getStatusColor(order.status)}>
                    {order.status.replace('_', ' ').toUpperCase()}
                </Badge>
            </div>

            <div className="grid lg:grid-cols-3 gap-8">
                {/* Order Items with License Keys */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="border rounded-lg">
                        <div className="p-4 border-b bg-muted/30">
                            <h2 className="font-semibold flex items-center gap-2">
                                <Package className="h-5 w-5" />
                                Order Items
                            </h2>
                        </div>

                        <div className="divide-y">
                            {(order.items as any[])?.map((item: any) => (
                                <div key={item.id} className="p-4">
                                    <div className="flex gap-4 mb-4">
                                        {/* Product Image */}
                                        <div className="relative w-20 h-20 bg-muted rounded flex-shrink-0">
                                            {item.product_image && (
                                                <Image
                                                    src={item.product_image}
                                                    alt={item.product_name}
                                                    fill
                                                    className="object-contain p-2"
                                                />
                                            )}
                                        </div>

                                        {/* Product Details */}
                                        <div className="flex-1">
                                            <h3 className="font-medium">{item.product_name}</h3>
                                            <p className="text-sm text-muted-foreground">SKU: {item.product_sku}</p>
                                            <div className="flex items-center gap-4 mt-1 text-sm">
                                                <span>Qty: {item.quantity}</span>
                                                <span>₹{item.unit_price?.toLocaleString('en-IN')} each</span>
                                            </div>
                                        </div>

                                        {/* Price */}
                                        <div className="text-right">
                                            <p className="font-bold">₹{item.total_price?.toLocaleString('en-IN')}</p>
                                            <Badge
                                                variant="outline"
                                                className={`mt-1 ${(item.license_keys?.length > 0 || item.secret_codes?.length > 0)
                                                    ? 'bg-green-100 text-green-700 border-green-200 dark:bg-orange-500/10 dark:text-orange-500 dark:border-orange-500/30'
                                                    : order.payment_status === 'completed'
                                                        ? 'bg-yellow-100 text-yellow-700 border-yellow-200 dark:bg-yellow-500/10 dark:text-yellow-500 dark:border-yellow-500/30'
                                                        : 'bg-gray-100 text-gray-600 border-gray-200 dark:bg-gray-500/10 dark:text-gray-400 dark:border-gray-500/30'
                                                    }`}
                                            >
                                                {(item.license_keys?.length > 0 || item.secret_codes?.length > 0)
                                                    ? 'Delivered'
                                                    : order.payment_status === 'completed'
                                                        ? 'Awaiting Fulfillment'
                                                        : 'Payment Pending'}
                                            </Badge>
                                        </div>
                                    </div>

                                    {/* License Keys */}
                                    {item.license_keys && item.license_keys.length > 0 && (
                                        <div className="bg-green-50 dark:bg-gray-900/50 border border-green-200 dark:border-gray-700 rounded-lg p-4 mt-4">
                                            <h4 className="font-medium text-green-700 dark:text-orange-500 mb-3 flex items-center gap-2">
                                                <Check className="h-4 w-4" />
                                                License Key(s)
                                            </h4>
                                            <div className="space-y-2">
                                                {item.license_keys.map((key: string, idx: number) => (
                                                    <div key={idx} className="flex items-center gap-2 bg-white dark:bg-gray-800 rounded-lg p-3 border border-green-100 dark:border-gray-700">
                                                        <code className="flex-1 font-mono text-sm break-all text-gray-800 dark:text-gray-100">{key}</code>
                                                        <CopyButton text={key} className="flex-shrink-0 text-gray-500 hover:text-green-600 dark:text-gray-400 dark:hover:text-orange-500" />
                                                    </div>
                                                ))}
                                            </div>
                                            <p className="text-xs text-green-700 dark:text-gray-400 mt-3">
                                                💡 Tip: Copy and save your license keys in a safe place
                                            </p>
                                        </div>
                                    )}

                                    {/* Secret Codes with Activate Buttons */}
                                    {item.secret_codes && item.secret_codes.length > 0 && (
                                        <div className="bg-gradient-to-br from-orange-50 to-amber-50 dark:from-[#0a0a0a] dark:to-[#0a0a0a] border border-orange-200 dark:border-orange-700/40 rounded-lg p-4 mt-4 shadow-sm">
                                            <h4 className="font-semibold text-orange-800 dark:text-orange-400 mb-2 flex items-center gap-2">
                                                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                                                </svg>
                                                Activation Code{item.secret_codes.length > 1 ? 's' : ''} ({item.secret_codes.length})
                                            </h4>
                                            <p className="text-sm text-orange-700 dark:text-orange-300/80 mb-3">
                                                Use these codes on our activation page to get your license keys.
                                            </p>
                                            <div className="space-y-2">
                                                {item.secret_codes.map((code: string, idx: number) => (
                                                    <div key={idx} className="bg-white dark:bg-[#121212] rounded-lg p-3 border border-orange-200 dark:border-orange-800/50 shadow-sm">
                                                        <div className="flex items-center gap-2 mb-2">
                                                            <span className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">Code {idx + 1}</span>
                                                            <code className="flex-1 font-mono text-sm sm:text-base font-bold tracking-wider text-gray-900 dark:text-white bg-gray-100 dark:bg-[#1a1a1a] px-2 py-1 rounded">{code}</code>
                                                            <CopyButton text={code} className="flex-shrink-0 text-gray-500 hover:text-orange-600 dark:text-gray-400 dark:hover:text-orange-400" />
                                                        </div>
                                                        <Link href={`/activate?code=${code}`}>
                                                            <Button size="sm" className="w-full bg-orange-600 hover:bg-orange-700 dark:bg-orange-600 dark:hover:bg-orange-500 text-white font-medium shadow-sm">
                                                                Activate Now
                                                            </Button>
                                                        </Link>
                                                    </div>
                                                ))}
                                            </div>
                                            <p className="text-xs text-orange-600 dark:text-orange-400/70 mt-3 flex items-center gap-1">
                                                <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 20 20">
                                                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                                                </svg>
                                                Each code can only be used once. Click &quot;Activate Now&quot; to redeem your license.
                                            </p>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Need Help */}
                    <div className="border rounded-lg p-6">
                        <h3 className="font-semibold mb-2">Need Help?</h3>
                        <p className="text-sm text-muted-foreground mb-4">
                            If you have any issues with your license keys or need installation help, contact our support team.
                        </p>
                        <Button variant="outline" className="gap-2">
                            <Mail className="h-4 w-4" />
                            Contact Support
                        </Button>
                    </div>
                </div>

                {/* Order Summary */}
                <div className="lg:col-span-1">
                    <div className="sticky top-24 space-y-6">
                        {/* Payment Summary */}
                        <div className="border rounded-lg p-6">
                            <h3 className="font-semibold mb-4">Payment Summary</h3>
                            <div className="space-y-2 text-sm">
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">Subtotal</span>
                                    <span>₹{order.subtotal?.toLocaleString('en-IN')}</span>
                                </div>
                                {order.discount_amount > 0 && (
                                    <div className="flex justify-between text-green-600">
                                        <span>Discount</span>
                                        <span>-₹{order.discount_amount?.toLocaleString('en-IN')}</span>
                                    </div>
                                )}
                                {order.coupon_discount > 0 && (
                                    <div className="flex justify-between text-green-600">
                                        <span>Coupon ({order.coupon_code})</span>
                                        <span>-₹{order.coupon_discount?.toLocaleString('en-IN')}</span>
                                    </div>
                                )}
                                <div className="border-t pt-2 mt-2">
                                    <div className="flex justify-between font-bold text-lg">
                                        <span>Total</span>
                                        <span>₹{order.total_amount?.toLocaleString('en-IN')}</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Billing Details */}
                        <div className="border rounded-lg p-6">
                            <h3 className="font-semibold mb-4">Billing Details</h3>
                            <div className="space-y-2 text-sm">
                                <p><strong>Name:</strong> {order.billing_name}</p>
                                <p><strong>Email:</strong> {order.billing_email}</p>
                                {order.billing_phone && (
                                    <p><strong>Phone:</strong> {order.billing_phone}</p>
                                )}
                                {order.billing_address && (
                                    <div className="pt-2 mt-2 border-t">
                                        <p className="font-medium mb-1">Address:</p>
                                        <p className="text-muted-foreground">
                                            {order.billing_address.line1}
                                            {order.billing_address.line2 && <><br />{order.billing_address.line2}</>}
                                            <br />
                                            {order.billing_address.city}, {order.billing_address.state} {order.billing_address.postalCode}
                                        </p>
                                    </div>
                                )}
                                {order.billing_gstn && (
                                    <div className="pt-2 mt-2 border-t">
                                        <p><strong>GSTN:</strong> {order.billing_gstn}</p>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Payment Info */}
                        {order.razorpay_payment_id && (
                            <div className="border rounded-lg p-6">
                                <h3 className="font-semibold mb-4">Payment Info</h3>
                                <div className="space-y-2 text-sm">
                                    <p><strong>Payment ID:</strong></p>
                                    <code className="text-xs break-all bg-muted px-2 py-1 rounded block">
                                        {order.razorpay_payment_id}
                                    </code>
                                    {order.paid_at && (
                                        <p className="text-muted-foreground">
                                            Paid on {new Date(order.paid_at).toLocaleDateString('en-IN')}
                                        </p>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Download Invoice */}
                        <a
                            href={`/api/orders/${order.id}/invoice`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={order.payment_status !== 'completed' ? 'pointer-events-none opacity-50' : ''}
                        >
                            <Button variant="outline" className="w-full gap-2" disabled={order.payment_status !== 'completed'}>
                                <Download className="h-4 w-4" />
                                Download Invoice
                            </Button>
                        </a>
                        {order.payment_status !== 'completed' && (
                            <p className="text-xs text-muted-foreground text-center">
                                Invoice available after payment is completed
                            </p>
                        )}
                    </div>
                </div>
            </div>
        </div >
    );
}
