/**
 * Admin proxy route to trigger a Gmail sync.
 * Called by the "Sync Now" button in the admin UI.
 * Uses admin session auth (not the cron secret), so the secret never leaves the server.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
    try {
        // Admin auth check — same pattern as other admin routes
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
        const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
        if (!profile || (profile.role !== 'admin' && profile.role !== 'super_admin')) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        // Call the cron endpoint server-side with the real secret
        const cronSecret = process.env.CRON_SECRET || '';
        const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || `http://localhost:${process.env.PORT || 3000}`;

        const res = await fetch(`${baseUrl}/api/cron/sync-gmail`, {
            headers: {
                Authorization: `Bearer ${cronSecret}`,
            },
        });

        const data = await res.json();
        return NextResponse.json(data, { status: res.status });
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        return NextResponse.json({ success: false, error: message }, { status: 500 });
    }
}
