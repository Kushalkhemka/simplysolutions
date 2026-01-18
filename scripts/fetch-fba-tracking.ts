/**
 * Explore FBA Inbound API for tracking data
 */

import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const SP_API_CONFIG = {
    clientId: process.env.AMAZON_SP_CLIENT_ID!,
    clientSecret: process.env.AMAZON_SP_CLIENT_SECRET!,
    refreshToken: process.env.AMAZON_SP_REFRESH_TOKEN!,
    marketplaceId: process.env.AMAZON_SP_MARKETPLACE_ID || 'A21TJRUUN4KGV',
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
    const data = await response.json();
    return data.access_token;
}

// Get FBA Inbound Plans
async function getInboundPlans(accessToken: string) {
    const url = `${SP_API_CONFIG.endpoint}/inbound/fba/2024-03-20/inboundPlans`;

    const response = await fetch(url, {
        headers: { 'x-amz-access-token': accessToken }
    });

    const data = await response.json();
    return data.inboundPlans || [];
}

// Get Inbound Plan details (shipments, tracking)
async function getInboundPlanDetails(accessToken: string, planId: string) {
    const url = `${SP_API_CONFIG.endpoint}/inbound/fba/2024-03-20/inboundPlans/${planId}`;

    const response = await fetch(url, {
        headers: { 'x-amz-access-token': accessToken }
    });

    console.log(`   Plan details status: ${response.status}`);
    const text = await response.text();
    console.log(`   Response: ${text.substring(0, 1000)}`);
    return text;
}

// Get shipments for an inbound plan
async function getInboundShipments(accessToken: string, planId: string) {
    const url = `${SP_API_CONFIG.endpoint}/inbound/fba/2024-03-20/inboundPlans/${planId}/shipments`;

    const response = await fetch(url, {
        headers: { 'x-amz-access-token': accessToken }
    });

    console.log(`\n   Shipments status: ${response.status}`);
    const text = await response.text();
    console.log(`   Shipments: ${text}`);
    return text;
}

async function run() {
    console.log('🚀 FBA Inbound API Explorer');
    console.log('================================================================================\n');

    const accessToken = await getAccessToken();
    console.log('✅ Access token obtained\n');

    const plans = await getInboundPlans(accessToken);
    console.log(`📦 Found ${plans.length} inbound plans\n`);

    for (const plan of plans.slice(0, 3)) {
        console.log('─'.repeat(80));
        console.log(`📦 Inbound Plan: ${plan.inboundPlanId}`);
        console.log(`   Status: ${plan.status}`);
        console.log(`   Created: ${plan.createdAt}`);
        console.log(`   Name: ${plan.name || 'N/A'}`);

        // Get plan details
        console.log('\n   Getting plan details...');
        await getInboundPlanDetails(accessToken, plan.inboundPlanId);

        // Get shipments
        console.log('\n   Getting shipments...');
        await getInboundShipments(accessToken, plan.inboundPlanId);
    }

    console.log('\n================================================================================');
    console.log('Note: FBA Inbound is for shipments YOU send TO Amazon warehouses.');
    console.log('For tracking of orders shipped TO customers, check Seller Central or Reports API.');
}

run().catch(console.error);
