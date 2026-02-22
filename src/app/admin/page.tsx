import { createClient } from '@/lib/supabase/server';
import DashboardClient from '@/components/admin/DashboardClient';

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

    // License keys
    const { count: totalAvailableKeysCount } = await supabase
        .from('amazon_activation_license_keys')
        .select('*', { count: 'exact', head: true })
        .eq('is_redeemed', false);

    const totalAvailableKeys = totalAvailableKeysCount || 0;

    const stats = [
        {
            name: 'Total Products',
            value: totalProducts || 0,
            iconName: 'Package',
            color: 'bg-blue-500',
            href: '/admin/products',
        },
        {
            name: 'Total Orders',
            value: totalOrders || 0,
            iconName: 'ShoppingCart',
            color: 'bg-green-500',
            href: '/admin/orders',
        },
        {
            name: 'Monthly Revenue',
            value: `₹${monthlyRevenue.toLocaleString('en-IN')}`,
            iconName: 'DollarSign',
            color: 'bg-yellow-500',
            href: '/admin/analytics',
            isSensitive: true,
        },
        {
            name: 'License Keys Available',
            value: totalAvailableKeys.toLocaleString(),
            iconName: 'Key',
            color: 'bg-purple-500',
            href: '/admin/amazon/inventory',
        },
    ];

    const formattedOrders = (latestOrders || []).map((order: any) => ({
        id: order.id,
        order_number: order.order_number,
        status: order.status,
        total_amount: order.total_amount,
        billing_name: order.billing_name,
        itemCount: Array.isArray(order.items) ? order.items.reduce((sum: number, item: any) => sum + (item.quantity || 1), 0) : 0,
    }));

    const formattedLowStock = (lowStockProducts || []).map((p: any) => ({
        id: p.id,
        name: p.name,
        stock_quantity: p.stock_quantity,
    }));

    return (
        <DashboardClient
            stats={stats}
            latestOrders={formattedOrders}
            lowStockProducts={formattedLowStock}
            totalAvailableKeys={totalAvailableKeys}
        />
    );
}
