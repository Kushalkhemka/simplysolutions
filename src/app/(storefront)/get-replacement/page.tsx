'use client';

import { useState } from 'react';
import { RefreshCw, CheckCircle, Copy, AlertTriangle, Loader2, Shield, Key, ArrowRight, ShoppingCart, HelpCircle } from 'lucide-react';
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
        <div className="min-h-screen bg-[#EAEDED]">
            {/* Success Banner */}
            {newLicenseKey && (
                <div className="bg-[#067D62] text-white py-3 px-4">
                    <div className="container-dense flex items-center justify-center gap-2 text-sm font-medium">
                        <CheckCircle className="w-5 h-5" />
                        <span className="font-bold">Success!</span>
                        <span className="hidden sm:inline">Your Replacement License Key is Ready</span>
                    </div>
                </div>
            )}

            {/* Amazon-style Header Banner */}
            <div className="bg-[#232F3E] py-4 border-b-4 border-[#FF9900]">
                <div className="container-dense">
                    <div className="flex items-center justify-center gap-3 mb-1">
                        <RefreshCw className="w-6 h-6 text-[#FF9900]" />
                        <h1 className="text-2xl md:text-3xl font-bold text-center text-white uppercase tracking-wider">
                            Office 365 Replacement
                        </h1>
                    </div>
                    <p className="text-center text-[#FF9900] text-sm font-medium">
                        Get Your Replacement License Key
                    </p>
                </div>
            </div>

            {/* Main Content */}
            <div className="container-dense py-8 md:py-12">
                <div className="max-w-2xl mx-auto">

                    {/* How It Works Card */}
                    <div className="bg-white rounded-lg shadow border border-[#DDD] overflow-hidden mb-6">
                        <div className="bg-gradient-to-b from-[#F7F8FA] to-[#E7E9EC] px-4 py-3 border-b border-[#DDD]">
                            <h3 className="font-bold text-[#0F1111] text-sm flex items-center gap-2">
                                <HelpCircle className="w-4 h-4 text-[#FF9900]" />
                                How It Works
                            </h3>
                        </div>
                        <div className="p-4">
                            <ol className="space-y-2 text-sm text-[#0F1111]">
                                <li className="flex gap-2">
                                    <span className="font-bold text-[#FF9900]">1.</span>
                                    <span>Enter your <strong>Amazon Order ID</strong> or <strong>Secret Code</strong> from your original purchase</span>
                                </li>
                                <li className="flex gap-2">
                                    <span className="font-bold text-[#FF9900]">2.</span>
                                    <span>We verify your order is an <strong className="text-[#0078D4]">Office 365</strong> product eligible for replacement</span>
                                </li>
                                <li className="flex gap-2">
                                    <span className="font-bold text-[#FF9900]">3.</span>
                                    <span>A <strong>new license key</strong> is assigned to your order <strong className="text-[#067D62]">instantly</strong></span>
                                </li>
                            </ol>
                        </div>
                    </div>

                    {/* Main Replacement Card */}
                    <div className="bg-white rounded-lg shadow-lg border border-[#DDD] overflow-hidden">
                        {/* Card Header */}
                        <div className="bg-gradient-to-b from-[#F7F8FA] to-[#E7E9EC] px-6 py-4 border-b border-[#DDD]">
                            <h2 className="text-lg font-bold text-[#0F1111]">Get Your Replacement Key</h2>
                            <p className="text-sm text-[#565959] mt-1">
                                Enter your Order ID to receive a new Office 365 license key
                            </p>
                        </div>

                        <div className="p-6">
                            {newLicenseKey ? (
                                /* Success State */
                                <div className="space-y-6">
                                    {/* Success Icon */}
                                    <div className="text-center">
                                        <div className="w-16 h-16 bg-[#E7F4E4] rounded-full flex items-center justify-center mx-auto mb-3">
                                            <CheckCircle className="w-8 h-8 text-[#067D62]" />
                                        </div>
                                        <h3 className="text-xl font-bold text-[#0F1111]">Replacement Issued!</h3>
                                        <p className="text-sm text-[#565959] mt-1">Your new Office 365 license key is ready</p>
                                    </div>

                                    {/* Order ID Reference */}
                                    <div className="text-center text-sm text-[#565959]">
                                        <span className="font-medium text-[#0F1111]">Order ID:</span>{' '}
                                        <span className="font-mono">{orderId.trim()}</span>
                                    </div>

                                    {/* New License Key Box */}
                                    <div className="bg-[#FCF5EE] border-2 border-[#FF9900] rounded-lg p-5">
                                        <div className="flex items-center gap-2 mb-3">
                                            <Key className="h-5 w-5 text-[#FF9900]" />
                                            <p className="text-sm font-bold text-[#0F1111] uppercase tracking-wide">Your New License Key</p>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <code className="flex-1 bg-white border border-[#DDD] rounded-lg p-4 font-mono text-base font-bold text-[#0F1111] break-all select-all">
                                                {newLicenseKey}
                                            </code>
                                            <button
                                                onClick={handleCopy}
                                                className={`p-3 rounded-lg border transition-all flex-shrink-0 ${copied
                                                    ? 'bg-[#067D62] border-[#067D62] text-white'
                                                    : 'bg-white border-[#DDD] text-[#565959] hover:bg-[#F7F8FA] hover:border-[#888C8C]'
                                                    }`}
                                                title="Copy key"
                                            >
                                                {copied ? <CheckCircle className="h-5 w-5" /> : <Copy className="h-5 w-5" />}
                                            </button>
                                        </div>
                                    </div>

                                    {/* Copy Button */}
                                    <button
                                        onClick={handleCopy}
                                        className="w-full py-3 bg-gradient-to-b from-[#FFD814] to-[#F7CA00] hover:from-[#F7CA00] hover:to-[#E7B800] text-[#0F1111] font-bold rounded-lg border border-[#FCD200] shadow-sm transition-all flex items-center justify-center gap-2"
                                    >
                                        <Copy className="w-5 h-5" />
                                        Copy to Clipboard
                                    </button>

                                    {/* Important Notice */}
                                    <div className="bg-[#F0F8FF] border border-[#0078D4] rounded-lg p-4">
                                        <div className="flex items-start gap-3">
                                            <Shield className="h-5 w-5 text-[#0078D4] flex-shrink-0 mt-0.5" />
                                            <div>
                                                <h4 className="font-bold text-[#0F1111] text-sm mb-1.5">Important: After Activation</h4>
                                                <ul className="text-xs text-[#565959] space-y-1">
                                                    <li>• Visit <a href="https://mysignins.microsoft.com/security-info" target="_blank" rel="noopener noreferrer" className="text-[#007185] hover:text-[#C7511F] hover:underline font-medium">mysignins.microsoft.com/security-info</a> to link your email & phone</li>
                                                    <li>• Save your password securely — it cannot be recovered</li>
                                                </ul>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Warning */}
                                    <div className="bg-[#FEF8F2] border border-[#FF9900] rounded-lg p-4">
                                        <div className="flex items-start gap-3">
                                            <AlertTriangle className="h-5 w-5 text-[#FF9900] flex-shrink-0 mt-0.5" />
                                            <p className="text-xs text-[#565959]">
                                                <strong className="text-[#0F1111]">Note:</strong> This was your one-time replacement. No further replacements can be issued for this order.
                                            </p>
                                        </div>
                                    </div>

                                    {/* Actions */}
                                    <div className="flex gap-3">
                                        <button
                                            onClick={handleReset}
                                            className="flex-1 py-3 px-4 bg-white hover:bg-[#F7F8FA] text-[#0F1111] font-bold rounded-lg border border-[#888C8C] transition-all text-sm flex items-center justify-center gap-2"
                                        >
                                            <RefreshCw className="h-4 w-4" />
                                            Replace Another
                                        </button>
                                        <a
                                            href={`/activate?code=${orderId.trim()}`}
                                            className="flex-1 py-3 px-4 bg-gradient-to-b from-[#FF9900] to-[#E47911] hover:from-[#FA8900] hover:to-[#D07910] text-white font-bold rounded-lg border border-[#D07910] shadow-sm transition-all text-sm flex items-center justify-center gap-2"
                                        >
                                            Go to Activation
                                            <ArrowRight className="h-4 w-4" />
                                        </a>
                                    </div>
                                </div>
                            ) : (
                                /* Input State */
                                <div>
                                    {/* Order ID Input */}
                                    <div className="mb-4">
                                        <label className="block text-sm font-bold text-[#0F1111] mb-2">
                                            ORDER ID / SECRET CODE
                                        </label>
                                        <div className="flex">
                                            <div className="bg-[#F0F2F2] border border-r-0 border-[#888C8C] rounded-l px-3 flex items-center">
                                                <ShoppingCart className="w-5 h-5 text-[#FF9900]" />
                                            </div>
                                            <input
                                                type="text"
                                                value={orderId}
                                                onChange={(e) => {
                                                    setOrderId(e.target.value);
                                                    if (error) setError(null);
                                                }}
                                                onKeyDown={handleKeyDown}
                                                placeholder="e.g. 408-1234567-1234567 or 15-digit Secret Code"
                                                className="flex-1 px-4 py-3 border border-[#888C8C] rounded-r text-base font-mono text-[#0F1111] bg-white focus:outline-none focus:ring-2 focus:ring-[#FF9900] focus:border-[#FF9900] placeholder:text-[#6B7280]"
                                                maxLength={25}
                                                autoFocus
                                            />
                                        </div>
                                    </div>

                                    {/* Helper Note */}
                                    <p className="text-xs text-[#CC0C39] mb-6 flex items-start gap-1">
                                        <span className="font-bold">*Note:</span>
                                        <span>Enter either the Secret Code from your email OR your Amazon Order ID (format: 408-1234567-1234567).</span>
                                    </p>

                                    {/* Error Message */}
                                    {error && (
                                        <div className="mb-6">
                                            <div className="p-4 bg-[#FCF4F4] border border-[#CC0C39] rounded-lg">
                                                <div className="flex items-start gap-3">
                                                    <AlertTriangle className="w-5 h-5 text-[#CC0C39] flex-shrink-0 mt-0.5" />
                                                    <span className="text-[#CC0C39] text-sm">{error}</span>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {/* Submit Button */}
                                    <button
                                        onClick={handleSubmit}
                                        disabled={isLoading || !orderId.trim()}
                                        className="w-full py-3 bg-gradient-to-b from-[#FFD814] to-[#F7CA00] hover:from-[#F7CA00] hover:to-[#E7B800] text-[#0F1111] font-bold rounded-lg border border-[#FCD200] shadow-sm transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                    >
                                        {isLoading ? (
                                            <>
                                                <div className="w-4 h-4 border-2 border-[#0F1111]/30 border-t-[#0F1111] rounded-full animate-spin" />
                                                Processing...
                                            </>
                                        ) : (
                                            <>
                                                <RefreshCw className="w-5 h-5" />
                                                Get Replacement Key
                                            </>
                                        )}
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Eligibility Card */}
                    <div className="mt-6 bg-white rounded-lg shadow border border-[#DDD] overflow-hidden">
                        <div className="bg-[#FEF8F2] border-l-4 border-[#FF9900] p-4">
                            <div className="flex items-start gap-3">
                                <AlertTriangle className="h-5 w-5 text-[#FF9900] flex-shrink-0 mt-0.5" />
                                <div>
                                    <h4 className="font-bold text-[#0F1111] text-sm mb-1.5">Eligibility</h4>
                                    <ul className="text-xs text-[#565959] space-y-1">
                                        <li>• Only available for <strong className="text-[#0F1111]">Office 365</strong> orders</li>
                                        <li>• Order must have been <strong className="text-[#0F1111]">activated already</strong></li>
                                        <li>• Maximum <strong className="text-[#CC0C39]">1 replacement</strong> per order</li>
                                    </ul>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Support Card */}
                    <div className="mt-6 bg-white rounded-lg shadow border border-[#DDD] overflow-hidden">
                        <div className="bg-[#FEF8F2] border-l-4 border-[#FF9900] p-4">
                            <p className="text-sm text-[#0F1111]">
                                <span className="font-bold">Need Help?</span> Contact us on WhatsApp:{' '}
                                <a
                                    href="https://wa.me/918178848830"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="font-bold text-[#007185] hover:text-[#C7511F] hover:underline"
                                >
                                    +91 8178848830
                                </a>
                                {' '}(message only)
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
