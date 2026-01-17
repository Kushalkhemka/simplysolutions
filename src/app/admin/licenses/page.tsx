import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus, Key } from 'lucide-react';

export default async function AdminLicensesPage() {
    const supabase = await createClient();

    // Get license key stats
    const { count: totalKeys } = await supabase
        .from('license_keys')
        .select('*', { count: 'exact', head: true });

    const { count: availableKeys } = await supabase
        .from('license_keys')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'available');

    const { count: soldKeys } = await supabase
        .from('license_keys')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'sold');

    // Get recent license keys
    const { data: licenseKeys } = await supabase
        .from('license_keys')
        .select(`
      *,
      product:products(name, sku)
    `)
        .order('created_at', { ascending: false })
        .limit(50);

    const stats = [
        { name: 'Total Keys', value: totalKeys || 0 },
        { name: 'Available', value: availableKeys || 0, color: 'text-green-600' },
        { name: 'Sold', value: soldKeys || 0, color: 'text-blue-600' },
    ];

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold">License Keys</h1>
                    <p className="text-muted-foreground">Manage software license key inventory</p>
                </div>
                <Link href="/admin/licenses/add">
                    <Button className="gap-2">
                        <Plus className="h-4 w-4" />
                        Add License Keys
                    </Button>
                </Link>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-4">
                {stats.map((stat) => (
                    <div key={stat.name} className="bg-card border rounded-lg p-4 text-center">
                        <p className="text-sm text-muted-foreground">{stat.name}</p>
                        <p className={`text-2xl font-bold ${stat.color || ''}`}>{stat.value}</p>
                    </div>
                ))}
            </div>

            {/* License Keys Table */}
            <div className="bg-card border rounded-lg overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead className="bg-muted/50 border-b">
                            <tr>
                                <th className="text-left p-4 font-medium">License Key</th>
                                <th className="text-left p-4 font-medium">Product</th>
                                <th className="text-center p-4 font-medium">Status</th>
                                <th className="text-left p-4 font-medium">Added</th>
                                <th className="text-left p-4 font-medium">Sold</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y">
                            {licenseKeys?.map((key: any) => (
                                <tr key={key.id} className="hover:bg-muted/30">
                                    <td className="p-4">
                                        <code className="font-mono text-xs bg-muted px-2 py-1 rounded">
                                            {key.license_key.substring(0, 20)}...
                                        </code>
                                    </td>
                                    <td className="p-4">
                                        <div>
                                            <p className="line-clamp-1">{key.product?.name}</p>
                                            <p className="text-xs text-muted-foreground">{key.product?.sku}</p>
                                        </div>
                                    </td>
                                    <td className="p-4 text-center">
                                        <Badge variant={key.status === 'available' ? 'default' : 'secondary'}>
                                            {key.status}
                                        </Badge>
                                    </td>
                                    <td className="p-4 text-muted-foreground">
                                        {new Date(key.created_at).toLocaleDateString('en-IN')}
                                    </td>
                                    <td className="p-4 text-muted-foreground">
                                        {key.sold_at ? new Date(key.sold_at).toLocaleDateString('en-IN') : '-'}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {(!licenseKeys || licenseKeys.length === 0) && (
                    <div className="p-8 text-center text-muted-foreground">
                        <Key className="h-12 w-12 mx-auto mb-4 opacity-50" />
                        <p>No license keys found</p>
                        <Link href="/admin/licenses/add" className="text-primary hover:underline">
                            Add your first batch
                        </Link>
                    </div>
                )}
            </div>
        </div>
    );
}
