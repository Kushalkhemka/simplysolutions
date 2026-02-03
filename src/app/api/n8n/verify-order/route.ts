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

        // Check for replacement requests (fetch all, not just most recent)
        let replacementInfo = null;
        const { data: replacementRequests } = await supabase
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
            .order('created_at', { ascending: false });

        if (replacementRequests && replacementRequests.length > 0) {
            const latestRequest = replacementRequests[0];

            // Get new license key if approved
            let newLicenseKey = null;
            if (latestRequest.status === 'APPROVED' && latestRequest.new_license_key_id) {
                const { data: newKey } = await supabase
                    .from('amazon_activation_license_keys')
                    .select('license_key')
                    .eq('id', latestRequest.new_license_key_id)
                    .single();
                newLicenseKey = newKey?.license_key || null;
            }

            // Check if it was an instant (auto-approved) replacement
            const isInstantReplacement = latestRequest.admin_notes?.includes('AUTO-APPROVED');

            replacementInfo = {
                hasReplacementRequest: true,
                totalRequests: replacementRequests.length,
                latest: {
                    status: latestRequest.status,
                    customerEmail: latestRequest.customer_email,
                    screenshotUrl: latestRequest.screenshot_url,
                    adminNotes: latestRequest.admin_notes,
                    requestedAt: latestRequest.created_at,
                    reviewedAt: latestRequest.reviewed_at,
                    newLicenseKey: newLicenseKey,
                    isInstantReplacement: isInstantReplacement
                },
                // Include all request history for AI context
                allRequests: replacementRequests.map(r => ({
                    id: r.id,
                    status: r.status,
                    requestedAt: r.created_at,
                    reviewedAt: r.reviewed_at,
                    isInstant: r.admin_notes?.includes('AUTO-APPROVED') || false
                }))
            };

            // Backward compatibility - also include flat fields
            Object.assign(replacementInfo, {
                status: latestRequest.status,
                customerEmail: latestRequest.customer_email,
                screenshotUrl: latestRequest.screenshot_url,
                adminNotes: latestRequest.admin_notes,
                requestedAt: latestRequest.created_at,
                reviewedAt: latestRequest.reviewed_at,
                newLicenseKey: newLicenseKey
            });
        }

        // Check for subscription products (AutoCAD, Canva, 365E5)
        let subscriptionInfo = null;
        const fsnUpper = order.fsn?.toUpperCase() || '';

        // Fetch installation doc for subscription products from products_data
        let subscriptionInstallDoc: string | null = null;
        if (fsnUpper.startsWith('AUTOCAD') || fsnUpper.startsWith('CANVA') || fsnUpper.startsWith('365E5') || fsnUpper.startsWith('365E')) {
            const { data: subProductData } = await supabase
                .from('products_data')
                .select('installation_doc')
                .eq('fsn', order.fsn)
                .single();

            if (subProductData?.installation_doc) {
                subscriptionInstallDoc = `https://simplysolutions.co.in/installation-docs/${subProductData.installation_doc}`;
            }
        }

        if (fsnUpper.startsWith('AUTOCAD') || fsnUpper.startsWith('CANVA')) {
            // Check product_requests table for AutoCAD/Canva
            const { data: productRequest } = await supabase
                .from('product_requests')
                .select('*')
                .eq('order_id', cleanOrderId)
                .single();

            if (productRequest) {
                const productType = fsnUpper.startsWith('AUTOCAD') ? 'AutoCAD' : 'Canva Pro';

                subscriptionInfo = {
                    isSubscription: true,
                    productType: productType,
                    status: productRequest.is_completed ? 'COMPLETED' : 'PENDING',
                    customerEmail: productRequest.email,
                    requestedAt: productRequest.created_at,
                    completedAt: productRequest.completed_at || null,
                    installationGuideUrl: subscriptionInstallDoc,
                    message: productRequest.is_completed
                        ? `${productType} has been added to customer email: ${productRequest.email}. Customer should follow the installation guide.`
                        : `${productType} request is PENDING. Customer should wait for email notification.`
                };
            } else {
                // No request submitted yet
                const productType = fsnUpper.startsWith('AUTOCAD') ? 'AutoCAD' : 'Canva Pro';
                subscriptionInfo = {
                    isSubscription: true,
                    productType: productType,
                    status: 'NOT_SUBMITTED',
                    message: `Customer has not submitted their ${productType} request yet. Direct them to the activation page.`,
                    activationUrl: fsnUpper.startsWith('AUTOCAD')
                        ? 'https://simplysolutions.co.in/autocad'
                        : 'https://simplysolutions.co.in/canva'
                };
            }
        } else if (fsnUpper.startsWith('365E5') || fsnUpper.startsWith('365E')) {
            // Check office365_requests table for 365 Enterprise
            const { data: office365Request } = await supabase
                .from('office365_requests')
                .select('*')
                .eq('order_id', cleanOrderId)
                .single();

            if (office365Request) {
                subscriptionInfo = {
                    isSubscription: true,
                    productType: 'Microsoft 365 Enterprise',
                    status: office365Request.is_completed ? 'COMPLETED' : 'PENDING',
                    customerEmail: office365Request.email,
                    customerName: `${office365Request.first_name} ${office365Request.last_name}`,
                    whatsappNumber: office365Request.whatsapp_number,
                    requestedAt: office365Request.created_at,
                    completedAt: office365Request.completed_at || null,
                    // Include credentials ONLY if completed
                    credentials: office365Request.is_completed ? {
                        username: office365Request.generated_email,
                        password: office365Request.generated_password
                    } : null,
                    installationGuideUrl: subscriptionInstallDoc,
                    message: office365Request.is_completed
                        ? `Microsoft 365 account created! Username: ${office365Request.generated_email}, Password: ${office365Request.generated_password}`
                        : 'Microsoft 365 request is PENDING. Account will be created within 24-48 working hours.'
                };
            } else {
                // Check legacy product_requests table
                const { data: legacyRequest } = await supabase
                    .from('product_requests')
                    .select('*')
                    .eq('order_id', cleanOrderId)
                    .eq('request_type', '365e5')
                    .single();

                if (legacyRequest) {
                    subscriptionInfo = {
                        isSubscription: true,
                        productType: 'Microsoft 365 Enterprise',
                        status: legacyRequest.is_completed ? 'COMPLETED' : 'PENDING',
                        customerEmail: legacyRequest.email,
                        requestedAt: legacyRequest.created_at,
                        installationGuideUrl: subscriptionInstallDoc,
                        message: legacyRequest.is_completed
                            ? 'Request completed. Customer should check email for credentials.'
                            : 'Microsoft 365 request is PENDING. Account will be created within 24-48 working hours.'
                    };
                } else {
                    subscriptionInfo = {
                        isSubscription: true,
                        productType: 'Microsoft 365 Enterprise',
                        status: 'NOT_SUBMITTED',
                        message: 'Customer has not submitted their Microsoft 365 request yet. Direct them to the activation page.',
                        activationUrl: 'https://simplysolutions.co.in/365enterprise'
                    };
                }
            }
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
                isPreactivated: order.fsn?.toUpperCase() === 'OFFICE2024-MAC',
                isRefunded: order.is_refunded || false,
                hasFraudFlag: order.is_fraud || false,
                fraudReason: order.fraud_reason || null,
                isReturned: order.is_returned || false,
                isBlocked: order.warranty_status === 'BLOCKED',
                hasActivationIssue: order.has_activation_issue || false,
                issueStatus: order.issue_status || null,
                warrantyStatus: order.warranty_status,
                // FBA Physical Delivery Status
                isFBA: order.fulfillment_type === 'amazon_fba',
                isMFN: order.fulfillment_type === 'amazon_mfn',
                isFbaShipped: order.fulfillment_type === 'amazon_fba' && order.fulfillment_status === 'Shipped',
                isFbaPending: order.fulfillment_type === 'amazon_fba' && order.fulfillment_status !== 'Shipped',
                fulfillmentStatus: order.fulfillment_status || 'Unknown'
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
            suggestedActions: getSuggestedActions(order, licenseInfo, replacementInfo, subscriptionInfo),

            // Subscription Product Info (AutoCAD, Canva, 365 Enterprise)
            subscription: subscriptionInfo,

            // Special handling for preactivated products
            preactivatedProduct: order.fsn?.toUpperCase() === 'OFFICE2024-MAC' ? {
                isPreactivated: true,
                noKeyRequired: true,
                message: 'This is a PREACTIVATED product. No license key is needed. Customer should follow the installation guide.',
                installationGuideUrl: 'https://simplysolutions.co.in/installation-docs/office2024mac'
            } : null
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
function getSuggestedActions(order: any, licenseInfo: any, replacementInfo: any, subscriptionInfo: any): string[] {
    const actions: string[] = [];

    // FBA Physical Delivery - Add this info first for FBA orders
    if (order.fulfillment_type === 'amazon_fba') {
        actions.push('[PHYSICAL DELIVERY] This is a PHYSICAL DELIVERY order (FBA - Fulfilled by Amazon). NOT an email delivery order.');
        actions.push('[PHYSICAL DELIVERY] Customer will receive the product key card via physical delivery from Amazon.');

        if (order.fulfillment_status !== 'Shipped') {
            actions.push('[FBA PENDING] Order is NOT SHIPPED YET. Customer must wait for physical delivery from Amazon.');
            actions.push('[ACTION] Inform customer: "Your order is being processed by Amazon for physical delivery. You will receive a product key card at your doorstep. Please wait for shipping."');
        } else {
            actions.push('[FBA SHIPPED] Order has been SHIPPED. Customer should receive physical delivery soon.');
            actions.push('[ACTION] Customer can track delivery on Amazon. The product key will be on the physical key card delivered.');
        }
    }

    if (order.is_refunded) {
        actions.push('[REFUNDED] This order has been REFUNDED. NO LICENSE KEY should be provided.');
        actions.push('[ACTION] Inform customer that activation is not available for refunded orders.');
    }

    if (order.is_fraud) {
        actions.push('[WARNING] Order flagged for fraud. Escalate to admin.');
    }

    if (order.is_returned) {
        actions.push('[RETURNED] Order was returned. No license key should be issued.');
    }

    if (order.has_activation_issue) {
        actions.push(`[ISSUE] Customer has reported activation issue. Status: ${order.issue_status}`);
    }

    // Check for subscription products first (AutoCAD, Canva, 365E5)
    if (subscriptionInfo) {
        const productType = subscriptionInfo.productType;

        if (subscriptionInfo.status === 'COMPLETED') {
            if (subscriptionInfo.credentials) {
                // 365E5 with credentials
                actions.push(`[SUBSCRIPTION COMPLETED] ${productType} account has been created!`);
                actions.push(`[CREDENTIALS] Username: ${subscriptionInfo.credentials.username}`);
                actions.push(`[CREDENTIALS] Password: ${subscriptionInfo.credentials.password}`);
                actions.push(`[ACTION] Customer should sign in at office.com with the above credentials.`);
            } else {
                // AutoCAD/Canva completed
                actions.push(`[SUBSCRIPTION COMPLETED] ${productType} has been added to customer email: ${subscriptionInfo.customerEmail}`);
                actions.push(`[ACTION] Customer should follow installation guide: ${subscriptionInfo.installationGuideUrl}`);
            }
        } else if (subscriptionInfo.status === 'PENDING') {
            actions.push(`[SUBSCRIPTION PENDING] ${productType} request is being processed.`);
            actions.push('[PROCESSING TIME] Typically completed within 24-48 working hours.');
            actions.push('[ACTION] Customer should wait for email/WhatsApp notification.');
        } else if (subscriptionInfo.status === 'NOT_SUBMITTED') {
            actions.push(`[SUBSCRIPTION NOT SUBMITTED] Customer has not submitted their ${productType} request.`);
            actions.push(`[ACTION] Direct customer to activation page: ${subscriptionInfo.activationUrl}`);
        }

        // Don't show generic license key actions for subscription products
    } else {
        // Non-subscription products - show regular license key actions
        // Check for replacement request status
        if (replacementInfo?.hasReplacementRequest) {
            const isInstant = replacementInfo.latest?.isInstantReplacement || replacementInfo.adminNotes?.includes('AUTO-APPROVED');

            if (replacementInfo.status === 'PENDING') {
                actions.push('[PENDING] Customer has a PENDING replacement request. Under investigation (12-24 hours).');
                actions.push('[ACTION] Ask customer to wait for email notification or check at simplysolutions.co.in/activate');
            } else if (replacementInfo.status === 'APPROVED') {
                if (isInstant) {
                    actions.push(`[INSTANT REPLACEMENT] Customer used INSTANT replacement. New key: ${replacementInfo.newLicenseKey}`);
                    actions.push('[NOTE] This was auto-approved for blocked/exceeded Installation ID.');
                } else {
                    actions.push(`[APPROVED] Replacement APPROVED by admin! New license key: ${replacementInfo.newLicenseKey}`);
                }
                actions.push('[EMAIL SENT] Customer was notified via email with the new key.');
            } else if (replacementInfo.status === 'REJECTED') {
                actions.push(`[REJECTED] Replacement request was REJECTED. Reason: ${replacementInfo.adminNotes}`);
                actions.push(`[ACTION] Customer can submit new request at: https://simplysolutions.co.in/replacement-upload/${order.order_id}`);
            }

            if (replacementInfo.totalRequests > 1) {
                actions.push(`[HISTORY] Customer has ${replacementInfo.totalRequests} replacement request(s) on record.`);
            }
        } else {
            // No replacement request - provide link if they need one
            actions.push(`[REPLACEMENT] If customer needs a replacement, share link: https://simplysolutions.co.in/replacement-upload/${order.order_id}`);
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
    }

    if (order.getcid_used) {
        actions.push('[GETCID] Customer has used phone activation (GetCID).');
    }

    if (!order.fsn) {
        actions.push('[WARNING] Product FSN not mapped. May need manual verification.');
    }

    // Special handling for preactivated products
    if (order.fsn?.toUpperCase() === 'OFFICE2024-MAC') {
        actions.push('[PREACTIVATED] This is Office 2024 Mac - PREACTIVATED product. NO LICENSE KEY NEEDED.');
        actions.push('[ACTION] Customer should follow installation guide at: https://simplysolutions.co.in/installation-docs/office2024mac');
    }

    return actions;
}
