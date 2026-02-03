import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';
import { isComboProduct, getComponentFSNs } from '@/lib/amazon/combo-products';
import { checkAndAlertLowInventory } from '@/lib/push/admin-notifications';
import { checkFBARedemption } from '@/lib/amazon/fba-redemption-check';

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

        // Check if order is BLOCKED
        if (order.warranty_status === 'BLOCKED') {
            return NextResponse.json({
                success: false,
                error: 'This order has been blocked. Please contact support for assistance.'
            }, { status: 403 });
        }

        // Check FBA redemption eligibility (pending orders, delivery delay, etc.)
        const redemptionCheck = await checkFBARedemption(order);
        if (!redemptionCheck.canRedeem) {
            return NextResponse.json({
                success: false,
                error: redemptionCheck.reason,
                redeemableAt: redemptionCheck.redeemableAt?.toISOString(),
                daysRemaining: redemptionCheck.daysRemaining,
                canAppeal: redemptionCheck.canAppeal,
                appealStatus: redemptionCheck.appealStatus
            }, { status: 403 });
        }


        // Get quantity from order (default to 1)
        const orderQuantity = order.quantity || 1;

        // Check if already has license keys assigned
        const { data: existingKeys } = await supabase
            .from('amazon_activation_license_keys')
            .select('license_key, fsn')
            .eq('order_id', orderId.trim());

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

            return NextResponse.json({
                success: true,
                alreadyRedeemed: true,
                isCombo: isComboProduct(order.fsn),
                comboFsn: isComboProduct(order.fsn) ? order.fsn : undefined,
                orderQuantity,
                licenses
            });
        }

        // Get FSN from order
        let fsn = order.fsn;

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

        // Check if this is a combo product
        const isCombo = isComboProduct(fsn);
        const componentFSNs = getComponentFSNs(fsn);

        // Calculate total keys needed: quantity × number of components
        // e.g., qty=5 for WIN11-PP24 = 5 Windows + 5 Office = 10 keys
        const keysPerComponent = orderQuantity;

        // Fetch keys for EACH component, quantity times
        const availableKeys: Array<{ id: string; license_key: string; fsn: string }> = [];

        for (const componentFSN of componentFSNs) {
            // Fetch 'keysPerComponent' keys for this FSN
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
                    needsContactInfo: true,
                    error: `Not enough license keys for ${componentFSN}. Need ${keysPerComponent}, only ${available} available.`,
                    orderId: orderId.trim(),
                    fsn: fsn,
                    missingComponent: componentFSN,
                    needed: keysPerComponent,
                    available
                }, { status: 503 });
            }

            availableKeys.push(...keys);
        }

        // Assign ALL keys to this order
        for (const key of availableKeys) {
            const { error: updateError } = await supabase
                .from('amazon_activation_license_keys')
                .update({
                    order_id: orderId.trim(),
                    is_redeemed: true,
                    redeemed_at: new Date().toISOString()
                })
                .eq('id', key.id);

            if (updateError) {
                console.error('Error assigning key:', updateError);
                return NextResponse.json({
                    success: false,
                    error: 'Failed to assign license key. Please try again.'
                }, { status: 500 });
            }
        }

        // Update amazon_orders with the first license key reference (for compatibility)
        const { error: orderUpdateError } = await supabase
            .from('amazon_orders')
            .update({
                confirmation_id: availableKeys[0].id,
                license_key_id: availableKeys[0].id,
                updated_at: new Date().toISOString()
            })
            .eq('order_id', orderId.trim());

        if (orderUpdateError) {
            console.error('Error updating order with license key:', orderUpdateError);
        }

        // Check inventory levels and alert admins if low (async, don't block)
        for (const componentFSN of componentFSNs) {
            checkAndAlertLowInventory(componentFSN).catch(err =>
                console.error('Failed to check low inventory:', err)
            );
        }

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
            comboFsn: isCombo ? fsn : undefined,
            orderQuantity,
            fulfillmentType: order.fulfillment_type || null,
            licenses
        });

    } catch (error) {
        console.error('Error generating FBA key:', error);
        return NextResponse.json({
            success: false,
            error: 'An error occurred while generating your license key'
        }, { status: 500 });
    }
}
