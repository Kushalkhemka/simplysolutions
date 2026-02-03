/**
 * Cron Job Logging Utilities
 * 
 * Used to track cron job executions for the admin dashboard
 */

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export interface CronLogEntry {
    id: string;
    job_name: string;
    started_at: string;
    completed_at: string | null;
    status: 'running' | 'success' | 'error';
    duration_ms: number | null;
    records_processed: number;
    error_message: string | null;
    details: Record<string, unknown> | null;
    created_at: string;
}

/**
 * Log the start of a cron job execution
 */
export async function logCronStart(jobName: string): Promise<string | null> {
    try {
        const { data, error } = await supabase
            .from('cron_job_logs')
            .insert({
                job_name: jobName,
                status: 'running',
                started_at: new Date().toISOString()
            })
            .select('id')
            .single();

        if (error) {
            console.error(`[cron-logger] Failed to log start for ${jobName}:`, error);
            return null;
        }

        return data.id;
    } catch (e) {
        console.error(`[cron-logger] Error logging start for ${jobName}:`, e);
        return null;
    }
}

/**
 * Log the successful completion of a cron job
 */
export async function logCronSuccess(
    logId: string | null,
    recordsProcessed: number = 0,
    details?: Record<string, unknown>
): Promise<void> {
    if (!logId) return;

    try {
        const { data: log } = await supabase
            .from('cron_job_logs')
            .select('started_at')
            .eq('id', logId)
            .single();

        const startedAt = log?.started_at ? new Date(log.started_at) : new Date();
        const durationMs = Date.now() - startedAt.getTime();

        await supabase
            .from('cron_job_logs')
            .update({
                status: 'success',
                completed_at: new Date().toISOString(),
                duration_ms: durationMs,
                records_processed: recordsProcessed,
                details: details || null
            })
            .eq('id', logId);
    } catch (e) {
        console.error(`[cron-logger] Error logging success:`, e);
    }
}

/**
 * Log a failed cron job execution
 */
export async function logCronError(
    logId: string | null,
    errorMessage: string,
    details?: Record<string, unknown>
): Promise<void> {
    if (!logId) return;

    try {
        const { data: log } = await supabase
            .from('cron_job_logs')
            .select('started_at')
            .eq('id', logId)
            .single();

        const startedAt = log?.started_at ? new Date(log.started_at) : new Date();
        const durationMs = Date.now() - startedAt.getTime();

        await supabase
            .from('cron_job_logs')
            .update({
                status: 'error',
                completed_at: new Date().toISOString(),
                duration_ms: durationMs,
                error_message: errorMessage,
                details: details || null
            })
            .eq('id', logId);
    } catch (e) {
        console.error(`[cron-logger] Error logging error:`, e);
    }
}

/**
 * Get recent cron job logs for the dashboard
 */
export async function getCronLogs(options: {
    jobName?: string;
    status?: string;
    limit?: number;
    offset?: number;
} = {}): Promise<{ logs: CronLogEntry[]; total: number }> {
    const { jobName, status, limit = 50, offset = 0 } = options;

    let query = supabase
        .from('cron_job_logs')
        .select('*', { count: 'exact' })
        .order('started_at', { ascending: false })
        .range(offset, offset + limit - 1);

    if (jobName) {
        query = query.eq('job_name', jobName);
    }

    if (status) {
        query = query.eq('status', status);
    }

    const { data, error, count } = await query;

    if (error) {
        console.error('[cron-logger] Error fetching logs:', error);
        return { logs: [], total: 0 };
    }

    return {
        logs: data || [],
        total: count || 0
    };
}

/**
 * Get summary stats for the dashboard
 */
export async function getCronStats(): Promise<{
    totalRuns24h: number;
    successRate: number;
    avgDuration: number;
    lastRun: Record<string, string>;
}> {
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

    // Get runs in last 24 hours
    const { data: recentRuns } = await supabase
        .from('cron_job_logs')
        .select('job_name, status, duration_ms, started_at')
        .gte('started_at', oneDayAgo);

    const runs = recentRuns || [];
    const successCount = runs.filter(r => r.status === 'success').length;
    const totalDuration = runs.reduce((sum, r) => sum + (r.duration_ms || 0), 0);

    // Get last run for each job
    const { data: lastRuns } = await supabase
        .from('cron_job_logs')
        .select('job_name, started_at')
        .order('started_at', { ascending: false });

    const lastRun: Record<string, string> = {};
    (lastRuns || []).forEach(r => {
        if (!lastRun[r.job_name]) {
            lastRun[r.job_name] = r.started_at;
        }
    });

    return {
        totalRuns24h: runs.length,
        successRate: runs.length > 0 ? Math.round((successCount / runs.length) * 100) : 100,
        avgDuration: runs.length > 0 ? Math.round(totalDuration / runs.length) : 0,
        lastRun
    };
}
