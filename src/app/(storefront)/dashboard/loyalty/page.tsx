'use client';

import { useEffect, useState } from 'react';
import { Coins, TrendingUp, TrendingDown, Sparkles, Gift, Info } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

interface LoyaltyTransaction {
    id: string;
    transaction_type: 'earned' | 'redeemed' | 'expired' | 'adjusted';
    points: number;
    balance_after: number;
    description: string;
    created_at: string;
}

export default function LoyaltyPage() {
    const [balance, setBalance] = useState(0);
    const [transactions, setTransactions] = useState<LoyaltyTransaction[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchLoyaltyData = async () => {
            try {
                const res = await fetch('/api/loyalty/balance');
                const result = await res.json();

                if (result.success) {
                    setBalance(result.data.balance || 0);
                    setTransactions(result.data.transactions?.data || []);
                }
            } catch (error) {
                console.error('Error fetching loyalty data:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchLoyaltyData();
    }, []);

    const getTransactionIcon = (type: string) => {
        switch (type) {
            case 'earned':
                return <TrendingUp className="h-4 w-4 text-green-600" />;
            case 'redeemed':
                return <TrendingDown className="h-4 w-4 text-orange-600" />;
            case 'expired':
                return <Info className="h-4 w-4 text-gray-400" />;
            default:
                return <Coins className="h-4 w-4 text-blue-600" />;
        }
    };

    const getTransactionColor = (type: string) => {
        switch (type) {
            case 'earned':
                return 'text-green-600';
            case 'redeemed':
                return 'text-orange-600';
            case 'expired':
                return 'text-gray-400';
            default:
                return 'text-blue-600';
        }
    };

    if (loading) {
        return (
            <div className="container mx-auto px-4 py-8">
                <div className="animate-pulse space-y-6">
                    <div className="h-48 bg-muted rounded-lg"></div>
                    <div className="h-64 bg-muted rounded-lg"></div>
                </div>
            </div>
        );
    }

    return (
        <div className="container-dense py-8">
            <h1 className="text-2xl md:text-3xl font-bold mb-8">My Loyalty Points</h1>

            {/* Balance Card */}
            <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-2xl p-8 text-white mb-8 shadow-lg">
                <div className="flex items-center justify-between">
                    <div>
                        <div className="flex items-center gap-2 mb-2">
                            <Coins className="h-6 w-6" />
                            <p className="text-white/90 font-medium">Available Points</p>
                        </div>
                        <p className="text-5xl font-black mb-4">
                            {balance.toLocaleString('en-IN')}
                        </p>
                        <p className="text-white/80 text-sm mb-2">
                            Worth ₹{balance.toLocaleString('en-IN')} in discounts
                        </p>
                        <p className="text-white/70 text-xs">
                            Use up to 10% of your order value on your next purchase
                        </p>
                    </div>
                    <div className="hidden md:block">
                        <Gift className="h-32 w-32 text-white/20" />
                    </div>
                </div>
            </div>

            {/* Information Cards */}
            <div className="grid md:grid-cols-3 gap-4 mb-8">
                <div className="border rounded-lg p-6 bg-green-50 dark:bg-green-950/20">
                    <div className="flex items-center gap-2 mb-2">
                        <Sparkles className="h-5 w-5 text-green-600" />
                        <h3 className="font-semibold">How to Earn</h3>
                    </div>
                    <p className="text-sm text-muted-foreground">
                        Get 100 points for every ₹100 you spend. Points are credited after successful payment.
                    </p>
                </div>

                <div className="border rounded-lg p-6 bg-orange-50 dark:bg-orange-950/20">
                    <div className="flex items-center gap-2 mb-2">
                        <Gift className="h-5 w-5 text-orange-600" />
                        <h3 className="font-semibold">How to Redeem</h3>
                    </div>
                    <p className="text-sm text-muted-foreground">
                        Use your points at checkout. You can redeem up to 10% of your order value. 1 point = ₹1.
                    </p>
                </div>

                <div className="border rounded-lg p-6 bg-blue-50 dark:bg-blue-950/20">
                    <div className="flex items-center gap-2 mb-2">
                        <Info className="h-5 w-5 text-blue-600" />
                        <h3 className="font-semibold">Points Value</h3>
                    </div>
                    <p className="text-sm text-muted-foreground">
                        1 point = ₹1. No expiry on points. Start shopping to earn more!
                    </p>
                </div>
            </div>

            {/* Start Shopping CTA */}
            {balance === 0 && transactions.length === 0 && (
                <div className="border rounded-lg p-8 text-center mb-8 bg-muted/30">
                    <Sparkles className="h-16 w-16 mx-auto mb-4 text-orange-500" />
                    <h3 className="text-xl font-bold mb-2">Start Earning Points!</h3>
                    <p className="text-muted-foreground mb-4">
                        Make your first purchase and start earning loyalty points
                    </p>
                    <Link href="/products">
                        <Button size="lg">
                            Browse Products
                        </Button>
                    </Link>
                </div>
            )}

            {/* Transaction History */}
            {transactions.length > 0 && (
                <div className="border rounded-lg">
                    <div className="p-6 border-b">
                        <h2 className="text-xl font-semibold">Transaction History</h2>
                    </div>
                    <div className="divide-y">
                        {transactions.map((transaction) => (
                            <div key={transaction.id} className="p-6 hover:bg-muted/30 transition-colors">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-muted rounded-full">
                                            {getTransactionIcon(transaction.transaction_type)}
                                        </div>
                                        <div>
                                            <p className="font-medium">{transaction.description}</p>
                                            <p className="text-sm text-muted-foreground">
                                                {new Date(transaction.created_at).toLocaleDateString('en-IN', {
                                                    year: 'numeric',
                                                    month: 'short',
                                                    day: 'numeric',
                                                    hour: '2-digit',
                                                    minute: '2-digit',
                                                })}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className={`font-bold text-lg ${getTransactionColor(transaction.transaction_type)}`}>
                                            {transaction.transaction_type === 'earned' ? '+' : '-'}
                                            {transaction.points.toLocaleString('en-IN')}
                                        </p>
                                        <p className="text-sm text-muted-foreground">
                                            Balance: {transaction.balance_after.toLocaleString('en-IN')}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
