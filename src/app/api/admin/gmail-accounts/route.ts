import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// GET - List all Gmail accounts
export async function GET() {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
        if (!profile || (profile.role !== 'admin' && profile.role !== 'super_admin')) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        const { data: accounts, error } = await supabase
            .from('gmail_accounts')
            .select('id, email, label, is_active, last_synced_at, created_at')
            .order('created_at', { ascending: true });

        if (error) throw new Error(error.message);

        return NextResponse.json({ success: true, accounts: accounts || [] });
    } catch (error) {
        return NextResponse.json(
            { error: error instanceof Error ? error.message : 'Failed to fetch accounts' },
            { status: 500 }
        );
    }
}

// POST - Add a new Gmail account
export async function POST(request: NextRequest) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
        if (!profile || (profile.role !== 'admin' && profile.role !== 'super_admin')) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        const body = await request.json();
        const { email, label, client_id, client_secret, refresh_token } = body;

        if (!email || !client_id || !client_secret || !refresh_token) {
            return NextResponse.json(
                { error: 'Missing required fields: email, client_id, client_secret, refresh_token' },
                { status: 400 }
            );
        }

        // Verify the credentials work by trying to get an access token
        const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({
                client_id,
                client_secret,
                refresh_token,
                grant_type: 'refresh_token',
            }),
        });
        const tokenData = await tokenRes.json();

        if (tokenData.error) {
            return NextResponse.json(
                { error: `Invalid credentials: ${tokenData.error_description || tokenData.error}` },
                { status: 400 }
            );
        }

        const { data, error } = await supabase
            .from('gmail_accounts')
            .upsert({
                email,
                label: label || email,
                client_id,
                client_secret,
                refresh_token,
                is_active: true,
            }, { onConflict: 'email' })
            .select('id, email, label, is_active')
            .single();

        if (error) throw new Error(error.message);

        return NextResponse.json({ success: true, account: data });
    } catch (error) {
        return NextResponse.json(
            { error: error instanceof Error ? error.message : 'Failed to add account' },
            { status: 500 }
        );
    }
}

// PATCH - Toggle account active status
export async function PATCH(request: NextRequest) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
        if (!profile || (profile.role !== 'admin' && profile.role !== 'super_admin')) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        const body = await request.json();
        const { id, is_active } = body;

        if (!id) return NextResponse.json({ error: 'Missing account id' }, { status: 400 });

        const { error } = await supabase
            .from('gmail_accounts')
            .update({ is_active, updated_at: new Date().toISOString() })
            .eq('id', id);

        if (error) throw new Error(error.message);

        return NextResponse.json({ success: true });
    } catch (error) {
        return NextResponse.json(
            { error: error instanceof Error ? error.message : 'Failed to update account' },
            { status: 500 }
        );
    }
}

// DELETE - Remove a Gmail account
export async function DELETE(request: NextRequest) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
        if (!profile || (profile.role !== 'admin' && profile.role !== 'super_admin')) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');
        if (!id) return NextResponse.json({ error: 'Missing account id' }, { status: 400 });

        const { error } = await supabase.from('gmail_accounts').delete().eq('id', id);
        if (error) throw new Error(error.message);

        return NextResponse.json({ success: true });
    } catch (error) {
        return NextResponse.json(
            { error: error instanceof Error ? error.message : 'Failed to delete account' },
            { status: 500 }
        );
    }
}
