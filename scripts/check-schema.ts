// Check database schema for push_subscriptions and amazon_orders tables
import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function checkSchema() {
    console.log('=== Checking Database Schema ===\n');

    // Check push_subscriptions columns
    console.log('--- push_subscriptions ---');
    const { data: pushCols, error: pushError } = await supabase.rpc('get_table_columns', {
        table_name: 'push_subscriptions'
    });

    if (pushError) {
        // Fallback: try direct query
        const { data: sample } = await supabase
            .from('push_subscriptions')
            .select('*')
            .limit(0);
        console.log('push_subscriptions columns:', Object.keys(sample || {}));
    } else {
        console.log('Columns:', pushCols);
    }

    // Check amazon_orders columns  
    console.log('\n--- amazon_orders ---');
    const { data: amazonCols, error: amazonError } = await supabase.rpc('get_table_columns', {
        table_name: 'amazon_orders'
    });

    if (amazonError) {
        // Fallback: select one row to see columns
        const { data: sample, error } = await supabase
            .from('amazon_orders')
            .select('*')
            .limit(1);
        if (sample && sample.length > 0) {
            console.log('amazon_orders columns:', Object.keys(sample[0]));
        } else {
            console.log('Could not fetch columns. Error:', error?.message);
        }
    } else {
        console.log('Columns:', amazonCols);
    }

    // Check if email_webhook_logs exists
    console.log('\n--- email_webhook_logs ---');
    const { data: webhookLogs, error: wlError } = await supabase
        .from('email_webhook_logs')
        .select('*')
        .limit(0);

    if (wlError) {
        console.log('Table does not exist:', wlError.message);
    } else {
        console.log('Table exists');
    }
}

checkSchema().catch(console.error);
