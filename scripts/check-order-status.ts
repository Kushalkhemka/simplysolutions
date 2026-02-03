/**
 * Test Finances API to check for refunds on an order
 */

require('dotenv').config({ path: '.env.local' });

const SP_API_CONFIG = {
    clientId: process.env.AMAZON_SP_CLIENT_ID!,
    clientSecret: process.env.AMAZON_SP_CLIENT_SECRET!,
    refreshToken: process.env.AMAZON_SP_REFRESH_TOKEN!,
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
            client_secret: SP_API_CONFIG.clientSecret,
        }),
    });
    const data = await response.json();
    return data.access_token;
}

async function getTransactionsForOrder(accessToken: string, orderId: string) {
    const url = new URL(`${SP_API_CONFIG.endpoint}/finances/2024-06-19/transactions`);
    url.searchParams.set('relatedIdentifierName', 'ORDER_ID');
    url.searchParams.set('relatedIdentifierValue', orderId);

    const response = await fetch(url.toString(), {
        headers: { 'x-amz-access-token': accessToken },
    });

    return await response.json();
}

async function main() {
    const orderId = '403-6924204-0061935';

    console.log('Fetching access token...');
    const accessToken = await getAccessToken();
    console.log('Access token obtained!\n');

    console.log('='.repeat(80));
    console.log(`CHECKING TRANSACTIONS FOR ORDER: ${orderId}`);
    console.log('='.repeat(80));

    const result = await getTransactionsForOrder(accessToken, orderId);

    // Handle nested payload structure
    const transactions = result.payload?.transactions || result.transactions;

    if (transactions && transactions.length > 0) {
        console.log(`\nFound ${transactions.length} transaction(s):\n`);

        let hasRefund = false;

        for (const tx of transactions) {
            console.log(`📝 Transaction Type: ${tx.transactionType}`);
            console.log(`   Date: ${tx.postedDate}`);
            console.log(`   Total: ${tx.totalAmount?.currencyAmount} ${tx.totalAmount?.currencyCode}`);

            if (tx.relatedIdentifiers) {
                console.log(`   Related: ${tx.relatedIdentifiers.map((r: any) => `${r.relatedIdentifierName}=${r.relatedIdentifierValue}`).join(', ')}`);
            }

            // Check if this is a refund
            if (tx.transactionType?.toLowerCase().includes('refund')) {
                hasRefund = true;
                console.log('   ⚠️  THIS IS A REFUND TRANSACTION');
            }

            console.log('');
        }

        console.log('='.repeat(80));
        if (hasRefund) {
            console.log('🔴 ORDER HAS REFUND - Activation should be blocked');
        } else {
            console.log('🟢 No refund transactions found - Order is valid');
        }
    } else {
        console.log('No transactions found or error:', JSON.stringify(result, null, 2));
    }
}

main().catch(console.error);
