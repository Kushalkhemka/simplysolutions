import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { sendSubscriptionEmail } from '@/lib/email';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// POST /api/admin/test-emails - Send test subscription emails and clean invalid records
export async function POST(request: NextRequest) {
    try {
        const supabase = createClient(supabaseUrl, supabaseServiceKey);
        const results: any = { cleanup: {}, emails: {} };

        // 1. Delete product requests with request_type "other" (those not matching known FSNs)
        const { error: deleteOtherError, count: deletedOther } = await supabase
            .from('product_requests')
            .delete()
            .eq('request_type', 'other');

        results.cleanup.deletedOther = { count: deletedOther, error: deleteOtherError?.message };

        // 2. Delete product requests with email "NA"
        const { error: deleteNAError, count: deletedNA } = await supabase
            .from('product_requests')
            .delete()
            .eq('email', 'NA');

        results.cleanup.deletedNA = { count: deletedNA, error: deleteNAError?.message };

        // 3. Send AutoCAD test email
        const autocadResult = await sendSubscriptionEmail({
            to: 'kushalkhemka559@gmail.com',
            customerName: 'Kushal (Test)',
            orderId: 'TEST-AUTOCAD-001',
            fsn: 'AUTOCAD',
            subscriptionEmail: 'autocad-test@example.com'
        });
        results.emails.autocad = autocadResult;

        // 4. Send Canva test email
        const canvaResult = await sendSubscriptionEmail({
            to: 'kushalkhemka559@gmail.com',
            customerName: 'Kushal (Test)',
            orderId: 'TEST-CANVA-001',
            fsn: 'CANVA',
            subscriptionEmail: 'canva-test@example.com'
        });
        results.emails.canva = canvaResult;

        return NextResponse.json({
            success: true,
            message: 'Cleanup and test emails completed',
            results
        });
    } catch (error) {
        console.error('Test emails API error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
