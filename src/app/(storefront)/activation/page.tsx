'use client';

import { useState, useRef } from 'react';
import Image from 'next/image';
import {
    ShoppingBag,
    CheckCircle,
    Copy,
    Download,
    X,
    AlertTriangle,
    Phone,
    Video
} from 'lucide-react';
import { toast } from 'sonner';
import InstallationGuide from '@/components/InstallationGuide';
import { getInstallationGuide } from '@/lib/installation-guides';

interface ProductInfo {
    productName: string | null;
    productImage: string | null;
    downloadUrl: string | null;
    sku?: string;
}

interface ActivationResult {
    success: boolean;
    licenseKey: string;
    productInfo: ProductInfo;
    alreadyRedeemed?: boolean;
}

export default function FBAActivatePage() {
    const [orderId, setOrderId] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [activationResult, setActivationResult] = useState<ActivationResult | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [installationIds, setInstallationIds] = useState<string[]>(Array(9).fill(''));
    const installationRef = useRef<HTMLDivElement>(null);
    const [confirmationId, setConfirmationId] = useState<string | null>(null);
    const [getcidLoading, setGetcidLoading] = useState(false);
    const [getcidError, setGetcidError] = useState<string | null>(null);

    const handleVerifyOrder = async () => {
        if (!orderId.trim()) {
            setError('Please enter your Amazon Order ID');
            return;
        }

        // Validate order ID format (XXX-XXXXXXX-XXXXXXX)
        const orderIdPattern = /^\d{3}-\d{7}-\d{7}$/;
        if (!orderIdPattern.test(orderId.trim())) {
            setError('Invalid Order ID format. Please use: XXX-XXXXXXX-XXXXXXX');
            return;
        }

        setIsLoading(true);
        setError(null);

        try {
            // Verify order exists
            const verifyResponse = await fetch('/api/activate/verify-order', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ orderId: orderId.trim() }),
            });

            const verifyData = await verifyResponse.json();

            if (!verifyResponse.ok || !verifyData.valid) {
                setError(verifyData.error || 'Order ID not found in our system');
                setIsLoading(false);
                return;
            }

            // If already redeemed, show the existing key
            if (verifyData.isAlreadyRedeemed && verifyData.licenseKey) {
                setActivationResult({
                    success: true,
                    licenseKey: verifyData.licenseKey,
                    productInfo: verifyData.productInfo || {},
                    alreadyRedeemed: true,
                });
                toast.success('Your license key was already generated!');
                setIsLoading(false);
                return;
            }

            // Generate new license key
            await handleGenerateKey();

        } catch (err) {
            console.error('Error verifying order:', err);
            setError('Network error. Please try again.');
            setIsLoading(false);
        }
    };

    const handleGenerateKey = async () => {
        try {
            const response = await fetch('/api/activate/generate-fba', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ orderId: orderId.trim() }),
            });

            const data = await response.json();

            if (!response.ok || !data.success) {
                setError(data.error || 'Failed to generate license key');
                setIsLoading(false);
                return;
            }

            setActivationResult({
                success: true,
                licenseKey: data.licenseKey,
                productInfo: data.productInfo || {},
                alreadyRedeemed: data.alreadyRedeemed,
            });

            toast.success('License Key Generated Successfully!', { duration: 5000 });

        } catch (err) {
            console.error('Error generating key:', err);
            setError('Failed to generate license key. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleCopyKey = () => {
        if (activationResult?.licenseKey) {
            navigator.clipboard.writeText(activationResult.licenseKey);
            toast.success('License key copied to clipboard!');
        }
    };

    const handleDownload = () => {
        if (activationResult?.productInfo?.downloadUrl) {
            window.open(activationResult.productInfo.downloadUrl, '_blank');
        }
    };

    const scrollToInstallation = () => {
        installationRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    const handleInstallationIdChange = (index: number, value: string) => {
        const cleanValue = value.replace(/\D/g, '').slice(0, 7);
        const newIds = [...installationIds];
        newIds[index] = cleanValue;
        setInstallationIds(newIds);

        if (cleanValue.length === 7 && index < 8) {
            const nextInput = document.getElementById(`install-id-${index + 1}`);
            nextInput?.focus();
        }
    };

    const handlePhoneActivation = async () => {
        const fullInstallationId = installationIds.join('');
        if (fullInstallationId.length < 54) {
            toast.error('Please enter all 9 installation ID blocks (54 digits total)');
            return;
        }

        if (fullInstallationId.length < 63) {
            toast.error('Please enter the complete Installation ID (63 digits)');
            return;
        }

        setGetcidLoading(true);
        setGetcidError(null);

        try {
            const response = await fetch('/api/getcid', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    identifier: orderId.trim(),
                    installationId: fullInstallationId
                })
            });

            const data = await response.json();

            if (data.success && data.confirmationId) {
                setConfirmationId(data.confirmationId);
                toast.success('Confirmation ID generated successfully!');
            } else {
                setGetcidError(data.error || 'Failed to generate Confirmation ID');
                toast.error(data.error || 'Failed to generate Confirmation ID');
            }
        } catch (err) {
            console.error('GetCID error:', err);
            setGetcidError('Network error. Please try again.');
            toast.error('Network error. Please try again.');
        } finally {
            setGetcidLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#EAEDED]">
            {/* Success Banner */}
            {activationResult?.success && (
                <div className="bg-[#067D62] text-white py-3 px-4">
                    <div className="container-dense flex items-center justify-center gap-2 text-sm font-medium">
                        <CheckCircle className="w-5 h-5" />
                        <span className="font-bold">Successfully Generated!</span>
                        <span className="hidden sm:inline">Your Product Activation Key is Ready</span>
                    </div>
                </div>
            )}

            {/* Header Banner */}
            <div className="bg-[#232F3E] py-4 border-b-4 border-[#FF9900]">
                <div className="container-dense">
                    <h1 className="text-2xl md:text-3xl font-bold text-center text-white uppercase tracking-wider">
                        Secure Online Activation
                    </h1>
                    <p className="text-center text-[#FF9900] text-sm mt-1 font-medium">
                        For Amazon.in Customers
                    </p>
                </div>
            </div>

            {/* Main Content */}
            <div className="container-dense py-8 md:py-12">
                <div className="max-w-2xl mx-auto">

                    {/* Main Activation Card */}
                    <div className="bg-white rounded-lg shadow-lg border border-[#DDD] overflow-hidden">
                        {/* Card Header */}
                        <div className="bg-gradient-to-b from-[#F7F8FA] to-[#E7E9EC] px-6 py-4 border-b border-[#DDD]">
                            <h2 className="text-lg font-bold text-[#0F1111]">Enter Your Amazon Order ID</h2>
                            <p className="text-sm text-[#565959] mt-1">
                                Enter your 17-digit Amazon Order ID to get your 25-Digit Product License Key
                            </p>
                        </div>

                        <div className="p-6">
                            {/* Order ID Input */}
                            <div className="mb-4">
                                <label className="block text-sm font-bold text-[#0F1111] mb-2">
                                    AMAZON ORDER ID
                                </label>
                                <div className="flex">
                                    <div className="bg-[#F0F2F2] border border-r-0 border-[#888C8C] rounded-l px-3 flex items-center">
                                        <ShoppingBag className="w-5 h-5 text-[#FF9900]" />
                                    </div>
                                    <input
                                        type="text"
                                        value={orderId}
                                        onChange={(e) => {
                                            setOrderId(e.target.value);
                                            setError(null);
                                        }}
                                        placeholder="XXX-XXXXXXX-XXXXXXX"
                                        className="flex-1 px-4 py-3 border border-[#888C8C] rounded-r text-base font-mono text-[#0F1111] bg-white focus:outline-none focus:ring-2 focus:ring-[#FF9900] focus:border-[#FF9900] placeholder:text-[#6B7280]"
                                        maxLength={19}
                                    />
                                </div>
                            </div>

                            {/* Helper Note */}
                            <p className="text-xs text-[#565959] mb-6 flex items-start gap-1">
                                <span className="font-bold">*Note:</span>
                                <span>Find your Order ID in your Amazon order confirmation email or Amazon app order history.</span>
                            </p>

                            {/* Error Message */}
                            {error && (
                                <div className="mb-6 p-3 bg-[#FCF4F4] border border-[#CC0C39] rounded flex items-center gap-2">
                                    <AlertTriangle className="w-4 h-4 text-[#CC0C39] flex-shrink-0" />
                                    <span className="text-[#CC0C39] text-sm">{error}</span>
                                </div>
                            )}

                            {/* Generate Button */}
                            <button
                                onClick={handleVerifyOrder}
                                disabled={isLoading || !orderId.trim()}
                                className="w-full py-3 bg-gradient-to-b from-[#FFD814] to-[#F7CA00] hover:from-[#F7CA00] hover:to-[#E7B800] text-[#0F1111] font-bold rounded-lg border border-[#FCD200] shadow-sm transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isLoading ? (
                                    <span className="flex items-center justify-center gap-2">
                                        <div className="w-4 h-4 border-2 border-[#0F1111]/30 border-t-[#0F1111] rounded-full animate-spin" />
                                        Generating...
                                    </span>
                                ) : (
                                    'Generate Activation Key'
                                )}
                            </button>

                            {/* Activation Result */}
                            {activationResult?.success && (
                                <div className="mt-6 border-t border-[#DDD] pt-6">
                                    {/* Success Alert */}
                                    <div className="bg-[#067D62] text-white px-4 py-3 rounded-lg flex items-center justify-between mb-4">
                                        <div className="flex items-center gap-2">
                                            <CheckCircle className="w-5 h-5" />
                                            <span className="font-medium">License Key Generated!</span>
                                        </div>
                                        <button onClick={() => setActivationResult(null)} className="hover:bg-white/20 p-1 rounded">
                                            <X className="w-4 h-4" />
                                        </button>
                                    </div>

                                    {/* Product Card */}
                                    <div className="flex items-start gap-4 p-4 bg-[#F7F8FA] rounded border border-[#DDD]">
                                        <div className="w-16 h-16 bg-white rounded flex items-center justify-center flex-shrink-0 border border-[#DDD]">
                                            {activationResult.productInfo?.productImage ? (
                                                <Image src={activationResult.productInfo.productImage} alt="Product" width={60} height={60} className="object-contain" />
                                            ) : (
                                                <div className="text-2xl">📦</div>
                                            )}
                                        </div>

                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm text-[#565959]">
                                                <span className="font-bold text-[#0F1111]">Product: </span>
                                                {activationResult.productInfo?.productName || 'Microsoft Office Professional Plus'}
                                            </p>
                                            <div className="mt-2 p-2 bg-[#FCF5EE] border border-[#FF9900] rounded">
                                                <p className="text-xs text-[#565959] mb-1">Your License Key:</p>
                                                <div className="flex items-center gap-2">
                                                    <code className="font-mono text-sm font-bold text-[#0F1111] break-all">
                                                        {activationResult.licenseKey}
                                                    </code>
                                                    <button onClick={handleCopyKey} className="p-1.5 hover:bg-[#FF9900]/20 rounded" title="Copy">
                                                        <Copy className="w-4 h-4 text-[#FF9900]" />
                                                    </button>
                                                </div>
                                            </div>
                                        </div>

                                        {activationResult.productInfo?.downloadUrl && (
                                            <button onClick={handleDownload} className="flex flex-col items-center gap-1 p-2 hover:bg-[#F0F2F2] rounded">
                                                <Download className="w-5 h-5 text-[#007185]" />
                                                <span className="text-xs text-[#007185]">Download</span>
                                            </button>
                                        )}
                                    </div>

                                    {/* Phone Activation Section */}
                                    <div ref={installationRef} className="pt-6 mt-6 border-t border-[#DDD]">
                                        <div className="flex items-center justify-between mb-3">
                                            <h3 className="font-bold text-[#0F1111] text-sm uppercase">
                                                Get Confirmation ID
                                            </h3>
                                            <button onClick={scrollToInstallation} className="text-xs text-[#007185] hover:underline hover:text-[#C7511F]">
                                                Learn more ↓
                                            </button>
                                        </div>

                                        <p className="text-xs text-[#565959] mb-3">
                                            Enter your 63-digit Installation ID below to get your Confirmation ID:
                                        </p>

                                        {/* Confirmation ID Result */}
                                        {confirmationId && (
                                            <div className="mb-4 p-4 bg-[#067D62] text-white rounded-lg">
                                                <p className="text-sm font-bold mb-2">✓ Confirmation ID Generated!</p>
                                                <div className="bg-white/20 p-2 rounded">
                                                    <code className="font-mono text-sm break-all">{confirmationId}</code>
                                                </div>
                                                <button
                                                    onClick={() => {
                                                        navigator.clipboard.writeText(confirmationId);
                                                        toast.success('Confirmation ID copied!');
                                                    }}
                                                    className="mt-2 px-3 py-1 bg-white text-[#067D62] text-xs font-bold rounded hover:bg-gray-100"
                                                >
                                                    Copy Confirmation ID
                                                </button>
                                            </div>
                                        )}

                                        {/* GetCID Error */}
                                        {getcidError && (
                                            <div className="mb-4 p-3 bg-[#FCF4F4] border border-[#CC0C39] rounded flex items-center gap-2">
                                                <AlertTriangle className="w-4 h-4 text-[#CC0C39] flex-shrink-0" />
                                                <span className="text-[#CC0C39] text-sm">{getcidError}</span>
                                            </div>
                                        )}

                                        <div className="grid grid-cols-3 sm:grid-cols-9 gap-1 mb-4">
                                            {installationIds.map((id, index) => (
                                                <input
                                                    key={index}
                                                    id={`install-id-${index}`}
                                                    type="text"
                                                    value={id}
                                                    onChange={(e) => handleInstallationIdChange(index, e.target.value)}
                                                    className="w-full px-1 py-2 text-center font-mono text-xs border border-[#888C8C] rounded focus:outline-none focus:ring-2 focus:ring-[#FF9900] bg-white"
                                                    maxLength={7}
                                                    placeholder="0000000"
                                                />
                                            ))}
                                        </div>

                                        <button
                                            onClick={handlePhoneActivation}
                                            disabled={getcidLoading || !orderId.trim()}
                                            className="w-full py-2 bg-gradient-to-b from-[#FF9900] to-[#E47911] hover:from-[#FA8900] hover:to-[#D07910] text-white font-bold rounded border border-[#D07910] flex items-center justify-center gap-2 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            {getcidLoading ? (
                                                <>
                                                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                                    Generating...
                                                </>
                                            ) : (
                                                <>
                                                    <Phone className="w-4 h-4" />
                                                    GET CONFIRMATION ID
                                                </>
                                            )}
                                        </button>

                                        <p className="text-xs text-[#565959] mt-2 text-center">
                                            Need help? Contact us on WhatsApp:{' '}
                                            <a href="https://wa.me/918595899215" className="text-[#007185] hover:underline font-medium">8595899215</a>
                                        </p>
                                    </div>

                                    {/* Dynamic Installation Guide */}
                                    <div className="pt-6 mt-6 border-t border-[#DDD]">
                                        <InstallationGuide
                                            guideFile={getInstallationGuide(activationResult.productInfo?.sku) || 'office2021.md'}
                                            productName={activationResult.productInfo?.productName || undefined}
                                            downloadLink={activationResult.productInfo?.downloadUrl || undefined}
                                        />
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Help Section - only show when no license key generated */}
                    {!activationResult?.success && (
                        <div className="mt-6 bg-white rounded-lg shadow border border-[#DDD] overflow-hidden">
                            <div className="bg-gradient-to-b from-[#F7F8FA] to-[#E7E9EC] px-4 py-3 border-b border-[#DDD]">
                                <h3 className="font-bold text-[#0F1111] text-sm">
                                    How to find your Amazon Order ID
                                </h3>
                            </div>
                            <div className="p-4">
                                <ol className="space-y-2 text-sm text-[#0F1111]">
                                    <li className="flex gap-2">
                                        <span className="font-bold text-[#FF9900]">1.</span>
                                        <span>Open your Amazon app or visit amazon.in</span>
                                    </li>
                                    <li className="flex gap-2">
                                        <span className="font-bold text-[#FF9900]">2.</span>
                                        <span>Go to <strong>Your Orders</strong></span>
                                    </li>
                                    <li className="flex gap-2">
                                        <span className="font-bold text-[#FF9900]">3.</span>
                                        <span>Find your software order and click on it</span>
                                    </li>
                                    <li className="flex gap-2">
                                        <span className="font-bold text-[#FF9900]">4.</span>
                                        <span>The Order ID is at the top (format: <code className="bg-[#F7F8FA] px-1 rounded">XXX-XXXXXXX-XXXXXXX</code>)</span>
                                    </li>
                                </ol>
                            </div>
                        </div>
                    )}

                    {/* Amazon Logo Link - only show when no license key generated */}
                    {!activationResult?.success && (
                        <div className="mt-6 text-center">
                            <p className="text-xs text-[#565959]">
                                Purchased from{' '}
                                <Image
                                    src="/images/Amazon_logo.svg.webp"
                                    alt="Amazon"
                                    width={60}
                                    height={18}
                                    className="inline-block align-middle mx-1"
                                />
                                ? Enter your Order ID above.
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
