'use client';

import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import Link from 'next/link';
import { CheckCircle, XCircle, Clock, ExternalLink, ChevronLeft, ChevronRight, Loader2, Search, Eye, X, Package, Phone, Mail, Calendar, Image as ImageIcon, AlertTriangle } from 'lucide-react';

interface WarrantyRegistration {
    id: string;
    order_id: string;
    contact: string | null;
    email: string | null;
    phone: string | null;
    status: string;
    screenshot_seller_feedback: string | null;
    screenshot_product_review: string | null;
    product_name: string | null;
    notes: string | null;
    created_at: string;
    updated_at: string;
}

export default function WarrantyClaimsClient() {
    const [warranties, setWarranties] = useState<WarrantyRegistration[]>([]);
    const [totalCount, setTotalCount] = useState(0);
    const [currentPage, setCurrentPage] = useState(1);
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState<string>('all');
    const [isLoading, setIsLoading] = useState(true);
    const [selectedWarranty, setSelectedWarranty] = useState<WarrantyRegistration | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);

    // Stats
    const [processingCount, setProcessingCount] = useState(0);
    const [verifiedCount, setVerifiedCount] = useState(0);
    const [rejectedCount, setRejectedCount] = useState(0);
    const [resubmissionCount, setResubmissionCount] = useState(0);

    const pageSize = 50;
    const supabase = createClient();

    const fetchStats = useCallback(async () => {
        // Get counts by status
        const { count: processing } = await supabase
            .from('warranty_registrations')
            .select('*', { count: 'exact', head: true })
            .eq('status', 'PROCESSING');

        const { count: verified } = await supabase
            .from('warranty_registrations')
            .select('*', { count: 'exact', head: true })
            .eq('status', 'VERIFIED');

        const { count: rejected } = await supabase
            .from('warranty_registrations')
            .select('*', { count: 'exact', head: true })
            .eq('status', 'REJECTED');

        const { count: resubmission } = await supabase
            .from('warranty_registrations')
            .select('*', { count: 'exact', head: true })
            .eq('status', 'NEEDS_RESUBMISSION');

        setProcessingCount(processing || 0);
        setVerifiedCount(verified || 0);
        setRejectedCount(rejected || 0);
        setResubmissionCount(resubmission || 0);
    }, [supabase]);

    const fetchWarranties = useCallback(async () => {
        setIsLoading(true);
        const from = (currentPage - 1) * pageSize;
        const to = from + pageSize - 1;

        let query = supabase
            .from('warranty_registrations')
            .select('*', { count: 'exact' })
            .order('created_at', { ascending: false });

        if (searchQuery) {
            query = query.or(`order_id.ilike.%${searchQuery}%,contact.ilike.%${searchQuery}%`);
        }

        if (statusFilter !== 'all') {
            query = query.eq('status', statusFilter);
        }

        const { data, count, error } = await query.range(from, to);

        if (error) {
            console.error('Error fetching warranties:', error);
        } else {
            setWarranties(data || []);
            setTotalCount(count || 0);
        }
        setIsLoading(false);
    }, [currentPage, searchQuery, statusFilter, supabase]);

    useEffect(() => {
        fetchWarranties();
        fetchStats();
    }, [fetchWarranties, fetchStats]);

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        setCurrentPage(1);
        fetchWarranties();
    };

    const viewDetails = (warranty: WarrantyRegistration) => {
        setSelectedWarranty(warranty);
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setSelectedWarranty(null);
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'VERIFIED':
                return <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"><CheckCircle className="h-3 w-3" /> Verified</span>;
            case 'REJECTED':
                return <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400"><XCircle className="h-3 w-3" /> Rejected</span>;
            case 'NEEDS_RESUBMISSION':
                return <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400"><AlertTriangle className="h-3 w-3" /> Resubmission</span>;
            default:
                return <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400"><Clock className="h-3 w-3" /> Processing</span>;
        }
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
            <div>
                <h1 className="text-2xl font-bold">Warranty Claims</h1>
                <p className="text-muted-foreground">Review and approve warranty registrations ({totalCount.toLocaleString()} total)</p>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-4 gap-4">
                <button
                    onClick={() => { setStatusFilter('PROCESSING'); setCurrentPage(1); }}
                    className={`bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4 text-left hover:ring-2 hover:ring-yellow-400 transition-all ${statusFilter === 'PROCESSING' ? 'ring-2 ring-yellow-400' : ''}`}
                >
                    <p className="text-2xl font-bold text-yellow-800 dark:text-yellow-400">{processingCount.toLocaleString()}</p>
                    <p className="text-sm text-yellow-600 dark:text-yellow-500">Pending Review</p>
                </button>
                <button
                    onClick={() => { setStatusFilter('NEEDS_RESUBMISSION'); setCurrentPage(1); }}
                    className={`bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg p-4 text-left hover:ring-2 hover:ring-orange-400 transition-all ${statusFilter === 'NEEDS_RESUBMISSION' ? 'ring-2 ring-orange-400' : ''}`}
                >
                    <p className="text-2xl font-bold text-orange-800 dark:text-orange-400">{resubmissionCount.toLocaleString()}</p>
                    <p className="text-sm text-orange-600 dark:text-orange-500">Needs Resubmission</p>
                </button>
                <button
                    onClick={() => { setStatusFilter('VERIFIED'); setCurrentPage(1); }}
                    className={`bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4 text-left hover:ring-2 hover:ring-green-400 transition-all ${statusFilter === 'VERIFIED' ? 'ring-2 ring-green-400' : ''}`}
                >
                    <p className="text-2xl font-bold text-green-800 dark:text-green-400">{verifiedCount.toLocaleString()}</p>
                    <p className="text-sm text-green-600 dark:text-green-500">Verified</p>
                </button>
                <button
                    onClick={() => { setStatusFilter('REJECTED'); setCurrentPage(1); }}
                    className={`bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 text-left hover:ring-2 hover:ring-red-400 transition-all ${statusFilter === 'REJECTED' ? 'ring-2 ring-red-400' : ''}`}
                >
                    <p className="text-2xl font-bold text-red-800 dark:text-red-400">{rejectedCount.toLocaleString()}</p>
                    <p className="text-sm text-red-600 dark:text-red-500">Rejected</p>
                </button>
            </div>

            {/* Search and Filter */}
            <form onSubmit={handleSearch} className="flex gap-4">
                <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <input
                        type="text"
                        placeholder="Search by Order ID or Contact..."
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

            {/* Warranty Table */}
            <div className="bg-card border rounded-lg overflow-hidden">
                {isLoading ? (
                    <div className="p-8 text-center">
                        <Loader2 className="h-8 w-8 animate-spin mx-auto text-muted-foreground" />
                        <p className="mt-2 text-muted-foreground">Loading warranties...</p>
                    </div>
                ) : (
                    <>
                        <table className="w-full">
                            <thead className="bg-muted/50">
                                <tr>
                                    <th className="px-4 py-3 text-left text-sm font-medium">Order ID</th>
                                    <th className="px-4 py-3 text-left text-sm font-medium">Contact</th>
                                    <th className="px-4 py-3 text-left text-sm font-medium">Status</th>
                                    <th className="px-4 py-3 text-left text-sm font-medium">Seller Feedback</th>
                                    <th className="px-4 py-3 text-left text-sm font-medium">Product Review</th>
                                    <th className="px-4 py-3 text-left text-sm font-medium">Date</th>
                                    <th className="px-4 py-3 text-left text-sm font-medium">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y">
                                {warranties.map((warranty) => (
                                    <tr key={warranty.id} className="hover:bg-muted/30">
                                        <td className="px-4 py-3 font-mono text-sm">{warranty.order_id}</td>
                                        <td className="px-4 py-3 text-sm">{warranty.contact || warranty.email || warranty.phone || '-'}</td>
                                        <td className="px-4 py-3">{getStatusBadge(warranty.status)}</td>
                                        <td className="px-4 py-3">
                                            {warranty.screenshot_seller_feedback ? (
                                                <a href={warranty.screenshot_seller_feedback} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline flex items-center gap-1">
                                                    <ExternalLink className="h-3 w-3" /> View
                                                </a>
                                            ) : '-'}
                                        </td>
                                        <td className="px-4 py-3">
                                            {warranty.screenshot_product_review ? (
                                                <a href={warranty.screenshot_product_review} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline flex items-center gap-1">
                                                    <ExternalLink className="h-3 w-3" /> View
                                                </a>
                                            ) : '-'}
                                        </td>
                                        <td className="px-4 py-3 text-sm text-muted-foreground">
                                            {new Date(warranty.created_at).toLocaleDateString()}
                                        </td>
                                        <td className="px-4 py-3 flex items-center gap-2">
                                            <button
                                                onClick={() => viewDetails(warranty)}
                                                className="text-primary hover:text-primary/80 transition-colors"
                                                title="View Details"
                                            >
                                                <Eye className="h-4 w-4" />
                                            </button>
                                            <Link href={`/admin/amazon/warranty/${warranty.id}`} className="text-primary hover:underline text-sm">
                                                Review
                                            </Link>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>

                        {warranties.length === 0 && (
                            <div className="p-8 text-center text-muted-foreground">
                                No warranty claims found
                            </div>
                        )}
                    </>
                )}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
                <div className="flex items-center justify-between">
                    <p className="text-sm text-muted-foreground">
                        Showing {((currentPage - 1) * pageSize) + 1} to {Math.min(currentPage * pageSize, totalCount)} of {totalCount.toLocaleString()} claims
                    </p>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                            disabled={currentPage === 1}
                            className="p-2 border rounded-lg hover:bg-accent disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <ChevronLeft className="h-4 w-4" />
                        </button>
                        <span className="px-3 py-2 text-sm">
                            Page {currentPage} of {totalPages}
                        </span>
                        <button
                            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                            disabled={currentPage === totalPages}
                            className="p-2 border rounded-lg hover:bg-accent disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <ChevronRight className="h-4 w-4" />
                        </button>
                    </div>
                </div>
            )}

            {/* Details Modal */}
            {isModalOpen && selectedWarranty && (
                <div className="fixed inset-0 z-50 flex items-center justify-center">
                    <div className="absolute inset-0 bg-black/50" onClick={closeModal} />
                    <div className="relative bg-card border rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto m-4">
                        <div className="sticky top-0 bg-card border-b px-6 py-4 flex items-center justify-between">
                            <h2 className="text-xl font-bold">Warranty Details</h2>
                            <button onClick={closeModal} className="p-2 hover:bg-muted rounded-full transition-colors">
                                <X className="h-5 w-5" />
                            </button>
                        </div>

                        <div className="p-6 space-y-4">
                            {/* Order ID */}
                            <div className="flex items-start gap-4 p-4 bg-muted/30 rounded-lg">
                                <div className="p-2 bg-blue-100 rounded-lg">
                                    <Package className="h-5 w-5 text-blue-600" />
                                </div>
                                <div className="flex-1">
                                    <p className="text-xs text-muted-foreground uppercase tracking-wide">Order ID</p>
                                    <p className="font-mono font-medium">{selectedWarranty.order_id}</p>
                                </div>
                            </div>

                            {/* Product Name */}
                            {selectedWarranty.product_name && (
                                <div className="flex items-start gap-4 p-4 bg-muted/30 rounded-lg">
                                    <div className="p-2 bg-orange-100 rounded-lg">
                                        <Package className="h-5 w-5 text-orange-600" />
                                    </div>
                                    <div className="flex-1">
                                        <p className="text-xs text-muted-foreground uppercase tracking-wide">Product Name</p>
                                        <p className="font-medium">{selectedWarranty.product_name}</p>
                                    </div>
                                </div>
                            )}

                            {/* Contact Info */}
                            <div className="grid grid-cols-2 gap-4">
                                {(selectedWarranty.contact || selectedWarranty.email) && (
                                    <div className="flex items-start gap-4 p-4 bg-muted/30 rounded-lg">
                                        <div className="p-2 bg-green-100 rounded-lg">
                                            <Mail className="h-5 w-5 text-green-600" />
                                        </div>
                                        <div className="flex-1">
                                            <p className="text-xs text-muted-foreground uppercase tracking-wide">Email</p>
                                            <p className="font-medium break-all">{selectedWarranty.contact || selectedWarranty.email}</p>
                                        </div>
                                    </div>
                                )}
                                {selectedWarranty.phone && (
                                    <div className="flex items-start gap-4 p-4 bg-muted/30 rounded-lg">
                                        <div className="p-2 bg-purple-100 rounded-lg">
                                            <Phone className="h-5 w-5 text-purple-600" />
                                        </div>
                                        <div className="flex-1">
                                            <p className="text-xs text-muted-foreground uppercase tracking-wide">Phone</p>
                                            <p className="font-medium">{selectedWarranty.phone}</p>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Screenshots */}
                            <div className="grid grid-cols-2 gap-4">
                                <div className="flex items-start gap-4 p-4 bg-muted/30 rounded-lg">
                                    <div className="p-2 bg-amber-100 rounded-lg">
                                        <ImageIcon className="h-5 w-5 text-amber-600" />
                                    </div>
                                    <div className="flex-1">
                                        <p className="text-xs text-muted-foreground uppercase tracking-wide">Seller Feedback</p>
                                        {selectedWarranty.screenshot_seller_feedback ? (
                                            <a
                                                href={selectedWarranty.screenshot_seller_feedback}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="text-primary hover:underline flex items-center gap-1"
                                            >
                                                <ExternalLink className="h-4 w-4" /> View Screenshot
                                            </a>
                                        ) : (
                                            <span className="text-muted-foreground italic">Not Provided</span>
                                        )}
                                    </div>
                                </div>
                                <div className="flex items-start gap-4 p-4 bg-muted/30 rounded-lg">
                                    <div className="p-2 bg-teal-100 rounded-lg">
                                        <ImageIcon className="h-5 w-5 text-teal-600" />
                                    </div>
                                    <div className="flex-1">
                                        <p className="text-xs text-muted-foreground uppercase tracking-wide">Product Review</p>
                                        {selectedWarranty.screenshot_product_review ? (
                                            <a
                                                href={selectedWarranty.screenshot_product_review}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="text-primary hover:underline flex items-center gap-1"
                                            >
                                                <ExternalLink className="h-4 w-4" /> View Screenshot
                                            </a>
                                        ) : (
                                            <span className="text-muted-foreground italic">Not Provided</span>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Notes */}
                            {selectedWarranty.notes && (
                                <div className="p-4 bg-muted/30 rounded-lg">
                                    <p className="text-xs text-muted-foreground uppercase tracking-wide mb-2">Notes</p>
                                    <p className="text-sm">{selectedWarranty.notes}</p>
                                </div>
                            )}

                            {/* Timestamps */}
                            <div className="grid grid-cols-2 gap-4">
                                <div className="flex items-start gap-4 p-4 bg-muted/30 rounded-lg">
                                    <div className="p-2 bg-gray-100 rounded-lg">
                                        <Calendar className="h-5 w-5 text-gray-600" />
                                    </div>
                                    <div className="flex-1">
                                        <p className="text-xs text-muted-foreground uppercase tracking-wide">Created At</p>
                                        <p className="font-medium text-sm">{formatDate(selectedWarranty.created_at)}</p>
                                    </div>
                                </div>
                                <div className="flex items-start gap-4 p-4 bg-muted/30 rounded-lg">
                                    <div className="p-2 bg-indigo-100 rounded-lg">
                                        <Calendar className="h-5 w-5 text-indigo-600" />
                                    </div>
                                    <div className="flex-1">
                                        <p className="text-xs text-muted-foreground uppercase tracking-wide">Last Modified</p>
                                        <p className="font-medium text-sm">{formatDate(selectedWarranty.updated_at)}</p>
                                    </div>
                                </div>
                            </div>

                            {/* Status */}
                            <div className="flex items-center justify-between p-4 bg-muted/30 rounded-lg">
                                <div>
                                    <p className="text-xs text-muted-foreground uppercase tracking-wide">Status</p>
                                    <div className="mt-1">{getStatusBadge(selectedWarranty.status)}</div>
                                </div>
                                <Link
                                    href={`/admin/amazon/warranty/${selectedWarranty.id}`}
                                    className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90 text-sm"
                                >
                                    Review Claim
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
