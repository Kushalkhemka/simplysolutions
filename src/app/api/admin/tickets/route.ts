import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

// GET /api/admin/tickets - List all tickets (admin only)
export async function GET(request: NextRequest) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
        }

        // Verify admin role
        const adminClient = createAdminClient();
        const { data: profile } = await adminClient
            .from('profiles')
            .select('role')
            .eq('id', user.id)
            .single();

        if (!profile || (profile.role !== 'admin' && profile.role !== 'super_admin')) {
            return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
        }

        const { data: tickets, error } = await adminClient
            .from('tickets')
            .select('*, user:profiles(full_name, email)')
            .order('updated_at', { ascending: false });

        if (error) throw error;

        return NextResponse.json({ success: true, data: tickets });
    } catch (error) {
        console.error('Admin tickets GET error:', error);
        return NextResponse.json({ success: false, error: 'Failed to fetch tickets' }, { status: 500 });
    }
}
