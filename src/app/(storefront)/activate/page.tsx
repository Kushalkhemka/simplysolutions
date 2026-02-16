'use client';

import { useState, useRef, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
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
    Video,
    Upload,
    RefreshCw,
    Loader2,
    Clock,
    XCircle,
    Shield,
    Star
} from 'lucide-react';
import { toast } from 'sonner';
import InstallationGuide from '@/components/InstallationGuide';
import { getInstallationGuide } from '@/lib/installation-guides';
import { getSubscriptionConfig } from '@/lib/amazon/subscription-products';
import { isComboProduct, getComponentFSNs } from '@/lib/amazon/combo-products';
import ReplacementKeySteps from '@/components/ReplacementKeySteps';
import { CustomerPushAutoPrompt } from '@/components/notifications/CustomerPushOptIn';

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
    hasValidEmail?: boolean;
}

function ActivatePageContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [secretCode, setSecretCode] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [showOSModal, setShowOSModal] = useState(false);
    const [activationResult, setActivationResult] = useState<ActivationResult | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [isBlocked, setIsBlocked] = useState(false);
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
    const [popupCountdown, setPopupCountdown] = useState(30);

    // Pre-fill secret code from URL query parameter
    useEffect(() => {
        const codeFromUrl = searchParams.get('code');
        if (codeFromUrl) {
            setSecretCode(codeFromUrl);
        }
    }, [searchParams]);

    // Windows installation type selection
    const [showWindowsTypeModal, setShowWindowsTypeModal] = useState(false);
    const [windowsInstallType, setWindowsInstallType] = useState<'upgrade' | 'fresh' | null>(null);
    const [pendingOrderFsn, setPendingOrderFsn] = useState<string | null>(null);

    // Windows FSNs that require installation type selection
    const WINDOWS_FSNS = ['WINDOWS11', 'OPSG3TNK9HZDZEM9'];
    const WINDOWS_UPGRADE_KEY = 'KNGH2-BVYFG-HJYTM-GB84H-YY49G';

    // License Replacement Request state
    const [showReplacementForm, setShowReplacementForm] = useState(false);
    const [replacementEmail, setReplacementEmail] = useState('');
    const [replacementScreenshot, setReplacementScreenshot] = useState<File | null>(null);
    const [replacementScreenshotPreview, setReplacementScreenshotPreview] = useState<string | null>(null);
    const [replacementLoading, setReplacementLoading] = useState(false);
    const [replacementStatus, setReplacementStatus] = useState<{
        found: boolean;
        status?: 'PENDING' | 'APPROVED' | 'REJECTED';
        adminNotes?: string;
        newLicenseKey?: string;
        submittedAt?: string;
    } | null>(null);
    const replacementInputRef = useRef<HTMLInputElement>(null);

    // Instant replacement state for getcid
    const [showGetcidReplacement, setShowGetcidReplacement] = useState(false);
    const [getcidReplacementKey, setGetcidReplacementKey] = useState<string | null>(null);
    const [getcidReplacementLoading, setGetcidReplacementLoading] = useState(false);

    // Email capture ref and state
    const captureEmailRef = useRef<HTMLInputElement>(null);
    const captureWhatsappRef = useRef<HTMLInputElement>(null);
    const [emailSaved, setEmailSaved] = useState(false);

    // Preactivated product countdown state
    const [showPreactivatedCountdown, setShowPreactivatedCountdown] = useState(false);
    const [countdownSeconds, setCountdownSeconds] = useState(5);
    const [preactivatedFsn, setPreactivatedFsn] = useState<string | null>(null);

    // Early delivery appeal state
    const [canAppeal, setCanAppeal] = useState(false);
    const [showAppealModal, setShowAppealModal] = useState(false);
    const [appealScreenshot, setAppealScreenshot] = useState<File | null>(null);
    const [appealScreenshotPreview, setAppealScreenshotPreview] = useState<string | null>(null);
    const [appealLoading, setAppealLoading] = useState(false);
    const [appealEmail, setAppealEmail] = useState('');
    const [appealWhatsApp, setAppealWhatsApp] = useState('');

    // Contact info modal state (for when keys are not available)
    const [showContactModal, setShowContactModal] = useState(false);
    const [contactEmail, setContactEmail] = useState('');
    const [contactPhone, setContactPhone] = useState('');
    const [contactSubmitting, setContactSubmitting] = useState(false);
    const [pendingFsn, setPendingFsn] = useState<string | null>(null);

    // Check for existing replacement request when order is verified
    const checkReplacementStatus = async (orderId: string) => {
        try {
            const res = await fetch(`/api/replacement-request?orderId=${encodeURIComponent(orderId)}`);
            const data = await res.json();
            if (data.found) {
                setReplacementStatus(data);
            } else {
                setReplacementStatus(null);
            }
        } catch (error) {
            console.error('Error checking replacement status:', error);
        }
    };

    // Handle replacement screenshot change
    const handleReplacementScreenshotChange = (file: File | null) => {
        if (file) {
            setReplacementScreenshot(file);
            setReplacementScreenshotPreview(URL.createObjectURL(file));
        } else {
            setReplacementScreenshot(null);
            setReplacementScreenshotPreview(null);
        }
    };

    // Submit replacement request
    const handleSubmitReplacementRequest = async () => {
        if (!replacementEmail.trim()) {
            toast.error('Please enter your email address');
            return;
        }
        if (!replacementScreenshot) {
            toast.error('Please upload a screenshot showing the issue');
            return;
        }

        setReplacementLoading(true);
        try {
            const formData = new FormData();
            formData.append('orderId', secretCode.trim());
            formData.append('customerEmail', replacementEmail.trim());
            formData.append('screenshot', replacementScreenshot);

            const res = await fetch('/api/replacement-request', {
                method: 'POST',
                body: formData
            });

            const data = await res.json();
            if (data.success) {
                toast.success('Replacement request submitted successfully!');
                setShowReplacementForm(false);
                // Refresh status
                await checkReplacementStatus(secretCode.trim());
            } else {
                toast.error(data.error || 'Failed to submit replacement request');
            }
        } catch (error) {
            toast.error('Failed to submit replacement request');
        } finally {
            setReplacementLoading(false);
        }
    };


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
                setCanAppeal(data.canAppeal === true);
                setIsBlocked(data.isBlocked === true);
                setIsLoading(false);
                return;
            }
            setCanAppeal(false); // Reset on success
            setIsBlocked(false); // Reset on success

            // Check if this is a subscription product that needs to be redirected to its specific page
            if (data.fsn) {
                const fsnUpper = data.fsn.toUpperCase();

                // Redirect CANVA products to /canva page
                if (fsnUpper.startsWith('CANVA')) {
                    toast.info('Redirecting to Canva activation page...');
                    router.push(`/canva?orderId=${encodeURIComponent(secretCode.trim())}`);
                    return;
                }

                // Redirect AUTOCAD / AUTODESK products to /autocad page
                if (fsnUpper.startsWith('AUTOCAD') || fsnUpper.startsWith('AUTODESK')) {
                    toast.info('Redirecting to AutoCAD activation page...');
                    router.push(`/autocad?orderId=${encodeURIComponent(secretCode.trim())}`);
                    return;
                }

                // Redirect 365E5 products to /365enterprise page
                if (fsnUpper.startsWith('365E5') || fsnUpper.startsWith('365E')) {
                    toast.info('Redirecting to Microsoft 365 Enterprise activation page...');
                    router.push(`/365enterprise?orderId=${encodeURIComponent(secretCode.trim())}`);
                    return;
                }

                // Handle OFFICE2024-MAC - preactivated product, show countdown and redirect to guide
                if (fsnUpper === 'OFFICE2024-MAC') {
                    setPreactivatedFsn(fsnUpper);
                    setShowPreactivatedCountdown(true);
                    setIsLoading(false);

                    // Start countdown (10 seconds)
                    let seconds = 10;
                    setCountdownSeconds(seconds);
                    const countdownInterval = setInterval(() => {
                        seconds--;
                        setCountdownSeconds(seconds);
                        if (seconds <= 0) {
                            clearInterval(countdownInterval);
                            router.push('/installation-docs/office2024mac');
                        }
                    }, 1000);
                    return;
                }
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
                // Check if we need to ask for contact info (no keys available)
                if (data.needsContactInfo) {
                    setPendingFsn(data.fsn || null);
                    setShowContactModal(true);
                    setIsLoading(false);
                    return;
                }
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
                // Reset emailSaved when activating a new order
                setEmailSaved(false);
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
                    hasValidEmail: data.hasValidEmail,
                });
            } else {
                // Fallback for old format
                // Reset emailSaved when activating a new order
                setEmailSaved(false);
                setActivationResult({
                    success: true,
                    licenseKey: data.licenseKey,
                    productInfo: data.productInfo || {},
                    alreadyRedeemed: data.alreadyRedeemed,
                    windowsInstallType: installType || null,
                    hasValidEmail: data.hasValidEmail,
                });
            }

            // Show success popup with countdown
            setShowSuccessPopup(true);
            setPopupCountdown(30);

            // Start countdown timer
            const countdownInterval = setInterval(() => {
                setPopupCountdown(prev => {
                    if (prev <= 1) {
                        clearInterval(countdownInterval);
                        setShowSuccessPopup(false);
                        // Scroll to installation guide
                        setTimeout(() => {
                            installationGuideRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                        }, 300);
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);

            // Check for any existing replacement requests
            await checkReplacementStatus(secretCode.trim());

        } catch (err) {
            console.error('Error generating key:', err);
            setError('Failed to generate license key. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleSuccessPopupClose = () => {
        setShowSuccessPopup(false);
        // Scroll to installation guide
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
                // Check if it's a blocked/exceeded IID error
                const isBlockedOrExceeded =
                    data.error?.includes('Blocked IID') ||
                    data.error?.includes('Exceeded IID') ||
                    data.error?.includes('blocked') && data.error?.includes('Installation ID');

                setGetcidError(data.error || 'Failed to generate Confirmation ID');
                setShowGetcidReplacement(isBlockedOrExceeded);
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

    const handleGetcidInstantReplacement = async () => {
        const fullInstallationId = installationIds.join('');

        setGetcidReplacementLoading(true);
        try {
            const response = await fetch('/api/getcid/instant-replacement', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    orderId: secretCode.trim(),
                    installationId: fullInstallationId
                })
            });

            const data = await response.json();
            if (data.success) {
                setGetcidReplacementKey(data.replacementKey);
                setShowGetcidReplacement(false);
                setGetcidError(null);
                toast.success('Replacement key generated successfully!');
            } else {
                toast.error(data.error || 'Failed to generate replacement key');
            }
        } catch (error) {
            console.error('Replacement key error:', error);
            toast.error('Network error. Please try again.');
        } finally {
            setGetcidReplacementLoading(false);
        }
    };

    // Handle early delivery appeal submission
    const handleAppealScreenshotChange = (file: File | null) => {
        if (file) {
            setAppealScreenshot(file);
            setAppealScreenshotPreview(URL.createObjectURL(file));
        } else {
            setAppealScreenshot(null);
            setAppealScreenshotPreview(null);
        }
    };

    const handleSubmitAppeal = async () => {
        if (!appealScreenshot) {
            toast.error('Please upload a screenshot as proof of delivery');
            return;
        }
        if (!appealEmail.trim()) {
            toast.error('Please enter your email address');
            return;
        }
        if (!appealWhatsApp.trim()) {
            toast.error('Please enter your WhatsApp number');
            return;
        }

        setAppealLoading(true);
        try {
            const formData = new FormData();
            formData.append('orderId', secretCode.trim());
            formData.append('screenshot', appealScreenshot);
            formData.append('email', appealEmail.trim());
            formData.append('whatsapp', appealWhatsApp.trim());

            const res = await fetch('/api/early-appeal', {
                method: 'POST',
                body: formData
            });

            const data = await res.json();
            if (data.success) {
                toast.success('Appeal submitted successfully! We will review and notify you within 24 hours.');
                setShowAppealModal(false);
                setAppealScreenshot(null);
                setAppealScreenshotPreview(null);
                setError('Your early delivery appeal is being reviewed by our team. We will notify you once it is processed.');
                setCanAppeal(false);
            } else {
                toast.error(data.error || 'Failed to submit appeal');
            }
        } catch (error) {
            console.error('Appeal submission error:', error);
            toast.error('Network error. Please try again.');
        } finally {
            setAppealLoading(false);
        }
    };

    // Handle contact info submission when keys are not available
    const handleContactSubmit = async () => {
        if (!contactEmail.trim() && !contactPhone.trim()) {
            toast.error('Please provide either email or phone number');
            return;
        }

        setContactSubmitting(true);

        try {
            const response = await fetch('/api/activation-issues', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    order_id: secretCode.trim(),
                    customer_email: contactEmail.trim() || null,
                    customer_phone: contactPhone.trim() || null,
                    issue_type: 'no_keys_available'
                }),
            });

            const data = await response.json();

            if (response.ok && data.success) {
                toast.success('Your request has been submitted! We will contact you soon.');
                setShowContactModal(false);
                setContactEmail('');
                setContactPhone('');
                setError('We have received your request. Our support team will contact you shortly with your license key.');
            } else {
                toast.error(data.error || 'Failed to submit. Please try again.');
            }
        } catch (err) {
            console.error('Error submitting contact info:', err);
            toast.error('Network error. Please try again.');
        } finally {
            setContactSubmitting(false);
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

            {/* Preactivated Product Countdown Overlay */}
            {showPreactivatedCountdown && (
                <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden">
                        {/* Header */}
                        <div className="bg-gradient-to-r from-[#0078D4] to-[#00BCF2] text-white px-6 py-4">
                            <div className="flex items-center gap-3">
                                <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                                    <CheckCircle className="w-7 h-7" />
                                </div>
                                <div>
                                    <h2 className="text-xl font-bold">Product Verified!</h2>
                                    <p className="text-sm opacity-90">Microsoft Office 2024 for Mac</p>
                                </div>
                            </div>
                        </div>

                        {/* Content */}
                        <div className="p-6 text-center">
                            <div className="mb-6">
                                <div className="w-20 h-20 mx-auto bg-[#E7F4E4] rounded-full flex items-center justify-center mb-4">
                                    <CheckCircle className="w-10 h-10 text-[#067D62]" />
                                </div>
                                <h3 className="text-2xl font-bold text-[#0F1111] mb-2">
                                    PREACTIVATED Product
                                </h3>
                                <p className="text-[#565959]">
                                    No license key required! This product comes preactivated.
                                </p>
                            </div>

                            {/* Countdown */}
                            <div className="bg-[#FCF5EE] border-2 border-[#FF9900] rounded-xl p-6 mb-6">
                                <p className="text-sm text-[#565959] mb-2">Follow the Installation Guide</p>
                                <p className="text-lg font-bold text-[#0F1111] mb-4">
                                    Redirecting in...
                                </p>
                                <div className="text-6xl font-bold text-[#FF9900] mb-2">
                                    {countdownSeconds}
                                </div>
                                <p className="text-sm text-[#565959]">seconds</p>
                            </div>

                            {/* Skip Button */}
                            <button
                                onClick={() => router.push('/installation-docs/office2024mac')}
                                className="w-full py-3 bg-gradient-to-b from-[#FFD814] to-[#F7CA00] hover:from-[#F7CA00] hover:to-[#E7B800] text-[#0F1111] font-bold rounded-lg border border-[#FCD200] shadow-sm transition-all"
                            >
                                Go to Installation Guide Now →
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Early Delivery Appeal Modal */}
            {showAppealModal && (
                <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden">
                        {/* Header */}
                        <div className="bg-gradient-to-r from-[#0078D4] to-[#00BCF2] text-white px-6 py-4">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                                        <Upload className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <h2 className="text-lg font-bold">Proof of Delivery</h2>
                                        <p className="text-sm opacity-90">Submit to activate early</p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => {
                                        setShowAppealModal(false);
                                        setAppealScreenshot(null);
                                        setAppealScreenshotPreview(null);
                                    }}
                                    className="hover:bg-white/20 p-1 rounded"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>
                        </div>

                        {/* Content */}
                        <div className="p-6 space-y-4">
                            <p className="text-sm text-[#565959]">
                                Upload a screenshot showing proof that your order has been delivered.
                                This can be a screenshot from Amazon showing delivery status,
                                a photo of the package, or tracking information.
                            </p>

                            {/* Screenshot Upload */}
                            <div className="border-2 border-dashed border-[#DDD] rounded-lg p-4">
                                {appealScreenshotPreview ? (
                                    <div className="space-y-3">
                                        <img
                                            src={appealScreenshotPreview}
                                            alt="Proof of delivery"
                                            className="max-h-48 mx-auto rounded-lg"
                                        />
                                        <button
                                            onClick={() => handleAppealScreenshotChange(null)}
                                            className="text-sm text-red-600 hover:text-red-800"
                                        >
                                            Remove & Upload Different Image
                                        </button>
                                    </div>
                                ) : (
                                    <label className="flex flex-col items-center justify-center cursor-pointer py-4">
                                        <Upload className="w-10 h-10 text-[#888] mb-2" />
                                        <span className="text-sm font-medium text-[#0F1111]">
                                            Click to upload screenshot
                                        </span>
                                        <span className="text-xs text-[#565959] mt-1">
                                            PNG, JPG up to 5MB
                                        </span>
                                        <input
                                            type="file"
                                            accept="image/*"
                                            className="hidden"
                                            onChange={(e) => {
                                                const file = e.target.files?.[0];
                                                if (file) handleAppealScreenshotChange(file);
                                            }}
                                        />
                                    </label>
                                )}
                            </div>

                            {/* Contact Info */}
                            <div className="space-y-3">
                                <div>
                                    <label className="block text-sm font-medium text-[#0F1111] mb-1">
                                        Email Address <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="email"
                                        value={appealEmail}
                                        onChange={(e) => setAppealEmail(e.target.value)}
                                        placeholder="your.email@example.com"
                                        className="w-full px-3 py-2 border border-[#DDD] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0078D4] focus:border-transparent bg-white text-[#0F1111]"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-[#0F1111] mb-1">
                                        WhatsApp Number <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="tel"
                                        value={appealWhatsApp}
                                        onChange={(e) => setAppealWhatsApp(e.target.value)}
                                        placeholder="+91 98765 43210"
                                        className="w-full px-3 py-2 border border-[#DDD] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0078D4] focus:border-transparent bg-white text-[#0F1111]"
                                    />
                                </div>
                            </div>

                            {/* Submit Button */}
                            <button
                                onClick={handleSubmitAppeal}
                                disabled={!appealScreenshot || !appealEmail.trim() || !appealWhatsApp.trim() || appealLoading}
                                className="w-full py-3 bg-gradient-to-b from-[#FFD814] to-[#F7CA00] hover:from-[#F7CA00] hover:to-[#E7B800] text-[#0F1111] font-bold rounded-lg border border-[#FCD200] shadow-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                            >
                                {appealLoading ? (
                                    <>
                                        <Loader2 className="w-5 h-5 animate-spin" />
                                        Submitting...
                                    </>
                                ) : (
                                    'Submit Appeal'
                                )}
                            </button>

                            <p className="text-xs text-[#565959] text-center">
                                Our team will review your submission within 24 hours.
                            </p>
                        </div>
                    </div>
                </div>
            )}

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
                                <div className="mb-6">
                                    <div className="p-4 bg-[#FCF4F4] border border-[#CC0C39] rounded-lg">
                                        <div className="flex items-start gap-3">
                                            <AlertTriangle className="w-5 h-5 text-[#CC0C39] flex-shrink-0 mt-0.5" />
                                            <div className="flex-1">
                                                <span className="text-[#CC0C39] text-sm whitespace-pre-line">{error}</span>

                                                {/* Blocked Order - Show Feedback Removal and Appeal Form buttons */}
                                                {isBlocked && (
                                                    <div className="mt-4 space-y-2">
                                                        <a
                                                            href="https://www.amazon.in/hz/feedback"
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="w-full py-2 px-4 bg-[#FF9900] hover:bg-[#E47911] text-white text-sm font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
                                                        >
                                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                                            </svg>
                                                            Remove Feedback on Amazon
                                                        </a>
                                                        <a
                                                            href={`/feedback-appeal/${secretCode.trim()}`}
                                                            className="w-full py-2 px-4 bg-[#0078D4] hover:bg-[#106EBE] text-white text-sm font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
                                                        >
                                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                                            </svg>
                                                            Fill Appeal Form After Removal
                                                        </a>
                                                    </div>
                                                )}

                                                {canAppeal && (
                                                    <button
                                                        onClick={() => setShowAppealModal(true)}
                                                        className="mt-3 w-full py-2 px-4 bg-[#0078D4] hover:bg-[#106EBE] text-white text-sm font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
                                                    >
                                                        <Upload className="w-4 h-4" />
                                                        Submit Proof of Delivery
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    </div>
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

                                        {/* OFFICE365 Password Change Warning */}
                                        {(activationResult.licenses?.some(l => l.fsn?.toUpperCase().startsWith('OFFICE365')) ||
                                            activationResult.productInfo?.sku?.toUpperCase().startsWith('OFFICE365')) && (
                                                <div className="bg-gradient-to-b from-[#FEF2F2] to-[#FFF7ED] border-2 border-[#DC2626] rounded-xl overflow-hidden shadow-lg">
                                                    {/* Warning Header */}
                                                    <div className="bg-[#DC2626] text-white px-4 py-3 flex items-center gap-3">
                                                        <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center flex-shrink-0">
                                                            <AlertTriangle className="w-6 h-6" />
                                                        </div>
                                                        <div>
                                                            <h3 className="font-bold text-base">MANDATORY: Read Before You Login</h3>
                                                            <p className="text-xs opacity-90">Important instructions for your Microsoft 365 account</p>
                                                        </div>
                                                    </div>

                                                    <div className="p-4 space-y-4">
                                                        {/* Step 1: Password Change */}
                                                        <div className="flex gap-3">
                                                            <span className="bg-[#DC2626] text-white font-bold rounded-full w-7 h-7 flex items-center justify-center text-sm flex-shrink-0 mt-0.5">1</span>
                                                            <div>
                                                                <p className="font-bold text-[#0F1111] text-sm">Change Your Password on First Login</p>
                                                                <p className="text-xs text-[#565959] mt-1">
                                                                    When you log in for the first time, you will be prompted to change your password.
                                                                    <span className="font-bold text-[#DC2626]"> Carefully note down your new password.</span> Do NOT mistype it.
                                                                </p>
                                                            </div>
                                                        </div>

                                                        {/* Step 2: Recovery Setup */}
                                                        <div className="flex gap-3">
                                                            <span className="bg-[#DC2626] text-white font-bold rounded-full w-7 h-7 flex items-center justify-center text-sm flex-shrink-0 mt-0.5">2</span>
                                                            <div>
                                                                <p className="font-bold text-[#0F1111] text-sm">Setup Password Recovery (IMPORTANT)</p>
                                                                <p className="text-xs text-[#565959] mt-1">
                                                                    Immediately after changing your password, go to:{' '}
                                                                </p>
                                                                <a
                                                                    href="https://mysignins.microsoft.com/security-info"
                                                                    target="_blank"
                                                                    rel="noopener noreferrer"
                                                                    className="inline-block mt-1.5 px-3 py-1.5 bg-[#0078D4] text-white text-xs font-bold rounded hover:bg-[#106EBE] transition-colors"
                                                                >
                                                                    🔗 mysignins.microsoft.com/security-info
                                                                </a>
                                                                <p className="text-xs text-[#565959] mt-1.5">
                                                                    Add your <span className="font-bold">personal phone number</span>, <span className="font-bold">alternate number</span> and <span className="font-bold">authenticator</span> as recovery methods.
                                                                    This ensures you can always reset your password if forgotten.
                                                                </p>
                                                            </div>
                                                        </div>

                                                        {/* No Replacement Policy */}
                                                        <div className="bg-[#FEE2E2] border border-[#FECACA] rounded-lg p-3">
                                                            <p className="text-sm font-bold text-[#991B1B] flex items-center gap-2">
                                                                <XCircle className="w-4 h-4 flex-shrink-0" />
                                                                No Replacement Policy
                                                            </p>
                                                            <p className="text-xs text-[#991B1B] mt-1 ml-6">
                                                                <strong>No replacement or support</strong> will be provided if you mistype or forget the password you changed to.
                                                                These accounts have been <strong>already verified</strong> with the password given to you.
                                                                It is your responsibility to note down and secure your new password.
                                                            </p>
                                                        </div>
                                                    </div>
                                                </div>
                                            )}

                                        {/* Multiple Keys Note */}
                                        <div className="text-center p-3 bg-[#FEF8F2] border border-[#FF9900] rounded">
                                            <p className="text-xs text-[#B12704]">
                                                <span className="font-bold">Multiple Keys?</span> Contact us on WhatsApp:{' '}
                                                <a href="https://wa.me/918178848830" target="_blank" rel="noopener noreferrer" className="font-bold underline hover:text-[#CC0C39]">
                                                    8178848830
                                                </a>
                                                {' '}(message only)
                                            </p>
                                        </div>

                                        {/* License Replacement Request Section */}
                                        <div className="pt-4 border-t border-[#DDD]">
                                            {/* Replacement Status Display */}
                                            {replacementStatus?.found && (
                                                <div className={`mb-4 p-4 rounded-lg ${replacementStatus.status === 'APPROVED'
                                                    ? 'bg-[#F0FDF4] border border-[#BBF7D0]'
                                                    : replacementStatus.status === 'REJECTED'
                                                        ? 'bg-[#FEF2F2] border border-[#FECACA]'
                                                        : 'bg-[#FFFBEB] border border-[#FCD34D]'
                                                    }`}>
                                                    <div className="flex items-start gap-3">
                                                        {replacementStatus.status === 'APPROVED' ? (
                                                            <CheckCircle className="w-5 h-5 text-[#067D62] flex-shrink-0 mt-0.5" />
                                                        ) : replacementStatus.status === 'REJECTED' ? (
                                                            <XCircle className="w-5 h-5 text-[#CC0C39] flex-shrink-0 mt-0.5" />
                                                        ) : (
                                                            <Clock className="w-5 h-5 text-[#D97706] flex-shrink-0 mt-0.5" />
                                                        )}
                                                        <div className="flex-1">
                                                            <p className={`font-bold text-sm ${replacementStatus.status === 'APPROVED'
                                                                ? 'text-[#067D62]'
                                                                : replacementStatus.status === 'REJECTED'
                                                                    ? 'text-[#CC0C39]'
                                                                    : 'text-[#D97706]'
                                                                }`}>
                                                                {replacementStatus.status === 'APPROVED'
                                                                    ? '✓ Replacement Approved!'
                                                                    : replacementStatus.status === 'REJECTED'
                                                                        ? '✗ Replacement Request Rejected'
                                                                        : '⏳ Replacement Request Pending'}
                                                            </p>

                                                            {replacementStatus.status === 'APPROVED' && replacementStatus.newLicenseKey && (
                                                                <div className="mt-2 p-2 bg-white rounded border border-[#BBF7D0]">
                                                                    <p className="text-xs text-[#565959] mb-1">Your New License Key:</p>
                                                                    <div className="flex items-center gap-2">
                                                                        <code className="font-mono font-bold text-[#0F1111]">{replacementStatus.newLicenseKey}</code>
                                                                        <button
                                                                            onClick={() => {
                                                                                navigator.clipboard.writeText(replacementStatus.newLicenseKey!);
                                                                                toast.success('New license key copied!');
                                                                            }}
                                                                            className="p-1 hover:bg-[#067D62]/10 rounded"
                                                                        >
                                                                            <Copy className="w-4 h-4 text-[#067D62]" />
                                                                        </button>
                                                                    </div>
                                                                </div>
                                                            )}

                                                            {replacementStatus.status === 'REJECTED' && replacementStatus.adminNotes && (
                                                                <p className="mt-2 text-sm text-[#565959]">
                                                                    <span className="font-medium">Reason:</span> {replacementStatus.adminNotes}
                                                                </p>
                                                            )}

                                                            {replacementStatus.status === 'PENDING' && (
                                                                <p className="mt-1 text-xs text-[#565959]">
                                                                    Your request is under investigation. This usually takes 12-24 hours.
                                                                </p>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            )}

                                            {/* Replacement Request Button/Form */}
                                            {(!replacementStatus?.found || replacementStatus.status === 'REJECTED') && (
                                                <>
                                                    {!showReplacementForm ? (
                                                        <>
                                                            <button
                                                                onClick={() => setShowReplacementForm(true)}
                                                                className="w-full py-2 text-sm text-[#007185] hover:text-[#C7511F] hover:underline transition-colors flex items-center justify-center gap-2"
                                                            >
                                                                <RefreshCw className="w-4 h-4" />
                                                                Received a faulty license key? Request Replacement
                                                            </button>

                                                            {/* Contact Capture for Updates - hide if already saved */}
                                                            {!emailSaved && !activationResult.hasValidEmail && (
                                                                <div className="mt-3 p-4 bg-[#F0F9FF] border border-[#BAE6FD] rounded-lg">
                                                                    <p className="text-sm font-medium text-[#0369A1] mb-3">
                                                                        Enter your contact details for future communication*
                                                                    </p>
                                                                    <div className="space-y-3">
                                                                        <div>
                                                                            <label className="block text-xs text-[#0369A1]/70 mb-1">Email Address</label>
                                                                            <input
                                                                                type="email"
                                                                                ref={captureEmailRef}
                                                                                placeholder="your.email@example.com"
                                                                                className="w-full px-3 py-2 border border-[#888C8C] rounded text-sm bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#0369A1]"
                                                                            />
                                                                        </div>
                                                                        <div>
                                                                            <label className="block text-xs text-[#0369A1]/70 mb-1">WhatsApp Number (optional)</label>
                                                                            <div className="flex">
                                                                                <span className="inline-flex items-center px-3 py-2 text-sm text-gray-600 bg-gray-100 border border-r-0 border-[#888C8C] rounded-l">
                                                                                    +91
                                                                                </span>
                                                                                <input
                                                                                    type="tel"
                                                                                    ref={captureWhatsappRef}
                                                                                    placeholder="9876543210"
                                                                                    maxLength={10}
                                                                                    className="flex-1 px-3 py-2 border border-[#888C8C] rounded-r text-sm bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#0369A1]"
                                                                                />
                                                                            </div>
                                                                        </div>
                                                                        <button
                                                                            type="button"
                                                                            onClick={async () => {
                                                                                const email = captureEmailRef.current?.value?.trim() || '';
                                                                                const whatsapp = captureWhatsappRef.current?.value?.trim() || '';
                                                                                if (email && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
                                                                                    // Validate WhatsApp if provided
                                                                                    if (whatsapp && !/^\d{10}$/.test(whatsapp)) {
                                                                                        toast.error('Please enter a valid 10-digit WhatsApp number');
                                                                                        return;
                                                                                    }
                                                                                    try {
                                                                                        await fetch('/api/activate/save-email', {
                                                                                            method: 'POST',
                                                                                            headers: { 'Content-Type': 'application/json' },
                                                                                            body: JSON.stringify({
                                                                                                orderId: secretCode.trim(),
                                                                                                email,
                                                                                                whatsapp: whatsapp ? `+91${whatsapp}` : undefined
                                                                                            }),
                                                                                        });
                                                                                        toast.success('Contact details saved!');
                                                                                        setEmailSaved(true);
                                                                                        if (captureEmailRef.current) captureEmailRef.current.value = '';
                                                                                        if (captureWhatsappRef.current) captureWhatsappRef.current.value = '';
                                                                                    } catch (err) {
                                                                                        console.error('Error saving contact:', err);
                                                                                        toast.error('Failed to save contact details');
                                                                                    }
                                                                                } else {
                                                                                    toast.error('Please enter a valid email address');
                                                                                }
                                                                            }}
                                                                            className="w-full px-4 py-2.5 bg-[#0369A1] hover:bg-[#0284C7] text-white font-medium rounded text-sm transition-colors"
                                                                        >
                                                                            Save Contact Details
                                                                        </button>
                                                                    </div>
                                                                </div>
                                                            )}
                                                        </>
                                                    ) : (
                                                        <div className="bg-[#FFFBEB] border border-[#FCD34D] rounded-lg p-4">
                                                            <div className="flex items-center justify-between mb-3">
                                                                <h4 className="font-bold text-[#0F1111] text-sm flex items-center gap-2">
                                                                    <RefreshCw className="w-4 h-4 text-[#D97706]" />
                                                                    Request License Key Replacement
                                                                </h4>
                                                                <button
                                                                    onClick={() => setShowReplacementForm(false)}
                                                                    className="p-1 hover:bg-[#D97706]/10 rounded"
                                                                >
                                                                    <X className="w-4 h-4 text-[#565959]" />
                                                                </button>
                                                            </div>

                                                            {/* Warning Message */}
                                                            <div className="bg-[#FEF2F2] border-l-4 border-[#CC0C39] p-3 mb-4 rounded-r">
                                                                <div className="flex items-start gap-2">
                                                                    <AlertTriangle className="w-4 h-4 text-[#CC0C39] flex-shrink-0 mt-0.5" />
                                                                    <div>
                                                                        <p className="text-xs text-[#CC0C39] font-bold mb-1">⚠️ WARNING</p>
                                                                        <p className="text-xs text-[#565959]">
                                                                            Some activations require <strong>telephonic activation</strong>. Make sure you have gone through the installation instructions once again before submitting this request.
                                                                        </p>
                                                                        <p className="text-xs text-[#CC0C39] font-medium mt-1">
                                                                            Unnecessary replacement requests or fraudulent requests will be rejected and may lead to existing license being revoked.
                                                                        </p>
                                                                    </div>
                                                                </div>
                                                            </div>

                                                            {/* Form Fields */}
                                                            <div className="space-y-3">
                                                                <div>
                                                                    <label className="block text-xs font-medium text-[#0F1111] mb-1">
                                                                        Your Email Address *
                                                                    </label>
                                                                    <input
                                                                        type="email"
                                                                        value={replacementEmail}
                                                                        onChange={(e) => setReplacementEmail(e.target.value)}
                                                                        placeholder="email@example.com"
                                                                        className="w-full px-3 py-2 border border-[#888C8C] rounded text-sm focus:outline-none focus:ring-2 focus:ring-[#FF9900] focus:border-[#FF9900]"
                                                                    />
                                                                    <p className="text-xs text-[#565959] mt-1">We will notify you once your request is processed</p>
                                                                </div>

                                                                <div>
                                                                    <label className="block text-xs font-medium text-[#0F1111] mb-1">
                                                                        Screenshot of the Issue *
                                                                    </label>
                                                                    {replacementScreenshotPreview ? (
                                                                        <div className="relative border border-[#067D62] rounded-lg overflow-hidden">
                                                                            <img
                                                                                src={replacementScreenshotPreview}
                                                                                alt="Screenshot preview"
                                                                                className="w-full h-32 object-cover"
                                                                            />
                                                                            <button
                                                                                onClick={() => {
                                                                                    handleReplacementScreenshotChange(null);
                                                                                    if (replacementInputRef.current) replacementInputRef.current.value = '';
                                                                                }}
                                                                                className="absolute top-2 right-2 bg-[#CC0C39] text-white p-1 rounded-full hover:bg-[#A00F28]"
                                                                            >
                                                                                <X className="w-3 h-3" />
                                                                            </button>
                                                                            <div className="absolute bottom-2 left-2 bg-[#067D62] text-white px-2 py-0.5 rounded text-xs font-medium flex items-center gap-1">
                                                                                <CheckCircle className="w-3 h-3" />
                                                                                Uploaded
                                                                            </div>
                                                                        </div>
                                                                    ) : (
                                                                        <label className="flex flex-col items-center justify-center h-24 border-2 border-dashed border-[#888C8C] rounded-lg cursor-pointer hover:border-[#FF9900] hover:bg-[#FEF8F2] transition-all">
                                                                            <Upload className="w-6 h-6 text-[#888C8C]" />
                                                                            <span className="text-xs text-[#565959] mt-1">Click to upload screenshot</span>
                                                                            <input
                                                                                ref={replacementInputRef}
                                                                                type="file"
                                                                                accept="image/*"
                                                                                onChange={(e) => handleReplacementScreenshotChange(e.target.files?.[0] || null)}
                                                                                className="hidden"
                                                                            />
                                                                        </label>
                                                                    )}
                                                                </div>

                                                                <button
                                                                    onClick={handleSubmitReplacementRequest}
                                                                    disabled={replacementLoading || !replacementEmail.trim() || !replacementScreenshot}
                                                                    className="w-full py-2 bg-gradient-to-b from-[#FF9900] to-[#E47911] hover:from-[#FA8900] hover:to-[#D07910] text-white font-bold rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                                                >
                                                                    {replacementLoading ? (
                                                                        <>
                                                                            <Loader2 className="w-4 h-4 animate-spin" />
                                                                            Submitting...
                                                                        </>
                                                                    ) : (
                                                                        <>
                                                                            <RefreshCw className="w-4 h-4" />
                                                                            Submit Replacement Request
                                                                        </>
                                                                    )}
                                                                </button>

                                                                <p className="text-xs text-[#565959] text-center">
                                                                    It takes 12-24 hours for investigation. For urgent queries, contact us on WhatsApp:{' '}
                                                                    <a href="https://wa.me/918178848830" target="_blank" rel="noopener noreferrer" className="text-[#007185] hover:underline font-medium">
                                                                        8178848830
                                                                    </a>
                                                                </p>
                                                            </div>
                                                        </div>
                                                    )}
                                                </>
                                            )}
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

                                        {/* Warranty Registration CTA - Highlighted */}
                                        <a
                                            href="/digital-warranty"
                                            className="block group overflow-hidden rounded-lg shadow-lg border-2 border-[#067D62] bg-gradient-to-r from-[#F0FDF4] via-[#ECFDF5] to-[#F0FDF4] hover:from-[#067D62]/10 hover:via-[#067D62]/15 hover:to-[#067D62]/10 transition-all duration-500 transform hover:scale-[1.02]"
                                        >
                                            <div className="relative p-4">
                                                {/* Decorative stars */}
                                                <div className="absolute top-2 right-3 flex gap-1">
                                                    {[1, 2, 3, 4, 5].map((star) => (
                                                        <Star key={star} className="w-4 h-4 text-[#FFD700] fill-[#FFD700]" />
                                                    ))}
                                                </div>

                                                <div className="flex items-center gap-4">
                                                    <div className="relative flex-shrink-0">
                                                        <div className="w-14 h-14 bg-gradient-to-br from-[#067D62] to-[#0A9A77] rounded-full flex items-center justify-center shadow-lg group-hover:shadow-xl transition-shadow">
                                                            <Shield className="w-7 h-7 text-white" />
                                                        </div>
                                                    </div>

                                                    <div className="flex-1">
                                                        <div className="flex items-center gap-2">
                                                            <h4 className="font-bold text-[#0F1111] text-base">Register Your Lifetime Warranty</h4>
                                                            <span className="px-2 py-0.5 bg-[#067D62] text-white text-[10px] font-bold uppercase rounded-full">Important</span>
                                                        </div>
                                                        <p className="text-sm text-[#565959] mt-0.5">
                                                            Get <span className="font-bold text-[#067D62]">lifetime tech support, installation help & key replacements</span>
                                                        </p>
                                                        <p className="text-xs text-[#565959] mt-1">✓ Your warranty status is checked on all future communications</p>
                                                    </div>

                                                    <div className="flex-shrink-0">
                                                        <div className="px-4 py-2 bg-gradient-to-r from-[#067D62] to-[#0A9A77] text-white font-bold rounded-lg text-sm shadow group-hover:shadow-lg transition-all">
                                                            Register Now →
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </a>

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
                                                <div className="mb-4 space-y-3">
                                                    <div className="p-3 bg-[#FCF4F4] border border-[#CC0C39] rounded flex items-center gap-2">
                                                        <AlertTriangle className="w-4 h-4 text-[#CC0C39] flex-shrink-0" />
                                                        <span className="text-[#CC0C39] text-sm">{getcidError}</span>
                                                    </div>

                                                    {/* Instant Replacement Button */}
                                                    {showGetcidReplacement && (
                                                        <button
                                                            onClick={handleGetcidInstantReplacement}
                                                            disabled={getcidReplacementLoading}
                                                            className="w-full py-2.5 bg-gradient-to-b from-[#067D62] to-[#055547] hover:from-[#055547] hover:to-[#044438] disabled:from-[#E7E9EC] disabled:to-[#D5D9D9] text-white disabled:text-[#565959] font-bold rounded-lg border border-[#055547] disabled:border-[#D5D9D9] shadow-md transition-all disabled:cursor-not-allowed flex items-center justify-center gap-2 text-sm"
                                                        >
                                                            {getcidReplacementLoading ? (
                                                                <>
                                                                    <Loader2 className="w-4 h-4 animate-spin" />
                                                                    Generating Replacement...
                                                                </>
                                                            ) : (
                                                                <>
                                                                    🔑 GENERATE REPLACEMENT KEY INSTANTLY
                                                                </>
                                                            )}
                                                        </button>
                                                    )}
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
                                                        className="w-full px-1 py-2 text-center font-mono text-xs border border-[#888C8C] rounded focus:outline-none focus:ring-2 focus:ring-[#FF9900] bg-white text-[#0F1111] placeholder:text-[#888C8C]"
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
                                                <a href="https://wa.me/918178848830" className="text-[#007185] hover:underline font-medium">8178848830</a>
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
                                        <a href="/digital-warranty" className="block">
                                            <div className="bg-gradient-to-r from-[#232F3E] to-[#37475A] rounded-lg shadow-lg overflow-hidden hover:shadow-xl transition-all hover:scale-[1.01] cursor-pointer">
                                                <div className="p-4 flex items-center gap-4">
                                                    <div className="w-12 h-12 bg-gradient-to-br from-[#FF9900] to-[#FF6600] rounded-full flex items-center justify-center flex-shrink-0 shadow-lg">
                                                        <Shield className="w-6 h-6 text-white" />
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <h3 className="text-base font-bold text-white mb-0.5">
                                                            Register for Warranty
                                                        </h3>
                                                        <p className="text-xs text-gray-300">
                                                            Get free lifetime support & easy replacements
                                                        </p>
                                                    </div>
                                                    <div className="flex-shrink-0">
                                                        <div className="bg-[#FF9900] text-[#0F1111] font-bold px-3 py-1.5 rounded text-xs shadow-md">
                                                            Register →
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </a>

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

                    {/* Warranty Registration CTA - Enhanced Design */}
                    {!activationResult?.success && (
                        <a href="/digital-warranty" className="block mt-6 group">
                            <div className="relative bg-gradient-to-r from-[#1a2636] via-[#232F3E] to-[#2d3e50] rounded-xl shadow-lg overflow-hidden hover:shadow-2xl transition-all duration-300 hover:scale-[1.02] cursor-pointer border border-[#FF9900]/30">
                                {/* Animated Glow Effect */}
                                <div className="absolute inset-0 bg-gradient-to-r from-[#FF9900]/0 via-[#FF9900]/10 to-[#FF9900]/0 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                                {/* FREE Badge */}
                                <div className="absolute -top-1 -right-1 z-10">
                                    <div className="bg-gradient-to-r from-[#067D62] to-[#0B9B7A] text-white text-[10px] font-bold px-3 py-1 rounded-bl-lg shadow-lg animate-pulse">
                                        FREE
                                    </div>
                                </div>

                                <div className="relative p-5">
                                    <div className="flex items-start gap-4">
                                        {/* Shield Icon with Pulse */}
                                        <div className="relative flex-shrink-0">
                                            <div className="absolute inset-0 bg-[#FF9900] rounded-full blur-md opacity-40 animate-pulse" />
                                            <div className="relative w-14 h-14 bg-gradient-to-br from-[#FF9900] to-[#FF6600] rounded-full flex items-center justify-center shadow-xl">
                                                <Shield className="w-7 h-7 text-white" />
                                            </div>
                                        </div>

                                        {/* Content */}
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 mb-1">
                                                <h3 className="text-lg font-bold text-white">
                                                    Already Activated? Register for FREE Warranty
                                                </h3>
                                            </div>
                                            <p className="text-sm text-gray-300 mb-3">
                                                Protect your purchase with lifetime support
                                            </p>

                                            {/* Features */}
                                            <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs">
                                                <span className="flex items-center gap-1 text-[#4ADE80]">
                                                    <CheckCircle className="w-3 h-3" />
                                                    <span className="text-gray-300">Priority Support</span>
                                                </span>
                                                <span className="flex items-center gap-1 text-[#4ADE80]">
                                                    <CheckCircle className="w-3 h-3" />
                                                    <span className="text-gray-300">Easy Replacements</span>
                                                </span>
                                                <span className="flex items-center gap-1 text-[#4ADE80]">
                                                    <CheckCircle className="w-3 h-3" />
                                                    <span className="text-gray-300">Lifetime Validity</span>
                                                </span>
                                            </div>
                                        </div>

                                        {/* CTA Button */}
                                        <div className="flex-shrink-0 hidden sm:block">
                                            <div className="bg-gradient-to-b from-[#FFD814] to-[#F7CA00] text-[#0F1111] font-bold px-4 py-2.5 rounded-lg text-sm shadow-lg group-hover:from-[#F7CA00] group-hover:to-[#E7B800] transition-all">
                                                Register Now →
                                            </div>
                                        </div>
                                    </div>

                                    {/* Mobile CTA */}
                                    <div className="mt-3 sm:hidden">
                                        <div className="bg-gradient-to-b from-[#FFD814] to-[#F7CA00] text-[#0F1111] font-bold px-4 py-2.5 rounded-lg text-sm shadow-lg text-center">
                                            Register Now →
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </a>
                    )}

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
                <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-2 sm:p-4">
                    <div className="bg-white rounded-lg shadow-2xl w-full max-w-[95vw] sm:max-w-lg overflow-hidden animate-in zoom-in-95 duration-300 relative max-h-[85vh] sm:max-h-[90vh] flex flex-col">
                        {/* Close button */}
                        <button
                            onClick={handleSuccessPopupClose}
                            className="absolute top-2 right-2 sm:top-3 sm:right-3 w-7 h-7 sm:w-8 sm:h-8 bg-white/20 hover:bg-white/30 rounded-full flex items-center justify-center transition-colors z-10"
                            title="Close"
                        >
                            <X className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                        </button>
                        <div className="bg-gradient-to-r from-[#067D62] to-[#0A9A77] px-4 py-3 sm:px-6 sm:py-4 pr-10 sm:pr-12 flex-shrink-0">
                            <div className="flex items-center justify-center gap-2 sm:gap-3">
                                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-white/20 rounded-full flex items-center justify-center">
                                    <CheckCircle className="w-5 h-5 sm:w-7 sm:h-7 text-white" />
                                </div>
                                <div>
                                    <h2 className="text-lg sm:text-xl font-bold text-white">Success!</h2>
                                    <p className="text-white/90 text-xs sm:text-sm">Your License Key is Ready</p>
                                </div>
                            </div>
                        </div>

                        <div className="p-4 sm:p-6 space-y-3 sm:space-y-4 overflow-y-auto flex-1">
                            {/* License Key */}
                            <div className="text-center">
                                <div className="bg-[#FCF5EE] border-2 border-[#FF9900] rounded-lg p-3 sm:p-4 mb-2 sm:mb-3">
                                    <p className="text-xs text-[#565959] mb-1 sm:mb-2">Your Product License Key:</p>
                                    <code className="font-mono text-sm sm:text-lg font-bold text-[#0F1111] break-all">
                                        {activationResult?.licenseKey}
                                    </code>
                                </div>
                                <p className="text-[#0F1111] font-medium text-xs sm:text-sm">
                                    🎉 Congratulations! Your license key has been generated successfully.
                                </p>
                            </div>

                            {/* FBA Warning - Conditional */}
                            {(fulfillmentType === 'amazon_fba' || fulfillmentType === 'seller_easy_ship' || fulfillmentType === 'seller_self_ship') && (
                                <div className="bg-[#FEF2F2] border-l-4 border-[#CC0C39] rounded-r-lg p-2 sm:p-3">
                                    <div className="flex items-start gap-2">
                                        <AlertTriangle className="w-4 h-4 sm:w-5 sm:h-5 text-[#CC0C39] flex-shrink-0 mt-0.5" />
                                        <div>
                                            <p className="text-xs sm:text-sm font-bold text-[#CC0C39]">Ignore Physical Instructions</p>
                                            <p className="text-[10px] sm:text-xs text-[#565959] mt-1">
                                                Please <strong>ignore</strong> the physical instructions sent with your package. Follow only the installation instructions on this website for a smooth activation.
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* OFFICE365 Password Warning - Conditional */}
                            {(activationResult?.licenses?.some(l => l.fsn?.toUpperCase().startsWith('OFFICE365')) ||
                                activationResult?.productInfo?.sku?.toUpperCase().startsWith('OFFICE365')) && (
                                    <div className="bg-gradient-to-b from-[#FEF2F2] to-[#FFF7ED] border-2 border-[#DC2626] rounded-xl overflow-hidden">
                                        <div className="bg-[#DC2626] text-white px-2 py-1.5 sm:px-3 sm:py-2 flex items-center gap-1.5 sm:gap-2">
                                            <AlertTriangle className="w-4 h-4 sm:w-5 sm:h-5" />
                                            <h3 className="font-bold text-xs sm:text-sm">MANDATORY: Read Before You Login</h3>
                                        </div>
                                        <div className="p-2 sm:p-3 space-y-2 sm:space-y-3">
                                            <div className="flex gap-1.5 sm:gap-2">
                                                <span className="bg-[#DC2626] text-white font-bold rounded-full w-5 h-5 sm:w-6 sm:h-6 flex items-center justify-center text-[10px] sm:text-xs flex-shrink-0 mt-0.5">1</span>
                                                <div>
                                                    <p className="font-bold text-[#0F1111] text-[10px] sm:text-xs">Change Your Password on First Login</p>
                                                    <p className="text-[10px] sm:text-xs text-[#565959] mt-0.5">
                                                        You will be prompted to change your password.
                                                        <span className="font-bold text-[#DC2626]"> Carefully note down your new password.</span>
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="flex gap-1.5 sm:gap-2">
                                                <span className="bg-[#DC2626] text-white font-bold rounded-full w-5 h-5 sm:w-6 sm:h-6 flex items-center justify-center text-[10px] sm:text-xs flex-shrink-0 mt-0.5">2</span>
                                                <div>
                                                    <p className="font-bold text-[#0F1111] text-[10px] sm:text-xs">Setup Password Recovery</p>
                                                    <a
                                                        href="https://mysignins.microsoft.com/security-info"
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="inline-block mt-1 px-1.5 py-0.5 sm:px-2 sm:py-1 bg-[#0078D4] text-white text-[10px] sm:text-xs font-bold rounded hover:bg-[#106EBE] transition-colors break-all"
                                                    >
                                                        🔗 mysignins.microsoft.com/security-info
                                                    </a>
                                                    <p className="text-[10px] sm:text-xs text-[#565959] mt-1">
                                                        Add your <span className="font-bold">personal phone number</span>, <span className="font-bold">alternate number</span> and <span className="font-bold">authenticator</span> as recovery methods.
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="bg-[#FEE2E2] border border-[#FECACA] rounded-lg p-1.5 sm:p-2">
                                                <p className="text-[10px] sm:text-xs font-bold text-[#991B1B] flex items-center gap-1">
                                                    <XCircle className="w-3 h-3 sm:w-3.5 sm:h-3.5 flex-shrink-0" />
                                                    No Replacement Policy
                                                </p>
                                                <p className="text-[10px] sm:text-xs text-[#991B1B] mt-0.5 ml-4 sm:ml-5">
                                                    <strong>No replacement or support</strong> for mistyped/forgotten passwords. Accounts are <strong>already verified</strong>.
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                )}

                            {/* Installation Instructions Note */}
                            <div className="bg-[#FFF4E5] border border-[#FF9900] rounded-lg p-2 sm:p-3">
                                <div className="flex items-start gap-2">
                                    <AlertTriangle className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#FF9900] flex-shrink-0 mt-0.5" />
                                    <p className="text-[10px] sm:text-xs text-[#565959]">
                                        Please follow the <strong className="text-[#0F1111]">installation instructions below</strong> carefully to activate your product.
                                    </p>
                                </div>
                            </div>

                            {/* Warranty CTA */}
                            <a
                                href="/digital-warranty"
                                className="block p-2 sm:p-3 bg-gradient-to-r from-[#F0FDF4] to-[#ECFDF5] border-2 border-[#067D62] rounded-lg hover:shadow-lg transition-all group"
                            >
                                <div className="flex items-center gap-2 sm:gap-3">
                                    <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-[#067D62] to-[#0A9A77] rounded-full flex items-center justify-center flex-shrink-0">
                                        <Shield className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <span className="font-bold text-[#0F1111] text-xs sm:text-sm">Register Lifetime Warranty</span>
                                        <p className="text-[10px] sm:text-xs text-[#565959]">Get tech support, installation help & key replacements</p>
                                    </div>
                                    <span className="text-[#067D62] group-hover:text-[#0A9A77] font-bold text-xs sm:text-sm flex-shrink-0">Register →</span>
                                </div>
                            </a>

                            {/* Push notification prompt */}
                            <CustomerPushAutoPrompt orderId={secretCode} requestType="activation" />

                            {/* Close button with countdown */}
                            <button
                                onClick={handleSuccessPopupClose}
                                className="w-full py-2.5 sm:py-3 bg-gradient-to-b from-[#FFD814] to-[#F7CA00] hover:from-[#F7CA00] hover:to-[#E7B800] text-[#0F1111] font-bold rounded-lg border border-[#FCD200] shadow-sm transition-all duration-200 flex items-center justify-center gap-1.5 sm:gap-2 text-sm sm:text-base"
                            >
                                <Download className="w-4 h-4 sm:w-5 sm:h-5" />
                                View Installation Instructions
                                {popupCountdown > 0 && (
                                    <span className="ml-1 text-[10px] sm:text-xs bg-[#0F1111]/10 px-1.5 py-0.5 sm:px-2 rounded-full">
                                        {popupCountdown}s
                                    </span>
                                )}
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

            {/* FBA/MFN Physical Instructions Warning Popup - Now merged into success popup above */}

            {/* Contact Info Modal - When Keys Not Available */}
            {showContactModal && (
                <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg shadow-2xl max-w-md w-full overflow-hidden">
                        <div className="bg-[#232F3E] px-4 py-3 flex items-center justify-between">
                            <span className="text-white font-bold">Contact Information Required</span>
                            <button onClick={() => setShowContactModal(false)} className="text-white/70 hover:text-white">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="p-6">
                            <div className="mb-5 p-4 bg-[#FFF4E5] border-l-4 border-[#FF9900] rounded-r">
                                <p className="text-base font-medium text-[#0F1111] leading-relaxed">
                                    <AlertTriangle className="w-5 h-5 inline mr-2 text-[#FF9900]" />
                                    We are facing a temporary technical issue.
                                </p>
                                <p className="text-sm text-[#565959] mt-2 ml-7 leading-relaxed">
                                    Your license key is currently not available in our system. Please try again after <strong>6-12 hours</strong>, or provide your contact details below and we will send you the license key as soon as it&apos;s available.
                                </p>
                            </div>

                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-bold text-[#0F1111] mb-2">
                                        Email Address
                                    </label>
                                    <input
                                        type="email"
                                        value={contactEmail}
                                        onChange={(e) => setContactEmail(e.target.value)}
                                        placeholder="your.email@example.com"
                                        className="w-full px-4 py-3 border border-[#888C8C] rounded text-base text-black bg-white focus:outline-none focus:ring-2 focus:ring-[#FF9900]"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-bold text-[#0F1111] mb-2">
                                        Phone Number (WhatsApp preferred)
                                    </label>
                                    <input
                                        type="tel"
                                        value={contactPhone}
                                        onChange={(e) => setContactPhone(e.target.value)}
                                        placeholder="+91 XXXXXXXXXX"
                                        className="w-full px-4 py-3 border border-[#888C8C] rounded text-base text-black bg-white focus:outline-none focus:ring-2 focus:ring-[#FF9900]"
                                    />
                                </div>

                                <p className="text-sm text-[#565959]">
                                    * Please provide at least one contact method so we can reach you
                                </p>
                            </div>

                            <div className="mt-6 flex gap-3">
                                <button
                                    onClick={() => setShowContactModal(false)}
                                    className="flex-1 py-2 border border-[#888C8C] rounded text-sm font-medium text-black bg-white hover:bg-gray-100"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleContactSubmit}
                                    disabled={contactSubmitting || (!contactEmail.trim() && !contactPhone.trim())}
                                    className="flex-1 py-2 bg-gradient-to-b from-[#FFD814] to-[#F7CA00] hover:from-[#F7CA00] hover:to-[#E7B800] text-[#0F1111] font-bold rounded border border-[#FCD200] disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {contactSubmitting ? 'Submitting...' : 'Submit'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* GetCID Replacement Key Modal */}
            {getcidReplacementKey && (
                <ReplacementKeySteps
                    replacementKey={getcidReplacementKey}
                    onClose={() => {
                        setGetcidReplacementKey(null);
                        setInstallationIds(Array(9).fill(''));
                        setGetcidError(null);
                    }}
                />
            )}
        </div>
    );
}

// Wrapper component with Suspense boundary for useSearchParams
export default function ActivatePage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen bg-[#EAEDED] flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#FF9900] mx-auto"></div>
                    <p className="mt-4 text-[#565959]">Loading...</p>
                </div>
            </div>
        }>
            <ActivatePageContent />
        </Suspense>
    );
}
