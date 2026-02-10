'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { Search, Filter, Clock, CheckCircle, XCircle, Loader2, Eye, X, RefreshCw, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';

interface ReplacementRequest {
    id: string;
    order_id: string;
    customer_email: string;
    fsn: string;
    screenshot_url: string;
    status: 'PENDING' | 'APPROVED' | 'REJECTED';
    admin_notes: string | null;
    created_at: string;
    reviewed_at: string | null;
    original_license_key: string | null;
    new_license_key: string | null;
}

interface RequestDetails extends ReplacementRequest {
    available_keys: { id: string; license_key: string }[];
}

interface Stats {
    pending: number;
    approved: number;
    rejected: number;
    total: number;
}

const statusColors: Record<string, string> = {
    PENDING: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
    APPROVED: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
    REJECTED: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
};

export default function AdminReplacementRequestsPage() {
    const [requests, setRequests] = useState<ReplacementRequest[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [stats, setStats] = useState<Stats>({ pending: 0, approved: 0, rejected: 0, total: 0 });

    // Modal states
    const [selectedRequest, setSelectedRequest] = useState<RequestDetails | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const [adminNotes, setAdminNotes] = useState('');
    const [selectedKeyId, setSelectedKeyId] = useState('');
    const [useManualKey, setUseManualKey] = useState(false);
    const [manualKeyValue, setManualKeyValue] = useState('');

    useEffect(() => {
        fetchRequests();
    }, [statusFilter]);

    const fetchRequests = async () => {
        setIsLoading(true);
        try {
            const url = new URL('/api/admin/replacement-requests', window.location.origin);
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
            toast.error('Failed to load replacement requests');
        } finally {
            setIsLoading(false);
        }
    };

    const openRequestDetails = async (requestId: string) => {
        try {
            const res = await fetch(`/api/admin/replacement-requests/${requestId}`);
            const data = await res.json();
            if (data.success) {
                setSelectedRequest(data.data);
                setAdminNotes('');
                setSelectedKeyId('');
                setUseManualKey(false);
                setManualKeyValue('');
                setIsModalOpen(true);
            }
        } catch (error) {
            toast.error('Failed to load request details');
        }
    };

    const handleApprove = async () => {
        if (!selectedRequest) return;

        if (useManualKey) {
            if (!manualKeyValue.trim()) {
                toast.error('Please enter a manual license key');
                return;
            }
        } else {
            if (!selectedKeyId) {
                toast.error('Please select a new license key');
                return;
            }
        }

        setIsProcessing(true);
        try {
            const payload: Record<string, string> = {
                action: 'approve',
                adminNotes: adminNotes || (useManualKey ? 'Replacement approved (manual key)' : 'Replacement approved')
            };

            if (useManualKey) {
                payload.manualKey = manualKeyValue.trim();
            } else {
                payload.newLicenseKeyId = selectedKeyId;
            }

            const res = await fetch(`/api/admin/replacement-requests/${selectedRequest.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            const data = await res.json();
            if (data.success) {
                toast.success(useManualKey
                    ? 'Replacement approved with manual key! Customer notified.'
                    : 'Replacement request approved! Customer notified via email.'
                );
                setIsModalOpen(false);
                fetchRequests();
            } else {
                toast.error(data.error || 'Failed to approve request');
            }
        } catch (error) {
            toast.error('Failed to approve request');
        } finally {
            setIsProcessing(false);
        }
    };

    const handleReject = async () => {
        if (!selectedRequest || !adminNotes.trim()) {
            toast.error('Please provide a reason for rejection');
            return;
        }

        setIsProcessing(true);
        try {
            const res = await fetch(`/api/admin/replacement-requests/${selectedRequest.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'reject',
                    adminNotes
                })
            });

            const data = await res.json();
            if (data.success) {
                toast.success('Replacement request rejected. Customer notified via email.');
                setIsModalOpen(false);
                fetchRequests();
            } else {
                toast.error(data.error || 'Failed to reject request');
            }
        } catch (error) {
            toast.error('Failed to reject request');
        } finally {
            setIsProcessing(false);
        }
    };

    const filteredRequests = requests.filter(request =>
        request.order_id.toLowerCase().includes(search.toLowerCase()) ||
        request.customer_email.toLowerCase().includes(search.toLowerCase()) ||
        (request.fsn && request.fsn.toLowerCase().includes(search.toLowerCase()))
    );

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold">License Replacement Requests</h1>
                    <p className="text-muted-foreground">Manage customer license key replacement requests</p>
                </div>
                <Button onClick={fetchRequests} variant="outline" size="sm">
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Refresh
                </Button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-yellow-50 dark:bg-yellow-950/30 rounded-lg p-4 cursor-pointer hover:ring-2 ring-yellow-300" onClick={() => setStatusFilter('PENDING')}>
                    <div className="flex items-center justify-between">
                        <div>
                            <div className="text-2xl font-bold text-yellow-600">{stats.pending}</div>
                            <div className="text-sm text-muted-foreground">Pending</div>
                        </div>
                        <Clock className="w-8 h-8 text-yellow-500 opacity-50" />
                    </div>
                </div>
                <div className="bg-green-50 dark:bg-green-950/30 rounded-lg p-4 cursor-pointer hover:ring-2 ring-green-300" onClick={() => setStatusFilter('APPROVED')}>
                    <div className="flex items-center justify-between">
                        <div>
                            <div className="text-2xl font-bold text-green-600">{stats.approved}</div>
                            <div className="text-sm text-muted-foreground">Approved</div>
                        </div>
                        <CheckCircle className="w-8 h-8 text-green-500 opacity-50" />
                    </div>
                </div>
                <div className="bg-red-50 dark:bg-red-950/30 rounded-lg p-4 cursor-pointer hover:ring-2 ring-red-300" onClick={() => setStatusFilter('REJECTED')}>
                    <div className="flex items-center justify-between">
                        <div>
                            <div className="text-2xl font-bold text-red-600">{stats.rejected}</div>
                            <div className="text-sm text-muted-foreground">Rejected</div>
                        </div>
                        <XCircle className="w-8 h-8 text-red-500 opacity-50" />
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
                        placeholder="Search by order ID, email, or FSN..."
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
                    <option value="PENDING">Pending</option>
                    <option value="APPROVED">Approved</option>
                    <option value="REJECTED">Rejected</option>
                </select>
            </div>

            {/* Requests - Mobile Cards View */}
            {isLoading ? (
                <div className="flex justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
            ) : (
                <>
                    <div className="lg:hidden space-y-3">
                        {filteredRequests.length === 0 ? (
                            <div className="text-center py-12 text-muted-foreground bg-card border rounded-lg">
                                No replacement requests found
                            </div>
                        ) : (
                            filteredRequests.map(request => (
                                <div key={request.id} className="bg-card border rounded-lg p-4">
                                    <div className="flex items-start justify-between gap-3">
                                        <div className="flex-1 min-w-0">
                                            <p className="font-mono text-sm font-medium truncate">{request.order_id}</p>
                                            <p className="text-sm text-muted-foreground truncate mt-1">{request.customer_email}</p>
                                            <div className="flex items-center flex-wrap gap-2 mt-2">
                                                <Badge className={statusColors[request.status]}>
                                                    {request.status}
                                                </Badge>
                                                {request.fsn && (
                                                    <span className="text-xs font-mono text-muted-foreground">{request.fsn}</span>
                                                )}
                                            </div>
                                            <p className="text-xs text-muted-foreground mt-2">
                                                {new Date(request.created_at).toLocaleDateString()}
                                            </p>
                                        </div>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => openRequestDetails(request.id)}
                                            className="shrink-0"
                                        >
                                            <Eye className="w-4 h-4" />
                                        </Button>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>

                    {/* Requests Table - Desktop View */}
                    <div className="hidden lg:block border rounded-lg overflow-hidden">
                        <table className="w-full">
                            <thead className="bg-muted/50">
                                <tr>
                                    <th className="text-left px-4 py-3 text-sm font-medium">Order ID</th>
                                    <th className="text-left px-4 py-3 text-sm font-medium">Customer Email</th>
                                    <th className="text-left px-4 py-3 text-sm font-medium">FSN</th>
                                    <th className="text-left px-4 py-3 text-sm font-medium">Status</th>
                                    <th className="text-left px-4 py-3 text-sm font-medium">Submitted</th>
                                    <th className="text-left px-4 py-3 text-sm font-medium">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y">
                                {filteredRequests.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} className="text-center py-12 text-muted-foreground">
                                            No replacement requests found
                                        </td>
                                    </tr>
                                ) : (
                                    filteredRequests.map(request => (
                                        <tr key={request.id} className="hover:bg-muted/30">
                                            <td className="px-4 py-3 font-mono text-sm">{request.order_id}</td>
                                            <td className="px-4 py-3 text-sm">{request.customer_email}</td>
                                            <td className="px-4 py-3 text-sm font-mono">{request.fsn || '-'}</td>
                                            <td className="px-4 py-3">
                                                <Badge className={statusColors[request.status]}>
                                                    {request.status}
                                                </Badge>
                                            </td>
                                            <td className="px-4 py-3 text-sm text-muted-foreground">
                                                {new Date(request.created_at).toLocaleDateString()}
                                            </td>
                                            <td className="px-4 py-3">
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => openRequestDetails(request.id)}
                                                >
                                                    <Eye className="w-4 h-4 mr-1" />
                                                    View
                                                </Button>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </>
            )}

            {/* Request Details Modal */}
            {isModalOpen && selectedRequest && (
                <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4 overflow-y-auto">
                    <div className="bg-white dark:bg-neutral-900 rounded-lg shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                        <div className="bg-neutral-100 dark:bg-neutral-800 px-6 py-4 flex items-center justify-between sticky top-0">
                            <h2 className="text-lg font-bold">Replacement Request Details</h2>
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
                                    <p className="text-sm text-muted-foreground">Customer Email</p>
                                    <p className="font-medium">{selectedRequest.customer_email}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-muted-foreground">FSN</p>
                                    <p className="font-mono">{selectedRequest.fsn || '-'}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-muted-foreground">Status</p>
                                    <Badge className={statusColors[selectedRequest.status]}>
                                        {selectedRequest.status}
                                    </Badge>
                                </div>
                                <div>
                                    <p className="text-sm text-muted-foreground">Submitted</p>
                                    <p>{new Date(selectedRequest.created_at).toLocaleString()}</p>
                                </div>
                                {selectedRequest.reviewed_at && (
                                    <div>
                                        <p className="text-sm text-muted-foreground">Reviewed</p>
                                        <p>{new Date(selectedRequest.reviewed_at).toLocaleString()}</p>
                                    </div>
                                )}
                            </div>

                            {/* License Keys */}
                            <div className="bg-neutral-100 dark:bg-neutral-800 rounded-lg p-4">
                                <h3 className="font-medium mb-3">License Keys</h3>
                                <div className="space-y-2">
                                    <div>
                                        <p className="text-sm text-muted-foreground">Original Key (Reported as Faulty)</p>
                                        <code className="font-mono text-red-600">{selectedRequest.original_license_key || 'N/A'}</code>
                                    </div>
                                    {selectedRequest.new_license_key && (
                                        <div>
                                            <p className="text-sm text-muted-foreground">New Key (Assigned)</p>
                                            <code className="font-mono text-green-600">{selectedRequest.new_license_key}</code>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Screenshot */}
                            <div>
                                <h3 className="font-medium mb-3">Customer Screenshot</h3>
                                <a href={selectedRequest.screenshot_url} target="_blank" rel="noopener noreferrer">
                                    <Image
                                        src={selectedRequest.screenshot_url}
                                        alt="Customer screenshot"
                                        width={600}
                                        height={400}
                                        className="rounded-lg border max-h-[300px] object-contain cursor-pointer hover:opacity-90"
                                        unoptimized
                                    />
                                </a>
                                <p className="text-xs text-muted-foreground mt-2">Click to open in new tab</p>
                            </div>

                            {/* Admin Notes (for processed requests) */}
                            {selectedRequest.admin_notes && selectedRequest.status !== 'PENDING' && (
                                <div className={`p-4 rounded-lg ${selectedRequest.status === 'APPROVED' ? 'bg-green-50 dark:bg-green-950/30' : 'bg-red-50 dark:bg-red-950/30'}`}>
                                    <h3 className="font-medium mb-2">Admin Notes</h3>
                                    <p className="text-sm">{selectedRequest.admin_notes}</p>
                                </div>
                            )}

                            {/* Action Section (for pending requests) */}
                            {selectedRequest.status === 'PENDING' && (
                                <div className="border-t pt-6 space-y-4">
                                    <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 rounded-lg p-4">
                                        <div className="flex items-start gap-3">
                                            <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                                            <div>
                                                <p className="font-medium text-amber-800 dark:text-amber-400">Review Carefully</p>
                                                <p className="text-sm text-amber-700 dark:text-amber-500 mt-1">
                                                    Verify the screenshot shows a genuine activation failure before approving.
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Key Assignment Mode Toggle */}
                                    <div>
                                        <label className="block text-sm font-medium mb-2">Key Assignment Mode</label>
                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => { setUseManualKey(false); setManualKeyValue(''); }}
                                                className={`flex-1 px-3 py-2 rounded-md text-sm font-medium transition-colors ${!useManualKey
                                                    ? 'bg-blue-600 text-white'
                                                    : 'bg-neutral-200 dark:bg-neutral-700 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-300 dark:hover:bg-neutral-600'
                                                    }`}
                                            >
                                                From Inventory
                                            </button>
                                            <button
                                                onClick={() => { setUseManualKey(true); setSelectedKeyId(''); }}
                                                className={`flex-1 px-3 py-2 rounded-md text-sm font-medium transition-colors ${useManualKey
                                                    ? 'bg-orange-600 text-white'
                                                    : 'bg-neutral-200 dark:bg-neutral-700 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-300 dark:hover:bg-neutral-600'
                                                    }`}
                                            >
                                                Manual Entry
                                            </button>
                                        </div>
                                    </div>

                                    {/* Inventory Key Selection */}
                                    {!useManualKey && (
                                        <div>
                                            <label className="block text-sm font-medium mb-2">
                                                Select New License Key (for approval)
                                            </label>
                                            <select
                                                value={selectedKeyId}
                                                onChange={(e) => setSelectedKeyId(e.target.value)}
                                                className="w-full px-3 py-2 border rounded-md bg-background font-mono text-sm"
                                            >
                                                <option value="">-- Select a key --</option>
                                                {selectedRequest.available_keys.map(key => (
                                                    <option key={key.id} value={key.id}>
                                                        {key.license_key}
                                                    </option>
                                                ))}
                                            </select>
                                            {selectedRequest.available_keys.length === 0 && (
                                                <p className="text-sm text-red-500 mt-1">
                                                    No available keys for this FSN. Please add keys first.
                                                </p>
                                            )}
                                        </div>
                                    )}

                                    {/* Manual Key Input */}
                                    {useManualKey && (
                                        <div>
                                            <label className="block text-sm font-medium mb-2">
                                                Enter License Key Manually
                                            </label>
                                            <input
                                                type="text"
                                                value={manualKeyValue}
                                                onChange={(e) => setManualKeyValue(e.target.value)}
                                                placeholder="Paste or type the license key here..."
                                                className="w-full px-3 py-2 border rounded-md bg-background font-mono text-sm"
                                            />
                                            <p className="text-xs text-amber-600 mt-1">
                                                ⚠ This key is NOT from the inventory and won&apos;t be tracked as redeemed.
                                            </p>
                                        </div>
                                    )}

                                    {/* Admin Notes Input */}
                                    <div>
                                        <label className="block text-sm font-medium mb-2">
                                            Admin Notes <span className="text-muted-foreground">(required for rejection)</span>
                                        </label>
                                        <textarea
                                            value={adminNotes}
                                            onChange={(e) => setAdminNotes(e.target.value)}
                                            placeholder="Enter reason for rejection or approval notes..."
                                            className="w-full px-3 py-2 border rounded-md bg-background min-h-[80px]"
                                        />
                                    </div>

                                    {/* Action Buttons */}
                                    <div className="flex gap-3">
                                        <Button
                                            onClick={handleApprove}
                                            disabled={isProcessing || (useManualKey ? !manualKeyValue.trim() : !selectedKeyId)}
                                            className="flex-1 bg-green-600 hover:bg-green-700"
                                        >
                                            {isProcessing ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <CheckCircle className="w-4 h-4 mr-2" />}
                                            {useManualKey ? 'Approve with Manual Key' : 'Approve & Assign Key'}
                                        </Button>
                                        <Button
                                            onClick={handleReject}
                                            disabled={isProcessing || !adminNotes.trim()}
                                            variant="destructive"
                                            className="flex-1"
                                        >
                                            {isProcessing ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <XCircle className="w-4 h-4 mr-2" />}
                                            Reject Request
                                        </Button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
