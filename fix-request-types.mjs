import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !key) {
    console.error('Missing Supabase credentials');
    process.exit(1);
}

const supabase = createClient(url, key);

async function fixRequestTypes() {
    console.log('=== Fixing Missing Request Types ===\n');

    // Get all product requests with null request_type
    const { data: requests, error: fetchError } = await supabase
        .from('product_requests')
        .select('id, order_id, fsn, email, request_type')
        .is('request_type', null);

    if (fetchError) {
        console.error('Error fetching requests:', fetchError);
        return;
    }

    if (!requests || requests.length === 0) {
        console.log('No requests found with null request_type');
        return;
    }

    console.log(`Found ${requests.length} requests with null request_type\n`);

    // Update each request based on FSN
    let updated = 0;
    let failed = 0;

    for (const request of requests) {
        let requestType = 'other'; // default

        // Determine request type from FSN
        if (request.fsn) {
            const fsnUpper = request.fsn.toUpperCase();
            if (fsnUpper.startsWith('365E5') || fsnUpper.startsWith('365E')) {
                requestType = '365e5';
            } else if (fsnUpper.startsWith('CANVA')) {
                requestType = 'canva';
            } else if (fsnUpper.startsWith('AUTOCAD')) {
                requestType = 'autocad';
            } else if (fsnUpper.startsWith('REVIT')) {
                requestType = 'revit';
            } else if (fsnUpper.startsWith('FUSION360')) {
                requestType = 'fusion360';
            }
        }

        console.log(`Updating ${request.order_id} (FSN: ${request.fsn}) -> type: ${requestType}`);

        const { error: updateError } = await supabase
            .from('product_requests')
            .update({ request_type: requestType })
            .eq('id', request.id);

        if (updateError) {
            console.error(`  ❌ Failed: ${updateError.message}`);
            failed++;
        } else {
            console.log(`  ✅ Updated successfully`);
            updated++;
        }
    }

    console.log(`\n=== Summary ===`);
    console.log(`Total: ${requests.length}`);
    console.log(`Updated: ${updated}`);
    console.log(`Failed: ${failed}`);
}

fixRequestTypes();
