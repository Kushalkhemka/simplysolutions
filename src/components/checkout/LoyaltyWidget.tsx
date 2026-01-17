"use client";

import { useState, useEffect } from 'react';
import { Coins, Sparkles, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface LoyaltyWidgetProps {
    orderAmount: number;
    onPointsChange: (points: number, discount: number) => void;
}

export function LoyaltyWidget({ orderAmount, onPointsChange }: LoyaltyWidgetProps) {
    const [userBalance, setUserBalance] = useState(0);
    const [maxRedeemable, setMaxRedeemable] = useState(0);
    const [pointsToUse, setPointsToUse] = useState(0);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    // Fetch user's loyalty balance
    useEffect(() => {
        const fetchBalance = async () => {
            try {
                const res = await fetch('/api/loyalty/balance');
                const result = await res.json();

                if (result.success) {
                    setUserBalance(result.data.balance || 0);
                } else {
                    setError('Failed to load loyalty balance');
                }
            } catch (err) {
                console.error('Error fetching loyalty balance:', err);
                setError('Failed to load loyalty balance');
            } finally {
                setLoading(false);
            }
        };

        fetchBalance();
    }, []);

    // Calculate max redeemable when order amount or balance changes
    useEffect(() => {
        if (orderAmount > 0) {
            const maxAllowed = orderAmount * 0.10; // 10% of order
            const maxPoints = Math.min(maxAllowed, userBalance);
            setMaxRedeemable(Math.floor(maxPoints));
        }
    }, [orderAmount, userBalance]);

    const handlePointsChange = (value: string) => {
        const points = parseInt(value) || 0;

        if (points < 0) {
            setPointsToUse(0);
            onPointsChange(0, 0);
            return;
        }

        if (points > maxRedeemable) {
            setPointsToUse(maxRedeemable);
            onPointsChange(maxRedeemable, maxRedeemable);
            return;
        }

        setPointsToUse(points);
        onPointsChange(points, points); // 1 point = ₹1
    };

    const applyMaxPoints = () => {
        setPointsToUse(maxRedeemable);
        onPointsChange(maxRedeemable, maxRedeemable);
    };

    if (loading) {
        return (
            <div className="border rounded-lg p-6 animate-pulse">
                <div className="h-6 bg-muted rounded w-1/3 mb-4"></div>
                <div className="h-10 bg-muted rounded"></div>
            </div>
        );
    }

    if (userBalance === 0) {
        return (
            <div className="border rounded-lg p-6 bg-muted/30">
                <div className="flex items-center gap-2 mb-2">
                    <Sparkles className="h-5 w-5 text-orange-500" />
                    <h3 className="font-semibold">Earn Loyalty Points</h3>
                </div>
                <p className="text-sm text-muted-foreground">
                    Complete this purchase to start earning loyalty points! You'll get 100 points for every ₹100 spent.
                </p>
            </div>
        );
    }

    return (
        <div className="border rounded-lg p-6 bg-gradient-to-br from-orange-50 to-yellow-50 dark:from-orange-950/20 dark:to-yellow-950/20">
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                    <Coins className="h-5 w-5 text-orange-500" />
                    <h3 className="font-semibold">Loyalty Points</h3>
                </div>
                <div className="text-sm font-medium text-orange-600 dark:text-orange-400">
                    Available: {userBalance.toLocaleString('en-IN')} points
                </div>
            </div>

            <div className="space-y-4">
                <div>
                    <Label htmlFor="loyaltyPoints">Points to Redeem</Label>
                    <div className="flex gap-2 mt-1">
                        <Input
                            id="loyaltyPoints"
                            type="number"
                            min="0"
                            max={maxRedeemable}
                            value={pointsToUse || ''}
                            onChange={(e) => handlePointsChange(e.target.value)}
                            placeholder="0"
                            className="flex-1"
                        />
                        <Button
                            type="button"
                            variant="outline"
                            onClick={applyMaxPoints}
                            disabled={maxRedeemable === 0}
                        >
                            Use Max
                        </Button>
                    </div>
                    <div className="flex items-center gap-1 mt-2 text-xs text-muted-foreground">
                        <Info className="h-3 w-3" />
                        <span>Max redeemable: {maxRedeemable.toLocaleString('en-IN')} points (10% of order)</span>
                    </div>
                </div>

                {pointsToUse > 0 && (
                    <div className="bg-white dark:bg-gray-900 rounded-md p-3 border border-orange-200 dark:border-orange-800">
                        <div className="flex justify-between items-center">
                            <span className="text-sm font-medium">Discount Applied:</span>
                            <span className="text-lg font-bold text-green-600 dark:text-green-400">
                                -₹{pointsToUse.toLocaleString('en-IN')}
                            </span>
                        </div>
                    </div>
                )}

                <div className="bg-orange-100 dark:bg-orange-900/30 rounded-md p-3 text-xs">
                    <div className="flex items-start gap-2">
                        <Sparkles className="h-4 w-4 text-orange-600 dark:text-orange-400 mt-0.5 flex-shrink-0" />
                        <p className="text-orange-900 dark:text-orange-100">
                            You'll earn <strong>{Math.floor(orderAmount - pointsToUse)} points</strong> from this purchase!
                        </p>
                    </div>
                </div>
            </div>

            {error && (
                <p className="text-sm text-destructive mt-2">{error}</p>
            )}
        </div>
    );
}
