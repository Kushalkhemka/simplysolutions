'use client';

import { useState, useEffect, ReactNode } from 'react';
import { Shield, Loader2, AlertTriangle, Lock, CheckCircle, ShoppingBag, FileText, HelpCircle } from 'lucide-react';

const SESSION_KEY = 'verified_order_id_docs';

export default function InstallationDocGate({ children }: { children: ReactNode }) {
    const [orderId, setOrderId] = useState('');
    const [isVerified, setIsVerified] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isChecking, setIsChecking] = useState(true);

    // Check sessionStorage on mount
    useEffect(() => {
        const stored = sessionStorage.getItem(SESSION_KEY);
        if (stored) {
            setIsVerified(true);
        }
        setIsChecking(false);
    }, []);

    const handleVerify = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!orderId.trim()) {
            setError('Please enter your Order ID');
            return;
        }

        setIsLoading(true);
        setError(null);

        try {
            const response = await fetch('/api/installation-docs/verify', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ orderId: orderId.trim() }),
            });

            const data = await response.json();

            if (data.valid) {
                sessionStorage.setItem(SESSION_KEY, orderId.trim());
                setIsVerified(true);
            } else {
                setError(data.error || 'Invalid Order ID');
            }
        } catch {
            setError('Network error. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    // Show loading while checking sessionStorage
    if (isChecking) {
        return (
            <div className="min-h-screen bg-[#0F1111] flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-[#FF9900]" />
            </div>
        );
    }

    // If verified, show the actual content
    if (isVerified) {
        return <>{children}</>;
    }

    // Gate screen - Amazon/SimplySolutions branded
    return (
        <div className="min-h-screen bg-[#EAEDED] dark:bg-[#0F1111]">
            {/* Dark Header Banner with Orange Lock Icon */}
            <div className="bg-[#232F3E] border-b-4 border-[#FF9900]">
                <div className="max-w-4xl mx-auto px-4 py-5 text-center">
                    <div className="flex items-center justify-center gap-3 mb-2">
                        <div className="w-10 h-10 bg-gradient-to-br from-[#FF9900] to-[#FF6600] rounded-full flex items-center justify-center shadow-lg shadow-orange-500/20">
                            <Lock className="w-5 h-5 text-white" />
                        </div>
                        <h1 className="text-2xl md:text-3xl font-bold text-white tracking-tight">
                            Protected Content
                        </h1>
                    </div>
                    <p className="text-[#FF9900] text-sm font-medium">
                        Verify your Amazon order to access step-by-step installation guides
                    </p>
                </div>
            </div>

            <div className="max-w-xl mx-auto px-4 py-10">
                {/* Dark Card with Gradient Section Header */}
                <div className="bg-white dark:bg-[#1A1A2E] rounded-xl shadow-xl border border-[#DDD] dark:border-[#333] overflow-hidden">
                    {/* Card Header */}
                    <div className="bg-gradient-to-r from-[#37475A] to-[#232F3E] px-6 py-4">
                        <div className="flex items-center gap-3">
                            <div className="w-9 h-9 bg-white/10 rounded-lg flex items-center justify-center">
                                <Shield className="w-5 h-5 text-[#FF9900]" />
                            </div>
                            <div>
                                <h2 className="text-lg font-bold text-white">Verify Your Purchase</h2>
                                <p className="text-xs text-gray-300">Quick verification to unlock your product&apos;s installation guide</p>
                            </div>
                        </div>
                    </div>

                    {/* Card Body */}
                    <div className="p-6">
                        <form onSubmit={handleVerify} className="space-y-5">
                            <div>
                                <label className="block text-sm font-semibold text-[#0F1111] dark:text-gray-200 mb-2">
                                    Amazon Order ID <span className="text-red-500">*</span>
                                </label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                                        <ShoppingBag className="w-5 h-5 text-[#888]" />
                                    </div>
                                    <input
                                        type="text"
                                        value={orderId}
                                        onChange={(e) => { setOrderId(e.target.value); setError(null); }}
                                        placeholder="e.g. 408-2477254-5428882"
                                        className="w-full pl-11 pr-4 py-3.5 border-2 border-[#888C8C] dark:border-[#444] rounded-lg focus:border-[#FF9900] focus:ring-4 focus:ring-[#FF9900]/15 outline-none transition bg-white dark:bg-[#111] text-[#0F1111] dark:text-white placeholder:text-[#999] text-base font-mono"
                                        autoFocus
                                    />
                                </div>
                                <p className="mt-2 text-xs text-[#565959] dark:text-gray-400 flex items-start gap-1.5">
                                    <HelpCircle className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
                                    Open Amazon → Your Orders → tap your order → copy the Order ID (format: 408-XXXXXXX-XXXXXXX)
                                </p>
                            </div>

                            {/* Error Message */}
                            {error && (
                                <div className="bg-[#FFF4F4] dark:bg-red-950/40 border-l-4 border-[#CC0C39] rounded-r-lg p-4">
                                    <div className="flex items-start gap-3">
                                        <AlertTriangle className="w-5 h-5 text-[#CC0C39] flex-shrink-0 mt-0.5" />
                                        <p className="text-sm text-[#CC0C39] dark:text-red-300 leading-relaxed">{error}</p>
                                    </div>
                                </div>
                            )}

                            {/* Amazon-Yellow Gradient Button */}
                            <button
                                type="submit"
                                disabled={isLoading}
                                className="w-full py-3.5 bg-gradient-to-b from-[#FFD814] to-[#F7CA00] hover:from-[#F7CA00] hover:to-[#E7B800] text-[#0F1111] font-bold rounded-lg border border-[#FCD200] shadow-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-base"
                            >
                                {isLoading ? (
                                    <>
                                        <Loader2 className="w-5 h-5 animate-spin" />
                                        Verifying...
                                    </>
                                ) : (
                                    <>
                                        <FileText className="w-5 h-5" />
                                        Verify &amp; Access Guide
                                    </>
                                )}
                            </button>
                        </form>

                        {/* Divider */}
                        <div className="relative my-6">
                            <div className="absolute inset-0 flex items-center">
                                <div className="w-full border-t border-[#E7E7E7] dark:border-[#333]"></div>
                            </div>
                            <div className="relative flex justify-center text-xs">
                                <span className="bg-white dark:bg-[#1A1A2E] px-3 text-[#767676] dark:text-gray-500 font-medium uppercase tracking-wider">Why verify?</span>
                            </div>
                        </div>

                        {/* Trust Badges */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div className="flex items-center gap-3 p-3 rounded-lg bg-[#F7FEF7] dark:bg-green-950/20 border border-[#D5E8D5] dark:border-green-900/40">
                                <CheckCircle className="w-5 h-5 text-[#067D62] flex-shrink-0" />
                                <span className="text-xs text-[#0F1111] dark:text-gray-300">Exclusive guides for verified buyers</span>
                            </div>
                            <div className="flex items-center gap-3 p-3 rounded-lg bg-[#F7FEF7] dark:bg-green-950/20 border border-[#D5E8D5] dark:border-green-900/40">
                                <Shield className="w-5 h-5 text-[#067D62] flex-shrink-0" />
                                <span className="text-xs text-[#0F1111] dark:text-gray-300">One-time verification per session</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* WhatsApp Support Link */}
                <div className="mt-6 text-center">
                    <p className="text-sm text-[#565959] dark:text-gray-500">
                        Need help?{' '}
                        <a
                            href="https://wa.me/918178848830"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[#007185] dark:text-[#FF9900] hover:underline font-medium"
                        >
                            Contact Support on WhatsApp
                        </a>
                    </p>
                </div>
            </div>
        </div>
    );
}
