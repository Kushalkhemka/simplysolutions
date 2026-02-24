'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
    Menu, X, LogOut, LayoutDashboard, Package, ShoppingCart, Key,
    Users, User, Tag, BarChart3, Settings, ShoppingBag, Shield, Mail,
    Terminal, AlertTriangle, Plus, ShieldX, BarChart2, RefreshCw, Database, Sparkles, Bell, MessageSquareWarning,
    Clock, FileCheck, Store, Activity, MessageSquare, ShieldAlert, DollarSign, KeyRound,
    ChevronsLeft, ChevronsRight
} from 'lucide-react';

const sidebarLinks = [
    { name: 'Dashboard', href: '/admin', icon: LayoutDashboard },
    { name: 'Products', href: '/admin/products', icon: Package },
    { name: 'Orders', href: '/admin/orders', icon: ShoppingCart },
    { name: 'Customers', href: '/admin/customers', icon: Users },
    { name: 'Coupons', href: '/admin/coupons', icon: Tag },
    { name: 'Welcome Offers', href: '/admin/welcome-offers', icon: Sparkles },
    { name: 'Analytics', href: '/admin/analytics', icon: BarChart3 },
    { name: 'Cron Dashboard', href: '/admin/cron-dashboard', icon: Activity },
    { name: 'Push Subscribers', href: '/admin/push-subscribers', icon: Bell },
    { name: 'Settings', href: '/admin/settings', icon: Settings },
];

const amazonLinks = [
    { name: 'Seller Accounts', href: '/admin/amazon/seller-accounts', icon: Store },
    { name: 'Analytics', href: '/admin/amazon/analytics', icon: BarChart3 },
    { name: 'Amazon Orders', href: '/admin/amazon/orders', icon: ShoppingBag },
    { name: 'License Keys', href: '/admin/amazon/keys', icon: Key },
    { name: 'Key Replacements', href: '/admin/replacement-requests', icon: RefreshCw },
    { name: 'O365 Customizations', href: '/admin/office365-customizations', icon: User },
    { name: 'Password Resets', href: '/admin/password-reset-requests', icon: KeyRound },
    { name: 'Key Inventory', href: '/admin/amazon/inventory', icon: BarChart2 },
    { name: 'Manual Order', href: '/admin/amazon/manual-order', icon: Plus },
    { name: 'Activation Issues', href: '/admin/amazon/issues', icon: AlertTriangle },
    { name: 'Fraud Orders', href: '/admin/amazon/fraud', icon: ShieldX },
    { name: 'Warranty Claims', href: '/admin/amazon/warranty', icon: Shield },
    { name: 'Safe-T Claims', href: '/admin/amazon/safe-t-claims', icon: DollarSign },
    { name: 'Feedback Appeals', href: '/admin/amazon/feedback-appeals', icon: MessageSquareWarning },
    { name: 'WhatsApp Logs', href: '/admin/whatsapp-logs', icon: MessageSquare },
    { name: 'Listing Alerts', href: '/admin/listing-alerts', icon: ShieldAlert },
    { name: 'Early Appeals', href: '/admin/amazon/early-appeals', icon: FileCheck },
    { name: 'FBA Settings', href: '/admin/amazon/fba-settings', icon: Clock },
    { name: 'Product Requests', href: '/admin/amazon/requests', icon: Mail },
    { name: 'Product Data', href: '/admin/amazon/products', icon: Database },
    { name: 'GetCID Test', href: '/admin/amazon/getcid', icon: Terminal },
    { name: 'GetCID Tokens', href: '/admin/amazon/getcid-tokens', icon: Database },
    { name: 'Gmail Enquiries', href: '/admin/gmail-enquiries', icon: Mail },
];

interface AdminLayoutClientProps {
    children: React.ReactNode;
}

