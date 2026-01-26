import { Suspense } from 'react';
import { ProductCard } from '@/components/product/ProductCard';
import { SortSelect } from '@/components/product/SortSelect';
import { createClient } from '@/lib/supabase/server';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import Link from 'next/link';
import { ChevronLeft, ChevronRight, SlidersHorizontal } from 'lucide-react';
import type { Metadata } from 'next';
import { ItemListJsonLd } from '@/components/seo/ItemListJsonLd';

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://simplysolutions.co.in';

export const metadata: Metadata = {
    title: 'Buy Genuine Software Licenses Online India - Windows, Office & More',
    description: 'Shop genuine Microsoft software licenses at lowest prices in India. Buy Windows 11 Pro, Office 2024, Microsoft 365 with instant digital delivery. 100% authentic keys, lifetime validity & free support.',
    keywords: [
        'buy software online India',
        'genuine Microsoft licenses',
        'Windows 11 Pro license India',
        'Office 2024 product key',
        'Microsoft 365 subscription India',
        'cheap software license',
        'authentic Windows key',
        'Office license instant delivery',
        'software store India',
        'digital license shop',
    ],
    openGraph: {
        title: 'All Products - Genuine Software Licenses | SimplySolutions',
        description: 'Shop genuine Microsoft software licenses at lowest prices. Windows 11, Office 2024, Microsoft 365 with instant digital delivery in India.',
        type: 'website',
        url: `${BASE_URL}/products`,
        images: [{
            url: `${BASE_URL}/social-media-banner.png`,
            width: 1200,
            height: 630,
            alt: 'SimplySolutions - Genuine Software Licenses India',
        }],
    },
    twitter: {
        card: 'summary_large_image',
        title: 'All Products - SimplySolutions',
        description: 'Shop genuine Microsoft software licenses with instant digital delivery in India.',
        images: [`${BASE_URL}/social-media-banner.png`],
    },
    alternates: {
        canonical: `${BASE_URL}/products`,
    },
};

interface ProductsPageProps {
    searchParams: Promise<{
        category?: string;
        search?: string;
        sortBy?: string;
        page?: string;
        minPrice?: string;
        maxPrice?: string;
    }>;
}

