'use client';

import { useState, useMemo } from 'react';
import { CheckCircle, Clock, Filter, Search, Calendar, X, Package, Send, Loader2, AlertCircle, Eye, Copy, Check } from 'lucide-react';
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
    prefix: string | null;
    first_name: string | null;
    last_name: string | null;
    username_prefix: string | null;
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
    const [generatedEmail, setGeneratedEmail] = useState('');
    const [generatedPassword, setGeneratedPassword] = useState('');
    const [isCompleting, setIsCompleting] = useState(false);
    const [showCompleteModal, setShowCompleteModal] = useState(false);

    // View Customer Data Modal State
    const [showViewModal, setShowViewModal] = useState(false);
    const [viewRequest, setViewRequest] = useState<ProductRequest | null>(null);
    const [copied, setCopied] = useState(false);

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

    // Type badge colors - theme compatible
    const getTypeBadge = (type: string | null) => {
        const displayType = type || 'other';
        const colors: Record<string, string> = {
            autocad: 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400',
            canva: 'bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400',
            '365e5': 'bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-400',
            other: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400'
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
        // Reset generated fields
        setGeneratedEmail('');
        setGeneratedPassword('');
        setShowCompleteModal(true);
    };

    // Generate formatted customer data for copying
    const getFormattedCustomerData = (request: ProductRequest): string => {
        const requestType = request.request_type?.toLowerCase();

        if (requestType === '365e5') {
            // Get product name based on FSN
            const productName = request.fsn?.toUpperCase() || '365E5';
            return `Product Name - ${productName}
First Name - ${request.first_name || '-'}
Last Name - ${request.last_name || '-'}
Username - ${request.username_prefix || '-'}`;
        } else if (requestType === 'autocad') {
            // Determine if 1 year or 3 year based on FSN
            let duration = '1 YEAR';
            if (request.fsn?.toLowerCase().includes('3year')) {
                duration = '3 YEAR';
            }
            return `Product Name - AUTOCAD ${duration}
Email - ${request.email || '-'}`;
        } else if (requestType === 'canva') {
            return `Product Name - CANVA
Email - ${request.email || '-'}`;
        } else {
            return `Product Type - ${request.request_type?.toUpperCase() || 'OTHER'}
Email - ${request.email || '-'}`;
        }
    };

    const handleViewCustomerData = (request: ProductRequest) => {
        setViewRequest(request);
        setCopied(false);
        setShowViewModal(true);
    };

    const handleCopyData = async () => {
        if (!viewRequest) return;

        const data = getFormattedCustomerData(viewRequest);
        try {
            await navigator.clipboard.writeText(data);
            setCopied(true);
            toast.success('Customer data copied to clipboard!');
            setTimeout(() => setCopied(false), 2000);
        } catch (err) {
            toast.error('Failed to copy to clipboard');
        }
    };

    // Quick copy from table row (no modal needed)
    const handleQuickCopy = async (request: ProductRequest) => {
        const data = getFormattedCustomerData(request);
        try {
            await navigator.clipboard.writeText(data);
            toast.success('Copied!');
        } catch (err) {
            toast.error('Failed to copy');
        }
    };

    const handleCompleteRequest = async () => {
        if (!selectedRequest) return;

        // Validation for 365E5
        if (selectedRequest.request_type === '365e5') {
            if (!generatedEmail || !generatedPassword) {
                toast.error('Please enter generated email and password');
                return;
            }
        }

        setIsCompleting(true);
        try {
            const response = await fetch('/api/admin/complete-product-request', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    requestId: selectedRequest.id,
                    subscriptionEmail: subscriptionEmail.trim(),
                    generatedEmail: generatedEmail.trim(),
                    generatedPassword: generatedPassword.trim()
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
            <div className="bg-card border rounded-xl p-4 shadow-sm">
                <div className="flex flex-wrap items-center gap-3">
                    {/* Search */}
                    <div className="relative flex-1 min-w-[200px]">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Search by email, order ID, or phone..."
                            className="w-full pl-10 pr-4 py-2.5 rounded-lg bg-background border text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                        />
                    </div>

                    {/* Status Filter */}
                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value as any)}
                        className="px-4 py-2.5 rounded-lg bg-background border text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                    >
                        <option value="all">All Status</option>
                        <option value="pending">Pending</option>
                        <option value="completed">Completed</option>
                    </select>

                    {/* Type Filter */}
                    <select
                        value={typeFilter}
                        onChange={(e) => setTypeFilter(e.target.value)}
                        className="px-4 py-2.5 rounded-lg bg-background border text-sm focus:outline-none focus:ring-2 focus:ring-primary"
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
                        className="px-4 py-2.5 rounded-lg bg-background border text-sm focus:outline-none focus:ring-2 focus:ring-primary"
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
                            className="flex items-center gap-1.5 px-3 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
                        >
                            <X className="h-4 w-4" />
                            Clear
                        </button>
                    )}
                </div>

                {/* Active Filters Summary */}
                {hasActiveFilters && (
                    <div className="mt-3 pt-3 border-t">
                        <p className="text-sm text-muted-foreground">
                            Showing <span className="font-semibold text-primary">{filteredRequests.length}</span> of {requests.length} requests
                        </p>
                    </div>
                )}
            </div>

            {/* Table */}
            <div className="bg-card border rounded-xl overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-muted/50 border-b">
                            <tr>
                                <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Email</th>
                                <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Order ID</th>
                                <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Type</th>
                                <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">FSN</th>
                                <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Mobile</th>
                                <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Status</th>
                                <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Date</th>
                                <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                            {filteredRequests.map((request) => (
                                <tr
                                    key={request.id}
                                    className="hover:bg-muted/50 transition-colors"
                                >
                                    <td className="px-4 py-3 text-sm font-medium">
                                        {request.email || 'NA'}
                                    </td>
                                    <td className="px-4 py-3 font-mono text-sm text-muted-foreground">
                                        {request.order_id || '-'}
                                    </td>
                                    <td className="px-4 py-3">{getTypeBadge(request.request_type)}</td>
                                    <td className="px-4 py-3">
                                        {request.fsn && (
                                            <span className="px-2 py-1 rounded text-xs font-mono bg-muted text-muted-foreground">
                                                {request.fsn}
                                            </span>
                                        )}
                                    </td>
                                    <td className="px-4 py-3 text-sm text-muted-foreground">
                                        {request.mobile_number || '-'}
                                    </td>
                                    <td className="px-4 py-3">
                                        {request.is_completed ? (
                                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
                                                <CheckCircle className="h-3 w-3" /> Completed
                                            </span>
                                        ) : (
                                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
                                                <Clock className="h-3 w-3" /> Pending
                                            </span>
                                        )}
                                    </td>
                                    <td className="px-4 py-3 text-sm text-muted-foreground">
                                        {new Date(request.created_at).toLocaleDateString('en-IN', {
                                            day: '2-digit',
                                            month: 'short',
                                            year: 'numeric'
                                        })}
                                    </td>
                                    <td className="px-4 py-3">
                                        <div className="flex items-center gap-1.5">
                                            {/* Quick Copy Button */}
                                            <button
                                                onClick={() => handleQuickCopy(request)}
                                                className="inline-flex items-center gap-1 px-2 py-1.5 rounded text-xs font-medium text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20 hover:bg-green-100 dark:hover:bg-green-900/30 transition-colors"
                                                title="Copy customer data"
                                            >
                                                <Copy className="h-3.5 w-3.5" />
                                            </button>

                                            {/* View Customer Data Button */}
                                            <button
                                                onClick={() => handleViewCustomerData(request)}
                                                className="inline-flex items-center gap-1 px-2 py-1.5 rounded text-xs font-medium text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors"
                                                title="View customer data"
                                            >
                                                <Eye className="h-3.5 w-3.5" />
                                            </button>

                                            {/* Complete Button */}
                                            {!request.is_completed ? (
                                                <button
                                                    onClick={() => handleOpenCompleteModal(request)}
                                                    className="inline-flex items-center gap-1 px-2 py-1.5 rounded text-xs font-medium text-primary bg-primary/10 hover:bg-primary/20 transition-colors"
                                                    title="Complete request"
                                                >
                                                    <Send className="h-3.5 w-3.5" />
                                                </button>
                                            ) : (
                                                <span className="text-xs text-green-600 dark:text-green-400">✓</span>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {filteredRequests.length === 0 && (
                    <div className="p-12 text-center">
                        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-muted flex items-center justify-center">
                            <Filter className="h-8 w-8 text-muted-foreground" />
                        </div>
                        <p className="text-muted-foreground font-medium">No requests found</p>
                        <p className="text-sm text-muted-foreground mt-1">Try adjusting your filters</p>
                    </div>
                )}
            </div>

            {/* View Customer Data Modal */}
            {showViewModal && viewRequest && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
                    <div className="bg-card border rounded-xl shadow-2xl w-full max-w-md overflow-hidden">
                        <div className="p-4 border-b flex items-center justify-between">
                            <h3 className="text-lg font-bold flex items-center gap-2">
                                <Eye className="h-5 w-5 text-primary" />
                                Customer Data
                            </h3>
                            <button
                                onClick={() => setShowViewModal(false)}
                                className="p-1 hover:bg-muted rounded transition-colors"
                            >
                                <X className="h-5 w-5" />
                            </button>
                        </div>

                        <div className="p-4">
                            <div className="bg-muted rounded-lg p-4 font-mono text-sm whitespace-pre-wrap">
                                {getFormattedCustomerData(viewRequest)}
                            </div>

                            <button
                                onClick={handleCopyData}
                                className={`mt-4 w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg font-medium transition-all ${copied
                                    ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                                    : 'bg-primary text-primary-foreground hover:bg-primary/90'
                                    }`}
                            >
                                {copied ? (
                                    <>
                                        <Check className="h-4 w-4" />
                                        Copied!
                                    </>
                                ) : (
                                    <>
                                        <Copy className="h-4 w-4" />
                                        Copy to Clipboard
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Completion Modal */}
            {showCompleteModal && selectedRequest && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                    <div className="bg-slate-800 border border-slate-700 rounded-xl shadow-2xl w-full max-w-md overflow-hidden">
                        <div className="p-6 border-b border-slate-700">
                            <h3 className="text-lg font-bold text-white flex items-center gap-2">
                                <CheckCircle className="h-5 w-5 text-indigo-400" />
                                Complete Request
                            </h3>
                            <p className="text-sm text-slate-400 mt-1">
                                Order: <span className="font-mono text-slate-300">{selectedRequest.order_id || 'N/A'}</span>
                            </p>
                        </div>

                        <div className="p-6 space-y-4">
                            <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-4">
                                <div className="flex items-start gap-3">
                                    <AlertCircle className="h-5 w-5 text-amber-400 shrink-0 mt-0.5" />
                                    <div className="text-sm text-amber-200">
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
                                <label className="block text-sm font-medium text-slate-300 mb-1.5">
                                    Subscription Email
                                </label>
                                <input
                                    type="email"
                                    value={subscriptionEmail}
                                    onChange={(e) => setSubscriptionEmail(e.target.value)}
                                    className="w-full px-3 py-2 rounded-lg border border-slate-600 bg-slate-900/50 text-white placeholder:text-slate-500 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                                    placeholder="email@example.com"
                                />
                                <p className="text-xs text-slate-500 mt-1">
                                    The email where the subscription was activated (sent in notification)
                                </p>
                            </div>

                            {selectedRequest.request_type === '365e5' && (
                                <div className="space-y-4 pt-4 border-t border-slate-700">
                                    <div className="bg-sky-500/10 border border-sky-500/30 rounded-lg p-3">
                                        <p className="text-sm text-sky-300 font-medium">
                                            Microsoft 365 Credentials Required
                                        </p>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-slate-300 mb-1.5">
                                            Generated Email
                                        </label>
                                        <input
                                            type="email"
                                            value={generatedEmail}
                                            onChange={(e) => setGeneratedEmail(e.target.value)}
                                            className="w-full px-3 py-2 rounded-lg border border-slate-600 bg-slate-900/50 text-white placeholder:text-slate-500 focus:ring-2 focus:ring-indigo-500 focus:outline-none font-mono"
                                            placeholder="username@tenant.onmicrosoft.com"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-slate-300 mb-1.5">
                                            Generated Password
                                        </label>
                                        <input
                                            type="text"
                                            value={generatedPassword}
                                            onChange={(e) => setGeneratedPassword(e.target.value)}
                                            className="w-full px-3 py-2 rounded-lg border border-slate-600 bg-slate-900/50 text-white placeholder:text-slate-500 focus:ring-2 focus:ring-indigo-500 focus:outline-none font-mono"
                                            placeholder="Temporary Password"
                                        />
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="p-4 bg-slate-900/50 border-t border-slate-700 flex justify-end gap-3">
                            <button
                                onClick={() => setShowCompleteModal(false)}
                                disabled={isCompleting}
                                className="px-4 py-2 text-sm font-medium text-slate-400 hover:text-white disabled:opacity-50 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleCompleteRequest}
                                disabled={isCompleting}
                                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium shadow-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
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
