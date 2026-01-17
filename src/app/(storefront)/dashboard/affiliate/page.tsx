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
                {/* Hero Section */}
                <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-purple-600 via-blue-600 to-cyan-500 p-8 text-white">
                    <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4xIj48Y2lyY2xlIGN4PSIzMCIgY3k9IjMwIiByPSI0Ii8+PC9nPjwvZz48L3N2Zz4=')] opacity-30"></div>
                    <div className="relative text-center">
                        <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm px-4 py-1.5 rounded-full text-sm mb-4">
                            <DollarSign className="h-4 w-4" />
                            <span>Earn 10% Commission</span>
                        </div>
                        <h1 className="text-3xl sm:text-4xl font-bold mb-3">Become an Affiliate</h1>
                        <p className="text-white/80 max-w-md mx-auto">
                            Join our affiliate program and earn money for every sale you refer!
                        </p>
                    </div>
                </div>

                <div className="bg-card border rounded-xl p-6">
                    <h2 className="font-semibold mb-4 text-lg">Why Join Our Affiliate Program?</h2>
                    <div className="grid gap-4">
                        <div className="flex items-start gap-4 p-4 bg-green-50 dark:bg-green-950/20 rounded-lg border border-green-200 dark:border-green-900">
                            <div className="p-2 bg-green-500 rounded-lg">
                                <DollarSign className="h-5 w-5 text-white" />
                            </div>
                            <div>
                                <p className="font-medium">10% Commission on Every Sale</p>
                                <p className="text-sm text-muted-foreground">Earn real money for each successful referral</p>
                            </div>
                        </div>
                        <div className="flex items-start gap-4 p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-900">
                            <div className="p-2 bg-blue-500 rounded-lg">
                                <TrendingUp className="h-5 w-5 text-white" />
                            </div>
                            <div>
                                <p className="font-medium">Real-time Analytics</p>
                                <p className="text-sm text-muted-foreground">Track your clicks and conversions instantly</p>
                            </div>
                        </div>
                        <div className="flex items-start gap-4 p-4 bg-purple-50 dark:bg-purple-950/20 rounded-lg border border-purple-200 dark:border-purple-900">
                            <div className="p-2 bg-purple-500 rounded-lg">
                                <LinkIcon className="h-5 w-5 text-white" />
                            </div>
                            <div>
                                <p className="font-medium">Unique Affiliate Link</p>
                                <p className="text-sm text-muted-foreground">Share your personalized link and start earning</p>
                            </div>
                        </div>
                    </div>
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
        <div className="container mx-auto px-4 py-8">
            <h1 className="text-2xl md:text-3xl font-bold mb-8">Affiliate Dashboard</h1>

            {/* Hero Stats */}
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-purple-600 via-blue-600 to-cyan-500 p-8 text-white shadow-lg mb-8">
                <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBfiWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4xIj48Y2lyY2xlIGN4PSIzMCIgY3k9IjMwIiByPSI0Ii8+PC9nPjwvZz48L3N2Zz4=')] opacity-30"></div>
                <div className="relative flex flex-col md:flex-row items-center justify-between gap-6">
                    <div>
                        <div className="flex items-center gap-2 mb-2 text-white/90">
                            <DollarSign className="h-5 w-5" />
                            <span className="font-medium">Total Earnings</span>
                        </div>
                        <p className="text-5xl font-black mb-2">₹{affiliate.total_earnings || 0}</p>
                        <p className="text-white/80">Pending Payout: ₹{affiliate.pending_payout || 0}</p>
                    </div>
                    <div className="flex gap-4">
                        <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 text-center min-w-[100px]">
                            <MousePointerClick className="h-6 w-6 mx-auto mb-1" />
                            <p className="text-2xl font-bold">{affiliate.total_clicks || 0}</p>
                            <p className="text-xs text-white/70">Clicks</p>
                        </div>
                        <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 text-center min-w-[100px]">
                            <TrendingUp className="h-6 w-6 mx-auto mb-1" />
                            <p className="text-2xl font-bold">{affiliate.total_conversions || 0}</p>
                            <p className="text-xs text-white/70">Sales</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Affiliate Link */}
            <div className="bg-card border rounded-lg p-6 mb-8 shadow-sm">
                <h2 className="font-semibold mb-4 flex items-center gap-2">
                    <LinkIcon className="h-5 w-5 text-primary" />
                    Your Affiliate Link
                </h2>
                <div className="flex gap-2">
                    <Input value={affiliate.affiliateLink} readOnly className="font-mono text-sm bg-muted" />
                    <Button onClick={copyLink} variant="outline" className="gap-2">
                        {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                        {copied ? 'Copied' : 'Copy'}
                    </Button>
                </div>
                <div className="flex items-center gap-4 mt-3 text-sm text-muted-foreground">
                    <span>Code: <code className="bg-muted px-2 py-0.5 rounded font-bold text-foreground">{affiliate.affiliate_code}</code></span>
                    <span>Commission Rate: <span className="font-bold text-green-600">{affiliate.commission_rate}%</span></span>
                </div>
            </div>

            {/* Recent Commissions */}
            <div className="border rounded-lg overflow-hidden">
                <div className="p-4 border-b bg-muted/30">
                    <h2 className="font-semibold">Recent Commissions</h2>
                </div>
                {data.recentCommissions?.length > 0 ? (
                    <div className="divide-y">
                        {data.recentCommissions.map((com: any) => (
                            <div key={com.id} className="p-4 sm:p-6 hover:bg-muted/30 transition-colors">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-4">
                                        <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-full">
                                            <DollarSign className="h-5 w-5 text-green-600" />
                                        </div>
                                        <div>
                                            <p className="font-medium">Order #{com.order?.order_number}</p>
                                            <p className="text-sm text-muted-foreground">
                                                {new Date(com.created_at).toLocaleDateString('en-IN', {
                                                    year: 'numeric',
                                                    month: 'short',
                                                    day: 'numeric'
                                                })}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="font-bold text-green-600">+₹{com.commission_amount}</p>
                                        <p className={`text-xs px-2 py-0.5 rounded inline-block mt-1 ${com.status === 'paid'
                                            ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                                            : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
                                            }`}>
                                            {com.status.charAt(0).toUpperCase() + com.status.slice(1)}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="p-12 text-center text-muted-foreground">
                        <TrendingUp className="h-12 w-12 mx-auto mb-3 opacity-20" />
                        <p>No commissions yet. Share your link to start earning!</p>
                    </div>
                )}
            </div>
        </div>
    );
}
