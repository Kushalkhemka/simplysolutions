/**
 * Customer API for submitting early delivery appeals
 * 
 * POST: Submit an early delivery appeal with proof image
 * GET: Check appeal status for an order
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// POST: Submit early delivery appeal
export async function POST(request: NextRequest) {
    try {
        const formData = await request.formData();
        const orderId = formData.get('orderId') as string;
        const email = formData.get('email') as string;
        const whatsapp = formData.get('whatsapp') as string;
        const proofImage = formData.get('proofImage') as File;

        // Validate required fields
        if (!orderId || !email || !whatsapp || !proofImage) {
            return NextResponse.json(
                { error: 'All fields are required: Order ID, Email, WhatsApp number, and Proof image' },
                { status: 400 }
            );
        }

        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return NextResponse.json(
                { error: 'Please enter a valid email address' },
                { status: 400 }
            );
        }

        // Validate WhatsApp number (Indian format)
        const whatsappClean = whatsapp.replace(/\D/g, '');
        if (whatsappClean.length < 10 || whatsappClean.length > 12) {
            return NextResponse.json(
                { error: 'Please enter a valid WhatsApp number' },
                { status: 400 }
            );
        }

        // Verify order exists and is FBA
        const { data: order, error: orderError } = await supabase
            .from('amazon_orders')
            .select('order_id, fulfillment_type, early_appeal_status, redeemable_at')
            .eq('order_id', orderId.trim())
            .single();

        if (orderError || !order) {
            return NextResponse.json(
                { error: 'Order not found. Please check your order ID.' },
                { status: 404 }
            );
        }

        if (order.fulfillment_type !== 'amazon_fba') {
            return NextResponse.json(
                { error: 'Early delivery appeals are only applicable for physical delivery orders.' },
                { status: 400 }
            );
        }

        // Check if already has an appeal
        if (order.early_appeal_status === 'PENDING') {
            return NextResponse.json(
                { error: 'You already have a pending appeal for this order. Please wait for our team to review it.' },
                { status: 400 }
            );
        }

        if (order.early_appeal_status === 'APPROVED') {
            return NextResponse.json(
                { error: 'Your order is already approved for activation. Please try activating again.' },
                { status: 400 }
            );
        }

        // Check if order is already redeemable (no need for appeal)
        if (order.redeemable_at) {
            const redeemableAt = new Date(order.redeemable_at);
            if (new Date() >= redeemableAt) {
                return NextResponse.json(
                    { error: 'Your order is already available for activation. Please try activating again.' },
                    { status: 400 }
                );
            }
        }

        // Check for existing appeal
        const { data: existingAppeal } = await supabase
            .from('fba_early_appeals')
            .select('id, status')
            .eq('order_id', orderId.trim())
            .order('created_at', { ascending: false })
            .limit(1)
            .single();

        if (existingAppeal?.status === 'PENDING') {
            return NextResponse.json(
                { error: 'You already have a pending appeal. Please wait for our team to review it.' },
                { status: 400 }
            );
        }

        // Upload proof image to Supabase storage
        const fileExt = proofImage.name.split('.').pop()?.toLowerCase() || 'jpg';
        const allowedExtensions = ['jpg', 'jpeg', 'png', 'webp', 'heic'];

        if (!allowedExtensions.includes(fileExt)) {
            return NextResponse.json(
                { error: 'Please upload an image file (JPG, PNG, WebP, or HEIC)' },
                { status: 400 }
            );
        }

        const fileName = `fba-appeals/${orderId.trim()}_${Date.now()}.${fileExt}`;
        const arrayBuffer = await proofImage.arrayBuffer();
        const fileBuffer = new Uint8Array(arrayBuffer);

        const { error: uploadError } = await supabase.storage
            .from('uploads')
            .upload(fileName, fileBuffer, {
                contentType: proofImage.type,
                upsert: true
            });

        if (uploadError) {
            console.error('Error uploading proof image:', uploadError);
            return NextResponse.json(
                { error: 'Failed to upload proof image. Please try again.' },
                { status: 500 }
            );
        }

        // Get public URL
        const { data: urlData } = supabase.storage
            .from('uploads')
            .getPublicUrl(fileName);

        const proofImageUrl = urlData.publicUrl;

        // Create appeal record
        const { data: appeal, error: appealError } = await supabase
            .from('fba_early_appeals')
            .insert({
                order_id: orderId.trim(),
                customer_email: email.trim().toLowerCase(),
                customer_whatsapp: whatsappClean,
                proof_image_url: proofImageUrl,
                status: 'PENDING'
            })
            .select()
            .single();

        if (appealError) {
            console.error('Error creating appeal:', appealError);
            return NextResponse.json(
                { error: 'Failed to submit appeal. Please try again.' },
                { status: 500 }
            );
        }

        // Update order status
        await supabase
            .from('amazon_orders')
            .update({
                early_appeal_status: 'PENDING',
                early_appeal_at: new Date().toISOString()
            })
            .eq('order_id', orderId.trim());

        return NextResponse.json({
            success: true,
            message: 'Your early delivery appeal has been submitted successfully! Our team will review it within 24 hours and notify you via email and WhatsApp.',
            appealId: appeal.id
        });

    } catch (error) {
        console.error('Error submitting early appeal:', error);
        return NextResponse.json(
            { error: 'An unexpected error occurred. Please try again.' },
            { status: 500 }
        );
    }
}

// GET: Check appeal status
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

        const { data: appeal, error } = await supabase
            .from('fba_early_appeals')
            .select('*')
            .eq('order_id', orderId.trim())
            .order('created_at', { ascending: false })
            .limit(1)
            .single();

        if (error || !appeal) {
            return NextResponse.json({
                success: true,
                hasAppeal: false
            });
        }

        return NextResponse.json({
            success: true,
            hasAppeal: true,
            appeal: {
                id: appeal.id,
                status: appeal.status,
                createdAt: appeal.created_at,
                reviewedAt: appeal.reviewed_at,
                rejectionReason: appeal.rejection_reason
            }
        });

    } catch (error) {
        console.error('Error fetching appeal status:', error);
        return NextResponse.json(
            { error: 'Failed to fetch appeal status' },
            { status: 500 }
        );
    }
}
