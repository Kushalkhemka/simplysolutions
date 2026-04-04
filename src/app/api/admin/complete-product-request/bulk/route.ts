import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { sendSubscriptionEmail } from '@/lib/email';
import { getSubscriptionConfig } from '@/lib/amazon/subscription-products';
import { notifyProductRequestStatus } from '@/lib/push/customer-notifications';
import { sendAutocadFulfilled, sendCanvaFulfilled } from '@/lib/whatsapp';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// POST - Bulk complete autocad/canva product requests
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { requestIds } = body;

        if (!requestIds || requestIds.length === 0) {
            return NextResponse.json({ error: 'No request IDs provided' }, { status: 400 });
        }

        // Fetch all the requests
        const { data: productRequests, error: fetchError } = await supabase
            .from('product_requests')
            .select('*')
            .in('id', requestIds)
            .eq('is_completed', false);

        if (fetchError) {
            console.error('Fetch error:', fetchError);
            return NextResponse.json({ error: 'Failed to fetch requests' }, { status: 500 });
        }

        if (!productRequests || productRequests.length === 0) {
            return NextResponse.json({
                success: true,
                message: 'No pending requests found',
                completed: 0,
                failed: 0
            });
        }

        // Filter to only autocad/canva requests
        const validRequests = productRequests.filter(r => {
            const type = r.request_type?.toLowerCase();
            return type === 'autocad' || type === 'canva';
        });

        if (validRequests.length === 0) {
            return NextResponse.json({
                success: true,
                message: 'No AutoCAD/Canva requests found in selection',
                completed: 0,
                failed: 0
            });
        }

        let completed = 0;
        let failed = 0;
        const errors: string[] = [];

        for (const productRequest of validRequests) {
            try {
                // Get FSN from product_requests or amazon_orders
                let fsn = productRequest.fsn;
                let customerPhone: string | null = null;
                if (productRequest.order_id) {
                    const { data: order } = await supabase
                        .from('amazon_orders')
                        .select('fsn, buyer_phone_number')
                        .eq('order_id', productRequest.order_id)
                        .maybeSingle();
                    if (order?.fsn) fsn = order.fsn;
                    customerPhone = order?.buyer_phone_number || null;
                }

                const subscriptionConfig = getSubscriptionConfig(fsn || '');
                const processedEmail = productRequest.email;
                const licenseKeyValue = `Subscription processed on ${processedEmail}`;

                // Mark as completed
                const { error: updateError } = await supabase
                    .from('product_requests')
                    .update({
                        is_completed: true,
                        completed_at: new Date().toISOString()
                    })
                    .eq('id', productRequest.id);

                if (updateError) {
                    failed++;
                    errors.push(`${productRequest.order_id || productRequest.id}: DB update failed`);
                    continue;
                }

                // Update amazon_orders
                if (productRequest.order_id) {
                    await supabase
                        .from('amazon_orders')
                        .update({
                            license_key: licenseKeyValue,
                            is_redeemed: true,
                            redeemed_at: new Date().toISOString()
                        })
                        .eq('order_id', productRequest.order_id);
                }

                // Send email notification
                if (subscriptionConfig) {
                    try {
                        await sendSubscriptionEmail({
                            to: processedEmail,
                            orderId: productRequest.order_id || productRequest.id,
                            fsn: fsn || '',
                            subscriptionEmail: processedEmail
                        });
                    } catch (emailErr) {
                        console.error(`Email failed for ${productRequest.order_id}:`, emailErr);
                    }
                }

                // Send push notification
                try {
                    await notifyProductRequestStatus(
                        productRequest.order_id || productRequest.id,
                        'fulfilled',
                        subscriptionConfig?.productName || 'your subscription',
                        processedEmail
                    );
                } catch (pushErr) {
                    console.error(`Push failed for ${productRequest.order_id}:`, pushErr);
                }

                // Send WhatsApp
                if (customerPhone && fsn) {
                    try {
                        const orderId = productRequest.order_id || productRequest.id;
                        if (fsn.toUpperCase().includes('AUTOCAD') || fsn.toUpperCase().includes('AUTODESK')) {
                            await sendAutocadFulfilled(customerPhone, orderId, processedEmail);
                        } else if (fsn.toUpperCase().includes('CANVA')) {
                            await sendCanvaFulfilled(customerPhone, orderId, processedEmail);
                        }
                    } catch (whatsappErr) {
                        console.error(`WhatsApp failed for ${productRequest.order_id}:`, whatsappErr);
                    }
                }

                completed++;

                // Rate limit
                await new Promise(resolve => setTimeout(resolve, 300));

            } catch (err: any) {
                failed++;
                errors.push(`${productRequest.order_id || productRequest.id}: ${err.message}`);
                console.error(`Failed to complete ${productRequest.order_id}:`, err);
            }
        }

        console.log(`[bulk-complete] ${completed} completed, ${failed} failed out of ${validRequests.length}`);

        return NextResponse.json({
            success: true,
            message: `Completed: ${completed}, Failed: ${failed}`,
            total: validRequests.length,
            completed,
            failed,
            errors: errors.length > 0 ? errors.slice(0, 10) : undefined
        });

    } catch (error: any) {
        console.error('Bulk complete error:', error);
        return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
    }
}
