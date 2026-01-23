import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { ProductCard } from '@/components/product/ProductCard';
import type { Metadata } from 'next';
import { CollectionJsonLd, BreadcrumbJsonLd } from '@/components/seo/JsonLd';

interface CategoryPageProps {
    params: Promise<{ slug: string }>;
}

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://simplysolutions.co.in';

export async function generateMetadata({ params }: CategoryPageProps): Promise<Metadata> {
    const { slug } = await params;
    const supabase = await createClient();

    const { data: category } = await supabase
        .from('categories')
        .select('name, description')
        .eq('slug', slug)
        .single();

    if (!category) return { title: 'Category Not Found' };

    const description = category.description || `Browse ${category.name} software licenses at SimplySolutions. Get genuine Microsoft products with instant digital delivery at best prices in India.`;

    return {
        title: `${category.name} - Buy Genuine Software Licenses`,
        description,
        keywords: [
            category.name,
            'software licenses',
            'genuine software',
            'Microsoft',
            'India',
            'instant delivery',
        ],
        openGraph: {
            title: `${category.name} - SimplySolutions`,
            description,
            type: 'website',
            url: `${BASE_URL}/categories/${slug}`,
        },
        twitter: {
            card: 'summary',
            title: `${category.name} - SimplySolutions`,
            description,
        },
        alternates: {
            canonical: `${BASE_URL}/categories/${slug}`,
        },
    };
}

export default async function CategoryPage({ params }: CategoryPageProps) {
    const { slug } = await params;
    const supabase = await createClient();

    // Fetch category
    const { data: category, error: categoryError } = await supabase
        .from('categories')
        .select('*')
        .eq('slug', slug)
        .eq('is_active', true)
        .single();

    if (categoryError || !category) {
        notFound();
    }

    // Fetch products in category
    const { data: products } = await supabase
        .from('products')
        .select('*')
        .eq('category_id', category.id)
        .eq('is_active', true)
        .order('is_bestseller', { ascending: false })
        .order('created_at', { ascending: false });

    // Breadcrumb items for JSON-LD
    const breadcrumbItems = [
        { name: 'Home', url: '/' },
        { name: 'Categories', url: '/products' },
        { name: category.name, url: `/categories/${category.slug}` },
    ];

    return (
        <>
            {/* JSON-LD Structured Data */}
            <CollectionJsonLd category={category} productCount={products?.length || 0} />
            <BreadcrumbJsonLd items={breadcrumbItems} />

            <div className="container mx-auto px-4 py-8">
                {/* Category Header */}
                <div className="mb-8">
                    <h1 className="text-3xl font-bold mb-2">{category.name}</h1>
                    {category.description && (
                        <p className="text-muted-foreground max-w-2xl">{category.description}</p>
                    )}
                    <p className="text-sm text-muted-foreground mt-2">
                        {products?.length || 0} products
                    </p>
                </div>

                {/* Products Grid */}
                {products && products.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                        {products.map((product: any) => (
                            <ProductCard key={product.id} product={product} />
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-16">
                        <p className="text-muted-foreground">No products in this category yet.</p>
                    </div>
                )}
            </div>
        </>
    );
}
