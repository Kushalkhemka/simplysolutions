import { MetadataRoute } from 'next';

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://simplysolutions.co.in';

export default function robots(): MetadataRoute.Robots {
    return {
        rules: [
            {
                userAgent: '*',
                allow: [
                    '/',
                    '/products',
                    '/products/*',
                    '/categories/*',
                    '/deals',
                    '/bundles',
                    '/installation-docs',
                    '/installation-docs/*',
                    '/activate',
                    '/getcid',
                    '/digital-warranty',
                    '/blog',
                    '/blog/*',
                ],
                disallow: [
                    '/admin/',
                    '/admin',
                    '/dashboard/',
                    '/api/',
                    '/checkout/',
                    '/cart',
                    '/_next/',
                    '/login',
                    '/register',
                    '/forgot-password',
                    '/reset-password',
                ],
            },
            {
                userAgent: 'Googlebot',
                allow: '/',
                disallow: [
                    '/admin/',
                    '/dashboard/',
                    '/api/',
                    '/checkout/',
                ],
            },
        ],
        sitemap: `${BASE_URL}/sitemap.xml`,
    };
}
