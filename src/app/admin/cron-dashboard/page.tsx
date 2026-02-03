'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { RefreshCw, Clock, CheckCircle2, XCircle, Loader2 } from 'lucide-react';

interface CronLogEntry {
    id: string;
    job_name: string;
    started_at: string;
    completed_at: string | null;
    status: 'running' | 'success' | 'error';
    duration_ms: number | null;
    records_processed: number;
    error_message: string | null;
    details: Record<string, unknown> | null;
}

interface CronStats {
    totalRuns24h: number;
    successRate: number;
    avgDuration: number;
    lastRun: Record<string, string>;
}

const JOB_NAMES = [
    { value: 'all', label: 'All Jobs' },
    { value: 'sync-fba', label: 'Sync FBA Orders' },
    { value: 'sync-mfn', label: 'Sync MFN Orders' },
    { value: 'sync-refunds', label: 'Sync Refunds' },
    { value: 'request-reviews', label: 'Request Reviews' },
    { value: 'abandoned-cart', label: 'Abandoned Cart' },
];

const STATUS_OPTIONS = [
    { value: 'all', label: 'All Status' },
    { value: 'success', label: 'Success' },
    { value: 'error', label: 'Error' },
    { value: 'running', label: 'Running' },
];

function formatDuration(ms: number | null): string {
    if (ms === null) return '-';
    if (ms < 1000) return `${ms}ms`;
    if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
    return `${(ms / 60000).toFixed(1)}m`;
}

function formatTimeAgo(date: string): string {
    const now = new Date();
    const then = new Date(date);
    const diffMs = now.getTime() - then.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${diffDays}d ago`;
}

function StatusBadge({ status }: { status: string }) {
    switch (status) {
        case 'success':
            return (
                <Badge className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
                    <CheckCircle2 className="w-3 h-3 mr-1" />
                    Success
                </Badge>
            );
        case 'error':
            return (
                <Badge className="bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400">
                    <XCircle className="w-3 h-3 mr-1" />
                    Error
                </Badge>
            );
        case 'running':
            return (
                <Badge className="bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
                    <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                    Running
                </Badge>
            );
        default:
            return <Badge variant="outline">{status}</Badge>;
    }
}

export default function CronDashboardPage() {
    const [logs, setLogs] = useState<CronLogEntry[]>([]);
    const [stats, setStats] = useState<CronStats | null>(null);
    const [loading, setLoading] = useState(true);
    const [jobFilter, setJobFilter] = useState('all');
    const [statusFilter, setStatusFilter] = useState('all');

    const fetchLogs = useCallback(async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams({ includeStats: 'true' });
            if (jobFilter !== 'all') params.set('jobName', jobFilter);
            if (statusFilter !== 'all') params.set('status', statusFilter);

            const response = await fetch(`/api/admin/cron-logs?${params}`);
            const data = await response.json();

            setLogs(data.logs || []);
            setStats(data.stats || null);
        } catch (error) {
            console.error('Failed to fetch cron logs:', error);
        } finally {
            setLoading(false);
        }
    }, [jobFilter, statusFilter]);

    useEffect(() => {
        fetchLogs();
    }, [fetchLogs]);

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold">Cron Dashboard</h1>
                    <p className="text-muted-foreground">Monitor scheduled job executions</p>
                </div>
                <Button onClick={fetchLogs} disabled={loading} variant="outline">
                    <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                    Refresh
                </Button>
            </div>

            {/* Stats Cards */}
            {stats && (
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground">
                                Runs (24h)
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stats.totalRuns24h}</div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground">
                                Success Rate
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                                {stats.successRate}%
                            </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground">
                                Avg Duration
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{formatDuration(stats.avgDuration)}</div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground">
                                Active Jobs
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{Object.keys(stats.lastRun).length}</div>
                        </CardContent>
                    </Card>
                </div>
            )}

            {/* Filters */}
            <Card>
                <CardHeader>
                    <div className="flex flex-wrap gap-4">
                        <Select value={jobFilter} onValueChange={setJobFilter}>
                            <SelectTrigger className="w-[180px]">
                                <SelectValue placeholder="Filter by job" />
                            </SelectTrigger>
                            <SelectContent>
                                {JOB_NAMES.map(job => (
                                    <SelectItem key={job.value} value={job.value}>
                                        {job.label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <Select value={statusFilter} onValueChange={setStatusFilter}>
                            <SelectTrigger className="w-[150px]">
                                <SelectValue placeholder="Filter by status" />
                            </SelectTrigger>
                            <SelectContent>
                                {STATUS_OPTIONS.map(opt => (
                                    <SelectItem key={opt.value} value={opt.value}>
                                        {opt.label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </CardHeader>
                <CardContent>
                    {loading ? (
                        <div className="flex justify-center py-8">
                            <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
                        </div>
                    ) : logs.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground">
                            No cron job logs found. Logs will appear after jobs run.
                        </div>
                    ) : (
                        <div className="space-y-2">
                            {logs.map(log => (
                                <div
                                    key={log.id}
                                    className="flex items-center justify-between p-4 rounded-lg border bg-card hover:bg-muted/50 transition-colors"
                                >
                                    <div className="flex items-center gap-4">
                                        <StatusBadge status={log.status} />
                                        <div>
                                            <div className="font-medium">{log.job_name}</div>
                                            <div className="text-sm text-muted-foreground flex items-center gap-2">
                                                <Clock className="w-3 h-3" />
                                                {formatTimeAgo(log.started_at)}
                                                {log.status === 'error' && log.error_message && (
                                                    <span className="text-red-500">
                                                        — {log.error_message.slice(0, 50)}
                                                        {log.error_message.length > 50 ? '...' : ''}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-6 text-sm text-muted-foreground">
                                        <div>
                                            <span className="font-medium text-foreground">
                                                {log.records_processed}
                                            </span>{' '}
                                            records
                                        </div>
                                        <div>{formatDuration(log.duration_ms)}</div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
