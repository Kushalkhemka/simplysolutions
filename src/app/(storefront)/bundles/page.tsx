'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Package, Sparkles, Check, ShoppingCart, ArrowRight } from 'lucide-react';

interface BundleProduct {
    product_type: string;
    quantity: number;
    name: string;
    price: number;
}

interface Bundle {
    id: string;
    name: string;
    slug: string;
    description: string | null;
    image_url: string | null;
    products: BundleProduct[];
    original_price: number;
    bundle_price: number;
    discount_percentage: number;
    is_featured: boolean;
}

// Helper to get product images for a bundle
const getProductImages = (bundleSlug: string, baseUrl: string): string[] => {
    const imageMap: Record<string, string[]> = {
        'ultimate-productivity-bundle': ['win11-pro', 'office-2024'],
        'professional-suite-bundle': ['win10-11-pro', 'office-2021'],
        'home-office-starter-bundle': ['win10-11-home', 'office-2019'],
        'microsoft-365-complete': ['m365-pro', 'win11-pro'],
        'enterprise-cloud-bundle': ['m365-enterprise', 'win-enterprise'],
        'creative-pro-bundle': ['canva-pro'],
        'designer-complete-bundle': ['office-2024'],
        'project-manager-bundle': ['office-2021'],
        'complete-pm-suite': ['office-2021'],
        'mac-productivity-bundle': ['office-mac-2024', 'canva-pro'],
        'mac-complete-office-bundle': ['office-mac-2024'],
        'ai-power-user-bundle': ['m365-copilot'],
        'budget-office-bundle': ['win10-pro', 'office-2016'],
        'cad-master-bundle': ['win11-pro'],
        'all-in-one-business-bundle': ['combo'],
    };

    const images = imageMap[bundleSlug] || [];
    return images.map(img => `${baseUrl}/${bundleSlug}-${img}.jpg`);
};

