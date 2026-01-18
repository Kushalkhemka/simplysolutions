'use client';

import { useState, useRef } from 'react';
import Image from 'next/image';
import {
    ShoppingCart,
    CheckCircle,
    Copy,
    Download,
    X,
    AlertTriangle,
    ArrowDown,
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

export default function ActivatePage() {
    const [secretCode, setSecretCode] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [showOSModal, setShowOSModal] = useState(false);
    const [activationResult, setActivationResult] = useState<ActivationResult | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [installationIds, setInstallationIds] = useState<string[]>(Array(9).fill(''));
    const installationRef = useRef<HTMLDivElement>(null);

    const handleVerifyCode = async () => {
        if (!secretCode.trim()) {
            setError('Please enter your secret code');
            return;
        }

        setIsLoading(true);
        setError(null);

        try {
            const response = await fetch('/api/activate/verify', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ secretCode: secretCode.trim() }),
            });

            const data = await response.json();

            if (!response.ok || !data.valid) {
                setError(data.error || 'Invalid secret code');
                setIsLoading(false);
                return;
            }

            if (data.isAlreadyRedeemed && data.licenseKey) {
                setActivationResult({
                    success: true,
                    licenseKey: data.licenseKey,
                    productInfo: data.productInfo || {},
                    alreadyRedeemed: true,
                });
                toast.success('Your license key was already generated!');
                setIsLoading(false);
                return;
            }

            await handleGenerateKey();

        } catch (err) {
            console.error('Error verifying code:', err);
            setError('Network error. Please try again.');
            setIsLoading(false);
        }
    };

    const handleGenerateKey = async () => {
        try {
            const response = await fetch('/api/activate/generate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ secretCode: secretCode.trim() }),
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

            toast.success('License Key Has Been Generated Successfully!', { duration: 5000 });

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
        const cleanValue = value.replace(/\D/g, '').slice(0, 6);
        const newIds = [...installationIds];
        newIds[index] = cleanValue;
        setInstallationIds(newIds);

        if (cleanValue.length === 6 && index < 8) {
            const nextInput = document.getElementById(`install-id-${index + 1}`);
            nextInput?.focus();
        }
    };

    const handlePhoneActivation = () => {
        const fullInstallationId = installationIds.join('');
        if (fullInstallationId.length < 54) {
            toast.error('Please enter all 9 installation ID blocks');
            return;
        }
        toast.info('For phone activation, please contact support on WhatsApp: +91 9711397918');
    };

    return (
        <div className="min-h-screen bg-[#EAEDED]">
            {/* Success Banner - Amazon Green */}
            {activationResult?.success && (
                <div className="bg-[#067D62] text-white py-3 px-4">
                    <div className="container-dense flex items-center justify-center gap-2 text-sm font-medium">
                        <CheckCircle className="w-5 h-5" />
                        <span className="font-bold">Successfully Generated!</span>
                        <span className="hidden sm:inline">Your Product Activation Key is Ready</span>
                    </div>
                </div>
            )}

            {/* Amazon-style Header Banner */}
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
                            <h2 className="text-lg font-bold text-[#0F1111]">Enter Your Secret Code</h2>
                            <p className="text-sm text-[#565959] mt-1">
                                Please enter your 15-Digit Unique Secret Code to get your 25-Digit Product License Key
                            </p>
                        </div>

                        <div className="p-6">
                            {/* Secret Code Input */}
                            <div className="mb-4">
                                <label className="block text-sm font-bold text-[#0F1111] mb-2">
                                    UNIQUE SECRET CODE
                                </label>
                                <div className="flex">
                                    <div className="bg-[#F0F2F2] border border-r-0 border-[#888C8C] rounded-l px-3 flex items-center">
                                        <ShoppingCart className="w-5 h-5 text-[#FF9900]" />
                                    </div>
                                    <input
                                        type="text"
                                        value={secretCode}
                                        onChange={(e) => {
                                            setSecretCode(e.target.value);
                                            setError(null);
                                        }}
                                        placeholder="e.g. 534643897517291"
                                        className="flex-1 px-4 py-3 border border-[#888C8C] rounded-r text-base font-mono text-[#0F1111] bg-white focus:outline-none focus:ring-2 focus:ring-[#FF9900] focus:border-[#FF9900] placeholder:text-[#6B7280]"
                                        maxLength={20}
                                    />
                                </div>
                            </div>

                            {/* Helper Note */}
                            <p className="text-xs text-[#CC0C39] mb-6 flex items-start gap-1">
                                <span className="font-bold">*Note:</span>
                                <span>Include the Secret Code received via mail from amazon.in to get your license key.</span>
                            </p>

                            {/* Error Message */}
                            {error && (
                                <div className="mb-6 p-3 bg-[#FCF4F4] border border-[#CC0C39] rounded flex items-center gap-2">
                                    <AlertTriangle className="w-4 h-4 text-[#CC0C39] flex-shrink-0" />
                                    <span className="text-[#CC0C39] text-sm">{error}</span>
                                </div>
                            )}

                            {/* Generate Button - Amazon Style */}
                            <button
                                onClick={handleVerifyCode}
                                disabled={isLoading || !secretCode.trim()}
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

                            {/* Alternative: Orange button for more visibility */}
                            {/* <button className="w-full py-3 bg-gradient-to-b from-[#FF9900] to-[#E47911] hover:from-[#FA8900] hover:to-[#D07910] text-white font-bold rounded-lg border border-[#D07910] shadow-sm">
                                Generate Activation Key
                            </button> */}
                        </div>

                        {/* Activation Result */}
                        {activationResult?.success && (
                            <div className="border-t border-[#DDD]">
                                {/* Success Alert */}
                                <div className="bg-[#067D62] text-white px-6 py-3 flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <CheckCircle className="w-5 h-5" />
                                        <span className="font-medium">License Key Generated Successfully!</span>
                                    </div>
                                    <button onClick={() => setActivationResult(null)} className="hover:bg-white/20 p-1 rounded">
                                        <X className="w-4 h-4" />
                                    </button>
                                </div>

                                <div className="p-6 space-y-6">
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

                                    {/* Multiple Keys Note */}
                                    <div className="text-center p-3 bg-[#FEF8F2] border border-[#FF9900] rounded">
                                        <p className="text-xs text-[#B12704]">
                                            <span className="font-bold">Multiple Keys?</span> Contact us on WhatsApp:{' '}
                                            <a href="https://wa.me/919711397918" target="_blank" rel="noopener noreferrer" className="font-bold underline hover:text-[#CC0C39]">
                                                9711397918
                                            </a>
                                            {' '}(message only)
                                        </p>
                                    </div>

                                    {/* Installation Warning Box */}
                                    <div className="bg-[#FFF4E5] border-l-4 border-[#FF9900] p-4">
                                        <p className="text-[#0F1111] font-medium text-sm mb-3">
                                            ⚠️ Please uninstall all previous versions of Microsoft Office Suite before installing this product.
                                        </p>
                                        <div className="flex flex-wrap gap-2">
                                            <a
                                                href="https://aka.ms/SaRA-officeUninstallFromPC"
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="inline-flex items-center gap-1 px-4 py-2 bg-[#232F3E] text-white text-sm font-medium rounded hover:bg-[#37475A] transition-colors"
                                            >
                                                <AlertTriangle className="w-4 h-4" />
                                                Office Removal Tool
                                            </a>
                                            <a
                                                href="https://www.youtube.com/watch?v=your-video-id"
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="inline-flex items-center gap-1 px-4 py-2 bg-[#CC0C39] text-white text-sm font-medium rounded hover:bg-[#A00F28] transition-colors"
                                            >
                                                <Video className="w-4 h-4" />
                                                Video Guide
                                            </a>
                                        </div>
                                    </div>

                                    {/* Installation ID Section */}
                                    <div ref={installationRef} className="pt-4 border-t border-[#DDD]">
                                        <div className="flex items-center justify-between mb-3">
                                            <h3 className="font-bold text-[#0F1111] text-sm uppercase">
                                                Phone Activation (If Online Fails)
                                            </h3>
                                            <button onClick={scrollToInstallation} className="text-xs text-[#007185] hover:underline hover:text-[#C7511F]">
                                                Learn more ↓
                                            </button>
                                        </div>

                                        <p className="text-xs text-[#565959] mb-3">
                                            Enter your 54-digit Installation ID below for phone activation:
                                        </p>

                                        <div className="grid grid-cols-3 sm:grid-cols-9 gap-1 mb-4">
                                            {installationIds.map((id, index) => (
                                                <input
                                                    key={index}
                                                    id={`install-id-${index}`}
                                                    type="text"
                                                    value={id}
                                                    onChange={(e) => handleInstallationIdChange(index, e.target.value)}
                                                    className="w-full px-1 py-2 text-center font-mono text-xs border border-[#888C8C] rounded focus:outline-none focus:ring-2 focus:ring-[#FF9900] bg-white"
                                                    maxLength={6}
                                                    placeholder="000000"
                                                />
                                            ))}
                                        </div>

                                        <button
                                            onClick={handlePhoneActivation}
                                            className="w-full py-2 bg-gradient-to-b from-[#FF9900] to-[#E47911] hover:from-[#FA8900] hover:to-[#D07910] text-white font-bold rounded border border-[#D07910] flex items-center justify-center gap-2 text-sm"
                                        >
                                            <Phone className="w-4 h-4" />
                                            ACTIVATE
                                        </button>
                                    </div>

                                    {/* Video Tutorial Section */}
                                    <div className="pt-6 border-t border-[#DDD]">
                                        <h3 className="font-bold text-[#0F1111] text-sm mb-4 uppercase">
                                            Video Tutorial
                                        </h3>
                                        <div className="relative w-full aspect-video rounded-lg overflow-hidden bg-black">
                                            <iframe
                                                className="absolute inset-0 w-full h-full"
                                                src="https://www.youtube.com/embed/5k2PsZ3mXoA"
                                                title="Tutorial on How to Install Office Professional Plus 2021"
                                                frameBorder="0"
                                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                                allowFullScreen
                                            />
                                        </div>
                                        <p className="text-xs text-[#565959] mt-2 text-center">
                                            Installation process is simple, please follow all the instructions correctly till the end for a smooth activation...
                                        </p>
                                    </div>

                                    {/* Warranty Registration CTA */}
                                    <div className="bg-[#CC0C39] text-white p-4 rounded-lg">
                                        <p className="font-bold text-sm mb-2">
                                            **DO THE WARRANTY REGISTRATION FOR FUTURE FREE SUPPORT
                                        </p>
                                        <a
                                            href="https://simplysolutions.co.in/warranty"
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="inline-flex items-center gap-2 px-4 py-2 bg-white text-[#CC0C39] text-sm font-bold rounded hover:bg-gray-100 transition-colors"
                                        >
                                            Register Warranty Now
                                        </a>
                                    </div>

                                    {/* Dynamic Installation Guide */}
                                    <div className="pt-6 border-t border-[#DDD]">
                                        <InstallationGuide
                                            guideFile={getInstallationGuide(activationResult.productInfo?.sku) || 'office2021.md'}
                                            productName={activationResult.productInfo?.productName || undefined}
                                            downloadLink={activationResult.productInfo?.downloadUrl || undefined}
                                        />
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Help Section - Amazon style info box - Only show before activation */}
                    {!activationResult?.success && (
                        <div className="mt-6 bg-white rounded-lg shadow border border-[#DDD] overflow-hidden">
                            <div className="bg-gradient-to-b from-[#F7F8FA] to-[#E7E9EC] px-4 py-3 border-b border-[#DDD]">
                                <h3 className="font-bold text-[#0F1111] text-sm">
                                    How to find your Secret Code
                                </h3>
                            </div>
                            <div className="p-4">
                                <p className="text-sm text-[#565959] mb-3">
                                    Search <span className="font-bold text-[#FF9900]">"Square Keys"</span> in your Amazon registered email inbox
                                </p>

                                <div className="bg-[#F7F8FA] rounded border border-[#DDD] p-3 text-sm">
                                    <p className="text-[#0F1111] mb-2">
                                        <span className="font-medium">From:</span> Amazon Seller
                                    </p>
                                    <p className="text-[#0F1111] mb-3">
                                        <span className="font-medium">Subject:</span> Your Order - Pro Retail License Key
                                    </p>

                                    <div className="p-2 bg-[#FEF8F2] border-l-4 border-[#FF9900] text-xs">
                                        <p className="text-[#CC0C39] font-bold">Your Unique Secret Code → XXXXXXXXXXXXXXX</p>
                                    </div>
                                </div>

                                {/* Didn't receive code section */}
                                <div className="mt-4 pt-4 border-t border-[#DDD]">
                                    <p className="text-sm font-bold text-[#CC0C39] mb-2">
                                        ⚠️ Didn't receive the code via email?
                                    </p>
                                    <p className="text-xs text-[#565959] mb-3">
                                        If your Amazon account doesn't have a registered email, the code is sent to your Amazon Message Center instead.
                                    </p>
                                    <a
                                        href="https://www.amazon.in/gp/msg/cntr/message#!/inbox"
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#232F3E] hover:bg-[#37475A] text-white text-sm font-medium rounded transition-colors w-full justify-center"
                                    >
                                        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                                            <path d="M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z" />
                                        </svg>
                                        Open Amazon Buyer/Seller Messages
                                    </a>
                                    <p className="text-xs text-[#565959] mt-2 text-center">
                                        → Click on <span className="font-bold">"Buyer/Seller Messages"</span> tab to find your activation code
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Amazon Logo Link */}
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
                            ? Enter your code above.
                        </p>
                    </div>
                </div>
            </div>

            {/* OS Selection Modal - Amazon Style */}
            {showOSModal && (
                <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg shadow-2xl max-w-sm w-full overflow-hidden">
                        <div className="bg-[#232F3E] px-4 py-3 flex items-center justify-between">
                            <span className="text-white font-bold">Select Operating System</span>
                            <button onClick={() => setShowOSModal(false)} className="text-white/70 hover:text-white">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="p-6">
                            <div className="flex items-center justify-center gap-2 mb-4">
                                <div className="grid grid-cols-2 gap-0.5 w-8 h-8">
                                    <div className="bg-[#F25022]" />
                                    <div className="bg-[#7FBA00]" />
                                    <div className="bg-[#00A4EF]" />
                                    <div className="bg-[#FFB900]" />
                                </div>
                                <span className="text-xl font-semibold text-[#0F1111]">Microsoft</span>
                            </div>

                            <p className="text-xs text-[#CC0C39] text-center mb-4">
                                Choose carefully - this cannot be changed later
                            </p>

                            <button
                                onClick={() => { setShowOSModal(false); handleGenerateKey(); }}
                                className="w-full p-4 border-2 border-[#DDD] rounded-lg hover:border-[#00A4EF] hover:bg-[#F0FBFF] transition-all mb-4"
                            >
                                <div className="grid grid-cols-2 gap-1 w-12 h-12 mx-auto mb-2">
                                    <div className="bg-[#00A4EF]" />
                                    <div className="bg-[#00A4EF]" />
                                    <div className="bg-[#00A4EF]" />
                                    <div className="bg-[#00A4EF]" />
                                </div>
                                <p className="font-medium text-[#0F1111]">Windows</p>
                            </button>

                            <button
                                onClick={() => { setShowOSModal(false); handleGenerateKey(); }}
                                className="w-full py-3 bg-gradient-to-b from-[#FFD814] to-[#F7CA00] hover:from-[#F7CA00] hover:to-[#E7B800] text-[#0F1111] font-bold rounded border border-[#FCD200]"
                            >
                                Confirm Selection
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
