'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import {
    ArrowLeft,
    CheckCircle,
    XCircle,
    Clock,
    AlertTriangle,
    ExternalLink,
    Loader2,
    Package,
    Mail,
    Calendar,
    Image as ImageIcon,
    Send
} from 'lucide-react';
import { toast } from 'sonner';

interface WarrantyDetails {
    id: string;
    order_id: string;
    customer_email: string | null;
    contact: string | null;
    status: string;
    screenshot_seller_feedback: string | null;
    screenshot_product_review: string | null;
    product_name: string | null;
    quantity: number | null;
    purchase_date: string | null;
    admin_notes: string | null;
    rejection_reason: string | null;
    missing_seller_feedback: boolean;
    missing_product_review: boolean;
    created_at: string;
    verified_at: string | null;
}

interface OrderDetails {
    productName: string | null;
    quantity: number;
    purchaseDate: string | null;
    orderTotal: string | null;
}

export default function WarrantyReviewPage({ params }: { params: Promise<{ id: string }> }) {
    const resolvedParams = use(params);
    const router = useRouter();
    const [warranty, setWarranty] = useState<WarrantyDetails | null>(null);
    const [orderDetails, setOrderDetails] = useState<OrderDetails | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(false);

    // Form state
    const [adminNotes, setAdminNotes] = useState('');
    const [missingSeller, setMissingSeller] = useState(false);
    const [missingReview, setMissingReview] = useState(false);

    useEffect(() => {
        fetchWarrantyDetails();
    }, [resolvedParams.id]);

    const fetchWarrantyDetails = async () => {
        try {
            const response = await fetch(`/api/admin/warranty/${resolvedParams.id}`);
            const data = await response.json();

            if (data.success) {
                setWarranty(data.warranty);
                setOrderDetails(data.orderDetails);
                setAdminNotes(data.warranty.admin_notes || '');
            } else {
                toast.error('Failed to load warranty details');
                router.push('/admin/amazon/warranty');
            }
        } catch (error) {
            console.error('Error fetching warranty:', error);
            toast.error('Failed to load warranty details');
        } finally {
            setIsLoading(false);
        }
    };

    const handleAction = async (action: 'approve' | 'reject' | 'resubmit') => {
        if (action === 'resubmit' && !missingSeller && !missingReview) {
            toast.error('Please select at least one missing screenshot');
            return;
        }

        if (!warranty?.customer_email) {
            toast.error('No customer email available to send notification');
        }

        setActionLoading(true);

        try {
            const response = await fetch(`/api/admin/warranty/${resolvedParams.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action,
                    adminNotes,
                    missingSeller,
                    missingReview
                })
            });

            const data = await response.json();

            if (data.success) {
                const messages: Record<string, string> = {
                    approve: 'Warranty approved! Customer notified.',
                    reject: 'Warranty rejected. Customer notified.',
                    resubmit: 'Resubmission request sent to customer.'
                };
                toast.success(messages[action] || 'Action completed');

                if (data.noEmail) {
                    toast.warning('No email was sent - customer email not available');
                }

                router.push('/admin/amazon/warranty');
            } else {
                toast.error(data.error || 'Action failed');
            }
        } catch (error) {
            console.error('Action error:', error);
            toast.error('Failed to process action');
        } finally {
            setActionLoading(false);
        }
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'VERIFIED':
                return <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800"><CheckCircle className="h-4 w-4" /> Verified</span>;
            case 'REJECTED':
                return <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium bg-red-100 text-red-800"><XCircle className="h-4 w-4" /> Rejected</span>;
            case 'NEEDS_RESUBMISSION':
                return <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium bg-orange-100 text-orange-800"><AlertTriangle className="h-4 w-4" /> Needs Resubmission</span>;
            default:
                return <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium bg-yellow-100 text-yellow-800"><Clock className="h-4 w-4" /> Processing</span>;
        }
    };

    const formatDate = (dateString: string | null) => {
        if (!dateString) return '-';
        return new Date(dateString).toLocaleString('en-IN', {
            day: 'numeric',
            month: 'long',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
        );
    }

    if (!warranty) {
        return (
            <div className="text-center py-12">
                <p className="text-muted-foreground">Warranty not found</p>
                <Link href="/admin/amazon/warranty" className="text-primary hover:underline mt-4 inline-block">
                    Back to Warranty Claims
                </Link>
            </div>
        );
    }

    return (
        <div className="space-y-6 max-w-4xl mx-auto">
            {/* Header */}
            <div className="flex items-center gap-4">
                <Link
                    href="/admin/amazon/warranty"
                    className="p-2 hover:bg-muted rounded-lg transition-colors"
                >
                    <ArrowLeft className="h-5 w-5" />
                </Link>
                <div>
                    <h1 className="text-2xl font-bold">Review Warranty Claim</h1>
                    <p className="text-muted-foreground">Order: {warranty.order_id}</p>
                </div>
                <div className="ml-auto">
                    {getStatusBadge(warranty.status)}
                </div>
            </div>

            {/* Order Details Card */}
            <div className="bg-card border rounded-xl p-6">
                <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
                    <Package className="h-5 w-5 text-primary" />
                    Order Details
                </h2>
                <div className="grid md:grid-cols-2 gap-4">
                    <div className="p-4 bg-muted/30 rounded-lg">
                        <p className="text-xs text-muted-foreground uppercase">Order ID</p>
                        <p className="font-mono font-bold">{warranty.order_id}</p>
                    </div>
                    <div className="p-4 bg-muted/30 rounded-lg">
                        <p className="text-xs text-muted-foreground uppercase">Product</p>
                        <p className="font-medium">{orderDetails?.productName || warranty.product_name || 'N/A'}</p>
                    </div>
                    <div className="p-4 bg-muted/30 rounded-lg">
                        <p className="text-xs text-muted-foreground uppercase">Quantity</p>
                        <p className="font-medium">{orderDetails?.quantity || warranty.quantity || 1}</p>
                    </div>
                    <div className="p-4 bg-muted/30 rounded-lg">
                        <p className="text-xs text-muted-foreground uppercase">Purchase Date</p>
                        <p className="font-medium">{formatDate(orderDetails?.purchaseDate || warranty.purchase_date)}</p>
                    </div>
                </div>
            </div>

            {/* Customer Info Card */}
            <div className="bg-card border rounded-xl p-6">
                <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
                    <Mail className="h-5 w-5 text-primary" />
                    Customer Information
                </h2>
                <div className="grid md:grid-cols-2 gap-4">
                    <div className="p-4 bg-muted/30 rounded-lg">
                        <p className="text-xs text-muted-foreground uppercase">Email</p>
                        <p className="font-medium break-all">{warranty.customer_email || warranty.contact || 'Not provided'}</p>
                    </div>
                    <div className="p-4 bg-muted/30 rounded-lg">
                        <p className="text-xs text-muted-foreground uppercase">Submitted</p>
                        <p className="font-medium">{formatDate(warranty.created_at)}</p>
                    </div>
                </div>
            </div>

            {/* Screenshots Card */}
            <div className="bg-card border rounded-xl p-6">
                <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
                    <ImageIcon className="h-5 w-5 text-primary" />
                    Screenshots
                </h2>
                <div className="grid md:grid-cols-2 gap-6">
                    {/* Seller Feedback Screenshot */}
                    <div>
                        <p className="text-sm font-medium mb-2">Seller Feedback</p>
                        {warranty.screenshot_seller_feedback ? (
                            <div className="border rounded-lg overflow-hidden">
                                <a href={warranty.screenshot_seller_feedback} target="_blank" rel="noopener noreferrer">
                                    <Image
                                        src={warranty.screenshot_seller_feedback}
                                        alt="Seller Feedback"
                                        width={400}
                                        height={300}
                                        className="w-full h-auto hover:opacity-90 transition-opacity"
                                        unoptimized
                                    />
                                </a>
                                <div className="p-2 bg-muted/50 flex justify-end">
                                    <a
                                        href={warranty.screenshot_seller_feedback}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-xs text-primary hover:underline flex items-center gap-1"
                                    >
                                        <ExternalLink className="h-3 w-3" /> Open Full Size
                                    </a>
                                </div>
                            </div>
                        ) : (
                            <div className="border-2 border-dashed border-orange-300 rounded-lg p-8 text-center bg-orange-50/50">
                                <AlertTriangle className="h-8 w-8 text-orange-500 mx-auto mb-2" />
                                <p className="text-orange-700 font-medium">Not Provided</p>
                            </div>
                        )}
                    </div>

                    {/* Product Review Screenshot */}
                    <div>
                        <p className="text-sm font-medium mb-2">Product Review</p>
                        {warranty.screenshot_product_review ? (
                            <div className="border rounded-lg overflow-hidden">
                                <a href={warranty.screenshot_product_review} target="_blank" rel="noopener noreferrer">
                                    <Image
                                        src={warranty.screenshot_product_review}
                                        alt="Product Review"
                                        width={400}
                                        height={300}
                                        className="w-full h-auto hover:opacity-90 transition-opacity"
                                        unoptimized
                                    />
                                </a>
                                <div className="p-2 bg-muted/50 flex justify-end">
                                    <a
                                        href={warranty.screenshot_product_review}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-xs text-primary hover:underline flex items-center gap-1"
                                    >
                                        <ExternalLink className="h-3 w-3" /> Open Full Size
                                    </a>
                                </div>
                            </div>
                        ) : (
                            <div className="border-2 border-dashed border-orange-300 rounded-lg p-8 text-center bg-orange-50/50">
                                <AlertTriangle className="h-8 w-8 text-orange-500 mx-auto mb-2" />
                                <p className="text-orange-700 font-medium">Not Provided</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Actions Card - Only show for PROCESSING status */}
            {warranty.status === 'PROCESSING' && (
                <div className="bg-card border rounded-xl p-6">
                    <h2 className="text-lg font-bold mb-4">Take Action</h2>

                    {/* Admin Notes */}
                    <div className="mb-6">
                        <label className="block text-sm font-medium mb-2">Admin Notes (Optional)</label>
                        <textarea
                            value={adminNotes}
                            onChange={(e) => setAdminNotes(e.target.value)}
                            placeholder="Add notes for rejection reason or instructions..."
                            className="w-full p-3 border rounded-lg bg-background resize-none"
                            rows={3}
                        />
                    </div>

                    {/* Missing Screenshot Checkboxes */}
                    <div className="mb-6 p-4 bg-orange-50 border border-orange-200 rounded-lg">
                        <p className="font-medium text-orange-800 mb-3">Request Resubmission (Missing Screenshot)</p>
                        <p className="text-sm text-orange-700 mb-4">If a screenshot is invalid or missing, check the box below. Customer will receive an email with instructions to resubmit.</p>
                        <div className="flex flex-wrap gap-4">
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={missingSeller}
                                    onChange={(e) => setMissingSeller(e.target.checked)}
                                    className="w-4 h-4 rounded border-gray-300 text-orange-600 focus:ring-orange-500"
                                />
                                <span className="text-sm">Missing/Invalid Seller Feedback</span>
                            </label>
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={missingReview}
                                    onChange={(e) => setMissingReview(e.target.checked)}
                                    className="w-4 h-4 rounded border-gray-300 text-orange-600 focus:ring-orange-500"
                                />
                                <span className="text-sm">Missing/Invalid Product Review</span>
                            </label>
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex flex-wrap gap-3">
                        <button
                            onClick={() => handleAction('approve')}
                            disabled={actionLoading}
                            className="flex-1 min-w-[150px] py-3 px-4 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                        >
                            {actionLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle className="h-4 w-4" />}
                            Approve Warranty
                        </button>

                        {(missingSeller || missingReview) && (
                            <button
                                onClick={() => handleAction('resubmit')}
                                disabled={actionLoading}
                                className="flex-1 min-w-[150px] py-3 px-4 bg-orange-500 hover:bg-orange-600 text-white font-medium rounded-lg transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                            >
                                {actionLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                                Request Resubmission
                            </button>
                        )}

                        <button
                            onClick={() => handleAction('reject')}
                            disabled={actionLoading}
                            className="flex-1 min-w-[150px] py-3 px-4 bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                        >
                            {actionLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <XCircle className="h-4 w-4" />}
                            Reject
                        </button>
                    </div>

                    {!warranty.customer_email && (
                        <p className="mt-4 text-sm text-yellow-600 bg-yellow-50 p-3 rounded-lg">
                            ⚠️ No customer email available. Customer will not receive email notifications.
                        </p>
                    )}
                </div>
            )}

            {/* Previous Admin Notes (if any) */}
            {warranty.status !== 'PROCESSING' && (warranty.admin_notes || warranty.rejection_reason) && (
                <div className="bg-card border rounded-xl p-6">
                    <h2 className="text-lg font-bold mb-4">Admin Notes</h2>
                    <p className="text-muted-foreground">{warranty.admin_notes || warranty.rejection_reason}</p>
                </div>
            )}
        </div>
    );
}
