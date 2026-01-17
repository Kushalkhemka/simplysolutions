'use client';

import { useState, useEffect } from 'react';
import { Gift, Users, Wallet, Copy, Check, Share2, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';

export default function ReferralsPage() {
    const [data, setData] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [copied, setCopied] = useState(false);

    useEffect(() => {
        fetchReferralData();
    }, []);

    const fetchReferralData = async () => {
        try {
            const res = await fetch('/api/referral');
            const result = await res.json();
            if (result.success) {
                setData(result.data);
            }
        } catch (error) {
            console.error('Failed to fetch referral data:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const copyLink = () => {
        if (data?.referralLink) {
            navigator.clipboard.writeText(data.referralLink);
            setCopied(true);
            toast.success('Referral link copied!');
            setTimeout(() => setCopied(false), 2000);
        }
    };

    const shareLink = () => {
        if (navigator.share && data?.referralLink) {
            navigator.share({
                title: 'SimplySolutions Referral',
                text: 'Get genuine software licenses at best prices!',
                url: data.referralLink,
            });
        } else {
            copyLink();
        }
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center py-16">
                <Loader2 className="h-8 w-8 animate-spin" />
            </div>
        );
    }

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-2xl font-bold">Referral Program</h1>
                <p className="text-muted-foreground">Earn ₹50 for every friend you refer!</p>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-card border rounded-lg p-6 text-center">
                    <Users className="h-8 w-8 mx-auto mb-2 text-primary" />
                    <p className="text-2xl font-bold">{data?.stats?.totalReferrals || 0}</p>
                    <p className="text-sm text-muted-foreground">Total Referrals</p>
                </div>
                <div className="bg-card border rounded-lg p-6 text-center">
                    <Gift className="h-8 w-8 mx-auto mb-2 text-green-500" />
                    <p className="text-2xl font-bold">{data?.stats?.completedReferrals || 0}</p>
                    <p className="text-sm text-muted-foreground">Successful</p>
                </div>
                <div className="bg-card border rounded-lg p-6 text-center">
                    <Gift className="h-8 w-8 mx-auto mb-2 text-yellow-500" />
                    <p className="text-2xl font-bold">{data?.stats?.pendingReferrals || 0}</p>
                    <p className="text-sm text-muted-foreground">Pending</p>
                </div>
                <div className="bg-card border rounded-lg p-6 text-center">
                    <Wallet className="h-8 w-8 mx-auto mb-2 text-blue-500" />
                    <p className="text-2xl font-bold">₹{data?.stats?.totalEarnings || 0}</p>
                    <p className="text-sm text-muted-foreground">Total Earned</p>
                </div>
            </div>

            {/* Referral Link */}
            <div className="bg-card border rounded-lg p-6">
                <h2 className="font-semibold mb-4">Your Referral Link</h2>
                <div className="flex gap-2">
                    <Input value={data?.referralLink || ''} readOnly className="font-mono text-sm" />
                    <Button onClick={copyLink} variant="outline" className="gap-2">
                        {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                        {copied ? 'Copied' : 'Copy'}
                    </Button>
                    <Button onClick={shareLink} className="gap-2">
                        <Share2 className="h-4 w-4" />
                        Share
                    </Button>
                </div>
                <p className="text-sm text-muted-foreground mt-2">
                    Your code: <code className="bg-muted px-2 py-0.5 rounded font-bold">{data?.referralCode}</code>
                </p>
            </div>

            {/* How It Works */}
            <div className="bg-card border rounded-lg p-6">
                <h2 className="font-semibold mb-4">How It Works</h2>
                <div className="grid md:grid-cols-3 gap-6">
                    <div className="text-center">
                        <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-3">
                            <span className="text-xl font-bold text-primary">1</span>
                        </div>
                        <h3 className="font-medium mb-1">Share Your Link</h3>
                        <p className="text-sm text-muted-foreground">Send your referral link to friends</p>
                    </div>
                    <div className="text-center">
                        <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-3">
                            <span className="text-xl font-bold text-primary">2</span>
                        </div>
                        <h3 className="font-medium mb-1">They Sign Up</h3>
                        <p className="text-sm text-muted-foreground">Friend creates an account & makes a purchase</p>
                    </div>
                    <div className="text-center">
                        <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-3">
                            <span className="text-xl font-bold text-primary">3</span>
                        </div>
                        <h3 className="font-medium mb-1">You Both Earn</h3>
                        <p className="text-sm text-muted-foreground">You get ₹50, they get ₹25 wallet credit</p>
                    </div>
                </div>
            </div>

            {/* Referral History */}
            <div className="bg-card border rounded-lg">
                <div className="p-4 border-b">
                    <h2 className="font-semibold">Referral History</h2>
                </div>
                {data?.referrals?.length > 0 ? (
                    <div className="divide-y">
                        {data.referrals.map((ref: any) => (
                            <div key={ref.id} className="p-4 flex items-center justify-between">
                                <div>
                                    <p className="font-medium">{ref.referred?.full_name || ref.referred?.email}</p>
                                    <p className="text-sm text-muted-foreground">
                                        {new Date(ref.created_at).toLocaleDateString('en-IN')}
                                    </p>
                                </div>
                                <div className="text-right">
                                    <p className="font-medium text-green-600">+₹{ref.referrer_reward}</p>
                                    <p className={`text-xs px-2 py-0.5 rounded ${ref.reward_status === 'credited'
                                            ? 'bg-green-100 text-green-800'
                                            : 'bg-yellow-100 text-yellow-800'
                                        }`}>
                                        {ref.reward_status}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <p className="p-8 text-center text-muted-foreground">
                        No referrals yet. Share your link to start earning!
                    </p>
                )}
            </div>
        </div>
    );
}
