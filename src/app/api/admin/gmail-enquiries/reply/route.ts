import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createClient as createAdminClient } from '@supabase/supabase-js';
import { sendGmailReply, GmailCredentials } from '@/lib/gmail';

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

        const body = await request.json();
        const { threadId, inReplyTo, to, subject, replyBody, accountEmail } = body;

        if (!threadId || !to || !replyBody) {
            return NextResponse.json(
                { error: 'Missing required fields: threadId, to, replyBody' },
                { status: 400 }
            );
        }

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

        const result = await sendGmailReply({
            threadId,
            inReplyTo: inReplyTo || '',
            to,
            subject: subject || '',
            body: replyBody,
            creds,
        });

        return NextResponse.json({ success: true, messageId: result.id });
    } catch (error) {
        console.error('Gmail reply error:', error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : 'Failed to send reply' },
            { status: 500 }
        );
    }
}
