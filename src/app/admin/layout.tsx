import { redirect } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import {
    LayoutDashboard,
    Package,
    ShoppingCart,
    Key,
    Users,
    Tag,
    BarChart3,
    Settings,
    LogOut
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

    if (profile?.role !== 'admin') {
        redirect('/dashboard');
    }

    return (
        <div className="min-h-screen flex bg-muted/30">
            {/* Sidebar */}
            <aside className="w-64 bg-card border-r hidden lg:block">
                <div className="h-full flex flex-col">
                    {/* Logo */}
                    <div className="p-6 border-b">
                        <Link href="/admin">
                            <h1 className="text-xl font-bold">
                                Simply<span className="text-primary">Admin</span>
                            </h1>
                        </Link>
                    </div>

                    {/* Navigation */}
                    <nav className="flex-1 p-4 space-y-1">
                        {sidebarLinks.map((link) => (
                            <Link
                                key={link.href}
                                href={link.href}
                                className="flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors hover:bg-accent"
                            >
                                <link.icon className="h-5 w-5" />
                                {link.name}
                            </Link>
                        ))}
                    </nav>

                    {/* Footer */}
                    <div className="p-4 border-t">
                        <Link
                            href="/"
                            className="flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium text-muted-foreground hover:bg-accent"
                        >
                            <LogOut className="h-5 w-5" />
                            Back to Store
                        </Link>
                    </div>
                </div>
            </aside>

            {/* Main Content */}
            <div className="flex-1 flex flex-col">
                {/* Top Bar */}
                <header className="h-16 border-b bg-card flex items-center justify-between px-6">
                    <div className="lg:hidden">
                        <h1 className="text-lg font-bold">Admin Panel</h1>
                    </div>
                    <div className="flex items-center gap-4 ml-auto">
                        <span className="text-sm text-muted-foreground">{user.email}</span>
                    </div>
                </header>

                {/* Page Content */}
                <main className="flex-1 p-6">
                    {children}
                </main>
            </div>
        </div>
    );
}
