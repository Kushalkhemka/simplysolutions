/**
 * Admin API for fetching cron job logs
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getCronLogs, getCronStats } from '@/lib/cron/logger';

export async function GET(request: NextRequest) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Check if user is admin
        const { data: profile } = await supabase
            .from('users')
            .select('role')
            .eq('id', user.id)
            .single();

        if (profile?.role !== 'admin') {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        const searchParams = request.nextUrl.searchParams;
        const jobName = searchParams.get('jobName') || undefined;
        const status = searchParams.get('status') || undefined;
        const limit = parseInt(searchParams.get('limit') || '50');
        const offset = parseInt(searchParams.get('offset') || '0');
        const includeStats = searchParams.get('includeStats') === 'true';

        const { logs, total } = await getCronLogs({ jobName, status, limit, offset });

        const response: Record<string, unknown> = { logs, total };

        if (includeStats) {
            response.stats = await getCronStats();
        }

        return NextResponse.json(response);

    } catch (error) {
        console.error('[cron-logs API] Error:', error);
        return NextResponse.json({
            error: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 500 });
    }
}
