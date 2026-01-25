import Script from 'next/script';

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://simplysolutions.co.in';

// Organization Schema
export function OrganizationJsonLd() {
    const schema = {
        '@context': 'https://schema.org',
        '@type': 'Organization',
        name: 'SimplySolutions',
        url: BASE_URL,
        logo: `${BASE_URL}/logo.png`,
        description: 'India\'s trusted destination for genuine Microsoft software licenses with instant digital delivery.',
        email: 'support@simplysolutions.co.in',
        telephone: '+91-8178848830',
        address: {
            '@type': 'PostalAddress',
            addressCountry: 'IN',
            addressLocality: 'India',
        },
        sameAs: [
            'https://wa.me/918178848830',
        ],
        contactPoint: {
            '@type': 'ContactPoint',
            telephone: '+91-8178848830',
            contactType: 'customer service',
            availableLanguage: ['English', 'Hindi'],
            areaServed: 'IN',
        },
        priceRange: '₹₹',
    };

    return (
        <Script
            id="organization-jsonld"
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
            strategy="afterInteractive"
        />
    );
}

// WebSite Schema with SearchAction
export function WebSiteJsonLd() {
    const schema = {
        '@context': 'https://schema.org',
        '@type': 'WebSite',
        name: 'SimplySolutions',
        url: BASE_URL,
        description: 'Your trusted destination for genuine Microsoft software licenses.',
        potentialAction: {
            '@type': 'SearchAction',
            target: {
                '@type': 'EntryPoint',
                urlTemplate: `${BASE_URL}/search?q={search_term_string}`,
            },
            'query-input': 'required name=search_term_string',
        },
    };

    return (
        <Script
            id="website-jsonld"
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
            strategy="afterInteractive"
        />
    );
}

// Product Schema
interface ProductJsonLdProps {
    product: {
        name: string;
        description?: string;
        slug: string;
        price: number;
        mrp: number;
        main_image_url?: string;
        image_urls?: string[];
        brand?: string;
        sku?: string;
        stock_quantity?: number;
        avg_rating?: number;
        review_count?: number;
    };
}

export function ProductJsonLd({ product }: ProductJsonLdProps) {
    const images = [product.main_image_url, ...(product.image_urls || [])].filter(Boolean);

    const schema: Record<string, any> = {
        '@context': 'https://schema.org',
        '@type': 'Product',
        name: product.name,
        description: product.description,
        image: images,
        url: `${BASE_URL}/products/${product.slug}`,
        sku: product.sku,
        brand: {
            '@type': 'Brand',
            name: product.brand || 'Microsoft',
        },
        offers: {
            '@type': 'Offer',
            url: `${BASE_URL}/products/${product.slug}`,
            priceCurrency: 'INR',
            price: product.price,
            priceValidUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            availability: product.stock_quantity && product.stock_quantity > 0
                ? 'https://schema.org/InStock'
                : 'https://schema.org/OutOfStock',
            seller: {
                '@type': 'Organization',
                name: 'SimplySolutions',
            },
        },
    };

    // Add aggregate rating if reviews exist
    if (product.avg_rating && product.review_count && product.review_count > 0) {
        schema.aggregateRating = {
            '@type': 'AggregateRating',
            ratingValue: product.avg_rating,
            reviewCount: product.review_count,
            bestRating: 5,
            worstRating: 1,
        };
    }

    return (
        <Script
            id="product-jsonld"
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
            strategy="afterInteractive"
        />
    );
}

// BreadcrumbList Schema
interface BreadcrumbItem {
    name: string;
    url: string;
}

interface BreadcrumbJsonLdProps {
    items: BreadcrumbItem[];
}

export function BreadcrumbJsonLd({ items }: BreadcrumbJsonLdProps) {
    const schema = {
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: items.map((item, index) => ({
            '@type': 'ListItem',
            position: index + 1,
            name: item.name,
            item: item.url.startsWith('http') ? item.url : `${BASE_URL}${item.url}`,
        })),
    };

    return (
        <Script
            id="breadcrumb-jsonld"
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
            strategy="afterInteractive"
        />
    );
}

// CollectionPage Schema for Category pages
interface CollectionJsonLdProps {
    category: {
        name: string;
        description?: string;
        slug: string;
    };
    productCount: number;
}

export function CollectionJsonLd({ category, productCount }: CollectionJsonLdProps) {
    const schema = {
        '@context': 'https://schema.org',
        '@type': 'CollectionPage',
        name: category.name,
        description: category.description || `Browse ${category.name} software licenses at SimplySolutions`,
        url: `${BASE_URL}/categories/${category.slug}`,
        numberOfItems: productCount,
        mainEntity: {
            '@type': 'ItemList',
            numberOfItems: productCount,
        },
    };

    return (
        <Script
            id="collection-jsonld"
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
            strategy="afterInteractive"
        />
    );
}

// FAQ Schema
interface FAQItem {
    question: string;
    answer: string;
}

interface FAQJsonLdProps {
    items: FAQItem[];
}

export function FAQJsonLd({ items }: FAQJsonLdProps) {
    const schema = {
        '@context': 'https://schema.org',
        '@type': 'FAQPage',
        mainEntity: items.map((item) => ({
            '@type': 'Question',
            name: item.question,
            acceptedAnswer: {
                '@type': 'Answer',
                text: item.answer,
            },
        })),
    };

    return (
        <Script
            id="faq-jsonld"
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
            strategy="afterInteractive"
        />
    );
}
