import { createClient } from '@/lib/supabase/server';
import { successResponse, errorResponse, unauthorizedResponse } from '@/lib/utils/api-response';

// GET /api/admin/dashboard - Get admin dashboard stats
export async function GET() {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return unauthorizedResponse();
        }

        // Check admin role
        const { data: profile } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', user.id)
            .single();

        if (profile?.role !== 'admin' && profile?.role !== 'super_admin') {
            return unauthorizedResponse('Admin access required');
        }

        // Get counts
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
            .select('*', { count: 'exact', head: true })
            .eq('role', 'customer');

        // Revenue stats
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        const { data: monthlyOrders } = await supabase
            .from('orders')
            .select('total_amount')
            .eq('status', 'delivered')
            .gte('created_at', thirtyDaysAgo.toISOString());

        const monthlyRevenue = (monthlyOrders || []).reduce(
            (sum: number, o: any) => sum + (o.total_amount || 0), 0
        );

        // Today's stats
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const { data: todayOrders } = await supabase
            .from('orders')
            .select('total_amount')
            .eq('status', 'delivered')
            .gte('created_at', today.toISOString());

        const todayRevenue = (todayOrders || []).reduce(
            (sum: number, o: any) => sum + (o.total_amount || 0), 0
        );

        // Low stock products
        const { data: lowStockProducts } = await supabase
            .from('products')
            .select('id, name, stock_quantity')
            .eq('is_active', true)
            .lt('stock_quantity', 10)
            .order('stock_quantity', { ascending: true })
            .limit(5);

        // Recent orders
        const { data: recentOrders } = await supabase
            .from('orders')
            .select('id, order_number, status, total_amount, created_at, billing_name')
            .order('created_at', { ascending: false })
            .limit(5);

        return successResponse({
            stats: {
                totalProducts: totalProducts || 0,
                totalOrders: totalOrders || 0,
                pendingOrders: pendingOrders || 0,
                totalCustomers: totalCustomers || 0,
                monthlyRevenue,
                todayRevenue,
                todayOrders: todayOrders?.length || 0,
            },
            lowStockProducts: lowStockProducts || [],
            recentOrders: recentOrders || [],
        });
    } catch (error) {
        console.error('Admin dashboard error:', error);
        return errorResponse('Internal server error', 500);
    }
}
