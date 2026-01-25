import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';
import { isComboProduct, getComponentFSNs, COMBO_DISPLAY_NAMES } from '@/lib/amazon/combo-products';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

/**
 * N8N Order Verification Endpoint
 * 
 * POST /api/n8n/verify-order
 * 
 * Request:
 * {
 *   "orderId": "408-1234567-1234567" OR "15-digit secret code",
 *   "apiKey": "optional API key for authentication"
 * }
 * 
 * Returns complete order details for customer verification in AI chat support.
 */
export async function POST(request: NextRequest) {
    try {
        const { orderId, apiKey } = await request.json();

        // Verify API key (REQUIRED)
        const expectedApiKey = process.env.N8N_API_KEY;

        if (!expectedApiKey) {
            console.error('N8N_API_KEY environment variable not set');
            return NextResponse.json({
                success: false,
                error: 'Server configuration error. N8N_API_KEY not configured.'
            }, { status: 500 });
        }

        if (!apiKey) {
            return NextResponse.json({
                success: false,
                error: 'API key is required. Include apiKey in request body.'
            }, { status: 401 });
        }

        if (apiKey !== expectedApiKey) {
            return NextResponse.json({
                success: false,
                error: 'Invalid API key'
            }, { status: 401 });
        }

        if (!orderId) {
            return NextResponse.json({
                success: false,
                error: 'Order ID or secret code is required'
            }, { status: 400 });
        }

        // Clean the input
        const cleanOrderId = orderId.toString().trim().replace(/\s/g, '');

        // Validate format
        const isAmazonOrderId = /^\d{3}-\d{7}-\d{7}$/.test(cleanOrderId);
        const isSecretCode = /^\d{14,17}$/.test(cleanOrderId);

        if (!isAmazonOrderId && !isSecretCode) {
            return NextResponse.json({
                success: false,
                valid: false,
                error: 'Invalid format. Expected Amazon Order ID (XXX-XXXXXXX-XXXXXXX) or 14-17 digit secret code.',
                inputReceived: cleanOrderId
            }, { status: 400 });
        }

        const supabase = createClient(supabaseUrl, supabaseServiceKey);

        // Fetch order with ALL details
        const { data: order, error: orderError } = await supabase
            .from('amazon_orders')
            .select('*')
            .eq('order_id', cleanOrderId)
            .single();

        if (orderError || !order) {
            return NextResponse.json({
                success: true,
                valid: false,
                orderFound: false,
                inputType: isAmazonOrderId ? 'amazon_order_id' : 'secret_code',
                message: 'Order not found in our system. Please verify the order ID/secret code.'
            });
        }

        // Check if already redeemed - get ALL license keys for this order
        let licenseInfo = null;
        let allLicenses: Array<{ licenseKey: string; fsn: string; isRedeemed: boolean; redeemedAt: string | null }> = [];

        // Fetch all license keys assigned to this order
        const { data: licenseDataArray } = await supabase
            .from('amazon_activation_license_keys')
            .select('license_key, fsn, is_redeemed, redeemed_at')
            .eq('order_id', cleanOrderId);

        if (licenseDataArray && licenseDataArray.length > 0) {
            allLicenses = licenseDataArray.map(lic => ({
                licenseKey: lic.license_key,
                fsn: lic.fsn,
                isRedeemed: lic.is_redeemed,
                redeemedAt: lic.redeemed_at
            }));

            // For backward compatibility, also set single licenseInfo
            licenseInfo = {
                licenseKey: licenseDataArray[0].license_key,
                isRedeemed: licenseDataArray[0].is_redeemed,
                redeemedAt: licenseDataArray[0].redeemed_at,
                totalKeys: licenseDataArray.length
            };
        }

        // Check for replacement requests
        let replacementInfo = null;
        const { data: replacementRequest } = await supabase
            .from('license_replacement_requests')
            .select(`
                id,
                status,
                customer_email,
                screenshot_url,
                admin_notes,
                created_at,
                reviewed_at,
                new_license_key_id
            `)
            .eq('order_id', cleanOrderId)
            .order('created_at', { ascending: false })
            .limit(1)
            .single();

        if (replacementRequest) {
            let newLicenseKey = null;
            if (replacementRequest.status === 'APPROVED' && replacementRequest.new_license_key_id) {
                const { data: newKey } = await supabase
                    .from('amazon_activation_license_keys')
                    .select('license_key')
                    .eq('id', replacementRequest.new_license_key_id)
                    .single();
                newLicenseKey = newKey?.license_key || null;
            }

            replacementInfo = {
                hasReplacementRequest: true,
                status: replacementRequest.status,
                customerEmail: replacementRequest.customer_email,
                screenshotUrl: replacementRequest.screenshot_url,
                adminNotes: replacementRequest.admin_notes,
                requestedAt: replacementRequest.created_at,
                reviewedAt: replacementRequest.reviewed_at,
                newLicenseKey: newLicenseKey
            };
        }

        // Get product info from products_data via FSN
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
                    installationDoc: productData.installation_doc
                        ? `https://simplysolutions.co.in/installation-docs/${productData.installation_doc}`
                        : null
                };
            }
        }

        // Build comprehensive response for n8n
        return NextResponse.json({
            success: true,
            valid: true,
            orderFound: true,
            inputType: isAmazonOrderId ? 'amazon_order_id' : 'secret_code',

            // Order Status
            status: {
                isRedeemed: !!licenseInfo,
                hasFraudFlag: order.is_fraud || false,
                fraudReason: order.fraud_reason || null,
                isReturned: order.is_returned || false,
                hasActivationIssue: order.has_activation_issue || false,
                issueStatus: order.issue_status || null,
                warrantyStatus: order.warranty_status
            },

            // Order Details
            order: {
                orderId: order.order_id,
                orderDate: order.order_date,
                orderTotal: order.order_total,
                currency: order.currency || 'INR',
                quantity: order.quantity || 1,
                fulfillmentType: order.fulfillment_type,
                createdAt: order.created_at,
                syncedAt: order.synced_at
            },

            // Product Info
            product: {
                fsn: order.fsn,
                asin: order.asin,
                isCombo: order.fsn ? isComboProduct(order.fsn) : false,
                componentFSNs: order.fsn ? getComponentFSNs(order.fsn) : [],
                comboDisplayName: order.fsn ? COMBO_DISPLAY_NAMES[order.fsn] : null,
                ...productInfo
            },

            // Customer Location (for verification)
            customer: {
                email: order.contact_email || order.buyer_email,
                phone: order.contact_phone,
                city: order.city,
                state: order.state,
                postalCode: order.postal_code,
                country: order.country || 'IN'
            },

            // License Key (if redeemed) - backward compatible single key
            license: licenseInfo,

            // All License Keys (for multi-quantity/combo orders)
            allLicenses: allLicenses,

            // Replacement Request Info
            replacement: replacementInfo,

            // GetCID Status
            getcid: {
                used: order.getcid_used || false,
                usedAt: order.getcid_used_at,
                installationId: order.installation_id
            },

            // Suggested Actions for AI
            suggestedActions: getSuggestedActions(order, licenseInfo, replacementInfo)
        });

    } catch (error) {
        console.error('N8N verify-order error:', error);
        return NextResponse.json({
            success: false,
            error: 'Internal server error',
            message: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 500 });
    }
}

