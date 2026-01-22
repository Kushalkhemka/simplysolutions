'use client';

import { useState, useMemo } from 'react';
import { CheckCircle, Clock, Mail, Filter, Search, Calendar, X, Package, Send, Loader2, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';

interface ProductRequest {
    id: string;
    email: string;
    order_id: string | null;
    request_type: string | null;
    fsn: string | null;
    mobile_number: string | null;
    is_completed: boolean;
    created_at: string;
}

interface RequestsClientProps {
    requests: ProductRequest[];
    totalCount: number;
}

export default function RequestsClient({ requests: initialRequests, totalCount }: RequestsClientProps) {
    const router = useRouter();
    const [requests, setRequests] = useState(initialRequests);

    // Completion Modal State
    const [selectedRequest, setSelectedRequest] = useState<ProductRequest | null>(null);
    const [subscriptionEmail, setSubscriptionEmail] = useState('');
    const [isCompleting, setIsCompleting] = useState(false);
    const [showCompleteModal, setShowCompleteModal] = useState(false);

    // Filter states
    const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'completed'>('all');
    const [typeFilter, setTypeFilter] = useState<string>('all');
    const [searchQuery, setSearchQuery] = useState('');
    const [dateFilter, setDateFilter] = useState<'all' | 'today' | 'week' | 'month'>('all');

    // Get unique types
    const types = useMemo(() => {
        const uniqueTypes = new Set(requests.map(r => r.request_type || 'other'));
        return Array.from(uniqueTypes);
    }, [requests]);

    // Filtered requests
    const filteredRequests = useMemo(() => {
        return requests.filter(request => {
            // Status filter
            if (statusFilter === 'pending' && request.is_completed) return false;
            if (statusFilter === 'completed' && !request.is_completed) return false;

            // Type filter
            if (typeFilter !== 'all') {
                const requestType = request.request_type || 'other';
                if (requestType !== typeFilter) return false;
            }

            // Search filter
            if (searchQuery) {
                const query = searchQuery.toLowerCase();
                const matchEmail = request.email?.toLowerCase().includes(query);
                const matchOrderId = request.order_id?.toLowerCase().includes(query);
                const matchMobile = request.mobile_number?.includes(query);
                if (!matchEmail && !matchOrderId && !matchMobile) return false;
            }

            // Date filter
            if (dateFilter !== 'all') {
                const requestDate = new Date(request.created_at);
                const now = new Date();
                const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

                if (dateFilter === 'today') {
                    if (requestDate < today) return false;
                } else if (dateFilter === 'week') {
                    const weekAgo = new Date(today);
                    weekAgo.setDate(weekAgo.getDate() - 7);
                    if (requestDate < weekAgo) return false;
                } else if (dateFilter === 'month') {
                    const monthAgo = new Date(today);
                    monthAgo.setMonth(monthAgo.getMonth() - 1);
                    if (requestDate < monthAgo) return false;
                }
            }

            return true;
        });
    }, [requests, statusFilter, typeFilter, searchQuery, dateFilter]);

    // Stats
    const stats = useMemo(() => ({
        pending: requests.filter(r => !r.is_completed).length,
        completed: requests.filter(r => r.is_completed).length,
        autocad: requests.filter(r => r.request_type === 'autocad').length,
        canva: requests.filter(r => r.request_type === 'canva').length,
        office365: requests.filter(r => r.request_type === '365e5').length,
    }), [requests]);

    const clearFilters = () => {
        setStatusFilter('all');
        setTypeFilter('all');
        setSearchQuery('');
        setDateFilter('all');
    };

    const hasActiveFilters = statusFilter !== 'all' || typeFilter !== 'all' || searchQuery || dateFilter !== 'all';

    // Consistent color scheme - using slate/indigo theme
    const getTypeBadge = (type: string | null) => {
        const displayType = type || 'other';
        const colors: Record<string, string> = {
            autocad: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20',
            canva: 'bg-violet-500/10 text-violet-600 dark:text-violet-400 border border-violet-500/20',
            '365e5': 'bg-sky-500/10 text-sky-600 dark:text-sky-400 border border-sky-500/20',
            other: 'bg-slate-500/10 text-slate-600 dark:text-slate-400 border border-slate-500/20'
        };
        return (
            <span className={`px-2.5 py-1 rounded-md text-xs font-semibold ${colors[displayType] || colors.other}`}>
                {displayType.toUpperCase()}
            </span>
        );
    };

    const handleOpenCompleteModal = (request: ProductRequest) => {
        setSelectedRequest(request);
        setSubscriptionEmail(request.email);
        setShowCompleteModal(true);
    };

    const handleCompleteRequest = async () => {
        if (!selectedRequest) return;

        setIsCompleting(true);
        try {
            const response = await fetch('/api/admin/complete-product-request', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    requestId: selectedRequest.id,
                    subscriptionEmail: subscriptionEmail.trim()
                }),
            });

            const data = await response.json();

            if (data.success) {
                toast.success(data.message);

                // Update local state
                setRequests(prev => prev.map(r =>
                    r.id === selectedRequest.id
                        ? { ...r, is_completed: true }
                        : r
                ));

                setShowCompleteModal(false);
                setSelectedRequest(null);

                // Refresh data to ensure sync
                router.refresh();
            } else {
                toast.error(data.error || 'Failed to complete request');
            }
        } catch (error) {
            console.error('Completion error:', error);
            toast.error('Failed to process request');
        } finally {
            setIsCompleting(false);
        }
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Product Requests</h1>
                    <p className="text-slate-500 dark:text-slate-400">
                        Manage subscription product requests ({totalCount.toLocaleString()} total)
                    </p>
                </div>
            </div>

            {/* Stats Cards - Cohesive gradient design */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                <button
                    onClick={() => setStatusFilter(statusFilter === 'pending' ? 'all' : 'pending')}
                    className={`relative overflow-hidden rounded-xl p-4 text-left transition-all ${statusFilter === 'pending'
                        ? 'ring-2 ring-amber-500 ring-offset-2 dark:ring-offset-slate-900'
                        : 'hover:scale-[1.02]'
                        }`}
                    style={{ background: 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)' }}
                >
                    <div className="absolute top-0 right-0 w-16 h-16 -mr-4 -mt-4 bg-amber-300/30 rounded-full blur-2xl" />
                    <Clock className="h-5 w-5 text-amber-600 mb-2" />
                    <p className="text-2xl font-bold text-amber-900">{stats.pending}</p>
                    <p className="text-sm text-amber-700 font-medium">Pending</p>
                </button>

                <button
                    onClick={() => setStatusFilter(statusFilter === 'completed' ? 'all' : 'completed')}
                    className={`relative overflow-hidden rounded-xl p-4 text-left transition-all ${statusFilter === 'completed'
                        ? 'ring-2 ring-emerald-500 ring-offset-2 dark:ring-offset-slate-900'
                        : 'hover:scale-[1.02]'
                        }`}
                    style={{ background: 'linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%)' }}
                >
                    <div className="absolute top-0 right-0 w-16 h-16 -mr-4 -mt-4 bg-emerald-300/30 rounded-full blur-2xl" />
                    <CheckCircle className="h-5 w-5 text-emerald-600 mb-2" />
                    <p className="text-2xl font-bold text-emerald-900">{stats.completed}</p>
                    <p className="text-sm text-emerald-700 font-medium">Completed</p>
                </button>

                <button
                    onClick={() => setTypeFilter(typeFilter === 'autocad' ? 'all' : 'autocad')}
                    className={`relative overflow-hidden rounded-xl p-4 text-left transition-all ${typeFilter === 'autocad'
                        ? 'ring-2 ring-rose-500 ring-offset-2 dark:ring-offset-slate-900'
                        : 'hover:scale-[1.02]'
                        }`}
                    style={{ background: 'linear-gradient(135deg, #ffe4e6 0%, #fecdd3 100%)' }}
                >
                    <div className="absolute top-0 right-0 w-16 h-16 -mr-4 -mt-4 bg-rose-300/30 rounded-full blur-2xl" />
                    <Package className="h-5 w-5 text-rose-600 mb-2" />
                    <p className="text-2xl font-bold text-rose-900">{stats.autocad}</p>
                    <p className="text-sm text-rose-700 font-medium">AutoCAD</p>
                </button>

                <button
                    onClick={() => setTypeFilter(typeFilter === 'canva' ? 'all' : 'canva')}
                    className={`relative overflow-hidden rounded-xl p-4 text-left transition-all ${typeFilter === 'canva'
                        ? 'ring-2 ring-violet-500 ring-offset-2 dark:ring-offset-slate-900'
                        : 'hover:scale-[1.02]'
                        }`}
                    style={{ background: 'linear-gradient(135deg, #ede9fe 0%, #ddd6fe 100%)' }}
                >
                    <div className="absolute top-0 right-0 w-16 h-16 -mr-4 -mt-4 bg-violet-300/30 rounded-full blur-2xl" />
                    <Package className="h-5 w-5 text-violet-600 mb-2" />
                    <p className="text-2xl font-bold text-violet-900">{stats.canva}</p>
                    <p className="text-sm text-violet-700 font-medium">Canva</p>
                </button>

                <button
                    onClick={() => setTypeFilter(typeFilter === '365e5' ? 'all' : '365e5')}
                    className={`relative overflow-hidden rounded-xl p-4 text-left transition-all ${typeFilter === '365e5'
                        ? 'ring-2 ring-sky-500 ring-offset-2 dark:ring-offset-slate-900'
                        : 'hover:scale-[1.02]'
                        }`}
                    style={{ background: 'linear-gradient(135deg, #e0f2fe 0%, #bae6fd 100%)' }}
                >
                    <div className="absolute top-0 right-0 w-16 h-16 -mr-4 -mt-4 bg-sky-300/30 rounded-full blur-2xl" />
                    <Package className="h-5 w-5 text-sky-600 mb-2" />
                    <p className="text-2xl font-bold text-sky-900">{stats.office365}</p>
                    <p className="text-sm text-sky-700 font-medium">Office 365</p>
                </button>
            </div>

            {/* Filters Bar */}
            <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-4 shadow-sm">
                <div className="flex flex-wrap items-center gap-3">
                    {/* Search */}
                    <div className="relative flex-1 min-w-[200px]">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Search by email, order ID, or phone..."
                            className="w-full pl-10 pr-4 py-2.5 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-600 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                        />
                    </div>

                    {/* Status Filter */}
                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value as any)}
                        className="px-4 py-2.5 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-600 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                        <option value="all">All Status</option>
                        <option value="pending">Pending</option>
                        <option value="completed">Completed</option>
                    </select>

                    {/* Type Filter */}
                    <select
                        value={typeFilter}
                        onChange={(e) => setTypeFilter(e.target.value)}
                        className="px-4 py-2.5 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-600 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                        <option value="all">All Types</option>
                        {types.map(type => (
                            <option key={type} value={type}>{type.toUpperCase()}</option>
                        ))}
                    </select>

                    {/* Date Filter */}
                    <select
                        value={dateFilter}
                        onChange={(e) => setDateFilter(e.target.value as any)}
                        className="px-4 py-2.5 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-600 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                        <option value="all">All Time</option>
                        <option value="today">Today</option>
                        <option value="week">Last 7 Days</option>
                        <option value="month">Last 30 Days</option>
                    </select>

                    {/* Clear Filters */}
                    {hasActiveFilters && (
                        <button
                            onClick={clearFilters}
                            className="flex items-center gap-1.5 px-3 py-2 text-sm text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
                        >
                            <X className="h-4 w-4" />
                            Clear
                        </button>
                    )}
                </div>

                {/* Active Filters Summary */}
                {hasActiveFilters && (
                    <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-700">
                        <p className="text-sm text-slate-600 dark:text-slate-400">
                            Showing <span className="font-semibold text-indigo-600 dark:text-indigo-400">{filteredRequests.length}</span> of {requests.length} requests
                        </p>
                    </div>
                )}
            </div>

            {/* Table */}
            <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden shadow-sm">
                <table className="w-full">
                    <thead className="bg-slate-50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-700">
                        <tr>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Email</th>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Order ID</th>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Type</th>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">FSN</th>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Mobile</th>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Status</th>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Date</th>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                        {filteredRequests.map((request) => (
                            <tr
                                key={request.id}
                                className={`hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors ${!request.is_completed ? 'bg-amber-50/30 dark:bg-amber-900/10' : ''
                                    }`}
                            >
                                <td className="px-4 py-3.5 text-sm text-slate-900 dark:text-slate-100 font-medium">
                                    {request.email || 'NA'}
                                </td>
                                <td className="px-4 py-3.5 font-mono text-sm text-slate-600 dark:text-slate-300">
                                    {request.order_id || '-'}
                                </td>
                                <td className="px-4 py-3.5">{getTypeBadge(request.request_type)}</td>
                                <td className="px-4 py-3.5">
                                    {request.fsn && (
                                        <span className="px-2 py-1 rounded text-xs font-mono bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
                                            {request.fsn}
                                        </span>
                                    )}
                                </td>
                                <td className="px-4 py-3.5 text-sm text-slate-600 dark:text-slate-300">
                                    {request.mobile_number || '-'}
                                </td>
                                <td className="px-4 py-3.5">
                                    {request.is_completed ? (
                                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                                            <CheckCircle className="h-3 w-3" /> Completed
                                        </span>
                                    ) : (
                                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                                            <Clock className="h-3 w-3" /> Pending
                                        </span>
                                    )}
                                </td>
                                <td className="px-4 py-3.5 text-sm text-slate-500 dark:text-slate-400">
                                    {new Date(request.created_at).toLocaleDateString('en-IN', {
                                        day: '2-digit',
                                        month: 'short',
                                        year: 'numeric'
                                    })}
                                </td>
                                <td className="px-4 py-3.5">
                                    <div className="flex items-center gap-2">
                                        <a
                                            href={`mailto:${request.email}`}
                                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                                            title="Send Email"
                                        >
                                            <Mail className="h-4 w-4" />
                                        </a>

                                        {!request.is_completed && (
                                            <button
                                                onClick={() => handleOpenCompleteModal(request)}
                                                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/30 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 transition-colors"
                                                title="Complete Request & Send Notification"
                                            >
                                                <Send className="h-4 w-4" /> Complete
                                            </button>
                                        )}
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>

                {filteredRequests.length === 0 && (
                    <div className="p-12 text-center">
                        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center">
                            <Filter className="h-8 w-8 text-slate-400" />
                        </div>
                        <p className="text-slate-500 dark:text-slate-400 font-medium">No requests found</p>
                        <p className="text-sm text-slate-400 dark:text-slate-500 mt-1">Try adjusting your filters</p>
                    </div>
                )}
            </div>

            {/* Completion Modal */}
            {showCompleteModal && selectedRequest && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                    <div className="bg-white dark:bg-slate-800 rounded-xl shadow-xl w-full max-w-md overflow-hidden">
                        <div className="p-6 border-b border-slate-200 dark:border-slate-700">
                            <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                                <CheckCircle className="h-5 w-5 text-indigo-500" />
                                Complete Request
                            </h3>
                            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                                Order: <span className="font-mono">{selectedRequest.order_id || 'N/A'}</span>
                            </p>
                        </div>

                        <div className="p-6 space-y-4">
                            <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-900/30 rounded-lg p-4">
                                <div className="flex items-start gap-3">
                                    <AlertCircle className="h-5 w-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                                    <div className="text-sm text-amber-800 dark:text-amber-200">
                                        <p className="font-medium">Action Summary:</p>
                                        <ul className="list-disc ml-4 mt-1 space-y-1 opacity-90">
                                            <li>Mark request as completed</li>
                                            <li>Update Amazon Order with "Subscription processed"</li>
                                            <li>Send confirmation email to customer</li>
                                        </ul>
                                    </div>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                                    Subscription Email
                                </label>
                                <input
                                    type="email"
                                    value={subscriptionEmail}
                                    onChange={(e) => setSubscriptionEmail(e.target.value)}
                                    className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                                    placeholder="email@example.com"
                                />
                                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                                    The email where the subscription was activated (sent in notification)
                                </p>
                            </div>
                        </div>

                        <div className="p-4 bg-slate-50 dark:bg-slate-900/50 flex justify-end gap-3">
                            <button
                                onClick={() => setShowCompleteModal(false)}
                                disabled={isCompleting}
                                className="px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white disabled:opacity-50"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleCompleteRequest}
                                disabled={isCompleting}
                                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium shadow-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isCompleting ? (
                                    <>
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                        Processing...
                                    </>
                                ) : (
                                    <>
                                        <Send className="h-4 w-4" />
                                        Complete & Send Email
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
