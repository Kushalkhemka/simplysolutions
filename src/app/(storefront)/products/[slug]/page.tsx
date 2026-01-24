import { notFound } from 'next/navigation';

import Link from 'next/link';
import Image from 'next/image';
import { getAmazonAsin, getAmazonProductUrl } from '@/lib/data/amazonAsinMap';
import { createClient } from '@/lib/supabase/server';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ProductCard } from '@/components/product/ProductCard';
import { AddToCartButton } from '@/components/product/AddToCartButton';
import {
    ShoppingCart,
    Heart,
    Share2,
    Check,
    Star,
    Shield,
    Truck,
    RefreshCw,
    FileText,
    Download
} from 'lucide-react';
import type { Metadata } from 'next';
import { FlashDealCountdown } from '@/components/product/FlashDealCountdown';
import { ProductGallery } from '@/components/product/ProductGallery';
import { ProductJsonLd, BreadcrumbJsonLd } from '@/components/seo/JsonLd';
import { AIRecommendations } from '@/components/product/AIRecommendations';
import { ProductFAQ } from '@/components/product/ProductFAQ';
import { RazorpayAffordabilityWidget } from '@/components/razorpay/RazorpayAffordabilityWidget';
import ProductReviews from '@/components/product/ProductReviews';

interface ProductPageProps {
    params: Promise<{ slug: string }>;
}

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://simplysolutions.co.in';

export async function generateMetadata({ params }: ProductPageProps): Promise<Metadata> {
    const { slug } = await params;
    const supabase = await createClient();

    const { data: product } = await supabase
        .from('products')
        .select('name, description, main_image_url, price, brand')
        .eq('slug', slug)
        .single();

    if (!product) return { title: 'Product Not Found' };

    const description = product.description?.slice(0, 160) || `Buy genuine ${product.name} license at best price in India. Instant digital delivery with lifetime validity.`;

    return {
        title: `${product.name} - Buy Genuine License`,
        description,
        keywords: [
            product.name,
            product.brand || 'Microsoft',
            'genuine license',
            'software key',
            'India',
            'instant delivery',
        ],
        openGraph: {
            title: `${product.name} - SimplySolutions`,
            description,
            type: 'website',
            url: `${BASE_URL}/products/${slug}`,
            images: product.main_image_url ? [
                {
                    url: product.main_image_url,
                    width: 800,
                    height: 600,
                    alt: product.name,
                },
            ] : [],
        },
        twitter: {
            card: 'summary_large_image',
            title: `${product.name} - SimplySolutions`,
            description,
            images: product.main_image_url ? [product.main_image_url] : [],
        },
        alternates: {
            canonical: `${BASE_URL}/products/${slug}`,
        },
    };
}

