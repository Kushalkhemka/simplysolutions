import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

// GET /api/tickets/[id] - Get ticket with messages
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
        }

        const adminClient = createAdminClient();

        // Get ticket
        const { data: ticket, error: ticketError } = await adminClient
            .from('tickets')
            .select('*, order:orders(order_number)')
            .eq('id', id)
            .eq('user_id', user.id)
            .single();

        if (ticketError || !ticket) {
            return NextResponse.json({ success: false, error: 'Ticket not found' }, { status: 404 });
        }

        // Get messages
        const { data: messages, error: messagesError } = await adminClient
            .from('ticket_messages')
            .select('*, sender:profiles(full_name)')
            .eq('ticket_id', id)
            .eq('is_internal', false)
            .order('created_at', { ascending: true });

        if (messagesError) throw messagesError;

        return NextResponse.json({ success: true, data: { ticket, messages } });
    } catch (error) {
        console.error('Ticket GET error:', error);
        return NextResponse.json({ success: false, error: 'Failed to fetch ticket' }, { status: 500 });
    }
}

// PATCH /api/tickets/[id] - User reply to ticket
export async function PATCH(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const { message } = body;

        if (!message) {
            return NextResponse.json({ success: false, error: 'Message is required' }, { status: 400 });
        }

        const adminClient = createAdminClient();

        // Verify ticket ownership
        const { data: ticket } = await adminClient
            .from('tickets')
            .select('id, status')
            .eq('id', id)
            .eq('user_id', user.id)
            .single();

        if (!ticket) {
            return NextResponse.json({ success: false, error: 'Ticket not found' }, { status: 404 });
        }

        if (ticket.status === 'closed' || ticket.status === 'resolved') {
            return NextResponse.json({ success: false, error: 'Ticket is closed' }, { status: 400 });
        }

        // Add message
        const { data: newMessage, error: messageError } = await adminClient
            .from('ticket_messages')
            .insert({
                ticket_id: id,
                sender_type: 'user',
                sender_id: user.id,
                message,
            })
            .select('*, sender:profiles(full_name)')
            .single();

        if (messageError) throw messageError;

        // Update ticket status to open if it was awaiting_reply
        if (ticket.status === 'awaiting_reply') {
            await adminClient
                .from('tickets')
                .update({ status: 'open' })
                .eq('id', id);
        }

        return NextResponse.json({ success: true, data: newMessage });
    } catch (error) {
        console.error('Ticket PATCH error:', error);
        return NextResponse.json({ success: false, error: 'Failed to send message' }, { status: 500 });
    }
}
