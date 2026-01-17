'use client';

import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { X, Plus, ShoppingCart, Check, Minus, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';

interface Product {
    id: string;
    name: string;
    slug: string;
    price: number;
    mrp: number;
    main_image_url: string | null;
    brand: string;
    edition: string | null;
    max_devices: number;
    number_of_licenses: number;
    license_duration: string;
    platform: string[];
    features: string[];
    avg_rating: number;
    review_count: number;
}

function CompareContent() {
    const searchParams = useSearchParams();
    const [products, setProducts] = useState<Product[]>([]);
    const [allProducts, setAllProducts] = useState<Product[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [showAddModal, setShowAddModal] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        const ids = searchParams.get('ids')?.split(',') || [];
        if (ids.length > 0) {
            fetchProductsByIds(ids);
        } else {
            setIsLoading(false);
        }
        fetchAllProducts();
    }, [searchParams]);

    const fetchProductsByIds = async (ids: string[]) => {
        try {
            const res = await fetch(`/api/products?ids=${ids.join(',')}`);
            const data = await res.json();
            if (data.success) {
                setProducts(data.data || []);
            }
        } catch (error) {
            console.error('Failed to fetch products:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const fetchAllProducts = async () => {
        try {
            const res = await fetch('/api/products?limit=50');
            const data = await res.json();
            if (data.success) {
                setAllProducts(data.data || []);
            }
        } catch (error) {
            console.error('Failed to fetch all products:', error);
        }
    };

    const addProduct = (product: Product) => {
        if (products.length >= 4) {
            toast.error('Maximum 4 products for comparison');
            return;
        }
        if (products.find(p => p.id === product.id)) {
            toast.error('Product already in comparison');
            return;
        }
        const newProducts = [...products, product];
        setProducts(newProducts);
        updateUrl(newProducts);
        setShowAddModal(false);
    };

    const removeProduct = (productId: string) => {
        const newProducts = products.filter(p => p.id !== productId);
        setProducts(newProducts);
        updateUrl(newProducts);
    };

    const updateUrl = (prods: Product[]) => {
        const ids = prods.map(p => p.id).join(',');
        window.history.replaceState({}, '', ids ? `/compare?ids=${ids}` : '/compare');
    };

    const filteredProducts = allProducts.filter(p =>
        !products.find(cp => cp.id === p.id) &&
        p.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const specs = [
        { key: 'price', label: 'Price', render: (p: Product) => `₹${p.price.toLocaleString('en-IN')}` },
        { key: 'mrp', label: 'MRP', render: (p: Product) => `₹${p.mrp.toLocaleString('en-IN')}` },
        { key: 'savings', label: 'You Save', render: (p: Product) => `₹${(p.mrp - p.price).toLocaleString('en-IN')} (${Math.round((p.mrp - p.price) / p.mrp * 100)}%)` },
        { key: 'brand', label: 'Brand', render: (p: Product) => p.brand || '-' },
        { key: 'edition', label: 'Edition', render: (p: Product) => p.edition || '-' },
        { key: 'devices', label: 'Max Devices', render: (p: Product) => p.max_devices?.toString() || '-' },
        { key: 'licenses', label: 'Users', render: (p: Product) => p.number_of_licenses?.toString() || '-' },
        { key: 'duration', label: 'Validity', render: (p: Product) => p.license_duration || 'Lifetime' },
        { key: 'platform', label: 'Platform', render: (p: Product) => p.platform?.join(', ') || '-' },
        { key: 'rating', label: 'Rating', render: (p: Product) => p.review_count > 0 ? `${p.avg_rating?.toFixed(1)} ⭐ (${p.review_count})` : 'No reviews' },
    ];

    return (
        <div className="container mx-auto px-4 py-8">
            {/* Header */}
            <div className="flex items-center gap-4 mb-8">
                <Link href="/products">
                    <Button variant="ghost" size="icon">
                        <ArrowLeft className="h-5 w-5" />
                    </Button>
                </Link>
                <div>
                    <h1 className="text-2xl md:text-3xl font-bold">Compare Products</h1>
                    <p className="text-muted-foreground">Compare up to 4 products side by side</p>
                </div>
            </div>

            {products.length === 0 ? (
                <div className="text-center py-16 border rounded-lg">
                    <Plus className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                    <h2 className="text-xl font-semibold mb-2">No products to compare</h2>
                    <p className="text-muted-foreground mb-6">
                        Add products to compare their features and specifications
                    </p>
                    <Button onClick={() => setShowAddModal(true)}>
                        Add Products
                    </Button>
                </div>
            ) : (
                <div className="overflow-x-auto">
                    <table className="w-full border-collapse">
                        {/* Product Headers */}
                        <thead>
                            <tr>
                                <th className="text-left p-4 bg-muted/50 min-w-[150px]">
                                    <Button
                                        variant="outline"
                                        className="w-full"
                                        onClick={() => setShowAddModal(true)}
                                        disabled={products.length >= 4}
                                    >
                                        <Plus className="h-4 w-4 mr-2" />
                                        Add Product
                                    </Button>
                                </th>
                                {products.map(product => (
                                    <th key={product.id} className="p-4 min-w-[200px] border-l">
                                        <div className="relative">
                                            <button
                                                onClick={() => removeProduct(product.id)}
                                                className="absolute -top-2 -right-2 p-1 bg-destructive text-destructive-foreground rounded-full hover:bg-destructive/80"
                                            >
                                                <X className="h-3 w-3" />
                                            </button>
                                            <Link href={`/products/${product.slug}`}>
                                                {product.main_image_url && (
                                                    <img
                                                        src={product.main_image_url}
                                                        alt={product.name}
                                                        className="w-24 h-24 object-contain mx-auto mb-2"
                                                    />
                                                )}
                                                <p className="font-medium text-sm hover:text-primary line-clamp-2">
                                                    {product.name}
                                                </p>
                                            </Link>
                                        </div>
                                    </th>
                                ))}
                            </tr>
                        </thead>

                        {/* Specs Rows */}
                        <tbody>
                            {specs.map((spec, idx) => (
                                <tr key={spec.key} className={idx % 2 === 0 ? 'bg-muted/30' : ''}>
                                    <td className="p-4 font-medium text-sm">
                                        {spec.label}
                                    </td>
                                    {products.map(product => (
                                        <td key={product.id} className="p-4 text-sm border-l text-center">
                                            {spec.render(product)}
                                        </td>
                                    ))}
                                </tr>
                            ))}

                            {/* Features Row */}
                            <tr className="border-t">
                                <td className="p-4 font-medium text-sm align-top">
                                    Features
                                </td>
                                {products.map(product => (
                                    <td key={product.id} className="p-4 text-sm border-l align-top">
                                        {product.features && product.features.length > 0 ? (
                                            <ul className="space-y-1">
                                                {product.features.slice(0, 5).map((feature, idx) => (
                                                    <li key={idx} className="flex items-start gap-2 text-left">
                                                        <Check className="h-4 w-4 text-green-500 flex-shrink-0 mt-0.5" />
                                                        <span className="text-xs">{feature}</span>
                                                    </li>
                                                ))}
                                            </ul>
                                        ) : (
                                            <span className="text-muted-foreground">-</span>
                                        )}
                                    </td>
                                ))}
                            </tr>

                            {/* Action Row */}
                            <tr className="border-t">
                                <td className="p-4"></td>
                                {products.map(product => (
                                    <td key={product.id} className="p-4 border-l text-center">
                                        <Button className="gap-2">
                                            <ShoppingCart className="h-4 w-4" />
                                            Add to Cart
                                        </Button>
                                    </td>
                                ))}
                            </tr>
                        </tbody>
                    </table>
                </div>
            )}

            {/* Add Product Modal */}
            {showAddModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center">
                    <div className="absolute inset-0 bg-black/50" onClick={() => setShowAddModal(false)} />
                    <div className="relative bg-background rounded-lg p-6 max-w-md w-full mx-4 max-h-[80vh] overflow-hidden flex flex-col">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="font-semibold text-lg">Add Product to Compare</h3>
                            <button onClick={() => setShowAddModal(false)}>
                                <X className="h-5 w-5" />
                            </button>
                        </div>

                        <Input
                            placeholder="Search products..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="mb-4"
                        />

                        <div className="flex-1 overflow-y-auto space-y-2">
                            {filteredProducts.slice(0, 20).map(product => (
                                <div
                                    key={product.id}
                                    className="flex items-center gap-3 p-3 border rounded-lg hover:bg-muted/50 cursor-pointer"
                                    onClick={() => addProduct(product)}
                                >
                                    {product.main_image_url && (
                                        <img
                                            src={product.main_image_url}
                                            alt={product.name}
                                            className="w-12 h-12 object-contain bg-muted rounded"
                                        />
                                    )}
                                    <div className="flex-1 min-w-0">
                                        <p className="font-medium text-sm truncate">{product.name}</p>
                                        <p className="text-sm text-muted-foreground">
                                            ₹{product.price.toLocaleString('en-IN')}
                                        </p>
                                    </div>
                                    <Plus className="h-5 w-5 text-muted-foreground" />
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default function ComparePage() {
    return (
        <React.Suspense fallback={<div className="container mx-auto px-4 py-8 text-center text-muted-foreground">Loading comparison...</div>}>
            <CompareContent />
        </React.Suspense>
    );
}
