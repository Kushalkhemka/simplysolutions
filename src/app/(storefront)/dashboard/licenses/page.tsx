'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Key, Package, Copy, Check, Loader2, Download, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

export default function LicensesPage() {
    const [orders, setOrders] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [copiedKey, setCopiedKey] = useState<string | null>(null);

    useEffect(() => {
        fetchOrdersWithLicenses();
    }, []);

    const fetchOrdersWithLicenses = async () => {
        try {
            const res = await fetch('/api/orders');
            const data = await res.json();
            if (data.success) {
                // Filter orders with license keys
                const ordersWithKeys = (data.data || []).filter((order: any) =>
                    order.status === 'delivered' &&
                    order.items?.some((item: any) => item.license_keys?.length > 0)
                );
                setOrders(ordersWithKeys);
            }
        } catch (error) {
            console.error('Failed to fetch licenses:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const copyKey = (key: string) => {
        navigator.clipboard.writeText(key);
        setCopiedKey(key);
        toast.success('License key copied!');
        setTimeout(() => setCopiedKey(null), 2000);
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center py-16">
                <Loader2 className="h-8 w-8 animate-spin" />
            </div>
        );
    }

    return (
        <div className="container-dense py-8">
            <div className="space-y-6">
                <div>
                    <h1 className="text-2xl md:text-3xl font-bold">My License Keys</h1>
                    <p className="text-muted-foreground">View and manage your purchased software licenses</p>
                </div>

                {orders.length === 0 ? (
                    <div className="text-center py-16">
                        <Key className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                        <h2 className="text-xl font-semibold mb-2">No License Keys Yet</h2>
                        <p className="text-muted-foreground mb-6">
                            Purchase software to receive your license keys here
                        </p>
                        <Link href="/products">
                            <Button>Browse Products</Button>
                        </Link>
                    </div>
                ) : (
                    <div className="space-y-6">
                        {orders.map((order: any) => (
                            <div key={order.id} className="bg-card border rounded-lg overflow-hidden">
                                {/* Order Header */}
                                <div className="bg-muted/50 p-4 flex items-center justify-between">
                                    <div>
                                        <p className="font-semibold">Order #{order.order_number}</p>
                                        <p className="text-sm text-muted-foreground">
                                            {new Date(order.created_at).toLocaleDateString('en-IN', {
                                                day: 'numeric',
                                                month: 'long',
                                                year: 'numeric',
                                            })}
                                        </p>
                                    </div>
                                    <Link href={`/dashboard/orders/${order.id}`}>
                                        <Button variant="outline" size="sm" className="gap-2">
                                            <ExternalLink className="h-4 w-4" />
                                            View Order
                                        </Button>
                                    </Link>
                                </div>

                                {/* License Keys */}
                                <div className="divide-y">
                                    {order.items?.filter((item: any) => item.license_keys?.length > 0).map((item: any) => (
                                        <div key={item.id} className="p-4">
                                            <div className="flex items-start gap-4 mb-4">
                                                {item.product?.main_image_url && (
                                                    <img
                                                        src={item.product.main_image_url}
                                                        alt={item.product_name}
                                                        className="w-16 h-16 object-contain bg-muted rounded"
                                                    />
                                                )}
                                                <div className="flex-1">
                                                    <h3 className="font-medium">{item.product_name}</h3>
                                                    <p className="text-sm text-muted-foreground">
                                                        {item.quantity} license{item.quantity > 1 ? 's' : ''}
                                                    </p>
                                                </div>
                                                {item.download_link && (
                                                    <a href={item.download_link} target="_blank" rel="noopener noreferrer">
                                                        <Button variant="outline" size="sm" className="gap-2">
                                                            <Download className="h-4 w-4" />
                                                            Download
                                                        </Button>
                                                    </a>
                                                )}
                                            </div>

                                            <div className="space-y-2">
                                                {item.license_keys.map((key: string, idx: number) => (
                                                    <div
                                                        key={idx}
                                                        className="flex items-center gap-2 bg-muted rounded-lg px-4 py-2"
                                                    >
                                                        <Key className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                                                        <code className="flex-1 font-mono text-sm break-all">{key}</code>
                                                        <Button
                                                            size="sm"
                                                            variant="ghost"
                                                            onClick={() => copyKey(key)}
                                                            className="flex-shrink-0"
                                                        >
                                                            {copiedKey === key ? (
                                                                <Check className="h-4 w-4 text-green-500" />
                                                            ) : (
                                                                <Copy className="h-4 w-4" />
                                                            )}
                                                        </Button>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
