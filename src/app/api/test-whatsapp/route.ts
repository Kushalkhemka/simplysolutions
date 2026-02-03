import { NextRequest, NextResponse } from 'next/server';
import {
    sendAutocadFulfilled,
    sendCanvaFulfilled,
    sendM365AccountCredentials,
    sendWarrantyApproved,
    sendWarrantyRejected,
    sendWarrantyResubmission,
    sendReviewRequest,
    sendReplacementRejected,
    sendReplacementCompleted,
    sendFeedbackRemovalRequest,
    sendFeedbackAppealApproved,
    sendFeedbackAppealRejected
} from '@/lib/whatsapp';

// Default test phone number
const TEST_PHONE = '9953999215';

// Sample test data
const testData = {
    orderId: '408-1234567-8901234',
    email: 'test@simplysol.onmicrosoft.com',
    password: 'Welcome@123',
    product: 'MS Office 2021 Pro Plus',
    date: '04 Feb 2026',
    reason: 'Screenshot unclear',
    licenseKey: 'XXXXX-XXXXX-XXXXX-XXXXX-XXXXX',
    adminNotes: 'Please upload a clear screenshot showing your 5-star rating'
};

/**
 * Test all WhatsApp templates
 * GET /api/test-whatsapp?template=all|autocad_fulfill|canva_fulfilled|...
 * &phone=9953999215
 */
export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    const templateName = searchParams.get('template') || 'all';
    const phoneNumber = searchParams.get('phone') || TEST_PHONE;

    const results: Record<string, any> = {};
    const errors: string[] = [];

    try {
        // Helper to test a template
        const testTemplate = async (name: string, fn: () => Promise<any>) => {
            try {
                console.log(`Testing template: ${name}`);
                const result = await fn();
                results[name] = result;
                if (!result.success) {
                    errors.push(`${name}: ${result.error}`);
                }
                // Add delay between sends to avoid rate limiting
                await new Promise(resolve => setTimeout(resolve, 2000));
            } catch (error: any) {
                results[name] = { success: false, error: error.message };
                errors.push(`${name}: ${error.message}`);
            }
        };

        // Define all templates to test
        const templates: Record<string, () => Promise<any>> = {
            'autocad_fulfill': () => sendAutocadFulfilled(
                phoneNumber, testData.orderId, testData.email
            ),
            'canva_fulfilled': () => sendCanvaFulfilled(
                phoneNumber, testData.orderId, testData.email
            ),
            '365e5_account_credentials': () => sendM365AccountCredentials(
                phoneNumber, testData.orderId, testData.email, testData.password
            ),
            'warranty_approved': () => sendWarrantyApproved(
                phoneNumber, testData.orderId, testData.product, testData.date
            ),
            'warranty_rejected': () => sendWarrantyRejected(
                phoneNumber, testData.orderId, testData.product, testData.reason
            ),
            'warranty_resubmission': () => sendWarrantyResubmission(
                phoneNumber, testData.orderId, 'Seller Feedback Screenshot', testData.adminNotes
            ),
            'review_request': () => sendReviewRequest(
                phoneNumber, testData.orderId, testData.product, testData.date
            ),
            'replacement_rejected': () => sendReplacementRejected(
                phoneNumber, testData.orderId, testData.product, testData.reason
            ),
            'replacement_completed': () => sendReplacementCompleted(
                phoneNumber, testData.orderId, testData.product, testData.licenseKey
            ),
            'feedback_removal_request': () => sendFeedbackRemovalRequest(
                phoneNumber, testData.orderId
            ),
            'feedback_appeal_approved': () => sendFeedbackAppealApproved(
                phoneNumber, testData.orderId
            ),
            'feedback_appeal_rejected': () => sendFeedbackAppealRejected(
                phoneNumber, testData.orderId, 'Feedback still visible'
            )
        };

        if (templateName === 'all') {
            // Test all templates
            for (const [name, fn] of Object.entries(templates)) {
                await testTemplate(name, fn);
            }
        } else if (templates[templateName]) {
            // Test specific template
            await testTemplate(templateName, templates[templateName]);
        } else {
            return NextResponse.json({
                error: `Unknown template: ${templateName}`,
                availableTemplates: Object.keys(templates)
            }, { status: 400 });
        }

        return NextResponse.json({
            success: errors.length === 0,
            phoneNumber,
            templatesTested: Object.keys(results).length,
            results,
            errors: errors.length > 0 ? errors : undefined,
            message: errors.length === 0
                ? `Successfully sent ${Object.keys(results).length} template(s) to ${phoneNumber}`
                : `Completed with ${errors.length} error(s)`
        });

    } catch (error: any) {
        return NextResponse.json({
            success: false,
            error: error.message
        }, { status: 500 });
    }
}
