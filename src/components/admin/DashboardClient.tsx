'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
    Package, ShoppingCart, DollarSign, TrendingDown,
    ArrowRight, Key, Eye, EyeOff
} from 'lucide-react';

interface StatItem {
    name: string;
    value: string | number;
    iconName: string;
    color: string;
    href: string;
    isSensitive?: boolean;
}

interface OrderItem {
    id: string;
    order_number: string;
    status: string;
    total_amount: number;
    billing_name: string;
    itemCount: number;
}

interface LowStockItem {
    id: string;
    name: string;
    stock_quantity: number;
}

interface DashboardClientProps {
    stats: StatItem[];
    latestOrders: OrderItem[];
    lowStockProducts: LowStockItem[];
    totalAvailableKeys: number;
}

const iconMap: Record<string, any> = {
    Package, ShoppingCart, DollarSign, Key,
};

const getStatusColor = (status: string) => {
    switch (status) {
        case 'delivered': return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400';
        case 'paid': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400';
        case 'pending': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400';
        default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400';
    }
};

export default function DashboardClient({ stats, latestOrders, lowStockProducts, totalAvailableKeys }: DashboardClientProps) {
    const [showAmounts, setShowAmounts] = useState(false);

    const maskedValue = '••••••';

    return (
        <div className="space-y-8">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-xl sm:text-2xl font-bold">Dashboard</h1>
                    <p className="text-sm text-muted-foreground">Welcome to the admin panel</p>
                </div>
                <button
                    onClick={() => setShowAmounts(!showAmounts)}
                    className="flex items-center gap-2 px-3 py-2 text-sm border rounded-lg hover:bg-accent transition-colors"
                    title={showAmounts ? 'Hide amounts' : 'Show amounts'}
                >
                    {showAmounts ? (
                        <Eye className="h-4 w-4" />
                    ) : (
                        <EyeOff className="h-4 w-4" />
                    )}
                    <span className="hidden sm:inline">{showAmounts ? 'Hide' : 'Show'}</span>
                </button>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
                {stats.map((stat) => {
                    const IconComponent = iconMap[stat.iconName] || Package;
                    const displayValue = stat.isSensitive && !showAmounts ? maskedValue : stat.value;
                    return (
                        <Link key={stat.name} href={stat.href}>
                            <div className="bg-card border rounded-lg p-4 sm:p-6 hover:border-primary transition-colors">
                                <div className="flex items-center gap-3 sm:gap-4">
                                    <div className={`${stat.color} w-10 h-10 sm:w-12 sm:h-12 rounded-lg flex items-center justify-center shrink-0`}>
                                        <IconComponent className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
                                    </div>
                                    <div className="min-w-0">
                                        <p className="text-xs sm:text-sm text-muted-foreground truncate">{stat.name}</p>
                                        <p className="text-lg sm:text-2xl font-bold truncate">{displayValue}</p>
                                    </div>
                                </div>
                            </div>
                        </Link>
                    );
                })}
            </div>

            <div className="grid lg:grid-cols-2 gap-4 sm:gap-6">
                {/* Recent Orders */}
                <div className="bg-card border rounded-lg overflow-hidden">
                    <div className="p-4 border-b flex items-center justify-between">
                        <h2 className="font-semibold">Recent Orders</h2>
                        <Link href="/admin/orders" className="text-sm text-primary hover:underline flex items-center gap-1">
                            View All <ArrowRight className="h-4 w-4" />
                        </Link>
                    </div>
                    <div className="divide-y">
                        {latestOrders.map((order) => (
                            <Link key={order.id} href={`/admin/orders/${order.id}`}>
                                <div className="p-4 hover:bg-muted/50 transition-colors">
                                    <div className="flex items-center justify-between gap-3">
                                        <div className="min-w-0 flex-1">
                                            <p className="font-medium text-sm truncate">{order.order_number}</p>
                                            <p className="text-xs text-muted-foreground truncate">{order.billing_name}</p>
                                        </div>
                                        <div className="text-right shrink-0">
                                            <p className="font-medium text-sm">
                                                {showAmounts ? `₹${order.total_amount?.toLocaleString('en-IN')}` : '₹••••'}
                                            </p>
                                            <div className="flex items-center gap-1.5 justify-end mt-0.5">
                                                {order.itemCount > 0 && (
                                                    <span className="text-xs text-muted-foreground">{order.itemCount} item{order.itemCount !== 1 ? 's' : ''}</span>
                                                )}
                                                <span className={`text-xs px-1.5 py-0.5 rounded ${getStatusColor(order.status)}`}>
                                                    {order.status}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </Link>
                        ))}
                        {latestOrders.length === 0 && (
                            <p className="p-4 text-center text-muted-foreground">No orders yet</p>
                        )}
                    </div>
                </div>

                {/* Low Stock */}
                <div className="bg-card border rounded-lg overflow-hidden">
                    <div className="p-4 border-b flex items-center justify-between">
                        <h2 className="font-semibold flex items-center gap-2">
                            <TrendingDown className="h-4 w-4 text-red-500" />
                            Low Stock
                        </h2>
                        <Link href="/admin/products" className="text-sm text-primary hover:underline flex items-center gap-1">
                            Manage <ArrowRight className="h-4 w-4" />
                        </Link>
                    </div>
                    <div className="divide-y">
                        {lowStockProducts.map((product) => (
                            <div key={product.id} className="p-4 flex items-center justify-between gap-3">
                                <p className="font-medium text-sm truncate min-w-0 flex-1">{product.name}</p>
                                <span className={`text-xs font-medium px-2 py-1 rounded shrink-0 ${product.stock_quantity === 0 ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400' : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
                                    }`}>
                                    {product.stock_quantity} left
                                </span>
                            </div>
                        ))}
                        {lowStockProducts.length === 0 && (
                            <p className="p-4 text-center text-muted-foreground">All products are well stocked</p>
                        )}
                    </div>
                </div>
            </div>

            {/* License Keys Quick View */}
            <div className="bg-card border rounded-lg">
                <div className="p-4 border-b flex items-center justify-between">
                    <h2 className="font-semibold flex items-center gap-2">
                        <Key className="h-4 w-4 text-primary" />
                        License Key Inventory
                    </h2>
                    <Link href="/admin/amazon/inventory" className="text-sm text-primary hover:underline flex items-center gap-1">
                        View Inventory <ArrowRight className="h-4 w-4" />
                    </Link>
                </div>
                <div className="p-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-2xl font-bold text-green-700 dark:text-green-400">{totalAvailableKeys.toLocaleString()}</p>
                            <p className="text-sm text-muted-foreground">Available Keys</p>
                        </div>
                        <Link
                            href="/admin/amazon/inventory"
                            className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:opacity-90"
                        >
                            View by FSN
                        </Link>
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
