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
        <div className="container-dense py-8">
            <h1 className="text-2xl md:text-3xl font-bold mb-8">Referral Program</h1>

            {/* Hero Card with Stats */}
            <div className="bg-gradient-to-br from-purple-600 to-purple-700 rounded-2xl p-8 text-white mb-8 shadow-lg">
                <div className="flex items-center justify-between">
                    <div>
                        <div className="flex items-center gap-2 mb-2">
                            <Share2 className="h-6 w-6" />
                            <p className="text-white/90 font-medium">Earn ₹50 for every friend you refer!</p>
                        </div>
                        <p className="text-5xl font-black mb-4">
                            ₹{data?.stats?.totalEarnings || 0}
                        </p>
                        <p className="text-white/80 text-sm">Total earned from referrals</p>
                    </div>
                    <div className="hidden md:block">
                        <Gift className="h-32 w-32 text-white/20" />
                    </div>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
                <div className="border rounded-lg p-6 text-center bg-blue-50 dark:bg-blue-950/20">
                    <Users className="h-8 w-8 mx-auto mb-2 text-blue-600" />
                    <p className="text-2xl font-bold">{data?.stats?.totalReferrals || 0}</p>
                    <p className="text-sm text-muted-foreground">Total Referrals</p>
                </div>
                <div className="border rounded-lg p-6 text-center bg-green-50 dark:bg-green-950/20">
                    <Gift className="h-8 w-8 mx-auto mb-2 text-green-600" />
                    <p className="text-2xl font-bold">{data?.stats?.completedReferrals || 0}</p>
                    <p className="text-sm text-muted-foreground">Successful</p>
                </div>
                <div className="border rounded-lg p-6 text-center bg-yellow-50 dark:bg-yellow-950/20">
                    <Gift className="h-8 w-8 mx-auto mb-2 text-yellow-600" />
                    <p className="text-2xl font-bold">{data?.stats?.pendingReferrals || 0}</p>
                    <p className="text-sm text-muted-foreground">Pending</p>
                </div>
                <div className="border rounded-lg p-6 text-center bg-purple-50 dark:bg-purple-950/20">
                    <Wallet className="h-8 w-8 mx-auto mb-2 text-purple-600" />
                    <p className="text-2xl font-bold">₹{data?.stats?.totalEarnings || 0}</p>
                    <p className="text-sm text-muted-foreground">Total Earned</p>
                </div>
            </div>

            {/* Referral Link */}
            <div className="border rounded-lg p-6 mb-8 bg-muted/30">
                <h2 className="text-xl font-semibold mb-4">Your Referral Link</h2>
                <div className="flex flex-col sm:flex-row gap-3">
                    <Input value={data?.referralLink || ''} readOnly className="font-mono text-sm flex-1" />
                    <div className="flex gap-2">
                        <Button onClick={copyLink} variant="outline" className="gap-2 flex-1 sm:flex-none">
                            {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                            {copied ? 'Copied' : 'Copy'}
                        </Button>
                        <Button onClick={shareLink} className="gap-2 bg-purple-600 hover:bg-purple-700 flex-1 sm:flex-none">
                            <Share2 className="h-4 w-4" />
                            Share
                        </Button>
                    </div>
                </div>
                <p className="text-sm text-muted-foreground mt-3">
                    Your code: <code className="bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300 px-2 py-1 rounded font-bold">{data?.referralCode}</code>
                </p>
            </div>

            {/* How It Works */}
            <div className="grid md:grid-cols-3 gap-4 mb-8">
                <div className="border rounded-lg p-6 text-center bg-purple-50 dark:bg-purple-950/20">
                    <div className="w-14 h-14 bg-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
                        <span className="text-2xl font-bold text-white">1</span>
                    </div>
                    <h3 className="font-semibold mb-2">Share Your Link</h3>
                    <p className="text-sm text-muted-foreground">Send your referral link to friends</p>
                </div>
                <div className="border rounded-lg p-6 text-center bg-green-50 dark:bg-green-950/20">
                    <div className="w-14 h-14 bg-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
                        <span className="text-2xl font-bold text-white">2</span>
                    </div>
                    <h3 className="font-semibold mb-2">They Sign Up</h3>
                    <p className="text-sm text-muted-foreground">Friend creates an account & makes a purchase</p>
                </div>
                <div className="border rounded-lg p-6 text-center bg-orange-50 dark:bg-orange-950/20">
                    <div className="w-14 h-14 bg-orange-600 rounded-full flex items-center justify-center mx-auto mb-4">
                        <span className="text-2xl font-bold text-white">3</span>
                    </div>
                    <h3 className="font-semibold mb-2">You Both Earn</h3>
                    <p className="text-sm text-muted-foreground">You get ₹50, they get ₹25 wallet credit</p>
                </div>
            </div>

            {/* Referral History */}
            <div className="border rounded-lg">
                <div className="p-6 border-b">
                    <h2 className="text-xl font-semibold">Referral History</h2>
                </div>
                {data?.referrals?.length > 0 ? (
                    <div className="divide-y">
                        {data.referrals.map((ref: any) => (
                            <div key={ref.id} className="p-6 hover:bg-muted/30 transition-colors flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-muted rounded-full">
                                        <Users className="h-4 w-4 text-purple-600" />
                                    </div>
                                    <div>
                                        <p className="font-medium">{ref.referred?.full_name || ref.referred?.email}</p>
                                        <p className="text-sm text-muted-foreground">
                                            {new Date(ref.created_at).toLocaleDateString('en-IN', {
                                                year: 'numeric',
                                                month: 'short',
                                                day: 'numeric',
                                            })}
                                        </p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="font-bold text-lg text-green-600">+₹{ref.referrer_reward}</p>
                                    <span className={`text-xs px-2 py-1 rounded-full ${ref.reward_status === 'credited'
                                        ? 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300'
                                        : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-300'
                                        }`}>
                                        {ref.reward_status}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="p-12 text-center">
                        <Gift className="h-16 w-16 mx-auto mb-4 text-purple-500" />
                        <h3 className="text-xl font-bold mb-2">No Referrals Yet</h3>
                        <p className="text-muted-foreground mb-4">Share your link to start earning rewards!</p>
                    </div>
                )}
            </div>
        </div>
    );
}
