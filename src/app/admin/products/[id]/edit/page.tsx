'use client';

import { useState, useEffect, use, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Loader2, Save, Trash2, Upload, FileText, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';

export default function EditProductPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [categories, setCategories] = useState<any[]>([]);

    const [formData, setFormData] = useState({
        name: '',
        description: '',
        short_description: '',
        category_id: '',
        price: '',
        mrp: '',
        main_image_url: '',
        is_active: true,
        is_featured: false,
        stock_quantity: '',
        installation_guide_url: '',
    });

    const [uploadingGuide, setUploadingGuide] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        Promise.all([fetchProduct(), fetchCategories()]);
    }, [id]);

    const fetchProduct = async () => {
        try {
            const res = await fetch(`/api/admin/products/${id}`, {
                credentials: 'include',
            });
            const data = await res.json();

            if (!res.ok) {
                console.error('API error:', res.status, data);
                toast.error(data.error || 'Failed to load product');
                return;
            }

            if (data.success) {
                setFormData({
                    name: data.data.name || '',
                    description: data.data.description || '',
                    short_description: data.data.short_description || '',
                    category_id: data.data.category_id || '',
                    price: data.data.price?.toString() || '',
                    mrp: data.data.mrp?.toString() || '',
                    main_image_url: data.data.main_image_url || '',
                    is_active: data.data.is_active ?? true,
                    is_featured: data.data.is_featured ?? false,
                    stock_quantity: data.data.stock_quantity?.toString() || '0',
                    installation_guide_url: data.data.installation_guide_url || '',
                });
            } else {
                toast.error(data.error || 'Failed to load product');
            }
        } catch (error) {
            console.error('Failed to fetch product:', error);
            toast.error('Failed to load product');
        } finally {
            setIsLoading(false);
        }
    };

    const fetchCategories = async () => {
        const res = await fetch('/api/categories');
        const data = await res.json();
        if (data.success) setCategories(data.data || []);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);

        try {
            const res = await fetch(`/api/admin/products/${id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...formData,
                    price: parseFloat(formData.price),
                    mrp: parseFloat(formData.mrp),
                    stock_quantity: parseInt(formData.stock_quantity) || 0,
                }),
            });

            const data = await res.json();

            if (data.success) {
                toast.success('Product updated successfully');
                router.push('/admin/products');
            } else {
                toast.error(data.error || 'Failed to update product');
            }
        } catch (error) {
            toast.error('Failed to update product');
        } finally {
            setIsSaving(false);
        }
    };

    const handleDelete = async () => {
        if (!confirm('Are you sure you want to delete this product?')) return;

        try {
            const res = await fetch(`/api/admin/products/${id}`, { method: 'DELETE' });
            const data = await res.json();

            if (data.success) {
                toast.success('Product deleted');
                router.push('/admin/products');
            } else {
                toast.error(data.error || 'Failed to delete product');
            }
        } catch (error) {
            toast.error('Failed to delete product');
        }
    };

    const handleGuideUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setUploadingGuide(true);
        try {
            const formDataUpload = new FormData();
            formDataUpload.append('file', file);
            formDataUpload.append('productId', id);

            const res = await fetch('/api/admin/upload-guide', {
                method: 'POST',
                body: formDataUpload,
            });

            const data = await res.json();

            if (data.success) {
                setFormData({ ...formData, installation_guide_url: data.data.url });
                toast.success('Installation guide uploaded!');
            } else {
                toast.error(data.error || 'Failed to upload guide');
            }
        } catch (error) {
            toast.error('Failed to upload installation guide');
        } finally {
            setUploadingGuide(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    const handleRemoveGuide = async () => {
        try {
            const res = await fetch(`/api/admin/upload-guide?productId=${id}`, {
                method: 'DELETE',
            });

            const data = await res.json();

            if (data.success) {
                setFormData({ ...formData, installation_guide_url: '' });
                toast.success('Installation guide removed');
            } else {
                toast.error(data.error || 'Failed to remove guide');
            }
        } catch (error) {
            toast.error('Failed to remove installation guide');
        }
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center py-16">
                <Loader2 className="h-8 w-8 animate-spin" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Link href="/admin/products">
                        <Button variant="ghost" size="icon">
                            <ArrowLeft className="h-5 w-5" />
                        </Button>
                    </Link>
                    <div>
                        <h1 className="text-2xl font-bold">Edit Product</h1>
                        <p className="text-muted-foreground">Update product details</p>
                    </div>
                </div>
                <Button variant="destructive" onClick={handleDelete} className="gap-2">
                    <Trash2 className="h-4 w-4" />
                    Delete
                </Button>
            </div>

            <form onSubmit={handleSubmit} className="max-w-2xl space-y-6">
                <div className="bg-card border rounded-lg p-6 space-y-4">
                    <h2 className="font-semibold">Basic Information</h2>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="col-span-2">
                            <Label>Product Name *</Label>
                            <Input
                                required
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            />
                        </div>
                        <div>
                            <Label>Category</Label>
                            <select
                                value={formData.category_id}
                                onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
                                className="w-full h-10 px-3 border rounded-md bg-background"
                            >
                                <option value="">Select category</option>
                                {categories.map((cat: any) => (
                                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <Label>Stock Quantity</Label>
                            <Input
                                type="number"
                                value={formData.stock_quantity}
                                onChange={(e) => setFormData({ ...formData, stock_quantity: e.target.value })}
                            />
                        </div>
                    </div>

                    <div>
                        <Label>Short Description</Label>
                        <Input
                            value={formData.short_description}
                            onChange={(e) => setFormData({ ...formData, short_description: e.target.value })}
                        />
                    </div>

                    <div>
                        <Label>Full Description</Label>
                        <textarea
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
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
                            />
                        </div>
                        <div>
                            <Label>MRP (₹) *</Label>
                            <Input
                                type="number"
                                required
                                value={formData.mrp}
                                onChange={(e) => setFormData({ ...formData, mrp: e.target.value })}
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
                            value={formData.main_image_url}
                            onChange={(e) => setFormData({ ...formData, main_image_url: e.target.value })}
                        />
                    </div>
                </div>

                <div className="bg-card border rounded-lg p-6 space-y-4">
                    <h2 className="font-semibold">Installation Guide</h2>
                    <p className="text-sm text-muted-foreground">Upload a PDF installation guide for this product</p>

                    {formData.installation_guide_url ? (
                        <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
                            <FileText className="h-8 w-8 text-primary" />
                            <div className="flex-1">
                                <p className="font-medium truncate">Installation Guide</p>
                                <a
                                    href={formData.installation_guide_url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-sm text-primary hover:underline"
                                >
                                    View Guide
                                </a>
                            </div>
                            <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                onClick={handleRemoveGuide}
                            >
                                <X className="h-4 w-4" />
                            </Button>
                        </div>
                    ) : (
                        <div>
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept=".pdf,.doc,.docx"
                                onChange={handleGuideUpload}
                                className="hidden"
                                id="guide-upload"
                            />
                            <label htmlFor="guide-upload">
                                <Button
                                    type="button"
                                    variant="outline"
                                    className="gap-2 cursor-pointer"
                                    disabled={uploadingGuide}
                                    asChild
                                >
                                    <span>
                                        {uploadingGuide ? (
                                            <Loader2 className="h-4 w-4 animate-spin" />
                                        ) : (
                                            <Upload className="h-4 w-4" />
                                        )}
                                        Upload Guide (PDF)
                                    </span>
                                </Button>
                            </label>
                            <p className="text-xs text-muted-foreground mt-2">Max file size: 10MB</p>
                        </div>
                    )}
                </div>

                <div className="bg-card border rounded-lg p-6 space-y-4">
                    <h2 className="font-semibold">Status</h2>
                    <div className="flex gap-6">
                        <label className="flex items-center gap-2">
                            <input
                                type="checkbox"
                                checked={formData.is_active}
                                onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                            />
                            Active
                        </label>
                        <label className="flex items-center gap-2">
                            <input
                                type="checkbox"
                                checked={formData.is_featured}
                                onChange={(e) => setFormData({ ...formData, is_featured: e.target.checked })}
                            />
                            Featured
                        </label>
                    </div>
                </div>

                <div className="flex gap-4">
                    <Button type="submit" disabled={isSaving} className="gap-2">
                        {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                        Save Changes
                    </Button>
                    <Link href="/admin/products">
                        <Button type="button" variant="outline">Cancel</Button>
                    </Link>
                </div>
            </form>
        </div>
    );
}
