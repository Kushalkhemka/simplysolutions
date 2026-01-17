import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

// GET /api/admin/tickets/[id] - Get ticket with all messages (including internal)
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

        // Verify admin role
        const { data: profile } = await adminClient
            .from('profiles')
            .select('role')
            .eq('id', user.id)
            .single();

        if (!profile || (profile.role !== 'admin' && profile.role !== 'super_admin')) {
            return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
        }

        // Get ticket with user details
        const { data: ticket, error: ticketError } = await adminClient
            .from('tickets')
            .select('*, user:profiles(full_name, email, phone), order:orders(order_number)')
            .eq('id', id)
            .single();

        if (ticketError || !ticket) {
            return NextResponse.json({ success: false, error: 'Ticket not found' }, { status: 404 });
        }

        // Get all messages (including internal notes)
        const { data: messages, error: messagesError } = await adminClient
            .from('ticket_messages')
            .select('*, sender:profiles(full_name)')
            .eq('ticket_id', id)
            .order('created_at', { ascending: true });

        if (messagesError) throw messagesError;

        return NextResponse.json({ success: true, data: { ticket, messages } });
    } catch (error) {
        console.error('Admin ticket GET error:', error);
        return NextResponse.json({ success: false, error: 'Failed to fetch ticket' }, { status: 500 });
    }
}

// PATCH /api/admin/tickets/[id] - Update ticket status/priority
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

        const adminClient = createAdminClient();

        // Verify admin role
        const { data: profile } = await adminClient
            .from('profiles')
            .select('role')
            .eq('id', user.id)
            .single();

        if (!profile || (profile.role !== 'admin' && profile.role !== 'super_admin')) {
            return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
        }

        const body = await request.json();
        const { status, priority, assigned_to } = body;

        const updates: any = {};
        if (status) updates.status = status;
        if (priority) updates.priority = priority;
        if (assigned_to !== undefined) updates.assigned_to = assigned_to;

        const { data: ticket, error } = await adminClient
            .from('tickets')
            .update(updates)
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;

        return NextResponse.json({ success: true, data: ticket });
    } catch (error) {
        console.error('Admin ticket PATCH error:', error);
        return NextResponse.json({ success: false, error: 'Failed to update ticket' }, { status: 500 });
    }
}
