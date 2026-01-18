'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Image from 'next/image';
import { Loader2, CreditCard, Shield, Lock, Gift, Percent, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useCartStore } from '@/stores/cart-store';
import { useAuthStore } from '@/stores/auth-store';
import { toast } from 'sonner';
import { LoyaltyWidget } from '@/components/checkout/LoyaltyWidget';
import { GiftCheckout, GiftDetails } from '@/components/checkout/GiftCheckout';

declare global {
    interface Window {
        Razorpay: any;
    }
}

const checkoutSchema = z.object({
    name: z.string().min(2, 'Name is required'),
    email: z.string().email('Valid email is required'),
    phone: z.string().min(10, 'Phone number is required (min 10 digits)'),
    addressLine1: z.string().min(5, 'Address is required'),
    addressLine2: z.string().optional(),
    city: z.string().min(2, 'City is required'),
    state: z.string().min(2, 'State is required'),
    postalCode: z.string().regex(/^[1-9][0-9]{5}$/, 'Invalid PIN code (6 digits)'),
    gstn: z.string().regex(/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/, 'Invalid GSTN format').optional().or(z.literal('')),
    couponCode: z.string().optional(),
});

type CheckoutForm = z.infer<typeof checkoutSchema>;

export default function CheckoutPage() {
    const router = useRouter();
    const { items, subtotal, discount, fetchCart } = useCartStore();
    const { user, isAuthenticated, fetchUser } = useAuthStore();
    const [isProcessing, setIsProcessing] = useState(false);
    const [couponApplied, setCouponApplied] = useState<{ code: string; discount: number } | null>(null);
    const [loyaltyPoints, setLoyaltyPoints] = useState(0);
    const [loyaltyDiscount, setLoyaltyDiscount] = useState(0);
    const [isGift, setIsGift] = useState(false);
    const [giftDetails, setGiftDetails] = useState<GiftDetails | null>(null);
    const [activeOffers, setActiveOffers] = useState<{ priceSlash: any; bogo: any } | null>(null);

    const { register, handleSubmit, formState: { errors }, setValue } = useForm<CheckoutForm>({
        resolver: zodResolver(checkoutSchema),
    });

    useEffect(() => {
        fetchCart();
        fetchUser();
        // Fetch active offers
        const fetchOffers = async () => {
            try {
                const res = await fetch('/api/offers');
                const data = await res.json();
                if (data.success) {
                    setActiveOffers({
                        priceSlash: data.data.priceSlash,
                        bogo: data.data.bogo,
                    });
                }
            } catch (error) {
                console.error('Failed to fetch offers:', error);
            }
        };
        fetchOffers();
    }, [fetchCart, fetchUser]);

    useEffect(() => {
        if (user) {
            setValue('name', user.full_name || '');
            setValue('email', user.email || '');
            setValue('phone', user.phone || '');
        }
    }, [user, setValue]);

    // Load Razorpay script
    useEffect(() => {
        const script = document.createElement('script');
        script.src = 'https://checkout.razorpay.com/v1/checkout.js';
        script.async = true;
        document.body.appendChild(script);
        return () => {
            document.body.removeChild(script);
        };
    }, []);

    // Calculate offer discount (BOGO or 50% OFF)
    const calculateOfferDiscount = () => {
        if (!activeOffers || items.length === 0) return { type: null, discount: 0 };

        // Get item prices sorted ascending (cheapest first)
        const itemPrices = items
            .map(item => item.product?.price || 0)
            .sort((a, b) => a - b);

        // BOGO requires 2+ items - cheapest item is FREE
        if (activeOffers.bogo && items.length >= 2) {
            return { type: 'bogo', discount: itemPrices[0] };
        }

        // 50% OFF the cheapest item
        if (activeOffers.priceSlash) {
            return { type: 'price_slash', discount: itemPrices[0] * 0.5 };
        }

        return { type: null, discount: 0 };
    };

    const offerResult = calculateOfferDiscount();
    const offerDiscount = offerResult.discount;
    const offerType = offerResult.type;

    const total = subtotal - (couponApplied?.discount || 0) - loyaltyDiscount - offerDiscount;

    const handleLoyaltyPointsChange = (points: number, discount: number) => {
        setLoyaltyPoints(points);
        setLoyaltyDiscount(discount);
    };

    const onSubmit = async (data: CheckoutForm) => {
        if (items.length === 0) {
            toast.error('Your cart is empty');
            return;
        }

        setIsProcessing(true);

        try {
            // Create order
            const res = await fetch('/api/checkout', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    billing: {
                        name: data.name,
                        email: data.email,
                        phone: data.phone,
                        gstn: data.gstn || undefined,
                        address: {
                            line1: data.addressLine1,
                            line2: data.addressLine2,
                            city: data.city,
                            state: data.state,
                            postalCode: data.postalCode,
                            country: 'IN',
                        },
                    },
                    couponCode: data.couponCode,
                    loyaltyPointsToUse: loyaltyPoints,
                    isGift,
                    giftDetails,
                }),
            });

            const result = await res.json();

            if (!result.success) {
                throw new Error(result.error || 'Failed to create order');
            }

            // Open Razorpay checkout
            const options = {
                key: result.data.razorpayKeyId,
                amount: result.data.amount * 100,
                currency: result.data.currency,
                name: 'SimplySolutions',
                description: `Order ${result.data.orderNumber}`,
                order_id: result.data.razorpayOrderId,
                prefill: result.data.prefill,
                theme: {
                    color: '#2563eb',
                },
                handler: async function (response: any) {
                    // Verify payment
                    const verifyRes = await fetch('/api/checkout/verify', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            razorpay_order_id: response.razorpay_order_id,
                            razorpay_payment_id: response.razorpay_payment_id,
                            razorpay_signature: response.razorpay_signature,
                        }),
                    });

                    const verifyResult = await verifyRes.json();

                    if (verifyResult.success) {
                        toast.success('Payment successful! Check your email for license keys.');
                        router.push(`/dashboard/orders/${verifyResult.data.orderId}`);
                    } else {
                        toast.error('Payment verification failed');
                    }
                },
                modal: {
                    ondismiss: function () {
                        setIsProcessing(false);
                    },
                },
            };

            const razorpay = new window.Razorpay(options);
            razorpay.open();
        } catch (error) {
            console.error('Checkout error:', error);
            toast.error(error instanceof Error ? error.message : 'Checkout failed');
            setIsProcessing(false);
        }
    };

    if (!isAuthenticated) {
        return null; // Middleware handles redirect
    }

    if (items.length === 0) {
        return (
            <div className="container mx-auto px-4 py-16 text-center">
                <h1 className="text-2xl font-bold mb-4">Your cart is empty</h1>
                <Link href="/products">
                    <Button>Continue Shopping</Button>
                </Link>
            </div>
        );
    }

    return (
        <div className="container mx-auto px-4 py-8">
            <h1 className="text-2xl md:text-3xl font-bold mb-8">Checkout</h1>

            <div className="grid lg:grid-cols-2 gap-8">
                {/* Checkout Form */}
                <div>
                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                        <div className="border rounded-lg p-6">
                            <h2 className="text-lg font-semibold mb-4">Billing Details</h2>

                            <div className="space-y-4">
                                <div>
                                    <Label htmlFor="name">Full Name *</Label>
                                    <Input
                                        id="name"
                                        {...register('name')}
                                        className={errors.name ? 'border-destructive' : ''}
                                    />
                                    {errors.name && (
                                        <p className="text-sm text-destructive mt-1">{errors.name.message}</p>
                                    )}
                                </div>

                                <div>
                                    <Label htmlFor="email">Email Address *</Label>
                                    <Input
                                        id="email"
                                        type="email"
                                        {...register('email')}
                                        className={errors.email ? 'border-destructive' : ''}
                                    />
                                    {errors.email && (
                                        <p className="text-sm text-destructive mt-1">{errors.email.message}</p>
                                    )}
                                    <p className="text-xs text-muted-foreground mt-1">
                                        License keys will be sent to this email
                                    </p>
                                </div>

                                <div>
                                    <Label htmlFor="phone">Phone Number *</Label>
                                    <Input
                                        id="phone"
                                        type="tel"
                                        placeholder="10-digit mobile number"
                                        {...register('phone')}
                                        className={errors.phone ? 'border-destructive' : ''}
                                    />
                                    {errors.phone && (
                                        <p className="text-sm text-destructive mt-1">{errors.phone.message}</p>
                                    )}
                                </div>

                                <div className="border-t pt-4 mt-4">
                                    <h3 className="font-medium mb-3">Billing Address *</h3>
                                    <div className="space-y-3">
                                        <div>
                                            <Label htmlFor="addressLine1">Address Line 1 *</Label>
                                            <Input
                                                id="addressLine1"
                                                placeholder="House/Flat No., Building, Street"
                                                {...register('addressLine1')}
                                                className={errors.addressLine1 ? 'border-destructive' : ''}
                                            />
                                            {errors.addressLine1 && (
                                                <p className="text-sm text-destructive mt-1">{errors.addressLine1.message}</p>
                                            )}
                                        </div>
                                        <div>
                                            <Label htmlFor="addressLine2">Address Line 2 (Optional)</Label>
                                            <Input
                                                id="addressLine2"
                                                placeholder="Landmark, Area"
                                                {...register('addressLine2')}
                                            />
                                        </div>
                                        <div className="grid grid-cols-2 gap-3">
                                            <div>
                                                <Label htmlFor="city">City *</Label>
                                                <Input
                                                    id="city"
                                                    placeholder="City"
                                                    {...register('city')}
                                                    className={errors.city ? 'border-destructive' : ''}
                                                />
                                                {errors.city && (
                                                    <p className="text-sm text-destructive mt-1">{errors.city.message}</p>
                                                )}
                                            </div>
                                            <div>
                                                <Label htmlFor="state">State *</Label>
                                                <Input
                                                    id="state"
                                                    placeholder="State"
                                                    {...register('state')}
                                                    className={errors.state ? 'border-destructive' : ''}
                                                />
                                                {errors.state && (
                                                    <p className="text-sm text-destructive mt-1">{errors.state.message}</p>
                                                )}
                                            </div>
                                        </div>
                                        <div>
                                            <Label htmlFor="postalCode">PIN Code *</Label>
                                            <Input
                                                id="postalCode"
                                                placeholder="6-digit PIN code"
                                                maxLength={6}
                                                {...register('postalCode')}
                                                className={errors.postalCode ? 'border-destructive' : ''}
                                            />
                                            {errors.postalCode && (
                                                <p className="text-sm text-destructive mt-1">{errors.postalCode.message}</p>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                <div className="border-t pt-4 mt-4">
                                    <h3 className="font-medium mb-3">GSTN (Optional - for Business)</h3>
                                    <div>
                                        <Label htmlFor="gstn">GSTN Number</Label>
                                        <Input
                                            id="gstn"
                                            placeholder="15-character GSTN (e.g., 22AAAAA0000A1Z5)"
                                            maxLength={15}
                                            {...register('gstn')}
                                            className={errors.gstn ? 'border-destructive' : ''}
                                        />
                                        {errors.gstn && (
                                            <p className="text-sm text-destructive mt-1">{errors.gstn.message}</p>
                                        )}
                                        <p className="text-xs text-muted-foreground mt-1">
                                            Enter GSTN for GST invoice
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <GiftCheckout
                            onGiftChange={(isGift, details) => {
                                setIsGift(isGift);
                                setGiftDetails(details);
                            }}
                        />

                        <div className="border rounded-lg p-6">
                            <h2 className="text-lg font-semibold mb-4">Have a Coupon?</h2>
                            <div className="flex gap-2">
                                <Input
                                    placeholder="Enter coupon code"
                                    {...register('couponCode')}
                                />
                                <Button type="button" variant="outline">
                                    Apply
                                </Button>
                            </div>
                        </div>

                        <LoyaltyWidget
                            orderAmount={total + loyaltyDiscount}
                            onPointsChange={handleLoyaltyPointsChange}
                        />

                        <Button type="submit" size="lg" className="w-full gap-2" disabled={isProcessing}>
                            {isProcessing ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                                <CreditCard className="h-4 w-4" />
                            )}
                            Pay ₹{total.toLocaleString('en-IN')}
                        </Button>

                        <div className="flex items-center justify-center gap-4 text-sm text-muted-foreground">
                            <div className="flex items-center gap-1">
                                <Shield className="h-4 w-4" />
                                <span>Secure</span>
                            </div>
                            <div className="flex items-center gap-1">
                                <Lock className="h-4 w-4" />
                                <span>Encrypted</span>
                            </div>
                        </div>
                    </form>
                </div>

                {/* Order Summary */}
                <div>
                    <div className="sticky top-24 border rounded-lg p-6">
                        <h2 className="text-lg font-semibold mb-4">Order Summary</h2>

                        <div className="space-y-4 mb-6">
                            {items.map((item) => (
                                <div key={item.id} className="flex gap-3">
                                    <div className="relative w-16 h-16 bg-muted rounded flex-shrink-0">
                                        {item.product?.main_image_url && (
                                            <Image
                                                src={item.product.main_image_url}
                                                alt={item.product.name}
                                                fill
                                                className="object-contain p-1"
                                            />
                                        )}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium line-clamp-2">{item.product?.name}</p>
                                        <p className="text-xs text-muted-foreground">Qty: {item.quantity}</p>
                                    </div>
                                    <div className="text-right">
                                        {item.product?.mrp && item.product.mrp > (item.product?.price || 0) && (
                                            <p className="text-xs text-muted-foreground line-through">
                                                ₹{((item.product?.mrp || 0) * item.quantity).toLocaleString('en-IN')}
                                            </p>
                                        )}
                                        <p className="font-medium text-orange-600">
                                            ₹{((item.product?.price || 0) * item.quantity).toLocaleString('en-IN')}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="border-t pt-4 space-y-2 text-sm">
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">Subtotal</span>
                                <span>₹{subtotal.toLocaleString('en-IN')}</span>
                            </div>
                            {discount > 0 && (
                                <div className="flex justify-between text-orange-600">
                                    <span>Savings</span>
                                    <span>-₹{discount.toLocaleString('en-IN')}</span>
                                </div>
                            )}
                            {couponApplied && (
                                <div className="flex justify-between text-orange-600">
                                    <span>Coupon ({couponApplied.code})</span>
                                    <span>-₹{couponApplied.discount.toLocaleString('en-IN')}</span>
                                </div>
                            )}
                            {loyaltyDiscount > 0 && (
                                <div className="flex justify-between text-orange-600">
                                    <span>Loyalty Points ({loyaltyPoints} pts)</span>
                                    <span>-₹{loyaltyDiscount.toLocaleString('en-IN')}</span>
                                </div>
                            )}
                            {offerDiscount > 0 && (
                                <div className="flex justify-between text-purple-600">
                                    <span className="flex items-center gap-1">
                                        {offerType === 'bogo' ? (
                                            <><Gift className="h-3.5 w-3.5" /> BOGO - Free Item!</>
                                        ) : (
                                            <><Percent className="h-3.5 w-3.5" /> 50% OFF First Purchase!</>
                                        )}
                                    </span>
                                    <span>-₹{Math.round(offerDiscount).toLocaleString('en-IN')}</span>
                                </div>
                            )}
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">Delivery</span>
                                <span className="text-green-600">FREE</span>
                            </div>
                        </div>

                        <div className="border-t mt-4 pt-4">
                            <div className="flex justify-between text-lg font-bold">
                                <span>Total</span>
                                <span>₹{total.toLocaleString('en-IN')}</span>
                            </div>
                        </div>

                        <div className="flex flex-col items-center gap-2 mt-4">
                            <a href="https://razorpay.com/" target="_blank" rel="noopener noreferrer">
                                <img
                                    referrerPolicy="origin"
                                    src="https://badges.razorpay.com/badge-dark.png"
                                    style={{ height: '45px', width: '113px' }}
                                    alt="Razorpay | Payment Gateway | Neobank"
                                />
                            </a>
                            <p className="text-xs text-muted-foreground text-center">256-bit SSL encryption</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
