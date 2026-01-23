'use client';

import Script from 'next/script';

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://simplysolutions.co.in';

interface Product {
    id: string;
    name: string;
    slug: string;
    price: number;
    main_image_url?: string;
}

interface ItemListJsonLdProps {
    products: Product[];
    listName?: string;
}

/**
 * ItemList JSON-LD for product listing pages
 * Helps Google understand the product collection and improves rich snippet chances
 */
export function ItemListJsonLd({ products, listName = 'Product List' }: ItemListJsonLdProps) {
    const schema = {
        '@context': 'https://schema.org',
        '@type': 'ItemList',
        name: listName,
        numberOfItems: products.length,
        itemListElement: products.map((product, index) => ({
            '@type': 'ListItem',
            position: index + 1,
            item: {
                '@type': 'Product',
                name: product.name,
                url: `${BASE_URL}/products/${product.slug}`,
                image: product.main_image_url,
                offers: {
                    '@type': 'Offer',
                    priceCurrency: 'INR',
                    price: product.price,
                    availability: 'https://schema.org/InStock',
                },
            },
        })),
    };

    return (
        <Script
            id="itemlist-jsonld"
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
            strategy="afterInteractive"
        />
    );
}
