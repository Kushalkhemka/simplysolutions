'use client';

import { useState, useEffect } from 'react';
import { Key, Plus, RefreshCw, Trash2, ToggleLeft, ToggleRight, Loader2, AlertTriangle, CheckCircle, Database } from 'lucide-react';
import { toast } from 'sonner';

interface Token {
    id: string;
    token: string;
    email: string | null;
    count_used: number;
    total_available: number;
    is_active: boolean;
    priority: number;
    last_verified_at: string | null;
    last_used_at: string | null;
    created_at: string;
}

interface Summary {
    totalTokens: number;
    totalUsed: number;
    totalAvailable: number;
    totalRemaining: number;
}

export default function GetCIDTokensPage() {
    const [tokens, setTokens] = useState<Token[]>([]);
    const [summary, setSummary] = useState<Summary | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [newToken, setNewToken] = useState('');
    const [isAdding, setIsAdding] = useState(false);
    const [syncingId, setSyncingId] = useState<string | null>(null);

    const fetchTokens = async () => {
        try {
            const res = await fetch('/api/admin/getcid-tokens');
            const data = await res.json();
            if (data.tokens) {
                setTokens(data.tokens);
                setSummary(data.summary);
            }
        } catch (error) {
            console.error('Error fetching tokens:', error);
            toast.error('Failed to fetch tokens');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchTokens();
    }, []);

    const addToken = async () => {
        if (!newToken.trim()) {
            toast.error('Please enter a token');
            return;
        }

        setIsAdding(true);
        try {
            const res = await fetch('/api/admin/getcid-tokens', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ token: newToken.trim() }),
            });

            const data = await res.json();
            if (data.success) {
                toast.success('Token added successfully!');
                setNewToken('');
                fetchTokens();
            } else {
                toast.error(data.error || 'Failed to add token');
            }
        } catch (error) {
            console.error('Error adding token:', error);
            toast.error('Failed to add token');
        } finally {
            setIsAdding(false);
        }
    };

    const toggleActive = async (id: string, currentState: boolean) => {
        try {
            const res = await fetch('/api/admin/getcid-tokens', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id, is_active: !currentState }),
            });

            const data = await res.json();
            if (data.success) {
                toast.success(`Token ${!currentState ? 'activated' : 'deactivated'}`);
                fetchTokens();
            } else {
                toast.error(data.error || 'Failed to update token');
            }
        } catch (error) {
            console.error('Error toggling token:', error);
            toast.error('Failed to update token');
        }
    };

    const syncToken = async (id: string) => {
        setSyncingId(id);
        try {
            const res = await fetch('/api/admin/getcid-tokens', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id, sync: true }),
            });

            const data = await res.json();
            if (data.success) {
                toast.success('Token synced with API');
                fetchTokens();
            } else {
                toast.error(data.error || 'Failed to sync token');
            }
        } catch (error) {
            console.error('Error syncing token:', error);
            toast.error('Failed to sync token');
        } finally {
            setSyncingId(null);
        }
    };

    const deleteToken = async (id: string) => {
        if (!confirm('Are you sure you want to delete this token?')) return;

        try {
            const res = await fetch(`/api/admin/getcid-tokens?id=${id}`, {
                method: 'DELETE',
            });

            const data = await res.json();
            if (data.success) {
                toast.success('Token deleted');
                fetchTokens();
            } else {
                toast.error(data.error || 'Failed to delete token');
            }
        } catch (error) {
            console.error('Error deleting token:', error);
            toast.error('Failed to delete token');
        }
    };

    const getUsageColor = (used: number, total: number) => {
        const percentage = (used / total) * 100;
        if (percentage >= 90) return 'text-red-600 bg-red-100 dark:bg-red-900/30';
        if (percentage >= 70) return 'text-amber-600 bg-amber-100 dark:bg-amber-900/30';
        return 'text-green-600 bg-green-100 dark:bg-green-900/30';
    };

    const formatDate = (dateStr: string | null) => {
        if (!dateStr) return '-';
        return new Date(dateStr).toLocaleString('en-IN', {
            day: '2-digit',
            month: 'short',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-64">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold flex items-center gap-2">
                    <Database className="h-6 w-6" />
                    GetCID Token Management
                </h1>
                <p className="text-muted-foreground">Manage API tokens for GetCID service</p>
            </div>

            {/* Summary Cards */}
            {summary && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-card border rounded-lg p-4">
                        <p className="text-sm text-muted-foreground">Total Tokens</p>
                        <p className="text-2xl font-bold">{summary.totalTokens}</p>
                    </div>
                    <div className="bg-card border rounded-lg p-4">
                        <p className="text-sm text-muted-foreground">Total Used</p>
                        <p className="text-2xl font-bold text-amber-600">{summary.totalUsed}</p>
                    </div>
                    <div className="bg-card border rounded-lg p-4">
                        <p className="text-sm text-muted-foreground">Total Available</p>
                        <p className="text-2xl font-bold">{summary.totalAvailable}</p>
                    </div>
                    <div className="bg-card border rounded-lg p-4">
                        <p className="text-sm text-muted-foreground">Remaining</p>
                        <p className="text-2xl font-bold text-green-600">{summary.totalRemaining}</p>
                    </div>
                </div>
            )}

            {/* Add Token Form */}
            <div className="bg-card border rounded-lg p-4">
                <h2 className="font-semibold mb-3">Add New Token</h2>
                <div className="flex gap-3">
                    <input
                        type="text"
                        value={newToken}
                        onChange={(e) => setNewToken(e.target.value)}
                        placeholder="Enter GetCID API token"
                        className="flex-1 px-4 py-2 border rounded-lg font-mono"
                    />
                    <button
                        onClick={addToken}
                        disabled={isAdding}
                        className="bg-primary text-primary-foreground px-4 py-2 rounded-lg font-medium flex items-center gap-2 hover:bg-primary/90 disabled:opacity-50"
                    >
                        {isAdding ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                            <Plus className="h-4 w-4" />
                        )}
                        Add Token
                    </button>
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                    Token will be verified with GetCID API before adding.
                </p>
            </div>

            {/* Tokens Table */}
            <div className="bg-card border rounded-lg overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-muted/50">
                            <tr>
                                <th className="text-left px-4 py-3 text-sm font-medium">Token</th>
                                <th className="text-left px-4 py-3 text-sm font-medium">Email</th>
                                <th className="text-center px-4 py-3 text-sm font-medium">Usage</th>
                                <th className="text-center px-4 py-3 text-sm font-medium">Priority</th>
                                <th className="text-center px-4 py-3 text-sm font-medium">Status</th>
                                <th className="text-left px-4 py-3 text-sm font-medium">Last Used</th>
                                <th className="text-left px-4 py-3 text-sm font-medium">Last Verified</th>
                                <th className="text-center px-4 py-3 text-sm font-medium">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y">
                            {tokens.map((token) => {
                                const remaining = token.total_available - token.count_used;
                                const usagePercentage = (token.count_used / token.total_available) * 100;

                                return (
                                    <tr key={token.id} className={!token.is_active ? 'opacity-50 bg-muted/30' : ''}>
                                        <td className="px-4 py-3">
                                            <code className="text-sm font-mono bg-muted px-2 py-1 rounded">
                                                {token.token.substring(0, 4)}...{token.token.slice(-3)}
                                            </code>
                                        </td>
                                        <td className="px-4 py-3 text-sm text-muted-foreground">
                                            {token.email?.toLowerCase() || '-'}
                                        </td>
                                        <td className="px-4 py-3 text-center">
                                            <div className="flex flex-col items-center">
                                                <span className={`text-sm font-medium px-2 py-0.5 rounded ${getUsageColor(token.count_used, token.total_available)}`}>
                                                    {token.count_used} / {token.total_available}
                                                </span>
                                                <div className="w-20 h-1.5 bg-muted rounded-full mt-1 overflow-hidden">
                                                    <div
                                                        className={`h-full ${usagePercentage >= 90 ? 'bg-red-500' : usagePercentage >= 70 ? 'bg-amber-500' : 'bg-green-500'}`}
                                                        style={{ width: `${usagePercentage}%` }}
                                                    />
                                                </div>
                                                <span className="text-xs text-muted-foreground mt-0.5">
                                                    {remaining} left
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-4 py-3 text-center">
                                            <span className="text-sm font-medium">{token.priority}</span>
                                        </td>
                                        <td className="px-4 py-3 text-center">
                                            {token.is_active ? (
                                                <span className="inline-flex items-center gap-1 text-xs font-medium text-green-600 bg-green-100 dark:bg-green-900/30 px-2 py-1 rounded-full">
                                                    <CheckCircle className="h-3 w-3" />
                                                    Active
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center gap-1 text-xs font-medium text-red-600 bg-red-100 dark:bg-red-900/30 px-2 py-1 rounded-full">
                                                    <AlertTriangle className="h-3 w-3" />
                                                    Inactive
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-4 py-3 text-sm text-muted-foreground">
                                            {formatDate(token.last_used_at)}
                                        </td>
                                        <td className="px-4 py-3 text-sm text-muted-foreground">
                                            {formatDate(token.last_verified_at)}
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="flex items-center justify-center gap-1">
                                                <button
                                                    onClick={() => syncToken(token.id)}
                                                    disabled={syncingId === token.id}
                                                    className="p-1.5 text-blue-600 hover:bg-blue-100 dark:hover:bg-blue-900/30 rounded transition-colors"
                                                    title="Sync with API"
                                                >
                                                    {syncingId === token.id ? (
                                                        <Loader2 className="h-4 w-4 animate-spin" />
                                                    ) : (
                                                        <RefreshCw className="h-4 w-4" />
                                                    )}
                                                </button>
                                                <button
                                                    onClick={() => toggleActive(token.id, token.is_active)}
                                                    className={`p-1.5 rounded transition-colors ${token.is_active
                                                        ? 'text-amber-600 hover:bg-amber-100 dark:hover:bg-amber-900/30'
                                                        : 'text-green-600 hover:bg-green-100 dark:hover:bg-green-900/30'
                                                        }`}
                                                    title={token.is_active ? 'Deactivate' : 'Activate'}
                                                >
                                                    {token.is_active ? (
                                                        <ToggleRight className="h-4 w-4" />
                                                    ) : (
                                                        <ToggleLeft className="h-4 w-4" />
                                                    )}
                                                </button>
                                                <button
                                                    onClick={() => deleteToken(token.id)}
                                                    className="p-1.5 text-red-600 hover:bg-red-100 dark:hover:bg-red-900/30 rounded transition-colors"
                                                    title="Delete"
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>

                {tokens.length === 0 && (
                    <div className="text-center py-12 text-muted-foreground">
                        <Key className="h-12 w-12 mx-auto mb-3 opacity-20" />
                        <p>No tokens configured</p>
                        <p className="text-sm">Add a GetCID API token to get started</p>
                    </div>
                )}
            </div>

            {/* Info Box */}
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                <h3 className="font-semibold text-blue-900 dark:text-blue-400 mb-2">How Token Rotation Works</h3>
                <ul className="text-sm text-blue-800 dark:text-blue-400 space-y-1 list-disc list-inside">
                    <li>Tokens are selected based on priority (highest first) and remaining capacity</li>
                    <li>When a token runs low, the system automatically switches to the next available token</li>
                    <li>Use the sync button to update usage counts from the GetCID API</li>
                    <li>Inactive tokens are skipped during selection</li>
                </ul>
            </div>
        </div>
    );
}
