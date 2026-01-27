'use client';

import { useState, useEffect } from 'react';
import { Bell, Users, Shield, User, Loader2, Trash2, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';

interface Subscription {
    id: string;
    user_id: string | null;
    user_email: string | null;
    device_id: string;
    is_admin_subscriber: boolean;
    is_customer: boolean;
    order_id: string | null;
    created_at: string;
}

interface Stats {
    total: number;
    admins: number;
    customers: number;
}

export default function PushSubscribersPage() {
    const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
    const [stats, setStats] = useState<Stats>({ total: 0, admins: 0, customers: 0 });
    const [isLoading, setIsLoading] = useState(true);
    const [filter, setFilter] = useState<'all' | 'admin' | 'customer'>('all');

    useEffect(() => {
        fetchSubscribers();
    }, []);

    const fetchSubscribers = async () => {
        setIsLoading(true);
        try {
            const res = await fetch('/api/admin/push-subscribers');
            const data = await res.json();
            if (data.success) {
                setSubscriptions(data.subscriptions || []);
                setStats(data.stats || { total: 0, admins: 0, customers: 0 });
            }
        } catch (error) {
            console.error('Failed to fetch subscribers:', error);
            toast.error('Failed to load subscribers');
        }
        setIsLoading(false);
    };

    const filteredSubscriptions = subscriptions.filter(sub => {
        if (filter === 'admin') return sub.is_admin_subscriber;
        if (filter === 'customer') return sub.is_customer;
        return true;
    });

    const formatDate = (dateStr: string) => {
        return new Date(dateStr).toLocaleDateString('en-IN', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold flex items-center gap-2">
                        <Bell className="h-6 w-6" />
                        Push Subscribers
                    </h1>
                    <p className="text-muted-foreground">
                        View all users who opted in for push notifications
                    </p>
                </div>
                <Button variant="outline" size="sm" onClick={fetchSubscribers} className="gap-2">
                    <RefreshCw className="h-4 w-4" />
                    Refresh
                </Button>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-3 gap-4">
                <div className="bg-card border rounded-lg p-4">
                    <div className="flex items-center gap-2 text-muted-foreground text-sm">
                        <Users className="h-4 w-4" />
                        Total Subscribers
                    </div>
                    <p className="text-2xl font-bold mt-1">{stats.total}</p>
                </div>
                <div className="bg-card border rounded-lg p-4">
                    <div className="flex items-center gap-2 text-muted-foreground text-sm">
                        <Shield className="h-4 w-4" />
                        Admin Subscriptions
                    </div>
                    <p className="text-2xl font-bold mt-1">{stats.admins}</p>
                </div>
                <div className="bg-card border rounded-lg p-4">
                    <div className="flex items-center gap-2 text-muted-foreground text-sm">
                        <User className="h-4 w-4" />
                        Customer Subscriptions
                    </div>
                    <p className="text-2xl font-bold mt-1">{stats.customers}</p>
                </div>
            </div>

            {/* Filter Tabs */}
            <div className="flex gap-2">
                {(['all', 'admin', 'customer'] as const).map((f) => (
                    <Button
                        key={f}
                        variant={filter === f ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setFilter(f)}
                    >
                        {f === 'all' ? 'All' : f === 'admin' ? 'Admins' : 'Customers'}
                    </Button>
                ))}
            </div>

            {/* Subscribers List */}
            <div className="bg-card border rounded-lg overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead className="bg-muted/50 border-b">
                            <tr>
                                <th className="text-left px-4 py-3 font-medium">User / Device</th>
                                <th className="text-left px-4 py-3 font-medium">Type</th>
                                <th className="text-left px-4 py-3 font-medium">Order ID</th>
                                <th className="text-left px-4 py-3 font-medium">Subscribed</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y">
                            {filteredSubscriptions.length === 0 ? (
                                <tr>
                                    <td colSpan={4} className="px-4 py-8 text-center text-muted-foreground">
                                        No subscribers found
                                    </td>
                                </tr>
                            ) : (
                                filteredSubscriptions.map((sub) => (
                                    <tr key={sub.id} className="hover:bg-muted/30">
                                        <td className="px-4 py-3">
                                            <div>
                                                {sub.user_email ? (
                                                    <span className="font-medium">{sub.user_email}</span>
                                                ) : (
                                                    <span className="text-muted-foreground">Anonymous</span>
                                                )}
                                                <p className="text-xs text-muted-foreground">
                                                    Device: ...{sub.device_id}
                                                </p>
                                            </div>
                                        </td>
                                        <td className="px-4 py-3">
                                            {sub.is_admin_subscriber && (
                                                <Badge variant="default" className="bg-purple-600">Admin</Badge>
                                            )}
                                            {sub.is_customer && (
                                                <Badge variant="secondary">Customer</Badge>
                                            )}
                                            {!sub.is_admin_subscriber && !sub.is_customer && (
                                                <Badge variant="outline">General</Badge>
                                            )}
                                        </td>
                                        <td className="px-4 py-3">
                                            {sub.order_id ? (
                                                <code className="text-xs bg-muted px-2 py-1 rounded">
                                                    {sub.order_id}
                                                </code>
                                            ) : (
                                                <span className="text-muted-foreground">-</span>
                                            )}
                                        </td>
                                        <td className="px-4 py-3 text-muted-foreground">
                                            {formatDate(sub.created_at)}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
