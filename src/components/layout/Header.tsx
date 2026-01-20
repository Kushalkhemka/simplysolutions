'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';
import {
    Search,
    ShoppingCart,
    Heart,
    User,
    Menu,
    X,
    ChevronDown,
    Package,
    LogOut,
    ShieldCheck,
    Headset,
    Share2,
    Coins,
    FileText,
    Users,
    Handshake,
    LifeBuoy,
    Settings,
    Shield,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
    DropdownMenuLabel
} from '@/components/ui/dropdown-menu';
import { useCartStore } from '@/stores/cart-store';
import { useAuthStore } from '@/stores/auth-store';
import { ThemeToggle } from '@/components/theme/ThemeToggle';
import { TopUtilityBar, MegaMenu } from './MegaMenu';
import { megaMenuCategories } from './MegaMenuData';

export function Header() {
    const pathname = usePathname();
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const { itemCount } = useCartStore();
    const { user, isAuthenticated, isLoading, logout, fetchUser } = useAuthStore();
    const [hasMounted, setHasMounted] = useState(false);

    // Track client-side mount to avoid hydration mismatch
    useEffect(() => {
        setHasMounted(true);
    }, []);

    // Sync auth state with server on mount
    useEffect(() => {
        fetchUser();
    }, [fetchUser]);

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        if (searchQuery.trim()) {
            window.location.href = `/products?search=${encodeURIComponent(searchQuery)}`;
        }
    };

    return (
        <header className="sticky top-0 z-50 bg-background border-b shadow-sm w-full">
            {/* 1. Top Utility Bar (New - with Hot promo, currency/language switchers) */}
            <TopUtilityBar />

            {/* 2. Main Header Bar (Logo, Search, Account) */}
            <div className="bg-background py-3 md:py-4">
                <div className="container-dense flex items-center justify-between gap-4 md:gap-8">
                    {/* Logo */}
                    <Link href="/" className="flex-shrink-0 flex items-center gap-2 group">
                        <div className="relative w-8 h-8 group-hover:scale-105 transition-transform">
                            <Image
                                src="/logo-symbol.png"
                                alt="SimplySolutions"
                                fill
                                className="object-contain"
                                priority
                            />
                        </div>
                        <div className="flex flex-col leading-none">
                            <h1 className="text-xl md:text-2xl font-bold tracking-tight text-foreground dark:text-white">
                                Simply<span className="text-primary text-orange-600 dark:text-orange-500">Solutions</span>
                            </h1>
                        </div>
                    </Link>

                    {/* Search Bar (Centered, Large) */}
                    <div className="flex-1 max-w-2xl hidden md:block">
                        <form onSubmit={handleSearch} className="relative flex group">
                            <div className="relative flex-1">
                                <Input
                                    type="text"
                                    placeholder="Search products, brands and categories..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full pl-4 pr-12 h-11 bg-muted/30 border-2 border-transparent focus:border-primary rounded-l-lg rounded-r-none focus-visible:ring-0 transition-all font-medium"
                                />
                            </div>
                            <Button
                                type="submit"
                                className="h-11 px-6 rounded-l-none rounded-r-lg bg-primary hover:bg-primary/90 transition-colors shadow-md"
                            >
                                <Search className="h-5 w-5" />
                            </Button>
                        </form>
                    </div>

                    {/* User Actions */}
                    <div className="flex items-center gap-1 md:gap-3">
                        <ThemeToggle />

                        <Link href="/wishlist">
                            <Button variant="ghost" size="icon" className="hidden sm:flex relative hover:bg-muted text-muted-foreground hover:text-foreground group">
                                <Heart className="h-6 w-6 transition-transform group-hover:scale-110" />
                            </Button>
                        </Link>

                        <Link href="/cart">
                            <Button variant="ghost" size="icon" className="relative hover:bg-muted text-muted-foreground hover:text-foreground group">
                                <ShoppingCart className="h-6 w-6 transition-transform group-hover:scale-110" />
                                {itemCount > 0 && (
                                    <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-orange-500 text-white text-[10px] font-bold flex items-center justify-center border-2 border-background min-w-[20px] animate-in zoom-in">
                                        {itemCount > 99 ? '99+' : itemCount}
                                    </span>
                                )}
                            </Button>
                        </Link>

                        {/* Auth Section - with loading and hydration handling */}
                        {!hasMounted || isLoading ? (
                            // Loading skeleton
                            <div className="hidden sm:flex items-center gap-2 ml-2">
                                <div className="h-10 w-20 bg-muted animate-pulse rounded-md" />
                            </div>
                        ) : isAuthenticated && user ? (
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button
                                        variant="ghost"
                                        className="hidden sm:flex items-center gap-3 h-12 px-4 ml-2 rounded-full bg-gradient-to-r from-orange-50 to-amber-50 dark:from-orange-950/40 dark:to-amber-950/40 border border-orange-200/60 dark:border-orange-800/40 hover:border-orange-400 dark:hover:border-orange-600 hover:shadow-lg hover:shadow-orange-500/10 hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 group"
                                    >
                                        {/* Premium Avatar with Gradient Ring */}
                                        <div className="relative">
                                            <div className="absolute inset-0 bg-gradient-to-br from-orange-400 via-amber-500 to-orange-600 rounded-full blur-[2px] opacity-60 group-hover:opacity-100 transition-opacity" />
                                            <div className="relative w-8 h-8 bg-gradient-to-br from-orange-400 via-amber-500 to-orange-600 rounded-full flex items-center justify-center shadow-md ring-2 ring-white dark:ring-gray-900">
                                                <User className="h-4 w-4 text-white drop-shadow-sm" />
                                            </div>
                                            {/* Online Status Indicator */}
                                            <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-500 rounded-full border-2 border-white dark:border-gray-900 shadow-sm" />
                                        </div>

                                        {/* User Info */}
                                        <div className="flex flex-col items-start text-left max-w-[90px]">
                                            <span className="text-[10px] font-medium text-orange-600/70 dark:text-orange-400/70 uppercase tracking-wider leading-none">Welcome</span>
                                            <span className="text-sm font-bold text-gray-800 dark:text-gray-100 truncate w-full leading-tight mt-0.5">{user?.full_name?.split(' ')[0]}</span>
                                        </div>

                                        {/* Animated Chevron */}
                                        <div className="flex items-center justify-center w-5 h-5 rounded-full bg-orange-100 dark:bg-orange-900/50 group-hover:bg-orange-200 dark:group-hover:bg-orange-800/50 transition-colors">
                                            <ChevronDown className="h-3 w-3 text-orange-600 dark:text-orange-400 group-hover:translate-y-0.5 transition-transform duration-200" />
                                        </div>
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="w-56">
                                    <DropdownMenuLabel>My Account</DropdownMenuLabel>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem asChild>
                                        <Link href="/dashboard" className="cursor-pointer">
                                            <User className="mr-2 h-4 w-4" /> Dashboard
                                        </Link>
                                    </DropdownMenuItem>
                                    <DropdownMenuItem asChild>
                                        <Link href="/dashboard/orders" className="cursor-pointer">
                                            <Package className="mr-2 h-4 w-4" /> My Orders
                                        </Link>
                                    </DropdownMenuItem>
                                    <DropdownMenuItem asChild>
                                        <Link href="/dashboard/licenses" className="cursor-pointer">
                                            <ShieldCheck className="mr-2 h-4 w-4" /> My Licenses
                                        </Link>
                                    </DropdownMenuItem>
                                    <DropdownMenuItem asChild>
                                        <Link href="/dashboard/referral" className="cursor-pointer">
                                            <Users className="mr-2 h-4 w-4" /> Refer a Friend
                                        </Link>
                                    </DropdownMenuItem>
                                    <DropdownMenuItem asChild>
                                        <Link href="/dashboard/affiliate" className="cursor-pointer">
                                            <Handshake className="mr-2 h-4 w-4" /> Affiliate Program
                                        </Link>
                                    </DropdownMenuItem>
                                    <DropdownMenuItem asChild>
                                        <Link href="/dashboard/loyalty" className="cursor-pointer">
                                            <Coins className="mr-2 h-4 w-4" /> Loyalty Points
                                        </Link>
                                    </DropdownMenuItem>
                                    <DropdownMenuItem asChild>
                                        <Link href="/dashboard/invoices" className="cursor-pointer">
                                            <FileText className="mr-2 h-4 w-4" /> Invoice Info
                                        </Link>
                                    </DropdownMenuItem>
                                    <DropdownMenuItem asChild>
                                        <Link href="/dashboard/support" className="cursor-pointer">
                                            <LifeBuoy className="mr-2 h-4 w-4" /> Support Tickets
                                        </Link>
                                    </DropdownMenuItem>
                                    <DropdownMenuItem asChild>
                                        <Link href="/wishlist" className="cursor-pointer">
                                            <Heart className="mr-2 h-4 w-4" /> Wishlist
                                        </Link>
                                    </DropdownMenuItem>
                                    <DropdownMenuItem asChild>
                                        <Link href="/dashboard/settings" className="cursor-pointer">
                                            <Settings className="mr-2 h-4 w-4" /> Settings
                                        </Link>
                                    </DropdownMenuItem>
                                    {(user?.role === 'admin' || user?.role === 'super_admin') && (
                                        <>
                                            <DropdownMenuSeparator />
                                            <DropdownMenuItem asChild>
                                                <Link href="/admin" className="cursor-pointer text-orange-600 dark:text-orange-400 font-medium">
                                                    <Shield className="mr-2 h-4 w-4" /> Admin Panel
                                                </Link>
                                            </DropdownMenuItem>
                                        </>
                                    )}
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem onClick={logout} className="text-destructive cursor-pointer">
                                        <LogOut className="mr-2 h-4 w-4" /> Logout
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        ) : (
                            <div className="hidden sm:flex items-center gap-2 ml-2">
                                <Link href="/login">
                                    <Button variant="ghost" className="font-medium">Log In</Button>
                                </Link>
                                <Link href="/register">
                                    <Button className="shadow-sm font-bold">Sign Up</Button>
                                </Link>
                            </div>
                        )}

                        {/* Mobile Menu Toggle */}
                        <Button
                            variant="ghost"
                            size="icon"
                            className="md:hidden"
                            onClick={() => setIsMenuOpen(!isMenuOpen)}
                        >
                            {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
                        </Button>
                    </div>
                </div>
            </div>

            {/* 3. Navigation Bar with Mega Menu */}
            <div className="bg-background border-t hidden md:block shadow-[0_2px_10px_-4px_rgba(0,0,0,0.1)] z-40">
                <div className="container-dense flex items-center justify-between h-12">
                    {/* Mega Menu Navigation */}
                    <MegaMenu />

                    {/* Right side: 24/7 Support */}
                    <div className="pl-4 border-l">
                        <div className="flex items-center gap-2 px-3 py-1 bg-green-500/10 rounded-full border border-green-500/20 text-green-600 dark:text-green-400">
                            <div className="relative flex h-2 w-2">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                            </div>
                            <span className="text-[11px] font-bold uppercase tracking-wide flex items-center gap-1">
                                <Headset className="h-3.5 w-3.5 fill-current" />
                                24/7 Support Online
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Mobile Menu Overlay */}
            {isMenuOpen && (
                <div className="md:hidden border-t bg-background absolute w-full shadow-xl">
                    <div className="p-4 space-y-4">
                        <form onSubmit={handleSearch}>
                            <Input
                                type="search"
                                placeholder="Search products..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full"
                            />
                        </form>
                        <nav className="flex flex-col gap-1">
                            <div className="font-semibold text-sm text-muted-foreground px-2 py-1 uppercase tracking-wider">Categories</div>
                            {megaMenuCategories.map((cat) => (
                                <Link
                                    key={cat.id}
                                    href={cat.href}
                                    className="px-2 py-2 text-sm font-medium hover:bg-muted rounded-md flex items-center gap-2"
                                    onClick={() => setIsMenuOpen(false)}
                                >
                                    <svg
                                        xmlns="http://www.w3.org/2000/svg"
                                        viewBox={cat.viewBox}
                                        className="w-5 h-5"
                                        fill="currentColor"
                                    >
                                        <path d={cat.icon} />
                                    </svg>
                                    {cat.name}
                                </Link>
                            ))}
                            <div className="border-t my-2"></div>
                            {isAuthenticated && user ? (
                                <div className="space-y-2">
                                    {/* User Info */}
                                    <div className="flex items-center gap-3 px-3 py-3 bg-gradient-to-r from-orange-50 to-amber-50 dark:from-orange-950/40 dark:to-amber-950/40 rounded-lg border border-orange-200/60 dark:border-orange-800/40">
                                        <div className="relative">
                                            <div className="w-10 h-10 bg-gradient-to-br from-orange-400 via-amber-500 to-orange-600 rounded-full flex items-center justify-center shadow-md">
                                                <User className="h-5 w-5 text-white" />
                                            </div>
                                            <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-500 rounded-full border-2 border-white dark:border-gray-900" />
                                        </div>
                                        <div className="flex flex-col">
                                            <span className="text-xs font-medium text-orange-600/70 dark:text-orange-400/70 uppercase tracking-wider">Welcome back</span>
                                            <span className="text-sm font-bold text-gray-800 dark:text-gray-100">{user?.full_name?.split(' ')[0]}</span>
                                        </div>
                                    </div>

                                    {/* Account Links */}
                                    <div className="font-semibold text-sm text-muted-foreground px-2 py-1 uppercase tracking-wider">My Account</div>
                                    <Link href="/dashboard" className="px-2 py-2 text-sm font-medium hover:bg-muted rounded-md flex items-center gap-2" onClick={() => setIsMenuOpen(false)}>
                                        <User className="h-4 w-4" /> Dashboard
                                    </Link>
                                    <Link href="/dashboard/orders" className="px-2 py-2 text-sm font-medium hover:bg-muted rounded-md flex items-center gap-2" onClick={() => setIsMenuOpen(false)}>
                                        <Package className="h-4 w-4" /> My Orders
                                    </Link>
                                    <Link href="/dashboard/licenses" className="px-2 py-2 text-sm font-medium hover:bg-muted rounded-md flex items-center gap-2" onClick={() => setIsMenuOpen(false)}>
                                        <ShieldCheck className="h-4 w-4" /> My Licenses
                                    </Link>
                                    <Link href="/dashboard/referral" className="px-2 py-2 text-sm font-medium hover:bg-muted rounded-md flex items-center gap-2" onClick={() => setIsMenuOpen(false)}>
                                        <Users className="h-4 w-4" /> Refer a Friend
                                    </Link>
                                    <Link href="/dashboard/loyalty" className="px-2 py-2 text-sm font-medium hover:bg-muted rounded-md flex items-center gap-2" onClick={() => setIsMenuOpen(false)}>
                                        <Coins className="h-4 w-4" /> Loyalty Points
                                    </Link>
                                    <Link href="/dashboard/invoices" className="px-2 py-2 text-sm font-medium hover:bg-muted rounded-md flex items-center gap-2" onClick={() => setIsMenuOpen(false)}>
                                        <FileText className="h-4 w-4" /> Invoices
                                    </Link>
                                    <Link href="/dashboard/support" className="px-2 py-2 text-sm font-medium hover:bg-muted rounded-md flex items-center gap-2" onClick={() => setIsMenuOpen(false)}>
                                        <LifeBuoy className="h-4 w-4" /> Support Tickets
                                    </Link>
                                    <Link href="/wishlist" className="px-2 py-2 text-sm font-medium hover:bg-muted rounded-md flex items-center gap-2" onClick={() => setIsMenuOpen(false)}>
                                        <Heart className="h-4 w-4" /> Wishlist
                                    </Link>
                                    <Link href="/dashboard/settings" className="px-2 py-2 text-sm font-medium hover:bg-muted rounded-md flex items-center gap-2" onClick={() => setIsMenuOpen(false)}>
                                        <Settings className="h-4 w-4" /> Settings
                                    </Link>
                                    {(user?.role === 'admin' || user?.role === 'super_admin') && (
                                        <>
                                            <div className="border-t my-2"></div>
                                            <Link href="/admin" className="px-2 py-2 text-sm font-medium text-orange-600 dark:text-orange-400 hover:bg-orange-50 dark:hover:bg-orange-950/30 rounded-md flex items-center gap-2" onClick={() => setIsMenuOpen(false)}>
                                                <Shield className="h-4 w-4" /> Admin Panel
                                            </Link>
                                        </>
                                    )}
                                    <button
                                        onClick={() => { logout(); setIsMenuOpen(false); }}
                                        className="w-full px-2 py-2 text-sm font-medium text-destructive hover:bg-destructive/10 rounded-md flex items-center gap-2"
                                    >
                                        <LogOut className="h-4 w-4" /> Logout
                                    </button>
                                </div>
                            ) : (
                                <div className="grid grid-cols-2 gap-2">
                                    <Link href="/login" onClick={() => setIsMenuOpen(false)}>
                                        <Button variant="outline" className="w-full">Login</Button>
                                    </Link>
                                    <Link href="/register" onClick={() => setIsMenuOpen(false)}>
                                        <Button className="w-full">Sign Up</Button>
                                    </Link>
                                </div>
                            )}
                        </nav>
                    </div>
                </div>
            )}
        </header>
    );
}
