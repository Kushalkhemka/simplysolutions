'use client';

import { useState, useEffect, useCallback } from 'react';
import { Clock, CheckCircle, AlertCircle, ExternalLink, RefreshCw, Calendar, DollarSign } from 'lucide-react';

interface SafeTOrder {
    id: string;
    order_id: string;
    fsn: string | null;
    product_title: string | null;
    contact_email: string | null;
    refundedAt: string; // Normalized field from API
    created_at: string;
    daysSinceRefund: number;
    daysUntilEligible: number;
    isEligible: boolean;
    eligibleDate: string;
}

interface SafeTData {
    summary: {
        totalRefunded: number;
        eligible: number;
        approaching: number;
        notYetEligible: number;
    };
    eligible: SafeTOrder[];
    approaching: SafeTOrder[];
    notYetEligible: SafeTOrder[];
}

export default function SafeTClaimsClient() {
    const [data, setData] = useState<SafeTData | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'eligible' | 'approaching' | 'all'>('eligible');

    const fetchData = useCallback(async () => {
        setIsLoading(true);
        try {
            const res = await fetch('/api/admin/amazon-orders/safe-t-eligible');
            const json = await res.json();
            if (json.success) {
                setData(json);
            }
        } catch (error) {
            console.error('Error fetching Safe-T data:', error);
        }
        setIsLoading(false);
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-IN', {
            day: 'numeric',
            month: 'short',
            year: 'numeric'
        });
    };

    const openSafeTClaim = (orderId: string) => {
        // Open Amazon Safe-T claim page
        window.open(`https://sellercentral.amazon.in/safet-claims/ref=xx_safetclaim_dnav_xx#/claims?orderId=${orderId}`, '_blank');
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-64">
                <RefreshCw className="w-8 h-8 animate-spin text-primary" />
                <span className="ml-2">Loading Safe-T claims data...</span>
            </div>
        );
    }

    if (!data) {
        return (
            <div className="text-center py-8 text-muted-foreground">
                Failed to load data. Please refresh the page.
            </div>
        );
    }

    const getOrdersForTab = () => {
        switch (activeTab) {
            case 'eligible':
                return data.eligible;
            case 'approaching':
                return data.approaching;
            case 'all':
                return [...data.eligible, ...data.approaching, ...data.notYetEligible];
        }
    };

    const orders = getOrdersForTab();

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold flex items-center gap-2">
                        <DollarSign className="w-6 h-6 text-green-500" />
                        Safe-T Claim Eligibility
                    </h1>
                    <p className="text-muted-foreground">
                        Track refunded orders eligible for Amazon Safe-T claims (50+ days after refund)
                    </p>
                </div>
                <button
                    onClick={fetchData}
                    className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90"
                >
                    <RefreshCw className="w-4 h-4" />
                    Refresh
                </button>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-4">
                    <div className="flex items-center gap-2 text-green-500 mb-1">
                        <CheckCircle className="w-5 h-5" />
                        <span className="font-semibold">Eligible Now</span>
                    </div>
                    <div className="text-3xl font-bold">{data.summary.eligible}</div>
                    <p className="text-sm text-muted-foreground">Ready for Safe-T claim</p>
                </div>
                <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4">
                    <div className="flex items-center gap-2 text-yellow-500 mb-1">
                        <Clock className="w-5 h-5" />
                        <span className="font-semibold">Approaching</span>
                    </div>
                    <div className="text-3xl font-bold">{data.summary.approaching}</div>
                    <p className="text-sm text-muted-foreground">45-49 days since refund</p>
                </div>
                <div className="bg-muted/50 border border-border rounded-lg p-4">
                    <div className="flex items-center gap-2 text-muted-foreground mb-1">
                        <Calendar className="w-5 h-5" />
                        <span className="font-semibold">Not Yet Eligible</span>
                    </div>
                    <div className="text-3xl font-bold">{data.summary.notYetEligible}</div>
                    <p className="text-sm text-muted-foreground">&lt;45 days since refund</p>
                </div>
                <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
                    <div className="flex items-center gap-2 text-blue-500 mb-1">
                        <AlertCircle className="w-5 h-5" />
                        <span className="font-semibold">Total Refunded</span>
                    </div>
                    <div className="text-3xl font-bold">{data.summary.totalRefunded}</div>
                    <p className="text-sm text-muted-foreground">All tracked refunds</p>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex gap-2 border-b border-border">
                <button
                    onClick={() => setActiveTab('eligible')}
                    className={`px-4 py-2 font-medium border-b-2 transition-colors ${activeTab === 'eligible'
                        ? 'border-green-500 text-green-500'
                        : 'border-transparent text-muted-foreground hover:text-foreground'
                        }`}
                >
                    Eligible ({data.summary.eligible})
                </button>
                <button
                    onClick={() => setActiveTab('approaching')}
                    className={`px-4 py-2 font-medium border-b-2 transition-colors ${activeTab === 'approaching'
                        ? 'border-yellow-500 text-yellow-500'
                        : 'border-transparent text-muted-foreground hover:text-foreground'
                        }`}
                >
                    Approaching ({data.summary.approaching})
                </button>
                <button
                    onClick={() => setActiveTab('all')}
                    className={`px-4 py-2 font-medium border-b-2 transition-colors ${activeTab === 'all'
                        ? 'border-primary text-primary'
                        : 'border-transparent text-muted-foreground hover:text-foreground'
                        }`}
                >
                    All Refunded ({data.summary.totalRefunded})
                </button>
            </div>

            {/* Orders Table */}
            {orders.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                    <CheckCircle className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>No orders in this category</p>
                </div>
            ) : (
                <div className="overflow-x-auto rounded-lg border border-border">
                    <table className="w-full">
                        <thead className="bg-muted/50">
                            <tr>
                                <th className="px-4 py-3 text-left text-sm font-medium">Order ID</th>
                                <th className="px-4 py-3 text-left text-sm font-medium">FSN</th>
                                <th className="px-4 py-3 text-left text-sm font-medium">Product</th>
                                <th className="px-4 py-3 text-left text-sm font-medium">Refund Date</th>
                                <th className="px-4 py-3 text-left text-sm font-medium">Days Since</th>
                                <th className="px-4 py-3 text-left text-sm font-medium">Status</th>
                                <th className="px-4 py-3 text-left text-sm font-medium">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                            {orders.map((order) => (
                                <tr key={order.id} className="hover:bg-muted/30">
                                    <td className="px-4 py-3">
                                        <span className="font-mono text-sm">{order.order_id}</span>
                                    </td>
                                    <td className="px-4 py-3 text-sm">{order.fsn || '-'}</td>
                                    <td className="px-4 py-3 text-sm max-w-[200px] truncate">
                                        {order.product_title || '-'}
                                    </td>
                                    <td className="px-4 py-3 text-sm">{formatDate(order.refundedAt)}</td>
                                    <td className="px-4 py-3">
                                        <span className={`font-bold ${order.daysSinceRefund >= 50
                                            ? 'text-green-500'
                                            : order.daysSinceRefund >= 45
                                                ? 'text-yellow-500'
                                                : 'text-muted-foreground'
                                            }`}>
                                            {order.daysSinceRefund} days
                                        </span>
                                    </td>
                                    <td className="px-4 py-3">
                                        {order.isEligible ? (
                                            <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium bg-green-500/10 text-green-500 rounded-full">
                                                <CheckCircle className="w-3 h-3" />
                                                ELIGIBLE
                                            </span>
                                        ) : (
                                            <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium bg-yellow-500/10 text-yellow-500 rounded-full">
                                                <Clock className="w-3 h-3" />
                                                {order.daysUntilEligible}d left
                                            </span>
                                        )}
                                    </td>
                                    <td className="px-4 py-3">
                                        {order.isEligible && (
                                            <button
                                                onClick={() => openSafeTClaim(order.order_id)}
                                                className="inline-flex items-center gap-1 px-3 py-1 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                                            >
                                                <ExternalLink className="w-3 h-3" />
                                                File Claim
                                            </button>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Info Box */}
            <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
                <h3 className="font-semibold text-blue-500 mb-2">📋 About Safe-T Claims</h3>
                <ul className="text-sm text-muted-foreground space-y-1">
                    <li>• Amazon Safe-T claims can be filed after <strong>50 days</strong> from the refund date</li>
                    <li>• Claims must be filed within <strong>60 days</strong> of the refund to be eligible</li>
                    <li>• Click "File Claim" to open Amazon Seller Central directly with the order ID</li>
                </ul>
            </div>
        </div>
    );
}
