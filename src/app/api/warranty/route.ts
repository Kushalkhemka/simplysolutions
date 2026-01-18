import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

export async function POST(request: NextRequest) {
    try {
        const formData = await request.formData();

        const orderId = formData.get('orderId') as string;
        const contact = formData.get('contact') as string;
        const screenshotSellerFeedback = formData.get('screenshotSellerFeedback') as File;
        const screenshotProductReview = formData.get('screenshotProductReview') as File;

        // Validate required fields
        if (!orderId || !screenshotSellerFeedback || !screenshotProductReview) {
            return NextResponse.json(
                { error: 'Order ID and both screenshots are required' },
                { status: 400 }
            );
        }

        // Check if warranty already exists for this order
        const { data: existing } = await supabase
            .from('warranty_registrations')
            .select('id, status')
            .eq('order_id', orderId)
            .single();

        if (existing) {
            return NextResponse.json({
                success: true,
                message: `Your warranty registration is already ${existing.status.toLowerCase()}.`,
                status: existing.status
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
                contact: contact || null,
                status: 'PROCESSING',
                screenshot_seller_feedback: feedbackUrl.publicUrl,
                screenshot_product_review: reviewUrl.publicUrl
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
            rejectionReason: data.rejection_reason
        });

    } catch (error) {
        console.error('Warranty status error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
