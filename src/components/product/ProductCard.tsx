'use client';

import Image from 'next/image';
import Link from 'next/link';
import { Heart, ShoppingCart, Star, Zap, Check, Package } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useCartStore } from '@/stores/cart-store';
import type { Product } from '@/types';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

// Array of rating values to pick from
const RATINGS = [5.0, 4.9, 4.5, 4.7];

// Generate a deterministic hash based on product ID
function getProductHash(productId: string): number {
    let hash = 0;
    for (let i = 0; i < productId.length; i++) {
        const char = productId.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash);
}

// Generate a deterministic rating based on product ID for consistency
function getProductRating(productId: string): number {
    return RATINGS[getProductHash(productId) % RATINGS.length];
}

// Generate a deterministic review count between 50-600 based on product ID
function getProductReviewCount(productId: string): number {
    const hash = getProductHash(productId);
    return 50 + (hash % 551); // 50 to 600
}

import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/auth-store';

interface ProductCardProps {
    product: Product;
    showQuickAdd?: boolean;
    variant?: 'default' | 'compact' | 'horizontal';
}

export function ProductCard({ product, showQuickAdd = true, variant = 'default' }: ProductCardProps) {
    const { addItem, isLoading } = useCartStore();

    const discountPercent = Math.round(((product.mrp - product.price) / product.mrp) * 100);
    const savings = product.mrp - product.price;
    const rating = getProductRating(product.id);

    const { isAuthenticated } = useAuthStore();
    const router = useRouter();

    const addToCartSafe = async (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();

        if (!isAuthenticated) {
            toast.error('Please login to add items to cart');
            router.push('/login');
            return;
        }

        const success = await addItem(product.id);
        if (success) {
            toast.success(`Added ${product.name} to cart`);
        } else {
            toast.error(`Failed to add ${product.name} to cart`);
        }
    }

    if (variant === 'horizontal') {
        return (
            <Link href={`/products/${product.slug}`} className="group block h-full">
                <div className="flex bg-card rounded-xl border p-3 hover:shadow-md transition-all h-full gap-4 items-center">
                    <div className="relative w-24 h-24 flex-shrink-0 bg-muted/30 rounded-lg p-2">
                        {product.main_image_url ? (
                            <Image
                                src={product.main_image_url}
                                alt={product.name}
                                fill
                                className="object-contain"
                            />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center text-xs text-muted-foreground">
                                <Package className="w-6 h-6 opacity-50" />
                            </div>
                        )}
                    </div>
                    <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-sm line-clamp-2 mb-1 group-hover:text-primary transition-colors">{product.name}</h3>
                        <div className="flex items-center gap-1 mb-2">
                            <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                            <span className="text-xs font-medium">{rating.toFixed(1)}</span>
                        </div>
                        <div className="flex items-baseline gap-2">
                            <span className="font-bold text-lg">₹{product.price.toLocaleString('en-IN')}</span>
                            <span className="text-xs text-muted-foreground line-through">₹{product.mrp.toLocaleString('en-IN')}</span>
                        </div>
                    </div>
                </div>
            </Link>
        );
    }

    return (
        <Link href={`/products/${product.slug}`} className="group block h-full">
            <div className="h-full flex flex-col bg-card rounded-xl border border-transparent shadow-sm hover:shadow-xl hover:border-primary/20 transition-all duration-300 relative overflow-hidden">
                {/* Image Section */}
                <div className="relative aspect-square bg-gradient-to-br from-white to-gray-50 dark:from-gray-900 dark:to-gray-950 p-8 flex items-center justify-center overflow-hidden">
                    {/* Badges */}
                    <div className="absolute top-3 left-3 z-10 flex flex-col gap-1.5 items-start">
                        {discountPercent > 20 && (
                            <Badge className="bg-red-600 hover:bg-red-700 text-white border-0 font-bold px-2 py-0.5 rounded shadow-sm">
                                -{discountPercent}%
                            </Badge>
                        )}
                        {product.stock_quantity > 0 && product.stock_quantity < 10 && (
                            <Badge variant="outline" className="bg-background/80 backdrop-blur text-red-600 border-red-200 text-[10px] px-1.5 h-5">
                                Only {product.stock_quantity} left
                            </Badge>
                        )}
                    </div>

                    {/* Right Badges */}
                    <div className="absolute top-3 right-3 z-10 flex flex-col gap-1.5 items-end">
                        {product.is_bestseller && (
                            <Badge className="bg-orange-500 hover:bg-orange-600 text-white border-0 px-2 py-0.5 rounded shadow-sm flex items-center gap-1">
                                <Zap className="w-3 h-3 fill-current text-white" /> Bestseller
                            </Badge>
                        )}
                    </div>

                    {/* Image */}
                    {product.main_image_url ? (
                        <Image
                            src={product.main_image_url}
                            alt={product.name}
                            fill
                            className="object-contain p-4 group-hover:scale-110 transition-transform duration-500 ease-out"
                            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
                        />
                    ) : (
                        <div className="flex flex-col items-center justify-center text-muted-foreground">
                            <Package className="w-8 h-8 opacity-20 mb-2" />
                            <span className="text-xs">No Image</span>
                        </div>
                    )}

                    {/* Instant Badge Overlay */}
                    <div className="absolute bottom-0 left-0 right-0 bg-background/90 backdrop-blur-sm py-1 px-3 border-t translate-y-full group-hover:translate-y-0 transition-transform duration-300 flex items-center justify-center gap-2 text-[10px] font-medium text-emerald-600">
                        <Zap className="w-3 h-3 fill-yellow-500 text-yellow-500" />
                        Instant Digital Delivery
                    </div>
                </div>

                {/* Content Section */}
                <div className="flex-1 p-4 flex flex-col gap-2">
                    {/* Brand & Rating */}
                    <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold tracking-wider text-muted-foreground uppercase">{product.brand}</span>
                        <div className="flex items-center gap-1 text-xs font-medium">
                            <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                            <span>{rating.toFixed(1)}</span>
                            <span className="text-muted-foreground">({product.review_count || 124})</span>
                        </div>
                    </div>

                    {/* Title */}
                    <h3 className="font-semibold text-[13px] leading-snug line-clamp-2 text-foreground/90 group-hover:text-primary transition-colors" title={product.name}>
                        {product.name}
                    </h3>

                    {/* Specs Tags (if description allows or mock) */}
                    <div className="flex flex-wrap gap-1 mt-1">
                        <span className="text-[10px] px-1.5 py-0.5 bg-muted rounded border text-muted-foreground">Lifetime</span>
                        <span className="text-[10px] px-1.5 py-0.5 bg-muted rounded border text-muted-foreground">Global</span>
                        <span className="text-[10px] px-1.5 py-0.5 bg-muted rounded border text-muted-foreground">Key</span>
                    </div>

                    <div className="mt-auto pt-3 flex flex-col gap-2">
                        {/* Price Block */}
                        <div className="flex items-end gap-2">
                            <div className="flex flex-col">
                                <span className="text-xs text-muted-foreground line-through">₹{product.mrp.toLocaleString('en-IN')}</span>
                                <span className="text-xl font-bold text-foreground">₹{product.price.toLocaleString('en-IN')}</span>
                            </div>
                            {discountPercent > 0 && (
                                <span className="mb-1 text-xs font-medium text-red-600 bg-red-50 dark:bg-red-900/20 px-1.5 py-0.5 rounded">
                                    Save ₹{savings.toLocaleString('en-IN')}
                                </span>
                            )}
                        </div>

                        {/* Action Button */}
                        {showQuickAdd && (
                            <Button
                                onClick={addToCartSafe}
                                disabled={isLoading || product.stock_quantity === 0}
                                className={cn(
                                    "w-full h-9 shadow-sm transition-all duration-300",
                                    product.stock_quantity === 0
                                        ? "opacity-50"
                                        : "hover:shadow-md active:scale-95 bg-primary hover:bg-primary/90"
                                )}
                            >
                                <ShoppingCart className="w-4 h-4 mr-2" />
                                {product.stock_quantity === 0 ? 'Out of Stock' : 'Add to Cart'}
                            </Button>
                        )}
                    </div>
                </div>
            </div>
        </Link>
    );
}