export default function BundlesPage() {
    const [bundles, setBundles] = useState<Bundle[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [filter, setFilter] = useState<'all' | 'featured'>('all');

    useEffect(() => {
        fetchBundles();
    }, [filter]);

    const fetchBundles = async () => {
        setIsLoading(true);
        try {
            const url = filter === 'featured' ? '/api/bundles?featured=true' : '/api/bundles';
            const response = await fetch(url);
            const data = await response.json();
            if (data.success) {
                setBundles(data.data);
            }
        } catch (error) {
            console.error('Error fetching bundles:', error);
        }
        setIsLoading(false);
    };

    const formatPrice = (price: number) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            maximumFractionDigits: 0
        }).format(price);
    };

    return (
        <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
            {/* Hero Section */}
            <div className="bg-gradient-to-r from-orange-600 via-red-600 to-pink-600 text-white py-16">
                <div className="container mx-auto px-4">
                    <div className="flex items-center gap-3 mb-4">
                        <Package className="h-10 w-10" />
                        <h1 className="text-4xl font-bold">Bundle Deals</h1>
                    </div>
                    <p className="text-xl text-white/90 max-w-2xl">
                        Save big with our curated software bundles! Get the best combinations at unbeatable prices.
                    </p>
                    <div className="flex gap-4 mt-6">
                        <button
                            onClick={() => setFilter('all')}
                            className={`px-6 py-2 rounded-full font-medium transition-all ${filter === 'all'
                                ? 'bg-white text-orange-600'
                                : 'bg-white/20 text-white hover:bg-white/30'
                                }`}
                        >
                            All Bundles
                        </button>
                        <button
                            onClick={() => setFilter('featured')}
                            className={`px-6 py-2 rounded-full font-medium transition-all flex items-center gap-2 ${filter === 'featured'
                                ? 'bg-white text-orange-600'
                                : 'bg-white/20 text-white hover:bg-white/30'
                                }`}
                        >
                            <Sparkles className="h-4 w-4" />
                            Featured
                        </button>
                    </div>
                </div>
            </div>

            {/* Bundles Grid */}
            <div className="container mx-auto px-4 py-12">
                {isLoading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {[1, 2, 3, 4, 5, 6].map((i) => (
                            <div key={i} className="bg-white rounded-2xl shadow-lg p-6 animate-pulse">
                                <div className="h-48 bg-gray-200 rounded-xl mb-4"></div>
                                <div className="h-6 bg-gray-200 rounded w-3/4 mb-2"></div>
                                <div className="h-4 bg-gray-200 rounded w-full mb-4"></div>
                                <div className="h-10 bg-gray-200 rounded"></div>
                            </div>
                        ))}
                    </div>
                ) : bundles.length === 0 ? (
                    <div className="text-center py-16">
                        <Package className="h-16 w-16 mx-auto text-gray-300 mb-4" />
                        <h2 className="text-2xl font-semibold text-gray-600">No bundles available</h2>
                        <p className="text-gray-500 mt-2">Check back soon for amazing deals!</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {bundles.map((bundle) => (
                            <div
                                key={bundle.id}
                                className="bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden group"
                            >
                                {/* Badge */}
                                <div className="relative">
                                    <div className="absolute top-4 left-4 z-10 flex gap-2">
                                        <span className="bg-red-500 text-white text-sm font-bold px-3 py-1 rounded-full">
                                            -{bundle.discount_percentage}%
                                        </span>
                                        {bundle.is_featured && (
                                            <span className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white text-sm font-bold px-3 py-1 rounded-full flex items-center gap-1">
                                                <Sparkles className="h-3 w-3" />
                                                Featured
                                            </span>
                                        )}
                                    </div>
                                    {/* Image - Overlapping Combo */}
                                    <div className="h-48 bg-gradient-to-br from-orange-50 to-red-50 flex items-center justify-center overflow-hidden relative">
                                        {(() => {
                                            const baseUrl = 'https://supabase-supabase2.exxngc.easypanel.host/storage/v1/object/public/product-assets/bundles';
                                            const productImages = getProductImages(bundle.slug, baseUrl);

                                            if (productImages.length === 0) {
                                                return <Package className="h-20 w-20 text-orange-300" />;
                                            }

                                            if (productImages.length === 1) {
                                                return (
                                                    <img
                                                        src={productImages[0]}
                                                        alt={bundle.name}
                                                        className="object-contain h-40 max-w-full"
                                                        onError={(e) => {
                                                            const target = e.currentTarget;
                                                            target.onerror = null;
                                                            target.src = '';
                                                            target.style.display = 'none';
                                                            target.parentElement?.classList.add('show-fallback');
                                                        }}
                                                    />
                                                );
                                            }

                                            // Overlapping layout for 2 images - stacked together
                                            return (
                                                <div className="relative w-full h-full flex items-center justify-center">
                                                    <img
                                                        src={productImages[0]}
                                                        alt={`${bundle.name} product 1`}
                                                        className="h-32 object-contain z-10 drop-shadow-lg -mr-6"
                                                        onError={(e) => { e.currentTarget.style.display = 'none'; }}
                                                    />
                                                    <img
                                                        src={productImages[1]}
                                                        alt={`${bundle.name} product 2`}
                                                        className="h-32 object-contain z-20 drop-shadow-xl -ml-6"
                                                        onError={(e) => { e.currentTarget.style.display = 'none'; }}
                                                    />
                                                </div>
                                            );
                                        })()}
                                    </div>
                                </div>

                                {/* Content */}
                                <div className="p-6">
                                    <h3 className="text-xl font-bold text-gray-900 mb-2 group-hover:text-orange-600 transition-colors">
                                        {bundle.name}
                                    </h3>
                                    <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                                        {bundle.description}
                                    </p>

                                    {/* Products included */}
                                    <div className="space-y-2 mb-4">
                                        <p className="text-sm font-medium text-gray-700">Includes:</p>
                                        {bundle.products.map((product, idx) => (
                                            <div key={idx} className="flex items-center gap-2 text-sm text-gray-600">
                                                <Check className="h-4 w-4 text-green-500 flex-shrink-0" />
                                                <span>{product.name}</span>
                                            </div>
                                        ))}
                                    </div>

                                    {/* Price */}
                                    <div className="flex items-baseline gap-3 mb-4">
                                        <span className="text-3xl font-bold text-orange-600">
                                            {formatPrice(bundle.bundle_price)}
                                        </span>
                                        <span className="text-lg text-gray-400 line-through">
                                            {formatPrice(bundle.original_price)}
                                        </span>
                                    </div>

                                    {/* Savings */}
                                    <div className="bg-green-50 text-green-700 text-sm font-medium px-4 py-2 rounded-lg mb-4 text-center">
                                        You save {formatPrice(bundle.original_price - bundle.bundle_price)}!
                                    </div>

                                    {/* CTA */}
                                    <Link
                                        href={`/bundles/${bundle.slug}`}
                                        className="w-full bg-gradient-to-r from-orange-500 to-red-500 text-white font-semibold py-3 px-6 rounded-xl flex items-center justify-center gap-2 hover:from-orange-600 hover:to-red-600 transition-all group"
                                    >
                                        <ShoppingCart className="h-5 w-5" />
                                        View Bundle
                                        <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                                    </Link>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
