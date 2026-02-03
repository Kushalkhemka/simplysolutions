import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET() {
    const startTime = Date.now();
    const checks: Record<string, unknown> = {};
    let overallStatus: 'ok' | 'degraded' | 'error' = 'ok';

    // 1. Database connectivity and latency
    try {
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
        const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

        if (supabaseUrl && supabaseKey) {
            const supabase = createClient(supabaseUrl, supabaseKey);

            const dbStart = Date.now();
            const { error } = await supabase.from('products').select('id').limit(1);
            const dbLatency = Date.now() - dbStart;

            if (error) {
                checks.database = { status: 'error', error: error.message };
                overallStatus = 'error';
            } else {
                checks.database = {
                    status: 'connected',
                    latency: `${dbLatency}ms`,
                    latencyWarning: dbLatency > 500 ? 'High latency detected' : undefined
                };
                if (dbLatency > 1000) overallStatus = 'degraded';
            }

            // Get active seller accounts count
            const { count } = await supabase
                .from('amazon_seller_accounts')
                .select('*', { count: 'exact', head: true })
                .eq('is_active', true);

            checks.sellerAccounts = count || 0;
        } else {
            checks.database = { status: 'not_configured' };
            overallStatus = 'error';
        }
    } catch (e) {
        checks.database = { status: 'error', error: e instanceof Error ? e.message : 'Unknown error' };
        overallStatus = 'error';
    }

    // 2. Memory usage
    const memoryUsage = process.memoryUsage();
    checks.memory = {
        heapUsed: `${Math.round(memoryUsage.heapUsed / 1024 / 1024)}MB`,
        heapTotal: `${Math.round(memoryUsage.heapTotal / 1024 / 1024)}MB`,
        rss: `${Math.round(memoryUsage.rss / 1024 / 1024)}MB`
    };

    // 3. Environment checks
    const requiredEnvVars = [
        'NEXT_PUBLIC_SUPABASE_URL',
        'SUPABASE_SERVICE_ROLE_KEY',
        'RAZORPAY_KEY_ID',
        'RESEND_API_KEY',
        'CREDENTIALS_ENCRYPTION_KEY'
    ];

    const missingEnvVars = requiredEnvVars.filter(v => !process.env[v]);
    checks.environment = {
        status: missingEnvVars.length === 0 ? 'ok' : 'missing_vars',
        missingVars: missingEnvVars.length > 0 ? missingEnvVars : undefined
    };

    if (missingEnvVars.length > 0) overallStatus = 'degraded';

    // 4. Response time
    const responseTime = Date.now() - startTime;

    return NextResponse.json({
        status: overallStatus,
        timestamp: new Date().toISOString(),
        uptime: Math.floor(process.uptime()),
        uptimeFormatted: formatUptime(process.uptime()),
        responseTime: `${responseTime}ms`,
        version: process.env.npm_package_version || '0.1.0',
        nodeVersion: process.version,
        ...checks
    }, {
        status: overallStatus === 'error' ? 503 : 200,
        headers: {
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache'
        }
    });
}

function formatUptime(seconds: number): string {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const mins = Math.floor((seconds % 3600) / 60);

    const parts = [];
    if (days > 0) parts.push(`${days}d`);
    if (hours > 0) parts.push(`${hours}h`);
    if (mins > 0) parts.push(`${mins}m`);

    return parts.length > 0 ? parts.join(' ') : '< 1m';
}

// Also respond to HEAD requests for simple health checks
export async function HEAD() {
    return new NextResponse(null, { status: 200 });
}
