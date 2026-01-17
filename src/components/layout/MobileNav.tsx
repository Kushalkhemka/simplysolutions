'use client';

import Link from 'next/link';
import {
    Home, Package, ShoppingCart, Heart, User, Settings, LogOut,
    Zap, Grid, ChevronRight
} from 'lucide-react';
import { useAuthStore } from '@/stores/auth-store';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';

const categories = [
    { name: 'Operating Systems', slug: 'operating-systems' },
    { name: 'Office Suites', slug: 'office-suites' },
    { name: 'macOS Software', slug: 'macos-software' },
    { name: 'Design Software', slug: 'design-software' },
    { name: 'PDF Tools', slug: 'pdf-tools' },
    { name: 'AI Tools', slug: 'ai-tools' },
];

export function MobileNav() {
    const { user, isAuthenticated, logout } = useAuthStore();

    return (
        <ScrollArea className="h-full">
            <div className="p-4">
                {/* Logo */}
                <Link href="/" className="block mb-6">
                    <h1 className="text-xl font-bold">
                        Simply<span className="text-primary">Solutions</span>
                    </h1>
                </Link>

                {/* User Section */}
                {isAuthenticated ? (
                    <div className="flex items-center gap-3 mb-6 p-3 bg-muted rounded-lg">
                        <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                            <User className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                            <p className="font-medium">{user?.full_name || 'User'}</p>
                            <p className="text-xs text-muted-foreground">{user?.email}</p>
                        </div>
                    </div>
                ) : (
                    <div className="mb-6 p-3 bg-muted rounded-lg">
                        <Link href="/login" className="flex items-center justify-between">
                            <span className="font-medium">Sign In / Register</span>
                            <ChevronRight className="h-4 w-4" />
                        </Link>
                    </div>
                )}

                {/* Quick Links */}
                <nav className="space-y-1 mb-6">
                    <Link href="/" className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted">
                        <Home className="h-5 w-5" />
                        Home
                    </Link>
                    <Link href="/products" className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted">
                        <Package className="h-5 w-5" />
                        All Products
                    </Link>
                    <Link href="/deals" className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted text-primary">
                        <Zap className="h-5 w-5" />
                        Lightning Deals
                    </Link>
                    <Link href="/cart" className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted">
                        <ShoppingCart className="h-5 w-5" />
                        Cart
                    </Link>
                    <Link href="/wishlist" className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted">
                        <Heart className="h-5 w-5" />
                        Wishlist
                    </Link>
                </nav>

                <Separator className="my-4" />

                {/* Categories */}
                <div className="mb-6">
                    <h3 className="text-sm font-semibold text-muted-foreground mb-2 px-3">Categories</h3>
                    <nav className="space-y-1">
                        {categories.map((cat) => (
                            <Link
                                key={cat.slug}
                                href={`/categories/${cat.slug}`}
                                className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted"
                            >
                                <Grid className="h-4 w-4" />
                                {cat.name}
                            </Link>
                        ))}
                    </nav>
                </div>

                {isAuthenticated && (
                    <>
                        <Separator className="my-4" />

                        {/* Account Links */}
                        <div className="mb-6">
                            <h3 className="text-sm font-semibold text-muted-foreground mb-2 px-3">Account</h3>
                            <nav className="space-y-1">
                                <Link href="/dashboard" className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted">
                                    <User className="h-5 w-5" />
                                    Dashboard
                                </Link>
                                <Link href="/dashboard/orders" className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted">
                                    <Package className="h-5 w-5" />
                                    My Orders
                                </Link>
                                <Link href="/dashboard/settings" className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted">
                                    <Settings className="h-5 w-5" />
                                    Settings
                                </Link>
                                <button
                                    onClick={logout}
                                    className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-muted text-destructive"
                                >
                                    <LogOut className="h-5 w-5" />
                                    Sign Out
                                </button>
                            </nav>
                        </div>
                    </>
                )}
            </div>
        </ScrollArea>
    );
}
