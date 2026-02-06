/**
 * Amazon SP-API Product Listings Checker
 * Fetches all listed products with descriptions from Amazon
 * 
 * Uses the Catalog Items API to get product details
 * https://developer-docs.amazon.com/sp-api/docs/catalog-items-api-v2022-04-01-reference
 */

import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

// Import ASIN map to get all our product ASINs
import { amazonAsinMap } from '../src/lib/data/amazonAsinMap';

const SP_API_CONFIG = {
    clientId: process.env.AMAZON_SP_CLIENT_ID!,
    clientSecret: process.env.AMAZON_SP_CLIENT_SECRET!,
    refreshToken: process.env.AMAZON_SP_REFRESH_TOKEN!,
    merchantToken: process.env.AMAZON_SP_MERCHANT_TOKEN! || 'AEPNW09XFGY8X',
    marketplaceId: process.env.AMAZON_SP_MARKETPLACE_ID || 'A21TJRUUN4KGV',
    // India is in EU region for SP-API
    endpoint: 'https://sellingpartnerapi-eu.amazon.com'
};

interface ProductInfo {
    asin: string;
    productKey: string;
    title?: string;
    description?: string;
    bulletPoints?: string[];
    brand?: string;
    manufacturer?: string;
    itemName?: string;
    error?: string;
}

async function getAccessToken(): Promise<string> {
    console.log('🔐 Getting access token...');

    const response = await fetch('https://api.amazon.com/auth/o2/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
            grant_type: 'refresh_token',
            refresh_token: SP_API_CONFIG.refreshToken,
            client_id: SP_API_CONFIG.clientId,
            client_secret: SP_API_CONFIG.clientSecret
        })
    });

    if (!response.ok) {
        const error = await response.text();
        throw new Error(`Failed to get access token: ${error}`);
    }

    const data = await response.json();
    console.log('✅ Access token obtained');
    return data.access_token;
}

async function fetchCatalogItem(accessToken: string, asin: string): Promise<any> {
    // Catalog Items API v2022-04-01
    // https://developer-docs.amazon.com/sp-api/docs/catalog-items-api-v2022-04-01-reference#getcatalogitem
    const url = new URL(`${SP_API_CONFIG.endpoint}/catalog/2022-04-01/items/${asin}`);
    url.searchParams.set('marketplaceIds', SP_API_CONFIG.marketplaceId);
    // Request all available attributes
    url.searchParams.set('includedData', 'attributes,identifiers,images,productTypes,summaries');

    const response = await fetch(url.toString(), {
        headers: {
            'x-amz-access-token': accessToken,
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        }
    });

    if (!response.ok) {
        const error = await response.text();
        console.error(`Error fetching ASIN ${asin}: ${response.status} - ${error.substring(0, 200)}`);
        return { error: `${response.status}: ${error.substring(0, 100)}` };
    }

    return await response.json();
}

async function fetchListingsItem(accessToken: string, sku: string): Promise<any> {
    // Listings Items API - Get your listing data
    // https://developer-docs.amazon.com/sp-api/docs/listings-items-api-v2021-08-01-reference
    const url = new URL(`${SP_API_CONFIG.endpoint}/listings/2021-08-01/items/${SP_API_CONFIG.merchantToken}/${encodeURIComponent(sku)}`);
    url.searchParams.set('marketplaceIds', SP_API_CONFIG.marketplaceId);
    url.searchParams.set('includedData', 'attributes,issues,summaries');

    const response = await fetch(url.toString(), {
        headers: {
            'x-amz-access-token': accessToken,
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        }
    });

    if (!response.ok) {
        const error = await response.text();
        return { error: `${response.status}: ${error.substring(0, 100)}` };
    }

    return await response.json();
}

