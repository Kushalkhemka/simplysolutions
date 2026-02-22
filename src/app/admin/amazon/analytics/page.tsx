import { createClient } from '@/lib/supabase/server';
import {
    BarChart3,
    TrendingUp,
    Package,
    Key,
    CheckCircle,
    Clock,
    ShoppingBag,
    Truck
} from 'lucide-react';
import OrdersChart from '@/components/admin/OrdersChart';

export default async function AmazonAnalyticsPage() {
    const supabase = await createClient();

    // Get today's date boundaries
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayISO = today.toISOString();

    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowISO = tomorrow.toISOString();

    // Get 7 days ago
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const sevenDaysAgoISO = sevenDaysAgo.toISOString();

    // Get 30 days ago
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const thirtyDaysAgoISO = thirtyDaysAgo.toISOString();

    // === TODAY'S METRICS ===

    // MFN Orders synced today
    const { count: mfnTodayCount } = await supabase
        .from('amazon_orders')
        .select('*', { count: 'exact', head: true })
        .eq('fulfillment_type', 'amazon_mfn')
        .gte('created_at', todayISO)
        .lt('created_at', tomorrowISO);

    // FBA Orders synced today
    const { count: fbaTodayCount } = await supabase
        .from('amazon_orders')
        .select('*', { count: 'exact', head: true })
        .eq('fulfillment_type', 'amazon_fba')
        .gte('created_at', todayISO)
        .lt('created_at', tomorrowISO);

    // License keys added today
    const { count: keysAddedTodayCount } = await supabase
        .from('amazon_activation_license_keys')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', todayISO)
        .lt('created_at', tomorrowISO);

    // License keys redeemed today (is_redeemed = true and order has today's date)
    const { data: redeemedToday } = await supabase
        .from('amazon_orders')
        .select('license_key_id')
        .not('license_key_id', 'is', null)
        .gte('created_at', todayISO)
        .lt('created_at', tomorrowISO);

    const keysRedeemedTodayCount = redeemedToday?.length || 0;

    // === WEEKLY METRICS ===

    // Weekly orders (MFN + FBA)
    const { count: weeklyOrdersCount } = await supabase
        .from('amazon_orders')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', sevenDaysAgoISO);

    // Weekly keys redeemed
    const { data: weeklyRedeemed } = await supabase
        .from('amazon_orders')
        .select('license_key_id')
        .not('license_key_id', 'is', null)
        .gte('created_at', sevenDaysAgoISO);

    const weeklyRedeemedCount = weeklyRedeemed?.length || 0;

    // === MONTHLY METRICS ===

    // Monthly orders (MFN + FBA)
    const { count: monthlyOrdersCount } = await supabase
        .from('amazon_orders')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', thirtyDaysAgoISO);

    // Monthly keys redeemed
    const { data: monthlyRedeemed } = await supabase
        .from('amazon_orders')
        .select('license_key_id')
        .not('license_key_id', 'is', null)
        .gte('created_at', thirtyDaysAgoISO);

    const monthlyRedeemedCount = monthlyRedeemed?.length || 0;

    // === INVENTORY STATS ===

    // Total available keys
    const { count: availableKeysCount } = await supabase
        .from('amazon_activation_license_keys')
        .select('*', { count: 'exact', head: true })
        .eq('is_redeemed', false);

    // Total redeemed keys
    const { count: totalRedeemedKeysCount } = await supabase
        .from('amazon_activation_license_keys')
        .select('*', { count: 'exact', head: true })
        .eq('is_redeemed', true);

    // === TOP FSNs BY REDEMPTION ===

    // Get FSN redemption counts
    const { data: fsnRedemptions } = await supabase
        .from('amazon_activation_license_keys')
        .select('fsn')
        .eq('is_redeemed', true);

    // Aggregate by FSN
    const fsnCounts: Record<string, number> = {};
    (fsnRedemptions || []).forEach((item: { fsn: string }) => {
        if (item.fsn) {
            fsnCounts[item.fsn] = (fsnCounts[item.fsn] || 0) + 1;
        }
    });

    // Sort and get top 5
    const topFsns = Object.entries(fsnCounts)
        .map(([fsn, count]) => ({ fsn, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);

    // Get FSN to product name mapping
    const { data: fsnMappings } = await supabase
        .from('amazon_asin_mapping')
        .select('fsn, product_title')
        .in('fsn', topFsns.map(f => f.fsn));

    const fsnNameMap: Record<string, string> = {};
    (fsnMappings || []).forEach((m: { fsn: string; product_title: string }) => {
        fsnNameMap[m.fsn] = m.product_title;
    });

    const topFsnsWithNames = topFsns.map(f => ({
        ...f,
        name: fsnNameMap[f.fsn] || f.fsn
    }));

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold">Amazon Analytics</h1>
                <p className="text-muted-foreground">Order sync and license key insights</p>
            </div>

            {/* Today's Metrics */}
            <div>
                <h2 className="text-lg font-semibold mb-4">Today&apos;s Activity</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="bg-card border rounded-lg p-6">
                        <div className="flex items-center gap-4">
                            <div className="bg-blue-100 dark:bg-blue-900/30 w-12 h-12 rounded-lg flex items-center justify-center">
                                <Truck className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground">MFN Orders Synced</p>
                                <p className="text-2xl font-bold">{mfnTodayCount || 0}</p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-card border rounded-lg p-6">
                        <div className="flex items-center gap-4">
                            <div className="bg-orange-100 dark:bg-orange-900/30 w-12 h-12 rounded-lg flex items-center justify-center">
                                <Package className="h-6 w-6 text-orange-600 dark:text-orange-400" />
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground">FBA Orders Synced</p>
                                <p className="text-2xl font-bold">{fbaTodayCount || 0}</p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-card border rounded-lg p-6">
                        <div className="flex items-center gap-4">
                            <div className="bg-green-100 dark:bg-green-900/30 w-12 h-12 rounded-lg flex items-center justify-center">
                                <Key className="h-6 w-6 text-green-600 dark:text-green-400" />
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground">Keys Added</p>
                                <p className="text-2xl font-bold">{keysAddedTodayCount || 0}</p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-card border rounded-lg p-6">
                        <div className="flex items-center gap-4">
                            <div className="bg-purple-100 dark:bg-purple-900/30 w-12 h-12 rounded-lg flex items-center justify-center">
                                <CheckCircle className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground">Keys Redeemed</p>
                                <p className="text-2xl font-bold">{keysRedeemedTodayCount}</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Orders Chart */}
            <OrdersChart />

            {/* Weekly & Monthly Metrics */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Weekly */}
                <div className="bg-card border rounded-lg">
                    <div className="p-4 border-b">
                        <h2 className="font-semibold flex items-center gap-2">
                            <Clock className="h-5 w-5" />
                            Last 7 Days
                        </h2>
                    </div>
                    <div className="p-4 grid grid-cols-2 gap-4">
                        <div className="text-center p-4 bg-muted/50 rounded-lg">
                            <p className="text-3xl font-bold">{weeklyOrdersCount || 0}</p>
                            <p className="text-sm text-muted-foreground">Orders Synced</p>
                        </div>
                        <div className="text-center p-4 bg-muted/50 rounded-lg">
                            <p className="text-3xl font-bold">{weeklyRedeemedCount}</p>
                            <p className="text-sm text-muted-foreground">Keys Redeemed</p>
                        </div>
                    </div>
                </div>

                {/* Monthly */}
                <div className="bg-card border rounded-lg">
                    <div className="p-4 border-b">
                        <h2 className="font-semibold flex items-center gap-2">
                            <BarChart3 className="h-5 w-5" />
                            Last 30 Days
                        </h2>
                    </div>
                    <div className="p-4 grid grid-cols-2 gap-4">
                        <div className="text-center p-4 bg-muted/50 rounded-lg">
                            <p className="text-3xl font-bold">{monthlyOrdersCount || 0}</p>
                            <p className="text-sm text-muted-foreground">Orders Synced</p>
                        </div>
                        <div className="text-center p-4 bg-muted/50 rounded-lg">
                            <p className="text-3xl font-bold">{monthlyRedeemedCount}</p>
                            <p className="text-sm text-muted-foreground">Keys Redeemed</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Inventory Overview */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-card border rounded-lg p-6">
                    <div className="flex items-center gap-4">
                        <div className="bg-emerald-100 dark:bg-emerald-900/30 w-12 h-12 rounded-lg flex items-center justify-center">
                            <Key className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
                        </div>
                        <div>
                            <p className="text-sm text-muted-foreground">Available Keys (Total)</p>
                            <p className="text-2xl font-bold">{availableKeysCount || 0}</p>
                        </div>
                    </div>
                </div>

                <div className="bg-card border rounded-lg p-6">
                    <div className="flex items-center gap-4">
                        <div className="bg-rose-100 dark:bg-rose-900/30 w-12 h-12 rounded-lg flex items-center justify-center">
                            <TrendingUp className="h-6 w-6 text-rose-600 dark:text-rose-400" />
                        </div>
                        <div>
                            <p className="text-sm text-muted-foreground">Redeemed Keys (Total)</p>
                            <p className="text-2xl font-bold">{totalRedeemedKeysCount || 0}</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Top Products by Redemption */}
            <div className="bg-card border rounded-lg">
                <div className="p-4 border-b">
                    <h2 className="font-semibold flex items-center gap-2">
                        <ShoppingBag className="h-5 w-5" />
                        Top Products by Key Redemption
                    </h2>
                </div>
                <div className="divide-y">
                    {topFsnsWithNames.map((item, idx) => (
                        <div key={item.fsn} className="p-4 flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <span className="text-lg font-bold text-muted-foreground w-6">#{idx + 1}</span>
                                <div>
                                    <p className="font-medium line-clamp-1">{item.name}</p>
                                    <p className="text-sm text-muted-foreground">FSN: {item.fsn}</p>
                                </div>
                            </div>
                            <div className="text-right">
                                <p className="font-bold">{item.count}</p>
                                <p className="text-xs text-muted-foreground">keys redeemed</p>
                            </div>
                        </div>
                    ))}
                    {topFsnsWithNames.length === 0 && (
                        <p className="p-4 text-center text-muted-foreground">No redemption data yet</p>
                    )}
                </div>
            </div>
        </div>
    );
}
