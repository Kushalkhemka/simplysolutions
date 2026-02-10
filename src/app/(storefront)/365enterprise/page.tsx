'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { ShoppingCart, CheckCircle, Loader2, AlertTriangle, Copy, Key, ExternalLink, Clock, Search, BookOpen, Mail, RefreshCw, XCircle } from 'lucide-react';
import { toast } from 'sonner';
import { CustomerPushAutoPrompt } from '@/components/notifications/CustomerPushOptIn';

interface CompletedRequest {
    generatedEmail: string;
    generatedPassword: string;
    firstName: string;
    lastName: string;
}

function Enterprise365Content() {
    const searchParams = useSearchParams();
    const [orderId, setOrderId] = useState('');
    const [email, setEmail] = useState('');
    const [confirmEmail, setConfirmEmail] = useState('');
    const [displayName, setDisplayName] = useState('');
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [phoneNumber, setPhoneNumber] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isSubmitted, setIsSubmitted] = useState(false);
    const [completedRequest, setCompletedRequest] = useState<CompletedRequest | null>(null);
    const [isVerifying, setIsVerifying] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isPendingRequest, setIsPendingRequest] = useState(false);

    // Auto-fill order ID from query parameter
    useEffect(() => {
        const orderIdParam = searchParams.get('orderId');
        if (orderIdParam) {
            setOrderId(orderIdParam);
            toast.info('Order ID filled from your previous entry');
        }
    }, [searchParams]);

    // Check if request is already completed
    const handleVerifyOrder = async () => {
        if (!orderId.trim()) return;

        setIsVerifying(true);
        setError(null);
        setIsPendingRequest(false);

        try {
            const response = await fetch('/api/365enterprise/verify', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ orderId: orderId.trim() }),
            });

            const data = await response.json();

            if (data.success && data.isCompleted) {
                // Check if credentials are available
                if (data.generatedEmail && data.generatedPassword) {
                    setCompletedRequest({
                        generatedEmail: data.generatedEmail,
                        generatedPassword: data.generatedPassword,
                        firstName: data.firstName || '',
                        lastName: data.lastName || '',
                    });
                    toast.success('Your Microsoft 365 account is ready!');
                } else {
                    // Legacy order - credentials were sent by email but not stored
                    setCompletedRequest({
                        generatedEmail: 'Check your email',
                        generatedPassword: 'Check your email',
                        firstName: data.firstName || '',
                        lastName: data.lastName || '',
                    });
                    toast.info('Your request was completed. Please check your email for credentials.');
                }
            } else if (data.success && data.isPending) {
                setIsPendingRequest(true);
                toast.info('Your request is being processed');
            }
        } catch (err) {
            console.error('Verify error:', err);
        } finally {
            setIsVerifying(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        if (!orderId.trim() || !email.trim() || !confirmEmail.trim() || !displayName.trim()) {
            setError('Please fill in Order ID, Display Name, and both Email fields');
            return;
        }

        if (!/\S+@\S+\.\S+/.test(email)) {
            setError('Please enter a valid email address');
            return;
        }

        if (email.trim().toLowerCase() !== confirmEmail.trim().toLowerCase()) {
            setError('Email addresses do not match. Please check and try again.');
            return;
        }

        setIsLoading(true);

        try {
            const response = await fetch('/api/product-request', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    email: email.trim(),
                    orderId: orderId.trim(),
                    requestType: '365e5',
                    mobileNumber: phoneNumber.trim() || null,
                    firstName: firstName.trim() || displayName.split(' ')[0],
                    lastName: lastName.trim() || displayName.split(' ').slice(1).join(' ') || '',
                    usernamePrefix: displayName.toLowerCase().replace(/[^a-z0-9]/g, '')
                }),
            });

            const data = await response.json();

            if (data.success) {
                setIsSubmitted(true);
                toast.success(data.message);
            } else {
                setError(data.error || 'Failed to submit request');
            }
        } catch (err) {
            console.error('365 Enterprise request error:', err);
            setError('Network error. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    // Completed Request UI - Show credentials
    if (completedRequest) {
        return (
            <div className="min-h-screen bg-[#EAEDED]">
                {/* Success Banner */}
                <div className="bg-[#067D62] text-white py-3 px-4">
                    <div className="container-dense flex items-center justify-center gap-2 text-sm font-medium">
                        <CheckCircle className="w-5 h-5" />
                        <span className="font-bold">Successfully Activated!</span>
                        <span className="hidden sm:inline">Your Microsoft 365 Account is Ready</span>
                    </div>
                </div>

                {/* Header Banner */}
                <div className="bg-[#232F3E] py-4 border-b-4 border-[#FF9900]">
                    <div className="container-dense">
                        <h1 className="text-2xl md:text-3xl font-bold text-center text-white uppercase tracking-wider">
                            Microsoft 365 Enterprise
                        </h1>
                        <p className="text-center text-[#FF9900] text-sm mt-1 font-medium">
                            Your Account Credentials
                        </p>
                    </div>
                </div>

                <div className="container-dense py-8 md:py-12">
                    <div className="max-w-2xl mx-auto">
                        <div className="bg-white rounded-lg shadow-lg border border-[#DDD] overflow-hidden">
                            {/* Success Header */}
                            <div className="bg-[#067D62] text-white px-6 py-4 flex items-center gap-3">
                                <CheckCircle className="w-6 h-6" />
                                <div>
                                    <p className="font-bold">Welcome, {completedRequest.firstName}!</p>
                                    <p className="text-sm opacity-90">Your Microsoft 365 E5 subscription is active</p>
                                </div>
                            </div>

                            <div className="p-6 space-y-4">
                                {/* Email Credential */}
                                <div className="p-4 bg-[#F7F8FA] rounded border border-[#DDD]">
                                    <p className="text-xs text-[#565959] mb-2 font-bold uppercase">Microsoft 365 Email</p>
                                    <div className="flex items-center gap-2 p-3 bg-[#FCF5EE] rounded border-2 border-[#FF9900]">
                                        <code className="font-mono font-bold text-[#0F1111] flex-1 break-all">
                                            {completedRequest.generatedEmail}
                                        </code>
                                        <button
                                            onClick={() => {
                                                navigator.clipboard.writeText(completedRequest.generatedEmail);
                                                toast.success('Email copied!');
                                            }}
                                            className="p-2 hover:bg-[#FF9900]/20 rounded"
                                        >
                                            <Copy className="w-4 h-4 text-[#FF9900]" />
                                        </button>
                                    </div>
                                </div>

                                {/* Password Credential */}
                                <div className="p-4 bg-[#F7F8FA] rounded border border-[#DDD]">
                                    <p className="text-xs text-[#565959] mb-2 font-bold uppercase">Password</p>
                                    <div className="flex items-center gap-2 p-3 bg-[#FCF5EE] rounded border-2 border-[#FF9900]">
                                        <Key className="w-5 h-5 text-[#FF9900]" />
                                        <code className="font-mono font-bold text-[#0F1111] flex-1 break-all">
                                            {completedRequest.generatedPassword}
                                        </code>
                                        <button
                                            onClick={() => {
                                                navigator.clipboard.writeText(completedRequest.generatedPassword);
                                                toast.success('Password copied!');
                                            }}
                                            className="p-2 hover:bg-[#FF9900]/20 rounded"
                                        >
                                            <Copy className="w-4 h-4 text-[#FF9900]" />
                                        </button>
                                    </div>
                                </div>

                                {/* Login Button */}
                                <a
                                    href="https://www.office.com"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="block w-full py-3 bg-gradient-to-b from-[#FFD814] to-[#F7CA00] hover:from-[#F7CA00] hover:to-[#E7B800] text-[#0F1111] font-bold rounded-lg border border-[#FCD200] shadow-sm transition-all text-center"
                                >
                                    <span className="flex items-center justify-center gap-2">
                                        <ExternalLink className="w-5 h-5" />
                                        Login to Microsoft 365
                                    </span>
                                </a>

                                {/* OFFICE365 Password Change Warning */}
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

                                {/* Installation Guide Link */}
                                <a
                                    href="https://simplysolutions.co.in/office365"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center justify-center gap-2 w-full py-3 bg-[#232F3E] hover:bg-[#37475A] text-white font-bold rounded-lg transition-all"
                                >
                                    <BookOpen className="w-5 h-5" />
                                    View Setup Guide
                                    <ExternalLink className="w-4 h-4" />
                                </a>

                                {/* Support */}
                                <div className="text-center p-3 bg-[#FEF8F2] border border-[#FF9900] rounded">
                                    <p className="text-xs text-[#B12704]">
                                        <span className="font-bold">Need Help?</span> WhatsApp:{' '}
                                        <a href="https://wa.me/918178848830" className="font-bold underline">8178848830</a>
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // Submitted UI
    if (isSubmitted) {
        return (
            <div className="min-h-screen bg-[#EAEDED]">
                {/* Push notification prompt */}
                <CustomerPushAutoPrompt orderId={orderId} requestType="product_request" />
                <div className="bg-[#067D62] text-white py-3 px-4">
                    <div className="container-dense flex items-center justify-center gap-2 text-sm font-medium">
                        <CheckCircle className="w-5 h-5" />
                        <span className="font-bold">Request Submitted!</span>
                    </div>
                </div>

                <div className="bg-[#232F3E] py-4 border-b-4 border-[#FF9900]">
                    <div className="container-dense">
                        <h1 className="text-2xl md:text-3xl font-bold text-center text-white uppercase tracking-wider">
                            Microsoft 365 Enterprise
                        </h1>
                    </div>
                </div>

                <div className="container-dense py-8 md:py-12">
                    <div className="max-w-2xl mx-auto">
                        <div className="bg-white rounded-lg shadow-lg border border-[#DDD] overflow-hidden">
                            <div className="bg-[#067D62] text-white px-6 py-4 flex items-center gap-3">
                                <CheckCircle className="w-6 h-6" />
                                <div>
                                    <p className="font-bold">Request Submitted!</p>
                                    <p className="text-sm opacity-90">We&apos;ll process within 24-48 working hours</p>
                                </div>
                            </div>

                            <div className="p-6 space-y-4">
                                <p className="text-[#565959]">
                                    Your Microsoft 365 account will be created and credentials sent to:
                                </p>
                                <div className="p-3 bg-[#FCF5EE] border border-[#FF9900] rounded">
                                    <p className="font-bold text-[#0F1111]">{email}</p>
                                    {phoneNumber && <p className="text-sm text-[#565959]">WhatsApp: {phoneNumber}</p>}
                                </div>

                                {/* Highlighted Come Back Warning Box */}
                                <div className="bg-[#FFF4E5] border-2 border-[#FF9900] rounded-lg p-4">
                                    <div className="flex items-start gap-3">
                                        <div className="w-10 h-10 bg-[#FF9900] rounded-full flex items-center justify-center flex-shrink-0">
                                            <RefreshCw className="w-5 h-5 text-white" />
                                        </div>
                                        <div>
                                            <p className="font-bold text-[#0F1111] text-base mb-2">
                                                Important: Come Back to Check Your Request
                                            </p>
                                            <ul className="text-sm text-[#0F1111] space-y-2">
                                                <li className="flex items-start gap-2">
                                                    <span className="text-[#FF9900] font-bold">•</span>
                                                    <span>Please <strong className="text-[#CC0C39]">come back to this page (/365enterprise)</strong> after <strong>24-48 working hours</strong> to check your request status</span>
                                                </li>
                                                <li className="flex items-start gap-2">
                                                    <span className="text-[#FF9900] font-bold">•</span>
                                                    <span>Enter your <strong>Order ID / Secret Code</strong> to retrieve your credentials once ready</span>
                                                </li>
                                                <li className="flex items-start gap-2">
                                                    <span className="text-[#FF9900] font-bold">•</span>
                                                    <span><strong className="text-[#CC0C39]">Check your Spam/Junk folder</strong> - Our emails sometimes land there</span>
                                                </li>
                                            </ul>
                                        </div>
                                    </div>
                                </div>

                                {/* Bookmark Reminder */}
                                <div className="bg-[#E7F4E4] border border-[#067D62] rounded-lg p-3 text-center">
                                    <p className="text-sm text-[#067D62] font-medium">
                                        Bookmark this page: <strong className="text-[#0F1111]">simplysolutions.co.in/365enterprise</strong>
                                    </p>
                                </div>

                                {/* OFFICE365 Password Change Warning */}
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
                                                    After receiving your credentials and changing your password, go to:{' '}
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

                                <div className="text-center p-3 bg-[#FEF8F2] border border-[#FF9900] rounded">
                                    <p className="text-xs text-[#B12704]">
                                        <span className="font-bold">Need Help?</span> WhatsApp:{' '}
                                        <a href="https://wa.me/918178848830" className="font-bold underline">8178848830</a>
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // Pending Request UI - Show processing status
    if (isPendingRequest) {
        return (
            <div className="min-h-screen bg-[#EAEDED]">
                <div className="bg-[#007185] text-white py-3 px-4">
                    <div className="container-dense flex items-center justify-center gap-2 text-sm font-medium">
                        <Clock className="w-5 h-5" />
                        <span className="font-bold">Processing Request</span>
                        <span className="hidden sm:inline">Your Microsoft 365 account is being set up</span>
                    </div>
                </div>

                <div className="bg-[#232F3E] py-4 border-b-4 border-[#FF9900]">
                    <div className="container-dense">
                        <h1 className="text-2xl md:text-3xl font-bold text-center text-white uppercase tracking-wider">
                            Microsoft 365 Enterprise
                        </h1>
                    </div>
                </div>

                <div className="container-dense py-8 md:py-12">
                    <div className="max-w-2xl mx-auto">
                        <div className="bg-white rounded-lg shadow-lg border border-[#DDD] overflow-hidden">
                            <div className="bg-[#007185] text-white px-6 py-4 flex items-center gap-3">
                                <Clock className="w-6 h-6 animate-pulse" />
                                <div>
                                    <p className="font-bold">Request Being Processed</p>
                                    <p className="text-sm opacity-90">Order: {orderId}</p>
                                </div>
                            </div>

                            <div className="p-6 space-y-4">
                                <div className="text-center py-4">
                                    <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-[#F0F2F2] flex items-center justify-center">
                                        <Loader2 className="w-8 h-8 text-[#007185] animate-spin" />
                                    </div>
                                    <p className="text-[#0F1111] font-medium">Your Microsoft 365 account is being created</p>
                                    <p className="text-sm text-[#565959] mt-2">This typically takes 2-4 hours. You will receive an email and WhatsApp notification once your account is ready.</p>
                                </div>

                                <div className="bg-[#FFF4E5] border-l-4 border-[#FF9900] p-4">
                                    <p className="text-sm text-[#0F1111]">
                                        <strong>Tip:</strong> You can return to this page anytime and enter your Order ID to check the status of your request.
                                    </p>
                                </div>

                                <button
                                    onClick={() => { setIsPendingRequest(false); setOrderId(''); }}
                                    className="w-full py-3 bg-gradient-to-b from-[#FFD814] to-[#F7CA00] hover:from-[#F7CA00] hover:to-[#E7B800] text-[#0F1111] font-bold rounded-lg border border-[#FCD200] shadow-sm transition-all"
                                >
                                    Check Different Order
                                </button>

                                <div className="text-center p-3 bg-[#FEF8F2] border border-[#FF9900] rounded">
                                    <p className="text-xs text-[#B12704]">
                                        <span className="font-bold">Need Help?</span> WhatsApp:{' '}
                                        <a href="https://wa.me/918178848830" className="font-bold underline">8178848830</a>
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // Request Form UI - Amazon Theme
    return (
        <div className="min-h-screen bg-[#EAEDED]">
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

            <div className="container-dense py-8 md:py-12">
                <div className="max-w-2xl mx-auto">
                    {/* Main Card */}
                    <div className="bg-white rounded-lg shadow-lg border border-[#DDD] overflow-hidden">
                        {/* Card Header */}
                        <div className="bg-gradient-to-b from-[#F7F8FA] to-[#E7E9EC] px-6 py-4 border-b border-[#DDD]">
                            <h2 className="text-lg font-bold text-[#0F1111]">Enter Your Secret Code or Amazon Order ID</h2>
                            <p className="text-sm text-[#565959] mt-1">
                                Enter your details to set up your Office 365 E5 account
                            </p>
                        </div>

                        <div className="p-6">
                            <form onSubmit={handleSubmit} className="space-y-4">
                                {/* Order ID */}
                                <div>
                                    <label className="block text-sm font-bold text-[#0F1111] mb-2">
                                        ORDER ID / SECRET CODE *
                                    </label>
                                    <div className="flex">
                                        <div className="bg-[#F0F2F2] border border-r-0 border-[#888C8C] rounded-l px-3 flex items-center">
                                            <ShoppingCart className="w-5 h-5 text-[#FF9900]" />
                                        </div>
                                        <input
                                            type="text"
                                            value={orderId}
                                            onChange={(e) => { setOrderId(e.target.value); setError(null); }}
                                            onBlur={handleVerifyOrder}
                                            placeholder="e.g. 12345678990000 or 408-1234567-1234567"
                                            className="flex-1 px-4 py-3 border border-[#888C8C] rounded-r text-base font-mono text-[#0F1111] bg-white focus:outline-none focus:ring-2 focus:ring-[#FF9900] focus:border-[#FF9900] placeholder:text-[#6B7280]"
                                            maxLength={25}
                                        />
                                    </div>
                                    {isVerifying ? (
                                        <p className="text-xs text-[#007185] mt-2 flex items-center gap-1">
                                            <Loader2 className="w-3 h-3 animate-spin" /> Checking request status...
                                        </p>
                                    ) : (
                                        <button
                                            type="button"
                                            onClick={handleVerifyOrder}
                                            disabled={!orderId.trim()}
                                            className="mt-2 text-sm text-[#007185] hover:text-[#C7511F] hover:underline flex items-center gap-1 disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:no-underline disabled:hover:text-[#007185]"
                                        >
                                            <Search className="w-4 h-4" />
                                            Already submitted? Click here to check your request status
                                        </button>
                                    )}
                                </div>

                                {/* Login ID */}
                                <div>
                                    <label className="block text-sm font-bold text-[#0F1111] mb-2">
                                        LOGIN ID *
                                    </label>
                                    <div className="flex items-center">
                                        <input
                                            type="text"
                                            value={displayName}
                                            onChange={(e) => setDisplayName(e.target.value.toLowerCase().replace(/[^a-z0-9.]/g, ''))}
                                            placeholder="johndoe"
                                            className="flex-1 min-w-0 px-4 py-3 border border-[#888C8C] rounded-l text-base font-mono text-[#0F1111] bg-white focus:outline-none focus:ring-2 focus:ring-[#FF9900] focus:border-[#FF9900] placeholder:text-[#6B7280]"
                                            maxLength={30}
                                        />
                                        <div className="bg-[#F0F2F2] border border-l-0 border-[#888C8C] rounded-r px-3 py-3 text-sm text-[#565959] whitespace-nowrap">
                                            @****.onmicrosoft.com
                                        </div>
                                    </div>
                                </div>

                                {/* First & Last Name */}
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-bold text-[#0F1111] mb-2">
                                            FIRST NAME
                                        </label>
                                        <input
                                            type="text"
                                            value={firstName}
                                            onChange={(e) => setFirstName(e.target.value)}
                                            placeholder="First name"
                                            className="w-full px-4 py-3 border border-[#888C8C] rounded text-base text-[#0F1111] bg-white focus:outline-none focus:ring-2 focus:ring-[#FF9900] focus:border-[#FF9900] placeholder:text-[#6B7280]"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-bold text-[#0F1111] mb-2">
                                            LAST NAME
                                        </label>
                                        <input
                                            type="text"
                                            value={lastName}
                                            onChange={(e) => setLastName(e.target.value)}
                                            placeholder="Last name"
                                            className="w-full px-4 py-3 border border-[#888C8C] rounded text-base text-[#0F1111] bg-white focus:outline-none focus:ring-2 focus:ring-[#FF9900] focus:border-[#FF9900] placeholder:text-[#6B7280]"
                                        />
                                    </div>
                                </div>

                                {/* Email */}
                                <div>
                                    <label className="block text-sm font-bold text-[#0F1111] mb-2">
                                        PERSONAL EMAIL *
                                    </label>
                                    <div className="flex">
                                        <div className="bg-[#F0F2F2] border border-r-0 border-[#888C8C] rounded-l px-3 flex items-center">
                                            <Mail className="w-5 h-5 text-[#FF9900]" />
                                        </div>
                                        <input
                                            type="email"
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            placeholder="johndoe@gmail.com"
                                            className="flex-1 px-4 py-3 border border-[#888C8C] rounded-r text-base text-[#0F1111] bg-white focus:outline-none focus:ring-2 focus:ring-[#FF9900] focus:border-[#FF9900] placeholder:text-[#6B7280]"
                                        />
                                    </div>
                                    <p className="text-xs text-[#CC0C39] mt-1">
                                        <span className="font-bold">*Note:</span> Password with Login ID will be sent to this email
                                    </p>
                                </div>

                                {/* Confirm Email */}
                                <div>
                                    <label className="block text-sm font-bold text-[#0F1111] mb-2">
                                        CONFIRM EMAIL *
                                    </label>
                                    <div className="flex">
                                        <div className={`border border-r-0 rounded-l px-3 flex items-center ${confirmEmail && email.trim().toLowerCase() === confirmEmail.trim().toLowerCase() ? 'bg-[#E7F4E4] border-[#067D62]' : 'bg-[#F0F2F2] border-[#888C8C]'}`}>
                                            <Mail className={`w-5 h-5 ${confirmEmail && email.trim().toLowerCase() === confirmEmail.trim().toLowerCase() ? 'text-[#067D62]' : 'text-[#FF9900]'}`} />
                                        </div>
                                        <input
                                            type="email"
                                            value={confirmEmail}
                                            onChange={(e) => setConfirmEmail(e.target.value)}
                                            placeholder="Re-enter your email"
                                            className={`flex-1 px-4 py-3 border rounded-r text-base text-[#0F1111] bg-white focus:outline-none focus:ring-2 placeholder:text-[#6B7280] ${confirmEmail && email.trim().toLowerCase() === confirmEmail.trim().toLowerCase() ? 'border-[#067D62] focus:ring-[#067D62] focus:border-[#067D62]' : 'border-[#888C8C] focus:ring-[#FF9900] focus:border-[#FF9900]'}`}
                                        />
                                    </div>
                                    {confirmEmail && email.trim().toLowerCase() !== confirmEmail.trim().toLowerCase() && (
                                        <p className="text-xs text-[#CC0C39] mt-1 font-medium">
                                            Email addresses do not match
                                        </p>
                                    )}
                                    {confirmEmail && email.trim().toLowerCase() === confirmEmail.trim().toLowerCase() && (
                                        <p className="text-xs text-[#067D62] mt-1 font-medium flex items-center gap-1">
                                            <CheckCircle className="w-3 h-3" /> Email addresses match
                                        </p>
                                    )}
                                </div>

                                {/* WhatsApp Number */}
                                <div>
                                    <label className="block text-sm font-bold text-[#0F1111] mb-2">
                                        WHATSAPP NUMBER *
                                    </label>
                                    <input
                                        type="tel"
                                        value={phoneNumber}
                                        onChange={(e) => setPhoneNumber(e.target.value.replace(/\D/g, '').slice(0, 10))}
                                        placeholder="10-digit WhatsApp number"
                                        className="w-full px-4 py-3 border border-[#888C8C] rounded text-base font-mono text-[#0F1111] bg-white focus:outline-none focus:ring-2 focus:ring-[#FF9900] focus:border-[#FF9900] placeholder:text-[#6B7280]"
                                        maxLength={10}
                                    />
                                </div>

                                {/* Error */}
                                {error && (
                                    <div className="p-3 bg-[#FCF4F4] border border-[#CC0C39] rounded flex items-center gap-2">
                                        <AlertTriangle className="w-4 h-4 text-[#CC0C39] flex-shrink-0" />
                                        <span className="text-[#CC0C39] text-sm">{error}</span>
                                    </div>
                                )}

                                {/* Submit Button - Amazon Yellow */}
                                <button
                                    type="submit"
                                    disabled={isLoading || !orderId.trim() || !displayName.trim() || !email.trim() || !confirmEmail.trim() || email.trim().toLowerCase() !== confirmEmail.trim().toLowerCase()}
                                    className="w-full py-3 bg-gradient-to-b from-[#FFD814] to-[#F7CA00] hover:from-[#F7CA00] hover:to-[#E7B800] text-[#0F1111] font-bold rounded-lg border border-[#FCD200] shadow-sm transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {isLoading ? (
                                        <span className="flex items-center justify-center gap-2">
                                            <div className="w-4 h-4 border-2 border-[#0F1111]/30 border-t-[#0F1111] rounded-full animate-spin" />
                                            Submitting...
                                        </span>
                                    ) : (
                                        'Submit Request'
                                    )}
                                </button>
                            </form>
                        </div>
                    </div>

                    {/* Support */}
                    <div className="mt-6 text-center">
                        <p className="text-sm text-[#565959]">
                            Need help? Contact us at{' '}
                            <a href="mailto:support@simplysolutions.co.in" className="text-[#007185] hover:underline">
                                support@simplysolutions.co.in
                            </a>
                        </p>
                    </div>

                    {/* Warranty Registration CTA */}
                    <a href="/digital-warranty" className="block mt-6">
                        <div className="bg-gradient-to-r from-[#232F3E] to-[#37475A] rounded-lg shadow-lg border border-[#232F3E] overflow-hidden hover:shadow-xl transition-all hover:scale-[1.01] cursor-pointer">
                            <div className="p-4 flex items-center gap-4">
                                <div className="w-12 h-12 bg-gradient-to-br from-[#FF9900] to-[#FF6600] rounded-full flex items-center justify-center flex-shrink-0 shadow-lg">
                                    <svg className="w-6 h-6 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                                    </svg>
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h3 className="text-base font-bold text-white mb-0.5">
                                        Register for FREE Warranty
                                    </h3>
                                    <p className="text-xs text-gray-300">
                                        Get priority support & easy replacements
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
                </div>
            </div>
        </div>
    );
}

export default function Enterprise365Page() {
    return (
        <Suspense fallback={
            <div className="min-h-screen bg-[#EAEDED] flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-[#FF9900]" />
            </div>
        }>
            <Enterprise365Content />
        </Suspense>
    );
}
