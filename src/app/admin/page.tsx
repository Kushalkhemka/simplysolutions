import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import {
    Package,
    ShoppingCart,
    DollarSign,
    Users,
    TrendingUp,
    TrendingDown,
    ArrowRight
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
        .select('id, order_number, status, total_amount, created_at, billing_name')
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
            name: 'Total Customers',
            value: totalCustomers || 0,
            icon: Users,
            color: 'bg-purple-500',
            href: '/admin/customers',
        },
    ];

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'delivered': return 'bg-green-100 text-green-800';
            case 'paid': return 'bg-blue-100 text-blue-800';
            case 'pending': return 'bg-yellow-100 text-yellow-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-2xl font-bold">Dashboard</h1>
                <p className="text-muted-foreground">Welcome to the admin panel</p>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {stats.map((stat) => (
                    <Link key={stat.name} href={stat.href}>
                        <div className="bg-card border rounded-lg p-6 hover:border-primary transition-colors">
                            <div className="flex items-center gap-4">
                                <div className={`${stat.color} w-12 h-12 rounded-lg flex items-center justify-center`}>
                                    <stat.icon className="h-6 w-6 text-white" />
                                </div>
                                <div>
                                    <p className="text-sm text-muted-foreground">{stat.name}</p>
                                    <p className="text-2xl font-bold">{stat.value}</p>
                                </div>
                            </div>
                        </div>
                    </Link>
                ))}
            </div>

            <div className="grid lg:grid-cols-2 gap-6">
                {/* Recent Orders */}
                <div className="bg-card border rounded-lg">
                    <div className="p-4 border-b flex items-center justify-between">
                        <h2 className="font-semibold">Recent Orders</h2>
                        <Link href="/admin/orders" className="text-sm text-primary hover:underline flex items-center gap-1">
                            View All <ArrowRight className="h-4 w-4" />
                        </Link>
                    </div>
                    <div className="divide-y">
                        {latestOrders?.map((order: any) => (
                            <Link key={order.id} href={`/admin/orders/${order.id}`}>
                                <div className="p-4 hover:bg-muted/50 transition-colors">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="font-medium">{order.order_number}</p>
                                            <p className="text-sm text-muted-foreground">{order.billing_name}</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="font-medium">₹{order.total_amount?.toLocaleString('en-IN')}</p>
                                            <span className={`text-xs px-2 py-0.5 rounded ${getStatusColor(order.status)}`}>
                                                {order.status}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </Link>
                        ))}
                        {(!latestOrders || latestOrders.length === 0) && (
                            <p className="p-4 text-center text-muted-foreground">No orders yet</p>
                        )}
                    </div>
                </div>

                {/* Low Stock Alert */}
                <div className="bg-card border rounded-lg">
                    <div className="p-4 border-b flex items-center justify-between">
                        <h2 className="font-semibold flex items-center gap-2">
                            <TrendingDown className="h-4 w-4 text-red-500" />
                            Low Stock Alert
                        </h2>
                        <Link href="/admin/products" className="text-sm text-primary hover:underline flex items-center gap-1">
                            Manage <ArrowRight className="h-4 w-4" />
                        </Link>
                    </div>
                    <div className="divide-y">
                        {lowStockProducts?.map((product: any) => (
                            <div key={product.id} className="p-4 flex items-center justify-between">
                                <p className="font-medium truncate flex-1">{product.name}</p>
                                <span className={`text-sm font-medium px-2 py-1 rounded ${product.stock_quantity === 0 ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'
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