export default async function ProductPage({ params }: ProductPageProps) {
    const { slug } = await params;
    const supabase = await createClient();

    // Fetch product
    const { data: product, error } = await supabase
        .from('products')
        .select('*, category:categories(id, name, slug)')
        .eq('slug', slug)
        .eq('is_active', true)
        .single();

    if (error || !product) {
        notFound();
    }

    // Fetch reviews
    const { data: reviews } = await supabase
        .from('reviews')
        .select('*, user:profiles(id, full_name)')
        .eq('product_id', product.id)
        .eq('is_approved', true)
        .order('created_at', { ascending: false })
        .limit(5);

    // Fetch related products
    const { data: relatedProducts } = await supabase
        .from('products')
        .select('*')
        .eq('category_id', product.category_id)
        .neq('id', product.id)
        .eq('is_active', true)
        .limit(4);

    const discountPercent = Math.round(((product.mrp - product.price) / product.mrp) * 100);
    const allImages = Array.from(new Set([product.main_image_url, ...(product.image_urls || [])].filter(Boolean)));

    // Get Amazon ASIN for this product
    const amazonAsin = getAmazonAsin(product.name) || getAmazonAsin(product.slug);
    const amazonUrl = amazonAsin ? getAmazonProductUrl(amazonAsin) : null;

    // Prepare breadcrumb items for JSON-LD
    const breadcrumbItems = [
        { name: 'Home', url: '/' },
        { name: 'Products', url: '/products' },
        ...(product.category ? [{ name: (product.category as any).name, url: `/categories/${(product.category as any).slug}` }] : []),
        { name: product.name, url: `/products/${product.slug}` },
    ];

    return (
        <>
            {/* JSON-LD Structured Data */}
            <ProductJsonLd product={product} />
            <BreadcrumbJsonLd items={breadcrumbItems} />

            <div className="container mx-auto px-4 py-8 overflow-hidden" style={{ maxWidth: '100%' }}>
                {/* Breadcrumb */}
                <nav className="text-sm mb-6">
                    <ol className="flex items-center gap-2 flex-wrap">
                        <li><Link href="/" className="text-muted-foreground hover:text-foreground">Home</Link></li>
                        <li className="text-muted-foreground">/</li>
                        <li><Link href="/products" className="text-muted-foreground hover:text-foreground">Products</Link></li>
                        {product.category && (
                            <>
                                <li className="text-muted-foreground">/</li>
                                <li>
                                    <Link
                                        href={`/products?category=${(product.category as any).slug}`}
                                        className="text-muted-foreground hover:text-foreground"
                                    >
                                        {(product.category as any).name}
                                    </Link>
                                </li>
                            </>
                        )}
                        <li className="text-muted-foreground">/</li>
                        <li className="font-medium truncate max-w-[150px] sm:max-w-xs">{product.name}</li>
                    </ol>
                </nav>

                <div className="grid lg:grid-cols-2 gap-8 mb-12 max-w-full">
                    {/* Image Gallery */}
                    <ProductGallery
                        images={allImages}
                        productName={product.name}
                        discountPercent={discountPercent}
                        isBestseller={product.is_bestseller}
                    />

                    {/* Product Info */}
                    <div className="space-y-6 min-w-0 overflow-hidden" style={{ maxWidth: 'calc(100vw - 2rem)', wordBreak: 'break-word' }}>
                        <div>
                            <p className="text-primary font-medium mb-1">{product.brand}</p>
                            <h1 className="text-xl sm:text-2xl md:text-3xl font-bold mb-2 break-words">{product.name}</h1>

                            {/* Rating */}
                            {product.review_count > 0 && (
                                <div className="flex items-center gap-2 mb-4">
                                    <div className="flex items-center gap-1 bg-green-600 text-white px-2 py-0.5 rounded">
                                        <span className="font-medium">{product.avg_rating?.toFixed(1)}</span>
                                        <Star className="h-3 w-3 fill-current" />
                                    </div>
                                    <span className="text-muted-foreground">
                                        ({product.review_count} reviews)
                                    </span>
                                </div>
                            )}
                        </div>

                        {/* Price */}
                        <div className="p-4 bg-muted/50 rounded-lg">
                            <div className="flex flex-wrap items-baseline gap-2 sm:gap-3 mb-2">
                                <span className="text-2xl sm:text-3xl font-bold">₹{product.price.toLocaleString('en-IN')}</span>
                                {product.mrp > product.price && (
                                    <>
                                        <span className="text-lg sm:text-xl text-muted-foreground line-through">
                                            ₹{product.mrp.toLocaleString('en-IN')}
                                        </span>
                                        <Badge variant="destructive" className="text-xs">Save ₹{(product.mrp - product.price).toLocaleString('en-IN')}</Badge>
                                    </>
                                )}
                            </div>
                            <p className="text-sm text-muted-foreground">Inclusive of all taxes</p>

                            {/* Razorpay Affordability Widget - Shows EMI options */}
                            <RazorpayAffordabilityWidget amount={product.price} />
                        </div>

                        {/* Flash Deal Countdown */}
                        <FlashDealCountdown
                            endDate={new Date('2026-01-31T00:00:00')}
                            title="Flash Deal - Save Big!"
                        />

                        {/* Key Features */}
                        <div className="space-y-3">
                            <div className="flex items-center gap-3 text-sm">
                                <Truck className="h-5 w-5 text-green-600" />
                                <span><strong>Instant Delivery</strong> - Get your license key within minutes</span>
                            </div>
                            <div className="flex items-center gap-3 text-sm">
                                <Shield className="h-5 w-5 text-blue-600" />
                                <span><strong>100% Genuine</strong> - Authentic Microsoft license</span>
                            </div>
                            <div className="flex items-center gap-3 text-sm">
                                <RefreshCw className="h-5 w-5 text-purple-600" />
                                <span><strong>Lifetime Validity</strong> - No recurring fees</span>
                            </div>
                        </div>

                        {/* Bullet Points */}
                        {product.bullet_points && product.bullet_points.length > 0 && (
                            <div className="space-y-2 overflow-hidden">
                                <h3 className="font-semibold">Key Features:</h3>
                                <ul className="space-y-1 overflow-hidden">
                                    {(product.bullet_points as string[]).map((point: string, idx: number) => (
                                        <li key={idx} className="flex items-start gap-2 text-sm">
                                            <Check className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                                            <span className="break-all" style={{ wordBreak: 'break-word', overflowWrap: 'anywhere' }}>{point.replace(/^[✓✔☑✅\s]+/, '')}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}

                        {/* Specifications */}
                        <div className="grid grid-cols-2 gap-3 text-sm">
                            {product.edition && (
                                <div className="bg-muted/50 p-3 rounded">
                                    <p className="text-muted-foreground">Edition</p>
                                    <p className="font-medium">{product.edition}</p>
                                </div>
                            )}
                            <div className="bg-muted/50 p-3 rounded">
                                <p className="text-muted-foreground">License</p>
                                <p className="font-medium">{product.number_of_licenses} User</p>
                            </div>
                            <div className="bg-muted/50 p-3 rounded">
                                <p className="text-muted-foreground">Devices</p>
                                <p className="font-medium">{product.max_devices} Device(s)</p>
                            </div>
                            <div className="bg-muted/50 p-3 rounded">
                                <p className="text-muted-foreground">Validity</p>
                                <p className="font-medium">{product.subscription_term || 'Lifetime'}</p>
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="flex flex-col sm:flex-row flex-wrap gap-3">
                            <AddToCartButton
                                productId={product.id}
                                productName={product.name}
                                stockQuantity={product.stock_quantity}
                                className="flex-1 min-w-[140px]"
                            />
                            {amazonUrl && (
                                <a
                                    href={amazonUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex-1 min-w-[140px]"
                                >
                                    <Button
                                        size="lg"
                                        variant="outline"
                                        className="w-full gap-2 border-[#FF9900] hover:bg-[#FF9900]/10"
                                    >
                                        Order from
                                        <Image
                                            src="/images/Amazon_logo.svg.webp"
                                            alt="Amazon"
                                            width={70}
                                            height={21}
                                            className="object-contain translate-y-0.5"
                                        />
                                    </Button>
                                </a>
                            )}
                            <div className="flex gap-3">
                                <Button size="lg" variant="outline" className="flex-1 sm:flex-none">
                                    <Heart className="h-5 w-5" />
                                </Button>
                                <Button size="lg" variant="outline" className="flex-1 sm:flex-none">
                                    <Share2 className="h-5 w-5" />
                                </Button>
                            </div>
                        </div>

                        {/* Stock Status */}
                        <p className={`text-sm ${product.stock_quantity > 5 ? 'text-green-600' : 'text-amber-600'}`}>
                            {product.stock_quantity > 5
                                ? '✓ In Stock - Ready for instant delivery'
                                : product.stock_quantity > 0
                                    ? `⚠ Only ${product.stock_quantity} left`
                                    : '✕ Out of Stock'}
                        </p>

                        {/* Installation Guide Download */}
                        {product.installation_guide_url && (
                            <div className="mt-4 p-4 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950/30 dark:to-purple-950/30 rounded-lg border border-blue-200 dark:border-blue-800">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-primary/10 rounded-lg">
                                        <FileText className="h-6 w-6 text-primary" />
                                    </div>
                                    <div className="flex-1">
                                        <h4 className="font-semibold text-sm">Installation Guide</h4>
                                        <p className="text-xs text-muted-foreground">Step-by-step instructions included</p>
                                    </div>
                                    <a
                                        href={product.installation_guide_url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        download
                                    >
                                        <Button size="sm" variant="outline" className="gap-2">
                                            <Download className="h-4 w-4" />
                                            Download
                                        </Button>
                                    </a>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Description */}
                {product.description && (
                    <div className="mb-12">
                        <h2 className="text-xl font-bold mb-4">Description</h2>
                        <div
                            className="prose max-w-none text-muted-foreground"
                            dangerouslySetInnerHTML={{ __html: product.description }}
                        />
                    </div>
                )}

                {/* Product FAQs for SEO */}
                <div className="mt-12">
                    <ProductFAQ productName={product.name} />
                </div>

                {/* Customer Reviews - Amazon Style */}
                <div className="mb-12">
                    <ProductReviews
                        productId={product.id}
                        productName={product.name}
                    />
                </div>

                {/* Related Products */}
                {relatedProducts && relatedProducts.length > 0 && (
                    <div>
                        <h2 className="text-xl font-bold mb-4">Related Products</h2>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                            {relatedProducts.map((p) => (
                                <ProductCard key={p.id} product={p} />
                            ))}
                        </div>
                    </div>
                )}

                {/* AI Recommendations */}
                <div className="mt-12 border-t pt-8">
                    <AIRecommendations
                        currentProductId={product.id}
                        categoryId={product.category_id}
                        title="You Might Also Like"
                    />
                </div>
            </div>
        </>
    );
}
