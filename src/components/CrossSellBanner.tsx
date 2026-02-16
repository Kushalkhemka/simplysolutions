'use client';

import { useRef, useState, useEffect, useCallback } from 'react';
import { ShoppingCart, ChevronLeft, ChevronRight, Star, Loader2, Zap } from 'lucide-react';
import { toast } from 'sonner';
import Image from 'next/image';
import Link from 'next/link';
import { useCartStore } from '@/stores/cart-store';
import { useAuthStore } from '@/stores/auth-store';
import { useRouter } from 'next/navigation';

// ── Types ──────────────────────────────────────────────────────────────────────
interface Product {
    id: string;
    name: string;
    slug: string;
    price: number;
    mrp: number;
    main_image_url: string | null;
    is_bestseller: boolean;
    is_featured: boolean;
    stock_quantity: number;
    sold_count: number;
    avg_rating: number;
}

// ── Curated product slugs for cross-sell (in display order) ──
const CURATED_SLUGS = [
    'windows-11-pro-product-license-key-1-userpc-lifetime-validity-3264-bit-or-unlimited-reinstallations--off_17',
    'microsoft-office-microsoft-365-professional-plus-edition-or-latest-2026-release-or-5-devices-lifetim-off_5',
    'microsoft-office-professional-plus-2021-for-windows-new-2025-updated-version-or-retail-license-key-1-off_3',
    'microsoft-office-microsoft-office-2024-ltsc-professional-plus-for-windows-or-retail-license-key-1-us-off_7',
    'microsoft-office-microsoft-professional-plus-2024-and-windows-1011-professional-combo-pack-or1-userl-off_8',
    'microsoft-office-professional-plus-2021-and-windows-11-professional-combo-pack-or-1-userlifetime-val-off_14',
    'microsoft-office-2019-professional-plus-retail-license-key-for-windows-1-user-lifetime-validity-or-u-off_25',
    'microsoft-home-2024-for-macos-new-2025-edition-or-lifetime-license-or-1-user-or-supports-m1-m2-m3-m4-off_19',
    'autocad-software-3-year-subscription-1-user-3-devices-for-windows-macos-android-ios-m1-m2-all-origin-off_23',
    'canva-pro-lifetime-subscription-1-user-or-activates-on-your-canva-account-or-genuine-license-with-al-off_27',
];

// ── Slugs to EXCLUDE per context ──
// (Kept minimal since the curated list is already hand-picked)
const EXCLUSION_PATTERNS: Record<string, string[]> = {
    canva: ['canva'],
    autocad: ['autocad'],
    all: [],
};

function shouldExclude(slug: string, currentProduct: string): boolean {
    const patterns = EXCLUSION_PATTERNS[currentProduct] || [];
    return patterns.some((p) => slug.toLowerCase().includes(p));
}

// Generate a deterministic fake sold count (100–500) based on product ID
function getFakeSoldCount(id: string): number {
    let hash = 0;
    for (let i = 0; i < id.length; i++) hash = ((hash << 5) - hash + id.charCodeAt(i)) | 0;
    return 100 + Math.abs(hash) % 401; // 100–500
}

// ── Star rating component ──────────────────────────────────────────────────────
function StarRating({ rating }: { rating: number }) {
    return (
        <div className="flex items-center gap-0.5">
            {[1, 2, 3, 4, 5].map((star) => (
                <Star
                    key={star}
                    className={`w-3 h-3 ${star <= Math.round(rating) ? 'fill-[#FFA41C] text-[#FFA41C]' : 'text-[#D5D9D9]'}`}
                />
            ))}
            <span className="text-[10px] text-[#007185] font-medium ml-1">{rating.toFixed(1)}</span>
        </div>
    );
}

// ── Main component ─────────────────────────────────────────────────────────────
interface CrossSellBannerProps {
    /** The product context of the current page */
    currentProduct: string;
    /** Optional title override */
    title?: string;
    /** Max number of product cards to show (default 10) */
    maxItems?: number;
    /** Optional custom className for the outer wrapper */
    className?: string;
}

