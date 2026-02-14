'use client';

import { useState, useEffect, ReactNode } from 'react';
import { Shield, Search, Loader2, AlertTriangle, Lock, CheckCircle } from 'lucide-react';

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
            <div className="min-h-screen bg-gradient-to-b from-background to-muted/30 flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
            </div>
        );
    }

    // If verified, show the actual content
    if (isVerified) {
        return <>{children}</>;
    }

    // Gate screen
    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-gray-50 flex items-center justify-center p-4">
            <div className="max-w-lg w-full">
                {/* Lock Icon Header */}
                <div className="text-center mb-8">
                    <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-xl shadow-blue-500/20">
                        <Lock className="w-10 h-10 text-white" />
                    </div>
                    <h1 className="text-3xl font-bold text-gray-900 mb-3">
                        Verify Your Purchase
                    </h1>
                    <p className="text-gray-600 max-w-md mx-auto">
                        Enter your Amazon Order ID to access the installation guide. This ensures only our genuine customers can view the documentation.
                    </p>
                </div>

                {/* Verification Card */}
                <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8">
                    <form onSubmit={handleVerify} className="space-y-5">
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                                Amazon Order ID *
                            </label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                    <Search className="w-5 h-5 text-gray-400" />
                                </div>
                                <input
                                    type="text"
                                    value={orderId}
                                    onChange={(e) => { setOrderId(e.target.value); setError(null); }}
                                    placeholder="e.g. 408-2477254-5428882"
                                    className="w-full pl-12 pr-4 py-4 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition text-gray-900 placeholder:text-gray-400 text-lg"
                                    autoFocus
                                />
                            </div>
                        </div>

                        {/* Error Message */}
                        {error && (
                            <div className="bg-red-50 border-2 border-red-200 rounded-xl p-4">
                                <div className="flex items-start gap-3">
                                    <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                                    <p className="text-sm text-red-700 leading-relaxed">{error}</p>
                                </div>
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white py-4 rounded-xl font-bold text-lg shadow-lg transition disabled:opacity-50 flex items-center justify-center gap-2"
                        >
                            {isLoading ? (
                                <>
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                    Verifying...
                                </>
                            ) : (
                                <>
                                    <Shield className="w-5 h-5" />
                                    Verify &amp; Access Guide
                                </>
                            )}
                        </button>
                    </form>
                </div>

                {/* Help Text */}
                <div className="mt-6 text-center space-y-3">
                    <div className="flex items-center justify-center gap-2 text-sm text-gray-500">
                        <CheckCircle className="w-4 h-4 text-green-500" />
                        <span>Only verified SimplySolutions customers can access guides</span>
                    </div>
                    <p className="text-sm text-gray-400">
                        Need help? Contact us on{' '}
                        <a href="https://wa.me/918178848830" target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline font-medium">
                            WhatsApp: 8178848830
                        </a>
                    </p>
                </div>
            </div>
        </div>
    );
}
