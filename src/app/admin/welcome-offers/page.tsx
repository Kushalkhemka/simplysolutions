'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import Link from 'next/link';
import { Sparkles, Percent, Gift, Edit2, Loader2, Clock, DollarSign, Package } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

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
    product?: {
        id: string;
        name: string;
        price: number;
    };
}

export default function WelcomeOffersPage() {
    const [templates, setTemplates] = useState<OfferTemplate[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        fetchTemplates();
    }, []);

    const fetchTemplates = async () => {
        setIsLoading(true);
        try {
            const res = await fetch('/api/admin/welcome-offers');
            const data = await res.json();
            if (data.success) {
                setTemplates(data.data.templates || []);
            }
        } catch (error) {
            console.error('Failed to fetch templates:', error);
        }
        setIsLoading(false);
    };

    const getOfferIcon = (type: string) => {
        switch (type) {
            case 'flash_deal':
                return <Sparkles className="h-5 w-5" />;
            case 'price_slash':
                return <Percent className="h-5 w-5" />;
            case 'bogo':
                return <Gift className="h-5 w-5" />;
            default:
                return null;
        }
    };

    const getOfferColor = (type: string) => {
        switch (type) {
            case 'flash_deal':
                return 'bg-orange-50 dark:bg-orange-950/40 border-orange-200 dark:border-orange-800 text-orange-700 dark:text-orange-300';
            case 'price_slash':
                return 'bg-blue-50 dark:bg-blue-950/40 border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300';
            case 'bogo':
                return 'bg-green-50 dark:bg-green-950/40 border-green-200 dark:border-green-800 text-green-700 dark:text-green-300';
            default:
                return 'bg-muted dark:bg-muted border-border text-foreground';
        }
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold">Welcome Offers Configuration</h1>
                <p className="text-muted-foreground">
                    Configure offers shown to first-time and returning users
                </p>
            </div>

            <div className="grid gap-4">
                {templates.map((template) => (
                    <div
                        key={template.id}
                        className={`border rounded-lg p-6 ${getOfferColor(template.offer_type)}`}
                    >
                        <div className="flex items-start justify-between">
                            <div className="flex items-start gap-4 flex-1">
                                <div className="p-3 bg-white dark:bg-neutral-900 rounded-lg border">
                                    {getOfferIcon(template.offer_type)}
                                </div>
                                <div className="flex-1 space-y-2">
                                    <div className="flex items-center gap-2">
                                        <h3 className="text-lg font-semibold">{template.title}</h3>
                                        <Badge variant={template.is_active ? 'default' : 'secondary'}>
                                            {template.is_active ? 'Active' : 'Inactive'}
                                        </Badge>
                                    </div>
                                    {template.description && (
                                        <p className="text-sm opacity-90">{template.description}</p>
                                    )}
                                    <div className="flex items-center gap-4 text-sm">
                                        <div className="flex items-center gap-1">
                                            <Clock className="h-4 w-4" />
                                            <span>
                                                {template.duration_hours >= 1
                                                    ? `${template.duration_hours} ${template.duration_hours === 1 ? 'hour' : 'hours'}`
                                                    : `${Math.round(template.duration_hours * 60)} minutes`
                                                }
                                            </span>
                                        </div>
                                        {template.offer_type === 'flash_deal' && template.product && (
                                            <div className="flex items-center gap-1">
                                                <Package className="h-4 w-4" />
                                                <span>{template.product.name}</span>
                                            </div>
                                        )}
                                        {template.special_price && (
                                            <div className="flex items-center gap-1">
                                                <DollarSign className="h-4 w-4" />
                                                <span>₹{template.special_price}</span>
                                            </div>
                                        )}
                                        {template.discount_value && (
                                            <div className="flex items-center gap-1">
                                                <Percent className="h-4 w-4" />
                                                <span>{template.discount_value}% off</span>
                                            </div>
                                        )}
                                        {template.max_discount_cap && (
                                            <div className="flex items-center gap-1">
                                                <DollarSign className="h-4 w-4" />
                                                <span>Max ₹{template.max_discount_cap}</span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                            <Link href={`/admin/welcome-offers/${template.offer_type}`}>
                                <Button variant="outline" size="sm" className="gap-2">
                                    <Edit2 className="h-4 w-4" />
                                    Edit
                                </Button>
                            </Link>
                        </div>
                    </div>
                ))}
            </div>

            {templates.length === 0 && (
                <div className="text-center py-12 text-muted-foreground">
                    <p>No offer templates configured</p>
                </div>
            )}
        </div>
    );
}
