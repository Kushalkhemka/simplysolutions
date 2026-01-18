import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';
import Image from 'next/image';
import { CheckCircle, XCircle, Clock, ExternalLink } from 'lucide-react';

export default async function WarrantyClaimsPage() {
    const supabase = await createClient();

    // Fetch warranty registrations
    const { data: warranties, count } = await supabase
        .from('warranty_registrations')
        .select('*', { count: 'exact' })
        .order('created_at', { ascending: false })
        .limit(50);

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'VERIFIED':
                return <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800"><CheckCircle className="h-3 w-3" /> Verified</span>;
            case 'REJECTED':
                return <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800"><XCircle className="h-3 w-3" /> Rejected</span>;
            default:
                return <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800"><Clock className="h-3 w-3" /> Processing</span>;
        }
    };

    // Count by status
    const processingCount = warranties?.filter(w => w.status === 'PROCESSING').length || 0;
    const verifiedCount = warranties?.filter(w => w.status === 'VERIFIED').length || 0;
    const rejectedCount = warranties?.filter(w => w.status === 'REJECTED').length || 0;

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold">Warranty Claims</h1>
                <p className="text-muted-foreground">Review and approve warranty registrations ({count?.toLocaleString()} total)</p>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-4">
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <p className="text-2xl font-bold text-yellow-800">{processingCount}</p>
                    <p className="text-sm text-yellow-600">Pending Review</p>
                </div>
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <p className="text-2xl font-bold text-green-800">{verifiedCount}</p>
                    <p className="text-sm text-green-600">Verified</p>
                </div>
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <p className="text-2xl font-bold text-red-800">{rejectedCount}</p>
                    <p className="text-sm text-red-600">Rejected</p>
                </div>
            </div>

            {/* Warranty Table */}
            <div className="bg-card border rounded-lg overflow-hidden">
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
                        {warranties?.map((warranty: any) => (
                            <tr key={warranty.id} className="hover:bg-muted/30">
                                <td className="px-4 py-3 font-mono text-sm">{warranty.order_id}</td>
                                <td className="px-4 py-3 text-sm">{warranty.contact || '-'}</td>
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
                                <td className="px-4 py-3">
                                    <Link href={`/admin/amazon/warranty/${warranty.id}`} className="text-primary hover:underline text-sm">
                                        Review
                                    </Link>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>

                {(!warranties || warranties.length === 0) && (
                    <div className="p-8 text-center text-muted-foreground">
                        No warranty claims found
                    </div>
                )}
            </div>
        </div>
    );
}
