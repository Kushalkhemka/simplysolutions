'use client';

import { useState } from 'react';
import { RefreshCw, CheckCircle, Copy, AlertTriangle, Loader2, Shield, Key, ArrowRight, Search } from 'lucide-react';
import { toast } from 'sonner';

export default function GetReplacementPage() {
    const [orderId, setOrderId] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [newLicenseKey, setNewLicenseKey] = useState<string | null>(null);
    const [copied, setCopied] = useState(false);

    const handleCopy = () => {
        if (newLicenseKey) {
            navigator.clipboard.writeText(newLicenseKey);
            setCopied(true);
            toast.success('License key copied to clipboard!');
            setTimeout(() => setCopied(false), 2000);
        }
    };

    const handleSubmit = async () => {
        const trimmed = orderId.trim();
        if (!trimmed) {
            setError('Please enter your Order ID');
            return;
        }

        setIsLoading(true);
        setError(null);
        setNewLicenseKey(null);

        try {
            const response = await fetch('/api/office365-replacement/instant', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ orderId: trimmed }),
            });

            const data = await response.json();

            if (data.success) {
                setNewLicenseKey(data.newLicenseKey);
                toast.success('Replacement key issued successfully!');
            } else {
                setError(data.error || 'Failed to process replacement');
            }
        } catch (err) {
            console.error('Replacement error:', err);
            setError('Network error. Please check your connection and try again.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !isLoading) {
            handleSubmit();
        }
    };

    const handleReset = () => {
        setOrderId('');
        setNewLicenseKey(null);
        setError(null);
    };

    return (
        <div className="min-h-screen bg-gradient-to-b from-slate-50 via-blue-50/30 to-slate-100">
            {/* Header */}
            <div className="bg-[#232F3E] py-5 border-b-4 border-[#FF9900]">
                <div className="container mx-auto px-4">
                    <h1 className="text-2xl md:text-3xl font-bold text-center text-white">
                        Office 365 Replacement
                    </h1>
                    <p className="text-center text-[#FF9900] text-sm mt-1 font-medium uppercase tracking-wide">
                        Get Your Replacement License Key
                    </p>
                </div>
            </div>

            <div className="container mx-auto px-4 py-8 md:py-12">
                <div className="max-w-lg mx-auto">

                    {/* Success State */}
                    {newLicenseKey ? (
                        <div className="bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden animate-in fade-in duration-300">
                            {/* Success Header */}
                            <div className="bg-gradient-to-r from-emerald-600 to-emerald-500 px-6 py-8 text-center">
                                <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center mx-auto mb-4">
                                    <CheckCircle className="h-10 w-10 text-white" />
                                </div>
                                <h2 className="text-2xl font-bold text-white mb-1">Replacement Issued!</h2>
                                <p className="text-emerald-100 text-sm">Your new Office 365 license key is ready</p>
                            </div>

                            <div className="p-6 space-y-5">
                                {/* Order ID reference */}
                                <div className="flex items-center gap-2 text-sm text-slate-500">
                                    <span className="font-medium text-slate-700">Order ID:</span>
                                    <span className="font-mono">{orderId.trim()}</span>
                                </div>

                                {/* New License Key Box */}
                                <div className="bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-200 rounded-xl p-5">
                                    <div className="flex items-center gap-2 mb-3">
                                        <Key className="h-5 w-5 text-amber-700" />
                                        <h3 className="font-semibold text-amber-900">Your New License Key</h3>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <div className="flex-1 bg-white border-2 border-amber-300 rounded-lg p-4 font-mono text-sm md:text-base font-bold text-slate-900 break-all select-all">
                                            {newLicenseKey}
                                        </div>
                                        <button
                                            onClick={handleCopy}
                                            className={`p-4 rounded-lg border-2 transition-all flex-shrink-0 ${copied
                                                ? 'bg-emerald-600 border-emerald-600 text-white'
                                                : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50 hover:border-slate-300'
                                                }`}
                                            title="Copy key"
                                        >
                                            {copied ? <CheckCircle className="h-5 w-5" /> : <Copy className="h-5 w-5" />}
                                        </button>
                                    </div>
                                </div>

                                {/* Important Notice */}
                                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                                    <div className="flex items-start gap-3">
                                        <Shield className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                                        <div>
                                            <h4 className="font-semibold text-blue-800 text-sm mb-1.5">Important: After Activation</h4>
                                            <ul className="text-xs text-blue-700 space-y-1">
                                                <li>• Visit <a href="https://mysignins.microsoft.com/security-info" target="_blank" rel="noopener noreferrer" className="underline font-medium">mysignins.microsoft.com/security-info</a> to link your email & phone</li>
                                                <li>• Save your password securely — it cannot be recovered</li>
                                            </ul>
                                        </div>
                                    </div>
                                </div>

                                {/* Warning */}
                                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                                    <div className="flex items-start gap-3">
                                        <AlertTriangle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
                                        <p className="text-xs text-amber-700">
                                            <strong>Note:</strong> This was your one-time replacement. No further replacements can be issued for this order.
                                        </p>
                                    </div>
                                </div>

                                {/* Actions */}
                                <div className="flex gap-3">
                                    <button
                                        onClick={handleReset}
                                        className="flex-1 py-3 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium rounded-lg transition-all text-sm flex items-center justify-center gap-2"
                                    >
                                        <RefreshCw className="h-4 w-4" />
                                        Replace Another
                                    </button>
                                    <a
                                        href={`/activate?code=${orderId.trim()}`}
                                        className="flex-1 py-3 px-4 bg-slate-900 hover:bg-slate-800 text-white font-medium rounded-lg transition-all text-sm flex items-center justify-center gap-2"
                                    >
                                        Go to Activation
                                        <ArrowRight className="h-4 w-4" />
                                    </a>
                                </div>
                            </div>
                        </div>
                    ) : (
                        /* Input State */
                        <div className="space-y-6">
                            {/* Main Card */}
                            <div className="bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
                                {/* Info Banner */}
                                <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-5 text-center">
                                    <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center mx-auto mb-3">
                                        <RefreshCw className="h-6 w-6 text-white" />
                                    </div>
                                    <h2 className="text-lg font-bold text-white mb-1">Get Your Replacement Key</h2>
                                    <p className="text-blue-100 text-sm">
                                        Enter your Order ID to receive a new Office 365 license key
                                    </p>
                                </div>

                                <div className="p-6 space-y-5">
                                    {/* Order ID Input */}
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-2">
                                            Order ID / Secret Code
                                        </label>
                                        <div className="relative">
                                            <input
                                                type="text"
                                                value={orderId}
                                                onChange={(e) => {
                                                    setOrderId(e.target.value);
                                                    if (error) setError(null);
                                                }}
                                                onKeyDown={handleKeyDown}
                                                placeholder="Enter your Order ID or 15-digit Secret Code"
                                                className={`w-full px-4 py-4 pr-12 border-2 rounded-xl text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all text-base font-medium placeholder:font-normal placeholder:text-slate-400 ${
                                                    error ? 'border-red-300 bg-red-50/50' : 'border-slate-200'
                                                }`}
                                                autoFocus
                                            />
                                            <Search className="absolute right-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                                        </div>
                                        {error && (
                                            <div className="mt-3 flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
                                                <AlertTriangle className="h-4 w-4 text-red-500 flex-shrink-0 mt-0.5" />
                                                <p className="text-sm text-red-700">{error}</p>
                                            </div>
                                        )}
                                    </div>

                                    {/* Submit Button */}
                                    <button
                                        onClick={handleSubmit}
                                        disabled={isLoading || !orderId.trim()}
                                        className="w-full py-4 bg-[#FFD814] hover:bg-[#F7CA00] active:bg-[#E7B800] text-slate-900 font-bold rounded-xl shadow-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-lg"
                                    >
                                        {isLoading ? (
                                            <>
                                                <Loader2 className="h-5 w-5 animate-spin" />
                                                Processing...
                                            </>
                                        ) : (
                                            <>
                                                <RefreshCw className="h-5 w-5" />
                                                Get Replacement Key
                                            </>
                                        )}
                                    </button>
                                </div>
                            </div>

                            {/* How It Works */}
                            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                                <div className="px-6 py-4 bg-slate-50 border-b border-slate-200">
                                    <h3 className="font-semibold text-slate-800 text-sm">How It Works</h3>
                                </div>
                                <div className="p-6">
                                    <div className="space-y-4">
                                        <div className="flex items-start gap-3">
                                            <div className="w-7 h-7 bg-blue-100 text-blue-700 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0">1</div>
                                            <div>
                                                <p className="text-sm font-medium text-slate-800">Enter Your Order ID</p>
                                                <p className="text-xs text-slate-500 mt-0.5">Use the Order ID or secret code from your original purchase</p>
                                            </div>
                                        </div>
                                        <div className="flex items-start gap-3">
                                            <div className="w-7 h-7 bg-blue-100 text-blue-700 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0">2</div>
                                            <div>
                                                <p className="text-sm font-medium text-slate-800">Instant Verification</p>
                                                <p className="text-xs text-slate-500 mt-0.5">We verify your order is eligible for a replacement (Office 365 only)</p>
                                            </div>
                                        </div>
                                        <div className="flex items-start gap-3">
                                            <div className="w-7 h-7 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0">3</div>
                                            <div>
                                                <p className="text-sm font-medium text-slate-800">Get New License Key</p>
                                                <p className="text-xs text-slate-500 mt-0.5">A fresh license key is assigned to your order instantly</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Eligibility Info */}
                            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                                <div className="flex items-start gap-3">
                                    <AlertTriangle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
                                    <div>
                                        <h4 className="font-semibold text-amber-800 text-sm mb-1">Eligibility</h4>
                                        <ul className="text-xs text-amber-700 space-y-1">
                                            <li>• Only available for <strong>Office 365</strong> orders</li>
                                            <li>• Order must have been activated already</li>
                                            <li>• Maximum <strong>1 replacement</strong> per order</li>
                                        </ul>
                                    </div>
                                </div>
                            </div>

                            {/* Support */}
                            <div className="text-center">
                                <p className="text-xs text-slate-500 mb-2">Need help? Contact us on WhatsApp</p>
                                <a
                                    href="https://wa.me/918178848830"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-2 px-4 py-2 bg-[#25D366] text-white text-sm font-medium rounded-full hover:bg-[#20bd5a] transition-all"
                                >
                                    Chat on WhatsApp
                                </a>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