export function CrossSellBanner({
    currentProduct,
    title = 'Customers Also Bought from Us',
    maxItems = 10,
    className = '',
}: CrossSellBannerProps) {
    const scrollRef = useRef<HTMLDivElement>(null);
    const [canScrollLeft, setCanScrollLeft] = useState(false);
    const [canScrollRight, setCanScrollRight] = useState(false);
    const [products, setProducts] = useState<Product[]>([]);
    const [isLoadingProducts, setIsLoadingProducts] = useState(true);
    const [addingToCart, setAddingToCart] = useState<string | null>(null);

    const { addItem } = useCartStore();
    const { isAuthenticated } = useAuthStore();
    const router = useRouter();

    // Fetch curated products from the API
    useEffect(() => {
        const fetchProducts = async () => {
            try {
                const res = await fetch('/api/products?sortBy=bestseller&limit=50');
                const data = await res.json();

                if (data.success && data.data) {
                    const allProducts = data.data as Product[];
                    // Match against curated slugs, preserve order
                    const slugMap = new Map(allProducts.map((p) => [p.slug, p]));
                    const curated = CURATED_SLUGS
                        .map((slug) => slugMap.get(slug))
                        .filter((p): p is Product => !!p && !shouldExclude(p.slug, currentProduct))
                        .slice(0, maxItems);
                    setProducts(curated);
                }
            } catch (error) {
                console.error('Failed to fetch cross-sell products:', error);
            } finally {
                setIsLoadingProducts(false);
            }
        };

        fetchProducts();
    }, [currentProduct, maxItems]);

    const checkScroll = useCallback(() => {
        const el = scrollRef.current;
        if (!el) return;
        setCanScrollLeft(el.scrollLeft > 4);
        setCanScrollRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 4);
    }, []);

    useEffect(() => {
        checkScroll();
        const el = scrollRef.current;
        if (el) {
            el.addEventListener('scroll', checkScroll, { passive: true });
            window.addEventListener('resize', checkScroll);
        }
        return () => {
            el?.removeEventListener('scroll', checkScroll);
            window.removeEventListener('resize', checkScroll);
        };
    }, [products, checkScroll]);

    const handleAddToCart = async (e: React.MouseEvent, product: Product) => {
        e.preventDefault();
        e.stopPropagation();

        if (!isAuthenticated) {
            toast.error('Please login to add items to cart');
            router.push('/login');
            return;
        }

        setAddingToCart(product.id);
        try {
            const success = await addItem(product.id);
            if (success) {
                toast.success(`Added ${product.name} to cart`);
            } else {
                toast.error('Failed to add to cart');
            }
        } finally {
            setAddingToCart(null);
        }
    };

    if (isLoadingProducts) {
        return (
            <div className={`mt-6 ${className}`}>
                <div className="bg-black rounded-lg shadow-lg border border-[#222] p-8 flex items-center justify-center">
                    <Loader2 className="w-6 h-6 animate-spin text-[#FF9900]" />
                </div>
            </div>
        );
    }

    if (products.length === 0) return null;

    const scroll = (direction: 'left' | 'right') => {
        const el = scrollRef.current;
        if (!el) return;
        const cardWidth = 200;
        el.scrollBy({ left: direction === 'left' ? -cardWidth : cardWidth, behavior: 'smooth' });
    };

    return (
        <div className={`mt-6 ${className}`}>
            <div className="bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden">
                {/* Header */}
                <div className="px-4 py-3 border-b border-gray-200 flex items-center gap-2">
                    <ShoppingCart className="w-5 h-5 text-[#FF9900]" />
                    <h3 className="text-sm font-bold text-gray-900">{title}</h3>
                </div>

                {/* Scrollable product cards */}
                <div className="relative">
                    {/* Left arrow */}
                    {canScrollLeft && (
                        <button
                            onClick={() => scroll('left')}
                            className="absolute left-0 top-1/2 -translate-y-1/2 z-10 w-8 h-16 bg-white/95 border border-gray-300 rounded-r shadow-md flex items-center justify-center hover:bg-gray-50 transition-colors"
                            aria-label="Scroll left"
                        >
                            <ChevronLeft className="w-5 h-5 text-gray-700" />
                        </button>
                    )}

                    {/* Right arrow */}
                    {canScrollRight && (
                        <button
                            onClick={() => scroll('right')}
                            className="absolute right-0 top-1/2 -translate-y-1/2 z-10 w-8 h-16 bg-white/95 border border-gray-300 rounded-l shadow-md flex items-center justify-center hover:bg-gray-50 transition-colors"
                            aria-label="Scroll right"
                        >
                            <ChevronRight className="w-5 h-5 text-gray-700" />
                        </button>
                    )}

                    <div
                        ref={scrollRef}
                        className="flex gap-3 overflow-x-auto p-4 scrollbar-hide scroll-smooth"
                    >
                        {products.map((product) => {
                            const discountPercent = product.mrp > 0 ? Math.round(((product.mrp - product.price) / product.mrp) * 100) : 0;
                            const isAdding = addingToCart === product.id;

                            return (
                                <div
                                    key={product.id}
                                    className="flex-shrink-0 w-[180px] bg-white rounded-lg border border-gray-200 overflow-hidden hover:shadow-lg hover:border-[#FF9900] transition-all duration-300 group flex flex-col"
                                >
                                    {/* Product image */}
                                    <Link href={`/products/${product.slug}`} className="block">
                                        <div className="relative w-full aspect-square bg-gray-50 p-3 flex items-center justify-center overflow-hidden">
                                            {/* Discount badge */}
                                            {discountPercent > 20 && (
                                                <div className="absolute top-2 left-2 z-10 bg-red-600 text-white text-[10px] font-bold px-1.5 py-0.5 rounded shadow-sm">
                                                    -{discountPercent}%
                                                </div>
                                            )}

                                            {/* Bestseller badge */}
                                            {product.is_bestseller && (
                                                <div className="absolute top-2 right-2 z-10 bg-orange-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded shadow-sm flex items-center gap-0.5">
                                                    <Zap className="w-2.5 h-2.5 fill-current" />
                                                    Best
                                                </div>
                                            )}

                                            {product.main_image_url ? (
                                                <Image
                                                    src={product.main_image_url}
                                                    alt={product.name}
                                                    fill
                                                    className="object-contain p-2"
                                                    loading="lazy"
                                                    sizes="180px"
                                                />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center text-xs text-gray-400">
                                                    <ShoppingCart className="w-8 h-8 opacity-30" />
                                                </div>
                                            )}
                                        </div>
                                    </Link>

                                    {/* Info */}
                                    <div className="p-2.5 flex flex-col flex-1">
                                        <Link href={`/products/${product.slug}`} className="block flex-1">
                                            <p className="text-[13px] font-semibold text-gray-800 line-clamp-2 leading-snug mb-1 group-hover:text-[#FF9900] transition-colors">
                                                {product.name}
                                            </p>

                                            {product.avg_rating > 0 && (
                                                <StarRating rating={product.avg_rating} />
                                            )}

                                            <p className="text-[10px] text-green-600 font-medium mt-0.5 flex items-center gap-0.5">
                                                {getFakeSoldCount(product.id)}+ sold
                                            </p>

                                            {/* Prices */}
                                            <div className="mt-1.5 flex items-baseline gap-1.5 flex-wrap">
                                                <span className="text-sm font-bold text-[#B12704]">
                                                    ₹{product.price.toLocaleString('en-IN')}
                                                </span>
                                                {product.mrp > product.price && (
                                                    <span className="text-[10px] text-gray-400 line-through">
                                                        ₹{product.mrp.toLocaleString('en-IN')}
                                                    </span>
                                                )}
                                                <span className="text-[9px] font-bold text-red-600 bg-red-50 border border-red-200 px-1 py-0.5 rounded">Flash Deal</span>
                                            </div>
                                        </Link>

                                        {/* Action Buttons */}
                                        <div className="mt-2 space-y-1.5">
                                            {/* Add to Cart */}
                                            <button
                                                onClick={(e) => handleAddToCart(e, product)}
                                                disabled={isAdding || product.stock_quantity === 0}
                                                className="w-full py-1.5 bg-gradient-to-b from-[#FFD814] to-[#F7CA00] hover:from-[#F7CA00] hover:to-[#E7B800] disabled:from-gray-200 disabled:to-gray-300 text-[#0F1111] disabled:text-gray-500 text-[11px] font-bold rounded border border-[#FCD200] disabled:border-gray-300 transition-all disabled:cursor-not-allowed flex items-center justify-center gap-1"
                                            >
                                                {isAdding ? (
                                                    <Loader2 className="w-3 h-3 animate-spin" />
                                                ) : (
                                                    <>
                                                        <ShoppingCart className="w-3 h-3" />
                                                        Add to Cart
                                                    </>
                                                )}
                                            </button>

                                            {/* Buy Now */}
                                            <Link
                                                href={`/products/${product.slug}`}
                                                className="block w-full py-1.5 bg-gradient-to-b from-[#FF9900] to-[#E68A00] hover:from-[#FFa319] hover:to-[#FF9900] text-white text-[12px] font-bold rounded border border-[#FF9900] text-center transition-all shadow-sm shadow-orange-900/30"
                                            >
                                                Buy Now
                                            </Link>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Footer promo */}
                <div className="px-4 py-2.5 bg-gray-50 border-t border-gray-200 text-center">
                    <p className="text-[11px] text-gray-500">
                        Trusted by <span className="font-bold text-[#FF9900]">10,000+</span> customers on Amazon India
                        {' · '}
                        <span className="bg-[#FF9900] text-white font-bold px-2 py-0.5 rounded text-[10px] ml-1">Instant Digital Delivery</span>
                    </p>
                </div>
            </div>
        </div>
    );
}
