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

        // Fetch ALL rows for this order ID (supports multi-item orders)
        const { data: orderRows, error: queryError } = await supabase
            .from('amazon_orders')
            .select('*')
            .eq('order_id', orderId.trim());

        const orders = orderRows || [];

        if (orders.length === 0) {
            return NextResponse.json({
                success: false,
                error: 'Order ID not found. Please check your Order ID and try again.'
            }, { status: 404 });
        }

        // Use first order row for shared checks
        const primaryOrder = orders[0];

        // CRITICAL: Check if order has been refunded
        if (orders.some(o => o.is_refunded === true)) {
            return NextResponse.json({
                success: false,
                error: 'This order has been refunded. Activation is not available for refunded orders. Please contact Amazon support for assistance.'
            }, { status: 403 });
        }

        // Check if order is BLOCKED
        if (orders.some(o => o.warranty_status === 'BLOCKED')) {
            return NextResponse.json({
                success: false,
                error: `This order has been blocked. Please contact support for assistance.\n\nIt may happen you have left a negative seller feedback. You need to remove that from amazon.in/hz/feedback and fill the appeal form after removal at simplysolutions.co.in/feedback-appeal/${orderId.trim()}`,
                isBlocked: true,
                feedbackUrl: 'https://www.amazon.in/hz/feedback',
                appealUrl: `https://simplysolutions.co.in/feedback-appeal/${orderId.trim()}`
            }, { status: 403 });
        }

        // Check FBA redemption eligibility
        const redemptionCheck = await checkFBARedemption(primaryOrder);
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

            const hasCombo = orders.some(o => o.fsn && isComboProduct(o.fsn));
            const comboFsn = orders.find(o => o.fsn && isComboProduct(o.fsn))?.fsn;
            const totalQuantity = orders.reduce((sum: number, o: any) => sum + (o.quantity || 1), 0);

            return NextResponse.json({
                success: true,
                alreadyRedeemed: true,
                isCombo: hasCombo,
                comboFsn: hasCombo ? comboFsn : undefined,
                orderQuantity: totalQuantity,
                licenses
            });
        }

        // Generate keys for ALL items in the order
        const allAvailableKeys: Array<{ id: string; license_key: string; fsn: string }> = [];
        const allComponentFSNs: string[] = [];

        for (const orderItem of orders) {
            const fsn = orderItem.fsn;

            if (!fsn) {
                continue; // Skip items with no FSN
            }

            const orderQuantity = orderItem.quantity || 1;
            const componentFSNs = getComponentFSNs(fsn);
            const keysPerComponent = orderQuantity;

            for (const componentFSN of componentFSNs) {
                allComponentFSNs.push(componentFSN);

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

                allAvailableKeys.push(...keys);
            }
        }

        if (allAvailableKeys.length === 0) {
            return NextResponse.json({
                success: false,
                error: 'Product not found. Please contact support.'
            }, { status: 404 });
        }

        // Assign ALL keys to this order
        for (const key of allAvailableKeys) {
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

        // Update each order item with its corresponding license key reference
        for (const orderItem of orders) {
            const matchingKey = allAvailableKeys.find(k => k.fsn === orderItem.fsn);
            if (matchingKey) {
                const { error: orderUpdateError } = await supabase
                    .from('amazon_orders')
                    .update({
                        confirmation_id: matchingKey.id,
                        license_key_id: matchingKey.id,
                        updated_at: new Date().toISOString()
                    })
                    .eq('id', orderItem.id);

                if (orderUpdateError) {
                    console.error('Error updating order with license key:', orderUpdateError);
                }
            }
        }

        // Check inventory levels and alert admins if low (async, don't block)
        const uniqueComponentFSNs = [...new Set(allComponentFSNs)];
        for (const componentFSN of uniqueComponentFSNs) {
            checkAndAlertLowInventory(componentFSN).catch(err =>
                console.error('Failed to check low inventory:', err)
            );
        }

        // Build license results with product info
        const licenses: LicenseResult[] = [];

        for (const key of allAvailableKeys) {
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

        const hasCombo = orders.some(o => o.fsn && isComboProduct(o.fsn));
        const comboFsn = orders.find(o => o.fsn && isComboProduct(o.fsn))?.fsn;
        const totalQuantity = orders.reduce((sum: number, o: any) => sum + (o.quantity || 1), 0);

        return NextResponse.json({
            success: true,
            alreadyRedeemed: false,
            isCombo: hasCombo,
            comboFsn: hasCombo ? comboFsn : undefined,
            orderQuantity: totalQuantity,
            fulfillmentType: primaryOrder.fulfillment_type || null,
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
