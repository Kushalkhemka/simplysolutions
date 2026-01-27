'use client';

import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import Link from 'next/link';
import {
    Search,
    Key,
    Package,
    RefreshCw,
    AlertTriangle,
    CheckCircle,
    ArrowUpDown,
    Plus,
    ExternalLink
} from 'lucide-react';

interface FsnSummary {
    fsn: string;
    productTitle: string;
    total: number;
    available: number;
    redeemed: number;
}

type SortField = 'fsn' | 'total' | 'available' | 'redeemed';
type SortOrder = 'asc' | 'desc';

export default function LicenseKeyInventoryPage() {
    const [fsnData, setFsnData] = useState<FsnSummary[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [sortField, setSortField] = useState<SortField>(() => {
        if (typeof window !== 'undefined') {
            return (localStorage.getItem('inventory_sortField') as SortField) || 'available';
        }
        return 'available';
    });
    const [sortOrder, setSortOrder] = useState<SortOrder>(() => {
        if (typeof window !== 'undefined') {
            return (localStorage.getItem('inventory_sortOrder') as SortOrder) || 'asc';
        }
        return 'asc';
    });
    const [error, setError] = useState<string | null>(null);

    const supabase = createClient();

    const fetchFsnData = useCallback(async () => {
        setIsLoading(true);
        setError(null);

        try {
            // Get all unique FSNs with their counts
            const { data: keysData, error: keysError } = await supabase
                .from('amazon_activation_license_keys')
                .select('fsn, is_redeemed');

            if (keysError) throw keysError;

            // Get product titles for FSNs from products_data
            const { data: productsData } = await supabase
                .from('products_data')
                .select('fsn, product_title');

            const productMap: Record<string, string> = {};
            (productsData || []).forEach((p: any) => {
                if (p.fsn) productMap[p.fsn] = p.product_title;
            });

            // Aggregate by FSN
            const fsnMap: Record<string, { total: number; available: number; redeemed: number }> = {};

            (keysData || []).forEach((key: any) => {
                if (!key.fsn) return;

                if (!fsnMap[key.fsn]) {
                    fsnMap[key.fsn] = { total: 0, available: 0, redeemed: 0 };
                }

                fsnMap[key.fsn].total++;
                if (key.is_redeemed) {
                    fsnMap[key.fsn].redeemed++;
                } else {
                    fsnMap[key.fsn].available++;
                }
            });

            const fsnArray: FsnSummary[] = Object.entries(fsnMap).map(([fsn, counts]) => ({
                fsn,
                productTitle: productMap[fsn] || 'Unknown Product',
                ...counts
            }));

            setFsnData(fsnArray);
        } catch (err: any) {
            console.error('Error fetching FSN data:', err);
            setError(err.message || 'Failed to fetch data');
        } finally {
            setIsLoading(false);
        }
    }, [supabase]);

    useEffect(() => {
        fetchFsnData();
    }, [fetchFsnData]);

    // Sort and filter data
    const filteredAndSortedData = fsnData
        .filter(item =>
            item.fsn.toLowerCase().includes(searchQuery.toLowerCase()) ||
            item.productTitle.toLowerCase().includes(searchQuery.toLowerCase())
        )
        .sort((a, b) => {
            let comparison = 0;
            switch (sortField) {
                case 'fsn': comparison = a.fsn.localeCompare(b.fsn); break;
                case 'total': comparison = a.total - b.total; break;
                case 'available': comparison = a.available - b.available; break;
                case 'redeemed': comparison = a.redeemed - b.redeemed; break;
            }
            return sortOrder === 'asc' ? comparison : -comparison;
        });

    const handleSort = (field: SortField) => {
        let newOrder: SortOrder = 'asc';
        if (sortField === field) {
            newOrder = sortOrder === 'asc' ? 'desc' : 'asc';
        }
        setSortField(field);
        setSortOrder(newOrder);
        // Persist to localStorage
        if (typeof window !== 'undefined') {
            localStorage.setItem('inventory_sortField', field);
            localStorage.setItem('inventory_sortOrder', newOrder);
        }
    };

    const totals = fsnData.reduce((acc, item) => ({
        total: acc.total + item.total,
        available: acc.available + item.available,
        redeemed: acc.redeemed + item.redeemed
    }), { total: 0, available: 0, redeemed: 0 });

    const lowStockCount = fsnData.filter(item => item.available < 10).length;
    const outOfStockCount = fsnData.filter(item => item.available === 0).length;

    const getStockStatus = (available: number) => {
        if (available === 0) return { color: 'bg-red-100 text-red-800 border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800', label: 'Out of Stock' };
        if (available < 10) return { color: 'bg-orange-100 text-orange-800 border-orange-200 dark:bg-orange-900/30 dark:text-orange-400 dark:border-orange-800', label: 'Low Stock' };
        if (available < 50) return { color: 'bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-400 dark:border-yellow-800', label: 'Medium' };
        return { color: 'bg-green-100 text-green-800 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800', label: 'In Stock' };
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold">License Key Inventory</h1>
                    <p className="text-muted-foreground">View license key counts by FSN</p>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        onClick={fetchFsnData}
                        disabled={isLoading}
                        className="flex items-center gap-2 px-4 py-2 border rounded-lg hover:bg-accent disabled:opacity-50"
                    >
                        <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
                        Refresh
                    </button>
                    <Link href="/admin/amazon/keys" className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90">
                        <Plus className="h-4 w-4" /> Add Keys
                    </Link>
                </div>
            </div>

            {/* Summary Stats */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                <div className="bg-card border rounded-lg p-4">
                    <div className="flex items-center gap-2 text-muted-foreground text-sm"><Package className="h-4 w-4" />Total FSNs</div>
                    <p className="text-2xl font-bold mt-1">{fsnData.length}</p>
                </div>
                <div className="bg-card border rounded-lg p-4">
                    <div className="flex items-center gap-2 text-muted-foreground text-sm"><Key className="h-4 w-4" />Total Keys</div>
                    <p className="text-2xl font-bold mt-1">{totals.total.toLocaleString()}</p>
                </div>
                <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
                    <div className="flex items-center gap-2 text-green-700 dark:text-green-400 text-sm"><CheckCircle className="h-4 w-4" />Available</div>
                    <p className="text-2xl font-bold mt-1 text-green-800 dark:text-green-300">{totals.available.toLocaleString()}</p>
                </div>
                <div className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg p-4">
                    <div className="flex items-center gap-2 text-orange-700 dark:text-orange-400 text-sm"><AlertTriangle className="h-4 w-4" />Low Stock FSNs</div>
                    <p className="text-2xl font-bold mt-1 text-orange-800 dark:text-orange-300">{lowStockCount}</p>
                </div>
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
                    <div className="flex items-center gap-2 text-red-700 dark:text-red-400 text-sm"><AlertTriangle className="h-4 w-4" />Out of Stock</div>
                    <p className="text-2xl font-bold mt-1 text-red-800 dark:text-red-300">{outOfStockCount}</p>
                </div>
            </div>

            {/* Search */}
            <div className="flex items-center gap-4">
                <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <input
                        type="text"
                        placeholder="Search FSN or product name..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 border rounded-lg bg-background"
                    />
                </div>
                <div className="text-sm text-muted-foreground">
                    Showing {filteredAndSortedData.length} of {fsnData.length} FSNs
                </div>
            </div>

            {error && (
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 text-red-800 dark:text-red-300">
                    <p className="font-medium">Error loading data</p>
                    <p className="text-sm">{error}</p>
                </div>
            )}

            {/* Table */}
            <div className="bg-card border rounded-lg overflow-hidden">
                {isLoading ? (
                    <div className="p-8 text-center">
                        <RefreshCw className="h-8 w-8 animate-spin mx-auto text-muted-foreground" />
                        <p className="mt-2 text-muted-foreground">Loading inventory data...</p>
                    </div>
                ) : (
                    <>
                        {/* Mobile Card View */}
                        <div className="lg:hidden divide-y">
                            {filteredAndSortedData.map((item) => {
                                const status = getStockStatus(item.available);
                                return (
                                    <div key={item.fsn} className="p-4 space-y-3">
                                        <div className="flex items-start justify-between">
                                            <div className="flex-1 min-w-0">
                                                <p className="font-mono text-sm font-medium truncate">{item.fsn}</p>
                                                <p className="text-xs text-muted-foreground truncate">{item.productTitle}</p>
                                            </div>
                                            <span className={`ml-2 inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border shrink-0 ${status.color}`}>
                                                {status.label}
                                            </span>
                                        </div>
                                        <div className="grid grid-cols-3 gap-2 text-center text-sm">
                                            <div className="bg-muted/30 rounded-lg p-2">
                                                <p className="font-bold">{item.total}</p>
                                                <p className="text-xs text-muted-foreground">Total</p>
                                            </div>
                                            <div className={`rounded-lg p-2 ${item.available === 0 ? 'bg-red-100 dark:bg-red-900/30' : item.available < 10 ? 'bg-orange-100 dark:bg-orange-900/30' : 'bg-green-100 dark:bg-green-900/30'}`}>
                                                <p className={`font-bold ${item.available === 0 ? 'text-red-700 dark:text-red-400' : item.available < 10 ? 'text-orange-700 dark:text-orange-400' : 'text-green-700 dark:text-green-400'}`}>{item.available}</p>
                                                <p className="text-xs text-muted-foreground">Available</p>
                                            </div>
                                            <div className="bg-muted/30 rounded-lg p-2">
                                                <p className="font-bold">{item.redeemed}</p>
                                                <p className="text-xs text-muted-foreground">Redeemed</p>
                                            </div>
                                        </div>
                                        <Link href={`/admin/amazon/keys?fsn=${encodeURIComponent(item.fsn)}`} className="flex items-center justify-center gap-1 text-sm text-primary hover:underline">
                                            View Keys <ExternalLink className="h-3 w-3" />
                                        </Link>
                                    </div>
                                );
                            })}
                        </div>

                        {/* Desktop Table View */}
                        <div className="hidden lg:block overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-muted/50">
                                    <tr>
                                        <th className="px-4 py-3 text-left">
                                            <button onClick={() => handleSort('fsn')} className="flex items-center gap-1 text-sm font-medium hover:text-primary">
                                                FSN <ArrowUpDown className="h-3 w-3" />
                                            </button>
                                        </th>
                                        <th className="px-4 py-3 text-left text-sm font-medium">Product</th>
                                        <th className="px-4 py-3 text-center">
                                            <button onClick={() => handleSort('total')} className="flex items-center gap-1 text-sm font-medium hover:text-primary mx-auto">
                                                Total <ArrowUpDown className="h-3 w-3" />
                                            </button>
                                        </th>
                                        <th className="px-4 py-3 text-center">
                                            <button onClick={() => handleSort('available')} className="flex items-center gap-1 text-sm font-medium hover:text-primary mx-auto">
                                                Available <ArrowUpDown className="h-3 w-3" />
                                            </button>
                                        </th>
                                        <th className="px-4 py-3 text-center">
                                            <button onClick={() => handleSort('redeemed')} className="flex items-center gap-1 text-sm font-medium hover:text-primary mx-auto">
                                                Redeemed <ArrowUpDown className="h-3 w-3" />
                                            </button>
                                        </th>
                                        <th className="px-4 py-3 text-center text-sm font-medium">Status</th>
                                        <th className="px-4 py-3 text-center text-sm font-medium">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y">
                                    {filteredAndSortedData.map((item) => {
                                        const status = getStockStatus(item.available);
                                        return (
                                            <tr key={item.fsn} className="hover:bg-muted/30">
                                                <td className="px-4 py-3 font-mono text-sm font-medium">{item.fsn}</td>
                                                <td className="px-4 py-3 text-sm text-muted-foreground max-w-xs truncate">{item.productTitle}</td>
                                                <td className="px-4 py-3 text-center text-sm font-medium">{item.total.toLocaleString()}</td>
                                                <td className="px-4 py-3 text-center">
                                                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-sm font-medium ${item.available === 0 ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400' :
                                                        item.available < 10 ? 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400' : 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                                                        }`}>
                                                        {item.available.toLocaleString()}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-3 text-center text-sm text-muted-foreground">{item.redeemed.toLocaleString()}</td>
                                                <td className="px-4 py-3 text-center">
                                                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${status.color}`}>
                                                        {status.label}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-3 text-center">
                                                    <Link href={`/admin/amazon/keys?fsn=${encodeURIComponent(item.fsn)}`} className="inline-flex items-center gap-1 text-sm text-primary hover:underline">
                                                        View <ExternalLink className="h-3 w-3" />
                                                    </Link>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>

                        {filteredAndSortedData.length === 0 && (
                            <div className="p-8 text-center text-muted-foreground">
                                {searchQuery ? 'No FSNs match your search' : 'No license keys found'}
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
}
