'use client';

import { useSearchParams } from 'next/navigation';
import { useEffect, useState, Suspense } from 'react';
import Link from 'next/link';
import { Search, Loader2 } from 'lucide-react';
import { ProductCard } from '@/components/product/ProductCard';

function SearchContent() {
    const searchParams = useSearchParams();
    const query = searchParams.get('q') || '';
    const [products, setProducts] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (query.length >= 2) {
            searchProducts();
        } else {
            setProducts([]);
            setIsLoading(false);
        }
    }, [query]);

    const searchProducts = async () => {
        setIsLoading(true);
        try {
            const res = await fetch(`/api/products?search=${encodeURIComponent(query)}`);
            const data = await res.json();
            if (data.success) {
                setProducts(data.data.products || []);
            }
        } catch (error) {
            console.error('Search error:', error);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="container mx-auto px-4 py-8">
            {/* Search Header */}
            <div className="mb-8">
                <h1 className="text-2xl font-bold mb-2">
                    {query ? `Search results for "${query}"` : 'Search Products'}
                </h1>
                {!isLoading && products.length > 0 && (
                    <p className="text-muted-foreground">{products.length} products found</p>
                )}
            </div>

            {/* Loading State */}
            {isLoading && (
                <div className="flex items-center justify-center py-16">
                    <Loader2 className="h-8 w-8 animate-spin" />
                </div>
            )}

            {/* No Query */}
            {!isLoading && !query && (
                <div className="text-center py-16">
                    <Search className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">Enter a search term to find products</p>
                </div>
            )}

            {/* No Results */}
            {!isLoading && query && products.length === 0 && (
                <div className="text-center py-16">
                    <Search className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                    <h2 className="text-xl font-semibold mb-2">No results found</h2>
                    <p className="text-muted-foreground mb-6">
                        We couldn't find any products matching "{query}"
                    </p>
                    <Link href="/products" className="text-primary hover:underline">
                        Browse all products
                    </Link>
                </div>
            )}

            {/* Results Grid */}
            {!isLoading && products.length > 0 && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    {products.map((product: any) => (
                        <ProductCard key={product.id} product={product} />
                    ))}
                </div>
            )}
        </div>
    );
}

export default function SearchPage() {
    return (
        <Suspense fallback={
            <div className="container mx-auto px-4 py-16 text-center">
                <Loader2 className="h-8 w-8 animate-spin mx-auto" />
            </div>
        }>
            <SearchContent />
        </Suspense>
    );
}
