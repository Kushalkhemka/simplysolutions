'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { ArrowLeft, Loader2, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';

interface OfferTemplate {
    id: string;
    offer_type: string;
    is_active: boolean;
    duration_hours: number;
    discount_value: number | null;
    max_discount_cap: number | null;
    special_price: number | null;
    title: string;
    description: string | null;
    product_id: string | null;
}

interface Product {
    id: string;
    name: string;
    price: number;
}

export default function EditOfferPage() {
    const params = useParams();
    const router = useRouter();
    const offerType = params.type as string;

    const [template, setTemplate] = useState<OfferTemplate | null>(null);
    const [products, setProducts] = useState<Product[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        fetchTemplate();
        if (offerType === 'flash_deal') {
            fetchProducts();
        }
    }, [offerType]);

    const fetchTemplate = async () => {
        setIsLoading(true);
        try {
            const res = await fetch('/api/admin/welcome-offers');
            const data = await res.json();
            if (data.success) {
                const foundTemplate = data.data.templates.find((t: OfferTemplate) => t.offer_type === offerType);
                if (foundTemplate) {
                    setTemplate(foundTemplate);
                }
            }
        } catch (error) {
            console.error('Failed to fetch template:', error);
            toast.error('Failed to load offer configuration');
        }
        setIsLoading(false);
    };

    const fetchProducts = async () => {
        try {
            const supabase = createClient();
            const { data } = await supabase
                .from('products')
                .select('id, name, price')
                .eq('is_active', true)
                .order('name');

            if (data) {
                setProducts(data);
            }
        } catch (error) {
            console.error('Failed to fetch products:', error);
        }
    };

    const handleSave = async () => {
        if (!template) return;

        setIsSaving(true);
        try {
            const res = await fetch('/api/admin/welcome-offers', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(template),
            });

            const data = await res.json();
            if (data.success) {
                toast.success('Offer configuration updated successfully');
                router.push('/admin/welcome-offers');
            } else {
                toast.error(data.error || 'Failed to update offer');
            }
        } catch (error) {
            console.error('Failed to save:', error);
            toast.error('Failed to save changes');
        }
        setIsSaving(false);
    };

    if (isLoading || !template) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
        );
    }

    return (
        <div className="space-y-6 max-w-2xl">
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="sm" onClick={() => router.back()}>
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Back
                </Button>
                <div>
                    <h1 className="text-2xl font-bold">Edit {template.title}</h1>
                    <p className="text-muted-foreground text-sm">
                        Configure {offerType.replace('_', ' ')} offer settings
                    </p>
                </div>
            </div>

            <div className="bg-card border rounded-lg p-6 space-y-6">
                {/* Active Toggle */}
                <div className="flex items-center justify-between">
                    <div>
                        <Label>Status</Label>
                        <p className="text-sm text-muted-foreground">
                            Enable or disable this offer for new users
                        </p>
                    </div>
                    <Button
                        variant={template.is_active ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setTemplate({ ...template, is_active: !template.is_active })}
                    >
                        {template.is_active ? 'Active' : 'Inactive'}
                    </Button>
                </div>

                {/* Duration */}
                <div className="space-y-2">
                    <Label htmlFor="duration">Duration (hours)</Label>
                    <Input
                        id="duration"
                        type="number"
                        step="0.25"
                        min="0.25"
                        value={template.duration_hours}
                        onChange={(e) => setTemplate({ ...template, duration_hours: parseFloat(e.target.value) })}
                    />
                    <p className="text-xs text-muted-foreground">
                        How long the offer remains valid. Use 0.25 for 15 minutes, 0.5 for 30 minutes, etc.
                    </p>
                </div>

                {/* Flash Deal Specific */}
                {offerType === 'flash_deal' && (
                    <>
                        <div className="space-y-2">
                            <Label htmlFor="product">Product</Label>
                            <select
                                id="product"
                                className="w-full px-3 py-2 border rounded-lg bg-background"
                                value={template.product_id || ''}
                                onChange={(e) => setTemplate({ ...template, product_id: e.target.value || null })}
                            >
                                <option value="">Select a product</option>
                                {products.map((p) => (
                                    <option key={p.id} value={p.id}>
                                        {p.name} (₹{p.price})
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="special_price">Special Price (₹)</Label>
                            <Input
                                id="special_price"
                                type="number"
                                min="0"
                                step="1"
                                value={template.special_price || ''}
                                onChange={(e) => setTemplate({ ...template, special_price: parseFloat(e.target.value) || null })}
                            />
                            <p className="text-xs text-muted-foreground">
                                The discounted price for the flash deal
                            </p>
                        </div>
                    </>
                )}

                {/* Price Slash Specific */}
                {offerType === 'price_slash' && (
                    <div className="space-y-2">
                        <Label htmlFor="discount_value">Discount Percentage (%)</Label>
                        <Input
                            id="discount_value"
                            type="number"
                            min="0"
                            max="100"
                            step="1"
                            value={template.discount_value || ''}
                            onChange={(e) => setTemplate({ ...template, discount_value: parseFloat(e.target.value) || null })}
                        />
                        <p className="text-xs text-muted-foreground">
                            Percentage discount applied to the cheapest item (e.g., 20 for 20% off)
                        </p>
                    </div>
                )}

                {/* BOGO Specific */}
                {offerType === 'bogo' && (
                    <div className="space-y-2">
                        <Label htmlFor="max_cap">Maximum Discount Cap (₹)</Label>
                        <Input
                            id="max_cap"
                            type="number"
                            min="0"
                            step="100"
                            value={template.max_discount_cap || ''}
                            onChange={(e) => setTemplate({ ...template, max_discount_cap: parseFloat(e.target.value) || null })}
                        />
                        <p className="text-xs text-muted-foreground">
                            Maximum discount amount for BOGO offer (e.g., 1000 means max ₹1000 discount)
                        </p>
                    </div>
                )}

                {/* Title */}
                <div className="space-y-2">
                    <Label htmlFor="title">Display Title</Label>
                    <Input
                        id="title"
                        value={template.title}
                        onChange={(e) => setTemplate({ ...template, title: e.target.value })}
                    />
                </div>

                {/* Description */}
                <div className="space-y-2">
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                        id="description"
                        value={template.description || ''}
                        onChange={(e) => setTemplate({ ...template, description: e.target.value })}
                        rows={2}
                    />
                    <p className="text-xs text-muted-foreground">
                        Short description shown in the welcome popup
                    </p>
                </div>

                {/* Actions */}
                <div className="flex gap-3 pt-4 border-t">
                    <Button variant="outline" onClick={() => router.back()}>
                        Cancel
                    </Button>
                    <Button onClick={handleSave} disabled={isSaving} className="gap-2">
                        {isSaving ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                            <Save className="h-4 w-4" />
                        )}
                        Save Changes
                    </Button>
                </div>
            </div>
        </div>
    );
}
