import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// GET: List all office365 customization requests
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const status = searchParams.get('status'); // 'pending' | 'fulfilled' | 'all'

        let query = supabase
            .from('office365_customizations')
            .select('*')
            .order('created_at', { ascending: false });

        if (status === 'pending') {
            query = query.eq('is_completed', false).eq('is_rejected', false);
        } else if (status === 'fulfilled') {
            query = query.eq('is_completed', true);
        } else if (status === 'rejected') {
            query = query.eq('is_rejected', true);
        }

        const { data: requests, error } = await query;

        if (error) {
            console.error('Error fetching office365 customizations:', error);
            return NextResponse.json(
                { error: 'Failed to fetch customization requests' },
                { status: 500 }
            );
        }

        // Get stats
        const { data: allRequests } = await supabase
            .from('office365_customizations')
            .select('is_completed, is_rejected');

        const stats = {
            pending: (allRequests || []).filter(r => !r.is_completed && !r.is_rejected).length,
            fulfilled: (allRequests || []).filter(r => r.is_completed).length,
            rejected: (allRequests || []).filter(r => r.is_rejected).length,
            total: (allRequests || []).length
        };

        return NextResponse.json({
            success: true,
            data: requests || [],
            stats
        });

    } catch (error) {
        console.error('Admin office365 customizations GET error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}

// DELETE: Bulk delete pending customization requests
export async function DELETE(request: NextRequest) {
    try {
        const body = await request.json();
        const { ids } = body;

        if (!ids || !Array.isArray(ids) || ids.length === 0) {
            return NextResponse.json(
                { error: 'No IDs provided' },
                { status: 400 }
            );
        }

        // Only delete non-fulfilled requests
        const { data: deleted, error } = await supabase
            .from('office365_customizations')
            .delete()
            .in('id', ids)
            .eq('is_completed', false)
            .select('id');

        if (error) {
            console.error('Error bulk deleting customizations:', error);
            return NextResponse.json(
                { error: 'Failed to delete requests' },
                { status: 500 }
            );
        }

        return NextResponse.json({
            success: true,
            deletedCount: deleted?.length || 0,
            message: `${deleted?.length || 0} request(s) deleted`
        });

    } catch (error) {
        console.error('Admin office365 customizations DELETE error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
