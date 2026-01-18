import { createClient } from '@/lib/supabase/server';
import { CheckCircle, Clock, Mail } from 'lucide-react';

export default async function ProductRequestsPage() {
    const supabase = await createClient();

    // Fetch product requests
    const { data: requests, count } = await supabase
        .from('product_requests')
        .select('*', { count: 'exact' })
        .order('created_at', { ascending: false })
        .limit(50);

    // Group by type
    const requestsByType = {
        autocad: requests?.filter(r => r.request_type === 'autocad') || [],
        canva: requests?.filter(r => r.request_type === 'canva') || [],
        '365e5': requests?.filter(r => r.request_type === '365e5') || [],
        other: requests?.filter(r => !['autocad', 'canva', '365e5'].includes(r.request_type)) || [],
    };

    const pendingCount = requests?.filter(r => !r.is_completed).length || 0;

    const getTypeBadge = (type: string) => {
        const colors: Record<string, string> = {
            autocad: 'bg-red-100 text-red-800',
            canva: 'bg-purple-100 text-purple-800',
            '365e5': 'bg-blue-100 text-blue-800',
            other: 'bg-gray-100 text-gray-800'
        };
        return <span className={`px-2 py-1 rounded text-xs font-medium ${colors[type] || colors.other}`}>{type.toUpperCase()}</span>;
    };

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold">Product Requests</h1>
                <p className="text-muted-foreground">Manage subscription product requests ({count?.toLocaleString()} total)</p>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-4 gap-4">
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <p className="text-2xl font-bold text-yellow-800">{pendingCount}</p>
                    <p className="text-sm text-yellow-600">Pending</p>
                </div>
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <p className="text-2xl font-bold text-red-800">{requestsByType.autocad.length}</p>
                    <p className="text-sm text-red-600">AutoCAD</p>
                </div>
                <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                    <p className="text-2xl font-bold text-purple-800">{requestsByType.canva.length}</p>
                    <p className="text-sm text-purple-600">Canva</p>
                </div>
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <p className="text-2xl font-bold text-blue-800">{requestsByType['365e5'].length}</p>
                    <p className="text-sm text-blue-600">Office 365</p>
                </div>
            </div>

            {/* Requests Table */}
            <div className="bg-card border rounded-lg overflow-hidden">
                <table className="w-full">
                    <thead className="bg-muted/50">
                        <tr>
                            <th className="px-4 py-3 text-left text-sm font-medium">Email</th>
                            <th className="px-4 py-3 text-left text-sm font-medium">Order ID</th>
                            <th className="px-4 py-3 text-left text-sm font-medium">Type</th>
                            <th className="px-4 py-3 text-left text-sm font-medium">Mobile</th>
                            <th className="px-4 py-3 text-left text-sm font-medium">Status</th>
                            <th className="px-4 py-3 text-left text-sm font-medium">Date</th>
                            <th className="px-4 py-3 text-left text-sm font-medium">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y">
                        {requests?.map((request: any) => (
                            <tr key={request.id} className={`hover:bg-muted/30 ${!request.is_completed ? 'bg-yellow-50/50' : ''}`}>
                                <td className="px-4 py-3 text-sm">{request.email}</td>
                                <td className="px-4 py-3 font-mono text-sm">{request.order_id || '-'}</td>
                                <td className="px-4 py-3">{getTypeBadge(request.request_type)}</td>
                                <td className="px-4 py-3 text-sm">{request.mobile_number || '-'}</td>
                                <td className="px-4 py-3">
                                    {request.is_completed ? (
                                        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                            <CheckCircle className="h-3 w-3" /> Completed
                                        </span>
                                    ) : (
                                        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                                            <Clock className="h-3 w-3" /> Pending
                                        </span>
                                    )}
                                </td>
                                <td className="px-4 py-3 text-sm text-muted-foreground">
                                    {new Date(request.created_at).toLocaleDateString()}
                                </td>
                                <td className="px-4 py-3">
                                    <a href={`mailto:${request.email}`} className="text-primary hover:underline flex items-center gap-1 text-sm">
                                        <Mail className="h-3 w-3" /> Email
                                    </a>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>

                {(!requests || requests.length === 0) && (
                    <div className="p-8 text-center text-muted-foreground">
                        No product requests found
                    </div>
                )}
            </div>
        </div>
    );
}
