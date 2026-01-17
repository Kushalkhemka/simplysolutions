import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus, Tag } from 'lucide-react';

export default async function AdminCouponsPage() {
    const supabase = await createClient();

    const { data: coupons } = await supabase
        .from('coupons')
        .select('*')
        .order('created_at', { ascending: false });

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold">Coupons</h1>
                    <p className="text-muted-foreground">Manage discount coupons</p>
                </div>
                <Link href="/admin/coupons/new">
                    <Button className="gap-2">
                        <Plus className="h-4 w-4" />
                        Create Coupon
                    </Button>
                </Link>
            </div>

            <div className="bg-card border rounded-lg overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead className="bg-muted/50 border-b">
                            <tr>
                                <th className="text-left p-4 font-medium">Code</th>
                                <th className="text-left p-4 font-medium">Discount</th>
                                <th className="text-left p-4 font-medium">Min Order</th>
                                <th className="text-center p-4 font-medium">Usage</th>
                                <th className="text-left p-4 font-medium">Valid Until</th>
                                <th className="text-center p-4 font-medium">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y">
                            {coupons?.map((coupon: any) => (
                                <tr key={coupon.id} className="hover:bg-muted/30">
                                    <td className="p-4">
                                        <code className="font-mono font-bold bg-muted px-2 py-1 rounded">
                                            {coupon.code}
                                        </code>
                                    </td>
                                    <td className="p-4">
                                        {coupon.discount_type === 'percentage'
                                            ? `${coupon.discount_value}%`
                                            : `₹${coupon.discount_value}`
                                        }
                                        {coupon.max_discount_amount && (
                                            <span className="text-xs text-muted-foreground ml-1">
                                                (max ₹{coupon.max_discount_amount})
                                            </span>
                                        )}
                                    </td>
                                    <td className="p-4">
                                        ₹{coupon.min_order_amount?.toLocaleString('en-IN') || 0}
                                    </td>
                                    <td className="p-4 text-center">
                                        {coupon.usage_count || 0}
                                        {coupon.max_usage && ` / ${coupon.max_usage}`}
                                    </td>
                                    <td className="p-4 text-muted-foreground">
                                        {coupon.valid_until
                                            ? new Date(coupon.valid_until).toLocaleDateString('en-IN')
                                            : 'No expiry'
                                        }
                                    </td>
                                    <td className="p-4 text-center">
                                        <Badge variant={coupon.is_active ? 'default' : 'secondary'}>
                                            {coupon.is_active ? 'Active' : 'Inactive'}
                                        </Badge>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {(!coupons || coupons.length === 0) && (
                    <div className="p-8 text-center text-muted-foreground">
                        <Tag className="h-12 w-12 mx-auto mb-4 opacity-50" />
                        <p>No coupons yet</p>
                        <Link href="/admin/coupons/new" className="text-primary hover:underline">
                            Create your first coupon
                        </Link>
                    </div>
                )}
            </div>
        </div>
    );
}
