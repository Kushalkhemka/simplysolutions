'use client';

import { useEffect, useState } from 'react';
import { Search, Filter, Clock, CheckCircle, Loader2, Eye, X, RefreshCw, User, Key, Mail, Zap, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';

interface CustomizationRequest {
    id: string;
    order_id: string;
    display_name: string;
    first_name: string | null;
    last_name: string | null;
    username_prefix: string | null;
    customer_email: string | null;
    generated_email: string | null;
    is_completed: boolean;
    created_at: string;
    completed_at: string | null;
}

interface RequestDetails extends CustomizationRequest {
    current_license_key: string | null;
    license_key_id: string | null;
}

interface Stats {
    pending: number;
    fulfilled: number;
    total: number;
}

export default function AdminOffice365CustomizationsPage() {
    const [requests, setRequests] = useState<CustomizationRequest[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [stats, setStats] = useState<Stats>({ pending: 0, fulfilled: 0, total: 0 });

    // Modal states
    const [selectedRequest, setSelectedRequest] = useState<RequestDetails | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const [fulfillingId, setFulfillingId] = useState<string | null>(null);
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
    const [isBulkDeleting, setIsBulkDeleting] = useState(false);

    useEffect(() => {
        fetchRequests();
    }, [statusFilter]);

    const fetchRequests = async () => {
        setIsLoading(true);
        try {
            const url = new URL('/api/admin/office365-customizations', window.location.origin);
            if (statusFilter !== 'all') {
                url.searchParams.set('status', statusFilter);
            }

            const res = await fetch(url.toString());
            const data = await res.json();
            if (data.success) {
                setRequests(data.data);
                setStats(data.stats);
            }
        } catch (error) {
            toast.error('Failed to load customization requests');
        } finally {
            setIsLoading(false);
        }
    };

    const openRequestDetails = async (requestId: string) => {
        try {
            const res = await fetch(`/api/admin/office365-customizations/${requestId}`);
            const data = await res.json();
            if (data.success) {
                setSelectedRequest(data.data);
                setIsModalOpen(true);
            }
        } catch (error) {
            toast.error('Failed to load request details');
        }
    };

    const handleFulfill = async () => {
        if (!selectedRequest) return;

        setIsProcessing(true);
        try {
            const res = await fetch(`/api/admin/office365-customizations/${selectedRequest.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'fulfill'
                })
            });

            const data = await res.json();
            if (data.success) {
                toast.success('Customization fulfilled! Customer notified via email.');
                setIsModalOpen(false);
                fetchRequests();
            } else {
                toast.error(data.error || 'Failed to fulfill request');
            }
        } catch (error) {
            toast.error('Failed to fulfill request');
        } finally {
            setIsProcessing(false);
        }
    };

    // Direct fulfill from table row (no modal needed)
    const handleDirectFulfill = async (requestId: string, orderId: string, usernamePrefix: string | null) => {
        if (!usernamePrefix) {
            toast.error('No username prefix found for this request');
            return;
        }
        if (!confirm(`Fulfill this request?\n\nOrder: ${orderId}\nNew username: ${usernamePrefix}@ms365.pro\n\nPassword will be auto-extracted from the existing license key.`)) {
            return;
        }
        setFulfillingId(requestId);
        try {
            const res = await fetch(`/api/admin/office365-customizations/${requestId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'fulfill' })
            });
            const data = await res.json();
            if (data.success) {
                toast.success(`Fulfilled! ${usernamePrefix}@ms365.pro — customer notified.`);
                fetchRequests();
            } else {
                toast.error(data.error || 'Failed to fulfill');
            }
        } catch {
            toast.error('Network error');
        } finally {
            setFulfillingId(null);
        }
    };

    // Bulk delete selected pending requests
    const handleBulkDelete = async () => {
        if (selectedIds.size === 0) return;
        if (!confirm(`Delete ${selectedIds.size} selected request(s)?\n\nThis action cannot be undone.`)) return;

        setIsBulkDeleting(true);
        try {
            const res = await fetch('/api/admin/office365-customizations', {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ids: Array.from(selectedIds) })
            });
            const data = await res.json();
            if (data.success) {
                toast.success(`${data.deletedCount} request(s) deleted`);
                setSelectedIds(new Set());
                fetchRequests();
            } else {
                toast.error(data.error || 'Failed to delete');
            }
        } catch {
            toast.error('Network error');
        } finally {
            setIsBulkDeleting(false);
        }
    };

    const toggleSelect = (id: string) => {
        setSelectedIds(prev => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });
    };

    const filteredRequests = requests.filter(request =>
        request.order_id.toLowerCase().includes(search.toLowerCase()) ||
        (request.username_prefix && request.username_prefix.toLowerCase().includes(search.toLowerCase())) ||
        (request.display_name && request.display_name.toLowerCase().includes(search.toLowerCase())) ||
        (request.customer_email && request.customer_email.toLowerCase().includes(search.toLowerCase()))
    );

    const pendingFilteredIds = filteredRequests.filter(r => !r.is_completed).map(r => r.id);
    const allPendingSelected = pendingFilteredIds.length > 0 && pendingFilteredIds.every(id => selectedIds.has(id));

    const toggleSelectAll = () => {
        if (allPendingSelected) {
            setSelectedIds(prev => {
                const next = new Set(prev);
                pendingFilteredIds.forEach(id => next.delete(id));
                return next;
            });
        } else {
            setSelectedIds(prev => {
                const next = new Set(prev);
                pendingFilteredIds.forEach(id => next.add(id));
                return next;
            });
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold">O365 Username Customizations</h1>
                    <p className="text-muted-foreground">Manage Office 365 username customization requests</p>
                </div>
                <Button onClick={fetchRequests} variant="outline" size="sm">
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Refresh
                </Button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-4">
                <div className="bg-yellow-50 dark:bg-yellow-950/30 rounded-lg p-4 cursor-pointer hover:ring-2 ring-yellow-300" onClick={() => setStatusFilter('pending')}>
                    <div className="flex items-center justify-between">
                        <div>
                            <div className="text-2xl font-bold text-yellow-600">{stats.pending}</div>
                            <div className="text-sm text-muted-foreground">Pending</div>
                        </div>
                        <Clock className="w-8 h-8 text-yellow-500 opacity-50" />
                    </div>
                </div>
                <div className="bg-green-50 dark:bg-green-950/30 rounded-lg p-4 cursor-pointer hover:ring-2 ring-green-300" onClick={() => setStatusFilter('fulfilled')}>
                    <div className="flex items-center justify-between">
                        <div>
                            <div className="text-2xl font-bold text-green-600">{stats.fulfilled}</div>
                            <div className="text-sm text-muted-foreground">Fulfilled</div>
                        </div>
                        <CheckCircle className="w-8 h-8 text-green-500 opacity-50" />
                    </div>
                </div>
                <div className="bg-neutral-100 dark:bg-neutral-900/50 rounded-lg p-4 cursor-pointer hover:ring-2 ring-neutral-300" onClick={() => setStatusFilter('all')}>
                    <div className="flex items-center justify-between">
                        <div>
                            <div className="text-2xl font-bold text-neutral-600 dark:text-neutral-300">{stats.total}</div>
                            <div className="text-sm text-muted-foreground">Total</div>
                        </div>
                        <Filter className="w-8 h-8 text-neutral-500 opacity-50" />
                    </div>
                </div>
            </div>

            {/* Filters */}
            <div className="flex flex-col md:flex-row gap-4">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Search by order ID, username, name, or email..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="pl-10"
                    />
                </div>
                <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="px-3 py-2 border rounded-md bg-background"
                >
                    <option value="all">All Status</option>
                    <option value="pending">Pending</option>
                    <option value="fulfilled">Fulfilled</option>
                </select>
            </div>

            {/* Requests List */}
            {isLoading ? (
                <div className="flex justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
            ) : (
                <>
                    {/* Mobile Cards */}
                    <div className="lg:hidden space-y-3">
                        {filteredRequests.length === 0 ? (
                            <div className="text-center py-12 text-muted-foreground bg-card border rounded-lg">
                                No customization requests found
                            </div>
                        ) : (
                            filteredRequests.map(request => (
                                <div key={request.id} className={`bg-card border rounded-lg p-4 ${selectedIds.has(request.id) ? 'ring-2 ring-blue-500' : ''}`}>
                                    <div className="flex items-start justify-between gap-3">
                                        {!request.is_completed && (
                                            <input
                                                type="checkbox"
                                                checked={selectedIds.has(request.id)}
                                                onChange={() => toggleSelect(request.id)}
                                                className="mt-1 h-4 w-4 rounded border-gray-300 shrink-0 cursor-pointer accent-blue-600"
                                            />
                                        )}
                                        <div className="flex-1 min-w-0">
                                            <p className="font-mono text-sm font-medium truncate">{request.order_id}</p>
                                            <p className="text-sm text-muted-foreground mt-1">
                                                {request.display_name}
                                            </p>
                                            {request.username_prefix && (
                                                <p className="text-sm font-mono text-blue-600 mt-1">
                                                    {request.username_prefix}@ms365.pro
                                                </p>
                                            )}
                                            <div className="flex items-center gap-2 mt-2">
                                                <Badge className={request.is_completed
                                                    ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                                                    : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
                                                }>
                                                    {request.is_completed ? 'FULFILLED' : 'PENDING'}
                                                </Badge>
                                            </div>
                                            <p className="text-xs text-muted-foreground mt-2">
                                                {new Date(request.created_at).toLocaleDateString()}
                                            </p>
                                        </div>
                                        <div className="flex items-center gap-1">
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => openRequestDetails(request.id)}
                                                className="shrink-0"
                                            >
                                                <Eye className="w-4 h-4" />
                                            </Button>
                                            {!request.is_completed && (
                                                <Button
                                                    size="sm"
                                                    onClick={() => handleDirectFulfill(request.id, request.order_id, request.username_prefix)}
                                                    disabled={fulfillingId === request.id}
                                                    className="shrink-0 bg-green-600 hover:bg-green-700 text-white"
                                                >
                                                    {fulfillingId === request.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
                                                </Button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>

                    {/* Desktop Table */}
                    <div className="hidden lg:block border rounded-lg overflow-hidden">
                        <table className="w-full">
                            <thead className="bg-muted/50">
                                <tr>
                                    <th className="w-10 px-4 py-3">
                                        {pendingFilteredIds.length > 0 && (
                                            <input
                                                type="checkbox"
                                                checked={allPendingSelected}
                                                onChange={toggleSelectAll}
                                                className="h-4 w-4 rounded border-gray-300 cursor-pointer accent-blue-600"
                                                title="Select all pending"
                                            />
                                        )}
                                    </th>
                                    <th className="text-left px-4 py-3 text-sm font-medium">Order ID</th>
                                    <th className="text-left px-4 py-3 text-sm font-medium">Customer</th>
                                    <th className="text-left px-4 py-3 text-sm font-medium">Requested Username</th>
                                    <th className="text-left px-4 py-3 text-sm font-medium">Status</th>
                                    <th className="text-left px-4 py-3 text-sm font-medium">Submitted</th>
                                    <th className="text-left px-4 py-3 text-sm font-medium">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y">
                                {filteredRequests.length === 0 ? (
                                    <tr>
                                        <td colSpan={7} className="text-center py-12 text-muted-foreground">
                                            No customization requests found
                                        </td>
                                    </tr>
                                ) : (
                                    filteredRequests.map(request => (
                                        <tr key={request.id} className={`hover:bg-muted/30 ${selectedIds.has(request.id) ? 'bg-blue-50 dark:bg-blue-950/20' : ''}`}>
                                            <td className="px-4 py-3">
                                                {!request.is_completed ? (
                                                    <input
                                                        type="checkbox"
                                                        checked={selectedIds.has(request.id)}
                                                        onChange={() => toggleSelect(request.id)}
                                                        className="h-4 w-4 rounded border-gray-300 cursor-pointer accent-blue-600"
                                                    />
                                                ) : null}
                                            </td>
                                            <td className="px-4 py-3 font-mono text-sm">{request.order_id}</td>
                                            <td className="px-4 py-3 text-sm">
                                                <div>{request.display_name}</div>
                                                {request.customer_email && (
                                                    <div className="text-xs text-muted-foreground">{request.customer_email}</div>
                                                )}
                                            </td>
                                            <td className="px-4 py-3 text-sm font-mono text-blue-600">
                                                {request.username_prefix ? `${request.username_prefix}@ms365.pro` : '-'}
                                            </td>
                                            <td className="px-4 py-3">
                                                <Badge className={request.is_completed
                                                    ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                                                    : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
                                                }>
                                                    {request.is_completed ? 'FULFILLED' : 'PENDING'}
                                                </Badge>
                                            </td>
                                            <td className="px-4 py-3 text-sm text-muted-foreground">
                                                {new Date(request.created_at).toLocaleDateString()}
                                            </td>
                                            <td className="px-4 py-3">
                                                <div className="flex items-center gap-2">
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() => openRequestDetails(request.id)}
                                                    >
                                                        <Eye className="w-4 h-4 mr-1" />
                                                        View
                                                    </Button>
                                                    {!request.is_completed && (
                                                        <Button
                                                            size="sm"
                                                            onClick={() => handleDirectFulfill(request.id, request.order_id, request.username_prefix)}
                                                            disabled={fulfillingId === request.id}
                                                            className="bg-green-600 hover:bg-green-700 text-white"
                                                        >
                                                            {fulfillingId === request.id ? (
                                                                <Loader2 className="w-4 h-4 animate-spin mr-1" />
                                                            ) : (
                                                                <Zap className="w-4 h-4 mr-1" />
                                                            )}
                                                            Fulfill
                                                        </Button>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Bulk Action Bar */}
                    {selectedIds.size > 0 && (
                        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 bg-neutral-900 dark:bg-neutral-800 text-white rounded-full shadow-2xl px-6 py-3 flex items-center gap-4 border border-neutral-700">
                            <span className="text-sm font-medium">
                                {selectedIds.size} selected
                            </span>
                            <div className="w-px h-5 bg-neutral-600" />
                            <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => setSelectedIds(new Set())}
                                className="text-neutral-300 hover:text-white hover:bg-neutral-700"
                            >
                                <X className="w-4 h-4 mr-1" />
                                Clear
                            </Button>
                            <Button
                                size="sm"
                                onClick={handleBulkDelete}
                                disabled={isBulkDeleting}
                                className="bg-red-600 hover:bg-red-700 text-white"
                            >
                                {isBulkDeleting ? (
                                    <Loader2 className="w-4 h-4 animate-spin mr-1" />
                                ) : (
                                    <Trash2 className="w-4 h-4 mr-1" />
                                )}
                                Delete Selected
                            </Button>
                        </div>
                    )}
                </>
            )}

            {/* Request Details Modal */}
            {isModalOpen && selectedRequest && (
                <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4 overflow-y-auto">
                    <div className="bg-white dark:bg-neutral-900 rounded-lg shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                        <div className="bg-neutral-100 dark:bg-neutral-800 px-6 py-4 flex items-center justify-between sticky top-0">
                            <h2 className="text-lg font-bold">Customization Request Details</h2>
                            <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-neutral-200 dark:hover:bg-neutral-700 rounded">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="p-6 space-y-6">
                            {/* Request Info */}
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <p className="text-sm text-muted-foreground">Order ID</p>
                                    <p className="font-mono font-medium">{selectedRequest.order_id}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-muted-foreground">Status</p>
                                    <Badge className={selectedRequest.is_completed
                                        ? 'bg-green-100 text-green-800'
                                        : 'bg-yellow-100 text-yellow-800'
                                    }>
                                        {selectedRequest.is_completed ? 'FULFILLED' : 'PENDING'}
                                    </Badge>
                                </div>
                                <div>
                                    <p className="text-sm text-muted-foreground">Customer Name</p>
                                    <p className="font-medium">{selectedRequest.display_name}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-muted-foreground">Customer Email</p>
                                    <p className="font-medium">{selectedRequest.customer_email || '-'}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-muted-foreground">Requested Username</p>
                                    <p className="font-mono font-medium text-blue-600">
                                        {selectedRequest.username_prefix ? `${selectedRequest.username_prefix}@ms365.pro` : '-'}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-sm text-muted-foreground">Submitted</p>
                                    <p>{new Date(selectedRequest.created_at).toLocaleString()}</p>
                                </div>
                                {selectedRequest.completed_at && (
                                    <div>
                                        <p className="text-sm text-muted-foreground">Fulfilled At</p>
                                        <p>{new Date(selectedRequest.completed_at).toLocaleString()}</p>
                                    </div>
                                )}
                                {selectedRequest.generated_email && (
                                    <div>
                                        <p className="text-sm text-muted-foreground">Generated Email</p>
                                        <p className="font-mono text-green-600 font-medium">{selectedRequest.generated_email}</p>
                                    </div>
                                )}
                            </div>

                            {/* Current License Key */}
                            <div className="bg-neutral-100 dark:bg-neutral-800 rounded-lg p-4">
                                <h3 className="font-medium mb-2 flex items-center gap-2">
                                    <Key className="w-4 h-4" />
                                    Current License Key
                                </h3>
                                <code className="font-mono text-sm break-all">
                                    {selectedRequest.current_license_key || 'No license key found'}
                                </code>
                            </div>

                            {/* Fulfill Section (for pending requests) */}
                            {!selectedRequest.is_completed && (
                                <div className="border-t pt-6 space-y-4">
                                    <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 rounded-lg p-4">
                                        <div className="flex items-start gap-3">
                                            <User className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                                            <div>
                                                <p className="font-medium text-blue-800 dark:text-blue-400">Fulfill This Request</p>
                                                <p className="text-sm text-blue-700 dark:text-blue-500 mt-1">
                                                    The username will be set to <strong className="font-mono">{selectedRequest.username_prefix}@ms365.pro</strong>.
                                                    The password will be auto-extracted from the current license key.
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Action Button */}
                                    <Button
                                        onClick={handleFulfill}
                                        disabled={isProcessing}
                                        className="w-full bg-blue-600 hover:bg-blue-700"
                                    >
                                        {isProcessing ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <CheckCircle className="w-4 h-4 mr-2" />}
                                        Fulfill Username Customization
                                    </Button>
                                </div>
                            )}

                            {/* Already fulfilled info */}
                            {selectedRequest.is_completed && (
                                <div className="bg-green-50 dark:bg-green-950/30 border border-green-200 rounded-lg p-4">
                                    <div className="flex items-center gap-2 mb-2">
                                        <CheckCircle className="w-5 h-5 text-green-600" />
                                        <h3 className="font-medium text-green-800 dark:text-green-400">Fulfilled</h3>
                                    </div>
                                    <p className="text-sm text-green-700 dark:text-green-500">
                                        This request was fulfilled on {selectedRequest.completed_at ? new Date(selectedRequest.completed_at).toLocaleString() : 'N/A'}.
                                        The customer&apos;s username has been set to <strong className="font-mono">{selectedRequest.generated_email}</strong>.
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