export default async function ProductsPage({ searchParams }: ProductsPageProps) {
    const params = await searchParams;
    const supabase = await createClient();

    const page = parseInt(params.page || '1');
    const limit = 12;
    const offset = (page - 1) * limit;

    // Build query
    let query = supabase
        .from('products')
        .select('*, category:categories(id, name, slug)', { count: 'exact' })
        .eq('is_active', true);

    // Apply filters
    if (params.category) {
        const { data: cat } = await supabase
            .from('categories')
            .select('id')
            .eq('slug', params.category)
            .single();
        if (cat) {
            query = query.eq('category_id', cat.id);
        }
    }

    if (params.search) {
        query = query.or(`name.ilike.%${params.search}%,description.ilike.%${params.search}%`);
    }

    if (params.minPrice) {
        query = query.gte('price', parseFloat(params.minPrice));
    }

    if (params.maxPrice) {
        query = query.lte('price', parseFloat(params.maxPrice));
    }

    // Apply sorting
    switch (params.sortBy) {
        case 'price_asc':
            query = query.order('price', { ascending: true });
            break;
        case 'price_desc':
            query = query.order('price', { ascending: false });
            break;
        case 'rating':
            query = query.order('avg_rating', { ascending: false });
            break;
        case 'bestseller':
            query = query.order('sold_count', { ascending: false });
            break;
        case 'newest':
        default:
            query = query.order('created_at', { ascending: false });
    }

    // Apply pagination
    query = query.range(offset, offset + limit - 1);

    const { data: products, count } = await query;

    // Fetch categories for filter
    const { data: categories } = await supabase
        .from('categories')
        .select('id, name, slug')
        .eq('is_active', true)
        .order('display_order');

    const totalPages = Math.ceil((count || 0) / limit);

    // Build URL for pagination
    const buildUrl = (newPage: number) => {
        const url = new URLSearchParams();
        if (params.category) url.set('category', params.category);
        if (params.search) url.set('search', params.search);
        if (params.sortBy) url.set('sortBy', params.sortBy);
        if (params.minPrice) url.set('minPrice', params.minPrice);
        if (params.maxPrice) url.set('maxPrice', params.maxPrice);
        url.set('page', newPage.toString());
        return `/products?${url.toString()}`;
    };

    const currentCategory = categories?.find(c => c.slug === params.category);

    const listName = currentCategory?.name
        ? `${currentCategory.name} Software Licenses`
        : params.search
            ? `Search Results for "${params.search}"`
            : 'All Software Products';

    return (
        <>
            {/* JSON-LD Structured Data for Product List */}
            {products && products.length > 0 && (
                <ItemListJsonLd products={products} listName={listName} />
            )}

            <div className="container mx-auto px-4 py-8">
                {/* Breadcrumb */}
                <nav className="text-sm mb-6" aria-label="Breadcrumb">
                    <ol className="flex items-center gap-2">
                        <li><Link href="/" className="text-muted-foreground hover:text-foreground">Home</Link></li>
                        <li className="text-muted-foreground">/</li>
                        <li className="font-medium">
                            {currentCategory?.name || (params.search ? `Search: "${params.search}"` : 'All Products')}
                        </li>
                    </ol>
                </nav>

                {/* Mobile Category Filter - Horizontal Scrollable */}
                <div className="lg:hidden mb-4 -mx-4 px-4">
                    <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                        <Link
                            href="/products"
                            className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-colors ${!params.category ? 'bg-primary text-primary-foreground' : 'bg-muted hover:bg-muted/80'}`}
                        >
                            All
                        </Link>
                        {categories?.map((cat) => (
                            <Link
                                key={cat.id}
                                href={`/products?category=${cat.slug}`}
                                className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-colors whitespace-nowrap ${params.category === cat.slug ? 'bg-primary text-primary-foreground' : 'bg-muted hover:bg-muted/80'}`}
                            >
                                {cat.name}
                            </Link>
                        ))}
                    </div>
                </div>

                <div className="flex flex-col lg:flex-row gap-8">
                    {/* Sidebar Filters - Hidden on mobile, visible on lg+ */}
                    <aside className="hidden lg:block lg:w-64 flex-shrink-0">
                        <div className="sticky top-24 space-y-6">
                            <div>
                                <h3 className="font-semibold mb-3 flex items-center gap-2">
                                    <SlidersHorizontal className="h-4 w-4" />
                                    Filters
                                </h3>

                                {/* Categories */}
                                <div className="space-y-2">
                                    <p className="text-sm font-medium">Category</p>
                                    <div className="space-y-1">
                                        <Link
                                            href="/products"
                                            className={`block px-3 py-1.5 rounded text-sm transition-colors ${!params.category ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'}`}
                                        >
                                            All Categories
                                        </Link>
                                        {categories?.map((cat) => (
                                            <Link
                                                key={cat.id}
                                                href={`/products?category=${cat.slug}`}
                                                className={`block px-3 py-1.5 rounded text-sm transition-colors ${params.category === cat.slug ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'}`}
                                            >
                                                {cat.name}
                                            </Link>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            {/* Price Range */}
                            <div>
                                <p className="text-sm font-medium mb-2">Price Range</p>
                                <form className="space-y-2" action="/products" method="get">
                                    {params.category && <input type="hidden" name="category" value={params.category} />}
                                    {params.sortBy && <input type="hidden" name="sortBy" value={params.sortBy} />}
                                    <div className="flex gap-2">
                                        <Input type="number" name="minPrice" placeholder="Min" defaultValue={params.minPrice} className="w-full" />
                                        <Input type="number" name="maxPrice" placeholder="Max" defaultValue={params.maxPrice} className="w-full" />
                                    </div>
                                    <Button type="submit" variant="outline" size="sm" className="w-full">
                                        Apply
                                    </Button>
                                </form>
                            </div>
                        </div>
                    </aside>

                    {/* Main Content */}
                    <div className="flex-1">
                        {/* Header */}
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                            <div>
                                <h1 className="text-2xl font-bold">
                                    {currentCategory?.name || (params.search ? `Results for "${params.search}"` : 'All Products')}
                                </h1>
                                <p className="text-muted-foreground">
                                    {count} product{count !== 1 ? 's' : ''} found
                                </p>
                            </div>

                            <Suspense fallback={<div className="w-48 h-10 bg-muted rounded-md animate-pulse" />}>
                                <SortSelect currentSort={params.sortBy || 'newest'} />
                            </Suspense>
                        </div>

                        {/* Products Grid */}
                        {products && products.length > 0 ? (
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                                {products.map((product) => (
                                    <ProductCard key={product.id} product={product} />
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-16">
                                <p className="text-muted-foreground mb-4">No products found</p>
                                <Link href="/products">
                                    <Button variant="outline">View All Products</Button>
                                </Link>
                            </div>
                        )}

                        {/* Pagination */}
                        {totalPages > 1 && (
                            <div className="flex justify-center items-center gap-2 mt-8">
                                {page > 1 && (
                                    <Link href={buildUrl(page - 1)}>
                                        <Button variant="outline" size="sm">
                                            <ChevronLeft className="h-4 w-4" />
                                        </Button>
                                    </Link>
                                )}

                                <div className="flex items-center gap-1">
                                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                                        let pageNum;
                                        if (totalPages <= 5) {
                                            pageNum = i + 1;
                                        } else if (page <= 3) {
                                            pageNum = i + 1;
                                        } else if (page >= totalPages - 2) {
                                            pageNum = totalPages - 4 + i;
                                        } else {
                                            pageNum = page - 2 + i;
                                        }
                                        return (
                                            <Link key={pageNum} href={buildUrl(pageNum)}>
                                                <Button
                                                    variant={page === pageNum ? 'default' : 'outline'}
                                                    size="sm"
                                                >
                                                    {pageNum}
                                                </Button>
                                            </Link>
                                        );
                                    })}
                                </div>

                                {page < totalPages && (
                                    <Link href={buildUrl(page + 1)}>
                                        <Button variant="outline" size="sm">
                                            <ChevronRight className="h-4 w-4" />
                                        </Button>
                                    </Link>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </>
    );
}
