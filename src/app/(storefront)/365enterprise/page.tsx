'use client';

import { useState } from 'react';
import { ShoppingCart, CheckCircle, Loader2, AlertTriangle, Copy, Key, ExternalLink, Clock, Search, BookOpen } from 'lucide-react';
import { toast } from 'sonner';

interface CompletedRequest {
    generatedEmail: string;
    generatedPassword: string;
    firstName: string;
    lastName: string;
}

export default function Enterprise365Page() {
    const [orderId, setOrderId] = useState('');
    const [email, setEmail] = useState('');
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

        if (!orderId.trim() || !email.trim() || !displayName.trim()) {
            setError('Please fill in Order ID, Display Name, and Email');
            return;
        }

        if (!/\S+@\S+\.\S+/.test(email)) {
            setError('Please enter a valid email address');
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

                                {/* Instructions */}
                                <div className="bg-[#FFF4E5] border-l-4 border-[#FF9900] p-4">
                                    <p className="text-sm text-[#0F1111]">
                                        <strong>⚠️ Important:</strong> Please change your password on first login for security.
                                    </p>
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
                                        <a href="https://wa.me/918595899215" className="font-bold underline">8595899215</a>
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
                                    <p className="text-sm opacity-90">We&apos;ll process within 24 hours</p>
                                </div>
                            </div>

                            <div className="p-6">
                                <p className="text-[#565959] mb-4">
                                    Your Microsoft 365 account will be created and credentials sent to:
                                </p>
                                <div className="p-3 bg-[#FCF5EE] border border-[#FF9900] rounded mb-4">
                                    <p className="font-bold text-[#0F1111]">{email}</p>
                                    {phoneNumber && <p className="text-sm text-[#565959]">WhatsApp: {phoneNumber}</p>}
                                </div>

                                <div className="text-center p-3 bg-[#FEF8F2] border border-[#FF9900] rounded">
                                    <p className="text-xs text-[#B12704]">
                                        <span className="font-bold">Need Help?</span> WhatsApp:{' '}
                                        <a href="https://wa.me/918595899215" className="font-bold underline">8595899215</a>
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
                                        <a href="https://wa.me/918595899215" className="font-bold underline">8595899215</a>
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
                                    ) : orderId.trim().length > 10 && (
                                        <button
                                            type="button"
                                            onClick={handleVerifyOrder}
                                            className="mt-2 text-sm text-[#007185] hover:text-[#C7511F] hover:underline flex items-center gap-1"
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
                                    <input
                                        type="email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        placeholder="johndoe@gmail.com"
                                        className="w-full px-4 py-3 border border-[#888C8C] rounded text-base text-[#0F1111] bg-white focus:outline-none focus:ring-2 focus:ring-[#FF9900] focus:border-[#FF9900] placeholder:text-[#6B7280]"
                                    />
                                    <p className="text-xs text-[#CC0C39] mt-1">
                                        <span className="font-bold">*Note:</span> Password with Login ID will be sent to this mail
                                    </p>
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
                                    disabled={isLoading || !orderId.trim() || !displayName.trim() || !email.trim()}
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
                            <a href="mailto:support@simplysolutions.store" className="text-[#007185] hover:underline">
                                support@simplysolutions.store
                            </a>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
