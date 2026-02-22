import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import {
    Package,
    ShoppingCart,
    DollarSign,
    Users,
    TrendingUp,
    TrendingDown,
    ArrowRight,
    Key,
    AlertTriangle
} from 'lucide-react';

export default async function AdminDashboardPage() {
    const supabase = await createClient();

    // Fetch dashboard stats
    const { count: totalProducts } = await supabase
        .from('products')
        .select('*', { count: 'exact', head: true })
        .eq('is_active', true);

    const { count: totalOrders } = await supabase
        .from('orders')
        .select('*', { count: 'exact', head: true });

    const { count: pendingOrders } = await supabase
        .from('orders')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'paid');

    const { count: totalCustomers } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true });

    // Revenue calculation (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const { data: recentOrders } = await supabase
        .from('orders')
        .select('total_amount')
        .eq('status', 'delivered')
        .gte('created_at', thirtyDaysAgo.toISOString());

    const monthlyRevenue = (recentOrders || []).reduce((sum: number, order: any) =>
        sum + (order.total_amount || 0), 0
    );

    // Latest orders
    const { data: latestOrders } = await supabase
        .from('orders')
        .select('id, order_number, status, total_amount, created_at, billing_name, items')
        .order('created_at', { ascending: false })
        .limit(5);

    // Low stock products
    const { data: lowStockProducts } = await supabase
        .from('products')
        .select('id, name, stock_quantity')
        .eq('is_active', true)
        .lt('stock_quantity', 10)
        .order('stock_quantity', { ascending: true })
        .limit(5);

    // License keys - simple total counts (detailed view is on /admin/amazon/inventory)
    const { count: totalAvailableKeysCount } = await supabase
        .from('amazon_activation_license_keys')
        .select('*', { count: 'exact', head: true })
        .eq('is_redeemed', false);

    const totalAvailableKeys = totalAvailableKeysCount || 0;

    const stats = [
        {
            name: 'Total Products',
            value: totalProducts || 0,
            icon: Package,
            color: 'bg-blue-500',
            href: '/admin/products',
        },
        {
            name: 'Total Orders',
            value: totalOrders || 0,
            icon: ShoppingCart,
            color: 'bg-green-500',
            href: '/admin/orders',
        },
        {
            name: 'Monthly Revenue',
            value: `₹${monthlyRevenue.toLocaleString('en-IN')}`,
            icon: DollarSign,
            color: 'bg-yellow-500',
            href: '/admin/analytics',
        },
        {
            name: 'License Keys Available',
            value: totalAvailableKeys.toLocaleString(),
            icon: Key,
            color: 'bg-purple-500',
            href: '/admin/amazon/inventory',
        },
    ];

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'delivered': return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400';
            case 'paid': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400';
            case 'pending': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400';
            default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400';
        }
    };

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-xl sm:text-2xl font-bold">Dashboard</h1>
                <p className="text-sm text-muted-foreground">Welcome to the admin panel</p>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
                {stats.map((stat) => (
                    <Link key={stat.name} href={stat.href}>
                        <div className="bg-card border rounded-lg p-4 sm:p-6 hover:border-primary transition-colors">
                            <div className="flex items-center gap-3 sm:gap-4">
                                <div className={`${stat.color} w-10 h-10 sm:w-12 sm:h-12 rounded-lg flex items-center justify-center shrink-0`}>
                                    <stat.icon className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
                                </div>
                                <div className="min-w-0">
                                    <p className="text-xs sm:text-sm text-muted-foreground truncate">{stat.name}</p>
                                    <p className="text-lg sm:text-2xl font-bold truncate">{stat.value}</p>
                                </div>
                            </div>
                        </div>
                    </Link>
                ))}
            </div>

            <div className="grid lg:grid-cols-2 gap-4 sm:gap-6">
                {/* Recent Orders */}
                <div className="bg-card border rounded-lg overflow-hidden">
                    <div className="p-4 border-b flex items-center justify-between">
                        <h2 className="font-semibold">Recent Orders</h2>
                        <Link href="/admin/orders" className="text-sm text-primary hover:underline flex items-center gap-1">
                            View All <ArrowRight className="h-4 w-4" />
                        </Link>
                    </div>
                    <div className="divide-y">
                        {latestOrders?.map((order: any) => {
                            const itemCount = Array.isArray(order.items) ? order.items.reduce((sum: number, item: any) => sum + (item.quantity || 1), 0) : 0;
                            return (
                                <Link key={order.id} href={`/admin/orders/${order.id}`}>
                                    <div className="p-4 hover:bg-muted/50 transition-colors">
                                        <div className="flex items-center justify-between gap-3">
                                            <div className="min-w-0 flex-1">
                                                <p className="font-medium text-sm truncate">{order.order_number}</p>
                                                <p className="text-xs text-muted-foreground truncate">{order.billing_name}</p>
                                            </div>
                                            <div className="text-right shrink-0">
                                                <p className="font-medium text-sm">₹{order.total_amount?.toLocaleString('en-IN')}</p>
                                                <div className="flex items-center gap-1.5 justify-end mt-0.5">
                                                    {itemCount > 0 && (
                                                        <span className="text-xs text-muted-foreground">{itemCount} item{itemCount !== 1 ? 's' : ''}</span>
                                                    )}
                                                    <span className={`text-xs px-1.5 py-0.5 rounded ${getStatusColor(order.status)}`}>
                                                        {order.status}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </Link>
                            );
                        })}
                        {(!latestOrders || latestOrders.length === 0) && (
                            <p className="p-4 text-center text-muted-foreground">No orders yet</p>
                        )}
                    </div>
                </div>

                {/* Low Stock Alert */}
                <div className="bg-card border rounded-lg overflow-hidden">
                    <div className="p-4 border-b flex items-center justify-between">
                        <h2 className="font-semibold flex items-center gap-2">
                            <TrendingDown className="h-4 w-4 text-red-500" />
                            Low Stock
                        </h2>
                        <Link href="/admin/products" className="text-sm text-primary hover:underline flex items-center gap-1">
                            Manage <ArrowRight className="h-4 w-4" />
                        </Link>
                    </div>
                    <div className="divide-y">
                        {lowStockProducts?.map((product: any) => (
                            <div key={product.id} className="p-4 flex items-center justify-between gap-3">
                                <p className="font-medium text-sm truncate min-w-0 flex-1">{product.name}</p>
                                <span className={`text-xs font-medium px-2 py-1 rounded shrink-0 ${product.stock_quantity === 0 ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400' : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
                                    }`}>
                                    {product.stock_quantity} left
                                </span>
                            </div>
                        ))}
                        {(!lowStockProducts || lowStockProducts.length === 0) && (
                            <p className="p-4 text-center text-muted-foreground">All products are well stocked</p>
                        )}
                    </div>
                </div>
            </div>

            {/* License Keys Quick View */}
            <div className="bg-card border rounded-lg">
                <div className="p-4 border-b flex items-center justify-between">
                    <h2 className="font-semibold flex items-center gap-2">
                        <Key className="h-4 w-4 text-primary" />
                        License Key Inventory
                    </h2>
                    <Link href="/admin/amazon/inventory" className="text-sm text-primary hover:underline flex items-center gap-1">
                        View Inventory <ArrowRight className="h-4 w-4" />
                    </Link>
                </div>
                <div className="p-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-2xl font-bold text-green-700 dark:text-green-400">{totalAvailableKeys.toLocaleString()}</p>
                            <p className="text-sm text-muted-foreground">Available Keys</p>
                        </div>
                        <Link
                            href="/admin/amazon/inventory"
                            className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:opacity-90"
                        >
                            View by FSN
                        </Link>
                    </div>
                </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-card border rounded-lg p-6">
                <h2 className="font-semibold mb-4">Quick Actions</h2>
                <div className="flex flex-wrap gap-3">
                    <Link href="/admin/products/new">
                        <button className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90">
                            Add Product
                        </button>
                    </Link>
                    <Link href="/admin/licenses/add">
                        <button className="px-4 py-2 bg-secondary text-secondary-foreground rounded-lg text-sm font-medium hover:bg-secondary/80">
                            Add License Keys
                        </button>
                    </Link>
                    <Link href="/admin/coupons/new">
                        <button className="px-4 py-2 bg-secondary text-secondary-foreground rounded-lg text-sm font-medium hover:bg-secondary/80">
                            Create Coupon
                        </button>
                    </Link>
                </div>
            </div>
        </div>
    );
}
