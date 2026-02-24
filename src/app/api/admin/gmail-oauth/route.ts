/**
 * Gmail OAuth flow — initiates the consent screen redirect
 * GET /api/admin/gmail-oauth/authorize — returns the Google OAuth URL
 * GET /api/admin/gmail-oauth/callback — handles the redirect after consent
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createClient as createAdminClient } from '@supabase/supabase-js';

// Default OAuth client (can be overridden per-account later)
const GMAIL_CLIENT_ID = process.env.GMAIL_CLIENT_ID!;
const GMAIL_CLIENT_SECRET = process.env.GMAIL_CLIENT_SECRET!;

const SCOPES = [
    'https://www.googleapis.com/auth/gmail.readonly',
    'https://www.googleapis.com/auth/gmail.send',
    'https://www.googleapis.com/auth/gmail.modify',
    'https://mail.google.com/',
].join(' ');

// ─── GET /api/admin/gmail-oauth ─────────────────────────────────────
// Two modes:
//   ?action=authorize  → returns the OAuth URL
//   ?code=...          → handles the callback from Google

export async function GET(request: NextRequest) {
    try {
        // Auth check
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
        if (!profile || (profile.role !== 'admin' && profile.role !== 'super_admin')) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        const { searchParams } = new URL(request.url);
        const action = searchParams.get('action');
        const code = searchParams.get('code');
        const label = searchParams.get('label') || '';

        // ── Authorize: Return the Google consent URL ──
        if (action === 'authorize') {
            const origin = request.headers.get('origin') || request.nextUrl.origin;
            const redirectUri = `${origin}/api/admin/gmail-oauth`;

            const params = new URLSearchParams({
                client_id: GMAIL_CLIENT_ID,
                redirect_uri: redirectUri,
                response_type: 'code',
                scope: SCOPES,
                access_type: 'offline',
                prompt: 'consent',  // force consent to always get refresh token
                state: JSON.stringify({ label }),
            });

            const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
            return NextResponse.json({ success: true, authUrl });
        }

        // ── Callback: Exchange code for tokens ──
        if (code) {
            const origin = request.nextUrl.origin;
            const redirectUri = `${origin}/api/admin/gmail-oauth`;
            const stateStr = searchParams.get('state') || '{}';
            let parsedLabel = '';
            try { parsedLabel = JSON.parse(stateStr).label || ''; } catch { }

            // Exchange authorization code for tokens
            const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
                method: 'POST',
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                body: new URLSearchParams({
                    code,
                    client_id: GMAIL_CLIENT_ID,
                    client_secret: GMAIL_CLIENT_SECRET,
                    redirect_uri: redirectUri,
                    grant_type: 'authorization_code',
                }),
            });

            const tokenData = await tokenRes.json();

            if (tokenData.error) {
                // Redirect back with error
                return NextResponse.redirect(
                    `${origin}/admin/gmail-enquiries?oauth_error=${encodeURIComponent(tokenData.error_description || tokenData.error)}`
                );
            }

            const accessToken = tokenData.access_token;
            const refreshToken = tokenData.refresh_token;

            if (!refreshToken) {
                return NextResponse.redirect(
                    `${origin}/admin/gmail-enquiries?oauth_error=${encodeURIComponent('No refresh token received. Please try again and make sure to grant all permissions.')}`
                );
            }

            // Get user's email
            const profileRes = await fetch('https://www.googleapis.com/gmail/v1/users/me/profile', {
                headers: { Authorization: `Bearer ${accessToken}` },
            });
            const gmailProfile = await profileRes.json();
            const email = gmailProfile.emailAddress;

            if (!email) {
                return NextResponse.redirect(
                    `${origin}/admin/gmail-enquiries?oauth_error=${encodeURIComponent('Could not retrieve email address')}`
                );
            }

            // Save to database
            const adminClient = createAdminClient(
                process.env.NEXT_PUBLIC_SUPABASE_URL!,
                process.env.SUPABASE_SERVICE_ROLE_KEY!
            );

            const { error: dbError } = await adminClient
                .from('gmail_accounts')
                .upsert({
                    email,
                    label: parsedLabel || email,
                    client_id: GMAIL_CLIENT_ID,
                    client_secret: GMAIL_CLIENT_SECRET,
                    refresh_token: refreshToken,
                    is_active: true,
                    updated_at: new Date().toISOString(),
                }, { onConflict: 'email' });

            if (dbError) {
                return NextResponse.redirect(
                    `${origin}/admin/gmail-enquiries?oauth_error=${encodeURIComponent(dbError.message)}`
                );
            }

            // Redirect back with success
            return NextResponse.redirect(
                `${origin}/admin/gmail-enquiries?oauth_success=${encodeURIComponent(email)}`
            );
        }

        return NextResponse.json({ error: 'Invalid request. Use ?action=authorize or provide a code.' }, { status: 400 });
    } catch (error) {
        console.error('Gmail OAuth error:', error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : 'OAuth flow failed' },
            { status: 500 }
        );
    }
}
