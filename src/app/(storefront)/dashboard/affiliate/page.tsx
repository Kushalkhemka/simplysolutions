'use client';

import { useState, useEffect } from 'react';
import {
    DollarSign, Link as LinkIcon, MousePointerClick, TrendingUp,
    Copy, Check, Loader2, AlertCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';

export default function AffiliatePage() {
    const [data, setData] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isApplying, setIsApplying] = useState(false);
    const [payoutEmail, setPayoutEmail] = useState('');
    const [copied, setCopied] = useState(false);

    useEffect(() => {
        fetchAffiliateData();
    }, []);

    const fetchAffiliateData = async () => {
        try {
            const res = await fetch('/api/affiliate');
            const result = await res.json();
            if (result.success) {
                setData(result.data);
            }
        } catch (error) {
            console.error('Failed to fetch affiliate data:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const applyAsAffiliate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!payoutEmail) return;

        setIsApplying(true);
        try {
            const res = await fetch('/api/affiliate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ payoutEmail }),
            });

            const result = await res.json();

            if (result.success) {
                toast.success(result.data.message);
                fetchAffiliateData();
            } else {
                toast.error(result.error || 'Application failed');
            }
        } catch (error) {
            toast.error('Failed to submit application');
        } finally {
            setIsApplying(false);
        }
    };

    const copyLink = () => {
        if (data?.affiliate?.affiliateLink) {
            navigator.clipboard.writeText(data.affiliate.affiliateLink);
            setCopied(true);
            toast.success('Affiliate link copied!');
            setTimeout(() => setCopied(false), 2000);
        }
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center py-16">
                <Loader2 className="h-8 w-8 animate-spin" />
            </div>
        );
    }

    // Not an affiliate - show application form
    if (!data?.isAffiliate) {
        return (
            <div className="max-w-2xl mx-auto space-y-8">
                <div className="text-center">
                    <h1 className="text-2xl font-bold mb-2">Become an Affiliate</h1>
                    <p className="text-muted-foreground">
                        Earn 10% commission on every sale you refer!
                    </p>
                </div>

                <div className="bg-card border rounded-lg p-6">
                    <h2 className="font-semibold mb-4">Why Join Our Affiliate Program?</h2>
                    <ul className="space-y-3">
                        <li className="flex items-start gap-3">
                            <DollarSign className="h-5 w-5 text-green-500 mt-0.5" />
                            <div>
                                <p className="font-medium">10% Commission</p>
                                <p className="text-sm text-muted-foreground">Earn on every successful sale</p>
                            </div>
                        </li>
                        <li className="flex items-start gap-3">
                            <TrendingUp className="h-5 w-5 text-blue-500 mt-0.5" />
                            <div>
                                <p className="font-medium">Real-time Tracking</p>
                                <p className="text-sm text-muted-foreground">Monitor clicks and conversions</p>
                            </div>
                        </li>
                        <li className="flex items-start gap-3">
                            <LinkIcon className="h-5 w-5 text-purple-500 mt-0.5" />
                            <div>
                                <p className="font-medium">Unique Affiliate Link</p>
                                <p className="text-sm text-muted-foreground">Share and earn instantly</p>
                            </div>
                        </li>
                    </ul>
                </div>

                <form onSubmit={applyAsAffiliate} className="bg-card border rounded-lg p-6 space-y-4">
                    <h2 className="font-semibold">Apply Now</h2>
                    <div>
                        <Label>Payout Email *</Label>
                        <Input
                            type="email"
                            required
                            value={payoutEmail}
                            onChange={(e) => setPayoutEmail(e.target.value)}
                            placeholder="your@email.com"
                        />
                        <p className="text-xs text-muted-foreground mt-1">
                            We'll send commission payouts to this email
                        </p>
                    </div>
                    <Button type="submit" disabled={isApplying} className="w-full">
                        {isApplying ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Submit Application'}
                    </Button>
                </form>
            </div>
        );
    }

    const affiliate = data.affiliate;

    // Pending approval
    if (affiliate.status === 'pending') {
        return (
            <div className="max-w-2xl mx-auto text-center py-16">
                <AlertCircle className="h-16 w-16 text-yellow-500 mx-auto mb-4" />
                <h1 className="text-2xl font-bold mb-2">Application Pending</h1>
                <p className="text-muted-foreground">
                    Your affiliate application is under review. We'll notify you within 24-48 hours.
                </p>
            </div>
        );
    }

    // Approved - show dashboard
    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-2xl font-bold">Affiliate Dashboard</h1>
                <p className="text-muted-foreground">Track your earnings and performance</p>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-card border rounded-lg p-6 text-center">
                    <MousePointerClick className="h-8 w-8 mx-auto mb-2 text-blue-500" />
                    <p className="text-2xl font-bold">{affiliate.total_clicks || 0}</p>
                    <p className="text-sm text-muted-foreground">Total Clicks</p>
                </div>
                <div className="bg-card border rounded-lg p-6 text-center">
                    <TrendingUp className="h-8 w-8 mx-auto mb-2 text-green-500" />
                    <p className="text-2xl font-bold">{affiliate.total_conversions || 0}</p>
                    <p className="text-sm text-muted-foreground">Conversions</p>
                </div>
                <div className="bg-card border rounded-lg p-6 text-center">
                    <DollarSign className="h-8 w-8 mx-auto mb-2 text-yellow-500" />
                    <p className="text-2xl font-bold">₹{affiliate.pending_payout || 0}</p>
                    <p className="text-sm text-muted-foreground">Pending Payout</p>
                </div>
                <div className="bg-card border rounded-lg p-6 text-center">
                    <DollarSign className="h-8 w-8 mx-auto mb-2 text-primary" />
                    <p className="text-2xl font-bold">₹{affiliate.total_earnings || 0}</p>
                    <p className="text-sm text-muted-foreground">Total Earned</p>
                </div>
            </div>

            {/* Affiliate Link */}
            <div className="bg-card border rounded-lg p-6">
                <h2 className="font-semibold mb-4">Your Affiliate Link</h2>
                <div className="flex gap-2">
                    <Input value={affiliate.affiliateLink} readOnly className="font-mono text-sm" />
                    <Button onClick={copyLink} variant="outline" className="gap-2">
                        {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                        {copied ? 'Copied' : 'Copy'}
                    </Button>
                </div>
                <p className="text-sm text-muted-foreground mt-2">
                    Code: <code className="bg-muted px-2 py-0.5 rounded font-bold">{affiliate.affiliate_code}</code>
                    {' '} | Commission: <span className="font-bold">{affiliate.commission_rate}%</span>
                </p>
            </div>

            {/* Recent Commissions */}
            <div className="bg-card border rounded-lg">
                <div className="p-4 border-b">
                    <h2 className="font-semibold">Recent Commissions</h2>
                </div>
                {data.recentCommissions?.length > 0 ? (
                    <div className="divide-y">
                        {data.recentCommissions.map((com: any) => (
                            <div key={com.id} className="p-4 flex items-center justify-between">
                                <div>
                                    <p className="font-medium">Order #{com.order?.order_number}</p>
                                    <p className="text-sm text-muted-foreground">
                                        {new Date(com.created_at).toLocaleDateString('en-IN')}
                                    </p>
                                </div>
                                <div className="text-right">
                                    <p className="font-medium text-green-600">+₹{com.commission_amount}</p>
                                    <p className={`text-xs px-2 py-0.5 rounded ${com.status === 'paid'
                                            ? 'bg-green-100 text-green-800'
                                            : 'bg-yellow-100 text-yellow-800'
                                        }`}>
                                        {com.status}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <p className="p-8 text-center text-muted-foreground">
                        No commissions yet. Share your link to start earning!
                    </p>
                )}
            </div>
        </div>
    );
}
