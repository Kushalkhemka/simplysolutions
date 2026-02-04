import FormData from 'form-data';
import Mailgun from 'mailgun.js';

/**
 * Mailgun Integration Module
 * 
 * Used for:
 * 1. Receiving refund notification emails via inbound parse webhook
 * 2. Sending transactional emails (optional)
 */

// Initialize Mailgun client
const mailgun = new Mailgun(FormData);

// Get Mailgun client with API key
export function getMailgunClient() {
    const apiKey = process.env.MAILGUN_API_KEY;

    if (!apiKey) {
        throw new Error('MAILGUN_API_KEY environment variable is required');
    }

    return mailgun.client({
        username: 'api',
        key: apiKey,
        // For EU domains, uncomment:
        // url: 'https://api.eu.mailgun.net'
    });
}

// Domain configuration
export const MAILGUN_DOMAIN = process.env.MAILGUN_DOMAIN || 'sandboxf0128f701ae14f969459f71897d2fec8.mailgun.org';

/**
 * Send a simple email
 */
export async function sendEmail({
    to,
    subject,
    text,
    html
}: {
    to: string | string[];
    subject: string;
    text?: string;
    html?: string;
}) {
    const mg = getMailgunClient();

    try {
        // Build message data with only defined fields
        const messageData: Record<string, any> = {
            from: `SimplySolutions <postmaster@${MAILGUN_DOMAIN}>`,
            to: Array.isArray(to) ? to : [to],
            subject,
        };

        if (text) messageData.text = text;
        if (html) messageData.html = html;

        const result = await mg.messages.create(MAILGUN_DOMAIN, messageData as any);

        console.log('[mailgun] Email sent:', result.id);
        return { success: true, messageId: result.id };
    } catch (error) {
        console.error('[mailgun] Error sending email:', error);
        throw error;
    }
}

/**
 * Verify Mailgun webhook signature
 * https://documentation.mailgun.com/en/latest/user_manual.html#webhooks-1
 */
export function verifyMailgunWebhook(
    timestamp: string,
    token: string,
    signature: string
): boolean {
    const crypto = require('crypto');
    const signingKey = process.env.MAILGUN_SIGNING_KEY;

    if (!signingKey) {
        console.warn('[mailgun] No MAILGUN_SIGNING_KEY set, skipping signature verification');
        return true;
    }

    const encodedToken = crypto
        .createHmac('sha256', signingKey)
        .update(timestamp.concat(token))
        .digest('hex');

    return encodedToken === signature;
}

/**
 * Parse inbound email from Mailgun webhook payload
 */
export interface ParsedInboundEmail {
    from: string;
    to: string;
    subject: string;
    bodyPlain: string;
    bodyHtml: string;
    timestamp: string;
    messageId: string;
    attachments: number;
}

export function parseInboundEmail(formData: Record<string, any>): ParsedInboundEmail {
    return {
        from: formData.from || formData.sender || '',
        to: formData.To || formData.to || formData.recipient || '',
        subject: formData.subject || formData.Subject || '',
        bodyPlain: formData['body-plain'] || formData['stripped-text'] || '',
        bodyHtml: formData['body-html'] || formData['stripped-html'] || '',
        timestamp: formData.timestamp || new Date().toISOString(),
        messageId: formData['Message-Id'] || formData['message-id'] || '',
        attachments: parseInt(formData['attachment-count'] || '0', 10)
    };
}
