import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

// GET /api/tickets - List user's tickets
export async function GET(request: NextRequest) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
        }

        const adminClient = createAdminClient();

        const { data: tickets, error } = await adminClient
            .from('tickets')
            .select('*')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false });

        if (error) throw error;

        return NextResponse.json({ success: true, data: tickets });
    } catch (error) {
        console.error('Tickets GET error:', error);
        return NextResponse.json({ success: false, error: 'Failed to fetch tickets' }, { status: 500 });
    }
}

// POST /api/tickets - Create new ticket
export async function POST(request: NextRequest) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const { subject, category, priority, order_id, message } = body;

        if (!subject || !category || !message) {
            return NextResponse.json({ success: false, error: 'Missing required fields' }, { status: 400 });
        }

        const adminClient = createAdminClient();

        // Create ticket
        const { data: ticket, error: ticketError } = await adminClient
            .from('tickets')
            .insert({
                user_id: user.id,
                subject,
                category,
                priority: priority || 'medium',
                order_id: order_id || null,
            })
            .select()
            .single();

        if (ticketError) throw ticketError;

        // Create initial message
        const { error: messageError } = await adminClient
            .from('ticket_messages')
            .insert({
                ticket_id: ticket.id,
                sender_type: 'user',
                sender_id: user.id,
                message,
            });

        if (messageError) throw messageError;

        return NextResponse.json({ success: true, data: ticket });
    } catch (error) {
        console.error('Tickets POST error:', error);
        return NextResponse.json({ success: false, error: 'Failed to create ticket' }, { status: 500 });
    }
}
