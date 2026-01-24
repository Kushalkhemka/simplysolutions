import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { isComboProduct, getComponentFSNs } from '@/lib/amazon/combo-products';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

interface LicenseResult {
    licenseKey: string;
    fsn: string;
    productName: string | null;
    productImage: string | null;
    downloadUrl: string | null;
    installationDoc: string | null;
}

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
                success: false,
                error: 'Invalid format. Please enter a 14-17 digit secret code OR Amazon Order ID.'
            }, { status: 400 });
        }

        const supabase = createClient(supabaseUrl, supabaseServiceKey);

        // Search in amazon_orders by order_id (works for both secret codes and amazon order IDs)
        const result = await supabase
            .from('amazon_orders')
            .select('id, order_id, fsn, license_key_id, fulfillment_type, quantity, warranty_status')
            .eq('order_id', cleanCode)
            .single();
        const order = result.data;
        const orderError = result.error;

        if (orderError || !order) {
            return NextResponse.json({
                success: false,
                error: isAmazonOrderId ? 'Amazon Order ID not found' : 'Secret code not found'
            }, { status: 404 });
        }

        // Check if order is BLOCKED
        if (order.warranty_status === 'BLOCKED') {
            return NextResponse.json({
                success: false,
                error: 'This order has been blocked. Please contact support for assistance.'
            }, { status: 403 });
        }

        // Get quantity from order (default to 1)
        const orderQuantity = order.quantity || 1;

        // Check if already has license keys assigned
        const { data: existingKeys } = await supabase
            .from('amazon_activation_license_keys')
            .select('license_key, fsn')
            .eq('order_id', cleanCode);

        if (existingKeys && existingKeys.length > 0) {
            // Already redeemed - return existing keys with product info
            const licenses: LicenseResult[] = [];

            for (const key of existingKeys) {
                const { data: productData } = await supabase
                    .from('products_data')
                    .select('product_title, download_link, installation_doc, product_image')
                    .eq('fsn', key.fsn)
                    .single();

                licenses.push({
                    licenseKey: key.license_key,
                    fsn: key.fsn,
                    productName: productData?.product_title || null,
                    productImage: productData?.product_image || null,
                    downloadUrl: productData?.download_link || null,
                    installationDoc: productData?.installation_doc
                        ? `/installation-docs/${productData.installation_doc}`
                        : null
                });
            }

            const orderIsCombo = order.fsn ? isComboProduct(order.fsn) : false;
            return NextResponse.json({
                success: true,
                alreadyRedeemed: true,
                isCombo: orderIsCombo,
                comboFsn: orderIsCombo ? order.fsn : undefined,
                orderQuantity,
                licenses
            });
        }

        // Get FSN from order
        const fsn = order.fsn;
        if (!fsn) {
            return NextResponse.json({ success: false, error: 'Product not configured. Please contact support.' }, { status: 404 });
        }

        // Check if this is a combo product
        const isCombo = isComboProduct(fsn);
        const componentFSNs = getComponentFSNs(fsn);

        // Calculate keys needed: quantity × number of components
        const keysPerComponent = orderQuantity;

        // Fetch keys for EACH component, quantity times
        const availableKeys: Array<{ id: string; license_key: string; fsn: string }> = [];

        for (const componentFSN of componentFSNs) {
            const { data: keys, error: keyError } = await supabase
                .from('amazon_activation_license_keys')
                .select('id, license_key, fsn')
                .eq('fsn', componentFSN)
                .is('order_id', null)
                .eq('is_redeemed', false)
                .limit(keysPerComponent);

            if (keyError || !keys || keys.length < keysPerComponent) {
                const available = keys?.length || 0;
                return NextResponse.json({
                    success: false,
                    error: `Not enough keys for ${componentFSN}. Need ${keysPerComponent}, only ${available} available.`,
                    missingComponent: componentFSN,
                    needed: keysPerComponent,
                    available
                }, { status: 404 });
            }

            availableKeys.push(...keys);
        }

        // Assign ALL keys to this order
        for (const key of availableKeys) {
            const { error: updateError } = await supabase
                .from('amazon_activation_license_keys')
                .update({
                    is_redeemed: true,
                    order_id: cleanCode,
                    redeemed_at: new Date().toISOString()
                })
                .eq('id', key.id);

            if (updateError) {
                console.error('Error updating license key:', updateError);
                return NextResponse.json({ success: false, error: 'Failed to assign license key' }, { status: 500 });
            }
        }

        // Update amazon_order with the first license key reference
        await supabase
            .from('amazon_orders')
            .update({ license_key_id: availableKeys[0].id })
            .eq('id', order.id);

        // Build license results with product info
        const licenses: LicenseResult[] = [];

        for (const key of availableKeys) {
            const { data: productData } = await supabase
                .from('products_data')
                .select('product_title, download_link, installation_doc, product_image')
                .eq('fsn', key.fsn)
                .single();

            licenses.push({
                licenseKey: key.license_key,
                fsn: key.fsn,
                productName: productData?.product_title || null,
                productImage: productData?.product_image || null,
                downloadUrl: productData?.download_link || null,
                installationDoc: productData?.installation_doc
                    ? `/installation-docs/${productData.installation_doc}`
                    : null
            });
        }

        return NextResponse.json({
            success: true,
            alreadyRedeemed: false,
            isCombo,
            comboFsn: isCombo ? fsn : undefined, // Original combo FSN for installation guide
            orderQuantity,
            fulfillmentType: order.fulfillment_type,
            licenses
        });

    } catch (error) {
        console.error('Error generating license key:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
