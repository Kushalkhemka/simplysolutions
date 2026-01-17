import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { ProductCard } from '@/components/product/ProductCard';
import { Badge } from '@/components/ui/badge';
import { Clock, Zap, Flame } from 'lucide-react';

export default async function DealsPage() {
    const supabase = await createClient();

    // Fetch active deals
    const now = new Date().toISOString();
    const { data: deals } = await supabase
        .from('deals')
        .select(`
      *,
      product:products(*)
    `)
        .eq('is_active', true)
        .lte('start_time', now)
        .gte('end_time', now)
        .order('end_time', { ascending: true });

    // Fetch products on sale (high discount)
    const { data: saleProducts } = await supabase
        .from('products')
        .select('*')
        .eq('is_active', true)
        .gt('mrp', 0)
        .order('created_at', { ascending: false })
        .limit(8);

    // Filter to products with >30% discount
    const discountedProducts = (saleProducts || []).filter((p: any) => {
        const discount = ((p.mrp - p.price) / p.mrp) * 100;
        return discount >= 30;
    });

    return (
        <div className="container mx-auto px-4 py-8">
            {/* Hero */}
            <div className="bg-gradient-to-r from-red-500 to-orange-500 text-white rounded-2xl p-8 md:p-12 mb-12">
                <div className="flex items-center gap-2 mb-4">
                    <Flame className="h-8 w-8" />
                    <Badge className="bg-white/20 text-white text-lg px-3 py-1">
                        Hot Deals
                    </Badge>
                </div>
                <h1 className="text-3xl md:text-5xl font-bold mb-4">
                    Lightning Deals & Offers
                </h1>
                <p className="text-lg opacity-90 max-w-2xl">
                    Grab the best software deals before they're gone! Limited time offers on genuine Microsoft licenses.
                </p>
            </div>

            {/* Lightning Deals */}
            {deals && deals.length > 0 && (
                <section className="mb-12">
                    <div className="flex items-center gap-2 mb-6">
                        <Zap className="h-6 w-6 text-yellow-500" />
                        <h2 className="text-2xl font-bold">Lightning Deals</h2>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {deals.map((deal: any) => (
                            <div key={deal.id} className="border rounded-lg overflow-hidden">
                                {/* Countdown header */}
                                <div className="bg-red-500 text-white p-3 flex items-center justify-between">
                                    <span className="font-medium flex items-center gap-2">
                                        <Clock className="h-4 w-4" />
                                        Ends in
                                    </span>
                                    <DealCountdown endTime={deal.end_time} />
                                </div>

                                {/* Product */}
                                {deal.product && (
                                    <div className="p-4">
                                        <ProductCard product={deal.product} showQuickAdd={false} />
                                        <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg text-center">
                                            <p className="text-sm text-yellow-800">
                                                <strong>Deal Price:</strong> ₹{deal.deal_price.toLocaleString('en-IN')}
                                            </p>
                                            <p className="text-xs text-yellow-600 mt-1">
                                                {deal.stock_limit - deal.sold_count} left at this price
                                            </p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </section>
            )}

            {/* Products on Sale */}
            {discountedProducts.length > 0 && (
                <section>
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-2xl font-bold">🏷️ Best Value Products</h2>
                        <span className="text-muted-foreground">Up to 80% off</span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                        {discountedProducts.map((product: any) => (
                            <ProductCard key={product.id} product={product} />
                        ))}
                    </div>
                </section>
            )}

            {/* Empty state */}
            {(!deals || deals.length === 0) && discountedProducts.length === 0 && (
                <div className="text-center py-16">
                    <Flame className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                    <h2 className="text-xl font-semibold mb-2">No Active Deals</h2>
                    <p className="text-muted-foreground mb-6">
                        Check back soon for amazing offers!
                    </p>
                    <Link href="/products">
                        <span className="text-primary hover:underline">Browse All Products</span>
                    </Link>
                </div>
            )}
        </div>
    );
}

// Client component for countdown
function DealCountdown({ endTime }: { endTime: string }) {
    // This is a placeholder - in production, use a client component with useEffect
    const end = new Date(endTime);
    const now = new Date();
    const diff = end.getTime() - now.getTime();

    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

    return (
        <span className="font-mono font-bold">
            {hours}h {minutes}m
        </span>
    );
}
