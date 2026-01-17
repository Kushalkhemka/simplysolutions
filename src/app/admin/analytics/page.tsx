import { createClient } from '@/lib/supabase/server';
import { BarChart3, TrendingUp, Package, ShoppingCart } from 'lucide-react';

export default async function AdminAnalyticsPage() {
    const supabase = await createClient();

    // Last 7 days stats
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const { data: recentOrders } = await supabase
        .from('orders')
        .select('total_amount, created_at, status')
        .gte('created_at', sevenDaysAgo.toISOString());

    const weeklyRevenue = (recentOrders || [])
        .filter((o: any) => o.status === 'delivered')
        .reduce((sum: number, o: any) => sum + (o.total_amount || 0), 0);

    const weeklyOrders = recentOrders?.length || 0;

    // Last 30 days stats
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const { data: monthlyOrders } = await supabase
        .from('orders')
        .select('total_amount, status')
        .gte('created_at', thirtyDaysAgo.toISOString());

    const monthlyRevenue = (monthlyOrders || [])
        .filter((o: any) => o.status === 'delivered')
        .reduce((sum: number, o: any) => sum + (o.total_amount || 0), 0);

    // Top selling products
    const { data: topProducts } = await supabase
        .from('products')
        .select('id, name, sold_count, price')
        .order('sold_count', { ascending: false })
        .limit(5);

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold">Analytics</h1>
                <p className="text-muted-foreground">Business overview and insights</p>
            </div>

            {/* Key Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-card border rounded-lg p-6">
                    <div className="flex items-center gap-4">
                        <div className="bg-green-100 w-12 h-12 rounded-lg flex items-center justify-center">
                            <TrendingUp className="h-6 w-6 text-green-600" />
                        </div>
                        <div>
                            <p className="text-sm text-muted-foreground">Weekly Revenue</p>
                            <p className="text-2xl font-bold">₹{weeklyRevenue.toLocaleString('en-IN')}</p>
                        </div>
                    </div>
                </div>

                <div className="bg-card border rounded-lg p-6">
                    <div className="flex items-center gap-4">
                        <div className="bg-blue-100 w-12 h-12 rounded-lg flex items-center justify-center">
                            <ShoppingCart className="h-6 w-6 text-blue-600" />
                        </div>
                        <div>
                            <p className="text-sm text-muted-foreground">Weekly Orders</p>
                            <p className="text-2xl font-bold">{weeklyOrders}</p>
                        </div>
                    </div>
                </div>

                <div className="bg-card border rounded-lg p-6">
                    <div className="flex items-center gap-4">
                        <div className="bg-purple-100 w-12 h-12 rounded-lg flex items-center justify-center">
                            <BarChart3 className="h-6 w-6 text-purple-600" />
                        </div>
                        <div>
                            <p className="text-sm text-muted-foreground">Monthly Revenue</p>
                            <p className="text-2xl font-bold">₹{monthlyRevenue.toLocaleString('en-IN')}</p>
                        </div>
                    </div>
                </div>

                <div className="bg-card border rounded-lg p-6">
                    <div className="flex items-center gap-4">
                        <div className="bg-yellow-100 w-12 h-12 rounded-lg flex items-center justify-center">
                            <Package className="h-6 w-6 text-yellow-600" />
                        </div>
                        <div>
                            <p className="text-sm text-muted-foreground">Monthly Orders</p>
                            <p className="text-2xl font-bold">{monthlyOrders?.length || 0}</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Top Products */}
            <div className="bg-card border rounded-lg">
                <div className="p-4 border-b">
                    <h2 className="font-semibold">Top Selling Products</h2>
                </div>
                <div className="divide-y">
                    {topProducts?.map((product: any, idx: number) => (
                        <div key={product.id} className="p-4 flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <span className="text-lg font-bold text-muted-foreground w-6">#{idx + 1}</span>
                                <div>
                                    <p className="font-medium">{product.name}</p>
                                    <p className="text-sm text-muted-foreground">
                                        ₹{product.price.toLocaleString('en-IN')}
                                    </p>
                                </div>
                            </div>
                            <div className="text-right">
                                <p className="font-bold">{product.sold_count}</p>
                                <p className="text-xs text-muted-foreground">units sold</p>
                            </div>
                        </div>
                    ))}
                    {(!topProducts || topProducts.length === 0) && (
                        <p className="p-4 text-center text-muted-foreground">No sales data yet</p>
                    )}
                </div>
            </div>
        </div>
    );
}
