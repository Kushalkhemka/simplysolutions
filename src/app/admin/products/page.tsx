import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus, Edit, Eye, Search } from 'lucide-react';

export default async function AdminProductsPage() {
    const supabase = await createClient();

    const { data: products } = await supabase
        .from('products')
        .select(`
      *,
      category:categories(name)
    `)
        .order('created_at', { ascending: false });

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold">Products</h1>
                    <p className="text-muted-foreground">Manage your product catalog</p>
                </div>
                <Link href="/admin/products/new">
                    <Button className="gap-2">
                        <Plus className="h-4 w-4" />
                        Add Product
                    </Button>
                </Link>
            </div>

            {/* Products Table */}
            <div className="bg-card border rounded-lg overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead className="bg-muted/50 border-b">
                            <tr>
                                <th className="text-left p-4 font-medium">Product</th>
                                <th className="text-left p-4 font-medium">SKU</th>
                                <th className="text-left p-4 font-medium">Category</th>
                                <th className="text-right p-4 font-medium">Price</th>
                                <th className="text-center p-4 font-medium">Stock</th>
                                <th className="text-center p-4 font-medium">Status</th>
                                <th className="text-right p-4 font-medium">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y">
                            {products?.map((product: any) => (
                                <tr key={product.id} className="hover:bg-muted/30">
                                    <td className="p-4">
                                        <div className="flex items-center gap-3">
                                            {product.main_image_url && (
                                                <img
                                                    src={product.main_image_url}
                                                    alt={product.name}
                                                    className="w-10 h-10 object-contain bg-muted rounded"
                                                />
                                            )}
                                            <span className="font-medium line-clamp-1 max-w-xs">{product.name}</span>
                                        </div>
                                    </td>
                                    <td className="p-4 text-muted-foreground">{product.sku}</td>
                                    <td className="p-4">{product.category?.name || '-'}</td>
                                    <td className="p-4 text-right">
                                        <div>
                                            <span className="font-medium">₹{product.price.toLocaleString('en-IN')}</span>
                                            {product.mrp > product.price && (
                                                <span className="text-xs text-muted-foreground line-through ml-2">
                                                    ₹{product.mrp.toLocaleString('en-IN')}
                                                </span>
                                            )}
                                        </div>
                                    </td>
                                    <td className="p-4 text-center">
                                        <span className={`font-medium ${product.stock_quantity < 10 ? 'text-red-500 dark:text-red-400' : ''}`}>
                                            {product.stock_quantity}
                                        </span>
                                    </td>
                                    <td className="p-4 text-center">
                                        <Badge variant={product.is_active ? 'default' : 'secondary'}>
                                            {product.is_active ? 'Active' : 'Inactive'}
                                        </Badge>
                                    </td>
                                    <td className="p-4 text-right">
                                        <div className="flex items-center justify-end gap-2">
                                            <Link href={`/products/${product.slug}`} target="_blank">
                                                <Button size="icon" variant="ghost">
                                                    <Eye className="h-4 w-4" />
                                                </Button>
                                            </Link>
                                            <Link href={`/admin/products/${product.id}/edit`}>
                                                <Button size="icon" variant="ghost">
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

                {(!products || products.length === 0) && (
                    <div className="p-8 text-center text-muted-foreground">
                        No products found. Add your first product to get started.
                    </div>
                )}
            </div>
        </div>
    );
}
