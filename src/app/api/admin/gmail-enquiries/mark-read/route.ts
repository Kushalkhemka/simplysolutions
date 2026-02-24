import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createClient as createAdminClient } from '@supabase/supabase-js';
import { markMessagesAsRead, GmailCredentials } from '@/lib/gmail';

export async function POST(request: NextRequest) {
    try {
        // Auth check
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
        const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
        if (!profile || (profile.role !== 'admin' && profile.role !== 'super_admin')) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        const body = await request.json().catch(() => ({}));
        const { threadIds } = body as { threadIds?: string[] };

        const adminClient = createAdminClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!
        );

        // Fetch enquiries that currently have UNREAD in their labels
        let query = adminClient
            .from('gmail_enquiries')
            .select('id, labels, account_email')
            .contains('labels', ['UNREAD']);

        if (threadIds && threadIds.length > 0) {
            query = query.in('thread_id', threadIds);
        }

        const { data: unreadEnquiries, error: fetchError } = await query;

        if (fetchError) {
            throw new Error(fetchError.message);
        }

        if (!unreadEnquiries || unreadEnquiries.length === 0) {
            return NextResponse.json({ success: true, updatedCount: 0 });
        }

        // Group message IDs by account email so we use the right credentials for each
        const accountGroups = new Map<string, string[]>();
        for (const enquiry of unreadEnquiries) {
            const email = enquiry.account_email || '__default__';
            const group = accountGroups.get(email) || [];
            group.push(enquiry.id);
            accountGroups.set(email, group);
        }

        // Fetch all Gmail account credentials
        const { data: accounts } = await adminClient
            .from('gmail_accounts')
            .select('email, client_id, client_secret, refresh_token')
            .eq('is_active', true);

        const accountCredMap = new Map<string, GmailCredentials>();
        for (const acc of (accounts || [])) {
            accountCredMap.set(acc.email, {
                clientId: acc.client_id,
                clientSecret: acc.client_secret,
                refreshToken: acc.refresh_token,
                email: acc.email,
            });
        }

        // Mark as read in Gmail API for each account group
        let gmailMarked = 0;
        for (const [email, messageIds] of accountGroups) {
            const creds = email === '__default__' ? undefined : accountCredMap.get(email);
            try {
                const count = await markMessagesAsRead(messageIds, creds);
                gmailMarked += count;
            } catch (e) {
                console.error(`Failed to mark as read in Gmail for ${email}:`, e);
            }
        }

        // Update database — remove UNREAD from labels
        let updatedCount = 0;
        for (const enquiry of unreadEnquiries) {
            const newLabels = (enquiry.labels as string[]).filter((l: string) => l !== 'UNREAD');
            const { error: updateError } = await adminClient
                .from('gmail_enquiries')
                .update({ labels: newLabels })
                .eq('id', enquiry.id);

            if (!updateError) updatedCount++;
        }

        return NextResponse.json({ success: true, updatedCount, gmailMarked });
    } catch (error) {
        console.error('Mark read error:', error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : 'Failed to mark as read' },
            { status: 500 }
        );
    }
}
