import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { AdminHeader } from '@/components/admin/AdminHeader';
import { AdminLayoutClient } from '@/components/admin/AdminLayoutClient';
import {
    LayoutDashboard,
    Package,
    ShoppingCart,
    Key,
    Users,
    Tag,
    BarChart3,
    Settings,
    ShoppingBag,
    Shield,
    Mail,
    Terminal,
    AlertTriangle,
    Plus,
    ShieldX,
    BarChart2,
    RefreshCw
} from 'lucide-react';

const sidebarLinks = [
    { name: 'Dashboard', href: '/admin', icon: LayoutDashboard },
    { name: 'Products', href: '/admin/products', icon: Package },
    { name: 'Orders', href: '/admin/orders', icon: ShoppingCart },
    { name: 'License Keys', href: '/admin/licenses', icon: Key },
    { name: 'Customers', href: '/admin/customers', icon: Users },
    { name: 'Coupons', href: '/admin/coupons', icon: Tag },
    { name: 'Analytics', href: '/admin/analytics', icon: BarChart3 },
    { name: 'Settings', href: '/admin/settings', icon: Settings },
];

const amazonLinks = [
    { name: 'Analytics', href: '/admin/amazon/analytics', icon: BarChart3 },
    { name: 'Amazon Orders', href: '/admin/amazon/orders', icon: ShoppingBag },
    { name: 'License Keys', href: '/admin/amazon/keys', icon: Key },
    { name: 'Key Replacements', href: '/admin/replacement-requests', icon: RefreshCw },
    { name: 'Key Inventory', href: '/admin/amazon/inventory', icon: BarChart2 },
    { name: 'Manual Order', href: '/admin/amazon/manual-order', icon: Plus },
    { name: 'Activation Issues', href: '/admin/amazon/issues', icon: AlertTriangle },
    { name: 'Fraud Orders', href: '/admin/amazon/fraud', icon: ShieldX },
    { name: 'Warranty Claims', href: '/admin/amazon/warranty', icon: Shield },
    { name: 'Product Requests', href: '/admin/amazon/requests', icon: Mail },
    { name: 'GetCID Test', href: '/admin/amazon/getcid', icon: Terminal },
];

export default async function AdminLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        redirect('/login');
    }

    // Check if user is admin
    const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();

    if (!profile || (profile.role !== 'admin' && profile.role !== 'super_admin')) {
        redirect('/dashboard');
    }

    return (
        <div className="min-h-screen flex bg-muted/30">
            <AdminLayoutClient
                sidebarLinks={sidebarLinks}
                amazonLinks={amazonLinks}
            >
                {/* Top Bar */}
                <AdminHeader userEmail={user.email || ''} />

                {/* Page Content */}
                <main className="flex-1 p-4 sm:p-6">
                    {children}
                </main>
            </AdminLayoutClient>
        </div>
    );
}
