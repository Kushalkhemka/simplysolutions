'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Sparkles, Loader2 } from 'lucide-react';
import { ProductCard } from '@/components/product/ProductCard';

interface Product {
    id: string;
    name: string;
    slug: string;
    price: number;
    mrp: number;
    main_image_url: string | null;
    brand: string;
    is_featured: boolean;
    is_bestseller: boolean;
    avg_rating: number;
    review_count: number;
}

interface AIRecommendationsProps {
    currentProductId?: string;
    categoryId?: string;
    limit?: number;
    title?: string;
}

export function AIRecommendations({
    currentProductId,
    categoryId,
    limit = 4,
    title = "Recommended for You"
}: AIRecommendationsProps) {
    const [products, setProducts] = useState<Product[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        fetchRecommendations();
    }, [currentProductId, categoryId]);

    const fetchRecommendations = async () => {
        try {
            const params = new URLSearchParams({ limit: limit.toString() });
            if (currentProductId) params.append('excludeId', currentProductId);
            if (categoryId) params.append('categoryId', categoryId);

            const res = await fetch(`/api/recommendations?${params}`);
            const data = await res.json();

            if (data.success) {
                setProducts(data.data || []);
            }
        } catch (error) {
            console.error('Failed to fetch recommendations:', error);
        } finally {
            setIsLoading(false);
        }
    };

    if (isLoading) {
        return (
            <div className="py-8 text-center">
                <Loader2 className="h-6 w-6 animate-spin mx-auto text-muted-foreground" />
            </div>
        );
    }

    if (products.length === 0) {
        return null;
    }

    return (
        <section className="py-8">
            <div className="flex items-center gap-2 mb-6">
                <Sparkles className="h-5 w-5 text-primary" />
                <h2 className="text-xl font-bold">{title}</h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {products.map((product) => (
                    <ProductCard key={product.id} product={product as any} />
                ))}
            </div>
        </section>
    );
}
