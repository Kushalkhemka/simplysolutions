import Link from 'next/link';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { Package, Key, Heart, Settings, CreditCard } from 'lucide-react';

export default async function DashboardPage() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        redirect('/login');
    }

    // Fetch user stats
    const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

    const { count: orderCount } = await supabase
        .from('orders')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id);

    const { count: wishlistCount } = await supabase
        .from('wishlist')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id);

    // Get recent orders
    const { data: recentOrders } = await supabase
        .from('orders')
        .select('id, order_number, status, total_amount, created_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(5);

    const dashboardCards = [
        {
            title: 'My Orders',
            description: `${orderCount || 0} orders placed`,
            icon: Package,
            href: '/dashboard/orders',
            color: 'bg-blue-500',
        },
        {
            title: 'License Keys',
            description: 'View your software licenses',
            icon: Key,
            href: '/dashboard/licenses',
            color: 'bg-green-500',
        },
        {
            title: 'Wishlist',
            description: `${wishlistCount || 0} items saved`,
            icon: Heart,
            href: '/wishlist',
            color: 'bg-red-500',
        },
        {
            title: 'Account Settings',
            description: 'Manage your profile',
            icon: Settings,
            href: '/dashboard/settings',
            color: 'bg-purple-500',
        },
    ];

    return (
        <div className="container-dense py-8">
            {/* Welcome Section */}
            <div className="mb-8">
                <h1 className="text-2xl md:text-3xl font-bold">
                    Welcome back, {profile?.full_name || 'User'}!
                </h1>
                <p className="text-muted-foreground mt-1">{user.email}</p>
            </div>

            {/* Wallet Card */}
            {profile?.wallet_balance !== undefined && profile.wallet_balance > 0 && (
                <div className="bg-gradient-to-r from-primary to-primary/80 text-primary-foreground rounded-lg p-6 mb-8">
                    <div className="flex items-center gap-3">
                        <CreditCard className="h-8 w-8" />
                        <div>
                            <p className="text-sm opacity-90">Wallet Balance</p>
                            <p className="text-2xl font-bold">₹{profile.wallet_balance.toLocaleString('en-IN')}</p>
                        </div>
                    </div>
                </div>
            )}

            {/* Quick Actions */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                {dashboardCards.map((card) => (
                    <Link key={card.href} href={card.href}>
                        <div className="border rounded-lg p-6 hover:border-primary transition-colors">
                            <div className={`${card.color} w-12 h-12 rounded-lg flex items-center justify-center mb-4`}>
                                <card.icon className="h-6 w-6 text-white" />
                            </div>
                            <h3 className="font-semibold">{card.title}</h3>
                            <p className="text-sm text-muted-foreground">{card.description}</p>
                        </div>
                    </Link>
                ))}
            </div>

            {/* Recent Orders */}
            <div className="border rounded-lg">
                <div className="p-6 border-b">
                    <div className="flex items-center justify-between">
                        <h2 className="text-lg font-semibold">Recent Orders</h2>
                        <Link href="/dashboard/orders" className="text-sm text-primary hover:underline">
                            View All
                        </Link>
                    </div>
                </div>

                {recentOrders && recentOrders.length > 0 ? (
                    <div className="divide-y">
                        {recentOrders.map((order) => (
                            <Link key={order.id} href={`/dashboard/orders/${order.id}`}>
                                <div className="p-4 hover:bg-muted/50 transition-colors">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="font-medium">{order.order_number}</p>
                                            <p className="text-sm text-muted-foreground">
                                                {new Date(order.created_at).toLocaleDateString('en-IN', {
                                                    day: 'numeric',
                                                    month: 'short',
                                                    year: 'numeric',
                                                })}
                                            </p>
                                        </div>
                                        <div className="text-right">
                                            <p className="font-medium">₹{order.total_amount.toLocaleString('en-IN')}</p>
                                            <span className={`text-xs px-2 py-1 rounded ${order.status === 'delivered' ? 'bg-green-100 text-green-800' :
                                                order.status === 'paid' ? 'bg-blue-100 text-blue-800' :
                                                    'bg-gray-100 text-gray-800'
                                                }`}>
                                                {order.status}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </Link>
                        ))}
                    </div>
                ) : (
                    <div className="p-8 text-center text-muted-foreground">
                        <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
                        <p>No orders yet</p>
                        <Link href="/products" className="text-primary hover:underline mt-2 inline-block">
                            Start shopping
                        </Link>
                    </div>
                )}
            </div>
        </div>
    );
}
