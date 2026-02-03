'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';

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
                return <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full text-sm">Pending</span>;
            case 'APPROVED':
                return <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-sm">Approved</span>;
            case 'REJECTED':
                return <span className="px-2 py-1 bg-red-100 text-red-800 rounded-full text-sm">Rejected</span>;
            default:
                return null;
        }
    };

    return (
        <div className="p-6">
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Early Delivery Appeals</h1>
                <p className="text-gray-600 dark:text-gray-400 mt-1">
                    Review customer requests to activate products before the standard delivery waiting period.
                </p>
            </div>

            {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-lg mb-4">
                    {error}
                </div>
            )}

            {/* Filters */}
            <div className="flex gap-2 mb-6">
                {['PENDING', 'APPROVED', 'REJECTED', ''].map((status) => (
                    <button
                        key={status || 'all'}
                        onClick={() => setFilter(status)}
                        className={`px-4 py-2 rounded-lg transition-colors ${filter === status
                                ? 'bg-blue-600 text-white'
                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300'
                            }`}
                    >
                        {status || 'All'} {status === 'PENDING' && appeals.length > 0 && `(${appeals.length})`}
                    </button>
                ))}
            </div>

            {/* Appeals List */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
                {loading ? (
                    <div className="p-8 text-center">
                        <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto"></div>
                        <p className="text-gray-500 mt-4">Loading appeals...</p>
                    </div>
                ) : appeals.length === 0 ? (
                    <div className="p-8 text-center text-gray-500 dark:text-gray-400">
                        No {filter.toLowerCase() || ''} appeals found.
                    </div>
                ) : (
                    <div className="divide-y divide-gray-200 dark:divide-gray-700">
                        {appeals.map((appeal) => (
                            <div key={appeal.id} className="p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50">
                                <div className="flex items-start gap-4">
                                    {/* Proof Image Thumbnail */}
                                    <div
                                        className="w-20 h-20 flex-shrink-0 cursor-pointer rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-700"
                                        onClick={() => setViewingImage(appeal.proof_image_url)}
                                    >
                                        <Image
                                            src={appeal.proof_image_url}
                                            alt="Proof of delivery"
                                            width={80}
                                            height={80}
                                            className="w-full h-full object-cover"
                                        />
                                    </div>

                                    {/* Appeal Details */}
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className="font-mono font-medium text-gray-900 dark:text-white">
                                                {appeal.order_id}
                                            </span>
                                            {getStatusBadge(appeal.status)}
                                        </div>
                                        <div className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                                            <p>📧 {appeal.customer_email}</p>
                                            <p>📱 {appeal.customer_whatsapp}</p>
                                            {appeal.order && (
                                                <p>📍 {appeal.order.city}, {appeal.order.state}</p>
                                            )}
                                            <p>🕐 Submitted: {formatDate(appeal.created_at)}</p>
                                            {appeal.reviewed_at && (
                                                <p className="text-xs">
                                                    Reviewed: {formatDate(appeal.reviewed_at)} by {appeal.reviewed_by}
                                                </p>
                                            )}
                                            {appeal.rejection_reason && (
                                                <p className="text-red-600">Reason: {appeal.rejection_reason}</p>
                                            )}
                                        </div>
                                    </div>

                                    {/* Actions */}
                                    {appeal.status === 'PENDING' && (
                                        <div className="flex-shrink-0">
                                            <button
                                                onClick={() => openReviewModal(appeal)}
                                                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                                            >
                                                Review
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Review Modal */}
            {showModal && selectedAppeal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white dark:bg-gray-800 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                        <div className="p-6">
                            <h2 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">
                                Review Appeal for {selectedAppeal.order_id}
                            </h2>

                            {/* Proof Image */}
                            <div className="mb-4">
                                <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Proof of Delivery:</p>
                                <div
                                    className="cursor-pointer rounded-lg overflow-hidden max-h-64"
                                    onClick={() => setViewingImage(selectedAppeal.proof_image_url)}
                                >
                                    <Image
                                        src={selectedAppeal.proof_image_url}
                                        alt="Proof of delivery"
                                        width={400}
                                        height={300}
                                        className="w-full object-contain"
                                    />
                                </div>
                            </div>

                            {/* Customer Info */}
                            <div className="mb-4 p-3 bg-gray-100 dark:bg-gray-700 rounded-lg">
                                <p><strong>Email:</strong> {selectedAppeal.customer_email}</p>
                                <p><strong>WhatsApp:</strong> {selectedAppeal.customer_whatsapp}</p>
                                <p><strong>Submitted:</strong> {formatDate(selectedAppeal.created_at)}</p>
                            </div>

                            {/* Admin Notes */}
                            <div className="mb-4">
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    Admin Notes (optional)
                                </label>
                                <textarea
                                    value={adminNotes}
                                    onChange={(e) => setAdminNotes(e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                    rows={2}
                                    placeholder="Internal notes..."
                                />
                            </div>

                            {/* Rejection Reason */}
                            <div className="mb-6">
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    Rejection Reason (required if rejecting)
                                </label>
                                <textarea
                                    value={rejectionReason}
                                    onChange={(e) => setRejectionReason(e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                    rows={2}
                                    placeholder="e.g., Image is unclear, cannot verify package..."
                                />
                            </div>

                            {/* Actions */}
                            <div className="flex gap-3">
                                <button
                                    onClick={() => handleAction('APPROVE')}
                                    disabled={processing}
                                    className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
                                >
                                    {processing ? 'Processing...' : '✓ Approve'}
                                </button>
                                <button
                                    onClick={() => handleAction('REJECT')}
                                    disabled={processing}
                                    className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
                                >
                                    {processing ? 'Processing...' : '✕ Reject'}
                                </button>
                                <button
                                    onClick={() => setShowModal(false)}
                                    disabled={processing}
                                    className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 disabled:opacity-50"
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
                    className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 p-4"
                    onClick={() => setViewingImage(null)}
                >
                    <div className="max-w-4xl max-h-[90vh]">
                        <Image
                            src={viewingImage}
                            alt="Proof of delivery - Full size"
                            width={800}
                            height={600}
                            className="max-w-full max-h-[90vh] object-contain"
                        />
                    </div>
                    <button
                        onClick={() => setViewingImage(null)}
                        className="absolute top-4 right-4 text-white text-4xl hover:opacity-70"
                    >
                        ×
                    </button>
                </div>
            )}
        </div>
    );
}
