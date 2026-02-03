import * as fs from 'fs';
import * as path from 'path';

// Read .env.local manually
const envPath = path.join(process.cwd(), '.env.local');
const envContent = fs.readFileSync(envPath, 'utf-8');
const env: Record<string, string> = {};
envContent.split('\n').forEach(line => {
    const match = line.match(/^([^=]+)=(.*)$/);
    if (match) {
        env[match[1].trim()] = match[2].trim().replace(/^["']|["']$/g, '');
    }
});

const clientId = env.AMAZON_SP_CLIENT_ID;
const clientSecret = env.AMAZON_SP_CLIENT_SECRET;
const refreshToken = env.AMAZON_SP_REFRESH_TOKEN;

async function testAPIs() {
    console.log('Testing Amazon SP-API...');

    const merchantToken = env.AMAZON_SP_MERCHANT_TOKEN || 'AEPNW09XFGY8X';
    console.log('Merchant Token:', merchantToken);

    // Get access token
    const tokenResponse = await fetch('https://api.amazon.com/auth/o2/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
            grant_type: 'refresh_token',
            refresh_token: refreshToken!,
            client_id: clientId!,
            client_secret: clientSecret!,
        }),
    });

    const tokenData = await tokenResponse.json();
    if (!tokenData.access_token) {
        console.log('Token error:', tokenData);
        process.exit(1);
    }
    console.log('✓ Got access token');

    // Try Sellers API (simpler endpoint)
    console.log('\nTrying Sellers API (getMarketplaceParticipations)...');
    const sellersResponse = await fetch('https://sellingpartnerapi-eu.amazon.com/sellers/v1/marketplaceParticipations', {
        method: 'GET',
        headers: {
            'x-amz-access-token': tokenData.access_token,
            'Content-Type': 'application/json',
        },
    });
    console.log('Sellers API status:', sellersResponse.status);
    const sellersData = await sellersResponse.json();
    console.log('Response:', JSON.stringify(sellersData, null, 2).slice(0, 800));

    // Try Orders API with seller ID parameter
    console.log('\nTrying Orders API...');
    const ordersResponse = await fetch(`https://sellingpartnerapi-eu.amazon.com/orders/v0/orders?MarketplaceIds=A21TJRUUN4KGV&CreatedAfter=2025-01-01T00:00:00Z&MaxResultsPerPage=5`, {
        method: 'GET',
        headers: {
            'x-amz-access-token': tokenData.access_token,
            'Content-Type': 'application/json',
        },
    });
    console.log('Orders API status:', ordersResponse.status);
    const ordersData = await ordersResponse.json();
    console.log('Response:', JSON.stringify(ordersData, null, 2).slice(0, 800));
}

testAPIs();
