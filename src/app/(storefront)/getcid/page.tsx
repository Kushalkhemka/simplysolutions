'use client';

import { useState } from 'react';
import { Key, Copy, CheckCircle, Loader2, AlertTriangle, RefreshCw, Phone, HelpCircle } from 'lucide-react';
import { toast } from 'sonner';

export default function GetCIDPage() {
    const [secretCode, setSecretCode] = useState('');
    const [installationId, setInstallationId] = useState('');
    const [confirmationId, setConfirmationId] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [canRetry, setCanRetry] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    const formatInstallationId = (value: string) => {
        const digits = value.replace(/\D/g, '').slice(0, 63);
        const groups = digits.match(/.{1,7}/g) || [];
        return groups.join(' ');
    };

    const handleInstallationIdChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        setInstallationId(formatInstallationId(e.target.value));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!secretCode.trim()) {
            toast.error('Please enter your secret code or Amazon Order ID');
            return;
        }

        // Validate format: either 15-17 digit secret code OR Amazon Order ID (XXX-XXXXXXX-XXXXXXX)
        const cleanCode = secretCode.trim();
        const isSecretCode = /^\d{15,17}$/.test(cleanCode);
        const isAmazonOrderId = /^\d{3}-\d{7}-\d{7}$/.test(cleanCode);

        if (!isSecretCode && !isAmazonOrderId) {
            toast.error('Please enter a valid 15-digit secret code or Amazon Order ID');
            return;
        }

        const cleanIid = installationId.replace(/\s/g, '');
        if (cleanIid.length !== 63) {
            toast.error('Installation ID must be 63 digits');
            return;
        }

        setIsLoading(true);
        setError(null);
        setConfirmationId(null);

        try {
            const response = await fetch('/api/getcid', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    identifier: secretCode.trim(),
                    installationId: cleanIid
                }),
            });

            const data = await response.json();

            if (data.success) {
                setConfirmationId(data.confirmationId);
                toast.success('Confirmation ID generated successfully!');
            } else {
                setError(data.error);
                setCanRetry(data.canRetry || false);
                toast.error(data.error);
            }
        } catch (err) {
            console.error('GetCID error:', err);
            toast.error('Network error. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    const copyToClipboard = () => {
        if (confirmationId) {
            navigator.clipboard.writeText(confirmationId);
            toast.success('Confirmation ID copied to clipboard!');
        }
    };

    const formatConfirmationId = (cid: string) => {
        return cid.match(/.{1,6}/g)?.join(' ') || cid;
    };

    const digitCount = installationId.replace(/\s/g, '').length;

    return (
        <div className="min-h-screen bg-[#EAEDED]">
            {/* Success Banner */}
            {confirmationId && (
                <div className="bg-[#067D62] text-white py-3 px-4">
                    <div className="container-dense flex items-center justify-center gap-2 text-sm font-medium">
                        <CheckCircle className="w-5 h-5" />
                        <span className="font-bold">Success!</span>
                        <span className="hidden sm:inline">Your Confirmation ID is ready</span>
                    </div>
                </div>
            )}

            {/* Amazon-style Header Banner */}
            <div className="bg-[#232F3E] py-4 border-b-4 border-[#FF9900]">
                <div className="container-dense">
                    <div className="flex items-center justify-center gap-3 mb-1">
                        <Phone className="w-6 h-6 text-[#FF9900]" />
                        <h1 className="text-2xl md:text-3xl font-bold text-center text-white uppercase tracking-wider">
                            Phone Activation Tool
                        </h1>
                    </div>
                    <p className="text-center text-[#FF9900] text-sm font-medium">
                        Generate Your Confirmation ID
                    </p>
                </div>
            </div>

            {/* Main Content */}
            <div className="container-dense py-8 md:py-12">
                <div className="max-w-2xl mx-auto">

                    {/* Instructions Card */}
                    <div className="bg-white rounded-lg shadow border border-[#DDD] overflow-hidden mb-6">
                        <div className="bg-gradient-to-b from-[#F7F8FA] to-[#E7E9EC] px-4 py-3 border-b border-[#DDD]">
                            <h3 className="font-bold text-[#0F1111] text-sm flex items-center gap-2">
                                <HelpCircle className="w-4 h-4 text-[#FF9900]" />
                                How to Use Phone Activation
                            </h3>
                        </div>
                        <div className="p-4">
                            <ol className="space-y-2 text-sm text-[#0F1111]">
                                <li className="flex gap-2">
                                    <span className="font-bold text-[#FF9900]">1.</span>
                                    <span>Open your Microsoft product and select <strong>&quot;I want to activate by telephone&quot;</strong></span>
                                </li>
                                <li className="flex gap-2">
                                    <span className="font-bold text-[#FF9900]">2.</span>
                                    <span>Note down the <strong className="text-[#CC0C39]">63-digit Installation ID</strong> shown on screen</span>
                                </li>
                                <li className="flex gap-2">
                                    <span className="font-bold text-[#FF9900]">3.</span>
                                    <span>Enter your Secret Code (or Amazon Order ID) and Installation ID below</span>
                                </li>
                                <li className="flex gap-2">
                                    <span className="font-bold text-[#FF9900]">4.</span>
                                    <span>Enter the generated Confirmation ID in your product to complete activation</span>
                                </li>
                            </ol>
                        </div>
                    </div>

                    {/* Main Activation Card */}
                    <div className="bg-white rounded-lg shadow-lg border border-[#DDD] overflow-hidden">
                        {/* Card Header */}
                        <div className="bg-gradient-to-b from-[#F7F8FA] to-[#E7E9EC] px-6 py-4 border-b border-[#DDD]">
                            <h2 className="text-lg font-bold text-[#0F1111]">Generate Confirmation ID</h2>
                            <p className="text-sm text-[#565959] mt-1">
                                Enter your details below to get your Confirmation ID
                            </p>
                        </div>

                        <div className="p-6">
                            {confirmationId ? (
                                // Success State
                                <div className="space-y-6">
                                    <div className="bg-[#F7F8FA] rounded-lg border border-[#DDD] p-6">
                                        <div className="flex items-center gap-3 mb-4">
                                            <div className="w-12 h-12 bg-[#067D62] rounded-full flex items-center justify-center">
                                                <CheckCircle className="w-6 h-6 text-white" />
                                            </div>
                                            <div>
                                                <h3 className="font-bold text-[#0F1111]">Confirmation ID Generated!</h3>
                                                <p className="text-sm text-[#565959]">Enter this ID in your product</p>
                                            </div>
                                        </div>

                                        <div className="bg-[#FCF5EE] border-2 border-[#FF9900] rounded-lg p-4 mb-4">
                                            <p className="text-xs text-[#565959] mb-2 uppercase font-medium">Your Confirmation ID:</p>
                                            <div className="flex items-start gap-2">
                                                <code className="flex-1 font-mono text-base font-bold text-[#0F1111] break-all leading-relaxed">
                                                    {formatConfirmationId(confirmationId)}
                                                </code>
                                                <button
                                                    onClick={copyToClipboard}
                                                    className="p-2 hover:bg-[#FF9900]/20 rounded-lg transition-colors"
                                                    title="Copy to clipboard"
                                                >
                                                    <Copy className="w-5 h-5 text-[#FF9900]" />
                                                </button>
                                            </div>
                                        </div>

                                        <button
                                            onClick={copyToClipboard}
                                            className="w-full py-3 bg-gradient-to-b from-[#FFD814] to-[#F7CA00] hover:from-[#F7CA00] hover:to-[#E7B800] text-[#0F1111] font-bold rounded-lg border border-[#FCD200] shadow-sm transition-all flex items-center justify-center gap-2"
                                        >
                                            <Copy className="w-5 h-5" />
                                            Copy to Clipboard
                                        </button>
                                    </div>

                                    <button
                                        onClick={() => {
                                            setConfirmationId(null);
                                            setSecretCode('');
                                            setInstallationId('');
                                            setError(null);
                                        }}
                                        className="w-full py-2 text-[#007185] hover:text-[#C7511F] hover:underline flex items-center justify-center gap-2 text-sm"
                                    >
                                        <RefreshCw className="w-4 h-4" />
                                        Generate Another Confirmation ID
                                    </button>
                                </div>
                            ) : (
                                // Form State
                                <form onSubmit={handleSubmit} className="space-y-5">
                                    {/* Secret Code Input */}
                                    <div>
                                        <label className="block text-sm font-bold text-[#0F1111] mb-2">
                                            SECRET CODE / AMAZON ORDER ID
                                        </label>
                                        <div className="flex">
                                            <div className="bg-[#F0F2F2] border border-r-0 border-[#888C8C] rounded-l px-3 flex items-center">
                                                <Key className="w-5 h-5 text-[#FF9900]" />
                                            </div>
                                            <input
                                                type="text"
                                                value={secretCode}
                                                onChange={(e) => {
                                                    setSecretCode(e.target.value);
                                                    setError(null);
                                                }}
                                                placeholder="e.g. 534643897517291 or 408-1234567-1234567"
                                                maxLength={25}
                                                className="flex-1 px-4 py-3 border border-[#888C8C] rounded-r text-base font-mono text-[#0F1111] bg-white focus:outline-none focus:ring-2 focus:ring-[#FF9900] focus:border-[#FF9900] placeholder:text-[#6B7280]"
                                            />
                                        </div>
                                        <p className="text-xs text-[#565959] mt-1">
                                            Enter your 15-digit secret code OR Amazon Order ID (format: 408-1234567-1234567)
                                        </p>
                                    </div>

                                    {/* Installation ID Input */}
                                    <div>
                                        <label className="block text-sm font-bold text-[#0F1111] mb-2">
                                            INSTALLATION ID <span className="font-normal text-[#565959]">(63 digits)</span>
                                        </label>
                                        <div className="flex">
                                            <div className="bg-[#F0F2F2] border border-r-0 border-[#888C8C] rounded-l px-3 flex items-center">
                                                <Phone className="w-5 h-5 text-[#FF9900]" />
                                            </div>
                                            <input
                                                type="text"
                                                value={installationId}
                                                onChange={handleInstallationIdChange}
                                                placeholder="Enter the 63-digit Installation ID"
                                                className="flex-1 px-4 py-3 border border-[#888C8C] rounded-r text-sm font-mono text-[#0F1111] bg-white focus:outline-none focus:ring-2 focus:ring-[#FF9900] focus:border-[#FF9900] placeholder:text-[#6B7280]"
                                            />
                                        </div>

                                        {/* Progress indicator */}
                                        <div className="mt-2 flex items-center gap-3">
                                            <div className="flex-1 h-2 bg-[#E7E9EC] rounded-full overflow-hidden">
                                                <div
                                                    className={`h-full transition-all duration-300 ${digitCount === 63 ? 'bg-[#067D62]' : 'bg-[#FF9900]'}`}
                                                    style={{ width: `${(digitCount / 63) * 100}%` }}
                                                />
                                            </div>
                                            <span className={`text-xs font-medium ${digitCount === 63 ? 'text-[#067D62]' : 'text-[#565959]'}`}>
                                                {digitCount}/63
                                            </span>
                                        </div>
                                    </div>

                                    {/* Error Message */}
                                    {error && (
                                        <div className="p-3 bg-[#FCF4F4] border border-[#CC0C39] rounded-lg flex items-start gap-2">
                                            <AlertTriangle className="w-5 h-5 text-[#CC0C39] flex-shrink-0 mt-0.5" />
                                            <div>
                                                <span className="text-[#CC0C39] text-sm font-medium">{error}</span>
                                                {canRetry && (
                                                    <p className="text-[#CC0C39] text-xs mt-1">You can try again with a different Installation ID.</p>
                                                )}
                                            </div>
                                        </div>
                                    )}

                                    {/* Submit Button */}
                                    <button
                                        type="submit"
                                        disabled={isLoading || !secretCode.trim() || digitCount !== 63}
                                        className="w-full py-3 bg-gradient-to-b from-[#FFD814] to-[#F7CA00] hover:from-[#F7CA00] hover:to-[#E7B800] disabled:from-[#E7E9EC] disabled:to-[#D5D9D9] text-[#0F1111] disabled:text-[#565959] font-bold rounded-lg border border-[#FCD200] disabled:border-[#D5D9D9] shadow-sm transition-all disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                    >
                                        {isLoading ? (
                                            <>
                                                <div className="w-4 h-4 border-2 border-[#0F1111]/30 border-t-[#0F1111] rounded-full animate-spin" />
                                                Generating...
                                            </>
                                        ) : (
                                            <>
                                                <Key className="w-5 h-5" />
                                                Generate Confirmation ID
                                            </>
                                        )}
                                    </button>
                                </form>
                            )}
                        </div>
                    </div>

                    {/* Support Card */}
                    <div className="mt-6 bg-white rounded-lg shadow border border-[#DDD] overflow-hidden">
                        <div className="bg-[#FEF8F2] border-l-4 border-[#FF9900] p-4">
                            <p className="text-sm text-[#0F1111]">
                                <span className="font-bold">Need Help?</span> Contact us on WhatsApp:{' '}
                                <a
                                    href="https://wa.me/918595899215"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="font-bold text-[#007185] hover:text-[#C7511F] hover:underline"
                                >
                                    +91 8595899215
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
