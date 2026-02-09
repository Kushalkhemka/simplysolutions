import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import { checkFBARedemption } from '@/lib/amazon/fba-redemption-check';

export async function POST(request: NextRequest) {
    try {
        const { orderId } = await request.json();

        if (!orderId) {
            return NextResponse.json({ valid: false, error: 'Order ID is required' }, { status: 400 });
        }

        const supabase = await createClient();

        // Look up the order in amazon_orders table
        const { data: order, error: orderError } = await supabase
            .from('amazon_orders')
            .select('*')
            .eq('order_id', orderId.trim())
            .single();

        if (orderError || !order) {
            return NextResponse.json({
                valid: false,
                error: 'Order ID not found. Please check your order ID and try again.'
            }, { status: 404 });
        }

        // CRITICAL: Check if order has been refunded (explicit check for safety)
        if (order.is_refunded === true) {
            return NextResponse.json({
                valid: false,
                error: 'This order has been refunded. Activation is not available for refunded orders.'
            }, { status: 403 });
        }

        // Check if order is BLOCKED
        if (order.warranty_status === 'BLOCKED') {
            return NextResponse.json({
                valid: false,
                error: `This order has been blocked. Please contact support for assistance.\n\nIt may happen you have left a negative seller feedback. You need to remove that from amazon.in/hz/feedback and fill the appeal form after removal at simplysolutions.co.in/feedback-appeal/${orderId.trim()}`,
                isBlocked: true,
                feedbackUrl: 'https://www.amazon.in/hz/feedback',
                appealUrl: `https://simplysolutions.co.in/feedback-appeal/${orderId.trim()}`
            }, { status: 403 });
        }

        // Check FBA redemption eligibility (pending orders, delivery delay, etc.)
        const redemptionCheck = await checkFBARedemption(order);
        if (!redemptionCheck.canRedeem) {
            return NextResponse.json({
                valid: false,
                error: redemptionCheck.reason,
                redeemableAt: redemptionCheck.redeemableAt?.toISOString(),
                daysRemaining: redemptionCheck.daysRemaining,
                canAppeal: redemptionCheck.canAppeal,
                appealStatus: redemptionCheck.appealStatus
            }, { status: 403 });
        }


        // Check if already redeemed (has license key assigned)
        const { data: licenseData } = await supabase
            .from('amazon_activation_license_keys')
            .select('license_key, fsn')
            .eq('order_id', orderId.trim())
            .single();

        if (licenseData) {
            // Get product info from products_data using FSN
            const { data: productData } = await supabase
                .from('products_data')
                .select('product_title, download_link, installation_doc, product_image')
                .eq('fsn', licenseData.fsn)
                .single();

            return NextResponse.json({
                valid: true,
                isAlreadyRedeemed: true,
                licenseKey: licenseData.license_key,
                productInfo: {
                    productName: productData?.product_title || 'Microsoft Office',
                    productImage: productData?.product_image || null,
                    downloadUrl: productData?.download_link,
                    installationDoc: productData?.installation_doc ? `/installation-docs/${productData.installation_doc}` : null
                }
            });
        }

        // Order is valid and not yet redeemed
        return NextResponse.json({
            valid: true,
            isAlreadyRedeemed: false,
            orderId: order.order_id,
            fsn: order.fsn,
            fulfillmentType: order.fulfillment_type || null
        });

    } catch (error) {
        console.error('Error verifying FBA order:', error);
        return NextResponse.json({
            valid: false,
            error: 'An error occurred while verifying your order'
        }, { status: 500 });
    }
}
