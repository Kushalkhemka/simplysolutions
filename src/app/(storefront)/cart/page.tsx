'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useEffect } from 'react';
import { Minus, Plus, Trash2, ShoppingBag, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useCartStore } from '@/stores/cart-store';
import { useAuthStore } from '@/stores/auth-store';

export default function CartPage() {
    const { items, itemCount, subtotal, mrpTotal, discount, isLoading, fetchCart, updateQuantity, removeItem } = useCartStore();
    const { isAuthenticated } = useAuthStore();

    useEffect(() => {
        fetchCart();
    }, [fetchCart]);

    if (isLoading) {
        return (
            <div className="container mx-auto px-4 py-12 text-center">
                <div className="animate-pulse">Loading cart...</div>
            </div>
        );
    }

    if (items.length === 0) {
        return (
            <div className="container mx-auto px-4 py-16 text-center">
                <ShoppingBag className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                <h1 className="text-2xl font-bold mb-2">Your cart is empty</h1>
                <p className="text-muted-foreground mb-6">Looks like you haven't added anything yet.</p>
                <Link href="/products">
                    <Button className="gap-2">
                        Continue Shopping <ArrowRight className="h-4 w-4" />
                    </Button>
                </Link>
            </div>
        );
    }

    return (
        <div className="container mx-auto px-4 py-8">
            <h1 className="text-2xl md:text-3xl font-bold mb-8">Shopping Cart ({itemCount} items)</h1>

            <div className="grid lg:grid-cols-3 gap-8">
                {/* Cart Items */}
                <div className="lg:col-span-2 space-y-4">
                    {items.map((item) => (
                        <div key={item.id} className="flex gap-4 p-4 border rounded-lg">
                            {/* Image */}
                            <Link href={`/products/${item.product?.slug}`} className="flex-shrink-0">
                                <div className="relative w-24 h-24 bg-muted rounded">
                                    {item.product?.main_image_url ? (
                                        <Image
                                            src={item.product.main_image_url}
                                            alt={item.product.name}
                                            fill
                                            className="object-contain p-2"
                                        />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-muted-foreground text-xs">
                                            No Image
                                        </div>
                                    )}
                                </div>
                            </Link>

                            {/* Details */}
                            <div className="flex-1 min-w-0">
                                <Link href={`/products/${item.product?.slug}`}>
                                    <h3 className="font-medium line-clamp-2 hover:text-primary">
                                        {item.product?.name}
                                    </h3>
                                </Link>
                                <p className="text-sm text-muted-foreground mt-1">SKU: {item.product?.sku}</p>

                                <div className="flex items-center gap-4 mt-3">
                                    {/* Quantity */}
                                    <div className="flex items-center border rounded">
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-8 w-8"
                                            onClick={() => updateQuantity(item.id, Math.max(1, item.quantity - 1))}
                                            disabled={item.quantity <= 1}
                                        >
                                            <Minus className="h-3 w-3" />
                                        </Button>
                                        <span className="w-8 text-center text-sm">{item.quantity}</span>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-8 w-8"
                                            onClick={() => updateQuantity(item.id, Math.min(10, item.quantity + 1))}
                                            disabled={item.quantity >= 10}
                                        >
                                            <Plus className="h-3 w-3" />
                                        </Button>
                                    </div>

                                    {/* Remove */}
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className="text-destructive hover:text-destructive"
                                        onClick={() => removeItem(item.id)}
                                    >
                                        <Trash2 className="h-4 w-4 mr-1" />
                                        Remove
                                    </Button>
                                </div>
                            </div>

                            {/* Price */}
                            <div className="text-right flex-shrink-0">
                                <p className="font-bold">₹{((item.product?.price || 0) * item.quantity).toLocaleString('en-IN')}</p>
                                {item.product?.mrp && item.product.mrp > item.product.price && (
                                    <p className="text-sm text-muted-foreground line-through">
                                        ₹{(item.product.mrp * item.quantity).toLocaleString('en-IN')}
                                    </p>
                                )}
                            </div>
                        </div>
                    ))}
                </div>

                {/* Order Summary */}
                <div className="lg:col-span-1">
                    <div className="sticky top-24 border rounded-lg p-6 space-y-4">
                        <h2 className="text-lg font-bold">Order Summary</h2>

                        <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">Subtotal ({itemCount} items)</span>
                                <span>₹{mrpTotal.toLocaleString('en-IN')}</span>
                            </div>
                            {discount > 0 && (
                                <div className="flex justify-between text-orange-600">
                                    <span>Discount</span>
                                    <span>-₹{discount.toLocaleString('en-IN')}</span>
                                </div>
                            )}
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">Delivery</span>
                                <span className="text-orange-600">FREE</span>
                            </div>
                        </div>

                        <div className="border-t pt-4">
                            <div className="flex justify-between text-lg font-bold">
                                <span>Total</span>
                                <span>₹{subtotal.toLocaleString('en-IN')}</span>
                            </div>
                            {discount > 0 && (
                                <p className="text-sm text-orange-600 mt-1">
                                    You save ₹{discount.toLocaleString('en-IN')} on this order
                                </p>
                            )}
                        </div>

                        <Link href={isAuthenticated ? '/checkout' : '/login?redirect=/checkout'}>
                            <Button className="w-full gap-2" size="lg">
                                Proceed to Checkout <ArrowRight className="h-4 w-4" />
                            </Button>
                        </Link>

                        <p className="text-xs text-muted-foreground text-center">
                            Secure checkout powered by Razorpay
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
