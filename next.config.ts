import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'm.media-amazon.com',
        pathname: '/images/**',
      },
      {
        protocol: 'https',
        hostname: 'images-na.ssl-images-amazon.com',
        pathname: '/images/**',
      },
      {
        protocol: 'https',
        hostname: '*.amazonaws.com',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
      {
        protocol: 'https',
        hostname: 'digitallicense.shop',
      },
      {
        protocol: 'https',
        hostname: 'supabase-supabase2.exxngc.easypanel.host',
      },
      {
        protocol: 'https',
        hostname: 'i.postimg.cc',
      },
      {
        protocol: 'https',
        hostname: '*.cdn.bubble.io',
      },
      {
        protocol: 'https',
        hostname: 'qcsdnlakugvnwlflhwpo.supabase.co',
        pathname: '/storage/**',
      },
      {
        protocol: 'https',
        hostname: 'api.simplysolutions.co.in',
        pathname: '/storage/**',
      },
    ],
  },
  // Performance optimizations
  experimental: {
    optimizePackageImports: ['lucide-react', 'framer-motion', 'date-fns'],
  },
  // Compiler options for smaller bundle size
  compiler: {
    // Remove console.logs in production
    removeConsole: process.env.NODE_ENV === 'production' ? { exclude: ['error', 'warn'] } : false,
  },
  // Disable X-Powered-By header
  poweredByHeader: false,
  // Redirects for short installation doc URLs
  async redirects() {
    return [
      {
        source: '/office365',
        destination: '/installation-docs/office365',
        permanent: true,
      },
      {
        source: '/office2024win',
        destination: '/installation-docs/office2024win',
        permanent: true,
      },
      {
        source: '/office2024-mac',
        destination: '/installation-docs/office2024mac',
        permanent: true,
      },
      {
        source: '/warranty',
        destination: '/digital-warranty',
        permanent: true,
      },
      {
        source: '/warranty_registration',
        destination: '/digital-warranty',
        permanent: true,
      },
      {
        source: '/register-warranty',
        destination: '/digital-warranty',
        permanent: true,
      },
      {
        source: '/admin-',
        destination: '/admin',
        permanent: true,
      },
      {
        source: '/get-cid',
        destination: '/getcid',
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
