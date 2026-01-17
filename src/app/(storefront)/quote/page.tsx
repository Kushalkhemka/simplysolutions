'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Link from 'next/link';
import { Building2, Package, Plus, Minus, Trash2, Loader2, Send, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuthStore } from '@/stores/auth-store';
import { toast } from 'sonner';

const quoteSchema = z.object({
    companyName: z.string().min(2, 'Company name is required'),
    contactName: z.string().min(2, 'Contact name is required'),
    email: z.string().email('Valid email is required'),
    phone: z.string().optional(),
    gstn: z.string().optional(),
    notes: z.string().optional(),
});

type QuoteForm = z.infer<typeof quoteSchema>;

interface Product {
    id: string;
    name: string;
    price: number;
    main_image_url: string | null;
}

interface QuoteItem {
    product: Product;
    quantity: number;
}

export default function QuotePage() {
    const router = useRouter();
    const { user, isAuthenticated } = useAuthStore();
    const [products, setProducts] = useState<Product[]>([]);
    const [quoteItems, setQuoteItems] = useState<QuoteItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitted, setSubmitted] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');

    const { register, handleSubmit, formState: { errors }, setValue } = useForm<QuoteForm>({
        resolver: zodResolver(quoteSchema),
    });

    useEffect(() => {
        fetchProducts();
    }, []);

    useEffect(() => {
        if (user) {
            setValue('email', user.email || '');
            setValue('contactName', user.full_name || '');
            setValue('phone', (user as any).phone || '');
            setValue('gstn', (user as any).gstn || '');
            setValue('companyName', (user as any).business_name || '');
        }
    }, [user, setValue]);

    const fetchProducts = async () => {
        try {
            const res = await fetch('/api/products?limit=100');
            const data = await res.json();
            if (data.success) {
                setProducts(data.data || []);
            }
        } catch (error) {
            console.error('Failed to fetch products:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const addToQuote = (product: Product) => {
        const existing = quoteItems.find(item => item.product.id === product.id);
        if (existing) {
            setQuoteItems(quoteItems.map(item =>
                item.product.id === product.id
                    ? { ...item, quantity: item.quantity + 1 }
                    : item
            ));
        } else {
            setQuoteItems([...quoteItems, { product, quantity: 5 }]); // Default to 5 for bulk
        }
    };

    const updateQuantity = (productId: string, delta: number) => {
        setQuoteItems(quoteItems.map(item =>
            item.product.id === productId
                ? { ...item, quantity: Math.max(1, item.quantity + delta) }
                : item
        ).filter(item => item.quantity > 0));
    };

    const removeItem = (productId: string) => {
        setQuoteItems(quoteItems.filter(item => item.product.id !== productId));
    };

    const onSubmit = async (data: QuoteForm) => {
        if (quoteItems.length === 0) {
            toast.error('Please add at least one product');
            return;
        }

        setIsSubmitting(true);
        try {
            const res = await fetch('/api/quotes', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...data,
                    products: quoteItems.map(item => ({
                        product_id: item.product.id,
                        product_name: item.product.name,
                        quantity: item.quantity,
                        unit_price: item.product.price,
                    })),
                    total_quantity: quoteItems.reduce((sum, item) => sum + item.quantity, 0),
                }),
            });

            const result = await res.json();
            if (result.success) {
                setSubmitted(true);
                toast.success('Quote request submitted successfully!');
            } else {
                toast.error(result.error || 'Failed to submit quote request');
            }
        } catch (error) {
            console.error('Submit error:', error);
            toast.error('An error occurred');
        } finally {
            setIsSubmitting(false);
        }
    };

    const filteredProducts = products.filter(p =>
        p.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const totalQuantity = quoteItems.reduce((sum, item) => sum + item.quantity, 0);
    const estimatedTotal = quoteItems.reduce((sum, item) => sum + (item.product.price * item.quantity), 0);

    // Volume discount tiers
    const getDiscountTier = (qty: number) => {
        if (qty >= 20) return { discount: 15, label: '15% off' };
        if (qty >= 10) return { discount: 10, label: '10% off' };
        if (qty >= 5) return { discount: 5, label: '5% off' };
        return { discount: 0, label: '' };
    };

    const discountTier = getDiscountTier(totalQuantity);
    const discountAmount = (estimatedTotal * discountTier.discount) / 100;

    if (submitted) {
        return (
            <div className="container mx-auto px-4 py-16 text-center max-w-md">
                <div className="bg-green-100 dark:bg-green-900/20 rounded-full p-6 w-24 h-24 mx-auto mb-6 flex items-center justify-center">
                    <CheckCircle className="h-12 w-12 text-green-600" />
                </div>
                <h1 className="text-2xl font-bold mb-4">Quote Request Submitted!</h1>
                <p className="text-muted-foreground mb-6">
                    Thank you for your interest. Our team will review your request and get back to you within 24 hours with a customized quote.
                </p>
                <div className="space-y-3">
                    <Link href="/products">
                        <Button className="w-full">Continue Shopping</Button>
                    </Link>
                    <Button variant="outline" onClick={() => setSubmitted(false)} className="w-full">
                        Submit Another Quote
                    </Button>
                </div>
            </div>
        );
    }

    return (
        <div className="container mx-auto px-4 py-8">
            <div className="max-w-4xl mx-auto">
                {/* Header */}
                <div className="text-center mb-8">
                    <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full text-sm mb-4">
                        <Building2 className="h-4 w-4" />
                        B2B / Bulk Orders
                    </div>
                    <h1 className="text-3xl font-bold mb-2">Request a Quote</h1>
                    <p className="text-muted-foreground">
                        Get special pricing for bulk orders. Volume discounts available!
                    </p>
                </div>

                {/* Discount Tiers Info */}
                <div className="grid grid-cols-3 gap-4 mb-8">
                    <div className="text-center p-4 border rounded-lg">
                        <p className="text-2xl font-bold text-primary">5%</p>
                        <p className="text-sm text-muted-foreground">5+ licenses</p>
                    </div>
                    <div className="text-center p-4 border rounded-lg">
                        <p className="text-2xl font-bold text-primary">10%</p>
                        <p className="text-sm text-muted-foreground">10+ licenses</p>
                    </div>
                    <div className="text-center p-4 border rounded-lg">
                        <p className="text-2xl font-bold text-primary">15%</p>
                        <p className="text-sm text-muted-foreground">20+ licenses</p>
                    </div>
                </div>

                <div className="grid lg:grid-cols-2 gap-8">
                    {/* Product Selection */}
                    <div>
                        <h2 className="font-semibold mb-4">Select Products</h2>
                        <Input
                            placeholder="Search products..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="mb-4"
                        />

                        <div className="space-y-2 max-h-[400px] overflow-y-auto">
                            {isLoading ? (
                                <div className="text-center py-8">
                                    <Loader2 className="h-6 w-6 animate-spin mx-auto" />
                                </div>
                            ) : filteredProducts.length === 0 ? (
                                <p className="text-center py-8 text-muted-foreground">No products found</p>
                            ) : (
                                filteredProducts.map((product) => (
                                    <div
                                        key={product.id}
                                        className="flex items-center gap-3 p-3 border rounded-lg hover:bg-muted/50 cursor-pointer"
                                        onClick={() => addToQuote(product)}
                                    >
                                        {product.main_image_url && (
                                            <img
                                                src={product.main_image_url}
                                                alt={product.name}
                                                className="w-12 h-12 object-contain bg-muted rounded"
                                            />
                                        )}
                                        <div className="flex-1 min-w-0">
                                            <p className="font-medium truncate">{product.name}</p>
                                            <p className="text-sm text-muted-foreground">
                                                ₹{product.price.toLocaleString('en-IN')} per license
                                            </p>
                                        </div>
                                        <Button size="sm" variant="ghost">
                                            <Plus className="h-4 w-4" />
                                        </Button>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>

                    {/* Quote Form */}
                    <div>
                        <h2 className="font-semibold mb-4">Quote Details</h2>

                        {/* Selected Items */}
                        {quoteItems.length > 0 && (
                            <div className="border rounded-lg p-4 mb-4 space-y-3">
                                {quoteItems.map((item) => (
                                    <div key={item.product.id} className="flex items-center gap-3">
                                        <div className="flex-1 min-w-0">
                                            <p className="font-medium text-sm truncate">{item.product.name}</p>
                                            <p className="text-xs text-muted-foreground">
                                                ₹{(item.product.price * item.quantity).toLocaleString('en-IN')}
                                            </p>
                                        </div>
                                        <div className="flex items-center gap-1">
                                            <Button
                                                size="icon"
                                                variant="outline"
                                                className="h-7 w-7"
                                                onClick={() => updateQuantity(item.product.id, -1)}
                                            >
                                                <Minus className="h-3 w-3" />
                                            </Button>
                                            <span className="w-8 text-center text-sm">{item.quantity}</span>
                                            <Button
                                                size="icon"
                                                variant="outline"
                                                className="h-7 w-7"
                                                onClick={() => updateQuantity(item.product.id, 1)}
                                            >
                                                <Plus className="h-3 w-3" />
                                            </Button>
                                            <Button
                                                size="icon"
                                                variant="ghost"
                                                className="h-7 w-7 text-destructive"
                                                onClick={() => removeItem(item.product.id)}
                                            >
                                                <Trash2 className="h-3 w-3" />
                                            </Button>
                                        </div>
                                    </div>
                                ))}

                                <div className="border-t pt-3 mt-3">
                                    <div className="flex justify-between text-sm">
                                        <span>Subtotal ({totalQuantity} items)</span>
                                        <span>₹{estimatedTotal.toLocaleString('en-IN')}</span>
                                    </div>
                                    {discountTier.discount > 0 && (
                                        <div className="flex justify-between text-sm text-green-600">
                                            <span>Volume Discount ({discountTier.label})</span>
                                            <span>-₹{discountAmount.toLocaleString('en-IN')}</span>
                                        </div>
                                    )}
                                    <div className="flex justify-between font-semibold mt-2">
                                        <span>Estimated Total</span>
                                        <span>₹{(estimatedTotal - discountAmount).toLocaleString('en-IN')}</span>
                                    </div>
                                    <p className="text-xs text-muted-foreground mt-2">
                                        * Final price may vary based on custom discounts
                                    </p>
                                </div>
                            </div>
                        )}

                        {/* Contact Form */}
                        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <Label htmlFor="companyName">Company Name *</Label>
                                    <Input
                                        id="companyName"
                                        {...register('companyName')}
                                        className={errors.companyName ? 'border-destructive' : ''}
                                    />
                                    {errors.companyName && (
                                        <p className="text-xs text-destructive mt-1">{errors.companyName.message}</p>
                                    )}
                                </div>
                                <div>
                                    <Label htmlFor="contactName">Contact Name *</Label>
                                    <Input
                                        id="contactName"
                                        {...register('contactName')}
                                        className={errors.contactName ? 'border-destructive' : ''}
                                    />
                                    {errors.contactName && (
                                        <p className="text-xs text-destructive mt-1">{errors.contactName.message}</p>
                                    )}
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <Label htmlFor="email">Email *</Label>
                                    <Input
                                        id="email"
                                        type="email"
                                        {...register('email')}
                                        className={errors.email ? 'border-destructive' : ''}
                                    />
                                    {errors.email && (
                                        <p className="text-xs text-destructive mt-1">{errors.email.message}</p>
                                    )}
                                </div>
                                <div>
                                    <Label htmlFor="phone">Phone</Label>
                                    <Input
                                        id="phone"
                                        type="tel"
                                        {...register('phone')}
                                        placeholder="+91 98765 43210"
                                    />
                                </div>
                            </div>

                            <div>
                                <Label htmlFor="gstn">GSTN (Optional)</Label>
                                <Input
                                    id="gstn"
                                    {...register('gstn')}
                                    placeholder="22AAAAA0000A1Z5"
                                />
                            </div>

                            <div>
                                <Label htmlFor="notes">Additional Notes</Label>
                                <textarea
                                    id="notes"
                                    {...register('notes')}
                                    placeholder="Any specific requirements or questions..."
                                    className="w-full min-h-[80px] p-3 border rounded-md bg-background"
                                />
                            </div>

                            <Button
                                type="submit"
                                className="w-full gap-2"
                                disabled={isSubmitting || quoteItems.length === 0}
                            >
                                {isSubmitting ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                    <Send className="h-4 w-4" />
                                )}
                                Submit Quote Request
                            </Button>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
}
