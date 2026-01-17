'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Loader2, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';

export default function NewProductPage() {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);
    const [categories, setCategories] = useState<any[]>([]);

    const [formData, setFormData] = useState({
        sku: '',
        name: '',
        description: '',
        shortDescription: '',
        categoryId: '',
        price: '',
        mrp: '',
        mainImageUrl: '',
        isActive: true,
        isFeatured: false,
    });

    useEffect(() => {
        fetchCategories();
    }, []);

    const fetchCategories = async () => {
        const res = await fetch('/api/categories');
        const data = await res.json();
        if (data.success) setCategories(data.data || []);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            const res = await fetch('/api/admin/products', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...formData,
                    price: parseFloat(formData.price),
                    mrp: parseFloat(formData.mrp),
                }),
            });

            const data = await res.json();

            if (data.success) {
                toast.success('Product created successfully');
                router.push('/admin/products');
            } else {
                toast.error(data.error || 'Failed to create product');
            }
        } catch (error) {
            toast.error('Failed to create product');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4">
                <Link href="/admin/products">
                    <Button variant="ghost" size="icon">
                        <ArrowLeft className="h-5 w-5" />
                    </Button>
                </Link>
                <div>
                    <h1 className="text-2xl font-bold">Add New Product</h1>
                    <p className="text-muted-foreground">Create a new product listing</p>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="max-w-2xl space-y-6">
                <div className="bg-card border rounded-lg p-6 space-y-4">
                    <h2 className="font-semibold">Basic Information</h2>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <Label>SKU</Label>
                            <Input
                                value={formData.sku}
                                onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                                placeholder="e.g. OFF_36"
                            />
                        </div>
                        <div>
                            <Label>Category</Label>
                            <select
                                value={formData.categoryId}
                                onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
                                className="w-full h-10 px-3 border rounded-md bg-background"
                            >
                                <option value="">Select category</option>
                                {categories.map((cat: any) => (
                                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div>
                        <Label>Product Name *</Label>
                        <Input
                            required
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            placeholder="e.g. Microsoft Office 2024 Professional Plus"
                        />
                    </div>

                    <div>
                        <Label>Short Description</Label>
                        <Input
                            value={formData.shortDescription}
                            onChange={(e) => setFormData({ ...formData, shortDescription: e.target.value })}
                            placeholder="Brief description for cards"
                        />
                    </div>

                    <div>
                        <Label>Full Description</Label>
                        <textarea
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            placeholder="Detailed product description..."
                            className="w-full min-h-[100px] p-3 border rounded-md bg-background"
                        />
                    </div>
                </div>

                <div className="bg-card border rounded-lg p-6 space-y-4">
                    <h2 className="font-semibold">Pricing</h2>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <Label>Sale Price (₹) *</Label>
                            <Input
                                type="number"
                                required
                                value={formData.price}
                                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                                placeholder="999"
                            />
                        </div>
                        <div>
                            <Label>MRP (₹) *</Label>
                            <Input
                                type="number"
                                required
                                value={formData.mrp}
                                onChange={(e) => setFormData({ ...formData, mrp: e.target.value })}
                                placeholder="4999"
                            />
                        </div>
                    </div>
                </div>

                <div className="bg-card border rounded-lg p-6 space-y-4">
                    <h2 className="font-semibold">Media</h2>

                    <div>
                        <Label>Main Image URL</Label>
                        <Input
                            type="url"
                            value={formData.mainImageUrl}
                            onChange={(e) => setFormData({ ...formData, mainImageUrl: e.target.value })}
                            placeholder="https://..."
                        />
                    </div>
                </div>

                <div className="bg-card border rounded-lg p-6 space-y-4">
                    <h2 className="font-semibold">Status</h2>

                    <div className="flex gap-6">
                        <label className="flex items-center gap-2">
                            <input
                                type="checkbox"
                                checked={formData.isActive}
                                onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                            />
                            Active
                        </label>
                        <label className="flex items-center gap-2">
                            <input
                                type="checkbox"
                                checked={formData.isFeatured}
                                onChange={(e) => setFormData({ ...formData, isFeatured: e.target.checked })}
                            />
                            Featured
                        </label>
                    </div>
                </div>

                <div className="flex gap-4">
                    <Button type="submit" disabled={isLoading} className="gap-2">
                        {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                        Create Product
                    </Button>
                    <Link href="/admin/products">
                        <Button type="button" variant="outline">Cancel</Button>
                    </Link>
                </div>
            </form>
        </div>
    );
}
