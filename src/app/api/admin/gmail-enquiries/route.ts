import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createClient as createAdminClient } from '@supabase/supabase-js';
import { fetchThreadMessages, GmailCredentials } from '@/lib/gmail';

export async function GET(request: NextRequest) {
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

        const { searchParams } = new URL(request.url);
        const threadId = searchParams.get('threadId');
        const accountEmail = searchParams.get('accountEmail');

        // If threadId is provided, fetch live thread messages from Gmail
        if (threadId) {
            // Look up account credentials if accountEmail is provided
            let creds: GmailCredentials | undefined;
            if (accountEmail) {
                const adminClient = createAdminClient(
                    process.env.NEXT_PUBLIC_SUPABASE_URL!,
                    process.env.SUPABASE_SERVICE_ROLE_KEY!
                );
                const { data: account } = await adminClient
                    .from('gmail_accounts')
                    .select('client_id, client_secret, refresh_token, email')
                    .eq('email', accountEmail)
                    .eq('is_active', true)
                    .single();

                if (account) {
                    creds = {
                        clientId: account.client_id,
                        clientSecret: account.client_secret,
                        refreshToken: account.refresh_token,
                        email: account.email,
                    };
                }
            }

            const messages = await fetchThreadMessages(threadId, creds);
            return NextResponse.json({ success: true, messages });
        }

        // Otherwise fetch cached enquiries from database (use admin client to bypass RLS)
        const adminClient = createAdminClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!
        );

        const { data: enquiries, error } = await adminClient
            .from('gmail_enquiries')
            .select('*')
            .order('date', { ascending: false });

        if (error) {
            console.error('Database fetch error:', error);
            return NextResponse.json({ error: 'Failed to fetch enquiries from database' }, { status: 500 });
        }

        // Transform database records to the expected format
        const formattedEnquiries = (enquiries || []).map((e: any) => ({
            id: e.id,
            threadId: e.thread_id,
            messageId: e.message_id,
            from: e.from_address,
            to: e.to_address,
            subject: e.subject,
            date: e.date,
            snippet: e.snippet,
            body: e.body,
            labels: e.labels || [],
            customerName: e.customer_name,
            orderId: e.order_id,
            product: e.product,
            returnRequested: e.return_requested,
            reason: e.reason,
            category: e.category,
            aiSuggestedReply: e.ai_suggested_reply,
            aiTemplateUsed: e.ai_template_used,
            isReplied: e.is_replied,
            repliedAt: e.replied_at,
            accountEmail: e.account_email,
        }));

        return NextResponse.json({ success: true, enquiries: formattedEnquiries });
    } catch (error) {
        console.error('Gmail enquiries error:', error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : 'Failed to fetch enquiries' },
            { status: 500 }
        );
    }
}

// Mark as replied
export async function PATCH(request: NextRequest) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
        const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
        if (!profile || (profile.role !== 'admin' && profile.role !== 'super_admin')) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        const body = await request.json();
        const { threadId } = body;

        if (!threadId) {
            return NextResponse.json({ error: 'threadId is required' }, { status: 400 });
        }

        const adminClient = createAdminClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!
        );

        const { error } = await adminClient
            .from('gmail_enquiries')
            .update({ is_replied: true, replied_at: new Date().toISOString() })
            .eq('thread_id', threadId);

        if (error) {
            throw new Error(error.message);
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Gmail enquiry update error:', error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : 'Failed to update' },
            { status: 500 }
        );
    }
}
