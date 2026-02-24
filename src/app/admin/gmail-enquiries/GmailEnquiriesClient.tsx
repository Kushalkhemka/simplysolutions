'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import {
    Search, RefreshCw, Loader2, Mail, Send, Eye, X,
    MessageSquare, Truck, Ban, AlertTriangle, HelpCircle,
    Sparkles, Copy, Check, ChevronDown, Clock, Inbox,
    Plus, Trash2, Settings, Power, ChevronUp,
    Filter, ArrowUpDown, CalendarDays, MailOpen, CheckCircle2,
    CheckSquare, Square, MailCheck
} from 'lucide-react';
import { toast } from 'sonner';

// ─── Types ──────────────────────────────────────────────────────────

interface GmailEnquiry {
    id: string;
    threadId: string;
    messageId: string;
    from: string;
    to: string;
    subject: string;
    date: string;
    snippet: string;
    body: string;
    labels: string[];
    customerName: string;
    orderId: string;
    product: string;
    returnRequested: string;
    reason: string;
    category: 'delivery' | 'refund' | 'product_claim' | 'tech_support' | 'other';
    aiSuggestedReply?: string;
    aiTemplateUsed?: string;
    isReplied?: boolean;
    repliedAt?: string;
    accountEmail?: string;
}

interface ThreadMessage {
    id: string;
    threadId: string;
    messageId: string;
    from: string;
    to: string;
    subject: string;
    date: string;
    body: string;
    isSent: boolean;
}

interface GmailAccount {
    id: string;
    email: string;
    label: string;
    is_active: boolean;
    last_synced_at: string | null;
    created_at: string;
}

// ─── Templates ──────────────────────────────────────────────────────

const TEMPLATES: Record<string, { name: string; body: string }> = {
    tech_support: {
        name: '🔧 Tech Support',
        body: `Dear [BUYER_NAME],

For quick assistance with this issue, please contact our technical support team on WhatsApp at 8178848830 (messages only; calls are not supported).

Our WhatsApp support includes automated chatbot assistance for instant replies, followed by manual support from our technical team if required. You may also request your license directly from technical support through this channel.

Additionally, you can find the email copy shared with you in Amazon Buyer–Seller Messaging at amazon.in/message for installation/activation instructions. If the issue persists, you may share the error screenshot via Amazon Buyer–Seller Messaging, and our team will review and respond accordingly.

Thank you for your cooperation.
CODEKEYS`,
    },
    delivery: {
        name: '📦 Delivery',
        body: `Dear [BUYER_NAME],

We would like to inform you that your order has been successfully delivered to your Amazon-registered email address within 1 hour of your purchase time. You can also access a copy of the same by visiting Amazon Messaging Center at amazon.in/msg 

Thanks & Regards
CODEKEYS`,
    },
    cancellation: {
        name: '🚫 Cancellation',
        body: `Dear [BUYER_NAME],

Thank you for contacting us regarding your order [ORDER_ID].

We would like to clearly inform you that this order was successfully delivered via Digital Delivery. As this product falls under the software category, cancellations or refunds are strictly not permitted once delivery is completed, in accordance with Amazon's Policies and Guidelines. 

Please note that all software products are non-returnable, non-refundable, and non-cancellable after delivery, irrespective of usage status or activation.

If you are experiencing any technical issues, activation errors, or installation difficulties, you may contact our technical support team on WhatsApp at 8178848830 (messages only; calls are not supported). Our support team will assist you with troubleshooting and activation guidance.

We appreciate your understanding and cooperation.

Regards,
CODEKEYS`,
    },
};

// ─── Component ──────────────────────────────────────────────────────

