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
import { getSubscriptionConfig } from '@/lib/amazon/subscription-products';
import { isComboProduct, getComponentFSNs } from '@/lib/amazon/combo-products';

interface ProductInfo {
    productName: string | null;
    productImage: string | null;
    downloadUrl: string | null;
    sku?: string;
    installationDoc?: string | null;
}

interface LicenseInfo {
    licenseKey: string;
    fsn: string;
    productName: string | null;
    productImage: string | null;
    downloadUrl: string | null;
    installationDoc: string | null;
}

interface ActivationResult {
    success: boolean;
    licenseKey?: string; // For backward compatibility
    productInfo?: ProductInfo;
    alreadyRedeemed?: boolean;
    isCombo?: boolean;
    comboFsn?: string; // For combo products, the combo FSN (e.g., WIN11-PP21)
    orderQuantity?: number;
    licenses?: LicenseInfo[];
    windowsInstallType?: 'upgrade' | 'fresh' | null;
    isSubscription?: boolean;
    subscriptionConfig?: any;
}

export default function ActivatePage() {
    const [secretCode, setSecretCode] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [showOSModal, setShowOSModal] = useState(false);
    const [activationResult, setActivationResult] = useState<ActivationResult | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [installationIds, setInstallationIds] = useState<string[]>(Array(9).fill(''));
    const installationRef = useRef<HTMLDivElement>(null);
    const installationGuideRef = useRef<HTMLDivElement>(null);
    const [confirmationId, setConfirmationId] = useState<string | null>(null);
    const [getcidLoading, setGetcidLoading] = useState(false);
    const [getcidError, setGetcidError] = useState<string | null>(null);

    // Success popup and FBA/MFN warning state
    const [showSuccessPopup, setShowSuccessPopup] = useState(false);
    const [showFbaWarning, setShowFbaWarning] = useState(false);
    const [fulfillmentType, setFulfillmentType] = useState<string | null>(null);

    // Windows installation type selection
    const [showWindowsTypeModal, setShowWindowsTypeModal] = useState(false);
    const [windowsInstallType, setWindowsInstallType] = useState<'upgrade' | 'fresh' | null>(null);
    const [pendingOrderFsn, setPendingOrderFsn] = useState<string | null>(null);

    // Windows FSNs that require installation type selection
    const WINDOWS_FSNS = ['WINDOWS11', 'OPSG3TNK9HZDZEM9'];
    const WINDOWS_UPGRADE_KEY = 'KNGH2-BVYFG-HJYTM-GB84H-YY49G';

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

            // For already redeemed orders, still call handleGenerateKey to get all licenses (important for combos)
            if (data.isAlreadyRedeemed) {
                // Check if it's a subscription product
                const subConfig = data.fsn ? getSubscriptionConfig(data.fsn) : null;

                if (subConfig) {
                    setActivationResult({
                        success: true,
                        licenseKey: data.licenseKey,
                        productInfo: data.productInfo || {},
                        alreadyRedeemed: true,
                        isSubscription: true,
                        subscriptionConfig: subConfig
                    });
                    toast.success('Subscription status retrieved!');
                    setIsLoading(false);
                    return;
                }

                // Store fulfillment type and call handleGenerateKey for proper multi-license handling
                if (data.fulfillmentType) {
                    setFulfillmentType(data.fulfillmentType);
                }

                // Call handleGenerateKey to get all licenses properly (important for combo products)
                await handleGenerateKey();
                toast.success('Your license key was already generated!');
                return;
            }

            // Store fulfillment type for later use
            if (data.fulfillmentType) {
                setFulfillmentType(data.fulfillmentType);
            }

            // Check if it's a subscription product (not yet redeemed)
            const subConfig = data.fsn ? getSubscriptionConfig(data.fsn) : null;
            if (subConfig) {
                // Use a blue/info style for pending subscriptions
                setError(`Your ${subConfig.productName} is currently being processed. You will receive an email/WhatsApp notification once activated (usually within 2-4 hours).`);
                setIsLoading(false);
                return;
            }

            // Check if this is a Windows product that needs installation type selection
            // Also check if it's a combo that contains Windows
            const containsWindows = data.fsn && (
                WINDOWS_FSNS.includes(data.fsn) ||
                (isComboProduct(data.fsn) && getComponentFSNs(data.fsn).some(fsn => WINDOWS_FSNS.includes(fsn)))
            );

            if (containsWindows) {
                setPendingOrderFsn(data.fsn);
                setShowWindowsTypeModal(true);
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

    // Handle Windows installation type selection
    const handleWindowsTypeSelect = async (installType: 'upgrade' | 'fresh') => {
        setWindowsInstallType(installType);
        setShowWindowsTypeModal(false);
        setIsLoading(true);
        await handleGenerateKey(installType);
    };

    const handleGenerateKey = async (installType?: 'upgrade' | 'fresh') => {
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

            // Store fulfillment type from response
            if (data.fulfillmentType) {
                setFulfillmentType(data.fulfillmentType);
            }

            // Handle new multi-license format
            if (data.licenses && data.licenses.length > 0) {
                console.log('DEBUG: Setting activation result with', data.licenses.length, 'licenses');
                console.log('DEBUG: isCombo=', data.isCombo, 'licenses=', data.licenses);
                setActivationResult({
                    success: true,
                    isCombo: data.isCombo,
                    comboFsn: data.comboFsn,
                    orderQuantity: data.orderQuantity || 1,
                    licenses: data.licenses,
                    // For backward compatibility, use first license
                    licenseKey: data.licenses[0].licenseKey,
                    productInfo: {
                        productName: data.licenses[0].productName,
                        productImage: data.licenses[0].productImage,
                        downloadUrl: data.licenses[0].downloadUrl,
                    },
                    alreadyRedeemed: data.alreadyRedeemed,
                    windowsInstallType: installType || null,
                });
            } else {
                // Fallback for old format
                setActivationResult({
                    success: true,
                    licenseKey: data.licenseKey,
                    productInfo: data.productInfo || {},
                    alreadyRedeemed: data.alreadyRedeemed,
                    windowsInstallType: installType || null,
                });
            }

            // Show success popup
            setShowSuccessPopup(true);

        } catch (err) {
            console.error('Error generating key:', err);
            setError('Failed to generate license key. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleSuccessPopupClose = () => {
        setShowSuccessPopup(false);

        // Show FBA/MFN warning if applicable (physical delivery orders)
        if (fulfillmentType === 'amazon_fba' || fulfillmentType === 'seller_easy_ship' || fulfillmentType === 'seller_self_ship') {
            setShowFbaWarning(true);
        } else {
            // Scroll to installation guide
            setTimeout(() => {
                installationGuideRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }, 300);
        }
    };

    const handleFbaWarningClose = () => {
        setShowFbaWarning(false);
        // Scroll to installation guide after dismissing warning
        setTimeout(() => {
            installationGuideRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 300);
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

        // Need 63 digits total for the API
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
                    identifier: secretCode.trim(),
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
                            <h2 className="text-lg font-bold text-[#0F1111]">Enter Your Secret Code or Amazon Order ID</h2>
                            <p className="text-sm text-[#565959] mt-1">
                                Enter your Secret Code OR Amazon Order ID to get your Product License Key
                            </p>
                        </div>

                        <div className="p-6">
                            {/* Secret Code Input */}
                            <div className="mb-4">
                                <label className="block text-sm font-bold text-[#0F1111] mb-2">
                                    SECRET CODE / AMAZON ORDER ID
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
                                        placeholder="e.g. 12345678990000 or 408-1234567-1234567"
                                        className="flex-1 px-4 py-3 border border-[#888C8C] rounded-r text-base font-mono text-[#0F1111] bg-white focus:outline-none focus:ring-2 focus:ring-[#FF9900] focus:border-[#FF9900] placeholder:text-[#6B7280]"
                                        maxLength={25}
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

                                {/* Subscription Product UI */}
                                {activationResult.isSubscription && activationResult.subscriptionConfig ? (
                                    <div className="p-6 space-y-6">
                                        <div className="text-center">
                                            <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4">
                                                <CheckCircle className="w-10 h-10" />
                                            </div>
                                            <h3 className="text-xl font-bold text-slate-800 mb-2">
                                                {activationResult.subscriptionConfig.productName} Active!
                                            </h3>
                                            <p className="text-slate-600 mb-6">
                                                Your subscription has been successfully processed and is ready to use.
                                            </p>

                                            <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 inline-block text-left max-w-lg w-full">
                                                <p className="font-bold text-slate-700 mb-3 border-b border-slate-200 pb-2">Activation Details:</p>
                                                <div className="space-y-2 text-sm">
                                                    <div className="flex justify-between">
                                                        <span className="text-slate-500">Status:</span>
                                                        <span className="text-emerald-600 font-bold">Active & Ready</span>
                                                    </div>
                                                    <div className="flex justify-between">
                                                        <span className="text-slate-500">License Info:</span>
                                                        <span className="text-slate-900 font-medium">{activationResult.licenseKey}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="bg-sky-50 border border-sky-100 rounded-xl p-6">
                                            <h4 className="font-bold text-sky-900 mb-4 flex items-center gap-2">
                                                <Download className="w-5 h-5" />
                                                Installation Instructions
                                            </h4>

                                            <div className="space-y-4">
                                                {activationResult.subscriptionConfig.steps.map((step: string, i: number) => (
                                                    <div key={i} className="flex gap-3">
                                                        <span className="w-6 h-6 bg-sky-200 text-sky-800 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold mt-0.5">
                                                            {i + 1}
                                                        </span>
                                                        <div
                                                            className="text-sky-800 text-sm leading-relaxed"
                                                            dangerouslySetInnerHTML={{ __html: step }}
                                                        />
                                                    </div>
                                                ))}
                                            </div>

                                            <div className="mt-6 pt-4 border-t border-sky-200">
                                                <a
                                                    href={activationResult.subscriptionConfig.downloadUrl}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="inline-flex items-center justify-center w-full sm:w-auto px-6 py-3 bg-sky-600 hover:bg-sky-700 text-white font-bold rounded-lg transition-colors gap-2"
                                                >
                                                    Go to Login Portal <ArrowDown className="w-4 h-4" />
                                                </a>
                                            </div>
                                        </div>

                                        {activationResult.subscriptionConfig.afterInstall && (
                                            <div className="bg-amber-50 border border-amber-100 rounded-lg p-4 text-sm text-amber-900">
                                                <p className="font-bold mb-2 flex items-center gap-2">
                                                    <AlertTriangle className="w-4 h-4" />
                                                    Important Next Steps:
                                                </p>
                                                <ul className="list-disc ml-5 space-y-1">
                                                    {activationResult.subscriptionConfig.afterInstall.map((step: string, i: number) => (
                                                        <li key={i}>{step}</li>
                                                    ))}
                                                </ul>
                                            </div>
                                        )}
                                    </div>
                                ) : (
                                    <div className="p-6 space-y-6">
                                        {/* Windows Upgrade Key Step - Show FIRST for upgrade path */}
                                        {activationResult.windowsInstallType === 'upgrade' && (
                                            <div className="border-2 border-[#0078D4] rounded-lg overflow-hidden">
                                                <div className="bg-[#0078D4] text-white px-4 py-2 flex items-center gap-2">
                                                    <span className="bg-white text-[#0078D4] font-bold rounded-full w-6 h-6 flex items-center justify-center text-sm">1</span>
                                                    <span className="font-bold">STEP 1: Enter Upgrade Key (Switches to Pro Edition)</span>
                                                </div>
                                                <div className="p-4 bg-[#F0F8FF]">
                                                    <div className="flex items-center gap-3 p-3 bg-white rounded border border-[#DDD]">
                                                        <code className="font-mono font-bold text-lg text-[#0F1111]">{WINDOWS_UPGRADE_KEY}</code>
                                                        <button
                                                            onClick={() => {
                                                                navigator.clipboard.writeText(WINDOWS_UPGRADE_KEY);
                                                                toast.success('Upgrade key copied!');
                                                            }}
                                                            className="p-2 hover:bg-[#0078D4]/10 rounded"
                                                        >
                                                            <Copy className="w-5 h-5 text-[#0078D4]" />
                                                        </button>
                                                    </div>
                                                    <div className="mt-3 p-3 bg-[#FFF4E5] border border-[#FF9900] rounded text-sm">
                                                        <p className="text-[#B12704] font-medium">⚠️ Important:</p>
                                                        <p className="text-[#565959] mt-1">This is an official Microsoft upgrade key. It switches your edition from Home to Pro but does NOT activate Windows. You must complete Step 2 for activation.</p>
                                                    </div>
                                                </div>
                                            </div>
                                        )}

                                        {/* Step 2 Header for Upgrade Path */}
                                        {activationResult.windowsInstallType === 'upgrade' && (
                                            <div className="flex items-center gap-2 text-[#0F1111]">
                                                <span className="bg-[#067D62] text-white font-bold rounded-full w-6 h-6 flex items-center justify-center text-sm">2</span>
                                                <span className="font-bold">STEP 2: Enter Activation Key (Activates Windows)</span>
                                            </div>
                                        )}

                                        {/* Product Card(s) - Handle multiple licenses for combos/quantities */}
                                        {activationResult.licenses && activationResult.licenses.length > 0 ? (
                                            <div className="space-y-4">
                                                {/* Order Summary Header */}
                                                {(activationResult.isCombo || (activationResult.orderQuantity && activationResult.orderQuantity > 1)) && (
                                                    <div className="bg-[#232F3E] text-white px-4 py-3 rounded-lg text-center">
                                                        {activationResult.isCombo && activationResult.orderQuantity && activationResult.orderQuantity > 1 ? (
                                                            <>
                                                                <div className="font-bold">🎁 Combo Package × {activationResult.orderQuantity}</div>
                                                                <div className="text-sm opacity-90">{activationResult.licenses.length} License Keys Total</div>
                                                            </>
                                                        ) : activationResult.isCombo ? (
                                                            <>
                                                                <div className="font-medium">🎁 Combo Package - {activationResult.licenses.length} License Keys</div>
                                                            </>
                                                        ) : activationResult.orderQuantity && activationResult.orderQuantity > 1 ? (
                                                            <>
                                                                <div className="font-bold">📦 Bulk Order - Quantity: {activationResult.orderQuantity}</div>
                                                                <div className="text-sm opacity-90">{activationResult.licenses.length} License Keys</div>
                                                            </>
                                                        ) : null}
                                                    </div>
                                                )}
                                                {activationResult.licenses.map((license, index) => (
                                                    <div key={index} className="p-4 bg-[#F7F8FA] rounded border border-[#DDD]">
                                                        <div className="flex items-start gap-4">
                                                            <div className="w-16 h-16 bg-white rounded flex items-center justify-center flex-shrink-0 border border-[#DDD]">
                                                                {license.productImage ? (
                                                                    <Image src={license.productImage} alt="Product" width={60} height={60} className="object-contain" />
                                                                ) : (
                                                                    <div className="text-2xl">{index === 0 ? '🪟' : '📝'}</div>
                                                                )}
                                                            </div>

                                                            <div className="flex-1 min-w-0">
                                                                <p className="text-sm font-bold text-[#0F1111] mb-1">
                                                                    {license.productName || `Product ${index + 1}`}
                                                                </p>
                                                                <div className="p-2 bg-[#FCF5EE] border border-[#FF9900] rounded">
                                                                    <p className="text-xs text-[#565959] mb-1">License Key {index + 1}:</p>
                                                                    <div className="flex items-center gap-2">
                                                                        <code className="font-mono text-sm font-bold text-[#0F1111] break-all">
                                                                            {license.licenseKey}
                                                                        </code>
                                                                        <button
                                                                            onClick={() => {
                                                                                navigator.clipboard.writeText(license.licenseKey);
                                                                                toast.success('License key copied!');
                                                                            }}
                                                                            className="p-1.5 hover:bg-[#FF9900]/20 rounded"
                                                                            title="Copy"
                                                                        >
                                                                            <Copy className="w-4 h-4 text-[#FF9900]" />
                                                                        </button>
                                                                    </div>
                                                                </div>
                                                                {license.downloadUrl && (
                                                                    <a
                                                                        href={license.downloadUrl}
                                                                        target="_blank"
                                                                        rel="noopener noreferrer"
                                                                        className="mt-2 inline-flex items-center gap-1 text-xs text-[#007185] hover:underline"
                                                                    >
                                                                        <Download className="w-3 h-3" /> Download
                                                                    </a>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            /* Single license fallback */
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
                                        )}

                                        {/* Multiple Keys Note */}
                                        <div className="text-center p-3 bg-[#FEF8F2] border border-[#FF9900] rounded">
                                            <p className="text-xs text-[#B12704]">
                                                <span className="font-bold">Multiple Keys?</span> Contact us on WhatsApp:{' '}
                                                <a href="https://wa.me/918595899215" target="_blank" rel="noopener noreferrer" className="font-bold underline hover:text-[#CC0C39]">
                                                    8595899215
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
                                                disabled={getcidLoading || !secretCode.trim()}
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
                                                href={`${process.env.NEXT_PUBLIC_APP_URL || ''}/warranty`}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="inline-flex items-center gap-2 px-4 py-2 bg-white text-[#CC0C39] text-sm font-bold rounded hover:bg-gray-100 transition-colors"
                                            >
                                                Register Warranty Now
                                            </a>
                                        </div>

                                        {/* Dynamic Installation Guide(s) */}
                                        <div ref={installationGuideRef} className="pt-6 border-t border-[#DDD] space-y-4">
                                            {activationResult.licenses && activationResult.licenses.length > 1 ? (
                                                /* Combo product: Show separate guide for each license */
                                                <>
                                                    {activationResult.licenses.map((license, index) => {
                                                        const guideFile = getInstallationGuide(license.fsn);
                                                        if (!guideFile) return null;

                                                        return (
                                                            <InstallationGuide
                                                                key={index}
                                                                guideFile={guideFile}
                                                                productName={license.productName || undefined}
                                                                downloadLink={license.downloadUrl || undefined}
                                                            />
                                                        );
                                                    })}
                                                </>
                                            ) : (
                                                /* Single product: Show one guide - use license FSN if available */
                                                <InstallationGuide
                                                    guideFile={getInstallationGuide(
                                                        activationResult.licenses?.[0]?.fsn ||
                                                        activationResult.productInfo?.sku
                                                    ) || 'office2021.md'}
                                                    productName={activationResult.licenses?.[0]?.productName || activationResult.productInfo?.productName || undefined}
                                                    downloadLink={activationResult.licenses?.[0]?.downloadUrl || activationResult.productInfo?.downloadUrl || undefined}
                                                />
                                            )}
                                        </div>
                                    </div>
                                )}
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
                                    Search <span className="font-bold text-[#FF9900]">"BitByte"</span> in your Amazon registered email inbox
                                </p>

                                <div className="bg-[#F7F8FA] rounded border border-[#DDD] p-3 text-sm">
                                    <p className="text-[#0F1111] mb-2">
                                        <span className="font-medium">From:</span> Amazon Seller
                                    </p>
                                    <p className="text-[#0F1111] mb-3">
                                        <span className="font-medium">Subject:</span> Your Order - Pro Retail License Key
                                    </p>

                                    <div className="p-2 bg-[#FEF8F2] border-l-4 border-[#FF9900] text-xs space-y-1">
                                        <p className="text-[#CC0C39] font-bold">Your Secret Code → XXXXXXXXXXXXXXX</p>
                                        <p className="text-[#565959] font-bold text-center">OR</p>
                                        <p className="text-[#CC0C39] font-bold">Your Amazon Order ID → 40X-XXXXXXX-XXXXXXX</p>
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

            {/* Success Popup Modal */}
            {showSuccessPopup && (
                <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg shadow-2xl max-w-md w-full overflow-hidden animate-in zoom-in-95 duration-300">
                        <div className="bg-gradient-to-r from-[#067D62] to-[#0A9A77] px-6 py-4">
                            <div className="flex items-center justify-center gap-3">
                                <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                                    <CheckCircle className="w-7 h-7 text-white" />
                                </div>
                                <div>
                                    <h2 className="text-xl font-bold text-white">Success!</h2>
                                    <p className="text-white/90 text-sm">Your License Key is Ready</p>
                                </div>
                            </div>
                        </div>

                        <div className="p-6">
                            <div className="text-center mb-6">
                                <div className="bg-[#FCF5EE] border-2 border-[#FF9900] rounded-lg p-4 mb-4">
                                    <p className="text-xs text-[#565959] mb-2">Your Product License Key:</p>
                                    <code className="font-mono text-lg font-bold text-[#0F1111] break-all">
                                        {activationResult?.licenseKey}
                                    </code>
                                </div>
                                <p className="text-[#0F1111] font-medium">
                                    🎉 Congratulations! Your license key has been generated successfully.
                                </p>
                            </div>

                            <div className="bg-[#FFF4E5] border border-[#FF9900] rounded-lg p-4 mb-6">
                                <div className="flex items-start gap-3">
                                    <AlertTriangle className="w-5 h-5 text-[#FF9900] flex-shrink-0 mt-0.5" />
                                    <div>
                                        <p className="font-bold text-[#0F1111] text-sm">Important!</p>
                                        <p className="text-sm text-[#565959] mt-1">
                                            Please follow the installation instructions below carefully to activate your product.
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <button
                                onClick={handleSuccessPopupClose}
                                className="w-full py-3 bg-gradient-to-b from-[#FFD814] to-[#F7CA00] hover:from-[#F7CA00] hover:to-[#E7B800] text-[#0F1111] font-bold rounded-lg border border-[#FCD200] shadow-sm transition-all duration-200 flex items-center justify-center gap-2"
                            >
                                <Download className="w-5 h-5" />
                                View Installation Instructions
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Windows Installation Type Selection Modal */}
            {showWindowsTypeModal && (
                <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg shadow-2xl max-w-md w-full overflow-hidden animate-in zoom-in-95 duration-300">
                        <div className="bg-[#0078D4] px-6 py-4">
                            <div className="flex items-center gap-3">
                                <div className="grid grid-cols-2 gap-0.5 w-10 h-10">
                                    <div className="bg-[#F25022]" />
                                    <div className="bg-[#7FBA00]" />
                                    <div className="bg-[#00A4EF]" />
                                    <div className="bg-[#FFB900]" />
                                </div>
                                <h2 className="text-xl font-bold text-white">Windows Installation Type</h2>
                            </div>
                        </div>

                        <div className="p-6 space-y-4">
                            <p className="text-sm text-[#565959] text-center mb-4">
                                Please select your installation scenario:
                            </p>

                            {/* Upgrade Options */}
                            <button
                                onClick={() => handleWindowsTypeSelect('upgrade')}
                                className="w-full p-4 border-2 border-[#DDD] rounded-lg hover:border-[#0078D4] hover:bg-[#F0F8FF] transition-all text-left"
                            >
                                <div className="flex items-start gap-3">
                                    <div className="w-10 h-10 bg-[#FF9900] rounded-full flex items-center justify-center flex-shrink-0">
                                        <ArrowDown className="w-5 h-5 text-white" />
                                    </div>
                                    <div>
                                        <p className="font-bold text-[#0F1111]">Upgrading from Windows 7 / 8.1</p>
                                        <p className="text-xs text-[#565959] mt-1">I have an older Windows version and want to upgrade</p>
                                    </div>
                                </div>
                            </button>

                            <button
                                onClick={() => handleWindowsTypeSelect('upgrade')}
                                className="w-full p-4 border-2 border-[#DDD] rounded-lg hover:border-[#0078D4] hover:bg-[#F0F8FF] transition-all text-left"
                            >
                                <div className="flex items-start gap-3">
                                    <div className="w-10 h-10 bg-[#0078D4] rounded-full flex items-center justify-center flex-shrink-0">
                                        <ArrowDown className="w-5 h-5 text-white" />
                                    </div>
                                    <div>
                                        <p className="font-bold text-[#0F1111]">Switching from Home to Pro Edition</p>
                                        <p className="text-xs text-[#565959] mt-1">I have Windows 10/11 Home and want to switch to Pro</p>
                                    </div>
                                </div>
                            </button>

                            {/* Fresh Install Option */}
                            <button
                                onClick={() => handleWindowsTypeSelect('fresh')}
                                className="w-full p-4 border-2 border-[#DDD] rounded-lg hover:border-[#067D62] hover:bg-[#F0FDF4] transition-all text-left"
                            >
                                <div className="flex items-start gap-3">
                                    <div className="w-10 h-10 bg-[#067D62] rounded-full flex items-center justify-center flex-shrink-0">
                                        <CheckCircle className="w-5 h-5 text-white" />
                                    </div>
                                    <div>
                                        <p className="font-bold text-[#0F1111]">Fresh Installation to Pro</p>
                                        <p className="text-xs text-[#565959] mt-1">I&apos;m doing a clean install of Windows 10/11 Pro</p>
                                    </div>
                                </div>
                            </button>

                            <button
                                onClick={() => setShowWindowsTypeModal(false)}
                                className="w-full py-2 text-sm text-[#565959] hover:text-[#0F1111] transition-colors"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* FBA/MFN Physical Instructions Warning Popup */}
            {showFbaWarning && (
                <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg shadow-2xl max-w-md w-full overflow-hidden animate-in zoom-in-95 duration-300">
                        <div className="bg-gradient-to-r from-[#CC0C39] to-[#E63757] px-6 py-4">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                                    <AlertTriangle className="w-6 h-6 text-white" />
                                </div>
                                <h2 className="text-xl font-bold text-white">Important Notice</h2>
                            </div>
                        </div>

                        <div className="p-6">
                            <div className="bg-[#FEF2F2] border-l-4 border-[#CC0C39] rounded-r-lg p-4 mb-6">
                                <p className="text-[#0F1111] font-medium leading-relaxed">
                                    <strong>Please ignore</strong> the physical instructions that may be sent with your package.
                                </p>
                                <p className="text-[#565959] mt-3 leading-relaxed">
                                    For the <strong>smooth experience</strong> and <strong>easy activation process</strong>, please follow only the installation and activation instructions given on this website.
                                </p>
                            </div>

                            <div className="flex items-start gap-3 p-3 bg-[#F0FDF4] rounded-lg border border-[#BBF7D0]">
                                <CheckCircle className="w-5 h-5 text-[#067D62] flex-shrink-0 mt-0.5" />
                                <p className="text-sm text-[#0F1111]">
                                    Our online instructions are always up-to-date and optimized for the best activation experience.
                                </p>
                            </div>

                            <button
                                onClick={handleFbaWarningClose}
                                className="w-full mt-6 py-3 bg-gradient-to-b from-[#FFD814] to-[#F7CA00] hover:from-[#F7CA00] hover:to-[#E7B800] text-[#0F1111] font-bold rounded-lg border border-[#FCD200] shadow-sm transition-all duration-200"
                            >
                                I Understand, Show Me the Instructions
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
