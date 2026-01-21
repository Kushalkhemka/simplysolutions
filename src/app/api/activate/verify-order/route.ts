import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

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