export default function GmailEnquiriesClient() {
    const [enquiries, setEnquiries] = useState<GmailEnquiry[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    // Filters
    const [searchQuery, setSearchQuery] = useState('');
    const [categoryFilter, setCategoryFilter] = useState<string>('all');
    const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'replied'>('all');
    const [readFilter, setReadFilter] = useState<'all' | 'unread' | 'read'>('all');
    const [dateFilter, setDateFilter] = useState<'all' | 'today' | '7days' | '30days'>('all');
    const [accountFilter, setAccountFilter] = useState<string>('all');
    const [sortOrder, setSortOrder] = useState<'newest' | 'oldest'>('newest');

    // Reply Modal
    const [selectedEnquiry, setSelectedEnquiry] = useState<GmailEnquiry | null>(null);
    const [threadMessages, setThreadMessages] = useState<ThreadMessage[]>([]);
    const [loadingThread, setLoadingThread] = useState(false);
    const [replyText, setReplyText] = useState('');
    const [sendingReply, setSendingReply] = useState(false);
    const [generatingAI, setGeneratingAI] = useState(false);
    const [selectedTemplate, setSelectedTemplate] = useState<string>('');
    const [showTemplateDropdown, setShowTemplateDropdown] = useState(false);
    const [copiedReply, setCopiedReply] = useState(false);

    // Selection & Bulk Actions
    const [selectedThreadIds, setSelectedThreadIds] = useState<Set<string>>(new Set());
    const [bulkSending, setBulkSending] = useState(false);
    const [bulkProgress, setBulkProgress] = useState({ current: 0, total: 0 });
    const [markingRead, setMarkingRead] = useState(false);
    const [showBulkTemplateDropdown, setShowBulkTemplateDropdown] = useState(false);

    // Gmail Accounts management
    const [accounts, setAccounts] = useState<GmailAccount[]>([]);
    const [showAccountsPanel, setShowAccountsPanel] = useState(false);
    const [connectingOAuth, setConnectingOAuth] = useState(false);
    const [oauthLabel, setOAuthLabel] = useState('');

    // Handle OAuth redirect
    const searchParams = useSearchParams();
    const router = useRouter();

    useEffect(() => {
        const oauthSuccess = searchParams.get('oauth_success');
        const oauthError = searchParams.get('oauth_error');

        if (oauthSuccess) {
            toast.success(`Gmail account ${oauthSuccess} connected!`);
            setShowAccountsPanel(true);
            router.replace('/admin/gmail-enquiries');
            fetchAccounts();
        } else if (oauthError) {
            toast.error(`OAuth error: ${oauthError}`);
            router.replace('/admin/gmail-enquiries');
        }
    }, [searchParams, router]);

    // Track sent replies (by threadId) — combines DB status + local sends
    const [repliedThreads, setRepliedThreads] = useState<Set<string>>(new Set());

    // Initialize replied threads from DB data
    useEffect(() => {
        const dbReplied = new Set(enquiries.filter(e => e.isReplied).map(e => e.threadId));
        setRepliedThreads(prev => {
            const merged = new Set([...prev, ...dbReplied]);
            return merged;
        });
    }, [enquiries]);

    // ─── Fetch Enquiries ────────────────────────────────────────────

    const fetchEnquiries = useCallback(async (isRefresh = false) => {
        if (isRefresh) setRefreshing(true);
        else setLoading(true);

        try {
            // If refreshing, trigger a live sync from Gmail first
            if (isRefresh) {
                const syncRes = await fetch('/api/cron/sync-gmail', {
                    headers: { 'Authorization': `Bearer ${process.env.NEXT_PUBLIC_CRON_SECRET || 'simplysolutions-cron-2026'}` },
                });
                const syncData = await syncRes.json();
                if (syncData.success) {
                    const newCount = syncData.new || 0;
                    const aiCount = syncData.aiGenerated || 0;
                    toast.success(`Synced! ${newCount} new, ${aiCount} AI replies generated`);
                }
            }

            const res = await fetch('/api/admin/gmail-enquiries');
            const data = await res.json();

            if (data.success) {
                setEnquiries(data.enquiries);
                if (!isRefresh) toast.success(`Loaded ${data.enquiries.length} enquiries`);
            } else {
                toast.error(data.error || 'Failed to fetch enquiries');
            }
        } catch (error) {
            toast.error('Failed to fetch enquiries');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, []);

    const fetchAccounts = useCallback(async () => {
        try {
            const res = await fetch('/api/admin/gmail-accounts');
            const data = await res.json();
            if (data.success) setAccounts(data.accounts);
        } catch { /* non-critical */ }
    }, []);

    useEffect(() => {
        fetchEnquiries();
        fetchAccounts();
    }, [fetchEnquiries, fetchAccounts]);

    // ─── Filtered Enquiries ─────────────────────────────────────────

    // Unique accounts for filter dropdown
    const uniqueAccounts = useMemo(() => {
        const emailSet = new Set<string>();
        for (const e of enquiries) {
            if (e.accountEmail) emailSet.add(e.accountEmail);
        }
        return Array.from(emailSet).sort();
    }, [enquiries]);

    const filteredEnquiries = useMemo(() => {
        // Group by threadId, keep only the latest message per thread
        const threadMap = new Map<string, GmailEnquiry>();
        for (const enquiry of enquiries) {
            const existing = threadMap.get(enquiry.threadId);
            if (!existing || new Date(enquiry.date) > new Date(existing.date)) {
                threadMap.set(enquiry.threadId, enquiry);
            }
        }
        let filtered = Array.from(threadMap.values());

        // Category filter
        if (categoryFilter !== 'all') {
            filtered = filtered.filter(e => e.category === categoryFilter);
        }

        // Status filter (replied / pending)
        if (statusFilter !== 'all') {
            if (statusFilter === 'replied') {
                filtered = filtered.filter(e => repliedThreads.has(e.threadId));
            } else {
                filtered = filtered.filter(e => !repliedThreads.has(e.threadId));
            }
        }

        // Read filter
        if (readFilter !== 'all') {
            if (readFilter === 'unread') {
                filtered = filtered.filter(e => e.labels.includes('UNREAD'));
            } else {
                filtered = filtered.filter(e => !e.labels.includes('UNREAD'));
            }
        }

        // Date filter
        if (dateFilter !== 'all') {
            const now = new Date();
            let cutoff: Date;
            if (dateFilter === 'today') {
                cutoff = new Date(now.getFullYear(), now.getMonth(), now.getDate());
            } else if (dateFilter === '7days') {
                cutoff = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
            } else {
                cutoff = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
            }
            filtered = filtered.filter(e => new Date(e.date) >= cutoff);
        }

        // Account filter
        if (accountFilter !== 'all') {
            filtered = filtered.filter(e => e.accountEmail === accountFilter);
        }

        // Search
        if (searchQuery) {
            const query = searchQuery.toLowerCase();
            filtered = filtered.filter(e =>
                e.customerName.toLowerCase().includes(query) ||
                e.orderId.toLowerCase().includes(query) ||
                e.reason.toLowerCase().includes(query) ||
                e.product.toLowerCase().includes(query)
            );
        }

        // Sort
        filtered.sort((a, b) => {
            const diff = new Date(b.date).getTime() - new Date(a.date).getTime();
            return sortOrder === 'newest' ? diff : -diff;
        });

        return filtered;
    }, [enquiries, categoryFilter, statusFilter, readFilter, dateFilter, accountFilter, searchQuery, sortOrder, repliedThreads]);

    // ─── Stats ──────────────────────────────────────────────────────

    const stats = useMemo(() => {
        const threadMap = new Map<string, GmailEnquiry>();
        for (const e of enquiries) {
            const existing = threadMap.get(e.threadId);
            if (!existing || new Date(e.date) > new Date(existing.date)) {
                threadMap.set(e.threadId, e);
            }
        }
        const unique = Array.from(threadMap.values());
        return {
            total: unique.length,
            unread: unique.filter(e => e.labels.includes('UNREAD')).length,
            delivery: unique.filter(e => e.category === 'delivery').length,
            refund: unique.filter(e => e.category === 'refund').length,
            product_claim: unique.filter(e => e.category === 'product_claim').length,
            tech_support: unique.filter(e => e.category === 'tech_support').length,
            other: unique.filter(e => e.category === 'other').length,
            replied: unique.filter(e => repliedThreads.has(e.threadId)).length,
        };
    }, [enquiries, repliedThreads]);

    // ─── Open Reply Modal ───────────────────────────────────────────

    const openReplyModal = async (enquiry: GmailEnquiry) => {
        setSelectedEnquiry(enquiry);
        // Pre-fill with AI-suggested reply if available
        if (enquiry.aiSuggestedReply) {
            setReplyText(enquiry.aiSuggestedReply);
            setSelectedTemplate(enquiry.aiTemplateUsed || '');
        } else {
            setReplyText('');
            setSelectedTemplate('');
        }
        setLoadingThread(true);
        setThreadMessages([]);

        try {
            const accountParam = enquiry.accountEmail ? `&accountEmail=${encodeURIComponent(enquiry.accountEmail)}` : '';
            const res = await fetch(`/api/admin/gmail-enquiries?threadId=${enquiry.threadId}${accountParam}`);
            const data = await res.json();
            if (data.success) {
                setThreadMessages(data.messages);
            }
        } catch (error) {
            toast.error('Failed to load thread');
        } finally {
            setLoadingThread(false);
        }
    };

    const closeReplyModal = () => {
        setSelectedEnquiry(null);
        setThreadMessages([]);
        setReplyText('');
        setSelectedTemplate('');
        setShowTemplateDropdown(false);
    };

    // ─── Apply Template ─────────────────────────────────────────────

    const applyTemplate = (key: string) => {
        if (!selectedEnquiry) return;
        const template = TEMPLATES[key];
        if (!template) return;

        let text = template.body;
        text = text.replace(/\[BUYER_NAME\]/g, selectedEnquiry.customerName || 'Customer');
        text = text.replace(/\[ORDER_ID\]/g, selectedEnquiry.orderId || 'N/A');

        setReplyText(text);
        setSelectedTemplate(key);
        setShowTemplateDropdown(false);
    };

    // ─── Generate AI Reply ──────────────────────────────────────────

    const generateAIReply = async () => {
        if (!selectedEnquiry) return;
        setGeneratingAI(true);

        try {
            const res = await fetch('/api/admin/gmail-enquiries/ai-reply', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    customerMessage: selectedEnquiry.reason || selectedEnquiry.body,
                    customerName: selectedEnquiry.customerName,
                    orderId: selectedEnquiry.orderId,
                    product: selectedEnquiry.product,
                    reason: selectedEnquiry.reason,
                    category: selectedEnquiry.category,
                }),
            });

            const data = await res.json();
            if (data.success) {
                setReplyText(data.reply);
                setSelectedTemplate('');
                toast.success('AI reply generated');
            } else {
                toast.error(data.error || 'Failed to generate AI reply');
            }
        } catch (error) {
            toast.error('Failed to generate AI reply');
        } finally {
            setGeneratingAI(false);
        }
    };

    // ─── Send Reply ─────────────────────────────────────────────────

    const sendReply = async () => {
        if (!selectedEnquiry || !replyText.trim()) {
            toast.error('Please write a reply');
            return;
        }

        setSendingReply(true);

        try {
            const res = await fetch('/api/admin/gmail-enquiries/reply', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    threadId: selectedEnquiry.threadId,
                    inReplyTo: selectedEnquiry.messageId,
                    to: selectedEnquiry.from,
                    subject: selectedEnquiry.subject,
                    replyBody: replyText,
                    accountEmail: selectedEnquiry.accountEmail,
                }),
            });

            const data = await res.json();
            if (data.success) {
                // Mark as replied in database
                try {
                    await fetch('/api/admin/gmail-enquiries', {
                        method: 'PATCH',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ threadId: selectedEnquiry.threadId }),
                    });
                } catch { /* non-critical */ }
                toast.success('Reply sent successfully!');
                setRepliedThreads(prev => new Set(prev).add(selectedEnquiry.threadId));
                closeReplyModal();
            } else {
                toast.error(data.error || 'Failed to send reply');
            }
        } catch (error) {
            toast.error('Failed to send reply');
        } finally {
            setSendingReply(false);
        }
    };

    // ─── Copy Reply ─────────────────────────────────────────────────

    const copyReply = async () => {
        if (!replyText) return;
        try {
            await navigator.clipboard.writeText(replyText);
            setCopiedReply(true);
            toast.success('Reply copied!');
            setTimeout(() => setCopiedReply(false), 2000);
        } catch {
            toast.error('Failed to copy');
        }
    };

    // ─── Mark All as Read ───────────────────────────────────────────

    const markAllAsRead = async () => {
        setMarkingRead(true);
        try {
            const res = await fetch('/api/admin/gmail-enquiries/mark-read', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({}),
            });
            const data = await res.json();
            if (data.success) {
                // Update local state — remove UNREAD from all enquiries
                setEnquiries(prev => prev.map(e => ({
                    ...e,
                    labels: e.labels.filter(l => l !== 'UNREAD'),
                })));
                toast.success(`Marked ${data.updatedCount} enquiries as read`);
            } else {
                toast.error(data.error || 'Failed to mark as read');
            }
        } catch {
            toast.error('Failed to mark as read');
        } finally {
            setMarkingRead(false);
        }
    };

    // ─── Selection Helpers ──────────────────────────────────────────

    const toggleSelectThread = (threadId: string) => {
        setSelectedThreadIds(prev => {
            const next = new Set(prev);
            if (next.has(threadId)) next.delete(threadId);
            else next.add(threadId);
            return next;
        });
    };

    const toggleSelectAll = () => {
        if (selectedThreadIds.size === filteredEnquiries.length) {
            setSelectedThreadIds(new Set());
        } else {
            setSelectedThreadIds(new Set(filteredEnquiries.map(e => e.threadId)));
        }
    };

    // ─── Bulk Reply ─────────────────────────────────────────────────

    const bulkSendTemplate = async (templateKey: string) => {
        const template = TEMPLATES[templateKey];
        if (!template) return;

        const selected = filteredEnquiries.filter(e => selectedThreadIds.has(e.threadId));
        if (selected.length === 0) { toast.error('No enquiries selected'); return; }

        setBulkSending(true);
        setBulkProgress({ current: 0, total: selected.length });
        setShowBulkTemplateDropdown(false);
        let successCount = 0;

        for (let i = 0; i < selected.length; i++) {
            const enquiry = selected[i];
            setBulkProgress({ current: i + 1, total: selected.length });

            let text = template.body;
            text = text.replace(/\[BUYER_NAME\]/g, enquiry.customerName || 'Customer');
            text = text.replace(/\[ORDER_ID\]/g, enquiry.orderId || 'N/A');

            try {
                const res = await fetch('/api/admin/gmail-enquiries/reply', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        threadId: enquiry.threadId,
                        inReplyTo: enquiry.messageId,
                        to: enquiry.from,
                        subject: enquiry.subject,
                        replyBody: text,
                        accountEmail: enquiry.accountEmail,
                    }),
                });
                const data = await res.json();
                if (data.success) {
                    // Mark replied in DB
                    try {
                        await fetch('/api/admin/gmail-enquiries', {
                            method: 'PATCH',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ threadId: enquiry.threadId }),
                        });
                    } catch { /* non-critical */ }
                    successCount++;
                    setRepliedThreads(prev => new Set(prev).add(enquiry.threadId));
                }
            } catch { /* continue */ }
        }

        toast.success(`Sent ${successCount}/${selected.length} template replies`);
        setSelectedThreadIds(new Set());
        setBulkSending(false);
    };

    const bulkSendAIReplies = async () => {
        const selected = filteredEnquiries.filter(
            e => selectedThreadIds.has(e.threadId) && e.aiSuggestedReply
        );
        const skipped = filteredEnquiries.filter(
            e => selectedThreadIds.has(e.threadId) && !e.aiSuggestedReply
        ).length;

        if (selected.length === 0) {
            toast.error('No selected enquiries have AI replies');
            return;
        }

        setBulkSending(true);
        setBulkProgress({ current: 0, total: selected.length });
        let successCount = 0;

        for (let i = 0; i < selected.length; i++) {
            const enquiry = selected[i];
            setBulkProgress({ current: i + 1, total: selected.length });

            try {
                const res = await fetch('/api/admin/gmail-enquiries/reply', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        threadId: enquiry.threadId,
                        inReplyTo: enquiry.messageId,
                        to: enquiry.from,
                        subject: enquiry.subject,
                        replyBody: enquiry.aiSuggestedReply,
                        accountEmail: enquiry.accountEmail,
                    }),
                });
                const data = await res.json();
                if (data.success) {
                    try {
                        await fetch('/api/admin/gmail-enquiries', {
                            method: 'PATCH',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ threadId: enquiry.threadId }),
                        });
                    } catch { /* non-critical */ }
                    successCount++;
                    setRepliedThreads(prev => new Set(prev).add(enquiry.threadId));
                }
            } catch { /* continue */ }
        }

        toast.success(`Sent ${successCount}/${selected.length} AI replies${skipped > 0 ? ` (${skipped} skipped — no AI reply)` : ''}`);
        setSelectedThreadIds(new Set());
        setBulkSending(false);
    };

    // ─── Category Helpers ───────────────────────────────────────────

    const getCategoryBadge = (category: string) => {
        const config: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
            delivery: { label: 'Delivery', color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400', icon: <Truck className="h-3 w-3" /> },
            refund: { label: 'Refund/Cancel', color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400', icon: <Ban className="h-3 w-3" /> },
            product_claim: { label: 'Product Claim', color: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400', icon: <AlertTriangle className="h-3 w-3" /> },
            tech_support: { label: 'Tech Support', color: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400', icon: <HelpCircle className="h-3 w-3" /> },
            other: { label: 'Other', color: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400', icon: <MessageSquare className="h-3 w-3" /> },
        };
        const c = config[category] || config.other;
        return (
            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold ${c.color}`}>
                {c.icon} {c.label}
            </span>
        );
    };

    const formatDate = (dateString: string) => {
        try {
            const date = new Date(dateString);
            const now = new Date();
            const diff = now.getTime() - date.getTime();
            const hours = Math.floor(diff / (1000 * 60 * 60));

            if (hours < 1) return 'Just now';
            if (hours < 24) return `${hours}h ago`;
            if (hours < 48) return 'Yesterday';
            return date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
        } catch {
            return dateString;
        }
    };

    // ─── Account Management Handlers ────────────────────────────────

    const connectGmailOAuth = async () => {
        setConnectingOAuth(true);
        try {
            const res = await fetch(`/api/admin/gmail-oauth?action=authorize&label=${encodeURIComponent(oauthLabel)}`);
            const data = await res.json();
            if (data.success && data.authUrl) {
                window.location.href = data.authUrl;
            } else {
                toast.error(data.error || 'Failed to start OAuth flow');
                setConnectingOAuth(false);
            }
        } catch {
            toast.error('Failed to start OAuth flow');
            setConnectingOAuth(false);
        }
    };

    const toggleAccount = async (id: string, isActive: boolean) => {
        try {
            const res = await fetch('/api/admin/gmail-accounts', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id, is_active: !isActive }),
            });
            const data = await res.json();
            if (data.success) {
                toast.success(isActive ? 'Account paused' : 'Account activated');
                fetchAccounts();
            }
        } catch { toast.error('Failed to update account'); }
    };

    const deleteAccount = async (id: string, email: string) => {
        if (!confirm(`Remove ${email}? This won't delete synced enquiries.`)) return;
        try {
            const res = await fetch(`/api/admin/gmail-accounts?id=${id}`, { method: 'DELETE' });
            const data = await res.json();
            if (data.success) {
                toast.success('Account removed');
                fetchAccounts();
            }
        } catch { toast.error('Failed to remove account'); }
    };

    // ─── Loading State ──────────────────────────────────────────────

    if (loading) {
        return (
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Gmail Enquiries</h1>
                        <p className="text-slate-500 dark:text-slate-400">Loading customer enquiries...</p>
                    </div>
                </div>
                <div className="flex items-center justify-center py-20">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
            </div>
        );
    }

    // ─── Render ─────────────────────────────────────────────────────

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Gmail Enquiries</h1>
                    <p className="text-slate-500 dark:text-slate-400">
                        Manage Amazon customer enquiries from Gmail ({stats.total} total)
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={markAllAsRead}
                        disabled={markingRead || stats.unread === 0}
                        className="flex items-center gap-2 px-4 py-2.5 rounded-lg border bg-background font-medium text-sm hover:bg-muted transition-colors disabled:opacity-50"
                        title="Mark all enquiries as read"
                    >
                        {markingRead ? <Loader2 className="h-4 w-4 animate-spin" /> : <MailCheck className="h-4 w-4" />}
                        Mark All Read
                    </button>
                    <button
                        onClick={() => fetchEnquiries(true)}
                        disabled={refreshing}
                        className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-primary text-primary-foreground font-medium hover:bg-primary/90 transition-colors disabled:opacity-50"
                    >
                        {refreshing ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
                        Refresh
                    </button>
                </div>
            </div>

            {/* Connected Accounts Panel */}
            <div className="bg-card border rounded-xl overflow-hidden shadow-sm">
                <button
                    onClick={() => setShowAccountsPanel(!showAccountsPanel)}
                    className="w-full flex items-center justify-between p-4 hover:bg-muted/50 transition-colors"
                >
                    <div className="flex items-center gap-3">
                        <Settings className="h-5 w-5 text-muted-foreground" />
                        <div className="text-left">
                            <p className="text-sm font-semibold">Connected Accounts</p>
                            <p className="text-xs text-muted-foreground">
                                {accounts.length > 0 ? `${accounts.filter(a => a.is_active).length} active of ${accounts.length}` : 'Using environment credentials'}
                            </p>
                        </div>
                    </div>
                    {showAccountsPanel ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </button>

                {showAccountsPanel && (
                    <div className="border-t p-4 space-y-3">
                        {/* Existing accounts */}
                        {accounts.length > 0 ? (
                            <div className="space-y-2">
                                {accounts.map((acc) => (
                                    <div key={acc.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/30 border">
                                        <div className="flex items-center gap-3">
                                            <Mail className={`h-4 w-4 ${acc.is_active ? 'text-green-500' : 'text-muted-foreground'}`} />
                                            <div>
                                                <p className="text-sm font-medium">{acc.email}</p>
                                                <p className="text-xs text-muted-foreground">
                                                    {acc.label !== acc.email ? `${acc.label} · ` : ''}
                                                    {acc.last_synced_at ? `Last synced: ${formatDate(acc.last_synced_at)}` : 'Never synced'}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <button
                                                onClick={() => toggleAccount(acc.id, acc.is_active)}
                                                className={`p-1.5 rounded-md transition-colors ${acc.is_active
                                                    ? 'bg-green-100 text-green-700 hover:bg-green-200 dark:bg-green-900/30 dark:text-green-400'
                                                    : 'bg-muted text-muted-foreground hover:bg-muted/80'
                                                    }`}
                                                title={acc.is_active ? 'Pause' : 'Activate'}
                                            >
                                                <Power className="h-4 w-4" />
                                            </button>
                                            <button
                                                onClick={() => deleteAccount(acc.id, acc.email)}
                                                className="p-1.5 rounded-md bg-red-100 text-red-600 hover:bg-red-200 dark:bg-red-900/30 dark:text-red-400 transition-colors"
                                                title="Remove"
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="text-sm text-muted-foreground text-center py-2">
                                No accounts in database. Using environment credentials ({process.env.NEXT_PUBLIC_GMAIL_EMAIL || 'default'}).
                            </p>
                        )}

                        {/* Connect with Google OAuth */}
                        <div className="space-y-3">
                            <div className="flex items-center gap-3">
                                <input
                                    type="text"
                                    placeholder="Label (optional, e.g. Support Account)"
                                    value={oauthLabel}
                                    onChange={(e) => setOAuthLabel(e.target.value)}
                                    className="flex-1 px-3 py-2.5 rounded-lg border bg-background text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                                />
                                <button
                                    onClick={connectGmailOAuth}
                                    disabled={connectingOAuth}
                                    className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-white text-gray-700 border border-gray-300 text-sm font-medium hover:bg-gray-50 transition-colors disabled:opacity-50 shadow-sm"
                                >
                                    {connectingOAuth ? (
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                    ) : (
                                        <svg className="h-4 w-4" viewBox="0 0 24 24">
                                            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" />
                                            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                                            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                                            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                                        </svg>
                                    )}
                                    {connectingOAuth ? 'Redirecting...' : 'Connect with Google'}
                                </button>
                            </div>
                            <p className="text-xs text-muted-foreground">
                                Connect a Gmail account via Google OAuth. You'll be redirected to Google to grant access.
                            </p>
                        </div>
                    </div>
                )}
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-8 gap-3">
                <button
                    onClick={() => { setCategoryFilter('all'); setReadFilter('all'); setStatusFilter('all'); }}
                    className={`relative overflow-hidden rounded-xl p-4 text-left transition-all ${categoryFilter === 'all' && readFilter === 'all' && statusFilter === 'all' ? 'ring-2 ring-primary ring-offset-2 dark:ring-offset-slate-900' : 'hover:scale-[1.02]'}`}
                    style={{ background: 'linear-gradient(135deg, #e0e7ff 0%, #c7d2fe 100%)' }}
                >
                    <Inbox className="h-5 w-5 text-indigo-600 mb-2" />
                    <p className="text-2xl font-bold text-indigo-900">{stats.total}</p>
                    <p className="text-sm text-indigo-700 font-medium">All</p>
                </button>

                <button
                    onClick={() => { setCategoryFilter(categoryFilter === 'delivery' ? 'all' : 'delivery'); setReadFilter('all'); setStatusFilter('all'); }}
                    className={`relative overflow-hidden rounded-xl p-4 text-left transition-all ${categoryFilter === 'delivery' ? 'ring-2 ring-blue-500 ring-offset-2 dark:ring-offset-slate-900' : 'hover:scale-[1.02]'}`}
                    style={{ background: 'linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%)' }}
                >
                    <Truck className="h-5 w-5 text-blue-600 mb-2" />
                    <p className="text-2xl font-bold text-blue-900">{stats.delivery}</p>
                    <p className="text-sm text-blue-700 font-medium">Delivery</p>
                </button>

                <button
                    onClick={() => { setCategoryFilter(categoryFilter === 'refund' ? 'all' : 'refund'); setReadFilter('all'); setStatusFilter('all'); }}
                    className={`relative overflow-hidden rounded-xl p-4 text-left transition-all ${categoryFilter === 'refund' ? 'ring-2 ring-red-500 ring-offset-2 dark:ring-offset-slate-900' : 'hover:scale-[1.02]'}`}
                    style={{ background: 'linear-gradient(135deg, #fee2e2 0%, #fecaca 100%)' }}
                >
                    <Ban className="h-5 w-5 text-red-600 mb-2" />
                    <p className="text-2xl font-bold text-red-900">{stats.refund}</p>
                    <p className="text-sm text-red-700 font-medium">Refund</p>
                </button>

                <button
                    onClick={() => { setCategoryFilter(categoryFilter === 'product_claim' ? 'all' : 'product_claim'); setReadFilter('all'); setStatusFilter('all'); }}
                    className={`relative overflow-hidden rounded-xl p-4 text-left transition-all ${categoryFilter === 'product_claim' ? 'ring-2 ring-orange-500 ring-offset-2 dark:ring-offset-slate-900' : 'hover:scale-[1.02]'}`}
                    style={{ background: 'linear-gradient(135deg, #ffedd5 0%, #fed7aa 100%)' }}
                >
                    <AlertTriangle className="h-5 w-5 text-orange-600 mb-2" />
                    <p className="text-2xl font-bold text-orange-900">{stats.product_claim}</p>
                    <p className="text-sm text-orange-700 font-medium">Claims</p>
                </button>

                <button
                    onClick={() => { setCategoryFilter(categoryFilter === 'tech_support' ? 'all' : 'tech_support'); setReadFilter('all'); setStatusFilter('all'); }}
                    className={`relative overflow-hidden rounded-xl p-4 text-left transition-all ${categoryFilter === 'tech_support' ? 'ring-2 ring-purple-500 ring-offset-2 dark:ring-offset-slate-900' : 'hover:scale-[1.02]'}`}
                    style={{ background: 'linear-gradient(135deg, #f3e8ff 0%, #e9d5ff 100%)' }}
                >
                    <HelpCircle className="h-5 w-5 text-purple-600 mb-2" />
                    <p className="text-2xl font-bold text-purple-900">{stats.tech_support}</p>
                    <p className="text-sm text-purple-700 font-medium">Tech</p>
                </button>

                <button
                    onClick={() => { setCategoryFilter(categoryFilter === 'other' ? 'all' : 'other'); setReadFilter('all'); setStatusFilter('all'); }}
                    className={`relative overflow-hidden rounded-xl p-4 text-left transition-all ${categoryFilter === 'other' ? 'ring-2 ring-gray-500 ring-offset-2 dark:ring-offset-slate-900' : 'hover:scale-[1.02]'}`}
                    style={{ background: 'linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 100%)' }}
                >
                    <MessageSquare className="h-5 w-5 text-gray-600 mb-2" />
                    <p className="text-2xl font-bold text-gray-900">{stats.other}</p>
                    <p className="text-sm text-gray-700 font-medium">Other</p>
                </button>

                <button
                    onClick={() => { setReadFilter(readFilter === 'unread' ? 'all' : 'unread'); setCategoryFilter('all'); setStatusFilter('all'); }}
                    className={`relative overflow-hidden rounded-xl p-4 text-left transition-all ${readFilter === 'unread' ? 'ring-2 ring-amber-500 ring-offset-2 dark:ring-offset-slate-900' : 'hover:scale-[1.02]'}`}
                    style={{ background: 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)' }}
                >
                    <Clock className="h-5 w-5 text-amber-600 mb-2" />
                    <p className="text-2xl font-bold text-amber-900">{stats.unread}</p>
                    <p className="text-sm text-amber-700 font-medium">Unread</p>
                </button>

                <button
                    onClick={() => { setStatusFilter(statusFilter === 'replied' ? 'all' : 'replied'); setCategoryFilter('all'); setReadFilter('all'); }}
                    className={`relative overflow-hidden rounded-xl p-4 text-left transition-all ${statusFilter === 'replied' ? 'ring-2 ring-green-500 ring-offset-2 dark:ring-offset-slate-900' : 'hover:scale-[1.02]'}`}
                    style={{ background: 'linear-gradient(135deg, #dcfce7 0%, #bbf7d0 100%)' }}
                >
                    <CheckCircle2 className="h-5 w-5 text-green-600 mb-2" />
                    <p className="text-2xl font-bold text-green-900">{stats.replied}</p>
                    <p className="text-sm text-green-700 font-medium">Replied</p>
                </button>
            </div>

            {/* Filters */}
            <div className="bg-card border rounded-xl p-4 shadow-sm">
                {/* Row 1: Search + Category */}
                <div className="flex flex-wrap items-center gap-3">
                    <div className="relative flex-1 min-w-[200px]">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Search by customer, order ID, reason..."
                            className="w-full pl-10 pr-4 py-2.5 rounded-lg bg-background border text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                        />
                    </div>

                    <select
                        value={categoryFilter}
                        onChange={(e) => setCategoryFilter(e.target.value)}
                        className="px-4 py-2.5 rounded-lg bg-background border text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                    >
                        <option value="all">All Categories</option>
                        <option value="delivery">Delivery</option>
                        <option value="refund">Refund/Cancel</option>
                        <option value="product_claim">Product Claim</option>
                        <option value="tech_support">Tech Support</option>
                        <option value="other">Other</option>
                    </select>
                </div>

                {/* Row 2: Additional Filters */}
                <div className="flex flex-wrap items-center gap-3 mt-3 pt-3 border-t">
                    <div className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                        <Filter className="h-3.5 w-3.5" /> Filters
                    </div>

                    {/* Status Filter */}
                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value as 'all' | 'pending' | 'replied')}
                        className="px-3 py-2 rounded-lg bg-background border text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                    >
                        <option value="all">All Status</option>
                        <option value="pending">⏳ Pending</option>
                        <option value="replied">✅ Replied</option>
                    </select>

                    {/* Read Status Filter */}
                    <select
                        value={readFilter}
                        onChange={(e) => setReadFilter(e.target.value as 'all' | 'unread' | 'read')}
                        className="px-3 py-2 rounded-lg bg-background border text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                    >
                        <option value="all">All Messages</option>
                        <option value="unread">📬 Unread</option>
                        <option value="read">📭 Read</option>
                    </select>

                    {/* Date Range Filter */}
                    <select
                        value={dateFilter}
                        onChange={(e) => setDateFilter(e.target.value as 'all' | 'today' | '7days' | '30days')}
                        className="px-3 py-2 rounded-lg bg-background border text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                    >
                        <option value="all">All Time</option>
                        <option value="today">📅 Today</option>
                        <option value="7days">📅 Last 7 Days</option>
                        <option value="30days">📅 Last 30 Days</option>
                    </select>

                    {/* Account Filter */}
                    {uniqueAccounts.length > 0 && (
                        <select
                            value={accountFilter}
                            onChange={(e) => setAccountFilter(e.target.value)}
                            className="px-3 py-2 rounded-lg bg-background border text-sm focus:outline-none focus:ring-2 focus:ring-primary max-w-[200px]"
                        >
                            <option value="all">All Accounts</option>
                            {uniqueAccounts.map((email) => (
                                <option key={email} value={email}>{email}</option>
                            ))}
                        </select>
                    )}

                    {/* Sort Order Toggle */}
                    <button
                        onClick={() => setSortOrder(sortOrder === 'newest' ? 'oldest' : 'newest')}
                        className="flex items-center gap-1.5 px-3 py-2 rounded-lg border bg-background text-sm hover:bg-muted transition-colors ml-auto"
                        title={`Sort by ${sortOrder === 'newest' ? 'Oldest First' : 'Newest First'}`}
                    >
                        <ArrowUpDown className="h-3.5 w-3.5" />
                        {sortOrder === 'newest' ? 'Newest First' : 'Oldest First'}
                    </button>

                    {/* Clear All Filters */}
                    {(searchQuery || categoryFilter !== 'all' || statusFilter !== 'all' || readFilter !== 'all' || dateFilter !== 'all' || accountFilter !== 'all' || sortOrder !== 'newest') && (
                        <button
                            onClick={() => {
                                setSearchQuery('');
                                setCategoryFilter('all');
                                setStatusFilter('all');
                                setReadFilter('all');
                                setDateFilter('all');
                                setAccountFilter('all');
                                setSortOrder('newest');
                            }}
                            className="flex items-center gap-1.5 px-3 py-2 text-sm text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/10 rounded-lg transition-colors"
                        >
                            <X className="h-4 w-4" /> Clear All
                        </button>
                    )}
                </div>

                {/* Active Filters Summary */}
                {(searchQuery || categoryFilter !== 'all' || statusFilter !== 'all' || readFilter !== 'all' || dateFilter !== 'all' || accountFilter !== 'all') && (
                    <div className="mt-3 pt-3 border-t">
                        <p className="text-sm text-muted-foreground">
                            Showing <span className="font-semibold text-primary">{filteredEnquiries.length}</span> of {stats.total} enquiries
                        </p>
                    </div>
                )}
            </div>

            {/* Bulk Action Bar */}
            {selectedThreadIds.size > 0 && (
                <div className="bg-primary/5 border border-primary/20 rounded-xl p-4 shadow-sm flex flex-wrap items-center gap-3">
                    <div className="flex items-center gap-2 mr-auto">
                        <CheckSquare className="h-5 w-5 text-primary" />
                        <span className="text-sm font-semibold">{selectedThreadIds.size} selected</span>
                        <button
                            onClick={() => setSelectedThreadIds(new Set())}
                            className="text-xs text-muted-foreground hover:text-foreground ml-2 underline"
                        >
                            Deselect All
                        </button>
                    </div>

                    {bulkSending ? (
                        <div className="flex items-center gap-2 text-sm text-primary font-medium">
                            <Loader2 className="h-4 w-4 animate-spin" />
                            Sending {bulkProgress.current}/{bulkProgress.total}...
                        </div>
                    ) : (
                        <>
                            {/* Bulk Template Reply */}
                            <div className="relative">
                                <button
                                    onClick={() => setShowBulkTemplateDropdown(!showBulkTemplateDropdown)}
                                    className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors"
                                >
                                    <Send className="h-4 w-4" />
                                    Send Template
                                    <ChevronDown className="h-3 w-3" />
                                </button>
                                {showBulkTemplateDropdown && (
                                    <div className="absolute top-full right-0 mt-1 w-56 bg-card border rounded-lg shadow-xl z-10 py-1">
                                        {Object.entries(TEMPLATES).map(([key, tmpl]) => (
                                            <button
                                                key={key}
                                                onClick={() => bulkSendTemplate(key)}
                                                className="w-full text-left px-4 py-2.5 text-sm hover:bg-muted transition-colors"
                                            >
                                                {tmpl.name}
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Bulk AI Reply */}
                            <button
                                onClick={bulkSendAIReplies}
                                className="flex items-center gap-2 px-4 py-2 rounded-lg border border-violet-300 bg-violet-50 text-violet-700 dark:border-violet-700 dark:bg-violet-900/20 dark:text-violet-400 text-sm font-medium hover:bg-violet-100 dark:hover:bg-violet-900/30 transition-colors"
                            >
                                <Sparkles className="h-4 w-4" />
                                Send AI Replies
                            </button>
                        </>
                    )}
                </div>
            )}

            {/* Mobile Cards */}
            <div className="lg:hidden space-y-3">
                {filteredEnquiries.length === 0 ? (
                    <div className="p-12 text-center bg-card border rounded-xl">
                        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-muted flex items-center justify-center">
                            <Mail className="h-8 w-8 text-muted-foreground" />
                        </div>
                        <p className="text-muted-foreground font-medium">No enquiries found</p>
                    </div>
                ) : (
                    filteredEnquiries.map((enquiry) => (
                        <div key={`${enquiry.threadId}-${enquiry.id}`} className="bg-card border rounded-xl p-4">
                            <div className="flex items-start justify-between gap-3">
                                <div className="flex items-start gap-3 flex-1 min-w-0">
                                    {/* Checkbox */}
                                    <button
                                        onClick={() => toggleSelectThread(enquiry.threadId)}
                                        className="mt-0.5 shrink-0 text-muted-foreground hover:text-primary transition-colors"
                                    >
                                        {selectedThreadIds.has(enquiry.threadId)
                                            ? <CheckSquare className="h-5 w-5 text-primary" />
                                            : <Square className="h-5 w-5" />}
                                    </button>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-1">
                                            <p className="text-sm font-semibold truncate">{enquiry.customerName}</p>
                                            {enquiry.labels.includes('UNREAD') && (
                                                <span className="w-2 h-2 rounded-full bg-blue-500 shrink-0" />
                                            )}
                                        </div>
                                        <p className="font-mono text-xs text-muted-foreground truncate">{enquiry.orderId || '-'}</p>
                                        <div className="flex items-center flex-wrap gap-2 mt-2">
                                            {getCategoryBadge(enquiry.category)}
                                            {repliedThreads.has(enquiry.threadId) && (
                                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
                                                    <Check className="h-3 w-3" /> Replied
                                                </span>
                                            )}
                                        </div>
                                        <p className="text-xs text-muted-foreground mt-2 line-clamp-2">{enquiry.reason}</p>
                                        <p className="text-xs text-muted-foreground mt-1">{formatDate(enquiry.date)}</p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => openReplyModal(enquiry)}
                                    className="shrink-0 w-10 h-10 inline-flex items-center justify-center rounded-lg text-primary bg-primary/10 hover:bg-primary/20"
                                    title="View & Reply"
                                >
                                    <Eye className="h-5 w-5" />
                                </button>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Desktop Table */}
            <div className="hidden lg:block bg-card border rounded-xl overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-muted/50 border-b">
                            <tr>
                                <th className="px-4 py-3 text-left w-10">
                                    <button onClick={toggleSelectAll} className="text-muted-foreground hover:text-primary transition-colors">
                                        {selectedThreadIds.size === filteredEnquiries.length && filteredEnquiries.length > 0
                                            ? <CheckSquare className="h-4 w-4 text-primary" />
                                            : <Square className="h-4 w-4" />}
                                    </button>
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Customer</th>
                                <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Order ID</th>
                                <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Product</th>
                                <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Category</th>
                                <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Reason</th>
                                <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Date</th>
                                <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Account</th>
                                <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Status</th>
                                <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                            {filteredEnquiries.map((enquiry) => (
                                <tr
                                    key={`${enquiry.threadId}-${enquiry.id}`}
                                    className={`hover:bg-muted/50 transition-colors ${enquiry.labels.includes('UNREAD') ? 'bg-blue-50/50 dark:bg-blue-900/5' : ''} ${selectedThreadIds.has(enquiry.threadId) ? 'bg-primary/5 dark:bg-primary/10' : ''}`}
                                >
                                    <td className="px-4 py-3">
                                        <button onClick={() => toggleSelectThread(enquiry.threadId)} className="text-muted-foreground hover:text-primary transition-colors">
                                            {selectedThreadIds.has(enquiry.threadId)
                                                ? <CheckSquare className="h-4 w-4 text-primary" />
                                                : <Square className="h-4 w-4" />}
                                        </button>
                                    </td>
                                    <td className="px-4 py-3">
                                        <div className="flex items-center gap-2">
                                            {enquiry.labels.includes('UNREAD') && (
                                                <span className="w-2 h-2 rounded-full bg-blue-500 shrink-0" />
                                            )}
                                            <span className="text-sm font-semibold">{enquiry.customerName}</span>
                                        </div>
                                    </td>
                                    <td className="px-4 py-3 font-mono text-sm text-muted-foreground">
                                        {enquiry.orderId || '-'}
                                    </td>
                                    <td className="px-4 py-3">
                                        {enquiry.product && (
                                            <span className="px-2 py-1 rounded text-xs font-mono bg-muted text-muted-foreground">
                                                {enquiry.product}
                                            </span>
                                        )}
                                    </td>
                                    <td className="px-4 py-3">{getCategoryBadge(enquiry.category)}</td>
                                    <td className="px-4 py-3">
                                        <p className="text-sm text-muted-foreground max-w-[300px] truncate" title={enquiry.reason}>
                                            {enquiry.reason || '-'}
                                        </p>
                                    </td>
                                    <td className="px-4 py-3 text-sm text-muted-foreground whitespace-nowrap">
                                        {formatDate(enquiry.date)}
                                    </td>
                                    <td className="px-4 py-3">
                                        {enquiry.accountEmail ? (
                                            <span className="text-xs text-muted-foreground truncate max-w-[160px] block" title={enquiry.accountEmail}>
                                                {enquiry.accountEmail.split('@')[0]}@...
                                            </span>
                                        ) : (
                                            <span className="text-xs text-muted-foreground/50">—</span>
                                        )}
                                    </td>
                                    <td className="px-4 py-3">
                                        {repliedThreads.has(enquiry.threadId) ? (
                                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
                                                <Check className="h-3 w-3" /> Replied
                                            </span>
                                        ) : (
                                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
                                                <Clock className="h-3 w-3" /> Pending
                                            </span>
                                        )}
                                    </td>
                                    <td className="px-4 py-3">
                                        <button
                                            onClick={() => openReplyModal(enquiry)}
                                            className="w-8 h-8 inline-flex items-center justify-center rounded text-primary bg-primary/10 hover:bg-primary/20 transition-colors"
                                            title="View & Reply"
                                        >
                                            <Eye className="h-4 w-4" />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {filteredEnquiries.length === 0 && (
                    <div className="p-12 text-center">
                        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-muted flex items-center justify-center">
                            <Mail className="h-8 w-8 text-muted-foreground" />
                        </div>
                        <p className="text-muted-foreground font-medium">No enquiries found</p>
                        <p className="text-sm text-muted-foreground mt-1">Try adjusting your filters</p>
                    </div>
                )}
            </div>

            {/* Reply Modal */}
            {selectedEnquiry && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                    <div className="bg-card border border-border rounded-xl shadow-xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
                        {/* Modal Header */}
                        <div className="p-5 border-b border-border shrink-0">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 rounded-lg bg-primary/10 border border-primary/20">
                                        <Mail className="h-5 w-5 text-primary" />
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-semibold text-foreground">{selectedEnquiry.customerName}</h3>
                                        <p className="text-sm text-muted-foreground">
                                            Order: <code className="px-1.5 py-0.5 rounded bg-muted text-xs font-mono">{selectedEnquiry.orderId || 'N/A'}</code>
                                            {selectedEnquiry.product && (
                                                <> · Product: <code className="px-1.5 py-0.5 rounded bg-muted text-xs font-mono">{selectedEnquiry.product}</code></>
                                            )}
                                        </p>
                                    </div>
                                </div>
                                <button onClick={closeReplyModal} className="p-1 hover:bg-muted rounded transition-colors">
                                    <X className="h-5 w-5" />
                                </button>
                            </div>
                            <div className="mt-2">{getCategoryBadge(selectedEnquiry.category)}</div>
                        </div>

                        {/* Thread Messages */}
                        <div className="flex-1 overflow-y-auto overflow-x-hidden p-5 space-y-4 scrollbar-orange">
                            {loadingThread ? (
                                <div className="flex items-center justify-center py-10">
                                    <Loader2 className="h-6 w-6 animate-spin text-primary" />
                                </div>
                            ) : (
                                threadMessages.map((msg, i) => (
                                    <div
                                        key={msg.id}
                                        className={`rounded-lg p-4 ${msg.isSent
                                            ? 'bg-primary/5 border border-primary/20 ml-8'
                                            : 'bg-muted/50 border mr-8'
                                            }`}
                                    >
                                        <div className="flex items-center justify-between mb-2">
                                            <span className={`text-xs font-semibold ${msg.isSent ? 'text-primary' : 'text-foreground'}`}>
                                                {msg.isSent ? 'You (CODEKEYS)' : msg.from.split('<')[0].trim()}
                                            </span>
                                            <span className="text-xs text-muted-foreground">{formatDate(msg.date)}</span>
                                        </div>
                                        <div className="text-sm whitespace-pre-wrap break-words text-foreground/80">
                                            {msg.body.substring(0, 1500)}
                                            {msg.body.length > 1500 && '...'}
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>

                        {/* Reply Section */}
                        <div className="border-t border-border p-5 shrink-0 space-y-3">
                            {/* Template & AI Buttons */}
                            <div className="flex items-center gap-2 flex-wrap">
                                {/* Template Dropdown */}
                                <div className="relative">
                                    <button
                                        onClick={() => setShowTemplateDropdown(!showTemplateDropdown)}
                                        className="flex items-center gap-2 px-3 py-2 rounded-lg border bg-background text-sm font-medium hover:bg-muted transition-colors"
                                    >
                                        <MessageSquare className="h-4 w-4" />
                                        {selectedTemplate ? TEMPLATES[selectedTemplate]?.name : 'Use Template'}
                                        <ChevronDown className="h-3 w-3" />
                                    </button>
                                    {showTemplateDropdown && (
                                        <div className="absolute bottom-full left-0 mb-1 w-56 bg-card border rounded-lg shadow-xl z-10 py-1">
                                            {Object.entries(TEMPLATES).map(([key, tmpl]) => (
                                                <button
                                                    key={key}
                                                    onClick={() => applyTemplate(key)}
                                                    className="w-full text-left px-4 py-2.5 text-sm hover:bg-muted transition-colors"
                                                >
                                                    {tmpl.name}
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                {/* AI Generate */}
                                <button
                                    onClick={generateAIReply}
                                    disabled={generatingAI}
                                    className="flex items-center gap-2 px-3 py-2 rounded-lg border border-violet-300 bg-violet-50 text-violet-700 dark:border-violet-700 dark:bg-violet-900/20 dark:text-violet-400 text-sm font-medium hover:bg-violet-100 dark:hover:bg-violet-900/30 transition-colors disabled:opacity-50"
                                >
                                    {generatingAI ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                                    {generatingAI ? 'Generating...' : 'Regenerate AI Reply'}
                                </button>

                                {/* AI Pre-filled indicator */}
                                {selectedEnquiry?.aiSuggestedReply && replyText === selectedEnquiry.aiSuggestedReply && (
                                    <span className="flex items-center gap-1 px-2 py-1 rounded text-xs font-medium text-violet-600 dark:text-violet-400 bg-violet-50 dark:bg-violet-900/20">
                                        <Sparkles className="h-3 w-3" /> AI-generated · {selectedEnquiry.aiTemplateUsed || 'auto'}
                                    </span>
                                )}

                                {/* Copy */}
                                {replyText && (
                                    <button
                                        onClick={copyReply}
                                        className="flex items-center gap-1.5 px-3 py-2 rounded-lg border text-sm text-muted-foreground hover:text-foreground transition-colors"
                                    >
                                        {copiedReply ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                                        {copiedReply ? 'Copied' : 'Copy'}
                                    </button>
                                )}
                            </div>

                            {/* Reply Textarea */}
                            <textarea
                                value={replyText}
                                onChange={(e) => setReplyText(e.target.value)}
                                placeholder="Write your reply here... or select a template / generate with AI"
                                rows={6}
                                className="w-full px-4 py-3 rounded-lg border bg-background text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary resize-y scrollbar-orange"
                            />

                            {/* Send Button */}
                            <div className="flex items-center justify-between">
                                <p className="text-xs text-muted-foreground">
                                    Replying to: {selectedEnquiry.from.split('<')[0].trim()}
                                </p>
                                <button
                                    onClick={sendReply}
                                    disabled={sendingReply || !replyText.trim()}
                                    className="flex items-center gap-2 px-6 py-2.5 rounded-lg bg-primary text-primary-foreground font-medium hover:bg-primary/90 transition-colors disabled:opacity-50"
                                >
                                    {sendingReply ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                                    {sendingReply ? 'Sending...' : 'Send Reply'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
