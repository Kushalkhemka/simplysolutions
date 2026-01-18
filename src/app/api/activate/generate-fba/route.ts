import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
    try {
        const { orderId } = await request.json();

        if (!orderId) {
            return NextResponse.json({ success: false, error: 'Order ID is required' }, { status: 400 });
        }

        const supabase = await createClient();

        // Look up the order
        const { data: order, error: orderError } = await supabase
            .from('amazon_orders')
            .select('*')
            .eq('order_id', orderId.trim())
            .single();

        if (orderError || !order) {
            return NextResponse.json({
                success: false,
                error: 'Order ID not found'
            }, { status: 404 });
        }

        // Check if already has a license key assigned
        const { data: existingKey } = await supabase
            .from('amazon_activation_license_keys')
            .select('license_key, sku')
            .eq('order_id', orderId.trim())
            .single();

        if (existingKey) {
            // Get product info
            const { data: productData } = await supabase
                .from('products')
                .select('name, images')
                .eq('sku', existingKey.sku)
                .single();

            return NextResponse.json({
                success: true,
                alreadyRedeemed: true,
                licenseKey: existingKey.license_key,
                productInfo: {
                    productName: productData?.name || 'Microsoft Office',
                    productImage: productData?.images?.[0] || null,
                    downloadUrl: null,
                    sku: existingKey.sku
                }
            });
        }

        // Find an available license key for this FSN/product
        const { data: availableKey, error: keyError } = await supabase
            .from('amazon_activation_license_keys')
            .select('id, license_key, sku')
            .is('order_id', null)
            .eq('is_assigned', false)
            .limit(1)
            .single();

        if (keyError || !availableKey) {
            return NextResponse.json({
                success: false,
                error: 'No license keys available. Please contact support.'
            }, { status: 503 });
        }

        // Assign the key to this order
        const { error: updateError } = await supabase
            .from('amazon_activation_license_keys')
            .update({
                order_id: orderId.trim(),
                is_assigned: true,
                assigned_at: new Date().toISOString()
            })
            .eq('id', availableKey.id);

        if (updateError) {
            console.error('Error assigning key:', updateError);
            return NextResponse.json({
                success: false,
                error: 'Failed to assign license key. Please try again.'
            }, { status: 500 });
        }

        // Get product info
        const { data: productData } = await supabase
            .from('products')
            .select('name, images')
            .eq('sku', availableKey.sku)
            .single();

        return NextResponse.json({
            success: true,
            alreadyRedeemed: false,
            licenseKey: availableKey.license_key,
            productInfo: {
                productName: productData?.name || 'Microsoft Office',
                productImage: productData?.images?.[0] || null,
                downloadUrl: null,
                sku: availableKey.sku
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
