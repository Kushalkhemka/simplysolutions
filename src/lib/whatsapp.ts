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

    // Dynamic URL button (index 1 = second button, usually the "Submit Proof" button)
    if (options.buttonUrlSuffix) {
        components.push({
            type: 'button',
            sub_type: 'url',
            index: '1', // Second button (0-indexed)
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
 * Send initial feedback removal request
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
 * Send appeal approved notification
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
 * Send appeal rejected notification
 * Template: feedback_appeal_rejected  
 * Body Variables: {{1}} = Order ID
 * Button URL: Dynamic - orderId suffix for resubmit button
 */
export async function sendFeedbackAppealRejected(
    phoneNumber: string,
    orderId: string
): Promise<WhatsAppResponse> {
    return sendWhatsAppTemplateAdvanced(phoneNumber, 'feedback_appeal_rejected', {
        bodyVariables: [orderId],
        buttonUrlSuffix: orderId  // For the dynamic "Resubmit Proof" button URL
    });
}

/**
 * Send resubmission request
 * Template: resubmission_needed
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

