'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Plus, Sparkles, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { useCartStore } from '@/stores/cart-store';
import Image from 'next/image';

interface UpsellProduct {
    id: string;
    name: string;
    slug: string;
    price: number;
    mrp: number;
    main_image_url: string | null;
    short_description: string | null;
}

interface CheckoutUpsellProps {
    cartProductIds: string[];
    cartProductNames: string[];
}

// Upsell mapping: if buying X, suggest Y
const UPSELL_SUGGESTIONS: Record<string, string[]> = {
    'windows': ['office', 'microsoft 365', 'office 2024'],
    'office 365': ['windows 11', 'windows 10'],
    'office 2024': ['windows 11', 'windows 10'],
    'home': ['professional', 'pro'],
    'professional': ['windows server', 'office 365'],
};

export function CheckoutUpsell({ cartProductIds, cartProductNames }: CheckoutUpsellProps) {
    const [upsellProducts, setUpsellProducts] = useState<UpsellProduct[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [addingIds, setAddingIds] = useState<Set<string>>(new Set());
    const { fetchCart } = useCartStore();

    const supabase = createClient();

    useEffect(() => {
        fetchUpsellProducts();
    }, [cartProductIds]);

    const fetchUpsellProducts = async () => {
        setIsLoading(true);

        try {
            // Determine what to suggest based on cart contents
            const cartNamesLower = cartProductNames.map(n => n.toLowerCase());
            const suggestedKeywords: string[] = [];

            // Check what's in cart and find matching suggestions
            for (const [keyword, suggestions] of Object.entries(UPSELL_SUGGESTIONS)) {
                if (cartNamesLower.some(name => name.includes(keyword))) {
                    suggestedKeywords.push(...suggestions);
                }
            }

            // If no specific matches, suggest popular items
            if (suggestedKeywords.length === 0) {
                suggestedKeywords.push('office', 'windows');
            }

            // Fetch products matching suggestions (excluding what's in cart)
            const { data: products } = await supabase
                .from('products')
                .select('id, name, slug, price, mrp, main_image_url, short_description')
                .eq('is_active', true)
                .not('id', 'in', `(${cartProductIds.join(',')})`)
                .order('price', { ascending: true })
                .limit(10);

            if (products) {
                // Filter to products matching our suggestions
                const filtered = products.filter(p =>
                    suggestedKeywords.some(kw => p.name.toLowerCase().includes(kw))
                ).slice(0, 3);

                // If not enough matches, just take first 3 not in cart
                if (filtered.length < 2) {
                    setUpsellProducts(products.slice(0, 3));
                } else {
                    setUpsellProducts(filtered);
                }
            }
        } catch (error) {
            console.error('Error fetching upsell products:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleAddToCart = async (product: UpsellProduct) => {
        setAddingIds(prev => new Set(prev).add(product.id));

        try {
            const res = await fetch('/api/cart', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ productId: product.id, quantity: 1 }),
            });

            if (!res.ok) throw new Error('Failed to add to cart');

            await fetchCart();
            toast.success(`${product.name} added to order!`);

            // Remove from upsell list
            setUpsellProducts(prev => prev.filter(p => p.id !== product.id));
        } catch (error) {
            console.error('Error adding to cart:', error);
            toast.error('Failed to add product');
        } finally {
            setAddingIds(prev => {
                const newSet = new Set(prev);
                newSet.delete(product.id);
                return newSet;
            });
        }
    };

    if (isLoading) {
        return (
            <div className="border rounded-lg p-4">
                <div className="flex items-center gap-2 mb-4">
                    <Sparkles className="h-5 w-5 text-yellow-500" />
                    <h3 className="font-semibold">Frequently Bought Together</h3>
                </div>
                <div className="flex items-center justify-center py-4">
                    <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                </div>
            </div>
        );
    }

    if (upsellProducts.length === 0) {
        return null;
    }

    return (
        <div className="border rounded-lg p-4 bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-900/10 dark:to-orange-900/10">
            <div className="flex items-center gap-2 mb-4">
                <Sparkles className="h-5 w-5 text-yellow-500" />
                <h3 className="font-semibold">Frequently Bought Together</h3>
            </div>

            <div className="space-y-3">
                {upsellProducts.map((product) => (
                    <div
                        key={product.id}
                        className="flex items-center gap-3 p-2 bg-white dark:bg-card rounded-lg border"
                    >
                        <div className="relative w-12 h-12 bg-muted rounded flex-shrink-0">
                            {product.main_image_url && (
                                <Image
                                    src={product.main_image_url}
                                    alt={product.name}
                                    fill
                                    className="object-contain p-1"
                                />
                            )}
                        </div>

                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium line-clamp-1">{product.name}</p>
                            <div className="flex items-center gap-2">
                                <span className="text-sm font-bold text-orange-600">
                                    ₹{product.price.toLocaleString('en-IN')}
                                </span>
                                {product.mrp > product.price && (
                                    <span className="text-xs text-muted-foreground line-through">
                                        ₹{product.mrp.toLocaleString('en-IN')}
                                    </span>
                                )}
                            </div>
                        </div>

                        <Button
                            size="sm"
                            variant="outline"
                            className="gap-1 shrink-0"
                            onClick={() => handleAddToCart(product)}
                            disabled={addingIds.has(product.id)}
                        >
                            {addingIds.has(product.id) ? (
                                <Loader2 className="h-3 w-3 animate-spin" />
                            ) : (
                                <Plus className="h-3 w-3" />
                            )}
                            <span className="hidden sm:inline">Add</span>
                        </Button>
                    </div>
                ))}
            </div>

            <p className="text-xs text-muted-foreground mt-3 text-center">
                Complete your software suite and save!
            </p>
        </div>
    );
}
