/**
 * WhatsApp Business API Integration
 * Uses Meta's Cloud API for sending template messages
 * 
 * Required Environment Variables:
 * - WHATSAPP_PHONE_NUMBER_ID
 * - WHATSAPP_ACCESS_TOKEN
 */

const WHATSAPP_API_URL = 'https://graph.facebook.com/v18.0';

interface WhatsAppTemplateVariable {
    type: 'text';
    text: string;
}

export interface WhatsAppResponse {
    success: boolean;
    messageId?: string;
    error?: string;
}

interface TemplateOptions {
    headerVariables?: string[];     // For header with variables
    bodyVariables?: string[];       // For body text variables like {{1}}
    buttonUrlSuffix?: string;       // For dynamic URL button (appended to base URL)
    buttonIndex?: number;           // Button index (0 for first button, 1 for second)
}

/**
 * Send a WhatsApp template message with full options
 */
export async function sendWhatsAppTemplateAdvanced(
    phoneNumber: string,
    templateName: string,
    options: TemplateOptions = {}
): Promise<WhatsAppResponse> {
    const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
    const accessToken = process.env.WHATSAPP_ACCESS_TOKEN;

    if (!phoneNumberId || !accessToken) {
        console.error('WhatsApp credentials not configured');
        return { success: false, error: 'WhatsApp credentials not configured' };
    }

    // Format phone number (remove spaces, ensure country code)
    let formattedPhone = phoneNumber.replace(/[\s\-\(\)]/g, '');
    if (!formattedPhone.startsWith('+')) {
        formattedPhone = '+91' + formattedPhone; // Default to India
    }
    formattedPhone = formattedPhone.replace('+', ''); // API expects without +

    // Build template components
    const components: Array<{ type: string; parameters?: Array<{ type: string; text?: string }>; sub_type?: string; index?: string }> = [];

    // Header variables (if any)
    if (options.headerVariables && options.headerVariables.length > 0) {
        components.push({
            type: 'header',
            parameters: options.headerVariables.map(text => ({
                type: 'text',
                text
            }))
        });
    }

    // Body variables (if any)
    if (options.bodyVariables && options.bodyVariables.length > 0) {
        components.push({
            type: 'body',
            parameters: options.bodyVariables.map(text => ({
                type: 'text',
                text
            }))
        });
    }

    // Dynamic URL button
    if (options.buttonUrlSuffix) {
        components.push({
            type: 'button',
            sub_type: 'url',
            index: String(options.buttonIndex ?? 0), // Default to first button (index 0)
            parameters: [{
                type: 'text',
                text: options.buttonUrlSuffix
            }]
        });
    }

    try {
        const requestBody = {
            messaging_product: 'whatsapp',
            recipient_type: 'individual',
            to: formattedPhone,
            type: 'template',
            template: {
                name: templateName,
                language: { code: 'en' },
                components: components.length > 0 ? components : undefined
            }
        };

        console.log('WhatsApp request:', JSON.stringify(requestBody, null, 2));

        const response = await fetch(
            `${WHATSAPP_API_URL}/${phoneNumberId}/messages`,
            {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(requestBody),
            }
        );

        const data = await response.json();

        if (!response.ok) {
            console.error('WhatsApp API error:', data);
            return {
                success: false,
                error: data.error?.message || 'Failed to send message'
            };
        }

        return {
            success: true,
            messageId: data.messages?.[0]?.id
        };
    } catch (error) {
        console.error('WhatsApp send error:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Network error'
        };
    }
}

/**
 * Simple wrapper for backward compatibility
 */
export async function sendWhatsAppTemplate(
    phoneNumber: string,
    templateName: string,
    variables: string[]
): Promise<WhatsAppResponse> {
    return sendWhatsAppTemplateAdvanced(phoneNumber, templateName, {
        bodyVariables: variables
    });
}

// ============================================
// Feedback Appeal Specific Templates
// ============================================

/**
 * Send initial feedback removal request (seller feedback)
 * Template: feedback_removal_request
 * Body Variables: {{1}} = Order ID  
 * Button URL: Dynamic - orderId suffix for submit proof button
 */
export async function sendFeedbackRemovalRequest(
    phoneNumber: string,
    orderId: string
): Promise<WhatsAppResponse> {
    return sendWhatsAppTemplateAdvanced(phoneNumber, 'feedback_removal_request', {
        bodyVariables: [orderId],
        buttonUrlSuffix: orderId  // For the dynamic "Submit Proof" button URL
    });
}

