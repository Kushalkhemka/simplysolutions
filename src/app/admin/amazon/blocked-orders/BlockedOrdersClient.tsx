'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { Ban, CheckCircle, RefreshCw, Search, Filter, X, Eye, EyeOff, Copy, Key, Unlock, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface BlockedOrder {
    id: string;
    order_id: string;
    fsn: string | null;
    product_title: string | null;
    contact_email: string | null;
    contact_phone: string | null;
    buyer_name: string | null;
    warranty_status: string;
    fulfillment_type: string;
    is_refunded: boolean | null;
    created_at: string;
    updated_at: string;
    licenseKeys: { license_key: string; fsn: string | null }[];
}

export default function BlockedOrdersClient() {
    const [orders, setOrders] = useState<BlockedOrder[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchOrderId, setSearchOrderId] = useState('');
    const [filterFsn, setFilterFsn] = useState<string>('all');
    const [showFilters, setShowFilters] = useState(false);
    const [showAllKeys, setShowAllKeys] = useState(false);
    const [unblockingId, setUnblockingId] = useState<string | null>(null);

    const fetchData = useCallback(async () => {
        setIsLoading(true);
        try {
            const res = await fetch('/api/admin/amazon-orders/blocked');
            const json = await res.json();
            if (json.success) {
                setOrders(json.orders);
            }
        } catch (error) {
            console.error('Error fetching blocked orders:', error);
        }
        setIsLoading(false);
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    // Unique FSNs from blocked orders
    const uniqueFsns = useMemo(() => {
        const fsns = Array.from(new Set(orders.map(o => o.fsn).filter(Boolean))) as string[];
        return fsns.sort();
    }, [orders]);

    const hasActiveFilters = searchOrderId || filterFsn !== 'all';

    const clearFilters = () => {
        setSearchOrderId('');
        setFilterFsn('all');
    };

    // Filtered orders
    const filteredOrders = useMemo(() => {
        return orders.filter(order => {
            if (searchOrderId && !order.order_id.toLowerCase().includes(searchOrderId.toLowerCase())) {
                return false;
            }
            if (filterFsn !== 'all' && order.fsn !== filterFsn) {
                return false;
            }
            return true;
        });
    }, [orders, searchOrderId, filterFsn]);

    const unblockOrder = async (orderId: string) => {
        setUnblockingId(orderId);
        try {
            const res = await fetch('/api/admin/amazon-orders/update-status', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ orderId, status: 'PENDING' })
            });

            if (!res.ok) {
                const errorData = await res.json();
                throw new Error(errorData.error || 'Failed to unblock order');
            }

            // Remove from local state
            setOrders(prev => prev.filter(o => o.order_id !== orderId));
            toast.success(`Order ${orderId} unblocked successfully`);
        } catch (error) {
            console.error('Error unblocking order:', error);
            toast.error(error instanceof Error ? error.message : 'Failed to unblock order');
        } finally {
            setUnblockingId(null);
        }
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-IN', {
            day: 'numeric',
            month: 'short',
            year: 'numeric'
        });
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-64">
                <RefreshCw className="w-8 h-8 animate-spin text-primary" />
                <span className="ml-2">Loading blocked orders...</span>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold flex items-center gap-2">
                        <Ban className="w-6 h-6 text-red-500" />
                        Blocked Orders
                    </h1>
                    <p className="text-muted-foreground">
                        Manage blocked Amazon orders ({orders.length} total)
                    </p>
                </div>
                <button
                    onClick={fetchData}
                    className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90"
                >
                    <RefreshCw className="w-4 h-4" />
                    Refresh
                </button>
            </div>

            {/* Summary Card */}
            <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4">
                <div className="flex items-center gap-2 text-red-500 mb-1">
                    <Ban className="w-5 h-5" />
                    <span className="font-semibold">Total Blocked</span>
                </div>
                <div className="text-3xl font-bold">{orders.length}</div>
                <p className="text-sm text-muted-foreground">Orders with BLOCKED warranty status</p>
            </div>

            {/* Search & Filter Bar */}
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 sm:flex-wrap">
                <div className="relative flex-1 min-w-0 sm:min-w-[200px] sm:max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <input
                        type="text"
                        placeholder="Search by Order ID..."
                        value={searchOrderId}
                        onChange={(e) => setSearchOrderId(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 border rounded-lg bg-background"
                    />
                </div>
                <button
                    type="button"
                    onClick={() => setShowFilters(!showFilters)}
                    className={`flex items-center justify-center gap-2 px-4 py-2 border rounded-lg hover:bg-accent ${showFilters ? 'bg-accent' : ''}`}
                >
                    <Filter className="h-4 w-4" />
                    Filters
                </button>
                {hasActiveFilters && (
                    <button
                        type="button"
                        onClick={clearFilters}
                        className="flex items-center gap-1 px-4 py-2 text-sm text-muted-foreground hover:text-foreground"
                    >
                        <X className="h-3 w-3" />
                        Clear Filters
                    </button>
                )}
            </div>

            {/* Filter Panel */}
            {showFilters && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 bg-muted/30 rounded-lg">
                    <div>
                        <label className="block text-sm font-medium mb-1">FSN</label>
                        <select
                            value={filterFsn}
                            onChange={(e) => setFilterFsn(e.target.value)}
                            className="w-full px-3 py-2 border rounded-lg bg-background"
                        >
                            <option value="all">All FSNs</option>
                            {uniqueFsns.map(fsn => (
                                <option key={fsn} value={fsn}>{fsn}</option>
                            ))}
                        </select>
                    </div>
                </div>
            )}

            {/* Orders Table */}
            {filteredOrders.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                    <CheckCircle className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>{hasActiveFilters ? 'No orders match the current filters' : 'No blocked orders found'}</p>
                </div>
            ) : (
                <div className="overflow-x-auto rounded-lg border border-border">
                    <table className="w-full">
                        <thead className="bg-muted/50">
                            <tr>
                                <th className="px-4 py-3 text-left text-sm font-medium">Order ID</th>
                                <th className="px-4 py-3 text-left text-sm font-medium">FSN</th>
                                <th className="px-4 py-3 text-left text-sm font-medium">
                                    <div className="flex items-center gap-2">
                                        License Key
                                        <button
                                            onClick={() => setShowAllKeys(!showAllKeys)}
                                            className="p-1 rounded hover:bg-accent transition-colors" title={showAllKeys ? 'Hide all keys' : 'Show all keys'}
                                        >
                                            {showAllKeys ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                                        </button>
                                    </div>
                                </th>
                                <th className="px-4 py-3 text-left text-sm font-medium">Contact</th>
                                <th className="px-4 py-3 text-left text-sm font-medium">Refunded</th>
                                <th className="px-4 py-3 text-left text-sm font-medium">Blocked On</th>
                                <th className="px-4 py-3 text-left text-sm font-medium">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                            {filteredOrders.map((order) => (
                                <tr key={order.id} className="hover:bg-muted/30">
                                    <td className="px-4 py-3">
                                        <span className="font-mono text-sm">{order.order_id}</span>
                                    </td>
                                    <td className="px-4 py-3 text-sm">{order.fsn || '-'}</td>
                                    <td className="px-4 py-3">
                                        {order.licenseKeys.length > 0 ? (
                                            <div className="space-y-1">
                                                {order.licenseKeys.map((lk, i) => (
                                                    <div key={i} className="flex items-center gap-1">
                                                        {showAllKeys ? (
                                                            <>
                                                                <code className="text-xs bg-muted px-1.5 py-0.5 rounded font-mono">{lk.license_key}</code>
                                                                <button
                                                                    onClick={() => { navigator.clipboard.writeText(lk.license_key); toast.success('Copied!'); }}
                                                                    className="p-0.5 hover:text-primary" title="Copy"
                                                                >
                                                                    <Copy className="w-3 h-3" />
                                                                </button>
                                                            </>
                                                        ) : (
                                                            <span className="text-xs text-muted-foreground">••••••••••</span>
                                                        )}
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <span className="text-xs text-muted-foreground">No key</span>
                                        )}
                                    </td>
                                    <td className="px-4 py-3 text-sm">
                                        {order.contact_email || order.contact_phone || '-'}
                                    </td>
                                    <td className="px-4 py-3">
                                        {order.is_refunded ? (
                                            <span className="inline-flex items-center px-2 py-1 text-xs font-medium bg-rose-500/10 text-rose-500 rounded-full">
                                                Yes
                                            </span>
                                        ) : (
                                            <span className="text-xs text-muted-foreground">No</span>
                                        )}
                                    </td>
                                    <td className="px-4 py-3 text-sm">{formatDate(order.updated_at)}</td>
                                    <td className="px-4 py-3">
                                        <button
                                            onClick={() => unblockOrder(order.order_id)}
                                            disabled={unblockingId === order.order_id}
                                            className="inline-flex items-center gap-1 px-3 py-1 text-sm bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors disabled:opacity-50"
                                        >
                                            {unblockingId === order.order_id ? (
                                                <Loader2 className="w-3 h-3 animate-spin" />
                                            ) : (
                                                <Unlock className="w-3 h-3" />
                                            )}
                                            Unblock
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}