// Helper function to suggest actions based on order state
function getSuggestedActions(order: any, licenseInfo: any, replacementInfo: any): string[] {
    const actions: string[] = [];

    if (order.is_fraud) {
        actions.push('[WARNING] Order flagged for fraud. Escalate to admin.');
    }

    if (order.is_returned) {
        actions.push('[RETURNED] Order was returned. No license key should be issued.');
    }

    if (order.has_activation_issue) {
        actions.push(`[ISSUE] Customer has reported activation issue. Status: ${order.issue_status}`);
    }

    // Check for replacement request status
    if (replacementInfo?.hasReplacementRequest) {
        if (replacementInfo.status === 'PENDING') {
            actions.push('[PENDING] Customer has a PENDING replacement request. Under investigation (12-24 hours).');
        } else if (replacementInfo.status === 'APPROVED') {
            actions.push(`[APPROVED] Replacement APPROVED! New license key: ${replacementInfo.newLicenseKey}`);
            actions.push('[EMAIL SENT] Customer was notified via email with the new key.');
        } else if (replacementInfo.status === 'REJECTED') {
            actions.push(`[REJECTED] Replacement request was REJECTED. Reason: ${replacementInfo.adminNotes}`);
        }
    }

    // Check if combo product
    if (order.fsn && isComboProduct(order.fsn)) {
        const components = getComponentFSNs(order.fsn);
        actions.push(`[COMBO] This is a COMBO product. Customer receives ${components.length} license keys: ${components.join(' + ')}`);
    }

    if (licenseInfo?.isRedeemed) {
        actions.push('[REDEEMED] License key already issued. Customer can use existing key.');
        actions.push('[ACTION] Share download link and installation guide.');
    } else {
        actions.push('[NOT REDEEMED] License key not yet redeemed. Customer can activate at simplysolutions.co.in/activate');
    }

    if (order.getcid_used) {
        actions.push('[GETCID] Customer has used phone activation (GetCID).');
    }

    if (!order.fsn) {
        actions.push('[WARNING] Product FSN not mapped. May need manual verification.');
    }

    return actions;
}
