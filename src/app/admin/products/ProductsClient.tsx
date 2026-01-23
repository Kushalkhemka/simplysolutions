'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus, Edit, Eye, DollarSign, Check, X, Loader2, Percent } from 'lucide-react';
import { toast } from 'sonner';

interface Product {
    id: string;
    name: string;
    slug: string;
    sku: string;
    price: number;
    mrp: number;
    stock_quantity: number;
    is_active: boolean;
    main_image_url: string | null;
    category: { name: string } | null;
}

export default function ProductsClient() {
    const [products, setProducts] = useState<Product[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
    const [showBulkModal, setShowBulkModal] = useState(false);
    const [bulkUpdateType, setBulkUpdateType] = useState<'percent' | 'fixed'>('percent');
    const [bulkUpdateValue, setBulkUpdateValue] = useState('');
    const [bulkUpdateDirection, setBulkUpdateDirection] = useState<'increase' | 'decrease'>('increase');
    const [isUpdating, setIsUpdating] = useState(false);

    const supabase = createClient();

    useEffect(() => {
        fetchProducts();
    }, []);

    const fetchProducts = async () => {
        setIsLoading(true);
        const { data, error } = await supabase
            .from('products')
            .select(`
                id, name, slug, sku, price, mrp, stock_quantity, is_active, main_image_url,
                category:categories(name)
            `)
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Error fetching products:', error);
            toast.error('Failed to load products');
        } else {
            setProducts(data || []);
        }
        setIsLoading(false);
    };

    const toggleSelect = (id: string) => {
        const newSelected = new Set(selectedIds);
        if (newSelected.has(id)) {
            newSelected.delete(id);
        } else {
            newSelected.add(id);
        }
        setSelectedIds(newSelected);
    };

    const toggleSelectAll = () => {
        if (selectedIds.size === products.length) {
            setSelectedIds(new Set());
        } else {
            setSelectedIds(new Set(products.map(p => p.id)));
        }
    };

    const calculateNewPrice = (currentPrice: number): number => {
        const value = parseFloat(bulkUpdateValue) || 0;
        if (bulkUpdateType === 'percent') {
            const multiplier = bulkUpdateDirection === 'increase'
                ? 1 + (value / 100)
                : 1 - (value / 100);
            return Math.round(currentPrice * multiplier);
        } else {
            return bulkUpdateDirection === 'increase'
                ? currentPrice + value
                : Math.max(0, currentPrice - value);
        }
    };

    const handleBulkUpdate = async () => {
        if (selectedIds.size === 0) {
            toast.error('No products selected');
            return;
        }
        if (!bulkUpdateValue || parseFloat(bulkUpdateValue) <= 0) {
            toast.error('Please enter a valid value');
            return;
        }

        setIsUpdating(true);
        let successCount = 0;
        let failCount = 0;

        for (const id of selectedIds) {
            const product = products.find(p => p.id === id);
            if (!product) continue;

            const newPrice = calculateNewPrice(product.price);
            const { error } = await supabase
                .from('products')
                .update({ price: newPrice })
                .eq('id', id);

            if (error) {
                failCount++;
            } else {
                successCount++;
            }
        }

        if (successCount > 0) {
            toast.success(`Updated ${successCount} product${successCount > 1 ? 's' : ''}`);
            fetchProducts();
        }
        if (failCount > 0) {
            toast.error(`Failed to update ${failCount} product${failCount > 1 ? 's' : ''}`);
        }

        setShowBulkModal(false);
        setSelectedIds(new Set());
        setBulkUpdateValue('');
        setIsUpdating(false);
    };

    const getPreviewProducts = () => {
        return products
            .filter(p => selectedIds.has(p.id))
            .slice(0, 5)
            .map(p => ({
                ...p,
                newPrice: calculateNewPrice(p.price)
            }));
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center p-8">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold">Products</h1>
                    <p className="text-muted-foreground">Manage your product catalog</p>
                </div>
                <div className="flex flex-wrap gap-2">
                    {selectedIds.size > 0 && (
                        <Button
                            variant="outline"
                            className="gap-2"
                            onClick={() => setShowBulkModal(true)}
                        >
                            <DollarSign className="h-4 w-4" />
                            Update Prices ({selectedIds.size})
                        </Button>
                    )}
                    <Link href="/admin/products/new">
                        <Button className="gap-2">
                            <Plus className="h-4 w-4" />
                            <span className="hidden sm:inline">Add Product</span>
                            <span className="sm:hidden">Add</span>
                        </Button>
                    </Link>
                </div>
            </div>

            {/* Products Table */}
            <div className="bg-card border rounded-lg overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead className="bg-muted/50 border-b">
                            <tr>
                                <th className="text-left p-4 font-medium w-10">
                                    <input
                                        type="checkbox"
                                        checked={selectedIds.size === products.length && products.length > 0}
                                        onChange={toggleSelectAll}
                                        className="w-4 h-4 rounded border-gray-300"
                                    />
                                </th>
                                <th className="text-left p-4 font-medium">Product</th>
                                <th className="text-left p-4 font-medium hidden md:table-cell">SKU</th>
                                <th className="text-left p-4 font-medium hidden lg:table-cell">Category</th>
                                <th className="text-right p-4 font-medium">Price</th>
                                <th className="text-center p-4 font-medium hidden sm:table-cell">Stock</th>
                                <th className="text-center p-4 font-medium hidden sm:table-cell">Status</th>
                                <th className="text-right p-4 font-medium">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y">
                            {products.map((product) => (
                                <tr key={product.id} className={`hover:bg-muted/30 ${selectedIds.has(product.id) ? 'bg-primary/5' : ''}`}>
                                    <td className="p-4">
                                        <input
                                            type="checkbox"
                                            checked={selectedIds.has(product.id)}
                                            onChange={() => toggleSelect(product.id)}
                                            className="w-4 h-4 rounded border-gray-300"
                                        />
                                    </td>
                                    <td className="p-4">
                                        <div className="flex items-center gap-3">
                                            {product.main_image_url && (
                                                <img
                                                    src={product.main_image_url}
                                                    alt={product.name}
                                                    className="w-10 h-10 object-contain bg-muted rounded hidden sm:block"
                                                />
                                            )}
                                            <span className="font-medium line-clamp-1 max-w-[150px] sm:max-w-xs">{product.name}</span>
                                        </div>
                                    </td>
                                    <td className="p-4 text-muted-foreground hidden md:table-cell">{product.sku}</td>
                                    <td className="p-4 hidden lg:table-cell">{product.category?.name || '-'}</td>
                                    <td className="p-4 text-right">
                                        <div>
                                            <span className="font-medium">₹{product.price.toLocaleString('en-IN')}</span>
                                            {product.mrp > product.price && (
                                                <span className="text-xs text-muted-foreground line-through ml-2 hidden sm:inline">
                                                    ₹{product.mrp.toLocaleString('en-IN')}
                                                </span>
                                            )}
                                        </div>
                                    </td>
                                    <td className="p-4 text-center hidden sm:table-cell">
                                        <span className={`font-medium ${product.stock_quantity < 10 ? 'text-red-500' : ''}`}>
                                            {product.stock_quantity}
                                        </span>
                                    </td>
                                    <td className="p-4 text-center hidden sm:table-cell">
                                        <Badge variant={product.is_active ? 'default' : 'secondary'}>
                                            {product.is_active ? 'Active' : 'Inactive'}
                                        </Badge>
                                    </td>
                                    <td className="p-4 text-right">
                                        <div className="flex items-center justify-end gap-1">
                                            <Link href={`/products/${product.slug}`} target="_blank">
                                                <Button size="icon" variant="ghost" className="h-8 w-8">
                                                    <Eye className="h-4 w-4" />
                                                </Button>
                                            </Link>
                                            <Link href={`/admin/products/${product.id}/edit`}>
                                                <Button size="icon" variant="ghost" className="h-8 w-8">
                                                    <Edit className="h-4 w-4" />
                                                </Button>
                                            </Link>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {products.length === 0 && (
                    <div className="p-8 text-center text-muted-foreground">
                        No products found. Add your first product to get started.
                    </div>
                )}
            </div>

            {/* Bulk Price Update Modal */}
            {showBulkModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/50" onClick={() => !isUpdating && setShowBulkModal(false)} />
                    <div className="relative bg-card border rounded-xl shadow-xl w-full max-w-md">
                        <div className="sticky top-0 bg-card border-b px-6 py-4 flex items-center justify-between rounded-t-xl">
                            <h2 className="text-lg font-bold">Bulk Price Update</h2>
                            <button
                                onClick={() => !isUpdating && setShowBulkModal(false)}
                                className="p-2 hover:bg-muted rounded-full"
                                disabled={isUpdating}
                            >
                                <X className="h-5 w-5" />
                            </button>
                        </div>

                        <div className="p-6 space-y-4">
                            <p className="text-sm text-muted-foreground">
                                Updating prices for <strong>{selectedIds.size}</strong> product{selectedIds.size > 1 ? 's' : ''}
                            </p>

                            {/* Update Type */}
                            <div className="flex gap-2">
                                <button
                                    onClick={() => setBulkUpdateType('percent')}
                                    className={`flex-1 py-2 px-4 rounded-lg border text-sm font-medium transition ${bulkUpdateType === 'percent'
                                            ? 'bg-primary text-primary-foreground border-primary'
                                            : 'hover:bg-muted'
                                        }`}
                                >
                                    <Percent className="h-4 w-4 inline mr-2" />
                                    Percentage
                                </button>
                                <button
                                    onClick={() => setBulkUpdateType('fixed')}
                                    className={`flex-1 py-2 px-4 rounded-lg border text-sm font-medium transition ${bulkUpdateType === 'fixed'
                                            ? 'bg-primary text-primary-foreground border-primary'
                                            : 'hover:bg-muted'
                                        }`}
                                >
                                    <DollarSign className="h-4 w-4 inline mr-2" />
                                    Fixed Amount
                                </button>
                            </div>

                            {/* Direction */}
                            <div className="flex gap-2">
                                <button
                                    onClick={() => setBulkUpdateDirection('increase')}
                                    className={`flex-1 py-2 px-4 rounded-lg border text-sm font-medium transition ${bulkUpdateDirection === 'increase'
                                            ? 'bg-green-600 text-white border-green-600'
                                            : 'hover:bg-muted'
                                        }`}
                                >
                                    ↑ Increase
                                </button>
                                <button
                                    onClick={() => setBulkUpdateDirection('decrease')}
                                    className={`flex-1 py-2 px-4 rounded-lg border text-sm font-medium transition ${bulkUpdateDirection === 'decrease'
                                            ? 'bg-red-600 text-white border-red-600'
                                            : 'hover:bg-muted'
                                        }`}
                                >
                                    ↓ Decrease
                                </button>
                            </div>

                            {/* Value Input */}
                            <div>
                                <label className="block text-sm font-medium mb-2">
                                    {bulkUpdateType === 'percent' ? 'Percentage' : 'Amount (₹)'}
                                </label>
                                <div className="relative">
                                    <input
                                        type="number"
                                        value={bulkUpdateValue}
                                        onChange={(e) => setBulkUpdateValue(e.target.value)}
                                        placeholder={bulkUpdateType === 'percent' ? 'e.g. 10' : 'e.g. 100'}
                                        className="w-full px-4 py-2 border rounded-lg bg-background"
                                        min="0"
                                        step={bulkUpdateType === 'percent' ? '0.1' : '1'}
                                    />
                                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground">
                                        {bulkUpdateType === 'percent' ? '%' : '₹'}
                                    </span>
                                </div>
                            </div>

                            {/* Preview */}
                            {bulkUpdateValue && parseFloat(bulkUpdateValue) > 0 && (
                                <div className="bg-muted/50 rounded-lg p-3">
                                    <p className="text-xs font-medium text-muted-foreground mb-2">Preview (first 5):</p>
                                    <div className="space-y-1 text-sm">
                                        {getPreviewProducts().map(p => (
                                            <div key={p.id} className="flex justify-between">
                                                <span className="truncate max-w-[150px]">{p.name}</span>
                                                <span>
                                                    <span className="text-muted-foreground line-through">₹{p.price}</span>
                                                    <span className="font-medium ml-2">→ ₹{p.newPrice}</span>
                                                </span>
                                            </div>
                                        ))}
                                        {selectedIds.size > 5 && (
                                            <p className="text-xs text-muted-foreground">...and {selectedIds.size - 5} more</p>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* Actions */}
                            <div className="flex gap-3 pt-2">
                                <Button
                                    variant="outline"
                                    className="flex-1"
                                    onClick={() => setShowBulkModal(false)}
                                    disabled={isUpdating}
                                >
                                    Cancel
                                </Button>
                                <Button
                                    className="flex-1 gap-2"
                                    onClick={handleBulkUpdate}
                                    disabled={isUpdating || !bulkUpdateValue}
                                >
                                    {isUpdating ? (
                                        <>
                                            <Loader2 className="h-4 w-4 animate-spin" />
                                            Updating...
                                        </>
                                    ) : (
                                        <>
                                            <Check className="h-4 w-4" />
                                            Apply Changes
                                        </>
                                    )}
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
