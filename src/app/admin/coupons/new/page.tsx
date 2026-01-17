'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Loader2, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';

export default function NewCouponPage() {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);

    const [formData, setFormData] = useState({
        code: '',
        description: '',
        discountType: 'percentage',
        discountValue: '',
        maxDiscountAmount: '',
        minOrderAmount: '0',
        usageLimit: '',
        perUserLimit: '1',
        validUntil: '',
        isActive: true,
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            const res = await fetch('/api/admin/coupons', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...formData,
                    discountValue: parseFloat(formData.discountValue),
                    maxDiscountAmount: formData.maxDiscountAmount ? parseFloat(formData.maxDiscountAmount) : undefined,
                    minOrderAmount: parseFloat(formData.minOrderAmount) || 0,
                    usageLimit: formData.usageLimit ? parseInt(formData.usageLimit) : undefined,
                    perUserLimit: parseInt(formData.perUserLimit) || 1,
                }),
            });

            const data = await res.json();

            if (data.success) {
                toast.success('Coupon created successfully');
                router.push('/admin/coupons');
            } else {
                toast.error(data.error || 'Failed to create coupon');
            }
        } catch (error) {
            toast.error('Failed to create coupon');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4">
                <Link href="/admin/coupons">
                    <Button variant="ghost" size="icon">
                        <ArrowLeft className="h-5 w-5" />
                    </Button>
                </Link>
                <div>
                    <h1 className="text-2xl font-bold">Create Coupon</h1>
                    <p className="text-muted-foreground">Add a new discount coupon</p>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="max-w-2xl space-y-6">
                <div className="bg-card border rounded-lg p-6 space-y-4">
                    <h2 className="font-semibold">Coupon Details</h2>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <Label>Coupon Code *</Label>
                            <Input
                                required
                                value={formData.code}
                                onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                                placeholder="e.g. SAVE20"
                                className="uppercase"
                            />
                        </div>
                        <div>
                            <Label>Discount Type *</Label>
                            <select
                                value={formData.discountType}
                                onChange={(e) => setFormData({ ...formData, discountType: e.target.value })}
                                className="w-full h-10 px-3 border rounded-md bg-background"
                            >
                                <option value="percentage">Percentage (%)</option>
                                <option value="fixed">Fixed Amount (₹)</option>
                            </select>
                        </div>
                    </div>

                    <div>
                        <Label>Description</Label>
                        <Input
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            placeholder="e.g. Save 20% on your order"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <Label>Discount Value *</Label>
                            <Input
                                type="number"
                                required
                                value={formData.discountValue}
                                onChange={(e) => setFormData({ ...formData, discountValue: e.target.value })}
                                placeholder={formData.discountType === 'percentage' ? '20' : '500'}
                            />
                        </div>
                        {formData.discountType === 'percentage' && (
                            <div>
                                <Label>Max Discount (₹)</Label>
                                <Input
                                    type="number"
                                    value={formData.maxDiscountAmount}
                                    onChange={(e) => setFormData({ ...formData, maxDiscountAmount: e.target.value })}
                                    placeholder="500"
                                />
                            </div>
                        )}
                    </div>
                </div>

                <div className="bg-card border rounded-lg p-6 space-y-4">
                    <h2 className="font-semibold">Conditions</h2>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <Label>Minimum Order Amount (₹)</Label>
                            <Input
                                type="number"
                                value={formData.minOrderAmount}
                                onChange={(e) => setFormData({ ...formData, minOrderAmount: e.target.value })}
                                placeholder="0"
                            />
                        </div>
                        <div>
                            <Label>Valid Until</Label>
                            <Input
                                type="datetime-local"
                                value={formData.validUntil}
                                onChange={(e) => setFormData({ ...formData, validUntil: e.target.value })}
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <Label>Total Usage Limit</Label>
                            <Input
                                type="number"
                                value={formData.usageLimit}
                                onChange={(e) => setFormData({ ...formData, usageLimit: e.target.value })}
                                placeholder="Unlimited"
                            />
                        </div>
                        <div>
                            <Label>Per User Limit</Label>
                            <Input
                                type="number"
                                value={formData.perUserLimit}
                                onChange={(e) => setFormData({ ...formData, perUserLimit: e.target.value })}
                                placeholder="1"
                            />
                        </div>
                    </div>

                    <label className="flex items-center gap-2">
                        <input
                            type="checkbox"
                            checked={formData.isActive}
                            onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                        />
                        Active
                    </label>
                </div>

                <div className="flex gap-4">
                    <Button type="submit" disabled={isLoading} className="gap-2">
                        {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                        Create Coupon
                    </Button>
                    <Link href="/admin/coupons">
                        <Button type="button" variant="outline">Cancel</Button>
                    </Link>
                </div>
            </form>
        </div>
    );
}
