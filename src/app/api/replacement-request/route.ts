import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Submit a new replacement request
export async function POST(request: NextRequest) {
    try {
        const formData = await request.formData();

        const orderId = formData.get('orderId') as string;
        const customerEmail = formData.get('customerEmail') as string;
        const screenshot = formData.get('screenshot') as File;

        // Validate required fields
        if (!orderId || !customerEmail || !screenshot) {
            return NextResponse.json(
                { error: 'Order ID, email, and screenshot are required' },
                { status: 400 }
            );
        }

        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(customerEmail)) {
            return NextResponse.json(
                { error: 'Please enter a valid email address' },
                { status: 400 }
            );
        }

        // Verify the order exists and is already redeemed
        const { data: order, error: orderError } = await supabase
            .from('amazon_orders')
            .select('id, order_id, fsn, license_key_id')
            .eq('order_id', orderId)
            .single();

        if (orderError || !order) {
            return NextResponse.json(
                { error: 'Order not found. Please verify your Order ID.' },
                { status: 404 }
            );
        }

        if (!order.license_key_id) {
            return NextResponse.json(
                { error: 'This order has not been activated yet. Please activate first, then request replacement if needed.' },
                { status: 400 }
            );
        }

        // Check if there's already a pending replacement request
        const { data: existingRequest } = await supabase
            .from('license_replacement_requests')
            .select('id, status')
            .eq('order_id', orderId)
            .eq('status', 'PENDING')
            .single();

        if (existingRequest) {
            return NextResponse.json(
                { error: 'You already have a pending replacement request for this order. Please wait for it to be reviewed.' },
                { status: 400 }
            );
        }

        // Upload screenshot to Supabase Storage
        const timestamp = Date.now();
        const fileExtension = screenshot.name.split('.').pop() || 'png';
        const screenshotPath = `replacement-requests/${orderId}/${timestamp}.${fileExtension}`;

        const { error: uploadError } = await supabase.storage
            .from('uploads')
            .upload(screenshotPath, screenshot);

        if (uploadError) {
            console.error('Screenshot upload error:', uploadError);
            return NextResponse.json(
                { error: 'Failed to upload screenshot. Please try again.' },
                { status: 500 }
            );
        }

        // Get public URL for the screenshot
        const { data: urlData } = supabase.storage.from('uploads').getPublicUrl(screenshotPath);

        // Create replacement request
        const { data: replacementRequest, error: insertError } = await supabase
            .from('license_replacement_requests')
            .insert({
                order_id: orderId,
                customer_email: customerEmail,
                fsn: order.fsn,
                original_license_key_id: order.license_key_id,
                screenshot_url: urlData.publicUrl,
                status: 'PENDING'
            })
            .select()
            .single();

        if (insertError) {
            console.error('Replacement request insert error:', insertError);
            return NextResponse.json(
                { error: 'Failed to submit replacement request. Please try again.' },
                { status: 500 }
            );
        }

        return NextResponse.json({
            success: true,
            message: 'Replacement request submitted successfully! We will investigate within 12-24 hours.',
            requestId: replacementRequest.id
        });

    } catch (error) {
        console.error('Replacement request error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}

// Check replacement request status by order ID
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

        // Get all replacement requests for this order (most recent first)
        const { data: requests, error } = await supabase
            .from('license_replacement_requests')
            .select(`
                id,
                status,
                admin_notes,
                created_at,
                reviewed_at,
                new_license_key_id
            `)
            .eq('order_id', orderId)
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Error fetching replacement requests:', error);
            return NextResponse.json(
                { error: 'Failed to fetch replacement request status' },
                { status: 500 }
            );
        }

        if (!requests || requests.length === 0) {
            return NextResponse.json({
                found: false,
                message: 'No replacement requests found for this order'
            });
        }

        // Get the most recent request
        const latestRequest = requests[0];

        // If approved, get the new license key
        let newLicenseKey = null;
        if (latestRequest.status === 'APPROVED' && latestRequest.new_license_key_id) {
            const { data: keyData } = await supabase
                .from('amazon_activation_license_keys')
                .select('license_key')
                .eq('id', latestRequest.new_license_key_id)
                .single();

            newLicenseKey = keyData?.license_key;
        }

        return NextResponse.json({
            found: true,
            status: latestRequest.status,
            adminNotes: latestRequest.status === 'REJECTED' ? latestRequest.admin_notes : null,
            submittedAt: latestRequest.created_at,
            reviewedAt: latestRequest.reviewed_at,
            newLicenseKey,
            allRequests: requests.map(r => ({
                id: r.id,
                status: r.status,
                submittedAt: r.created_at,
                reviewedAt: r.reviewed_at
            }))
        });

    } catch (error) {
        console.error('Replacement status error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
