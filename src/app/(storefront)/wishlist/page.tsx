'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Heart, ShoppingCart, Trash2, Loader2, Share2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuthStore } from '@/stores/auth-store';
import { useCartStore } from '@/stores/cart-store';
import { toast } from 'sonner';

interface WishlistItem {
    id: string;
    product: {
        id: string;
        name: string;
        slug: string;
        price: number;
        mrp: number;
        main_image_url: string;
        stock_quantity: number;
        is_active: boolean;
    };
}

export default function WishlistPage() {
    const { isAuthenticated } = useAuthStore();
    const { addItem } = useCartStore();
    const [items, setItems] = useState<WishlistItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [removingId, setRemovingId] = useState<string | null>(null);

    useEffect(() => {
        if (isAuthenticated) {
            fetchWishlist();
        } else {
            setIsLoading(false);
        }
    }, [isAuthenticated]);

    const fetchWishlist = async () => {
        try {
            const res = await fetch('/api/wishlist');
            const data = await res.json();
            if (data.success) {
                setItems(data.data.items || []);
            }
        } catch (error) {
            console.error('Failed to fetch wishlist:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const removeFromWishlist = async (id: string) => {
        setRemovingId(id);
        try {
            const res = await fetch(`/api/wishlist/${id}`, { method: 'DELETE' });
            if (res.ok) {
                setItems(items.filter(item => item.id !== id));
                toast.success('Removed from wishlist');
            }
        } catch (error) {
            console.error('Failed to remove:', error);
            toast.error('Failed to remove');
        } finally {
            setRemovingId(null);
        }
    };

    const moveToCart = async (item: WishlistItem) => {
        await addItem(item.product.id);
        await removeFromWishlist(item.id);
        toast.success('Moved to cart');
    };

    const handleShare = async () => {
        if (items.length === 0) return;

        const shareText = `Check out my wishlist on SimplySolutions:\n\n` +
            items.map(item => `- ${item.product.name}: ${window.location.origin}/products/${item.product.slug}`).join('\n');

        if (navigator.share) {
            try {
                await navigator.share({
                    title: 'My SimplySolutions Wishlist',
                    text: shareText,
                });
            } catch (error) {
                console.error('Error sharing:', error);
            }
        } else {
            try {
                await navigator.clipboard.writeText(shareText);
                toast.success('Wishlist copied to clipboard');
            } catch (error) {
                toast.error('Failed to copy wishlist');
            }
        }
    };

    if (!isAuthenticated) {
        return (
            <div className="container mx-auto px-4 py-16 text-center">
                <Heart className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                <h1 className="text-2xl font-bold mb-2">Please Login</h1>
                <p className="text-muted-foreground mb-6">Login to view and manage your wishlist</p>
                <Link href="/login?redirect=/wishlist">
                    <Button>Login</Button>
                </Link>
            </div>
        );
    }

    if (isLoading) {
        return (
            <div className="container mx-auto px-4 py-16 text-center">
                <Loader2 className="h-8 w-8 animate-spin mx-auto" />
            </div>
        );
    }

    if (items.length === 0) {
        return (
            <div className="container mx-auto px-4 py-16 text-center">
                <Heart className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                <h1 className="text-2xl font-bold mb-2">Your Wishlist is Empty</h1>
                <p className="text-muted-foreground mb-6">Save items you like to your wishlist</p>
                <Link href="/products">
                    <Button>Browse Products</Button>
                </Link>
            </div>
        );
    }

    return (
        <div className="container-dense py-8">
            <div className="flex items-center justify-between mb-8">
                <h1 className="text-2xl md:text-3xl font-bold">
                    My Wishlist ({items.length} items)
                </h1>
                <Button variant="outline" size="sm" onClick={handleShare} className="gap-2">
                    <Share2 className="h-4 w-4" />
                    Share List
                </Button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {items.map((item) => (
                    <div key={item.id} className="border rounded-lg overflow-hidden group">
                        {/* Image */}
                        <Link href={`/products/${item.product.slug}`}>
                            <div className="relative aspect-square bg-muted">
                                {item.product.main_image_url && (
                                    <Image
                                        src={item.product.main_image_url}
                                        alt={item.product.name}
                                        fill
                                        className="object-contain p-4 group-hover:scale-105 transition-transform"
                                    />
                                )}
                            </div>
                        </Link>

                        {/* Content */}
                        <div className="p-4">
                            <Link href={`/products/${item.product.slug}`}>
                                <h3 className="font-medium text-sm line-clamp-2 mb-2 hover:text-primary">
                                    {item.product.name}
                                </h3>
                            </Link>

                            {/* Price */}
                            <div className="flex items-baseline gap-2 mb-4">
                                <span className="text-lg font-bold">₹{item.product.price.toLocaleString('en-IN')}</span>
                                {item.product.mrp > item.product.price && (
                                    <span className="text-sm text-muted-foreground line-through">
                                        ₹{item.product.mrp.toLocaleString('en-IN')}
                                    </span>
                                )}
                            </div>

                            {/* Actions */}
                            <div className="flex gap-2">
                                <Button
                                    size="sm"
                                    className="flex-1 gap-1"
                                    onClick={() => moveToCart(item)}
                                    disabled={item.product.stock_quantity === 0}
                                >
                                    <ShoppingCart className="h-4 w-4" />
                                    {item.product.stock_quantity === 0 ? 'Out of Stock' : 'Add to Cart'}
                                </Button>
                                <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => removeFromWishlist(item.id)}
                                    disabled={removingId === item.id}
                                >
                                    {removingId === item.id ? (
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                    ) : (
                                        <Trash2 className="h-4 w-4" />
                                    )}
                                </Button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
