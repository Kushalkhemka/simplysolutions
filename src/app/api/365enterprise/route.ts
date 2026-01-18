import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { orderId, displayName, firstName, lastName, address, phoneNumber } = body;

        // Validate required fields
        if (!orderId || !displayName) {
            return NextResponse.json(
                { error: 'Order ID and Display Name are required' },
                { status: 400 }
            );
        }

        // Check if already exists
        const { data: existing } = await supabase
            .from('office365_customizations')
            .select('id, is_completed')
            .eq('order_id', orderId)
            .single();

        if (existing) {
            return NextResponse.json({
                success: true,
                message: existing.is_completed
                    ? 'Your account has already been created. Check your email.'
                    : 'Your request is already being processed.',
                status: existing.is_completed ? 'completed' : 'processing'
            });
        }

        // Create new request
        const { data, error } = await supabase
            .from('office365_customizations')
            .insert({
                order_id: orderId,
                display_name: displayName,
                first_name: firstName || null,
                last_name: lastName || null,
                address: address || null,
                phone_number: phoneNumber || null,
                is_completed: false
            })
            .select()
            .single();

        if (error) {
            console.error('365 customization insert error:', error);
            return NextResponse.json(
                { error: 'Failed to submit request' },
                { status: 500 }
            );
        }

        return NextResponse.json({
            success: true,
            message: 'Your request has been submitted! We will create your Office 365 account within 24 hours.',
            requestId: data.id
        });

    } catch (error) {
        console.error('365 Enterprise error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
