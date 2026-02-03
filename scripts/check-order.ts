import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function checkOrder(orderId: string) {
    console.log(`\n🔍 Checking order: ${orderId}\n`);

    const { data, error } = await supabase
        .from('amazon_orders')
        .select('*')
        .eq('order_id', orderId)
        .single();

    if (error) {
        console.error('❌ Error:', error.message);
        return;
    }

    if (!data) {
        console.log('⚠️ Order not found in database');
        return;
    }

    console.log('✅ Order found:\n');
    console.log('📦 Order Details:');
    console.log('─'.repeat(50));
    console.log(`   Order ID:       ${data.order_id}`);
    console.log(`   FSN:            ${data.fsn || 'N/A'}`);
    console.log(`   Order Date:     ${data.order_date || 'N/A'}`);
    console.log(`   Order Total:    ${data.order_total} ${data.currency || 'INR'}`);
    console.log(`   Quantity:       ${data.quantity || 1}`);
    console.log(`   Fulfillment:    ${data.fulfillment_type}`);

    console.log('\n📧 Customer Info:');
    console.log('─'.repeat(50));
    console.log(`   Buyer Email:    ${data.buyer_email || 'N/A'}`);
    console.log(`   Contact Email:  ${data.contact_email || 'N/A'}`);

    console.log('\n📍 Shipping Address:');
    console.log('─'.repeat(50));
    console.log(`   City:           ${data.city || 'N/A'}`);
    console.log(`   State:          ${data.state || 'N/A'}`);
    console.log(`   Postal Code:    ${data.postal_code || 'N/A'}`);  // PINCODE
    console.log(`   Country:        ${data.country || 'N/A'}`);

    console.log('\n🔄 Status:');
    console.log('─'.repeat(50));
    console.log(`   Warranty:       ${data.warranty_status || 'N/A'}`);
    console.log(`   Synced At:      ${data.synced_at || 'N/A'}`);

    console.log('\n📋 Full Raw Data:');
    console.log('─'.repeat(50));
    console.log(JSON.stringify(data, null, 2));
}

checkOrder('402-1362587-2805137');
