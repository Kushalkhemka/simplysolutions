// Query Amazon API to see actual order data
const orderId = '405-1833084-5542769';

async function checkAmazonAPI() {
    const response = await fetch('http://localhost:3000/api/n8n/verify-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId })
    });

    const data = await response.json();
    console.log('\n=== AMAZON API RESPONSE ===');
    console.log(JSON.stringify(data, null, 2));
}

checkAmazonAPI();
