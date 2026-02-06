'use client';

import { useState, useEffect, useCallback } from 'react';
import { Search, RefreshCw, Loader2, CheckCircle, XCircle, Phone, Send, Trash2, MessageSquare } from 'lucide-react';
import { toast } from 'sonner';

interface WhatsAppLog {
    id: string;
    order_id: string;
    phone: string;
    template_name: string;
    template_variables: Record<string, unknown> | null;
    message_id: string | null;
    status: 'success' | 'failed';
    error_message: string | null;
    context: string | null;
    created_at: string;
}

export default function WhatsAppLogsClient() {
    const [logs, setLogs] = useState<WhatsAppLog[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [isResending, setIsResending] = useState<string | null>(null);
    const [isDeleting, setIsDeleting] = useState<string | null>(null);

    const fetchLogs = useCallback(async () => {
        setIsLoading(true);
        try {
            const params = new URLSearchParams();
            if (searchQuery) {
                // Try to determine if search is phone or order ID
                if (searchQuery.match(/^[\d\-]+$/) && searchQuery.includes('-')) {
                    params.set('orderId', searchQuery);
                } else if (searchQuery.match(/^\d+$/)) {
                    params.set('phone', searchQuery);
                } else {
                    params.set('orderId', searchQuery);
                }
            }

            const response = await fetch(`/api/admin/whatsapp-logs?${params.toString()}`);
            const data = await response.json();

            if (data.success) {
                setLogs(data.logs || []);
            } else {
                toast.error('Failed to fetch logs');
                setLogs([]);
            }
        } catch (error) {
            console.error('Error fetching logs:', error);
            toast.error('Failed to fetch logs');
            setLogs([]);
        } finally {
            setIsLoading(false);
        }
    }, [searchQuery]);

    useEffect(() => {
        fetchLogs();
    }, [fetchLogs]);

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        fetchLogs();
    };

    const handleResend = async (log: WhatsAppLog) => {
        setIsResending(log.id);
        try {
            const response = await fetch('/api/admin/whatsapp-logs', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    orderId: log.order_id,
                    phone: log.phone,
                    templateType: log.context === 'review_appeal' ? 'review' : 'feedback'
                })
            });

            const data = await response.json();

            if (data.success) {
                toast.success('Message resent successfully');
                fetchLogs(); // Refresh to show new log entry
            } else {
                toast.error(data.error || 'Failed to resend message');
            }
        } catch (error) {
            console.error('Resend error:', error);
            toast.error('Failed to resend message');
        } finally {
            setIsResending(null);
        }
    };

    const handleDelete = async (log: WhatsAppLog) => {
        if (!confirm(`Delete log for order ${log.order_id}? This will stop cron resends for this order.`)) {
            return;
        }

        setIsDeleting(log.id);
        try {
            const response = await fetch(`/api/admin/whatsapp-logs?id=${log.id}`, {
                method: 'DELETE'
            });

            const data = await response.json();

            if (data.success) {
                toast.success('Log entry deleted');
                fetchLogs();
            } else {
                toast.error(data.error || 'Failed to delete');
            }
        } catch (error) {
            console.error('Delete error:', error);
            toast.error('Failed to delete');
        } finally {
            setIsDeleting(null);
        }
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleString('en-IN', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const getContextBadge = (context: string | null) => {
        switch (context) {
            case 'feedback_appeal':
                return <span className="px-2 py-0.5 text-xs rounded-full bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400">Feedback</span>;
            case 'review_appeal':
                return <span className="px-2 py-0.5 text-xs rounded-full bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400">Review</span>;
            case 'warranty':
                return <span className="px-2 py-0.5 text-xs rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400">Warranty</span>;
            default:
                return <span className="px-2 py-0.5 text-xs rounded-full bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400">{context || 'Other'}</span>;
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold flex items-center gap-2">
                        <MessageSquare className="h-6 w-6 text-green-500" />
                        WhatsApp Message Logs
                    </h1>
                    <p className="text-muted-foreground">View all WhatsApp messages sent from the system</p>
                </div>
                <button
                    onClick={fetchLogs}
                    disabled={isLoading}
                    className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90 disabled:opacity-50"
                >
                    {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
                    Refresh
                </button>
            </div>

            {/* Search */}
            <form onSubmit={handleSearch} className="flex gap-4">
                <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <input
                        type="text"
                        placeholder="Search by Order ID or Phone..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 border rounded-lg bg-background"
                    />
                </div>
                <button type="submit" className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90">
                    Search
                </button>
                {searchQuery && (
                    <button
                        type="button"
                        onClick={() => { setSearchQuery(''); }}
                        className="px-4 py-2 border rounded-lg hover:bg-accent"
                    >
                        Clear
                    </button>
                )}
            </form>

            {/* Stats Summary */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-card border rounded-lg p-4">
                    <p className="text-2xl font-bold">{logs.length}</p>
                    <p className="text-sm text-muted-foreground">Total Messages</p>
                </div>
                <div className="bg-card border rounded-lg p-4">
                    <p className="text-2xl font-bold text-green-600">{logs.filter(l => l.status === 'success').length}</p>
                    <p className="text-sm text-muted-foreground">Successful</p>
                </div>
                <div className="bg-card border rounded-lg p-4">
                    <p className="text-2xl font-bold text-red-600">{logs.filter(l => l.status === 'failed').length}</p>
                    <p className="text-sm text-muted-foreground">Failed</p>
                </div>
                <div className="bg-card border rounded-lg p-4">
                    <p className="text-2xl font-bold text-purple-600">{new Set(logs.map(l => l.phone)).size}</p>
                    <p className="text-sm text-muted-foreground">Unique Recipients</p>
                </div>
            </div>

            {/* Logs Table */}
            <div className="bg-card border rounded-lg overflow-hidden">
                {isLoading ? (
                    <div className="p-8 text-center">
                        <Loader2 className="h-8 w-8 animate-spin mx-auto text-muted-foreground" />
                        <p className="mt-2 text-muted-foreground">Loading logs...</p>
                    </div>
                ) : logs.length === 0 ? (
                    <div className="p-8 text-center text-muted-foreground">
                        <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
                        <p>No WhatsApp messages found</p>
                        <p className="text-sm mt-1">Messages will appear here when sent through the system</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-muted/50">
                                <tr>
                                    <th className="px-4 py-3 text-left text-sm font-medium">Status</th>
                                    <th className="px-4 py-3 text-left text-sm font-medium">Order ID</th>
                                    <th className="px-4 py-3 text-left text-sm font-medium">Phone</th>
                                    <th className="px-4 py-3 text-left text-sm font-medium">Template</th>
                                    <th className="px-4 py-3 text-left text-sm font-medium">Context</th>
                                    <th className="px-4 py-3 text-left text-sm font-medium">Message ID</th>
                                    <th className="px-4 py-3 text-left text-sm font-medium">Date</th>
                                    <th className="px-4 py-3 text-left text-sm font-medium">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y">
                                {logs.map((log) => (
                                    <tr key={log.id} className="hover:bg-muted/30">
                                        <td className="px-4 py-3">
                                            {log.status === 'success' ? (
                                                <span className="flex items-center gap-1 text-green-600">
                                                    <CheckCircle className="h-4 w-4" />
                                                    <span className="text-xs">Sent</span>
                                                </span>
                                            ) : (
                                                <span className="flex items-center gap-1 text-red-600" title={log.error_message || 'Failed'}>
                                                    <XCircle className="h-4 w-4" />
                                                    <span className="text-xs">Failed</span>
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-4 py-3 font-mono text-sm">{log.order_id}</td>
                                        <td className="px-4 py-3">
                                            <span className="flex items-center gap-1 font-mono text-sm">
                                                <Phone className="h-3 w-3 text-muted-foreground" />
                                                {log.phone}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-sm">{log.template_name}</td>
                                        <td className="px-4 py-3">{getContextBadge(log.context)}</td>
                                        <td className="px-4 py-3">
                                            {log.message_id ? (
                                                <span className="font-mono text-xs text-muted-foreground truncate max-w-[120px] block" title={log.message_id}>
                                                    {log.message_id.slice(0, 16)}...
                                                </span>
                                            ) : (
                                                <span className="text-xs text-muted-foreground">-</span>
                                            )}
                                        </td>
                                        <td className="px-4 py-3 text-sm text-muted-foreground">
                                            {formatDate(log.created_at)}
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="flex items-center gap-2">
                                                <button
                                                    onClick={() => handleResend(log)}
                                                    disabled={isResending === log.id || isDeleting === log.id}
                                                    className="flex items-center gap-1 px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:hover:bg-blue-900/50 disabled:opacity-50"
                                                >
                                                    {isResending === log.id ? (
                                                        <Loader2 className="h-3 w-3 animate-spin" />
                                                    ) : (
                                                        <Send className="h-3 w-3" />
                                                    )}
                                                    Resend
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(log)}
                                                    disabled={isResending === log.id || isDeleting === log.id}
                                                    className="flex items-center gap-1 px-2 py-1 text-xs bg-red-100 text-red-700 rounded hover:bg-red-200 dark:bg-red-900/30 dark:text-red-400 dark:hover:bg-red-900/50 disabled:opacity-50"
                                                    title="Delete (stops cron resends)"
                                                >
                                                    {isDeleting === log.id ? (
                                                        <Loader2 className="h-3 w-3 animate-spin" />
                                                    ) : (
                                                        <Trash2 className="h-3 w-3" />
                                                    )}
                                                    Delete
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Error Details for Failed Messages */}
            {logs.some(l => l.status === 'failed' && l.error_message) && (
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
                    <h3 className="font-medium text-red-800 dark:text-red-400 mb-2">Failed Message Details</h3>
                    <div className="space-y-2">
                        {logs.filter(l => l.status === 'failed' && l.error_message).map((log) => (
                            <div key={log.id} className="text-sm">
                                <span className="font-mono">{log.order_id}</span>: {log.error_message}
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
