import { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
    return {
        name: 'SimplySolutions - Genuine Software Licenses',
        short_name: 'SimplySolutions',
        description: 'Your trusted destination for genuine Microsoft software licenses. Windows, Office, and more with instant digital delivery.',
        start_url: '/',
        display: 'standalone',
        background_color: '#ffffff',
        theme_color: '#f97316',
        orientation: 'portrait-primary',
        icons: [
            {
                src: '/logo-icon.png',
                sizes: '192x192',
                type: 'image/png',
            },
            {
                src: '/logo-icon.png',
                sizes: '512x512',
                type: 'image/png',
            },
        ],
        categories: ['software', 'shopping', 'productivity'],
        lang: 'en-IN',
    };
}
