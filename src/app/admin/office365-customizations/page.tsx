'use client';

import { useEffect, useState } from 'react';
import { Search, Filter, Clock, CheckCircle, Loader2, Eye, X, RefreshCw, User, Key, Mail, Zap, Trash2, XCircle, Ban } from 'lucide-react';
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
    is_rejected: boolean;
    rejection_reason: string | null;
    rejected_at: string | null;
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
    rejected: number;
    total: number;
}

export default function AdminOffice365CustomizationsPage() {
    const [requests, setRequests] = useState<CustomizationRequest[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [stats, setStats] = useState<Stats>({ pending: 0, fulfilled: 0, rejected: 0, total: 0 });

    // Modal states
    const [selectedRequest, setSelectedRequest] = useState<RequestDetails | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const [fulfillingId, setFulfillingId] = useState<string | null>(null);
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
    const [isBulkDeleting, setIsBulkDeleting] = useState(false);

    // Rejection modal
    const [showRejectModal, setShowRejectModal] = useState(false);
    const [rejectingRequest, setRejectingRequest] = useState<CustomizationRequest | null>(null);
    const [rejectionReason, setRejectionReason] = useState('');
    const [isRejecting, setIsRejecting] = useState(false);

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

    // Open reject dialog
    const openRejectDialog = (request: CustomizationRequest) => {
        setRejectingRequest(request);
        setRejectionReason('');
        setShowRejectModal(true);
    };

    // Handle rejection
    const handleReject = async () => {
        if (!rejectingRequest) return;

        setIsRejecting(true);
        try {
            const res = await fetch(`/api/admin/office365-customizations/${rejectingRequest.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'reject',
                    rejectionReason: rejectionReason.trim() || undefined
                })
            });
            const data = await res.json();
            if (data.success) {
                toast.success('Request rejected. Customer has been notified.');
                setShowRejectModal(false);
                setIsModalOpen(false);
                fetchRequests();
            } else {
                toast.error(data.error || 'Failed to reject request');
            }
        } catch {
            toast.error('Network error');
        } finally {
            setIsRejecting(false);
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

    const pendingFilteredIds = filteredRequests.filter(r => !r.is_completed && !r.is_rejected).map(r => r.id);
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

    const getStatusBadge = (request: CustomizationRequest) => {
        if (request.is_completed) {
            return (
                <Badge className="bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/20">
                    FULFILLED
                </Badge>
            );
        }
        if (request.is_rejected) {
            return (
                <Badge className="bg-red-500/15 text-red-400 border border-red-500/30 hover:bg-red-500/20">
                    REJECTED
                </Badge>
            );
        }
        return (
            <Badge className="bg-amber-500/15 text-amber-400 border border-amber-500/30 hover:bg-amber-500/20">
                PENDING
            </Badge>
        );
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-foreground">O365 Username Customizations</h1>
                    <p className="text-muted-foreground">Manage Office 365 username customization requests</p>
                </div>
                <Button onClick={fetchRequests} variant="outline" size="sm">
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Refresh
                </Button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div
                    className={`rounded-xl p-4 cursor-pointer transition-all border ${statusFilter === 'pending' ? 'ring-2 ring-amber-400 border-amber-500/50' : 'border-amber-500/20 hover:border-amber-500/40'} bg-amber-500/5 dark:bg-amber-500/10`}
                    onClick={() => setStatusFilter('pending')}
                >
                    <div className="flex items-center justify-between">
                        <div>
                            <div className="text-2xl font-bold text-amber-500">{stats.pending}</div>
                            <div className="text-sm text-muted-foreground font-medium">Pending</div>
                        </div>
                        <Clock className="w-8 h-8 text-amber-500/40" />
                    </div>
                </div>
                <div
                    className={`rounded-xl p-4 cursor-pointer transition-all border ${statusFilter === 'fulfilled' ? 'ring-2 ring-emerald-400 border-emerald-500/50' : 'border-emerald-500/20 hover:border-emerald-500/40'} bg-emerald-500/5 dark:bg-emerald-500/10`}
                    onClick={() => setStatusFilter('fulfilled')}
                >
                    <div className="flex items-center justify-between">
                        <div>
                            <div className="text-2xl font-bold text-emerald-500">{stats.fulfilled}</div>
                            <div className="text-sm text-muted-foreground font-medium">Fulfilled</div>
                        </div>
                        <CheckCircle className="w-8 h-8 text-emerald-500/40" />
                    </div>
                </div>
                <div
                    className={`rounded-xl p-4 cursor-pointer transition-all border ${statusFilter === 'rejected' ? 'ring-2 ring-red-400 border-red-500/50' : 'border-red-500/20 hover:border-red-500/40'} bg-red-500/5 dark:bg-red-500/10`}
                    onClick={() => setStatusFilter('rejected')}
                >
                    <div className="flex items-center justify-between">
                        <div>
                            <div className="text-2xl font-bold text-red-500">{stats.rejected}</div>
                            <div className="text-sm text-muted-foreground font-medium">Rejected</div>
                        </div>
                        <XCircle className="w-8 h-8 text-red-500/40" />
                    </div>
                </div>
                <div
                    className={`rounded-xl p-4 cursor-pointer transition-all border ${statusFilter === 'all' ? 'ring-2 ring-blue-400 border-blue-500/50' : 'border-border hover:border-blue-500/40'} bg-muted/30`}
                    onClick={() => setStatusFilter('all')}
                >
                    <div className="flex items-center justify-between">
                        <div>
                            <div className="text-2xl font-bold text-foreground">{stats.total}</div>
                            <div className="text-sm text-muted-foreground font-medium">Total</div>
                        </div>
                        <Filter className="w-8 h-8 text-muted-foreground/40" />
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
                    className="px-3 py-2 border rounded-md bg-background text-foreground"
                >
                    <option value="all">All Status</option>
                    <option value="pending">Pending</option>
                    <option value="fulfilled">Fulfilled</option>
                    <option value="rejected">Rejected</option>
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
                                        {!request.is_completed && !request.is_rejected && (
                                            <input
                                                type="checkbox"
                                                checked={selectedIds.has(request.id)}
                                                onChange={() => toggleSelect(request.id)}
                                                className="mt-1 h-4 w-4 rounded border-gray-300 shrink-0 cursor-pointer accent-blue-600"
                                            />
                                        )}
                                        <div className="flex-1 min-w-0">
                                            <p className="font-mono text-sm font-medium truncate text-foreground">{request.order_id}</p>
                                            <p className="text-sm text-muted-foreground mt-1">
                                                {request.display_name}
                                            </p>
                                            {request.customer_email && (
                                                <p className="text-xs text-muted-foreground/70 mt-0.5">{request.customer_email}</p>
                                            )}
                                            {request.username_prefix && (
                                                <p className="text-sm font-mono text-blue-400 mt-1">
                                                    {request.username_prefix}@ms365.pro
                                                </p>
                                            )}
                                            <div className="flex items-center gap-2 mt-2">
                                                {getStatusBadge(request)}
                                            </div>
                                            {request.is_rejected && request.rejection_reason && (
                                                <p className="text-xs text-red-400/80 mt-1 italic">{request.rejection_reason}</p>
                                            )}
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
                                            {!request.is_completed && !request.is_rejected && (
                                                <>
                                                    <Button
                                                        size="sm"
                                                        onClick={() => handleDirectFulfill(request.id, request.order_id, request.username_prefix)}
                                                        disabled={fulfillingId === request.id}
                                                        className="shrink-0 bg-emerald-600 hover:bg-emerald-700 text-white"
                                                    >
                                                        {fulfillingId === request.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
                                                    </Button>
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        onClick={() => openRejectDialog(request)}
                                                        className="shrink-0 border-red-500/30 text-red-400 hover:bg-red-500/10 hover:text-red-300"
                                                    >
                                                        <Ban className="w-4 h-4" />
                                                    </Button>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>

                    {/* Desktop Table */}
                    <div className="hidden lg:block border rounded-xl overflow-hidden bg-card">
                        <table className="w-full">
                            <thead className="bg-muted/60 border-b border-border">
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
                                    <th className="text-left px-4 py-3 text-sm font-semibold text-muted-foreground uppercase tracking-wider">Order ID</th>
                                    <th className="text-left px-4 py-3 text-sm font-semibold text-muted-foreground uppercase tracking-wider">Customer</th>
                                    <th className="text-left px-4 py-3 text-sm font-semibold text-muted-foreground uppercase tracking-wider">Requested Username</th>
                                    <th className="text-left px-4 py-3 text-sm font-semibold text-muted-foreground uppercase tracking-wider">Status</th>
                                    <th className="text-left px-4 py-3 text-sm font-semibold text-muted-foreground uppercase tracking-wider">Submitted</th>
                                    <th className="text-left px-4 py-3 text-sm font-semibold text-muted-foreground uppercase tracking-wider">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border">
                                {filteredRequests.length === 0 ? (
                                    <tr>
                                        <td colSpan={7} className="text-center py-12 text-muted-foreground">
                                            No customization requests found
                                        </td>
                                    </tr>
                                ) : (
                                    filteredRequests.map(request => (
                                        <tr key={request.id} className={`transition-colors hover:bg-muted/20 ${selectedIds.has(request.id) ? 'bg-blue-500/5 dark:bg-blue-500/10' : ''}`}>
                                            <td className="px-4 py-3">
                                                {!request.is_completed && !request.is_rejected ? (
                                                    <input
                                                        type="checkbox"
                                                        checked={selectedIds.has(request.id)}
                                                        onChange={() => toggleSelect(request.id)}
                                                        className="h-4 w-4 rounded border-gray-300 cursor-pointer accent-blue-600"
                                                    />
                                                ) : null}
                                            </td>
                                            <td className="px-4 py-3 font-mono text-sm text-foreground">{request.order_id}</td>
                                            <td className="px-4 py-3 text-sm">
                                                <div className="text-foreground font-medium">{request.display_name}</div>
                                                {request.customer_email && (
                                                    <div className="text-xs text-muted-foreground mt-0.5">{request.customer_email}</div>
                                                )}
                                            </td>
                                            <td className="px-4 py-3 text-sm font-mono text-blue-400">
                                                {request.username_prefix ? `${request.username_prefix}@ms365.pro` : '-'}
                                            </td>
                                            <td className="px-4 py-3">
                                                {getStatusBadge(request)}
                                                {request.is_rejected && request.rejection_reason && (
                                                    <p className="text-xs text-red-400/70 mt-1 max-w-[200px] truncate" title={request.rejection_reason}>
                                                        {request.rejection_reason}
                                                    </p>
                                                )}
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
                                                        className="text-foreground"
                                                    >
                                                        <Eye className="w-4 h-4 mr-1" />
                                                        View
                                                    </Button>
                                                    {!request.is_completed && !request.is_rejected && (
                                                        <>
                                                            <Button
                                                                size="sm"
                                                                onClick={() => handleDirectFulfill(request.id, request.order_id, request.username_prefix)}
                                                                disabled={fulfillingId === request.id}
                                                                className="bg-emerald-600 hover:bg-emerald-700 text-white"
                                                            >
                                                                {fulfillingId === request.id ? (
                                                                    <Loader2 className="w-4 h-4 animate-spin mr-1" />
                                                                ) : (
                                                                    <Zap className="w-4 h-4 mr-1" />
                                                                )}
                                                                Fulfill
                                                            </Button>
                                                            <Button
                                                                size="sm"
                                                                variant="outline"
                                                                onClick={() => openRejectDialog(request)}
                                                                className="border-red-500/30 text-red-400 hover:bg-red-500/10 hover:text-red-300 hover:border-red-500/50"
                                                            >
                                                                <Ban className="w-4 h-4 mr-1" />
                                                                Reject
                                                            </Button>
                                                        </>
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
                    <div className="bg-card rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-border">
                        <div className="bg-muted/60 px-6 py-4 flex items-center justify-between sticky top-0 border-b border-border">
                            <h2 className="text-lg font-bold text-foreground">Customization Request Details</h2>
                            <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-muted rounded-lg transition-colors">
                                <X className="w-5 h-5 text-muted-foreground" />
                            </button>
                        </div>

                        <div className="p-6 space-y-6">
                            {/* Request Info */}
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <p className="text-sm text-muted-foreground mb-1">Order ID</p>
                                    <p className="font-mono font-medium text-foreground">{selectedRequest.order_id}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-muted-foreground mb-1">Status</p>
                                    {getStatusBadge(selectedRequest)}
                                </div>
                                <div>
                                    <p className="text-sm text-muted-foreground mb-1">Customer Name</p>
                                    <p className="font-medium text-foreground">{selectedRequest.display_name}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-muted-foreground mb-1">Customer Email</p>
                                    <p className="font-medium text-foreground">{selectedRequest.customer_email || '-'}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-muted-foreground mb-1">Requested Username</p>
                                    <p className="font-mono font-medium text-blue-400">
                                        {selectedRequest.username_prefix ? `${selectedRequest.username_prefix}@ms365.pro` : '-'}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-sm text-muted-foreground mb-1">Submitted</p>
                                    <p className="text-foreground">{new Date(selectedRequest.created_at).toLocaleString()}</p>
                                </div>
                                {selectedRequest.completed_at && (
                                    <div>
                                        <p className="text-sm text-muted-foreground mb-1">Fulfilled At</p>
                                        <p className="text-foreground">{new Date(selectedRequest.completed_at).toLocaleString()}</p>
                                    </div>
                                )}
                                {selectedRequest.generated_email && (
                                    <div>
                                        <p className="text-sm text-muted-foreground mb-1">Generated Email</p>
                                        <p className="font-mono text-emerald-400 font-medium">{selectedRequest.generated_email}</p>
                                    </div>
                                )}
                            </div>

                            {/* Rejection info */}
                            {selectedRequest.is_rejected && (
                                <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4">
                                    <div className="flex items-center gap-2 mb-2">
                                        <XCircle className="w-5 h-5 text-red-400" />
                                        <h3 className="font-medium text-red-400">Rejected</h3>
                                    </div>
                                    <p className="text-sm text-red-300/80">
                                        {selectedRequest.rejection_reason || 'No reason provided'}
                                    </p>
                                    {selectedRequest.rejected_at && (
                                        <p className="text-xs text-red-400/60 mt-2">
                                            Rejected on {new Date(selectedRequest.rejected_at).toLocaleString()}
                                        </p>
                                    )}
                                </div>
                            )}

                            {/* Current License Key */}
                            <div className="bg-muted/40 border border-border rounded-lg p-4">
                                <h3 className="font-medium mb-2 flex items-center gap-2 text-foreground">
                                    <Key className="w-4 h-4" />
                                    Current License Key
                                </h3>
                                <code className="font-mono text-sm break-all text-foreground/80">
                                    {selectedRequest.current_license_key || 'No license key found'}
                                </code>
                            </div>

                            {/* Fulfill Section (for pending requests) */}
                            {!selectedRequest.is_completed && !selectedRequest.is_rejected && (
                                <div className="border-t border-border pt-6 space-y-4">
                                    <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
                                        <div className="flex items-start gap-3">
                                            <User className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
                                            <div>
                                                <p className="font-medium text-blue-400">Fulfill This Request</p>
                                                <p className="text-sm text-blue-300/70 mt-1">
                                                    The username will be set to <strong className="font-mono text-blue-300">{selectedRequest.username_prefix}@ms365.pro</strong>.
                                                    The password will be auto-extracted from the current license key.
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Action Buttons */}
                                    <div className="flex gap-3">
                                        <Button
                                            onClick={handleFulfill}
                                            disabled={isProcessing}
                                            className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white"
                                        >
                                            {isProcessing ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <CheckCircle className="w-4 h-4 mr-2" />}
                                            Fulfill Username Customization
                                        </Button>
                                        <Button
                                            onClick={() => openRejectDialog(selectedRequest)}
                                            variant="outline"
                                            className="border-red-500/30 text-red-400 hover:bg-red-500/10 hover:text-red-300"
                                        >
                                            <Ban className="w-4 h-4 mr-2" />
                                            Reject
                                        </Button>
                                    </div>
                                </div>
                            )}

                            {/* Already fulfilled info */}
                            {selectedRequest.is_completed && (
                                <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-lg p-4">
                                    <div className="flex items-center gap-2 mb-2">
                                        <CheckCircle className="w-5 h-5 text-emerald-400" />
                                        <h3 className="font-medium text-emerald-400">Fulfilled</h3>
                                    </div>
                                    <p className="text-sm text-emerald-300/80">
                                        This request was fulfilled on {selectedRequest.completed_at ? new Date(selectedRequest.completed_at).toLocaleString() : 'N/A'}.
                                        The customer&apos;s username has been set to <strong className="font-mono text-emerald-300">{selectedRequest.generated_email}</strong>.
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Reject Modal */}
            {showRejectModal && rejectingRequest && (
                <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-[60] p-4">
                    <div className="bg-card rounded-xl shadow-2xl max-w-md w-full border border-border">
                        <div className="bg-red-500/10 px-6 py-4 flex items-center justify-between border-b border-red-500/20 rounded-t-xl">
                            <h2 className="text-lg font-bold text-red-400 flex items-center gap-2">
                                <Ban className="w-5 h-5" />
                                Reject Request
                            </h2>
                            <button onClick={() => setShowRejectModal(false)} className="p-2 hover:bg-muted rounded-lg transition-colors">
                                <X className="w-5 h-5 text-muted-foreground" />
                            </button>
                        </div>

                        <div className="p-6 space-y-4">
                            <div className="bg-muted/40 border border-border rounded-lg p-3">
                                <p className="text-xs text-muted-foreground">Order</p>
                                <p className="font-mono text-sm text-foreground font-medium">{rejectingRequest.order_id}</p>
                                <p className="text-xs text-muted-foreground mt-1">Username</p>
                                <p className="font-mono text-sm text-blue-400">{rejectingRequest.username_prefix}@ms365.pro</p>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-foreground mb-2">
                                    Rejection Reason <span className="text-muted-foreground">(optional — will be shown to customer)</span>
                                </label>
                                <textarea
                                    value={rejectionReason}
                                    onChange={(e) => setRejectionReason(e.target.value)}
                                    placeholder="e.g. Username contains inappropriate content, please choose a different username."
                                    className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-red-500/30 focus:border-red-500/50 resize-none"
                                    rows={3}
                                />
                            </div>

                            <div className="flex gap-3 pt-2">
                                <Button
                                    variant="outline"
                                    onClick={() => setShowRejectModal(false)}
                                    className="flex-1"
                                >
                                    Cancel
                                </Button>
                                <Button
                                    onClick={handleReject}
                                    disabled={isRejecting}
                                    className="flex-1 bg-red-600 hover:bg-red-700 text-white"
                                >
                                    {isRejecting ? (
                                        <Loader2 className="w-4 h-4 animate-spin mr-2" />
                                    ) : (
                                        <Ban className="w-4 h-4 mr-2" />
                                    )}
                                    Reject & Notify Customer
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
