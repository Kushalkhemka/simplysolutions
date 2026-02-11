import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getAdminClient } from '@/lib/supabase/admin';

export async function DELETE(request: NextRequest) {
    try {
        // Verify admin user
        const supabase = await createClient();
        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Check if user is admin
        const { data: profile } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', user.id)
            .single();

        if (!profile?.role || !['admin', 'super_admin'].includes(profile.role)) {
            return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
        }

        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');
        const ids = searchParams.get('ids'); // For bulk delete

        if (!id && !ids) {
            return NextResponse.json({ error: 'ID or IDs required' }, { status: 400 });
        }

        const adminClient = getAdminClient();

        if (ids) {
            // Bulk delete
            const idArray = ids.split(',');
            const { error } = await adminClient
                .from('amazon_activation_license_keys')
                .delete()
                .in('id', idArray);

            if (error) {
                return NextResponse.json({ error: error.message }, { status: 500 });
            }

            return NextResponse.json({ success: true, deleted: idArray.length });
        } else {
            // Single delete
            const { error } = await adminClient
                .from('amazon_activation_license_keys')
                .delete()
                .eq('id', id);

            if (error) {
                return NextResponse.json({ error: error.message }, { status: 500 });
            }

            return NextResponse.json({ success: true, deleted: 1 });
        }
    } catch (error) {
        console.error('License key delete error:', error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : 'Server error' },
            { status: 500 }
        );
    }
}

export async function PATCH(request: NextRequest) {
    try {
        // Verify admin user
        const supabase = await createClient();
        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Check if user is admin
        const { data: profile } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', user.id)
            .single();

        if (!profile?.role || !['admin', 'super_admin'].includes(profile.role)) {
            return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
        }

        const { id, ids, action } = await request.json();

        if (action !== 'mark_unredeemed') {
            return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
        }

        if (!id && !ids) {
            return NextResponse.json({ error: 'ID or IDs required' }, { status: 400 });
        }

        const adminClient = getAdminClient();
        const updateData = {
            is_redeemed: false,
            redeemed_at: null,
            order_id: null,
        };

        if (ids && Array.isArray(ids)) {
            // Bulk mark unredeemed
            const { error } = await adminClient
                .from('amazon_activation_license_keys')
                .update(updateData)
                .in('id', ids);

            if (error) {
                return NextResponse.json({ error: error.message }, { status: 500 });
            }

            return NextResponse.json({ success: true, updated: ids.length });
        } else {
            // Single mark unredeemed
            const { error } = await adminClient
                .from('amazon_activation_license_keys')
                .update(updateData)
                .eq('id', id);

            if (error) {
                return NextResponse.json({ error: error.message }, { status: 500 });
            }

            return NextResponse.json({ success: true, updated: 1 });
        }
    } catch (error) {
        console.error('License key update error:', error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : 'Server error' },
            { status: 500 }
        );
    }
}
