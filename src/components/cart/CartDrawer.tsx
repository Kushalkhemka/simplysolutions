'use client';

import Link from 'next/link';
import { X, Package, ShoppingCart, ArrowRight, Minus, Plus, Trash2 } from 'lucide-react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { useCartStore } from '@/stores/cart-store';

interface CartDrawerProps {
    open: boolean;
    onClose: () => void;
}

export function CartDrawer({ open, onClose }: CartDrawerProps) {
    const { items, updateQuantity, removeItem, subtotal, isLoading } = useCartStore();

    return (
        <Sheet open={open} onOpenChange={onClose}>
            <SheetContent className="flex flex-col w-full sm:max-w-md">
                <SheetHeader className="border-b pb-4">
                    <SheetTitle className="flex items-center gap-2">
                        <ShoppingCart className="h-5 w-5" />
                        Your Cart ({items.length})
                    </SheetTitle>
                </SheetHeader>

                {items.length === 0 ? (
                    <div className="flex-1 flex flex-col items-center justify-center text-center">
                        <Package className="h-16 w-16 text-muted-foreground mb-4" />
                        <h3 className="font-semibold mb-2">Your cart is empty</h3>
                        <p className="text-sm text-muted-foreground mb-4">
                            Add some products to get started
                        </p>
                        <Button onClick={onClose} asChild>
                            <Link href="/products">Browse Products</Link>
                        </Button>
                    </div>
                ) : (
                    <>
                        {/* Cart Items */}
                        <div className="flex-1 overflow-y-auto py-4">
                            <div className="space-y-4">
                                {items.map((item: any) => (
                                    <div key={item.id} className="flex gap-4">
                                        <div className="w-20 h-20 bg-muted rounded flex-shrink-0">
                                            {item.product?.main_image_url ? (
                                                <img
                                                    src={item.product.main_image_url}
                                                    alt={item.product.name}
                                                    className="w-full h-full object-contain p-1"
                                                />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center">
                                                    <Package className="h-8 w-8 text-muted-foreground" />
                                                </div>
                                            )}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <Link
                                                href={`/products/${item.product?.slug}`}
                                                onClick={onClose}
                                                className="text-sm font-medium hover:underline line-clamp-2"
                                            >
                                                {item.product?.name}
                                            </Link>
                                            <p className="text-sm font-bold text-primary mt-1">
                                                ₹{item.product?.price?.toLocaleString('en-IN')}
                                            </p>
                                            <div className="flex items-center justify-between mt-2">
                                                <div className="flex items-center gap-2 border rounded">
                                                    <button
                                                        onClick={() => updateQuantity(item.id, item.quantity - 1)}
                                                        disabled={item.quantity <= 1 || isLoading}
                                                        className="p-1 hover:bg-muted disabled:opacity-50"
                                                    >
                                                        <Minus className="h-3 w-3" />
                                                    </button>
                                                    <span className="w-8 text-center text-sm">{item.quantity}</span>
                                                    <button
                                                        onClick={() => updateQuantity(item.id, item.quantity + 1)}
                                                        disabled={item.quantity >= 10 || isLoading}
                                                        className="p-1 hover:bg-muted disabled:opacity-50"
                                                    >
                                                        <Plus className="h-3 w-3" />
                                                    </button>
                                                </div>
                                                <button
                                                    onClick={() => removeItem(item.id)}
                                                    disabled={isLoading}
                                                    className="p-1 text-destructive hover:bg-destructive/10 rounded"
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Footer */}
                        <div className="border-t pt-4 space-y-4">
                            <div className="flex items-center justify-between text-lg font-semibold">
                                <span>Subtotal</span>
                                <span>₹{subtotal.toLocaleString('en-IN')}</span>
                            </div>
                            <Button onClick={onClose} asChild className="w-full gap-2">
                                <Link href="/cart">
                                    View Cart
                                    <ArrowRight className="h-4 w-4" />
                                </Link>
                            </Button>
                            <Button onClick={onClose} asChild variant="outline" className="w-full">
                                <Link href="/checkout">Checkout</Link>
                            </Button>
                        </div>
                    </>
                )}
            </SheetContent>
        </Sheet>
    );
}
