/**
 * Amazon SP-API Inventory Checker
 */

import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const SP_API_CONFIG = {
    clientId: process.env.AMAZON_SP_CLIENT_ID!,
    clientSecret: process.env.AMAZON_SP_CLIENT_SECRET!,
    refreshToken: process.env.AMAZON_SP_REFRESH_TOKEN!,
    merchantToken: process.env.AMAZON_SP_MERCHANT_TOKEN! || 'AEPNW09XFGY8X',
    marketplaceId: process.env.AMAZON_SP_MARKETPLACE_ID || 'A21TJRUUN4KGV',
    // India is in EU region for SP-API
    endpoint: 'https://sellingpartnerapi-eu.amazon.com'
};

async function getAccessToken(): Promise<string> {
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
    return data.access_token;
}

async function fetchInventory(accessToken: string): Promise<any> {
    // FBA Inventory Summaries
    // https://developer-docs.amazon.com/sp-api/docs/fba-inventory-api-v1-reference#getinventorysummaries
    const url = new URL(`${SP_API_CONFIG.endpoint}/fba/inventory/v1/summaries`);
    url.searchParams.set('granularityType', 'Marketplace');
    url.searchParams.set('granularityId', SP_API_CONFIG.marketplaceId);
    url.searchParams.set('marketplaceIds', SP_API_CONFIG.marketplaceId);

    console.log(`\nFetching FBA inventory summaries...`);
    console.log(`URL: ${url.toString()}`);

    const headers = {
        'x-amz-access-token': accessToken,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
    };

    const response = await fetch(url.toString(), { headers });

    console.log(`Response status: ${response.status}`);

    if (!response.ok) {
        const error = await response.text();
        console.error('SP-API Error Response:', error);
        throw new Error(`SP-API error: ${response.status}`);
    }

    const data = await response.json();
    return data.payload?.inventorySummaries || [];
}

async function run() {
    console.log('🚀 Amazon SP-API - Inventory Checker');
    console.log('================================================================================');
    console.log(`Seller ID: ${SP_API_CONFIG.merchantToken}`);
    console.log(`Marketplace: India (${SP_API_CONFIG.marketplaceId})`);
    console.log('================================================================================');

    try {
        console.log('\n🔐 Getting access token...');
        const accessToken = await getAccessToken();
        console.log('✅ Access token obtained');

        console.log('\n────────────────────────────────────────────────────────────────────────────────');
        console.log('METHOD 1: FBA Inventory API');
        console.log('────────────────────────────────────────────────────────────────────────────────');

        const inventory = await fetchInventory(accessToken);
        console.log(`\n✅ FBA Inventory found:`);
        console.log(JSON.stringify(inventory, null, 2));

    } catch (error) {
        console.error('Fatal error:', error);
    }
}

run();
