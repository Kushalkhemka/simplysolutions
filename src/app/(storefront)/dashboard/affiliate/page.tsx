'use client';

import { useState, useEffect } from 'react';
import {
    DollarSign, Link as LinkIcon, MousePointerClick, TrendingUp,
    Copy, Check, Loader2, AlertCircle, Users
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
            <div className="container-dense py-8">
                <h1 className="text-2xl md:text-3xl font-bold mb-8">Affiliate Program</h1>

                {/* Hero Section - Matching orange theme */}
                <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-2xl p-8 text-white mb-8 shadow-lg">
                    <div className="flex items-center justify-between">
                        <div>
                            <div className="flex items-center gap-2 mb-2">
                                <DollarSign className="h-6 w-6" />
                                <p className="text-white/90 font-medium">Earn 10% Commission</p>
                            </div>
                            <h2 className="text-3xl sm:text-4xl font-bold mb-3">Become an Affiliate</h2>
                            <p className="text-white/80 max-w-md">
                                Join our affiliate program and earn money for every sale you refer!
                            </p>
                        </div>
                        <div className="hidden md:block">
                            <Users className="h-32 w-32 text-white/20" />
                        </div>
                    </div>
                </div>

                {/* Benefits Section - Unified design */}
                <div className="border rounded-xl p-6 mb-8 bg-card">
                    <h2 className="font-semibold mb-4 text-lg">Why Join Our Affiliate Program?</h2>
                    <div className="grid gap-4">
                        <div className="flex items-start gap-4 p-4 border rounded-lg hover:bg-muted/30 transition-colors">
                            <div className="p-2 bg-orange-100 dark:bg-orange-950/30 rounded-lg">
                                <DollarSign className="h-5 w-5 text-orange-600" />
                            </div>
                            <div>
                                <p className="font-medium">10% Commission on Every Sale</p>
                                <p className="text-sm text-muted-foreground">Earn real money for each successful referral</p>
                            </div>
                        </div>
                        <div className="flex items-start gap-4 p-4 border rounded-lg hover:bg-muted/30 transition-colors">
                            <div className="p-2 bg-orange-100 dark:bg-orange-950/30 rounded-lg">
                                <TrendingUp className="h-5 w-5 text-orange-600" />
                            </div>
                            <div>
                                <p className="font-medium">Real-time Analytics</p>
                                <p className="text-sm text-muted-foreground">Track your clicks and conversions instantly</p>
                            </div>
                        </div>
                        <div className="flex items-start gap-4 p-4 border rounded-lg hover:bg-muted/30 transition-colors">
                            <div className="p-2 bg-orange-100 dark:bg-orange-950/30 rounded-lg">
                                <LinkIcon className="h-5 w-5 text-orange-600" />
                            </div>
                            <div>
                                <p className="font-medium">Unique Affiliate Link</p>
                                <p className="text-sm text-muted-foreground">Share your personalized link and start earning</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Application Form */}
                <form onSubmit={applyAsAffiliate} className="bg-card border rounded-xl p-6 space-y-4">
                    <h2 className="font-semibold text-lg">Apply Now</h2>
                    <div>
                        <Label>Payout Email *</Label>
                        <Input
                            type="email"
                            required
                            value={payoutEmail}
                            onChange={(e) => setPayoutEmail(e.target.value)}
                            placeholder="your@email.com"
                            className="mt-1.5"
                        />
                        <p className="text-xs text-muted-foreground mt-1.5">
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
        <div className="container-dense py-8">
            <h1 className="text-2xl md:text-3xl font-bold mb-8">Affiliate Dashboard</h1>

            {/* Hero Stats - Orange theme */}
            <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-2xl p-8 text-white shadow-lg mb-8">
                <div className="flex flex-col md:flex-row items-center justify-between gap-6">
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
            <div className="bg-card border rounded-xl p-6 mb-8 shadow-sm">
                <h2 className="font-semibold mb-4 flex items-center gap-2">
                    <LinkIcon className="h-5 w-5 text-orange-600" />
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
                    <span>Commission Rate: <span className="font-bold text-orange-600">{affiliate.commission_rate}%</span></span>
                </div>
            </div>

            {/* Recent Commissions */}
            <div className="border rounded-xl overflow-hidden">
                <div className="p-4 border-b bg-muted/30">
                    <h2 className="font-semibold">Recent Commissions</h2>
                </div>
                {data.recentCommissions?.length > 0 ? (
                    <div className="divide-y">
                        {data.recentCommissions.map((com: any) => (
                            <div key={com.id} className="p-4 sm:p-6 hover:bg-muted/30 transition-colors">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-4">
                                        <div className="p-2 bg-orange-100 dark:bg-orange-900/30 rounded-full">
                                            <DollarSign className="h-5 w-5 text-orange-600" />
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
                                        <p className="font-bold text-orange-600">+₹{com.commission_amount}</p>
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