export function AdminLayoutClient({ children }: AdminLayoutClientProps) {
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
    const pathname = usePathname();

    const isActive = (href: string) => {
        if (href === '/admin') {
            return pathname === href;
        }
        return pathname === href || pathname.startsWith(href + '/');
    };

    const closeMobileMenu = () => setIsMobileMenuOpen(false);
    const toggleSidebar = () => setIsSidebarCollapsed(!isSidebarCollapsed);

    const sidebarWidth = isSidebarCollapsed ? 'w-[68px]' : 'w-72';
    const mainMargin = isSidebarCollapsed ? 'lg:ml-[68px]' : 'lg:ml-72';

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
                fixed top-0 left-0 z-50 h-screen ${sidebarWidth} bg-card border-r shrink-0
                transform transition-all duration-300 ease-in-out
                ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
            `}>
                <div className="h-full flex flex-col overflow-hidden">
                    {/* Logo - Desktop Only */}
                    <div className={`border-b hidden lg:flex items-center ${isSidebarCollapsed ? 'justify-center p-4' : 'p-6'}`}>
                        <Link href="/admin">
                            <h1 className="text-xl font-bold whitespace-nowrap">
                                {isSidebarCollapsed ? (
                                    <span className="text-primary">S</span>
                                ) : (
                                    <>Simply<span className="text-primary">Admin</span></>
                                )}
                            </h1>
                        </Link>
                    </div>

                    {/* Navigation */}
                    <nav className={`flex-1 ${isSidebarCollapsed ? 'p-2' : 'p-4'} space-y-1 overflow-y-auto scrollbar-hide`} style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
                        {sidebarLinks.map((link) => (
                            <Link
                                key={link.href}
                                href={link.href}
                                onClick={closeMobileMenu}
                                title={isSidebarCollapsed ? link.name : undefined}
                                className={`flex items-center ${isSidebarCollapsed ? 'justify-center px-2' : 'gap-3 px-4'} py-2.5 rounded-lg text-sm font-medium transition-colors group relative ${isActive(link.href)
                                    ? 'bg-primary text-primary-foreground'
                                    : 'hover:bg-accent'
                                    }`}
                            >
                                <link.icon className="h-5 w-5 shrink-0" />
                                {!isSidebarCollapsed && <span className="whitespace-nowrap">{link.name}</span>}
                                {isSidebarCollapsed && (
                                    <span className="absolute left-full ml-2 px-2 py-1 bg-popover text-popover-foreground text-xs rounded-md shadow-md border opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-[60]">
                                        {link.name}
                                    </span>
                                )}
                            </Link>
                        ))}

                        {/* Amazon Section */}
                        <div className="pt-4 mt-4 border-t">
                            {!isSidebarCollapsed && (
                                <p className="px-4 py-2 text-xs font-semibold text-muted-foreground uppercase">
                                    Amazon Activation
                                </p>
                            )}
                            {isSidebarCollapsed && (
                                <div className="flex justify-center py-2">
                                    <div className="w-4 h-px bg-muted-foreground/40" />
                                </div>
                            )}
                            {amazonLinks.map((link) => (
                                <Link
                                    key={link.href}
                                    href={link.href}
                                    onClick={closeMobileMenu}
                                    title={isSidebarCollapsed ? link.name : undefined}
                                    className={`flex items-center ${isSidebarCollapsed ? 'justify-center px-2' : 'gap-3 px-4'} py-2.5 rounded-lg text-sm font-medium transition-colors group relative ${isActive(link.href)
                                        ? 'bg-primary text-primary-foreground'
                                        : 'hover:bg-accent'
                                        }`}
                                >
                                    <link.icon className="h-5 w-5 shrink-0" />
                                    {!isSidebarCollapsed && <span className="whitespace-nowrap">{link.name}</span>}
                                    {isSidebarCollapsed && (
                                        <span className="absolute left-full ml-2 px-2 py-1 bg-popover text-popover-foreground text-xs rounded-md shadow-md border opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-[60]">
                                            {link.name}
                                        </span>
                                    )}
                                </Link>
                            ))}
                        </div>
                    </nav>

                    {/* Collapse Toggle - Desktop Only */}
                    <div className="border-t hidden lg:block">
                        <button
                            onClick={toggleSidebar}
                            className={`w-full flex items-center ${isSidebarCollapsed ? 'justify-center' : 'justify-between px-8'} py-3 text-sm font-medium text-muted-foreground hover:bg-accent transition-colors`}
                            aria-label={isSidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
                        >
                            {!isSidebarCollapsed && <span>Collapse</span>}
                            {isSidebarCollapsed ? (
                                <ChevronsRight className="h-5 w-5" />
                            ) : (
                                <ChevronsLeft className="h-5 w-5" />
                            )}
                        </button>
                    </div>

                    {/* Footer */}
                    <div className={`${isSidebarCollapsed ? 'p-2' : 'p-4'} border-t`}>
                        <Link
                            href="/"
                            onClick={closeMobileMenu}
                            title={isSidebarCollapsed ? 'Back to Store' : undefined}
                            className={`flex items-center ${isSidebarCollapsed ? 'justify-center px-2' : 'gap-3 px-4'} py-2.5 rounded-lg text-sm font-medium text-muted-foreground hover:bg-accent group relative`}
                        >
                            <LogOut className="h-5 w-5 shrink-0" />
                            {!isSidebarCollapsed && <span className="whitespace-nowrap">Back to Store</span>}
                            {isSidebarCollapsed && (
                                <span className="absolute left-full ml-2 px-2 py-1 bg-popover text-popover-foreground text-xs rounded-md shadow-md border opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-[60]">
                                    Back to Store
                                </span>
                            )}
                        </Link>
                    </div>
                </div>
            </aside>

            {/* Main Content - Takes full width on mobile, offset for fixed sidebar on desktop */}
            <div className={`flex-1 flex flex-col min-h-screen w-full ${mainMargin} pt-[52px] lg:pt-0 transition-all duration-300`}>
                {children}
            </div>
        </div>
    );
}
