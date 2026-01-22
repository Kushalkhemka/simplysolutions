import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

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
        let orderError = null;

        // Search in amazon_orders by order_id (works for both secret codes and amazon order IDs)
        const result = await supabase
            .from('amazon_orders')
            .select('id, order_id, fsn, license_key_id, fulfillment_type')
            .eq('order_id', cleanCode)
            .single();
        order = result.data;
        orderError = result.error;

        if (orderError || !order) {
            return NextResponse.json({
                valid: false,
                error: isAmazonOrderId
                    ? 'Amazon Order ID not found. Please check your order ID and try again.'
                    : 'Secret code not found. Please check your code and try again.'
            }, { status: 404 });
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
