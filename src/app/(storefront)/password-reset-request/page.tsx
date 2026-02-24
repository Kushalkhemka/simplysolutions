'use client';

import { useState } from 'react';
import { Loader2, CheckCircle, AlertTriangle, Search, Mail, KeyRound, ArrowRight, Shield, Lock, Clock } from 'lucide-react';
import { toast } from 'sonner';

type Step = 'order' | 'email' | 'success';

export default function PasswordResetRequestPage() {
    const [step, setStep] = useState<Step>('order');
    const [orderId, setOrderId] = useState('');
    const [username, setUsername] = useState('');
    const [communicationEmail, setCommunicationEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [hasPendingRequest, setHasPendingRequest] = useState(false);
    const [error, setError] = useState('');

    const handleLookupOrder = async () => {
        if (!orderId.trim()) {
            setError('Please enter your Order ID');
            return;
        }

        setLoading(true);
        setError('');

        try {
            const res = await fetch(`/api/password-reset-request?orderId=${encodeURIComponent(orderId.trim())}`);
            const data = await res.json();

            if (!res.ok) {
                setError(data.error || 'Failed to look up order');
                return;
            }

            setUsername(data.username);

            if (data.hasPendingRequest) {
                setHasPendingRequest(true);
                setError('You already have a pending password reset request for this order. Please wait for it to be processed.');
                return;
            }

            setStep('email');
        } catch {
            setError('Something went wrong. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async () => {
        if (!communicationEmail.trim()) {
            setError('Please enter your email address');
            return;
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(communicationEmail)) {
            setError('Please enter a valid email address');
            return;
        }

        setSubmitting(true);
        setError('');

        try {
            const res = await fetch('/api/password-reset-request', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    orderId: orderId.trim(),
                    communicationEmail: communicationEmail.trim()
                })
            });

            const data = await res.json();

            if (!res.ok) {
                setError(data.error || 'Failed to submit request');
                return;
            }

            toast.success('Password reset request submitted!');
            setStep('success');
        } catch {
            setError('Something went wrong. Please try again.');
        } finally {
            setSubmitting(false);
        }
    };

    // Success Screen
    if (step === 'success') {
        return (
            <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 flex items-center justify-center p-4">
                <div className="max-w-lg w-full">
                    <div className="bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
                        {/* Success Header */}
                        <div className="bg-gradient-to-r from-emerald-600 to-emerald-500 px-6 py-8 text-center">
                            <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
                                <CheckCircle className="h-10 w-10 text-emerald-600" />
                            </div>
                            <h1 className="text-2xl font-bold text-white mb-2">Request Submitted!</h1>
                            <p className="text-emerald-100">Your password reset request is being processed</p>
                        </div>

                        <div className="p-6 space-y-5">
                            {/* What happens next */}
                            <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-5">
                                <div className="flex items-center gap-2 mb-3">
                                    <Clock className="h-5 w-5 text-emerald-700" />
                                    <h2 className="font-semibold text-emerald-900">What happens next?</h2>
                                </div>
                                <ul className="text-sm text-emerald-800 space-y-2">
                                    <li className="flex items-start gap-2">
                                        <span className="text-emerald-600 mt-1">•</span>
                                        <span>Your password will be reset within <strong>12-24 hours</strong></span>
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <span className="text-emerald-600 mt-1">•</span>
                                        <span>New password will be sent to <strong>{communicationEmail}</strong></span>
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <span className="text-emerald-600 mt-1">•</span>
                                        <span>Sign in at <a href="https://www.office.com" target="_blank" rel="noopener noreferrer" className="text-blue-600 underline hover:text-blue-800">office.com</a> with the new password</span>
                                    </li>
                                </ul>
                            </div>

                            {/* Order details */}
                            <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
                                <div className="grid grid-cols-2 gap-4 text-sm">
                                    <div>
                                        <p className="text-slate-500 mb-1">Order ID</p>
                                        <p className="font-mono font-medium text-slate-900">{orderId}</p>
                                    </div>
                                    <div>
                                        <p className="text-slate-500 mb-1">Account Username</p>
                                        <p className="font-mono font-medium text-emerald-700">{username}</p>
                                    </div>
                                </div>
                            </div>

                            {/* Support */}
                            <div className="text-center pt-2">
                                <p className="text-sm text-slate-500">
                                    Need help? Contact us on WhatsApp:{' '}
                                    <a href="https://wa.me/918178848830" className="text-emerald-600 font-medium hover:underline">8178848830</a>
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100">
            {/* Header Banner — matching office365-replacement style */}
            <div className="bg-[#232F3E] py-5 border-b-4 border-[#FF9900]">
                <div className="container mx-auto px-4">
                    <h1 className="text-2xl md:text-3xl font-bold text-center text-white">
                        Microsoft Office 365
                    </h1>
                    <p className="text-center text-[#FF9900] text-sm mt-1 font-medium uppercase tracking-wide">
                        Password Reset Request
                    </p>
                </div>
            </div>

            {/* Main Content */}
            <div className="container mx-auto px-4 py-8 md:py-12">
                <div className="max-w-xl mx-auto">

                    {/* Progress Steps */}
                    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 mb-6">
                        <div className="flex items-center">
                            {/* Step 1 */}
                            <div className={`flex items-center gap-2 ${step === 'order' ? 'text-blue-600' : 'text-emerald-600'}`}>
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step === 'order' ? 'bg-blue-100' : 'bg-emerald-100'}`}>
                                    {step !== 'order' ? <CheckCircle className="h-4 w-4" /> : <Search className="h-4 w-4" />}
                                </div>
                                <span className="text-sm font-medium">Order ID</span>
                            </div>

                            {/* Connector */}
                            <div className={`flex-1 h-0.5 mx-4 ${step !== 'order' ? 'bg-emerald-400' : 'bg-slate-200'}`} />

                            {/* Step 2 */}
                            <div className={`flex items-center gap-2 ${step === 'email' ? 'text-blue-600' : 'text-slate-400'}`}>
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step === 'email' ? 'bg-blue-100' : 'bg-slate-100'}`}>
                                    <Mail className="h-4 w-4" />
                                </div>
                                <span className="text-sm font-medium">Email</span>
                            </div>
                        </div>
                    </div>

                    {/* Step 1: Enter Order ID */}
                    {step === 'order' && (
                        <div className="bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden">
                            <div className="bg-slate-50 px-6 py-4 border-b border-slate-200">
                                <h2 className="text-lg font-semibold text-slate-900">Enter Your Order ID</h2>
                                <p className="text-sm text-slate-500 mt-1">
                                    We&apos;ll look up your Office 365 account and auto-fetch the username
                                </p>
                            </div>

                            <div className="p-6 space-y-5">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-2">
                                        Amazon Order ID <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        value={orderId}
                                        onChange={(e) => {
                                            setOrderId(e.target.value);
                                            setError('');
                                            setHasPendingRequest(false);
                                        }}
                                        placeholder="e.g. 408-1234567-1234567"
                                        className={`w-full px-4 py-3 border rounded-lg text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all font-mono ${error ? 'border-red-400 bg-red-50' : 'border-slate-300'
                                            }`}
                                        onKeyDown={(e) => e.key === 'Enter' && handleLookupOrder()}
                                        autoFocus
                                    />
                                    <p className="text-xs text-slate-500 mt-1.5">
                                        Enter your Amazon Order ID from the order confirmation email
                                    </p>
                                </div>

                                {error && (
                                    <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                                        <div className="flex items-start gap-3">
                                            <AlertTriangle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
                                            <p className="text-sm text-red-700">{error}</p>
                                        </div>
                                    </div>
                                )}

                                {/* How it works */}
                                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                                    <div className="flex items-start gap-3">
                                        <Shield className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                                        <div>
                                            <h4 className="font-semibold text-blue-800 mb-2">How Password Reset Works</h4>
                                            <div className="text-sm text-blue-700 space-y-1.5">
                                                <div className="flex items-start gap-2">
                                                    <span className="text-blue-600 mt-0.5 font-bold">1.</span>
                                                    <span>Enter your Order ID — we auto-fetch the username</span>
                                                </div>
                                                <div className="flex items-start gap-2">
                                                    <span className="text-blue-600 mt-0.5 font-bold">2.</span>
                                                    <span>Provide an email to receive the new password</span>
                                                </div>
                                                <div className="flex items-start gap-2">
                                                    <span className="text-blue-600 mt-0.5 font-bold">3.</span>
                                                    <span>Our team resets the password within 12-24 hours</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <button
                                    onClick={handleLookupOrder}
                                    disabled={loading || !orderId.trim() || hasPendingRequest}
                                    className="w-full py-4 bg-[#FFD814] hover:bg-[#F7CA00] active:bg-[#E7B800] text-slate-900 font-bold rounded-lg shadow-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-lg"
                                >
                                    {loading ? (
                                        <>
                                            <Loader2 className="h-5 w-5 animate-spin" />
                                            Looking up order...
                                        </>
                                    ) : (
                                        <>
                                            <Search className="h-5 w-5" />
                                            Look Up My Account
                                        </>
                                    )}
                                </button>

                                <div className="flex items-center justify-center gap-2 text-slate-400 text-xs">
                                    <Shield className="h-4 w-4" />
                                    <span>Available for Office 365 products only</span>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Step 2: Email */}
                    {step === 'email' && (
                        <div className="bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden">
                            <div className="bg-slate-50 px-6 py-4 border-b border-slate-200">
                                <h2 className="text-lg font-semibold text-slate-900">Account Found — Submit Reset Request</h2>
                                <p className="text-sm text-slate-500 mt-1">
                                    Provide an email where we&apos;ll send your new password
                                </p>
                            </div>

                            <div className="p-6 space-y-5">
                                {/* Account Info */}
                                <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center flex-shrink-0">
                                            <Lock className="h-5 w-5 text-emerald-700" />
                                        </div>
                                        <div>
                                            <p className="text-xs text-emerald-600 font-medium uppercase tracking-wide">Account Username</p>
                                            <p className="text-lg font-mono font-bold text-emerald-800">{username}</p>
                                        </div>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-2">
                                        Communication Email <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="email"
                                        value={communicationEmail}
                                        onChange={(e) => {
                                            setCommunicationEmail(e.target.value);
                                            setError('');
                                        }}
                                        placeholder="your-email@example.com"
                                        className={`w-full px-4 py-3 border rounded-lg text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all ${error ? 'border-red-400 bg-red-50' : 'border-slate-300'
                                            }`}
                                        onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
                                        autoFocus
                                    />
                                    <p className="text-xs text-slate-500 mt-1.5">
                                        The new password will be sent to this email address
                                    </p>
                                </div>

                                {error && (
                                    <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                                        <div className="flex items-start gap-3">
                                            <AlertTriangle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
                                            <p className="text-sm text-red-700">{error}</p>
                                        </div>
                                    </div>
                                )}

                                {/* Important Notice */}
                                <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
                                    <div className="flex items-start gap-3">
                                        <AlertTriangle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
                                        <div>
                                            <h4 className="font-semibold text-amber-800 mb-2">Important Notes</h4>
                                            <ul className="text-sm text-amber-700 space-y-1.5">
                                                <li className="flex items-start gap-2">
                                                    <span className="text-amber-600 mt-1">•</span>
                                                    <span>After receiving the new password, <strong>set up security info</strong> at <a href="https://mysignins.microsoft.com/security-info" target="_blank" rel="noopener noreferrer" className="text-blue-600 underline hover:text-blue-800">mysignins.microsoft.com/security-info</a></span>
                                                </li>
                                                <li className="flex items-start gap-2">
                                                    <span className="text-amber-600 mt-1">•</span>
                                                    <span><strong>Save your new password</strong> securely — we cannot recover it later</span>
                                                </li>
                                            </ul>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex gap-3">
                                    <button
                                        onClick={() => { setStep('order'); setError(''); }}
                                        className="px-6 py-3 border border-slate-300 text-slate-700 font-medium rounded-lg hover:bg-slate-50 transition-colors"
                                    >
                                        Back
                                    </button>
                                    <button
                                        onClick={handleSubmit}
                                        disabled={submitting || !communicationEmail.trim()}
                                        className="flex-1 py-4 bg-[#FFD814] hover:bg-[#F7CA00] active:bg-[#E7B800] text-slate-900 font-bold rounded-lg shadow-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-lg"
                                    >
                                        {submitting ? (
                                            <>
                                                <Loader2 className="h-5 w-5 animate-spin" />
                                                Submitting...
                                            </>
                                        ) : (
                                            <>
                                                Submit Request
                                                <ArrowRight className="h-5 w-5" />
                                            </>
                                        )}
                                    </button>
                                </div>

                                <div className="flex items-center justify-center gap-2 text-slate-400 text-xs">
                                    <KeyRound className="h-4 w-4" />
                                    <span>Password reset within 12-24 working hours</span>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
