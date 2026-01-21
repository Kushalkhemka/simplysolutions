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

        // Check if it's an Amazon Order ID format (XXX-XXXXXXX-XXXXXXX) or 15-17 digit secret code
        const isAmazonOrderId = /^\d{3}-\d{7}-\d{7}$/.test(cleanCode);
        const isSecretCode = /^\d{15,17}$/.test(cleanCode);

        if (!isAmazonOrderId && !isSecretCode) {
            return NextResponse.json({
                success: false,
                error: 'Invalid format. Please enter a 15-17 digit secret code OR Amazon Order ID.'
            }, { status: 400 });
        }

        const supabase = createClient(supabaseUrl, supabaseServiceKey);

        let order = null;
        let orderError = null;

        if (isSecretCode) {
            // Look up order by secret code (stored as order_id for digital delivery)
            const result = await supabase
                .from('amazon_orders')
                .select('id, order_id, amazon_order_id, fsn, license_key_id, fulfillment_type')
                .eq('order_id', cleanCode)
                .single();
            order = result.data;
            orderError = result.error;
        } else {
            // Look up order by Amazon Order ID
            const result = await supabase
                .from('amazon_orders')
                .select('id, order_id, amazon_order_id, fsn, license_key_id, fulfillment_type')
                .eq('amazon_order_id', cleanCode)
                .single();
            order = result.data;
            orderError = result.error;
        }

        if (orderError || !order) {
            return NextResponse.json({
                success: false,
                error: isAmazonOrderId ? 'Amazon Order ID not found' : 'Secret code not found'
            }, { status: 404 });
        }

        // Check if already redeemed
        if (order.license_key_id) {
            const { data: existingKey } = await supabase
                .from('amazon_activation_license_keys')
                .select('license_key, fsn')
                .eq('id', order.license_key_id)
                .single();

            if (existingKey) {
                const { data: productData } = await supabase
                    .from('products_data')
                    .select('product_title, download_link, installation_doc, product_image')
                    .eq('fsn', existingKey.fsn)
                    .single();

                return NextResponse.json({
                    success: true,
                    alreadyRedeemed: true,
                    licenseKey: existingKey.license_key,
                    productInfo: {
                        productName: productData?.product_title || 'Microsoft Office',
                        productImage: productData?.product_image || null,
                        downloadUrl: productData?.download_link,
                        installationDoc: productData?.installation_doc ? `/installation-docs/${productData.installation_doc}` : null
                    }
                });
            }
        }

        // Get FSN from order
        const fsn = order.fsn;
        if (!fsn) {
            return NextResponse.json({ success: false, error: 'Product not configured. Please contact support.' }, { status: 404 });
        }

        // Find an available license key matching the FSN
        const { data: availableKey, error: keyError } = await supabase
            .from('amazon_activation_license_keys')
            .select('id, license_key, fsn')
            .eq('fsn', fsn)
            .eq('is_redeemed', false)
            .is('order_id', null)
            .limit(1)
            .single();

        if (keyError || !availableKey) {
            return NextResponse.json({
                success: false,
                error: 'No license keys available for this product. Please contact support.'
            }, { status: 404 });
        }

        // Mark the license key as redeemed and link to order
        const { error: updateKeyError } = await supabase
            .from('amazon_activation_license_keys')
            .update({
                is_redeemed: true,
                order_id: cleanCode
            })
            .eq('id', availableKey.id);

        if (updateKeyError) {
            console.error('Error updating license key:', updateKeyError);
            return NextResponse.json({ success: false, error: 'Failed to assign license key' }, { status: 500 });
        }

        // Update amazon_order with the license key reference
        await supabase
            .from('amazon_orders')
            .update({ license_key_id: availableKey.id })
            .eq('id', order.id);

        // Get product info
        const { data: productData } = await supabase
            .from('products_data')
            .select('product_title, download_link, installation_doc, product_image')
            .eq('fsn', fsn)
            .single();

        return NextResponse.json({
            success: true,
            alreadyRedeemed: false,
            licenseKey: availableKey.license_key,
            fulfillmentType: order.fulfillment_type,
            productInfo: {
                productName: productData?.product_title || 'Microsoft Office',
                productImage: productData?.product_image || null,
                downloadUrl: productData?.download_link,
                installationDoc: productData?.installation_doc ? `/installation-docs/${productData.installation_doc}` : null
            }
        });

    } catch (error) {
        console.error('Error generating license key:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
