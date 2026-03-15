import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
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

        // Fetch ALL rows for this order ID (supports multi-item orders)
        const { data: orderRows, error: queryError } = await supabase
            .from('amazon_orders')
            .select('id, order_id, fsn, license_key_id, fulfillment_type, quantity, warranty_status, contact_email, is_refunded, fulfillment_status, order_date, created_at, state, early_appeal_status')
            .eq('order_id', cleanCode);

        let orders = orderRows || [];

        // Fallback: try case-insensitive search if exact match fails
        if (orders.length === 0) {
            const { data: fallbackRows } = await supabase
                .from('amazon_orders')
                .select('id, order_id, fsn, license_key_id, fulfillment_type, quantity, warranty_status, contact_email, is_refunded, fulfillment_status, order_date, created_at, state, early_appeal_status')
                .ilike('order_id', cleanCode);
            orders = fallbackRows || [];
        }

        if (orders.length === 0) {
            return NextResponse.json({
                success: false,
                error: isAmazonOrderId ? 'Amazon Order ID not found' : 'Secret code not found'
            }, { status: 404 });
        }

        // Use the first order row for shared checks (refund, block, redemption eligibility)
        const primaryOrder = orders[0];

        // Check if order is BLOCKED (any item blocked = whole order blocked)
        if (orders.some(o => o.warranty_status === 'BLOCKED')) {
            return NextResponse.json({
                success: false,
                error: `This order has been blocked. Please contact support for assistance.\n\nIt may happen you have left a negative seller feedback. You need to remove that from amazon.in/hz/feedback and fill the appeal form after removal at simplysolutions.co.in/feedback-appeal/${cleanCode}`,
                isBlocked: true,
                feedbackUrl: 'https://www.amazon.in/hz/feedback',
                appealUrl: `https://simplysolutions.co.in/feedback-appeal/${cleanCode}`
            }, { status: 403 });
        }

        // CRITICAL: Check if order has been refunded (any item refunded = whole order refunded)
        if (orders.some(o => o.is_refunded === true)) {
            return NextResponse.json({
                success: false,
                error: 'This order has been refunded. Activation is not available for refunded orders.'
            }, { status: 403 });
        }

        // Check FBA redemption eligibility using primary order
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

        // Check if already has license keys assigned (across all items)
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

            // Check combo status across all items
            const hasCombo = orders.some(o => o.fsn && isComboProduct(o.fsn));
            const comboFsn = orders.find(o => o.fsn && isComboProduct(o.fsn))?.fsn;
            const totalQuantity = orders.reduce((sum, o) => sum + (o.quantity || 1), 0);
            const hasValidEmail = primaryOrder.contact_email &&
                !primaryOrder.contact_email.includes('@marketplace.amazon');

            return NextResponse.json({
                success: true,
                alreadyRedeemed: true,
                isCombo: hasCombo,
                comboFsn: hasCombo ? comboFsn : undefined,
                orderQuantity: totalQuantity,
                hasValidEmail,
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
            const itemIsCombo = isComboProduct(fsn);
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
                        error: `Not enough license keys available. Please try again later or contact support.`,
                        orderId: cleanCode,
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
            // No FSNs configured for any item
            return NextResponse.json({ success: false, error: 'Product not configured. Please contact support.' }, { status: 404 });
        }

        // Assign ALL keys to this order
        for (const key of allAvailableKeys) {
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

        // Update each order item with its corresponding license key reference
        for (const orderItem of orders) {
            const matchingKey = allAvailableKeys.find(k => k.fsn === orderItem.fsn);
            if (matchingKey) {
                await supabase
                    .from('amazon_orders')
                    .update({ license_key_id: matchingKey.id })
                    .eq('id', orderItem.id);
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

        // Check if order already has a valid non-marketplace email
        const hasValidEmail = primaryOrder.contact_email &&
            !primaryOrder.contact_email.includes('@marketplace.amazon');

        const hasCombo = orders.some(o => o.fsn && isComboProduct(o.fsn));
        const comboFsn = orders.find(o => o.fsn && isComboProduct(o.fsn))?.fsn;
        const totalQuantity = orders.reduce((sum, o) => sum + (o.quantity || 1), 0);

        return NextResponse.json({
            success: true,
            alreadyRedeemed: false,
            isCombo: hasCombo,
            comboFsn: hasCombo ? comboFsn : undefined,
            orderQuantity: totalQuantity,
            fulfillmentType: primaryOrder.fulfillment_type,
            hasValidEmail,
            licenses
        });

    } catch (error) {
        console.error('Error generating license key:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
