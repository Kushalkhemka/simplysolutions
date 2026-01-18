import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export async function POST(request: NextRequest) {
    try {
        const { orderId } = await request.json();

        if (!orderId) {
            return NextResponse.json({ success: false, error: 'Order ID is required' }, { status: 400 });
        }

        // Use service role for full database access
        const supabase = createClient(supabaseUrl, supabaseServiceKey);

        // Look up the order
        const { data: order, error: orderError } = await supabase
            .from('amazon_orders')
            .select('*')
            .eq('order_id', orderId.trim())
            .single();

        if (orderError || !order) {
            return NextResponse.json({
                success: false,
                error: 'Order ID not found. Please check your Order ID and try again.'
            }, { status: 404 });
        }

        // Check if already has a license key assigned
        const { data: existingKey } = await supabase
            .from('amazon_activation_license_keys')
            .select('license_key, fsn, product_name, download_url')
            .eq('order_id', orderId.trim())
            .single();

        if (existingKey) {
            // Get product info from products_data using FSN
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
                    downloadUrl: productData?.download_link || null,
                    installationDoc: productData?.installation_doc ? `/installation-docs/${productData.installation_doc}` : null
                }
            });
        }

        // Get FSN from ASIN mapping (ASIN comes from the synced order)
        let fsn = order.fsn; // Order may already have FSN from sync

        if (order.asin && !fsn) {
            // Look up FSN from ASIN mapping
            const { data: asinMapping } = await supabase
                .from('amazon_asin_mapping')
                .select('fsn')
                .eq('asin', order.asin)
                .single();

            if (asinMapping) {
                fsn = asinMapping.fsn;
            }
        }

        if (!fsn) {
            return NextResponse.json({
                success: false,
                error: 'Product not found. Please contact support.'
            }, { status: 404 });
        }

        // Find an available license key for this FSN
        const { data: availableKey, error: keyError } = await supabase
            .from('amazon_activation_license_keys')
            .select('id, license_key, fsn')
            .eq('fsn', fsn)
            .is('order_id', null)
            .eq('is_redeemed', false)
            .limit(1)
            .single();

        if (keyError || !availableKey) {
            return NextResponse.json({
                success: false,
                error: 'No license keys available for this product. Please contact support.'
            }, { status: 503 });
        }

        // Assign the key to this order
        const { error: updateError } = await supabase
            .from('amazon_activation_license_keys')
            .update({
                order_id: orderId.trim(),
                is_redeemed: true
            })
            .eq('id', availableKey.id);

        if (updateError) {
            console.error('Error assigning key:', updateError);
            return NextResponse.json({
                success: false,
                error: 'Failed to assign license key. Please try again.'
            }, { status: 500 });
        }

        // Update amazon_orders with the license key reference
        const { error: orderUpdateError } = await supabase
            .from('amazon_orders')
            .update({
                confirmation_id: availableKey.id,
                license_key_id: availableKey.id,
                updated_at: new Date().toISOString()
            })
            .eq('order_id', orderId.trim());

        if (orderUpdateError) {
            console.error('Error updating order with license key:', orderUpdateError);
        }

        // Get product info from products_data using FSN
        const { data: productData } = await supabase
            .from('products_data')
            .select('product_title, download_link, installation_doc, product_image')
            .eq('fsn', fsn)
            .single();

        return NextResponse.json({
            success: true,
            alreadyRedeemed: false,
            licenseKey: availableKey.license_key,
            productInfo: {
                productName: productData?.product_title || 'Microsoft Office',
                productImage: productData?.product_image || null,
                downloadUrl: productData?.download_link || null,
                installationDoc: productData?.installation_doc ? `/installation-docs/${productData.installation_doc}` : null
            }
        });

    } catch (error) {
        console.error('Error generating FBA key:', error);
        return NextResponse.json({
            success: false,
            error: 'An error occurred while generating your license key'
        }, { status: 500 });
    }
}
