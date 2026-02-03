'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { FileCheck, Mail, Phone, MapPin, Clock, Check, X, Eye, AlertTriangle } from 'lucide-react';

interface Appeal {
    id: string;
    order_id: string;
    customer_email: string;
    customer_whatsapp: string;
    proof_image_url: string;
    status: 'PENDING' | 'APPROVED' | 'REJECTED';
    admin_notes: string | null;
    rejection_reason: string | null;
    created_at: string;
    reviewed_at: string | null;
    reviewed_by: string | null;
    order?: {
        fsn: string;
        order_date: string;
        state: string;
        city: string;
        redeemable_at: string;
    };
}

export default function EarlyAppealsClient() {
    const [appeals, setAppeals] = useState<Appeal[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [filter, setFilter] = useState<string>('PENDING');
    const [total, setTotal] = useState(0);
    const [selectedAppeal, setSelectedAppeal] = useState<Appeal | null>(null);
    const [showModal, setShowModal] = useState(false);
    const [processing, setProcessing] = useState(false);
    const [rejectionReason, setRejectionReason] = useState('');
    const [adminNotes, setAdminNotes] = useState('');
    const [viewingImage, setViewingImage] = useState<string | null>(null);

    useEffect(() => {
        fetchAppeals();
    }, [filter]);

    const fetchAppeals = async () => {
        try {
            setLoading(true);
            const url = filter
                ? `/api/admin/fba-early-appeals?status=${filter}`
                : '/api/admin/fba-early-appeals';
            const response = await fetch(url);
            const data = await response.json();
            if (data.success) {
                setAppeals(data.data);
                setTotal(data.total);
            } else {
                setError(data.error);
            }
        } catch (err) {
            setError('Failed to fetch appeals');
        } finally {
            setLoading(false);
        }
    };

    const handleAction = async (action: 'APPROVE' | 'REJECT') => {
        if (!selectedAppeal) return;

        if (action === 'REJECT' && !rejectionReason.trim()) {
            alert('Please provide a reason for rejection');
            return;
        }

        setProcessing(true);
        try {
            const response = await fetch('/api/admin/fba-early-appeals', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    id: selectedAppeal.id,
                    action,
                    rejectionReason: action === 'REJECT' ? rejectionReason : undefined,
                    adminNotes: adminNotes || undefined,
                    reviewedBy: 'Admin'
                })
            });
            const data = await response.json();
            if (data.success) {
                setShowModal(false);
                setSelectedAppeal(null);
                setRejectionReason('');
                setAdminNotes('');
                fetchAppeals();
            } else {
                alert(data.error);
            }
        } catch (err) {
            alert('Failed to process appeal');
        } finally {
            setProcessing(false);
        }
    };

    const openReviewModal = (appeal: Appeal) => {
        setSelectedAppeal(appeal);
        setRejectionReason('');
        setAdminNotes('');
        setShowModal(true);
    };

    const formatDate = (dateStr: string) => {
        return new Date(dateStr).toLocaleString('en-IN', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'PENDING':
                return <span className="px-2.5 py-1 bg-amber-500/10 text-amber-500 rounded-full text-xs font-medium">Pending</span>;
            case 'APPROVED':
                return <span className="px-2.5 py-1 bg-green-500/10 text-green-500 rounded-full text-xs font-medium">Approved</span>;
            case 'REJECTED':
                return <span className="px-2.5 py-1 bg-red-500/10 text-red-500 rounded-full text-xs font-medium">Rejected</span>;
            default:
                return null;
        }
    };

    const filterOptions = [
        { value: 'PENDING', label: 'Pending', color: 'bg-amber-500' },
        { value: 'APPROVED', label: 'Approved', color: 'bg-green-500' },
        { value: 'REJECTED', label: 'Rejected', color: 'bg-red-500' },
        { value: '', label: 'All', color: 'bg-muted' }
    ];

    return (
        <div className="p-4 md:p-6">
            {/* Header */}
            <div className="mb-8">
                <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 bg-primary/10 rounded-lg">
                        <FileCheck className="h-6 w-6 text-primary" />
                    </div>
                    <h1 className="text-2xl font-bold">Early Delivery Appeals</h1>
                </div>
                <p className="text-muted-foreground">
                    Review customer requests to activate products before the standard delivery waiting period.
                </p>
            </div>

            {error && (
                <div className="bg-destructive/10 border border-destructive/30 text-destructive p-4 rounded-lg mb-6 flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5" />
                    {error}
                </div>
            )}

            {/* Filter Tabs */}
            <div className="flex gap-2 mb-6 overflow-x-auto pb-2 -mx-4 px-4 md:mx-0 md:px-0">
                {filterOptions.map((option) => (
                    <button
                        key={option.value || 'all'}
                        onClick={() => setFilter(option.value)}
                        className={`px-4 py-2 rounded-lg transition-all font-medium text-sm ${filter === option.value
                            ? 'bg-primary text-primary-foreground shadow-sm'
                            : 'bg-card border text-muted-foreground hover:bg-muted/50'
                            }`}
                    >
                        {option.label}
                    </button>
                ))}
            </div>

            {/* Appeals List */}
            <div className="bg-card rounded-xl border shadow-sm overflow-hidden">
                {loading ? (
                    <div className="p-12 text-center">
                        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto"></div>
                        <p className="text-muted-foreground mt-4">Loading appeals...</p>
                    </div>
                ) : appeals.length === 0 ? (
                    <div className="p-12 text-center">
                        <div className="w-12 h-12 rounded-full bg-muted mx-auto mb-4 flex items-center justify-center">
                            <FileCheck className="h-6 w-6 text-muted-foreground" />
                        </div>
                        <p className="text-muted-foreground">No {filter.toLowerCase() || ''} appeals found.</p>
                    </div>
                ) : (
                    <div className="grid gap-4 p-4">
                        {appeals.map((appeal) => (
                            <div
                                key={appeal.id}
                                className={`relative rounded-xl border overflow-hidden transition-all hover:shadow-lg ${appeal.status === 'PENDING'
                                        ? 'bg-gradient-to-r from-amber-500/5 to-orange-500/5 border-amber-500/30 hover:border-amber-500/50'
                                        : appeal.status === 'APPROVED'
                                            ? 'bg-gradient-to-r from-green-500/5 to-emerald-500/5 border-green-500/30'
                                            : 'bg-gradient-to-r from-red-500/5 to-rose-500/5 border-red-500/30'
                                    }`}
                            >
                                {/* Status indicator bar */}
                                <div className={`absolute top-0 left-0 right-0 h-1 ${appeal.status === 'PENDING'
                                        ? 'bg-gradient-to-r from-amber-500 to-orange-500'
                                        : appeal.status === 'APPROVED'
                                            ? 'bg-gradient-to-r from-green-500 to-emerald-500'
                                            : 'bg-gradient-to-r from-red-500 to-rose-500'
                                    }`} />

                                <div className="p-4 pt-5">
                                    <div className="flex flex-col lg:flex-row gap-4">
                                        {/* Proof Image Thumbnail - Larger */}
                                        <div
                                            className="w-full lg:w-32 h-32 flex-shrink-0 cursor-pointer rounded-lg overflow-hidden bg-muted/50 border-2 border-transparent hover:border-primary transition-all relative group shadow-md"
                                            onClick={() => setViewingImage(appeal.proof_image_url)}
                                        >
                                            <Image
                                                src={appeal.proof_image_url}
                                                alt="Proof of delivery"
                                                width={128}
                                                height={128}
                                                className="w-full h-full object-cover"
                                            />
                                            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                                <div className="text-center text-white">
                                                    <Eye className="h-6 w-6 mx-auto mb-1" />
                                                    <span className="text-xs font-medium">View Full</span>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Appeal Details */}
                                        <div className="flex-1 min-w-0">
                                            {/* Header Row */}
                                            <div className="flex flex-wrap items-center gap-2 mb-3">
                                                <span className="font-mono font-bold text-base bg-card px-3 py-1 rounded-lg border shadow-sm">
                                                    {appeal.order_id}
                                                </span>
                                                {getStatusBadge(appeal.status)}
                                            </div>

                                            {/* Info Grid */}
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                                                <div className="flex items-center gap-2.5 bg-card/50 rounded-lg px-3 py-2 border border-border/50">
                                                    <div className="w-8 h-8 rounded-full bg-blue-500/10 flex items-center justify-center">
                                                        <Mail className="h-4 w-4 text-blue-500" />
                                                    </div>
                                                    <div className="min-w-0">
                                                        <p className="text-xs text-muted-foreground">Email</p>
                                                        <p className="font-medium truncate">{appeal.customer_email}</p>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-2.5 bg-card/50 rounded-lg px-3 py-2 border border-border/50">
                                                    <div className="w-8 h-8 rounded-full bg-green-500/10 flex items-center justify-center">
                                                        <Phone className="h-4 w-4 text-green-500" />
                                                    </div>
                                                    <div>
                                                        <p className="text-xs text-muted-foreground">WhatsApp</p>
                                                        <p className="font-medium">{appeal.customer_whatsapp}</p>
                                                    </div>
                                                </div>
                                                {appeal.order && appeal.order.state && (
                                                    <div className="flex items-center gap-2.5 bg-card/50 rounded-lg px-3 py-2 border border-border/50">
                                                        <div className="w-8 h-8 rounded-full bg-purple-500/10 flex items-center justify-center">
                                                            <MapPin className="h-4 w-4 text-purple-500" />
                                                        </div>
                                                        <div>
                                                            <p className="text-xs text-muted-foreground">Location</p>
                                                            <p className="font-medium">{appeal.order.city ? `${appeal.order.city}, ` : ''}{appeal.order.state}</p>
                                                        </div>
                                                    </div>
                                                )}
                                                <div className="flex items-center gap-2.5 bg-card/50 rounded-lg px-3 py-2 border border-border/50">
                                                    <div className="w-8 h-8 rounded-full bg-amber-500/10 flex items-center justify-center">
                                                        <Clock className="h-4 w-4 text-amber-500" />
                                                    </div>
                                                    <div>
                                                        <p className="text-xs text-muted-foreground">Submitted</p>
                                                        <p className="font-medium">{formatDate(appeal.created_at)}</p>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Review info */}
                                            {appeal.reviewed_at && (
                                                <div className="mt-3 text-xs text-muted-foreground bg-muted/30 rounded-lg px-3 py-2 inline-flex items-center gap-2">
                                                    <Check className="h-3.5 w-3.5 text-green-500" />
                                                    Reviewed: {formatDate(appeal.reviewed_at)} by {appeal.reviewed_by}
                                                </div>
                                            )}

                                            {/* Rejection reason */}
                                            {appeal.rejection_reason && (
                                                <div className="mt-3 text-sm text-red-500 bg-red-500/10 rounded-lg px-3 py-2 flex items-start gap-2">
                                                    <X className="h-4 w-4 mt-0.5 flex-shrink-0" />
                                                    <span>{appeal.rejection_reason}</span>
                                                </div>
                                            )}
                                        </div>

                                        {/* Actions */}
                                        {appeal.status === 'PENDING' && (
                                            <div className="flex-shrink-0 flex lg:flex-col gap-2">
                                                <button
                                                    onClick={() => openReviewModal(appeal)}
                                                    className="flex-1 lg:flex-none px-5 py-2.5 bg-gradient-to-r from-primary to-primary/80 text-primary-foreground rounded-lg hover:opacity-90 transition-all flex items-center justify-center gap-2 font-medium shadow-lg shadow-primary/20"
                                                >
                                                    <Eye className="h-4 w-4" />
                                                    Review
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Review Modal */}
            {showModal && selectedAppeal && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-card rounded-xl border shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                        <div className="p-6">
                            <div className="flex items-center justify-between mb-6">
                                <h2 className="text-xl font-bold">Review Appeal</h2>
                                <button
                                    onClick={() => setShowModal(false)}
                                    className="p-2 hover:bg-muted rounded-lg transition-colors"
                                >
                                    <X className="h-5 w-5" />
                                </button>
                            </div>

                            {/* Order ID Badge */}
                            <div className="mb-4">
                                <span className="font-mono font-semibold bg-muted px-3 py-1 rounded text-sm">
                                    {selectedAppeal.order_id}
                                </span>
                            </div>

                            {/* Proof Image */}
                            <div className="mb-6">
                                <p className="text-sm text-muted-foreground mb-2 font-medium">Proof of Delivery</p>
                                <div
                                    className="cursor-pointer rounded-lg overflow-hidden border hover:border-primary transition-colors"
                                    onClick={() => setViewingImage(selectedAppeal.proof_image_url)}
                                >
                                    <Image
                                        src={selectedAppeal.proof_image_url}
                                        alt="Proof of delivery"
                                        width={400}
                                        height={300}
                                        className="w-full object-contain max-h-64"
                                    />
                                </div>
                            </div>

                            {/* Customer Info */}
                            <div className="mb-6 p-4 bg-muted/50 rounded-lg">
                                <div className="grid grid-cols-2 gap-3 text-sm">
                                    <div>
                                        <p className="text-muted-foreground text-xs mb-1">Email</p>
                                        <p className="font-medium">{selectedAppeal.customer_email}</p>
                                    </div>
                                    <div>
                                        <p className="text-muted-foreground text-xs mb-1">WhatsApp</p>
                                        <p className="font-medium">{selectedAppeal.customer_whatsapp}</p>
                                    </div>
                                    <div className="col-span-2">
                                        <p className="text-muted-foreground text-xs mb-1">Submitted</p>
                                        <p className="font-medium">{formatDate(selectedAppeal.created_at)}</p>
                                    </div>
                                </div>
                            </div>

                            {/* Admin Notes */}
                            <div className="mb-4">
                                <label className="block text-sm font-medium mb-1.5">
                                    Admin Notes <span className="text-muted-foreground">(optional)</span>
                                </label>
                                <textarea
                                    value={adminNotes}
                                    onChange={(e) => setAdminNotes(e.target.value)}
                                    className="w-full px-3 py-2 border rounded-lg bg-background focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all resize-none"
                                    rows={2}
                                    placeholder="Internal notes..."
                                />
                            </div>

                            {/* Rejection Reason */}
                            <div className="mb-6">
                                <label className="block text-sm font-medium mb-1.5">
                                    Rejection Reason <span className="text-muted-foreground">(required if rejecting)</span>
                                </label>
                                <textarea
                                    value={rejectionReason}
                                    onChange={(e) => setRejectionReason(e.target.value)}
                                    className="w-full px-3 py-2 border rounded-lg bg-background focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all resize-none"
                                    rows={2}
                                    placeholder="e.g., Image is unclear, cannot verify package..."
                                />
                            </div>

                            {/* Actions */}
                            <div className="flex gap-3">
                                <button
                                    onClick={() => handleAction('APPROVE')}
                                    disabled={processing}
                                    className="flex-1 px-4 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors flex items-center justify-center gap-2 font-medium"
                                >
                                    <Check className="h-4 w-4" />
                                    {processing ? 'Processing...' : 'Approve'}
                                </button>
                                <button
                                    onClick={() => handleAction('REJECT')}
                                    disabled={processing}
                                    className="flex-1 px-4 py-2.5 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 transition-colors flex items-center justify-center gap-2 font-medium"
                                >
                                    <X className="h-4 w-4" />
                                    {processing ? 'Processing...' : 'Reject'}
                                </button>
                                <button
                                    onClick={() => setShowModal(false)}
                                    disabled={processing}
                                    className="px-4 py-2.5 bg-muted text-muted-foreground rounded-lg hover:bg-muted/80 disabled:opacity-50 transition-colors"
                                >
                                    Cancel
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Image Viewer Modal */}
            {viewingImage && (
                <div
                    className="fixed inset-0 bg-black/95 flex items-center justify-center z-50 p-4"
                    onClick={() => setViewingImage(null)}
                >
                    <div className="max-w-4xl max-h-[90vh]">
                        <Image
                            src={viewingImage}
                            alt="Proof of delivery - Full size"
                            width={800}
                            height={600}
                            className="max-w-full max-h-[90vh] object-contain rounded-lg"
                        />
                    </div>
                    <button
                        onClick={() => setViewingImage(null)}
                        className="absolute top-4 right-4 p-2 bg-white/10 hover:bg-white/20 rounded-full transition-colors"
                    >
                        <X className="h-6 w-6 text-white" />
                    </button>
                </div>
            )}
        </div>
    );
}
