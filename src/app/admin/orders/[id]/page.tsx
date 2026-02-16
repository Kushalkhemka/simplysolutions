import { notFound } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
    ArrowLeft, Package, Mail, Phone, CreditCard, Calendar, Copy, Tag, Wallet,
    ShieldCheck, Truck, Clock, Gift, FileText, User, Hash, Key, ExternalLink
} from 'lucide-react';

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
    if (!profile?.role || !['admin', 'super_admin'].includes(profile.role)) notFound();

    // Fetch order with all relationships
    const { data: order, error } = await supabase
        .from('orders')
        .select(`
            *,
            items:order_items(*, product:products(name, main_image_url, slug)),
            profile:profiles(full_name, email, phone, role, tier, points, wallet_balance, created_at)
        `)
        .eq('id', id)
        .single();

    if (error || !order) notFound();

    // Fetch coupon details if a coupon was used (try coupon_code first, then coupon_id)
    let couponDetails: any = null;
    if (order.coupon_code) {
        const { data } = await supabase
            .from('coupons')
            .select('code, description, discount_type, discount_value, max_discount_amount')
            .eq('code', order.coupon_code)
            .single();
        couponDetails = data;
    } else if (order.coupon_id) {
        const { data } = await supabase
            .from('coupons')
            .select('code, description, discount_type, discount_value, max_discount_amount')
            .eq('id', order.coupon_id)
            .single();
        couponDetails = data;
    }

    // Fetch coupon usage record for this order (shows actual discount applied)
    let couponUsage: any = null;
    {
        const { data } = await supabase
            .from('coupon_usage')
            .select('discount_applied, used_at, coupon_id')
            .eq('order_id', id)
            .single();
        couponUsage = data;
    }

    // If we found coupon_usage but no couponDetails, look up the coupon
    if (couponUsage && !couponDetails) {
        const { data } = await supabase
            .from('coupons')
            .select('code, description, discount_type, discount_value, max_discount_amount')
            .eq('id', couponUsage.coupon_id)
            .single();
        couponDetails = data;
    }

    // Fetch user_offers linked to this order's user around the order time
    let userOffer: any = null;
    if (order.user_id && !couponDetails) {
        const { data } = await supabase
            .from('user_offers')
            .select('offer_type, discount_value, original_price, offer_price, product_id, used_at, is_used')
            .eq('user_id', order.user_id)
            .eq('is_used', true)
            .lte('used_at', new Date(new Date(order.created_at).getTime() + 60000).toISOString())
            .gte('used_at', new Date(new Date(order.created_at).getTime() - 60000).toISOString())
            .limit(1)
            .single();
        userOffer = data;
    }

    const offerTypeLabels: Record<string, string> = {
        flash_deal: '⚡ Flash Deal',
        price_slash: '🔪 Price Slash',
        bogo: '🎁 Buy One Get One',
        welcome_back: '👋 Welcome Back Offer',
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'delivered': return 'bg-green-500/20 text-green-400 border-green-500/30';
            case 'paid': return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
            case 'pending': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
            case 'cancelled': return 'bg-red-500/20 text-red-400 border-red-500/30';
            case 'refunded': return 'bg-red-500/20 text-red-400 border-red-500/30';
            case 'failed': return 'bg-red-500/20 text-red-400 border-red-500/30';
            case 'processing': return 'bg-purple-500/20 text-purple-400 border-purple-500/30';
            default: return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
        }
    };

    const getPaymentStatusColor = (status: string) => {
        switch (status) {
            case 'completed': return 'text-green-400';
            case 'failed': return 'text-red-400';
            case 'pending': return 'text-yellow-400';
            case 'refunded': return 'text-red-400';
            default: return 'text-gray-400';
        }
    };

    const orderProfile = order.profile as any;

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Link href="/admin/orders">
                        <Button variant="ghost" size="icon">
                            <ArrowLeft className="h-5 w-5" />
                        </Button>
                    </Link>
                    <div>
                        <h1 className="text-2xl font-bold">Order {order.order_number}</h1>
                        <p className="text-muted-foreground text-sm">
                            <Calendar className="h-3.5 w-3.5 inline mr-1" />
                            {new Date(order.created_at).toLocaleString('en-IN', {
                                day: 'numeric', month: 'short', year: 'numeric',
                                hour: '2-digit', minute: '2-digit', hour12: true
                            })}
                            <span className="ml-3 text-xs text-muted-foreground/60">ID: {order.id}</span>
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <Badge className={getStatusColor(order.status)}>{order.status}</Badge>
                    <Badge className={getStatusColor(order.delivery_status)}>
                        Delivery: {order.delivery_status}
                    </Badge>
                </div>
            </div>

            <div className="grid lg:grid-cols-3 gap-6">
                {/* Left Column: Order Items + Payment */}
                <div className="lg:col-span-2 space-y-6">

                    {/* Order Items */}
                    <div className="bg-card border rounded-lg">
                        <div className="p-4 border-b flex items-center justify-between">
                            <h2 className="font-semibold flex items-center gap-2">
                                <Package className="h-4 w-4" />
                                Order Items ({(order.items as any[])?.length || 0})
                            </h2>
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
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-start justify-between gap-2">
                                                <div>
                                                    <p className="font-medium text-sm">{item.product_name}</p>
                                                    <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground mt-1">
                                                        <span>SKU: {item.product_sku}</span>
                                                        {item.product_fsn && <span>FSN: {item.product_fsn}</span>}
                                                        <span>Qty: {item.quantity} × ₹{item.unit_price?.toLocaleString('en-IN')}</span>
                                                        <Badge variant="outline" className="text-[10px] h-5">{item.status}</Badge>
                                                    </div>
                                                </div>
                                                <p className="font-semibold text-sm shrink-0">₹{item.total_price?.toLocaleString('en-IN')}</p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* License Keys */}
                                    {item.license_keys?.length > 0 && (
                                        <div className="mt-3 bg-green-500/10 border border-green-500/20 rounded-lg p-3">
                                            <p className="text-xs font-semibold mb-2 flex items-center gap-1.5 text-green-400">
                                                <Key className="h-3.5 w-3.5" />
                                                License Keys ({item.license_keys.length})
                                            </p>
                                            <div className="space-y-1">
                                                {item.license_keys.map((key: string, idx: number) => (
                                                    <div key={idx} className="flex items-center justify-between bg-background rounded px-2.5 py-1.5">
                                                        <code className="text-xs font-mono select-all">{key}</code>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {/* Secret Codes */}
                                    {item.secret_codes?.length > 0 && (
                                        <div className="mt-3 bg-blue-500/10 border border-blue-500/20 rounded-lg p-3">
                                            <p className="text-xs font-semibold mb-2 flex items-center gap-1.5 text-blue-400">
                                                <Hash className="h-3.5 w-3.5" />
                                                Secret / Activation Codes ({item.secret_codes.length})
                                            </p>
                                            <div className="space-y-1">
                                                {item.secret_codes.map((code: string, idx: number) => (
                                                    <div key={idx} className="flex items-center justify-between bg-background rounded px-2.5 py-1.5">
                                                        <code className="text-xs font-mono select-all">{code}</code>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {/* Product Link */}
                                    {item.product?.slug && (
                                        <div className="mt-2">
                                            <Link href={`/products/${item.product.slug}`}
                                                className="text-xs text-blue-400 hover:underline inline-flex items-center gap-1">
                                                <ExternalLink className="h-3 w-3" />
                                                View Product Page
                                            </Link>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Payment & Pricing Breakdown */}
                    <div className="bg-card border rounded-lg p-4 space-y-4">
                        <h2 className="font-semibold flex items-center gap-2">
                            <CreditCard className="h-4 w-4" />
                            Payment & Pricing
                        </h2>

                        {/* Price Breakdown */}
                        <div className="bg-muted/30 rounded-lg p-4 space-y-2 text-sm">
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">Subtotal (MRP)</span>
                                <span>₹{order.subtotal?.toLocaleString('en-IN')}</span>
                            </div>

                            {/* Coupon / Promo Code */}
                            {(order.coupon_code || order.coupon_discount > 0) && (
                                <div className="flex justify-between text-green-400">
                                    <span className="flex items-center gap-1.5">
                                        <Tag className="h-3.5 w-3.5" />
                                        Coupon Discount
                                        {order.coupon_code && (
                                            <Badge variant="outline" className="text-[10px] h-5 border-green-500/40 text-green-400">
                                                {order.coupon_code}
                                            </Badge>
                                        )}
                                    </span>
                                    <span>-₹{order.coupon_discount?.toLocaleString('en-IN') || 0}</span>
                                </div>
                            )}

                            {/* Overall Discount (non-coupon, e.g. welcome offer, deal) */}
                            {order.discount_amount > 0 && (!order.coupon_discount || order.discount_amount !== order.coupon_discount) && (
                                <div className="flex justify-between text-green-400">
                                    <span className="flex items-center gap-1.5">
                                        <Tag className="h-3.5 w-3.5" />
                                        Discount (Offer/Deal)
                                    </span>
                                    <span>-₹{order.discount_amount?.toLocaleString('en-IN')}</span>
                                </div>
                            )}

                            {/* Wallet Used */}
                            {order.wallet_used > 0 && (
                                <div className="flex justify-between text-orange-400">
                                    <span className="flex items-center gap-1.5">
                                        <Wallet className="h-3.5 w-3.5" />
                                        Wallet Used
                                    </span>
                                    <span>-₹{order.wallet_used?.toLocaleString('en-IN')}</span>
                                </div>
                            )}

                            {/* Tax */}
                            {order.tax_amount > 0 && (
                                <div className="flex justify-between text-muted-foreground">
                                    <span>Tax (GST)</span>
                                    <span>+₹{order.tax_amount?.toLocaleString('en-IN')}</span>
                                </div>
                            )}

                            <div className="border-t pt-2 flex justify-between font-bold text-base">
                                <span>Total Paid</span>
                                <span>₹{order.total_amount?.toLocaleString('en-IN')}</span>
                            </div>
                        </div>

                        {/* Coupon Details */}
                        {couponDetails && (
                            <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-3">
                                <p className="text-xs font-semibold mb-1 text-green-400 flex items-center gap-1.5">
                                    <Tag className="h-3.5 w-3.5" />
                                    Coupon Applied: <code className="bg-green-500/20 px-1.5 py-0.5 rounded">{couponDetails.code}</code>
                                </p>
                                {couponDetails.description && (
                                    <p className="text-xs text-muted-foreground">{couponDetails.description}</p>
                                )}
                                <p className="text-xs text-muted-foreground mt-1">
                                    Type: {couponDetails.discount_type === 'percentage'
                                        ? `${couponDetails.discount_value}% off`
                                        : `₹${couponDetails.discount_value} flat off`}
                                    {couponDetails.max_discount_amount && ` (max ₹${couponDetails.max_discount_amount})`}
                                </p>
                                {couponUsage && (
                                    <p className="text-xs text-green-400 mt-1">
                                        Actual discount applied: ₹{couponUsage.discount_applied?.toLocaleString('en-IN')}
                                    </p>
                                )}
                            </div>
                        )}

                        {/* User Offer (flash deal, price slash, etc.) */}
                        {!couponDetails && userOffer && (
                            <div className="bg-purple-500/10 border border-purple-500/20 rounded-lg p-3">
                                <p className="text-xs font-semibold text-purple-400 flex items-center gap-1.5">
                                    <Tag className="h-3.5 w-3.5" />
                                    {offerTypeLabels[userOffer.offer_type] || userOffer.offer_type}
                                </p>
                                <div className="text-xs text-muted-foreground mt-1 space-y-0.5">
                                    {userOffer.original_price && userOffer.offer_price && (
                                        <p>
                                            Original: ₹{userOffer.original_price.toLocaleString('en-IN')} →
                                            Offer: <span className="text-purple-400 font-medium">₹{userOffer.offer_price.toLocaleString('en-IN')}</span>
                                        </p>
                                    )}
                                    {userOffer.discount_value && (
                                        <p>Discount Value: ₹{userOffer.discount_value.toLocaleString('en-IN')}</p>
                                    )}
                                    {userOffer.used_at && (
                                        <p>Used: {new Date(userOffer.used_at).toLocaleString('en-IN')}</p>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* No coupon AND no user offer — unknown discount source */}
                        {!couponDetails && !userOffer && order.discount_amount > 0 && (
                            <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-3">
                                <p className="text-xs font-semibold text-yellow-400 flex items-center gap-1.5">
                                    <Tag className="h-3.5 w-3.5" />
                                    Discount Applied (Source Unknown)
                                </p>
                                <p className="text-xs text-muted-foreground mt-1">
                                    This may be a product-level sale price, MRP markdown, or a system deal.
                                    Amount: ₹{order.discount_amount?.toLocaleString('en-IN')}
                                </p>
                            </div>
                        )}

                        {/* Payment Info Grid */}
                        <div className="grid grid-cols-2 gap-3 text-sm">
                            <div>
                                <p className="text-xs text-muted-foreground">Payment Status</p>
                                <p className={`font-medium capitalize ${getPaymentStatusColor(order.payment_status)}`}>
                                    {order.payment_status}
                                </p>
                            </div>
                            <div>
                                <p className="text-xs text-muted-foreground">Payment Method</p>
                                <p className="font-medium capitalize">{order.payment_method || '-'}</p>
                            </div>
                            <div>
                                <p className="text-xs text-muted-foreground">Razorpay Payment ID</p>
                                <p className="font-mono text-xs break-all">{order.razorpay_payment_id || '-'}</p>
                            </div>
                            <div>
                                <p className="text-xs text-muted-foreground">Razorpay Order ID</p>
                                <p className="font-mono text-xs break-all">{order.razorpay_order_id || '-'}</p>
                            </div>
                            {order.paid_at && (
                                <div>
                                    <p className="text-xs text-muted-foreground">Paid At</p>
                                    <p className="text-xs">{new Date(order.paid_at).toLocaleString('en-IN')}</p>
                                </div>
                            )}
                            {order.delivered_at && (
                                <div>
                                    <p className="text-xs text-muted-foreground">Delivered At</p>
                                    <p className="text-xs">{new Date(order.delivered_at).toLocaleString('en-IN')}</p>
                                </div>
                            )}
                        </div>

                        {/* Points Earned */}
                        {order.points_earned > 0 && (
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                <ShieldCheck className="h-3.5 w-3.5 text-purple-400" />
                                Points Earned: <span className="font-semibold text-purple-400">{order.points_earned}</span>
                            </div>
                        )}
                    </div>

                    {/* Delivery Info */}
                    <div className="bg-card border rounded-lg p-4 space-y-3">
                        <h2 className="font-semibold flex items-center gap-2">
                            <Truck className="h-4 w-4" />
                            Delivery
                        </h2>
                        <div className="grid grid-cols-2 gap-3 text-sm">
                            <div>
                                <p className="text-xs text-muted-foreground">Delivery Status</p>
                                <p className="font-medium capitalize">{order.delivery_status}</p>
                            </div>
                            <div>
                                <p className="text-xs text-muted-foreground">Email Sent</p>
                                <p className="font-medium">{order.delivery_email_sent ? '✅ Yes' : '❌ No'}</p>
                            </div>
                            {order.delivered_at && (
                                <div>
                                    <p className="text-xs text-muted-foreground">Delivered At</p>
                                    <p className="text-xs">{new Date(order.delivered_at).toLocaleString('en-IN')}</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Right Column: Customer +  Meta */}
                <div className="space-y-6">

                    {/* Customer Info */}
                    <div className="bg-card border rounded-lg p-4 space-y-4">
                        <h2 className="font-semibold flex items-center gap-2">
                            <User className="h-4 w-4" />
                            Customer
                        </h2>
                        <div className="space-y-2.5 text-sm">
                            <p className="flex items-center gap-2">
                                <Package className="h-4 w-4 text-muted-foreground shrink-0" />
                                <span className="font-medium">{order.billing_name}</span>
                            </p>
                            <p className="flex items-center gap-2">
                                <Mail className="h-4 w-4 text-muted-foreground shrink-0" />
                                <a href={`mailto:${order.billing_email}`} className="text-blue-400 hover:underline break-all">
                                    {order.billing_email}
                                </a>
                            </p>
                            {order.billing_phone && (
                                <p className="flex items-center gap-2">
                                    <Phone className="h-4 w-4 text-muted-foreground shrink-0" />
                                    <a href={`tel:${order.billing_phone}`} className="text-blue-400 hover:underline">
                                        {order.billing_phone}
                                    </a>
                                </p>
                            )}
                            {order.billing_business_name && (
                                <p className="flex items-center gap-2 text-xs text-muted-foreground">
                                    <FileText className="h-3.5 w-3.5 shrink-0" />
                                    Business: {order.billing_business_name}
                                </p>
                            )}
                            {order.billing_gstn && (
                                <p className="flex items-center gap-2 text-xs text-muted-foreground">
                                    <FileText className="h-3.5 w-3.5 shrink-0" />
                                    GSTN: <code className="bg-muted px-1.5 py-0.5 rounded">{order.billing_gstn}</code>
                                </p>
                            )}
                        </div>

                        {/* Profile Details */}
                        {orderProfile && (
                            <div className="border-t pt-3 space-y-2">
                                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Account Info</p>
                                <div className="grid grid-cols-2 gap-2 text-xs">
                                    {orderProfile.tier && (
                                        <div>
                                            <p className="text-muted-foreground">Tier</p>
                                            <Badge variant="outline" className="text-[10px] capitalize">{orderProfile.tier}</Badge>
                                        </div>
                                    )}
                                    {orderProfile.points > 0 && (
                                        <div>
                                            <p className="text-muted-foreground">Points</p>
                                            <p className="font-medium">{orderProfile.points}</p>
                                        </div>
                                    )}
                                    {orderProfile.wallet_balance > 0 && (
                                        <div>
                                            <p className="text-muted-foreground">Wallet</p>
                                            <p className="font-medium">₹{orderProfile.wallet_balance}</p>
                                        </div>
                                    )}
                                    {orderProfile.created_at && (
                                        <div>
                                            <p className="text-muted-foreground">Member Since</p>
                                            <p className="font-medium">{new Date(orderProfile.created_at).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })}</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Referral / Affiliate */}
                    {(order.referral_code || order.affiliate_id) && (
                        <div className="bg-card border rounded-lg p-4 space-y-2">
                            <h2 className="font-semibold text-sm">Referral & Affiliate</h2>
                            {order.referral_code && (
                                <p className="text-xs flex items-center gap-2">
                                    <Tag className="h-3.5 w-3.5 text-purple-400" />
                                    Referral Code: <code className="bg-muted px-1.5 py-0.5 rounded font-mono">{order.referral_code}</code>
                                </p>
                            )}
                            {order.affiliate_id && (
                                <p className="text-xs flex items-center gap-2">
                                    <User className="h-3.5 w-3.5 text-purple-400" />
                                    Affiliate ID: <code className="bg-muted px-1.5 py-0.5 rounded font-mono text-[10px]">{order.affiliate_id}</code>
                                </p>
                            )}
                        </div>
                    )}

                    {/* Gift Info */}
                    {order.is_gift && (
                        <div className="bg-card border rounded-lg p-4 space-y-2">
                            <h2 className="font-semibold text-sm flex items-center gap-2">
                                <Gift className="h-4 w-4 text-pink-400" />
                                Gift Order
                            </h2>
                            {order.gift_recipient_name && (
                                <p className="text-xs text-muted-foreground">To: {order.gift_recipient_name}</p>
                            )}
                            {order.gift_recipient_email && (
                                <p className="text-xs text-muted-foreground">Email: {order.gift_recipient_email}</p>
                            )}
                            {order.gift_message && (
                                <p className="text-xs italic text-muted-foreground">"{order.gift_message}"</p>
                            )}
                        </div>
                    )}

                    {/* Notes */}
                    {(order.customer_notes || order.admin_notes) && (
                        <div className="bg-card border rounded-lg p-4 space-y-3">
                            <h2 className="font-semibold text-sm flex items-center gap-2">
                                <FileText className="h-4 w-4" />
                                Notes
                            </h2>
                            {order.customer_notes && (
                                <div>
                                    <p className="text-xs font-medium text-muted-foreground mb-1">Customer Notes</p>
                                    <p className="text-sm bg-muted/30 rounded p-2">{order.customer_notes}</p>
                                </div>
                            )}
                            {order.admin_notes && (
                                <div>
                                    <p className="text-xs font-medium text-muted-foreground mb-1">Admin Notes</p>
                                    <p className="text-sm bg-muted/30 rounded p-2">{order.admin_notes}</p>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Timestamps */}
                    <div className="bg-card border rounded-lg p-4 space-y-2">
                        <h2 className="font-semibold text-sm flex items-center gap-2">
                            <Clock className="h-4 w-4" />
                            Timeline
                        </h2>
                        <div className="space-y-1.5 text-xs">
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">Created</span>
                                <span>{new Date(order.created_at).toLocaleString('en-IN')}</span>
                            </div>
                            {order.paid_at && (
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">Paid</span>
                                    <span>{new Date(order.paid_at).toLocaleString('en-IN')}</span>
                                </div>
                            )}
                            {order.delivered_at && (
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">Delivered</span>
                                    <span>{new Date(order.delivered_at).toLocaleString('en-IN')}</span>
                                </div>
                            )}
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">Updated</span>
                                <span>{new Date(order.updated_at).toLocaleString('en-IN')}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
