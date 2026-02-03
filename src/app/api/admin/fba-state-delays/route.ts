/**
 * Admin API for managing FBA state-based delivery delays
 * 
 * GET: List all state delays
 * POST: Add new state
 * PUT: Update delay for a state
 * DELETE: Remove a state
 * 
 * Note: Delays are stored in HOURS for flexibility (e.g., 6 hours for Delhi, 72 for 3 days)
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { invalidateStateDelaysCache } from '@/lib/amazon/fba-redemption-check';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// GET: List all state delays
export async function GET() {
    try {
        const { data, error } = await supabase
            .from('fba_state_delays')
            .select('*')
            .order('state_name', { ascending: true });

        if (error) {
            console.error('Error fetching state delays:', error);
            return NextResponse.json({ error: 'Failed to fetch state delays' }, { status: 500 });
        }

        return NextResponse.json({ success: true, data });
    } catch (error) {
        console.error('Error in GET state delays:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

// POST: Add new state
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { state_name, delay_hours } = body;

        if (!state_name || typeof delay_hours !== 'number') {
            return NextResponse.json(
                { error: 'State name and delay hours are required' },
                { status: 400 }
            );
        }

        if (delay_hours < 1 || delay_hours > 336) { // Max 14 days = 336 hours
            return NextResponse.json(
                { error: 'Delay must be between 1 and 336 hours (14 days)' },
                { status: 400 }
            );
        }

        const { data, error } = await supabase
            .from('fba_state_delays')
            .insert({
                state_name: state_name.toUpperCase().trim(),
                delay_hours
            })
            .select()
            .single();

        if (error) {
            if (error.code === '23505') {
                return NextResponse.json(
                    { error: 'State already exists' },
                    { status: 409 }
                );
            }
            console.error('Error adding state:', error);
            return NextResponse.json({ error: 'Failed to add state' }, { status: 500 });
        }

        // Invalidate cache so new settings take effect
        invalidateStateDelaysCache();

        return NextResponse.json({ success: true, data });
    } catch (error) {
        console.error('Error in POST state delay:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

// PUT: Update delay for a state
export async function PUT(request: NextRequest) {
    try {
        const body = await request.json();
        const { id, delay_hours, state_name } = body;

        if (!id) {
            return NextResponse.json({ error: 'State ID is required' }, { status: 400 });
        }

        if (typeof delay_hours !== 'number' || delay_hours < 1 || delay_hours > 336) {
            return NextResponse.json(
                { error: 'Delay must be between 1 and 336 hours (14 days)' },
                { status: 400 }
            );
        }

        const updateData: { delay_hours: number; state_name?: string; updated_at: string } = {
            delay_hours,
            updated_at: new Date().toISOString()
        };

        if (state_name) {
            updateData.state_name = state_name.toUpperCase().trim();
        }

        const { data, error } = await supabase
            .from('fba_state_delays')
            .update(updateData)
            .eq('id', id)
            .select()
            .single();

        if (error) {
            console.error('Error updating state delay:', error);
            return NextResponse.json({ error: 'Failed to update state delay' }, { status: 500 });
        }

        if (!data) {
            return NextResponse.json({ error: 'State not found' }, { status: 404 });
        }

        // Invalidate cache so new settings take effect
        invalidateStateDelaysCache();

        return NextResponse.json({ success: true, data });
    } catch (error) {
        console.error('Error in PUT state delay:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

// DELETE: Remove a state
export async function DELETE(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');

        if (!id) {
            return NextResponse.json({ error: 'State ID is required' }, { status: 400 });
        }

        const { error } = await supabase
            .from('fba_state_delays')
            .delete()
            .eq('id', id);

        if (error) {
            console.error('Error deleting state:', error);
            return NextResponse.json({ error: 'Failed to delete state' }, { status: 500 });
        }

        // Invalidate cache so removal takes effect
        invalidateStateDelaysCache();

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error in DELETE state delay:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
