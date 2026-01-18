import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';
import { Search, Filter, Eye, CheckCircle, XCircle, Clock } from 'lucide-react';

export default async function AmazonOrdersPage() {
    const supabase = await createClient();

    // Fetch Amazon orders with pagination
    const { data: orders, count } = await supabase
        .from('amazon_orders')
        .select('*', { count: 'exact' })
        .order('created_at', { ascending: false })
        .limit(50);

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'APPROVED':
                return <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800"><CheckCircle className="h-3 w-3" /> Approved</span>;
            case 'REJECTED':
                return <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800"><XCircle className="h-3 w-3" /> Rejected</span>;
            default:
                return <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800"><Clock className="h-3 w-3" /> Pending</span>;
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold">Amazon Orders</h1>
                    <p className="text-muted-foreground">Manage Amazon activation orders ({count?.toLocaleString()} total)</p>
                </div>
            </div>

            {/* Search and Filter */}
            <div className="flex gap-4">
                <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <input
                        type="text"
                        placeholder="Search by Order ID..."
                        className="w-full pl-10 pr-4 py-2 border rounded-lg bg-background"
                    />
                </div>
                <button className="flex items-center gap-2 px-4 py-2 border rounded-lg hover:bg-accent">
                    <Filter className="h-4 w-4" />
                    Filter
                </button>
            </div>

            {/* Orders Table */}
            <div className="bg-card border rounded-lg overflow-hidden">
                <table className="w-full">
                    <thead className="bg-muted/50">
                        <tr>
                            <th className="px-4 py-3 text-left text-sm font-medium">Order ID</th>
                            <th className="px-4 py-3 text-left text-sm font-medium">FSN</th>
                            <th className="px-4 py-3 text-left text-sm font-medium">Contact</th>
                            <th className="px-4 py-3 text-left text-sm font-medium">Warranty</th>
                            <th className="px-4 py-3 text-left text-sm font-medium">Type</th>
                            <th className="px-4 py-3 text-left text-sm font-medium">GetCID</th>
                            <th className="px-4 py-3 text-left text-sm font-medium">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y">
                        {orders?.map((order: any) => (
                            <tr key={order.id} className="hover:bg-muted/30">
                                <td className="px-4 py-3 font-mono text-sm">{order.order_id}</td>
                                <td className="px-4 py-3 text-sm text-muted-foreground">{order.fsn || '-'}</td>
                                <td className="px-4 py-3 text-sm">{order.contact_email || order.contact_phone || '-'}</td>
                                <td className="px-4 py-3">{getStatusBadge(order.warranty_status)}</td>
                                <td className="px-4 py-3 text-sm">
                                    <span className={`px-2 py-1 rounded text-xs ${order.fulfillment_type === 'amazon_fba' ? 'bg-blue-100 text-blue-800' : 'bg-purple-100 text-purple-800'}`}>
                                        {order.fulfillment_type === 'amazon_fba' ? 'FBA' : 'Digital'}
                                    </span>
                                </td>
                                <td className="px-4 py-3">
                                    {order.getcid_used ? (
                                        <span className="text-green-600 text-sm">Used</span>
                                    ) : (
                                        <span className="text-muted-foreground text-sm">-</span>
                                    )}
                                </td>
                                <td className="px-4 py-3">
                                    <Link href={`/admin/amazon/orders/${order.id}`} className="text-primary hover:underline">
                                        <Eye className="h-4 w-4" />
                                    </Link>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>

                {(!orders || orders.length === 0) && (
                    <div className="p-8 text-center text-muted-foreground">
                        No orders found
                    </div>
                )}
            </div>
        </div>
    );
}
