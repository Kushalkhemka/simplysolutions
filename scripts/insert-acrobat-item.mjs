// Simplified script to insert missing Acrobat item (skipping ASIN mapping since table doesn't exist)
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

const orderId = '405-1833084-5542769';
const acrobatFSN = 'ACROBAT2024'; // From products_data

async function insertMissingItem() {
    console.log('=== Step 1: Get existing order data ===');
    const { data: existingOrders } = await supabase
        .from('amazon_orders')
        .select('*')
        .eq('order_id', orderId);

    if (!existingOrders || existingOrders.length === 0) {
        console.error('No existing order found!');
        return;
    }

    console.log('Found', existingOrders.length, 'existing entry(ies)');
    existingOrders.forEach((o, i) => {
        console.log(`  Entry ${i + 1}: FSN=${o.fsn}`);
    });

    // Check if Acrobat already exists
    const hasAcrobat = existingOrders.some(o => o.fsn === acrobatFSN);
    if (hasAcrobat) {
        console.log('\n⚠️  Acrobat item already exists in database!');
        return;
    }

    console.log('\n=== Step 2: Insert missing Acrobat item ===');
    const existing = existingOrders[0];
    const missingItem = {
        order_id: orderId,
        fulfillment_type: existing.fulfillment_type,
        fsn: acrobatFSN,
        product_title: 'Acrobat Pro 2024 Full Version Software for Windows',
        quantity: 1,
        order_date: existing.order_date,
        order_total: 1427.62, // From Amazon API
        currency: 'INR',
        buyer_email: existing.buyer_email,
        contact_email: existing.contact_email,
        city: existing.city,
        state: existing.state,
        postal_code: existing.postal_code,
        country: existing.country,
        warranty_status: 'PENDING',
        synced_at: new Date().toISOString()
    };

    console.log('Inserting:', {
        order_id: missingItem.order_id,
        fsn: missingItem.fsn,
        product_title: missingItem.product_title
    });

    const { error: insertError } = await supabase
        .from('amazon_orders')
        .insert([missingItem]);

    if (insertError) {
        console.error('Error inserting item:', insertError);
        return;
    }

    console.log('✅ Successfully added missing Acrobat item!');

    console.log('\n=== Step 3: Verify final state ===');
    const { data: finalOrders } = await supabase
        .from('amazon_orders')
        .select('*')
        .eq('order_id', orderId)
        .order('created_at', { ascending: true });

    console.log('Final order entries:', finalOrders?.length);
    finalOrders?.forEach((o, i) => {
        console.log(`  Entry ${i + 1}: FSN=${o.fsn}, Product=${o.product_title || 'N/A'}`);
    });
}

insertMissingItem().catch(console.error);
