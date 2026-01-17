import { MetadataRoute } from 'next';
import { createClient } from '@/lib/supabase/server';
import { BLOG_POSTS } from '@/data/blog-posts';

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://simplysolutions.in';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
    const supabase = await createClient();

    // Static pages
    const staticPages: MetadataRoute.Sitemap = [
        {
            url: BASE_URL,
            lastModified: new Date(),
            changeFrequency: 'daily',
            priority: 1.0,
        },
        {
            url: `${BASE_URL}/products`,
            lastModified: new Date(),
            changeFrequency: 'daily',
            priority: 0.9,
        },
        {
            url: `${BASE_URL}/deals`,
            lastModified: new Date(),
            changeFrequency: 'daily',
            priority: 0.8,
        },
        {
            url: `${BASE_URL}/login`,
            lastModified: new Date(),
            changeFrequency: 'monthly',
            priority: 0.3,
        },
        {
            url: `${BASE_URL}/register`,
            lastModified: new Date(),
            changeFrequency: 'monthly',
            priority: 0.3,
        },
    ];

    // Fetch all active products
    const { data: products } = await supabase
        .from('products')
        .select('slug, updated_at')
        .eq('is_active', true);

    const productPages: MetadataRoute.Sitemap = (products || []).map((product) => ({
        url: `${BASE_URL}/products/${product.slug}`,
        lastModified: new Date(product.updated_at),
        changeFrequency: 'weekly' as const,
        priority: 0.8,
    }));

    // Fetch all active categories
    const { data: categories } = await supabase
        .from('categories')
        .select('slug, updated_at')
        .eq('is_active', true);

    const categoryPages: MetadataRoute.Sitemap = (categories || []).map((category) => ({
        url: `${BASE_URL}/categories/${category.slug}`,
        lastModified: new Date(category.updated_at),
        changeFrequency: 'weekly' as const,
        priority: 0.7,
    }));

    // Blog Post Pages
    const blogPages: MetadataRoute.Sitemap = BLOG_POSTS.map((post) => ({
        url: `${BASE_URL}/blog/${post.slug}`,
        lastModified: new Date(post.publishedAt),
        changeFrequency: 'monthly',
        priority: 0.7,
    }));

    return [...staticPages, ...productPages, ...categoryPages, ...blogPages];
}