/**
 * Send product review removal request
 * Template: review_removal_request (separate template for product reviews)
 * Body Variables: {{1}} = Order ID  
 * Button URL: Dynamic - orderId suffix for submit proof button
 */
export async function sendReviewRemovalRequest(
    phoneNumber: string,
    orderId: string
): Promise<WhatsAppResponse> {
    return sendWhatsAppTemplateAdvanced(phoneNumber, 'review_removal_request', {
        bodyVariables: [orderId],
        buttonUrlSuffix: orderId  // For the dynamic "Submit Proof" button URL
    });
}

/**
 * Send review appeal approved notification
 * Template: review_appeal_approved
 * Body Variables: {{1}} = Order ID
 */
export async function sendReviewAppealApproved(
    phoneNumber: string,
    orderId: string
): Promise<WhatsAppResponse> {
    return sendWhatsAppTemplateAdvanced(phoneNumber, 'review_appeal_approved', {
        bodyVariables: [orderId]
    });
}

/**
 * Send review appeal rejected notification
 * Template: review_appeal_rejected  
 * Body Variables: {{1}} = Order ID
 * Button URL: Dynamic - orderId suffix for resubmit button
 */
export async function sendReviewAppealRejected(
    phoneNumber: string,
    orderId: string
): Promise<WhatsAppResponse> {
    return sendWhatsAppTemplateAdvanced(phoneNumber, 'review_appeal_rejected', {
        bodyVariables: [orderId],
        buttonUrlSuffix: orderId  // For the dynamic "Submit Proof" button URL
    });
}

/**
 * Send review appeal resubmit notification
 * Template: review_appeal_resubmit
 * Body Variables: {{1}} = Order ID
 * Button URL: Dynamic - orderId suffix for upload button
 */
export async function sendReviewAppealResubmit(
    phoneNumber: string,
    orderId: string
): Promise<WhatsAppResponse> {
    return sendWhatsAppTemplateAdvanced(phoneNumber, 'review_appeal_resubmit', {
        bodyVariables: [orderId],
        buttonUrlSuffix: orderId  // For the dynamic "Upload Screenshot" button URL
    });
}

/**
 * Send appeal approved notification (seller feedback)
 * Template: feedback_appeal_approved
 * Body Variables: {{1}} = Order ID
 */
export async function sendFeedbackAppealApproved(
    phoneNumber: string,
    orderId: string
): Promise<WhatsAppResponse> {
    return sendWhatsAppTemplateAdvanced(phoneNumber, 'feedback_appeal_approved', {
        bodyVariables: [orderId]
    });
}

/**
 * Send appeal rejected notification (seller feedback)
 * Template: feedback_appeal_rejected  
 * Body Variables: {{1}} = Order ID
 * Button URL: Dynamic - orderId suffix for resubmit button (index 0)
 */
export async function sendFeedbackAppealRejected(
    phoneNumber: string,
    orderId: string,
    _rejectionNote?: string  // Kept for backwards compatibility but not used
): Promise<WhatsAppResponse> {
    return sendWhatsAppTemplateAdvanced(phoneNumber, 'feedback_appeal_rejected', {
        bodyVariables: [orderId],
        buttonUrlSuffix: orderId,
        buttonIndex: 1  // Second button is the dynamic URL
    });
}

/**
 * Send resubmission request (seller feedback)
 * Template: feedback_appeal_resubmit
 * Body Variables: {{1}} = Order ID
 * Button URL: Dynamic - orderId suffix for resubmit button
 */
export async function sendFeedbackAppealResubmit(
    phoneNumber: string,
    orderId: string
): Promise<WhatsAppResponse> {
    return sendWhatsAppTemplateAdvanced(phoneNumber, 'resubmission_needed', {
        bodyVariables: [orderId],
        buttonUrlSuffix: orderId  // For the dynamic "Resubmit Proof" button URL
    });
}

/**
 * Send reminder (uses same template as initial request)
 */
export async function sendFeedbackReminder(
    phoneNumber: string,
    orderId: string
): Promise<WhatsAppResponse> {
    return sendFeedbackRemovalRequest(phoneNumber, orderId);
}

// ============================================
// Subscription Fulfillment Templates
// ============================================

/**
 * Send AutoCAD fulfillment notification
 * Template: autocad_fulfill
 * Body Variables: {{1}} = Order ID, {{2}} = Subscription Email
 */
export async function sendAutocadFulfilled(
    phoneNumber: string,
    orderId: string,
    subscriptionEmail: string
): Promise<WhatsAppResponse> {
    return sendWhatsAppTemplateAdvanced(phoneNumber, 'autocad_fulfill', {
        bodyVariables: [orderId, subscriptionEmail]
    });
}

