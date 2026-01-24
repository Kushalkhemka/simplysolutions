'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
    Menu, X, LogOut, LayoutDashboard, Package, ShoppingCart, Key,
    Users, Tag, BarChart3, Settings, ShoppingBag, Shield, Mail,
    Terminal, AlertTriangle, Plus, ShieldX, BarChart2, RefreshCw
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

interface AdminLayoutClientProps {
    children: React.ReactNode;
}

export function AdminLayoutClient({ children }: AdminLayoutClientProps) {
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const pathname = usePathname();

    const isActive = (href: string) => {
        if (href === '/admin') {
            return pathname === href;
        }
        return pathname.startsWith(href);
    };

    const closeMobileMenu = () => setIsMobileMenuOpen(false);

    return (
        <div className="flex w-full min-h-screen">
            {/* Mobile Header - Fixed at top on mobile */}
            <div className="lg:hidden fixed top-0 left-0 right-0 z-40 bg-card border-b px-4 py-3 flex items-center justify-between">
                <Link href="/admin" onClick={closeMobileMenu}>
                    <h1 className="text-lg font-bold">
                        Simply<span className="text-primary">Admin</span>
                    </h1>
                </Link>
                <button
                    onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                    className="p-2 hover:bg-accent rounded-lg transition-colors"
                    aria-label="Toggle menu"
                >
                    {isMobileMenuOpen ? (
                        <X className="h-6 w-6" />
                    ) : (
                        <Menu className="h-6 w-6" />
                    )}
                </button>
            </div>

            {/* Mobile Overlay */}
            {isMobileMenuOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-40 lg:hidden"
                    onClick={closeMobileMenu}
                />
            )}

            {/* Sidebar - Desktop & Mobile */}
            <aside className={`
                fixed lg:sticky top-0 left-0 z-50 h-screen w-72 bg-card border-r shrink-0
                transform transition-transform duration-300 ease-in-out
                lg:transform-none
                ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
            `}>
                <div className="h-full flex flex-col">
                    {/* Logo - Desktop Only */}
                    <div className="p-6 border-b hidden lg:block">
                        <Link href="/admin">
                            <h1 className="text-xl font-bold">
                                Simply<span className="text-primary">Admin</span>
                            </h1>
                        </Link>
                    </div>

                    {/* Navigation */}
                    <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
                        {sidebarLinks.map((link) => (
                            <Link
                                key={link.href}
                                href={link.href}
                                onClick={closeMobileMenu}
                                className={`flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${isActive(link.href)
                                    ? 'bg-primary text-primary-foreground'
                                    : 'hover:bg-accent'
                                    }`}
                            >
                                <link.icon className="h-5 w-5" />
                                {link.name}
                            </Link>
                        ))}

                        {/* Amazon Section */}
                        <div className="pt-4 mt-4 border-t">
                            <p className="px-4 py-2 text-xs font-semibold text-muted-foreground uppercase">
                                Amazon Activation
                            </p>
                            {amazonLinks.map((link) => (
                                <Link
                                    key={link.href}
                                    href={link.href}
                                    onClick={closeMobileMenu}
                                    className={`flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${isActive(link.href)
                                        ? 'bg-primary text-primary-foreground'
                                        : 'hover:bg-accent'
                                        }`}
                                >
                                    <link.icon className="h-5 w-5" />
                                    {link.name}
                                </Link>
                            ))}
                        </div>
                    </nav>

                    {/* Footer */}
                    <div className="p-4 border-t">
                        <Link
                            href="/"
                            onClick={closeMobileMenu}
                            className="flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium text-muted-foreground hover:bg-accent"
                        >
                            <LogOut className="h-5 w-5" />
                            Back to Store
                        </Link>
                    </div>
                </div>
            </aside>

            {/* Main Content - Takes full width on mobile */}
            <div className="flex-1 flex flex-col min-h-screen w-full lg:w-auto pt-[52px] lg:pt-0">
                {children}
            </div>
        </div>
    );
}
