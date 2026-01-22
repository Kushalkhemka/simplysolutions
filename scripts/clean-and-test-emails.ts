// Script to clean product requests and send test emails
// Run with: npx tsx scripts/clean-and-test-emails.ts

import { createClient } from '@supabase/supabase-js';
import { sendSubscriptionEmail } from '../src/lib/email';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function main() {
    console.log('=== Product Request Cleanup & Test Email Script ===\n');

    // 1. Delete product requests with type "OTHER" and email "NA"
    console.log('1. Deleting product requests with type="OTHER" and email="NA"...');

    // First, count how many we're deleting
    const { data: toDelete, error: countError } = await supabase
        .from('subscription_requests')
        .select('id, email, type')
        .or('type.eq.OTHER,email.eq.NA');

    if (countError) {
        console.error('Error counting records:', countError);
    } else {
        console.log(`Found ${toDelete?.length || 0} records to delete:`);
        toDelete?.forEach(r => console.log(`  - ID: ${r.id}, Email: ${r.email}, Type: ${r.type}`));
    }

    // Delete records with type=OTHER
    const { error: deleteOtherError, count: deletedOther } = await supabase
        .from('subscription_requests')
        .delete()
        .eq('type', 'OTHER');

    if (deleteOtherError) {
        console.error('Error deleting OTHER types:', deleteOtherError);
    } else {
        console.log(`✓ Deleted ${deletedOther || 'unknown'} records with type="OTHER"`);
    }

    // Delete records with email=NA
    const { error: deleteNAError, count: deletedNA } = await supabase
        .from('subscription_requests')
        .delete()
        .eq('email', 'NA');

    if (deleteNAError) {
        console.error('Error deleting NA emails:', deleteNAError);
    } else {
        console.log(`✓ Deleted ${deletedNA || 'unknown'} records with email="NA"`);
    }

    console.log('\n2. Sending test emails...\n');

    // 2. Send test email for AutoCAD
    console.log('Sending AutoCAD test email...');
    const autocadResult = await sendSubscriptionEmail({
        to: 'kushalkhemka559@gmail.com',
        customerName: 'Kushal (Test)',
        orderId: 'TEST-AUTOCAD-001',
        fsn: 'AUTOCAD',
        subscriptionEmail: 'test@example.com'
    });

    if (autocadResult.success) {
        console.log('✓ AutoCAD email sent successfully!', autocadResult.id);
    } else {
        console.error('✗ AutoCAD email failed:', autocadResult.error);
    }

    // 3. Send test email for Canva
    console.log('\nSending Canva test email...');
    const canvaResult = await sendSubscriptionEmail({
        to: 'kushalkhemka559@gmail.com',
        customerName: 'Kushal (Test)',
        orderId: 'TEST-CANVA-001',
        fsn: 'CANVA',
        subscriptionEmail: 'test@example.com'
    });

    if (canvaResult.success) {
        console.log('✓ Canva email sent successfully!', canvaResult.id);
    } else {
        console.error('✗ Canva email failed:', canvaResult.error);
    }

    console.log('\n=== Script completed ===');
}

main().catch(console.error);
