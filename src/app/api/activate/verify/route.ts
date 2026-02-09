import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { checkFBARedemption } from '@/lib/amazon/fba-redemption-check';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export async function POST(request: NextRequest) {
    try {
        const { secretCode } = await request.json();

        if (!secretCode) {
            return NextResponse.json({ error: 'Secret code is required' }, { status: 400 });
        }

        // Remove any spaces from the code
        const cleanCode = secretCode.replace(/\s/g, '');

        // Check if it's an Amazon Order ID format (XXX-XXXXXXX-XXXXXXX) or 14-17 digit secret code
        const isAmazonOrderId = /^\d{3}-\d{7}-\d{7}$/.test(cleanCode);
        const isSecretCode = /^\d{14,17}$/.test(cleanCode);

        if (!isAmazonOrderId && !isSecretCode) {
            return NextResponse.json({
                valid: false,
                error: 'Invalid format. Please enter a 14-17 digit secret code OR Amazon Order ID (e.g., 408-1234567-1234567).'
            }, { status: 400 });
        }

        const supabase = createClient(supabaseUrl, supabaseServiceKey);

        let order = null;

        // Search in amazon_orders by order_id (works for both secret codes and amazon order IDs)
        // Try exact match first
        const { data: exactMatch } = await supabase
            .from('amazon_orders')
            .select('id, order_id, fsn, license_key_id, fulfillment_type, warranty_status, is_refunded, fulfillment_status, order_date, created_at, state, early_appeal_status')
            .eq('order_id', cleanCode)
            .single();

        if (exactMatch) {
            order = exactMatch;
        } else {
            // Fallback: try case-insensitive search
            const { data: ilikeMatch } = await supabase
                .from('amazon_orders')
                .select('id, order_id, fsn, license_key_id, fulfillment_type, warranty_status, is_refunded, fulfillment_status, order_date, created_at, state, early_appeal_status')
                .ilike('order_id', cleanCode)
                .single();

            if (ilikeMatch) {
                order = ilikeMatch;
            }
        }

        if (!order) {
            console.error(`Order not found in verify: ${cleanCode}`);
            return NextResponse.json({
                valid: false,
                error: isAmazonOrderId
                    ? 'Amazon Order ID not found. Please check your order ID and try again.'
                    : 'Secret code not found. Please check your code and try again.'
            }, { status: 404 });
        }

        // Check if order is BLOCKED
        if (order.warranty_status === 'BLOCKED') {
            return NextResponse.json({
                valid: false,
                error: `This order has been blocked. Please contact support for assistance.\n\nIt may happen you have left a negative seller feedback. You need to remove that from amazon.in/hz/feedback and fill the appeal form after removal at simplysolutions.co.in/feedback-appeal/${cleanCode}`,
                isBlocked: true,
                feedbackUrl: 'https://www.amazon.in/hz/feedback',
                appealUrl: `https://simplysolutions.co.in/feedback-appeal/${cleanCode}`
            }, { status: 403 });
        }

        // CRITICAL: Check if order has been refunded
        if (order.is_refunded === true) {
            return NextResponse.json({
                valid: false,
                error: 'This order has been refunded. Activation is not available for refunded orders.'
            }, { status: 403 });
        }

        // Check FBA redemption eligibility (state delays, shipment status, etc.)
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
        if (order.license_key_id) {
            const { data: existingKey } = await supabase
                .from('amazon_activation_license_keys')
                .select('license_key, fsn')
                .eq('id', order.license_key_id)
                .single();

            // Get product info from products_data
            let productInfo = null;
            if (existingKey?.fsn) {
                const { data: productData } = await supabase
                    .from('products_data')
                    .select('product_title, download_link, installation_doc, product_image')
                    .eq('fsn', existingKey.fsn)
                    .single();

                if (productData) {
                    productInfo = {
                        productName: productData.product_title,
                        productImage: productData.product_image,
                        downloadUrl: productData.download_link,
                        installationDoc: productData.installation_doc ? `/installation-docs/${productData.installation_doc}` : null
                    };
                }
            }

            return NextResponse.json({
                valid: true,
                isAlreadyRedeemed: true,
                fsn: order.fsn,
                fulfillmentType: order.fulfillment_type,
                licenseKey: existingKey?.license_key || null,
                productInfo
            });
        }

        // For 365E5 orders, check if completed in office365_requests
        if (order.fsn && order.fsn.toUpperCase().startsWith('365E5')) {
            const { data: office365Request } = await supabase
                .from('office365_requests')
                .select('is_completed, generated_email, generated_password, first_name')
                .eq('order_id', cleanCode)
                .single();

            if (office365Request?.is_completed && office365Request.generated_email) {
                return NextResponse.json({
                    valid: true,
                    isAlreadyRedeemed: true,
                    fsn: order.fsn,
                    fulfillmentType: order.fulfillment_type,
                    licenseKey: `Microsoft 365 - ${office365Request.generated_email}`,
                    isSubscription: true,
                    is365Enterprise: true,
                    credentials: {
                        email: office365Request.generated_email,
                        password: office365Request.generated_password,
                        firstName: office365Request.first_name
                    }
                });
            }
        }

        // Get product info from products_data using FSN
        let productInfo = null;
        if (order.fsn) {
            const { data: productData } = await supabase
                .from('products_data')
                .select('product_title, download_link, installation_doc, product_image')
                .eq('fsn', order.fsn)
                .single();

            if (productData) {
                productInfo = {
                    productName: productData.product_title,
                    productImage: productData.product_image,
                    downloadUrl: productData.download_link,
                    installationDoc: productData.installation_doc ? `/installation-docs/${productData.installation_doc}` : null
                };
            }
        }

        return NextResponse.json({
            valid: true,
            isAlreadyRedeemed: false,
            fsn: order.fsn,
            fulfillmentType: order.fulfillment_type,
            productInfo
        });

    } catch (error) {
        console.error('Error verifying secret code:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