async function getSellerListings(accessToken: string): Promise<any> {
    // Get all seller listings using Reports API
    // For a simpler approach, we'll use the Catalog Items API with our known ASINs
    console.log('\n📦 Fetching product details for all known ASINs...\n');

    const results: ProductInfo[] = [];
    const asins = Object.entries(amazonAsinMap);

    for (let i = 0; i < asins.length; i++) {
        const [productKey, asin] = asins[i];
        console.log(`[${i + 1}/${asins.length}] Fetching: ${productKey} (${asin})...`);

        try {
            const catalogData = await fetchCatalogItem(accessToken, asin);

            if (catalogData.error) {
                results.push({
                    asin,
                    productKey,
                    error: catalogData.error
                });
                continue;
            }

            const item = catalogData;
            const summary = item.summaries?.[0] || {};
            const attributes = item.attributes || {};

            // Extract product information
            const productInfo: ProductInfo = {
                asin,
                productKey,
                title: summary.itemName || attributes.item_name?.[0]?.value,
                brand: summary.brand || attributes.brand?.[0]?.value,
                manufacturer: summary.manufacturer || attributes.manufacturer?.[0]?.value,
                itemName: summary.itemName,
            };

            // Try to get bullet points
            if (attributes.bullet_point) {
                productInfo.bulletPoints = attributes.bullet_point.map((bp: any) => bp.value);
            }

            // Try to get product description
            if (attributes.product_description) {
                productInfo.description = attributes.product_description[0]?.value;
            } else if (attributes.generic_keyword) {
                // Sometimes description is stored in generic_keyword
                productInfo.description = attributes.generic_keyword.map((k: any) => k.value).join(' ');
            }

            results.push(productInfo);

            // Rate limiting - Amazon SP-API has rate limits
            await new Promise(resolve => setTimeout(resolve, 500));

        } catch (err: any) {
            results.push({
                asin,
                productKey,
                error: err.message
            });
        }
    }

    return results;
}

function printResults(products: ProductInfo[]) {
    console.log('\n' + '='.repeat(100));
    console.log('📋 PRODUCT LISTINGS REPORT');
    console.log('='.repeat(100));

    for (const product of products) {
        console.log('\n' + '-'.repeat(80));
        console.log(`🏷️  Product Key: ${product.productKey}`);
        console.log(`📦  ASIN: ${product.asin}`);
        console.log(`🔗  URL: https://www.amazon.in/dp/${product.asin}`);

        if (product.error) {
            console.log(`❌  Error: ${product.error}`);
            continue;
        }

        if (product.title) {
            console.log(`📝  Title: ${product.title}`);
        }
        if (product.brand) {
            console.log(`🏢  Brand: ${product.brand}`);
        }
        if (product.manufacturer) {
            console.log(`🏭  Manufacturer: ${product.manufacturer}`);
        }
        if (product.description) {
            console.log(`📄  Description: ${product.description.substring(0, 200)}${product.description.length > 200 ? '...' : ''}`);
        }
        if (product.bulletPoints && product.bulletPoints.length > 0) {
            console.log(`📌  Bullet Points:`);
            product.bulletPoints.forEach((bp, idx) => {
                console.log(`     ${idx + 1}. ${bp}`);
            });
        }
    }

    console.log('\n' + '='.repeat(100));
    console.log(`📊 Total Products: ${products.length}`);
    console.log(`✅ Successful: ${products.filter(p => !p.error).length}`);
    console.log(`❌ Errors: ${products.filter(p => p.error).length}`);
    console.log('='.repeat(100));
}

async function run() {
    console.log('🚀 Amazon SP-API - Product Listings Checker');
    console.log('='.repeat(80));
    console.log(`Seller ID: ${SP_API_CONFIG.merchantToken}`);
    console.log(`Marketplace: India (${SP_API_CONFIG.marketplaceId})`);
    console.log(`Products to check: ${Object.keys(amazonAsinMap).length}`);
    console.log('='.repeat(80));

    // Validate credentials
    if (!SP_API_CONFIG.clientId || !SP_API_CONFIG.clientSecret || !SP_API_CONFIG.refreshToken) {
        console.error('❌ Missing SP-API credentials in environment');
        console.log('Required: AMAZON_SP_CLIENT_ID, AMAZON_SP_CLIENT_SECRET, AMAZON_SP_REFRESH_TOKEN');
        process.exit(1);
    }

    try {
        const accessToken = await getAccessToken();
        const products = await getSellerListings(accessToken);
        printResults(products);

        // Also save to JSON file for reference
        const fs = await import('fs');
        const outputPath = './scripts/output/product-listings.json';

        // Create output directory if it doesn't exist
        fs.mkdirSync('./scripts/output', { recursive: true });
        fs.writeFileSync(outputPath, JSON.stringify(products, null, 2));
        console.log(`\n📁 Full results saved to: ${outputPath}`);

    } catch (error) {
        console.error('Fatal error:', error);
        process.exit(1);
    }
}

run();
