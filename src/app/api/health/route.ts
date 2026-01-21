import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET() {
    const startTime = Date.now();

    let dbStatus = 'unknown';

    try {
        // Quick database check
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
        const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

        if (supabaseUrl && supabaseKey) {
            const supabase = createClient(supabaseUrl, supabaseKey);
            const { error } = await supabase.from('products').select('id').limit(1);
            dbStatus = error ? 'error' : 'connected';
        } else {
            dbStatus = 'not_configured';
        }
    } catch (e) {
        dbStatus = 'error';
    }

    const responseTime = Date.now() - startTime;

    return NextResponse.json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        database: dbStatus,
        responseTime: `${responseTime}ms`
    }, {
        status: 200,
        headers: {
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache'
        }
    });
}

// Also respond to HEAD requests for simple health checks
export async function HEAD() {
    return new NextResponse(null, { status: 200 });
}