/**
 * Send Canva Pro fulfillment notification
 * Template: canva_fulfilled
 * Body Variables: {{1}} = Order ID, {{2}} = Canva Email
 */
export async function sendCanvaFulfilled(
    phoneNumber: string,
    orderId: string,
    canvaEmail: string
): Promise<WhatsAppResponse> {
    return sendWhatsAppTemplateAdvanced(phoneNumber, 'canva_fulfilled', {
        bodyVariables: [orderId, canvaEmail]
    });
}

/**
 * Send Microsoft 365 E5 account credentials
 * Template: 365e5_account_credentials
 * Body Variables: {{1}} = Order ID, {{2}} = Email, {{3}} = Password
 */
export async function sendM365AccountCredentials(
    phoneNumber: string,
    orderId: string,
    email: string,
    password: string
): Promise<WhatsAppResponse> {
    return sendWhatsAppTemplateAdvanced(phoneNumber, '365e5_account_credentials', {
        bodyVariables: [orderId, email, password]
    });
}

// ============================================
// Warranty Templates
// ============================================

/**
 * Send warranty approved notification
 * Template: warranty_approved
 * Body Variables: {{1}} = Order ID, {{2}} = Product, {{3}} = Date
 */
export async function sendWarrantyApproved(
    phoneNumber: string,
    orderId: string,
    productName: string,
    purchaseDate: string
): Promise<WhatsAppResponse> {
    return sendWhatsAppTemplateAdvanced(phoneNumber, 'warranty_approved', {
        bodyVariables: [orderId, productName, purchaseDate]
    });
}

/**
 * Send warranty rejected notification
 * Template: warranty_rejected
 * Body Variables: {{1}} = Order ID, {{2}} = Product, {{3}} = Reason
 */
export async function sendWarrantyRejected(
    phoneNumber: string,
    orderId: string,
    productName: string,
    reason: string
): Promise<WhatsAppResponse> {
    return sendWhatsAppTemplateAdvanced(phoneNumber, 'warranty_rejected', {
        bodyVariables: [orderId, productName, reason]
    });
}

/**
 * Send warranty resubmission request
 * Template: warranty_resubmission
 * Body Variables: {{1}} = Order ID, {{2}} = Required Document, {{3}} = Admin Notes
 * Button URL: Dynamic - orderId suffix
 */
export async function sendWarrantyResubmission(
    phoneNumber: string,
    orderId: string,
    requiredDocument: string,
    adminNotes: string
): Promise<WhatsAppResponse> {
    return sendWhatsAppTemplateAdvanced(phoneNumber, 'warranty_resubmission', {
        bodyVariables: [orderId, requiredDocument, adminNotes],
        buttonUrlSuffix: orderId
    });
}

// ============================================
// Review Request Template
// ============================================

/**
 * Send review/warranty registration request
 * Template: review_request
 * Body Variables: {{1}} = Order ID, {{2}} = Product, {{3}} = Date
 * Button URL: Dynamic - orderId suffix
 */
export async function sendReviewRequest(
    phoneNumber: string,
    orderId: string,
    productName: string,
    purchaseDate: string
): Promise<WhatsAppResponse> {
    return sendWhatsAppTemplateAdvanced(phoneNumber, 'review_request', {
        bodyVariables: [orderId, productName, purchaseDate],
        buttonUrlSuffix: orderId
    });
}

// ============================================
// Replacement Templates
// ============================================

/**
 * Send replacement rejected notification
 * Template: replacement_rejected
 * Body Variables: {{1}} = Order ID, {{2}} = Product, {{3}} = Reason
 * Button URL: Dynamic - orderId suffix
 */
export async function sendReplacementRejected(
    phoneNumber: string,
    orderId: string,
    productName: string,
    reason: string
): Promise<WhatsAppResponse> {
    return sendWhatsAppTemplateAdvanced(phoneNumber, 'replacement_rejected', {
        bodyVariables: [orderId, productName, reason],
        buttonUrlSuffix: orderId
    });
}

/**
 * Send replacement completed notification with new license key
 * Template: replacement_completed
 * Body Variables: {{1}} = Order ID, {{2}} = Product, {{3}} = License Key
 */
export async function sendReplacementCompleted(
    phoneNumber: string,
    orderId: string,
    productName: string,
    licenseKey: string
): Promise<WhatsAppResponse> {
    return sendWhatsAppTemplateAdvanced(phoneNumber, 'replacement_completed', {
        bodyVariables: [orderId, productName, licenseKey]
    });
}


