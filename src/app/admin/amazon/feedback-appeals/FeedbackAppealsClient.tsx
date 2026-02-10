'use client';

import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import {
    CheckCircle, XCircle, Clock, ExternalLink, ChevronLeft, ChevronRight,
    Loader2, Search, Eye, X, Phone, Calendar, Image as ImageIcon,
    AlertTriangle, Ban, RefreshCw, Send, IndianRupee, Star, MessageSquare
} from 'lucide-react';
import { toast } from 'sonner';
import Image from 'next/image';

type AppealType = 'feedback' | 'review';

interface FeedbackAppeal {
    id: string;
    order_id: string;
    phone: string | null;
    status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'RESUBMIT';
    screenshot_url: string | null;
    refund_type: 'none' | 'partial' | 'full' | null;
    partial_amount: number | null;
    reminder_count: number;
    last_reminder_at: string | null;
    submitted_at: string | null;
    reviewed_at: string | null;
    admin_notes: string | null;
    created_at: string;
}

export default function FeedbackAppealsClient() {
    const [appealType, setAppealType] = useState<AppealType>('feedback');
    const [appeals, setAppeals] = useState<FeedbackAppeal[]>([]);
    const [totalCount, setTotalCount] = useState(0);
    const [currentPage, setCurrentPage] = useState(1);
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState<string>('all');
    const [isLoading, setIsLoading] = useState(true);
    const [selectedAppeal, setSelectedAppeal] = useState<FeedbackAppeal | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isActionLoading, setIsActionLoading] = useState(false);

    // Initiate modal state
    const [isInitiateModalOpen, setIsInitiateModalOpen] = useState(false);
    const [initiateOrderId, setInitiateOrderId] = useState('');
    const [initiatePhone, setInitiatePhone] = useState('');

    // Review Removal modal state
    const [isReviewRemovalModalOpen, setIsReviewRemovalModalOpen] = useState(false);
    const [reviewRemovalOrderId, setReviewRemovalOrderId] = useState('');
    const [reviewRemovalPhone, setReviewRemovalPhone] = useState('');

    // Stats
    const [pendingCount, setPendingCount] = useState(0);
    const [approvedCount, setApprovedCount] = useState(0);
    const [rejectedCount, setRejectedCount] = useState(0);
    const [resubmitCount, setResubmitCount] = useState(0);

    // WhatsApp message logs
    interface WhatsAppLog {
        id: string;
        order_id: string;
        phone: string;
        template_name: string;
        status: 'success' | 'failed';
        message_id: string | null;
        error_message: string | null;
        created_at: string;
    }
    const [whatsappLogs, setWhatsappLogs] = useState<WhatsAppLog[]>([]);
    const [isLoadingLogs, setIsLoadingLogs] = useState(false);
    const [resendPhone, setResendPhone] = useState('');

    const pageSize = 50;
    const supabase = createClient();

    const fetchStats = useCallback(async () => {
        const typeFilter = appealType === 'feedback' ? 'feedback' : 'review';

        const { count: pending } = await supabase
            .from('feedback_appeals')
            .select('*', { count: 'exact', head: true })
            .eq('type', typeFilter)
            .eq('status', 'PENDING');

        const { count: approved } = await supabase
            .from('feedback_appeals')
            .select('*', { count: 'exact', head: true })
            .eq('type', typeFilter)
            .eq('status', 'APPROVED');

        const { count: rejected } = await supabase
            .from('feedback_appeals')
            .select('*', { count: 'exact', head: true })
            .eq('type', typeFilter)
            .eq('status', 'REJECTED');

        const { count: resubmit } = await supabase
            .from('feedback_appeals')
            .select('*', { count: 'exact', head: true })
            .eq('type', typeFilter)
            .eq('status', 'RESUBMIT');

        setPendingCount(pending || 0);
        setApprovedCount(approved || 0);
        setRejectedCount(rejected || 0);
        setResubmitCount(resubmit || 0);
    }, [supabase, appealType]);

    const fetchAppeals = useCallback(async () => {
        setIsLoading(true);
        const from = (currentPage - 1) * pageSize;
        const to = from + pageSize - 1;
        const typeFilter = appealType === 'feedback' ? 'feedback' : 'review';

        let query = supabase
            .from('feedback_appeals')
            .select('*', { count: 'exact' })
            .eq('type', typeFilter)
            .order('created_at', { ascending: false });

        if (searchQuery) {
            query = query.or(`order_id.ilike.%${searchQuery}%,phone.ilike.%${searchQuery}%`);
        }

        if (statusFilter !== 'all') {
            query = query.eq('status', statusFilter);
        }

        const { data, count, error } = await query.range(from, to);

        if (error) {
            console.error('Error fetching appeals:', error);
            toast.error('Failed to load appeals');
        } else {
            setAppeals(data || []);
            setTotalCount(count || 0);
        }
        setIsLoading(false);
    }, [currentPage, searchQuery, statusFilter, supabase, appealType]);

    useEffect(() => {
        fetchAppeals();
        fetchStats();
    }, [fetchAppeals, fetchStats]);

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        setCurrentPage(1);
        fetchAppeals();
    };

    const fetchWhatsAppLogs = async (orderId: string) => {
        setIsLoadingLogs(true);
        try {
            const response = await fetch(`/api/admin/whatsapp-logs?orderId=${encodeURIComponent(orderId)}`);
            const data = await response.json();
            if (data.success) {
                setWhatsappLogs(data.logs || []);
            } else {
                setWhatsappLogs([]);
            }
        } catch {
            setWhatsappLogs([]);
        } finally {
            setIsLoadingLogs(false);
        }
    };

    const viewDetails = (appeal: FeedbackAppeal) => {
        setSelectedAppeal(appeal);
        setResendPhone(appeal.phone || '');
        setWhatsappLogs([]);
        setIsModalOpen(true);
        fetchWhatsAppLogs(appeal.order_id);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setSelectedAppeal(null);
        setWhatsappLogs([]);
        setResendPhone('');
    };

    const handleResend = async () => {
        if (!selectedAppeal || !resendPhone) {
            toast.error('Phone number is required');
            return;
        }

        setIsActionLoading(true);
        try {
            const response = await fetch('/api/admin/whatsapp-logs', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    orderId: selectedAppeal.order_id,
                    phone: resendPhone,
                    templateType: appealType
                })
            });

            const data = await response.json();

            if (data.success) {
                toast.success('WhatsApp message resent!');
                fetchWhatsAppLogs(selectedAppeal.order_id);
            } else {
                toast.error(data.error || 'Failed to resend');
            }
        } catch {
            toast.error('Network error');
        } finally {
            setIsActionLoading(false);
        }
    };

    const handleAction = async (action: 'approve' | 'reject' | 'resubmit', orderId: string) => {
        setIsActionLoading(true);
        try {
            // Always use same API, pass the type
            const response = await fetch('/api/admin/feedback-appeal', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ orderId, action, type: appealType })
            });

            const data = await response.json();

            if (data.success) {
                toast.success(data.message);
                if (!data.whatsappSent) {
                    toast.warning(`WhatsApp not sent: ${data.whatsappError}`);
                }
                fetchAppeals();
                fetchStats();
                closeModal();
            } else {
                toast.error(data.error || 'Action failed');
            }
        } catch (error) {
            toast.error('Network error');
        } finally {
            setIsActionLoading(false);
        }
    };

    const handleInitiate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!initiateOrderId || !initiatePhone) {
            toast.error('Order ID and phone number are required');
            return;
        }

        setIsActionLoading(true);
        try {
            const response = await fetch('/api/admin/feedback-appeal', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    orderId: initiateOrderId,
                    phone: initiatePhone,
                    action: 'initiate'
                })
            });

            const data = await response.json();

            if (data.success) {
                toast.success(data.message);
                if (!data.whatsappSent) {
                    toast.warning(`WhatsApp not sent: ${data.whatsappError}`);
                }
                setIsInitiateModalOpen(false);
                setInitiateOrderId('');
                setInitiatePhone('');
                fetchAppeals();
                fetchStats();
            } else {
                toast.error(data.error || 'Failed to initiate');
            }
        } catch (error) {
            toast.error('Network error');
        } finally {
            setIsActionLoading(false);
        }
    };

    const handleReviewRemoval = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!reviewRemovalOrderId || !reviewRemovalPhone) {
            toast.error('Order ID and phone number are required');
            return;
        }

        setIsActionLoading(true);
        try {
            const response = await fetch('/api/admin/feedback-appeal', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    orderId: reviewRemovalOrderId,
                    phone: reviewRemovalPhone,
                    action: 'initiate',
                    type: 'review'
                })
            });

            const data = await response.json();

            if (data.success) {
                toast.success(data.message || 'Review removal WhatsApp sent!');
                if (!data.whatsappSent) {
                    toast.warning(`WhatsApp not sent: ${data.whatsappError}`);
                }
                setIsReviewRemovalModalOpen(false);
                setReviewRemovalOrderId('');
                setReviewRemovalPhone('');
                fetchAppeals();
                fetchStats();
            } else {
                toast.error(data.error || 'Failed to send');
            }
        } catch (error) {
            toast.error('Network error');
        } finally {
            setIsActionLoading(false);
        }
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'APPROVED':
                return <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"><CheckCircle className="h-3 w-3" /> Approved</span>;
            case 'REJECTED':
                return <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400"><XCircle className="h-3 w-3" /> Rejected</span>;
            case 'RESUBMIT':
                return <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400"><RefreshCw className="h-3 w-3" /> Resubmit</span>;
            default:
                return <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400"><Clock className="h-3 w-3" /> Pending</span>;
        }
    };

    const getRefundBadge = (refundType: string | null, amount: number | null) => {
        if (!refundType || refundType === 'none') {
            return <span className="text-xs text-gray-500">No refund</span>;
        }
        if (refundType === 'partial') {
            return <span className="inline-flex items-center gap-1 text-xs font-medium text-amber-600"><IndianRupee className="h-3 w-3" />{amount}</span>;
        }
        return <span className="text-xs font-medium text-red-600">Full refund</span>;
    };

    const totalPages = Math.ceil(totalCount / pageSize);

    const formatDate = (dateString: string | null) => {
        if (!dateString) return '-';
        return new Date(dateString).toLocaleString('en-IN', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold">
                        {appealType === 'feedback' ? 'Seller Feedback Appeals' : 'Product Review Appeals'}
                    </h1>
                    <p className="text-muted-foreground">
                        {appealType === 'feedback' ? 'Manage seller feedback removal requests' : 'Manage product review removal requests'}
                        ({totalCount.toLocaleString()} total)
                    </p>
                </div>
                <div className="flex gap-2">
                    {appealType === 'review' && (
                        <button
                            onClick={() => setIsReviewRemovalModalOpen(true)}
                            className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                        >
                            <Star className="h-4 w-4" />
                            Review Removal
                        </button>
                    )}
                    {appealType === 'feedback' && (
                        <button
                            onClick={() => setIsInitiateModalOpen(true)}
                            className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                        >
                            <Ban className="h-4 w-4" />
                            Block Order
                        </button>
                    )}
                </div>
            </div>

            {/* Appeal Type Tabs */}
            <div className="flex gap-2 border-b">
                <button
                    onClick={() => { setAppealType('feedback'); setCurrentPage(1); }}
                    className={`flex items-center gap-2 px-4 py-3 font-medium transition-colors border-b-2 -mb-px ${appealType === 'feedback'
                        ? 'text-amber-600 border-amber-600'
                        : 'text-muted-foreground border-transparent hover:text-foreground'
                        }`}
                >
                    <MessageSquare className="h-4 w-4" />
                    Seller Feedback
                </button>
                <button
                    onClick={() => { setAppealType('review'); setCurrentPage(1); }}
                    className={`flex items-center gap-2 px-4 py-3 font-medium transition-colors border-b-2 -mb-px ${appealType === 'review'
                        ? 'text-purple-600 border-purple-600'
                        : 'text-muted-foreground border-transparent hover:text-foreground'
                        }`}
                >
                    <Star className="h-4 w-4" />
                    Product Reviews
                </button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <button
                    onClick={() => { setStatusFilter('PENDING'); setCurrentPage(1); }}
                    className={`bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4 text-left hover:ring-2 hover:ring-yellow-400 transition-all ${statusFilter === 'PENDING' ? 'ring-2 ring-yellow-400' : ''}`}
                >
                    <p className="text-2xl font-bold text-yellow-800 dark:text-yellow-400">{pendingCount.toLocaleString()}</p>
                    <p className="text-sm text-yellow-600 dark:text-yellow-500">Pending Review</p>
                </button>
                <button
                    onClick={() => { setStatusFilter('RESUBMIT'); setCurrentPage(1); }}
                    className={`bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg p-4 text-left hover:ring-2 hover:ring-orange-400 transition-all ${statusFilter === 'RESUBMIT' ? 'ring-2 ring-orange-400' : ''}`}
                >
                    <p className="text-2xl font-bold text-orange-800 dark:text-orange-400">{resubmitCount.toLocaleString()}</p>
                    <p className="text-sm text-orange-600 dark:text-orange-500">Awaiting Resubmit</p>
                </button>
                <button
                    onClick={() => { setStatusFilter('APPROVED'); setCurrentPage(1); }}
                    className={`bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4 text-left hover:ring-2 hover:ring-green-400 transition-all ${statusFilter === 'APPROVED' ? 'ring-2 ring-green-400' : ''}`}
                >
                    <p className="text-2xl font-bold text-green-800 dark:text-green-400">{approvedCount.toLocaleString()}</p>
                    <p className="text-sm text-green-600 dark:text-green-500">Approved</p>
                </button>
                <button
                    onClick={() => { setStatusFilter('REJECTED'); setCurrentPage(1); }}
                    className={`bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 text-left hover:ring-2 hover:ring-red-400 transition-all ${statusFilter === 'REJECTED' ? 'ring-2 ring-red-400' : ''}`}
                >
                    <p className="text-2xl font-bold text-red-800 dark:text-red-400">{rejectedCount.toLocaleString()}</p>
                    <p className="text-sm text-red-600 dark:text-red-500">Rejected</p>
                </button>
            </div>

            {/* Search */}
            <form onSubmit={handleSearch} className="flex flex-col md:flex-row gap-4">
                <div className="relative flex-1">
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
                {statusFilter !== 'all' && (
                    <button
                        type="button"
                        onClick={() => { setStatusFilter('all'); setCurrentPage(1); }}
                        className="px-4 py-2 border rounded-lg hover:bg-accent"
                    >
                        Clear Filter
                    </button>
                )}
            </form>

            {/* Table */}
            <div className="bg-card border rounded-lg overflow-hidden">
                {isLoading ? (
                    <div className="p-8 text-center">
                        <Loader2 className="h-8 w-8 animate-spin mx-auto text-muted-foreground" />
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-muted/50">
                                <tr>
                                    <th className="px-4 py-3 text-left text-sm font-medium">Order ID</th>
                                    <th className="px-4 py-3 text-left text-sm font-medium">Phone</th>
                                    <th className="px-4 py-3 text-left text-sm font-medium">Status</th>
                                    <th className="px-4 py-3 text-left text-sm font-medium">Refund</th>
                                    <th className="px-4 py-3 text-left text-sm font-medium">Screenshot</th>
                                    <th className="px-4 py-3 text-left text-sm font-medium">Reminders</th>
                                    <th className="px-4 py-3 text-left text-sm font-medium">Date</th>
                                    <th className="px-4 py-3 text-left text-sm font-medium">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y">
                                {appeals.map((appeal) => (
                                    <tr key={appeal.id} className="hover:bg-muted/30">
                                        <td className="px-4 py-3 font-mono text-sm">{appeal.order_id}</td>
                                        <td className="px-4 py-3 text-sm">{appeal.phone || '-'}</td>
                                        <td className="px-4 py-3">{getStatusBadge(appeal.status)}</td>
                                        <td className="px-4 py-3">{getRefundBadge(appeal.refund_type, appeal.partial_amount)}</td>
                                        <td className="px-4 py-3">
                                            {appeal.screenshot_url ? (
                                                <a href={appeal.screenshot_url} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline flex items-center gap-1">
                                                    <ExternalLink className="h-3 w-3" /> View
                                                </a>
                                            ) : <span className="text-muted-foreground text-sm">Not submitted</span>}
                                        </td>
                                        <td className="px-4 py-3 text-sm">{appeal.reminder_count}/3</td>
                                        <td className="px-4 py-3 text-sm text-muted-foreground">
                                            {formatDate(appeal.submitted_at || appeal.created_at)}
                                        </td>
                                        <td className="px-4 py-3">
                                            <button
                                                onClick={() => viewDetails(appeal)}
                                                className="text-primary hover:text-primary/80 transition-colors"
                                                title="View Details"
                                            >
                                                <Eye className="h-4 w-4" />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>

                        {appeals.length === 0 && (
                            <div className="p-8 text-center text-muted-foreground">
                                No feedback appeals found
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
                <div className="flex items-center justify-between">
                    <p className="text-sm text-muted-foreground">
                        Showing {((currentPage - 1) * pageSize) + 1} to {Math.min(currentPage * pageSize, totalCount)} of {totalCount.toLocaleString()}
                    </p>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                            disabled={currentPage === 1}
                            className="p-2 border rounded-lg hover:bg-accent disabled:opacity-50"
                        >
                            <ChevronLeft className="h-4 w-4" />
                        </button>
                        <span className="px-3 py-2 text-sm">Page {currentPage} of {totalPages}</span>
                        <button
                            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                            disabled={currentPage === totalPages}
                            className="p-2 border rounded-lg hover:bg-accent disabled:opacity-50"
                        >
                            <ChevronRight className="h-4 w-4" />
                        </button>
                    </div>
                </div>
            )}

            {/* Details Modal */}
            {isModalOpen && selectedAppeal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center">
                    <div className="absolute inset-0 bg-black/50" onClick={closeModal} />
                    <div className="relative bg-card border rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto m-4">
                        <div className="sticky top-0 bg-card border-b px-6 py-4 flex items-center justify-between">
                            <h2 className="text-xl font-bold">Appeal Details</h2>
                            <button onClick={closeModal} className="p-2 hover:bg-muted rounded-full">
                                <X className="h-5 w-5" />
                            </button>
                        </div>

                        <div className="p-6 space-y-4">
                            {/* Order ID */}
                            <div className="flex items-center justify-between p-4 bg-muted/30 rounded-lg">
                                <div>
                                    <p className="text-xs text-muted-foreground uppercase">Order ID</p>
                                    <p className="font-mono font-medium">{selectedAppeal.order_id}</p>
                                </div>
                                {getStatusBadge(selectedAppeal.status)}
                            </div>

                            {/* Phone & Refund */}
                            <div className="grid grid-cols-2 gap-4">
                                <div className="p-4 bg-muted/30 rounded-lg">
                                    <p className="text-xs text-muted-foreground uppercase flex items-center gap-1"><Phone className="h-3 w-3" /> Phone</p>
                                    <p className="font-medium">{selectedAppeal.phone || 'Not provided'}</p>
                                </div>
                                <div className="p-4 bg-muted/30 rounded-lg">
                                    <p className="text-xs text-muted-foreground uppercase flex items-center gap-1"><IndianRupee className="h-3 w-3" /> Refund Request</p>
                                    <div className="font-medium mt-1">{getRefundBadge(selectedAppeal.refund_type, selectedAppeal.partial_amount)}</div>
                                </div>
                            </div>

                            {/* Screenshot */}
                            <div className="p-4 bg-muted/30 rounded-lg">
                                <p className="text-xs text-muted-foreground uppercase flex items-center gap-1 mb-2"><ImageIcon className="h-3 w-3" /> Screenshot</p>
                                {selectedAppeal.screenshot_url ? (
                                    <div className="relative">
                                        <Image
                                            src={selectedAppeal.screenshot_url}
                                            alt="Feedback removal proof"
                                            width={600}
                                            height={400}
                                            className="w-full h-64 object-contain bg-gray-100 rounded-lg"
                                        />
                                        <a
                                            href={selectedAppeal.screenshot_url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="absolute top-2 right-2 bg-black/50 text-white px-2 py-1 rounded text-xs"
                                        >
                                            Open Full Size
                                        </a>
                                    </div>
                                ) : (
                                    <p className="text-muted-foreground italic">Customer has not submitted a screenshot yet</p>
                                )}
                            </div>

                            {/* Reminders */}
                            <div className="grid grid-cols-2 gap-4">
                                <div className="p-4 bg-muted/30 rounded-lg">
                                    <p className="text-xs text-muted-foreground uppercase">Reminders Sent</p>
                                    <p className="font-medium">{selectedAppeal.reminder_count} / 3</p>
                                </div>
                                <div className="p-4 bg-muted/30 rounded-lg">
                                    <p className="text-xs text-muted-foreground uppercase">Last Reminder</p>
                                    <p className="font-medium text-sm">{formatDate(selectedAppeal.last_reminder_at)}</p>
                                </div>
                            </div>

                            {/* Timestamps */}
                            <div className="grid grid-cols-2 gap-4">
                                <div className="p-4 bg-muted/30 rounded-lg">
                                    <p className="text-xs text-muted-foreground uppercase flex items-center gap-1"><Calendar className="h-3 w-3" /> Submitted</p>
                                    <p className="font-medium text-sm">{formatDate(selectedAppeal.submitted_at)}</p>
                                </div>
                                <div className="p-4 bg-muted/30 rounded-lg">
                                    <p className="text-xs text-muted-foreground uppercase flex items-center gap-1"><Calendar className="h-3 w-3" /> Reviewed</p>
                                    <p className="font-medium text-sm">{formatDate(selectedAppeal.reviewed_at)}</p>
                                </div>
                            </div>

                            {/* WhatsApp History */}
                            <div className="p-4 bg-muted/30 rounded-lg">
                                <div className="flex items-center justify-between mb-3">
                                    <p className="text-xs text-muted-foreground uppercase flex items-center gap-1">
                                        <Send className="h-3 w-3" /> WhatsApp Messages
                                    </p>
                                    <button
                                        onClick={() => fetchWhatsAppLogs(selectedAppeal.order_id)}
                                        className="text-xs text-primary hover:underline flex items-center gap-1"
                                        disabled={isLoadingLogs}
                                    >
                                        {isLoadingLogs ? <Loader2 className="h-3 w-3 animate-spin" /> : <RefreshCw className="h-3 w-3" />}
                                        Refresh
                                    </button>
                                </div>

                                {isLoadingLogs ? (
                                    <div className="flex items-center justify-center py-4">
                                        <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                                    </div>
                                ) : whatsappLogs.length > 0 ? (
                                    <div className="space-y-2 max-h-40 overflow-y-auto">
                                        {whatsappLogs.map((log) => (
                                            <div key={log.id} className="flex items-center justify-between p-2 bg-background rounded border text-xs">
                                                <div className="flex items-center gap-2">
                                                    {log.status === 'success' ? (
                                                        <CheckCircle className="h-3 w-3 text-green-500" />
                                                    ) : (
                                                        <XCircle className="h-3 w-3 text-red-500" />
                                                    )}
                                                    <span className="font-mono">{log.phone}</span>
                                                    <span className="text-muted-foreground">{log.template_name}</span>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    {log.message_id && (
                                                        <span className="text-xs text-muted-foreground font-mono truncate max-w-[100px]" title={log.message_id}>
                                                            {log.message_id.slice(0, 12)}...
                                                        </span>
                                                    )}
                                                    {log.error_message && (
                                                        <span className="text-red-500 truncate max-w-[100px]" title={log.error_message}>
                                                            {log.error_message}
                                                        </span>
                                                    )}
                                                    <span className="text-muted-foreground">
                                                        {formatDate(log.created_at)}
                                                    </span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <p className="text-muted-foreground text-sm italic py-2">No messages logged yet</p>
                                )}

                                {/* Resend Section */}
                                <div className="mt-3 pt-3 border-t flex gap-2">
                                    <input
                                        type="tel"
                                        value={resendPhone}
                                        onChange={(e) => setResendPhone(e.target.value)}
                                        placeholder="Phone number"
                                        className="flex-1 px-3 py-2 text-sm border rounded-lg bg-background"
                                    />
                                    <button
                                        onClick={handleResend}
                                        disabled={isActionLoading || !resendPhone}
                                        className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 text-sm"
                                    >
                                        {isActionLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                                        Resend
                                    </button>
                                </div>
                            </div>

                            {/* Actions */}
                            {selectedAppeal.status === 'PENDING' && selectedAppeal.screenshot_url && (
                                <div className="flex gap-3 pt-4 border-t">
                                    <button
                                        onClick={() => handleAction('approve', selectedAppeal.order_id)}
                                        disabled={isActionLoading}
                                        className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
                                    >
                                        {isActionLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle className="h-4 w-4" />}
                                        Approve
                                    </button>
                                    <button
                                        onClick={() => handleAction('resubmit', selectedAppeal.order_id)}
                                        disabled={isActionLoading}
                                        className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:opacity-50"
                                    >
                                        {isActionLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
                                        Request Resubmit
                                    </button>
                                    <button
                                        onClick={() => handleAction('reject', selectedAppeal.order_id)}
                                        disabled={isActionLoading}
                                        className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
                                    >
                                        {isActionLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <XCircle className="h-4 w-4" />}
                                        Reject
                                    </button>
                                </div>
                            )}

                            {selectedAppeal.status === 'PENDING' && !selectedAppeal.screenshot_url && (
                                <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                                    <p className="text-yellow-800 text-sm">
                                        <AlertTriangle className="inline h-4 w-4 mr-1" />
                                        Waiting for customer to submit screenshot. {3 - selectedAppeal.reminder_count} reminder(s) remaining.
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Initiate Block Modal */}
            {isInitiateModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center">
                    <div className="absolute inset-0 bg-black/50" onClick={() => setIsInitiateModalOpen(false)} />
                    <div className="relative bg-card border rounded-xl shadow-xl w-full max-w-md m-4">
                        <div className="px-6 py-4 border-b flex items-center justify-between">
                            <h2 className="text-xl font-bold flex items-center gap-2">
                                <Ban className="h-5 w-5 text-red-500" />
                                Block Order for Feedback
                            </h2>
                            <button onClick={() => setIsInitiateModalOpen(false)} className="p-2 hover:bg-muted rounded-full">
                                <X className="h-5 w-5" />
                            </button>
                        </div>

                        <form onSubmit={handleInitiate} className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium mb-1">Order ID *</label>
                                <input
                                    type="text"
                                    value={initiateOrderId}
                                    onChange={(e) => setInitiateOrderId(e.target.value)}
                                    placeholder="e.g., 408-1234567-8901234"
                                    className="w-full px-3 py-2 border rounded-lg bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">Customer Phone *</label>
                                <input
                                    type="tel"
                                    value={initiatePhone}
                                    onChange={(e) => setInitiatePhone(e.target.value)}
                                    placeholder="e.g., 9953999215"
                                    className="w-full px-3 py-2 border rounded-lg bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                                    required
                                />
                            </div>
                            <div className="p-3 bg-amber-900/20 border border-amber-700/50 rounded-lg text-sm">
                                <p className="font-medium mb-1 text-amber-400">This will:</p>
                                <ul className="list-disc list-inside space-y-1 text-amber-300/80">
                                    <li>Set order status to BLOCKED</li>
                                    <li>Send WhatsApp notification to customer</li>
                                    <li>Start 3-reminder sequence</li>
                                </ul>
                            </div>
                            <button
                                type="submit"
                                disabled={isActionLoading}
                                className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
                            >
                                {isActionLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                                Block & Send WhatsApp
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {/* Review Removal Modal */}
            {isReviewRemovalModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center">
                    <div className="absolute inset-0 bg-black/50" onClick={() => setIsReviewRemovalModalOpen(false)} />
                    <div className="relative bg-card border rounded-xl shadow-xl w-full max-w-md m-4">
                        <div className="px-6 py-4 border-b flex items-center justify-between">
                            <h2 className="text-xl font-bold flex items-center gap-2">
                                <Star className="h-5 w-5 text-amber-500" />
                                Request Review Removal
                            </h2>
                            <button onClick={() => setIsReviewRemovalModalOpen(false)} className="p-2 hover:bg-muted rounded-full">
                                <X className="h-5 w-5" />
                            </button>
                        </div>

                        <form onSubmit={handleReviewRemoval} className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium mb-1">Order ID *</label>
                                <input
                                    type="text"
                                    value={reviewRemovalOrderId}
                                    onChange={(e) => setReviewRemovalOrderId(e.target.value)}
                                    placeholder="e.g., 408-1234567-8901234"
                                    className="w-full px-3 py-2 border rounded-lg bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">Customer Phone *</label>
                                <input
                                    type="tel"
                                    value={reviewRemovalPhone}
                                    onChange={(e) => setReviewRemovalPhone(e.target.value)}
                                    placeholder="e.g., 9953999215"
                                    className="w-full px-3 py-2 border rounded-lg bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                                    required
                                />
                            </div>
                            <div className="p-3 bg-amber-900/20 border border-amber-700/50 rounded-lg text-sm">
                                <p className="font-medium mb-1 text-amber-400">This will:</p>
                                <ul className="list-disc list-inside space-y-1 text-amber-300/80">
                                    <li>Set order status to BLOCKED</li>
                                    <li>Send WhatsApp asking customer to remove/modify negative product review</li>
                                </ul>
                            </div>
                            <button
                                type="submit"
                                disabled={isActionLoading}
                                className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-amber-600 text-white rounded-lg hover:bg-amber-700 disabled:opacity-50"
                            >
                                {isActionLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                                Send Review Removal WhatsApp
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
