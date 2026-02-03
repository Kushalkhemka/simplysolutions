import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

export async function POST(request: NextRequest) {
    try {
        const formData = await request.formData();
        const orderId = formData.get('orderId') as string;
        const screenshot = formData.get('screenshot') as File | null;
        const refundType = formData.get('refundType') as string || 'none';
        const partialAmount = formData.get('partialAmount') as string | null;

        if (!orderId) {
            return NextResponse.json(
                { error: 'Order ID is required' },
                { status: 400 }
            );
        }

        if (!screenshot) {
            return NextResponse.json(
                { error: 'Screenshot is required' },
                { status: 400 }
            );
        }

        // Check if there's already a pending appeal for this order (type = review)
        const { data: existing } = await supabase
            .from('feedback_appeals')
            .select('id, status')
            .eq('order_id', orderId)
            .eq('type', 'review')
            .single();

        if (existing && existing.status === 'PENDING') {
            return NextResponse.json(
                { error: 'An appeal is already pending for this order. Please wait for review.' },
                { status: 400 }
            );
        }

        if (existing && existing.status === 'APPROVED') {
            return NextResponse.json(
                { error: 'Your appeal has already been approved. Your warranty should be active.' },
                { status: 400 }
            );
        }

        // Upload screenshot to Supabase Storage
        const timestamp = Date.now();
        const screenshotPath = `review-appeals/${orderId}/proof-${timestamp}.${screenshot.name.split('.').pop()}`;

        const { error: uploadError } = await supabase.storage
            .from('uploads')
            .upload(screenshotPath, screenshot);

        if (uploadError) {
            console.error('Screenshot upload error:', uploadError);
            return NextResponse.json(
                { error: 'Failed to upload screenshot' },
                { status: 500 }
            );
        }

        const { data: screenshotUrl } = supabase.storage.from('uploads').getPublicUrl(screenshotPath);

        // Create or update review appeal record (in feedback_appeals with type='review')
        if (existing) {
            // Update existing rejected appeal
            const { error: updateError } = await supabase
                .from('feedback_appeals')
                .update({
                    status: 'PENDING',
                    screenshot_url: screenshotUrl.publicUrl,
                    submitted_at: new Date().toISOString(),
                    reviewed_at: null,
                    admin_notes: null,
                    refund_type: refundType,
                    partial_amount: refundType === 'partial' && partialAmount ? parseFloat(partialAmount) : null
                })
                .eq('id', existing.id);

            if (updateError) {
                console.error('Appeal update error:', updateError);
                return NextResponse.json(
                    { error: 'Failed to submit appeal' },
                    { status: 500 }
                );
            }
        } else {
            // Create new appeal with type='review'
            const { error: insertError } = await supabase
                .from('feedback_appeals')
                .insert({
                    order_id: orderId,
                    status: 'PENDING',
                    screenshot_url: screenshotUrl.publicUrl,
                    submitted_at: new Date().toISOString(),
                    refund_type: refundType,
                    partial_amount: refundType === 'partial' && partialAmount ? parseFloat(partialAmount) : null,
                    type: 'review'
                });

            if (insertError) {
                console.error('Appeal insert error:', insertError);
                return NextResponse.json(
                    { error: 'Failed to submit appeal' },
                    { status: 500 }
                );
            }
        }

        return NextResponse.json({
            success: true,
            message: 'Appeal submitted successfully! We will review within 24-48 hours.'
        });

    } catch (error) {
        console.error('Review appeal error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}

// Check appeal status
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
            .from('feedback_appeals')
            .select('*')
            .eq('order_id', orderId)
            .eq('type', 'review')
            .single();

        if (error || !data) {
            return NextResponse.json({
                found: false,
                message: 'No appeal found for this order'
            });
        }

        return NextResponse.json({
            found: true,
            status: data.status,
            submittedAt: data.submitted_at,
            reviewedAt: data.reviewed_at,
            adminNotes: data.admin_notes
        });

    } catch (error) {
        console.error('Appeal status error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
