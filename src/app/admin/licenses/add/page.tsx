'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Loader2, Upload, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';

export default function AddLicenseKeysPage() {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);
    const [products, setProducts] = useState<any[]>([]);
    const [selectedProduct, setSelectedProduct] = useState('');
    const [licenseKeysText, setLicenseKeysText] = useState('');
    const [uploadResult, setUploadResult] = useState<{ count: number } | null>(null);

    useEffect(() => {
        fetchProducts();
    }, []);

    const fetchProducts = async () => {
        const res = await fetch('/api/admin/products');
        const data = await res.json();
        if (data.success) setProducts(data.data.products || []);
    };

    const handleUpload = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedProduct || !licenseKeysText.trim()) {
            toast.error('Please select a product and enter license keys');
            return;
        }

        setIsLoading(true);
        setUploadResult(null);

        try {
            // Parse license keys (one per line)
            const keys = licenseKeysText
                .split('\n')
                .map(k => k.trim())
                .filter(k => k.length > 0);

            if (keys.length === 0) {
                toast.error('No valid license keys found');
                setIsLoading(false);
                return;
            }

            const res = await fetch('/api/admin/inventory', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    productId: selectedProduct,
                    licenseKeys: keys,
                }),
            });

            const data = await res.json();

            if (data.success) {
                setUploadResult({ count: data.data.count });
                setLicenseKeysText('');
                toast.success(data.data.message);
            } else {
                toast.error(data.error || 'Failed to upload license keys');
            }
        } catch (error) {
            toast.error('Failed to upload license keys');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4">
                <Link href="/admin/licenses">
                    <Button variant="ghost" size="icon">
                        <ArrowLeft className="h-5 w-5" />
                    </Button>
                </Link>
                <div>
                    <h1 className="text-2xl font-bold">Add License Keys</h1>
                    <p className="text-muted-foreground">Upload license keys for a product</p>
                </div>
            </div>

            {uploadResult && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-center gap-3">
                    <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                        <Check className="h-5 w-5 text-green-600" />
                    </div>
                    <div>
                        <p className="font-medium text-green-800">Upload successful!</p>
                        <p className="text-sm text-green-600">{uploadResult.count} license keys added to inventory</p>
                    </div>
                </div>
            )}

            <form onSubmit={handleUpload} className="max-w-2xl space-y-6">
                <div className="bg-card border rounded-lg p-6 space-y-4">
                    <div>
                        <Label>Select Product *</Label>
                        <select
                            value={selectedProduct}
                            onChange={(e) => setSelectedProduct(e.target.value)}
                            className="w-full h-10 px-3 border rounded-md bg-background"
                            required
                        >
                            <option value="">Choose a product...</option>
                            {products.map((product: any) => (
                                <option key={product.id} value={product.id}>
                                    {product.name} ({product.sku})
                                </option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <Label>License Keys *</Label>
                        <p className="text-sm text-muted-foreground mb-2">
                            Enter one license key per line
                        </p>
                        <textarea
                            value={licenseKeysText}
                            onChange={(e) => setLicenseKeysText(e.target.value)}
                            placeholder="XXXXX-XXXXX-XXXXX-XXXXX-XXXXX
YYYYY-YYYYY-YYYYY-YYYYY-YYYYY
ZZZZZ-ZZZZZ-ZZZZZ-ZZZZZ-ZZZZZ"
                            className="w-full min-h-[200px] p-3 border rounded-md bg-background font-mono text-sm"
                            required
                        />
                        {licenseKeysText && (
                            <p className="text-sm text-muted-foreground mt-1">
                                {licenseKeysText.split('\n').filter(k => k.trim()).length} keys detected
                            </p>
                        )}
                    </div>
                </div>

                <div className="flex gap-4">
                    <Button type="submit" disabled={isLoading} className="gap-2">
                        {isLoading ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                            <Upload className="h-4 w-4" />
                        )}
                        Upload License Keys
                    </Button>
                    <Link href="/admin/licenses">
                        <Button type="button" variant="outline">Cancel</Button>
                    </Link>
                </div>
            </form>
        </div>
    );
}
