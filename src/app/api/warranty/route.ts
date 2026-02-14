import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

export async function POST(request: NextRequest) {
    try {
        const formData = await request.formData();

        const orderId = formData.get('orderId') as string;
        const customerEmail = formData.get('customerEmail') as string;
        const contact = formData.get('contact') as string; // Legacy support
        const screenshotSellerFeedback = formData.get('screenshotSellerFeedback') as File | null;
        const screenshotProductReview = formData.get('screenshotProductReview') as File | null;
        const isResubmission = formData.get('isResubmission') === 'true';

        // Validate required fields
        if (!orderId) {
            return NextResponse.json(
                { error: 'Order ID is required' },
                { status: 400 }
            );
        }

        // Email is mandatory
        const email = customerEmail || contact;
        if (!email || !email.includes('@')) {
            return NextResponse.json(
                { error: 'Valid email address is required' },
                { status: 400 }
            );
        }

        // Check if warranty already exists for this order
        const { data: existing } = await supabase
            .from('warranty_registrations')
            .select('id, status, missing_seller_feedback, missing_product_review, screenshot_seller_feedback, screenshot_product_review')
            .eq('order_id', orderId)
            .single();

        // Handle resubmission
        if (existing && existing.status === 'NEEDS_RESUBMISSION') {
            const timestamp = Date.now();
            let updateData: any = {
                status: 'PROCESSING',
                customer_email: email,
                missing_seller_feedback: false,
                missing_product_review: false
            };

            // Upload only the missing screenshot(s)
            if (existing.missing_seller_feedback && screenshotSellerFeedback) {
                const feedbackPath = `warranty/${orderId}/seller-feedback-${timestamp}.${screenshotSellerFeedback.name.split('.').pop()}`;
                const { error: feedbackError } = await supabase.storage
                    .from('uploads')
                    .upload(feedbackPath, screenshotSellerFeedback);

                if (feedbackError) {
                    console.error('Feedback upload error:', feedbackError);
                    return NextResponse.json(
                        { error: 'Failed to upload seller feedback screenshot' },
                        { status: 500 }
                    );
                }

                const { data: feedbackUrl } = supabase.storage.from('uploads').getPublicUrl(feedbackPath);
                updateData.screenshot_seller_feedback = feedbackUrl.publicUrl;
            }

            if (existing.missing_product_review && screenshotProductReview) {
                const reviewPath = `warranty/${orderId}/product-review-${timestamp}.${screenshotProductReview.name.split('.').pop()}`;
                const { error: reviewError } = await supabase.storage
                    .from('uploads')
                    .upload(reviewPath, screenshotProductReview);

                if (reviewError) {
                    console.error('Review upload error:', reviewError);
                    return NextResponse.json(
                        { error: 'Failed to upload product review screenshot' },
                        { status: 500 }
                    );
                }

                const { data: reviewUrl } = supabase.storage.from('uploads').getPublicUrl(reviewPath);
                updateData.screenshot_product_review = reviewUrl.publicUrl;
            }

            // Update existing registration
            const { error: updateError } = await supabase
                .from('warranty_registrations')
                .update(updateData)
                .eq('id', existing.id);

            if (updateError) {
                console.error('Warranty update error:', updateError);
                return NextResponse.json(
                    { error: 'Failed to update warranty registration' },
                    { status: 500 }
                );
            }

            return NextResponse.json({
                success: true,
                message: 'Screenshot resubmitted successfully! We will verify within 24 hours.',
                registrationId: existing.id,
                status: 'PROCESSING'
            });
        }

        // If warranty exists and not needing resubmission, return its status
        if (existing) {
            return NextResponse.json({
                success: true,
                message: existing.status === 'VERIFIED'
                    ? 'Your warranty is already verified!'
                    : existing.status === 'REJECTED'
                        ? 'Your warranty registration was rejected. Please contact support.'
                        : 'Your warranty registration is being processed.',
                status: existing.status
            });
        }

        // New registration - require both screenshots
        if (!screenshotSellerFeedback || !screenshotProductReview) {
            return NextResponse.json(
                { error: 'Both screenshots are required for new registration' },
                { status: 400 }
            );
        }

        // Get order details for storing with warranty and check fulfillment type
        let productName = null;
        let quantity = 1;
        let purchaseDate = null;
        let fulfillmentType = null;

        const { data: order, error: orderError } = await supabase
            .from('amazon_orders')
            .select('fsn, quantity, order_date, fulfillment_type')
            .eq('order_id', orderId)
            .single();

        if (orderError || !order) {
            return NextResponse.json(
                { error: '⚠️ This Order ID does not belong to SimplySolutions. This product was sold by a FAKE SELLER / our competitor who sells fake pirated copies and makes their listing identical to ours to mislead customers. There is NO warranty for this order. We strongly recommend you REQUEST A REFUND immediately and give a 1-STAR RATING to warn other buyers. You have been scammed — we are sorry this happened to you.' },
                { status: 400 }
            );
        }

        quantity = order.quantity || 1;
        purchaseDate = order.order_date;
        fulfillmentType = order.fulfillment_type;

        if (order.fsn) {
            const { data: product } = await supabase
                .from('products_data')
                .select('product_title')
                .eq('fsn', order.fsn)
                .single();
            productName = product?.product_title || null;
        }

        // Auto-approve warranty for website_payment orders (no screenshots needed)
        if (fulfillmentType === 'website_payment') {
            const { data, error } = await supabase
                .from('warranty_registrations')
                .insert({
                    order_id: orderId,
                    customer_email: email,
                    contact: email,
                    status: 'VERIFIED',
                    verified_at: new Date().toISOString(),
                    product_name: productName,
                    quantity: quantity,
                    purchase_date: purchaseDate,
                    screenshot_seller_feedback: null,
                    screenshot_product_review: null,
                    admin_notes: 'Auto-approved for website_payment fulfillment type'
                })
                .select()
                .single();

            if (error) {
                console.error('Warranty auto-approve error:', error);
                return NextResponse.json(
                    { error: 'Failed to register warranty' },
                    { status: 500 }
                );
            }

            return NextResponse.json({
                success: true,
                message: 'Warranty automatically approved! Your order is verified.',
                registrationId: data.id,
                status: 'VERIFIED',
                autoApproved: true
            });
        }


        // Upload screenshots to Supabase Storage
        const timestamp = Date.now();

        const feedbackPath = `warranty/${orderId}/seller-feedback-${timestamp}.${screenshotSellerFeedback.name.split('.').pop()}`;
        const { error: feedbackError } = await supabase.storage
            .from('uploads')
            .upload(feedbackPath, screenshotSellerFeedback);

        if (feedbackError) {
            console.error('Feedback upload error:', feedbackError);
            return NextResponse.json(
                { error: 'Failed to upload seller feedback screenshot' },
                { status: 500 }
            );
        }

        const reviewPath = `warranty/${orderId}/product-review-${timestamp}.${screenshotProductReview.name.split('.').pop()}`;
        const { error: reviewError } = await supabase.storage
            .from('uploads')
            .upload(reviewPath, screenshotProductReview);

        if (reviewError) {
            console.error('Review upload error:', reviewError);
            return NextResponse.json(
                { error: 'Failed to upload product review screenshot' },
                { status: 500 }
            );
        }

        // Get public URLs
        const { data: feedbackUrl } = supabase.storage.from('uploads').getPublicUrl(feedbackPath);
        const { data: reviewUrl } = supabase.storage.from('uploads').getPublicUrl(reviewPath);

        // Create warranty registration
        const { data, error } = await supabase
            .from('warranty_registrations')
            .insert({
                order_id: orderId,
                customer_email: email,
                contact: email, // Legacy support
                status: 'PROCESSING',
                screenshot_seller_feedback: feedbackUrl.publicUrl,
                screenshot_product_review: reviewUrl.publicUrl,
                product_name: productName,
                quantity: quantity,
                purchase_date: purchaseDate
            })
            .select()
            .single();

        if (error) {
            console.error('Warranty insert error:', error);
            return NextResponse.json(
                { error: 'Failed to register warranty' },
                { status: 500 }
            );
        }

        return NextResponse.json({
            success: true,
            message: 'Warranty registration submitted successfully! We will verify within 24 hours.',
            registrationId: data.id,
            status: 'PROCESSING'
        });

    } catch (error) {
        console.error('Warranty registration error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}

// Check warranty status
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const orderId = searchParams.get('orderId');

        if (!orderId) {
            return NextResponse.json(
                { error: 'Order ID is required' },
                { status: 400 }
            );
        }

        const { data, error } = await supabase
            .from('warranty_registrations')
            .select('*')
            .eq('order_id', orderId)
            .single();

        if (error || !data) {
            return NextResponse.json({
                found: false,
                message: 'No warranty registration found for this order'
            });
        }

        return NextResponse.json({
            found: true,
            status: data.status,
            registeredAt: data.created_at,
            verifiedAt: data.verified_at,
            rejectionReason: data.rejection_reason,
            adminNotes: data.admin_notes,
            missingSeller: data.missing_seller_feedback,
            missingReview: data.missing_product_review,
            customerEmail: data.customer_email
        });

    } catch (error) {
        console.error('Warranty status error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
