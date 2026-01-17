import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

// POST /api/admin/tickets/[id]/reply - Admin reply to ticket
export async function POST(
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
        const { message, is_internal } = body;

        if (!message) {
            return NextResponse.json({ success: false, error: 'Message is required' }, { status: 400 });
        }

        // Add message
        const { data: newMessage, error: messageError } = await adminClient
            .from('ticket_messages')
            .insert({
                ticket_id: id,
                sender_type: 'admin',
                sender_id: user.id,
                message,
                is_internal: is_internal || false,
            })
            .select('*, sender:profiles(full_name)')
            .single();

        if (messageError) throw messageError;

        // Update ticket status to awaiting_reply if not internal note
        if (!is_internal) {
            await adminClient
                .from('tickets')
                .update({ status: 'awaiting_reply' })
                .eq('id', id);

            // TODO: Send push notification to user
            // TODO: Send email notification to user
        }

        return NextResponse.json({ success: true, data: newMessage });
    } catch (error) {
        console.error('Admin ticket reply error:', error);
        return NextResponse.json({ success: false, error: 'Failed to send reply' }, { status: 500 });
    }
}
