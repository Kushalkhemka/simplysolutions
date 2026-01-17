import { MetadataRoute } from 'next';

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://simplysolutions.in';

export default function robots(): MetadataRoute.Robots {
    return {
        rules: [
            {
                userAgent: '*',
                allow: '/',
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
