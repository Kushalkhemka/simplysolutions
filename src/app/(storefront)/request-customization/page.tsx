'use client';

import { useState, useEffect, useCallback, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Search, Loader2, CheckCircle, AlertTriangle, User, Mail, ArrowRight, Shield, XCircle, Info } from 'lucide-react';
import { toast } from 'sonner';
import Link from 'next/link';

function RequestCustomizationContent() {
    const searchParams = useSearchParams();
    const prefilledOrderId = searchParams.get('orderId') || '';

    // Step tracking
    const [step, setStep] = useState<'order' | 'form' | 'success'>('order');

    // Order verification
    const [orderId, setOrderId] = useState(prefilledOrderId);
    const [isVerifying, setIsVerifying] = useState(false);
    const [orderStatus, setOrderStatus] = useState<any>(null);

    // Form data
    const [formData, setFormData] = useState({
        usernamePrefix: '',
        firstName: '',
        lastName: '',
    });
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Username check
    const [isCheckingUsername, setIsCheckingUsername] = useState(false);
    const [usernameAvailable, setUsernameAvailable] = useState<boolean | null>(null);
    const [usernameDebounce, setUsernameDebounce] = useState<NodeJS.Timeout | null>(null);

    // Success
    const [submittedUsername, setSubmittedUsername] = useState('');

    // Auto-verify if orderId is prefilled
    useEffect(() => {
        if (prefilledOrderId) {
            verifyOrder(prefilledOrderId);
        }
    }, [prefilledOrderId]);

    const verifyOrder = async (id: string) => {
        if (!id.trim()) {
            toast.error('Please enter your Order ID');
            return;
        }

        setIsVerifying(true);
        setOrderStatus(null);

        try {
            const res = await fetch(`/api/request-customization?orderId=${encodeURIComponent(id.trim())}`);
            const data = await res.json();

            setOrderStatus(data);

            if (data.valid && data.warrantyVerified) {
                setStep('form');
                toast.success('Order verified! Please fill in your customization details.');
            } else if (data.valid && data.alreadySubmitted) {
                toast.info('A customization request has already been submitted for this order.');
            } else if (data.valid && data.alreadyCustomized) {
                toast.success('Your customization has already been fulfilled!');
            }
        } catch (error) {
            console.error('Order verification error:', error);
            toast.error('Failed to verify order. Please try again.');
        } finally {
            setIsVerifying(false);
        }
    };

    const checkUsername = useCallback(async (prefix: string) => {
        if (prefix.length < 3) {
            setUsernameAvailable(null);
            return;
        }

        setIsCheckingUsername(true);
        try {
            const res = await fetch(`/api/request-customization?checkUsername=${encodeURIComponent(prefix)}`);
            const data = await res.json();
            setUsernameAvailable(data.available);
            if (!data.available) {
                setErrors(prev => ({ ...prev, usernamePrefix: 'This username is already taken' }));
            } else {
                setErrors(prev => ({ ...prev, usernamePrefix: '' }));
            }
        } catch (error) {
            console.error('Username check error:', error);
        } finally {
            setIsCheckingUsername(false);
        }
    }, []);

    const handleUsernameChange = (value: string) => {
        // Only allow valid characters
        const sanitized = value.toLowerCase().replace(/[^a-z0-9._-]/g, '');
        setFormData(prev => ({ ...prev, usernamePrefix: sanitized }));
        setUsernameAvailable(null);

        if (errors.usernamePrefix) {
            setErrors(prev => ({ ...prev, usernamePrefix: '' }));
        }

        // Debounce the username check
        if (usernameDebounce) {
            clearTimeout(usernameDebounce);
        }

        if (sanitized.length >= 3) {
            const timeout = setTimeout(() => {
                checkUsername(sanitized);
            }, 500);
            setUsernameDebounce(timeout);
        }
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        if (errors[name]) {
            setErrors(prev => ({ ...prev, [name]: '' }));
        }
    };

    const validateForm = () => {
        const newErrors: Record<string, string> = {};

        if (!formData.usernamePrefix.trim()) {
            newErrors.usernamePrefix = 'Username is required';
        } else if (formData.usernamePrefix.length < 3) {
            newErrors.usernamePrefix = 'Username must be at least 3 characters';
        } else if (!/^[a-z][a-z0-9._-]*$/.test(formData.usernamePrefix)) {
            newErrors.usernamePrefix = 'Username must start with a letter';
        } else if (usernameAvailable === false) {
            newErrors.usernamePrefix = 'This username is already taken';
        }

        if (!formData.firstName.trim()) {
            newErrors.firstName = 'First name is required';
        }
        if (!formData.lastName.trim()) {
            newErrors.lastName = 'Last name is required';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!validateForm()) {
            toast.error('Please fix the errors before submitting');
            return;
        }

        if (usernameAvailable === null) {
            // Force check before submit
            setIsCheckingUsername(true);
            const res = await fetch(`/api/request-customization?checkUsername=${encodeURIComponent(formData.usernamePrefix)}`);
            const data = await res.json();
            setIsCheckingUsername(false);

            if (!data.available) {
                setUsernameAvailable(false);
                setErrors(prev => ({ ...prev, usernamePrefix: 'This username is already taken' }));
                toast.error('This username is already taken');
                return;
            }
        }

        setIsSubmitting(true);

        try {
            const res = await fetch('/api/request-customization', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    orderId: orderId.trim(),
                    usernamePrefix: formData.usernamePrefix.trim(),
                    firstName: formData.firstName.trim(),
                    lastName: formData.lastName.trim(),
                    customerEmail: orderStatus?.buyerEmail || '',
                }),
            });

            const data = await res.json();

            if (data.success) {
                setSubmittedUsername(data.requestedUsername);
                setStep('success');
                toast.success('Customization request submitted!');
            } else {
                toast.error(data.error || 'Failed to submit request');
            }
        } catch (error) {
            console.error('Submit error:', error);
            toast.error('Network error. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    // Success Screen
    if (step === 'success') {
        return (
            <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 flex items-center justify-center p-4">
                <div className="max-w-lg w-full">
                    <div className="bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
                        <div className="bg-gradient-to-r from-blue-600 to-blue-500 px-6 py-8 text-center">
                            <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
                                <CheckCircle className="h-10 w-10 text-blue-600" />
                            </div>
                            <h1 className="text-2xl font-bold text-white mb-2">Request Submitted!</h1>
                            <p className="text-blue-100">Your username customization request is being processed</p>
                        </div>

                        <div className="p-6">
                            <div className="bg-blue-50 border border-blue-200 rounded-xl p-5 mb-6">
                                <h2 className="font-semibold text-blue-900 mb-2">Requested Username</h2>
                                <div className="bg-white border-2 border-blue-300 rounded-lg p-4 font-mono text-lg font-bold text-center text-slate-900">
                                    {submittedUsername}
                                </div>
                            </div>

                            <div className="space-y-3 text-sm text-slate-600">
                                <div className="flex items-start gap-2">
                                    <CheckCircle className="h-4 w-4 text-emerald-500 flex-shrink-0 mt-0.5" />
                                    <p>Your request will be processed within 24-48 hours</p>
                                </div>
                                <div className="flex items-start gap-2">
                                    <CheckCircle className="h-4 w-4 text-emerald-500 flex-shrink-0 mt-0.5" />
                                    <p>You will receive an email notification once your custom username is ready</p>
                                </div>
                                <div className="flex items-start gap-2">
                                    <CheckCircle className="h-4 w-4 text-emerald-500 flex-shrink-0 mt-0.5" />
                                    <p>Your password will remain the same (the one you changed on first login)</p>
                                </div>
                            </div>

                            <div className="mt-6 p-4 bg-amber-50 border border-amber-200 rounded-lg">
                                <div className="flex items-start gap-2">
                                    <AlertTriangle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
                                    <p className="text-sm text-amber-700">
                                        <strong>Important:</strong> Once customized, please login at{' '}
                                        <a href="https://www.office.com" target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">office.com</a>{' '}
                                        or{' '}
                                        <a href="https://portal.office.com" target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">portal.office.com</a>{' '}
                                        using your new username and the password you changed on first login.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // Already submitted/customized states
    if (orderStatus?.alreadySubmitted) {
        return (
            <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 flex items-center justify-center p-4">
                <div className="max-w-lg w-full bg-white rounded-2xl shadow-xl border border-slate-200 p-8 text-center">
                    <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Info className="h-8 w-8 text-yellow-600" />
                    </div>
                    <h1 className="text-2xl font-bold text-slate-900 mb-3">Request Already Submitted</h1>
                    <p className="text-slate-600 mb-4">
                        A customization request for username <strong className="font-mono">{orderStatus.usernamePrefix}@ms365.pro</strong> has already been submitted for this order.
                    </p>
                    <p className="text-sm text-slate-500">
                        Please wait for it to be processed. You will be notified via email once ready.
                    </p>
                </div>
            </div>
        );
    }

    if (orderStatus?.alreadyCustomized) {
        return (
            <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 flex items-center justify-center p-4">
                <div className="max-w-lg w-full bg-white rounded-2xl shadow-xl border border-slate-200 p-8 text-center">
                    <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <CheckCircle className="h-8 w-8 text-emerald-600" />
                    </div>
                    <h1 className="text-2xl font-bold text-slate-900 mb-3">Already Customized!</h1>
                    <p className="text-slate-600 mb-4">
                        Your Office 365 account has been customized. Your username is:
                    </p>
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 font-mono text-lg font-bold text-slate-900 mb-4">
                        {orderStatus.generatedEmail}
                    </div>
                    <p className="text-sm text-slate-500">
                        Login at <a href="https://www.office.com" target="_blank" className="text-blue-600 underline">office.com</a> with this username.
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100">
            {/* Header Banner */}
            <div className="bg-[#232F3E] py-5 border-b-4 border-[#0078D4]">
                <div className="container mx-auto px-4">
                    <h1 className="text-2xl md:text-3xl font-bold text-center text-white">
                        Microsoft Office 365
                    </h1>
                    <p className="text-center text-[#0078D4] text-sm mt-1 font-medium uppercase tracking-wide">
                        Username Customization
                    </p>
                </div>
            </div>

            {/* Main Content */}
            <div className="container mx-auto px-4 py-8 md:py-12">
                <div className="max-w-xl mx-auto">

                    {/* Info Card */}
                    <div className="bg-blue-50 border border-blue-200 rounded-xl p-5 mb-6">
                        <div className="flex items-start gap-3">
                            <Info className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                            <div>
                                <h3 className="font-semibold text-blue-800 mb-1">Customize Your Username</h3>
                                <p className="text-sm text-blue-700">
                                    Choose a personalized username for your Office 365 account instead of the default numbered email.
                                    Your username will be in the format <strong className="font-mono">yourname@ms365.pro</strong>.
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Step 1: Order Verification */}
                    <div className="bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden mb-6">
                        <div className={`px-6 py-4 border-b ${step === 'form' ? 'bg-emerald-50 border-emerald-200' : 'bg-slate-50 border-slate-200'}`}>
                            <div className="flex items-center gap-3">
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm ${step === 'form' ? 'bg-emerald-500' : 'bg-[#232F3E]'}`}>
                                    {step === 'form' ? <CheckCircle className="h-5 w-5" /> : '1'}
                                </div>
                                <div>
                                    <h2 className="text-lg font-semibold text-slate-900">Verify Your Order</h2>
                                    <p className="text-sm text-slate-500">Enter your Amazon Order ID</p>
                                </div>
                            </div>
                        </div>

                        <div className="p-6">
                            <div className="flex gap-3">
                                <div className="relative flex-1">
                                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                        <Search className="w-5 h-5 text-slate-400" />
                                    </div>
                                    <input
                                        type="text"
                                        value={orderId}
                                        onChange={(e) => setOrderId(e.target.value)}
                                        placeholder="e.g. 408-2477254-5428882"
                                        className="w-full pl-12 pr-4 py-3 border-2 border-slate-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition text-slate-900 placeholder:text-slate-400"
                                        disabled={step === 'form'}
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter' && step === 'order') {
                                                verifyOrder(orderId);
                                            }
                                        }}
                                    />
                                </div>
                                {step === 'order' && (
                                    <button
                                        onClick={() => verifyOrder(orderId)}
                                        disabled={isVerifying || !orderId.trim()}
                                        className="px-6 py-3 bg-[#232F3E] hover:bg-[#37475A] text-white font-semibold rounded-xl transition-all disabled:opacity-50 flex items-center gap-2"
                                    >
                                        {isVerifying ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowRight className="h-4 w-4" />}
                                        Verify
                                    </button>
                                )}
                                {step === 'form' && (
                                    <button
                                        onClick={() => {
                                            setStep('order');
                                            setOrderStatus(null);
                                            setFormData({ usernamePrefix: '', firstName: '', lastName: '' });
                                            setUsernameAvailable(null);
                                        }}
                                        className="px-4 py-3 border-2 border-slate-200 rounded-xl text-slate-600 hover:bg-slate-50 transition-all text-sm font-medium"
                                    >
                                        Change
                                    </button>
                                )}
                            </div>

                            {/* Error/Status Messages */}
                            {orderStatus && !orderStatus.valid && (
                                <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                                    <div className="flex items-start gap-2">
                                        <XCircle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
                                        <p className="text-sm text-red-700">{orderStatus.error}</p>
                                    </div>
                                </div>
                            )}

                            {orderStatus?.warrantyRequired && (
                                <div className="mt-4 p-4 bg-amber-50 border border-amber-200 rounded-lg">
                                    <div className="flex items-start gap-3">
                                        <Shield className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
                                        <div>
                                            <h4 className="font-semibold text-amber-800 mb-1">Digital Warranty Required</h4>
                                            <p className="text-sm text-amber-700 mb-3">{orderStatus.error}</p>
                                            <Link
                                                href={`/digital-warranty?orderId=${orderId}`}
                                                className="inline-flex items-center gap-2 bg-amber-600 hover:bg-amber-700 text-white px-4 py-2 rounded-lg font-semibold text-sm transition-colors"
                                            >
                                                <Shield className="h-4 w-4" />
                                                Complete Warranty First
                                                <ArrowRight className="h-4 w-4" />
                                            </Link>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Step 2: Customization Form */}
                    {step === 'form' && (
                        <div className="bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden">
                            <div className="bg-slate-50 px-6 py-4 border-b border-slate-200">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-full bg-[#232F3E] flex items-center justify-center text-white font-bold text-sm">2</div>
                                    <div>
                                        <h2 className="text-lg font-semibold text-slate-900">Choose Your Username</h2>
                                        <p className="text-sm text-slate-500">Fill in your details for the customized account</p>
                                    </div>
                                </div>
                            </div>

                            <form onSubmit={handleSubmit} className="p-6 space-y-5">
                                {/* Username Input */}
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-2">
                                        Username <span className="text-red-500">*</span>
                                    </label>
                                    <div className="flex">
                                        <div className="relative flex-1">
                                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                                <User className="h-4 w-4 text-slate-400" />
                                            </div>
                                            <input
                                                type="text"
                                                value={formData.usernamePrefix}
                                                onChange={(e) => handleUsernameChange(e.target.value)}
                                                placeholder="johndoe"
                                                className={`w-full pl-10 pr-4 py-3 border-2 rounded-l-lg text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all ${errors.usernamePrefix ? 'border-red-400 bg-red-50' : usernameAvailable === true ? 'border-emerald-400 bg-emerald-50' : 'border-slate-300'
                                                    }`}
                                            />
                                            {isCheckingUsername && (
                                                <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                                                    <Loader2 className="h-4 w-4 animate-spin text-slate-400" />
                                                </div>
                                            )}
                                            {!isCheckingUsername && usernameAvailable === true && (
                                                <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                                                    <CheckCircle className="h-4 w-4 text-emerald-500" />
                                                </div>
                                            )}
                                            {!isCheckingUsername && usernameAvailable === false && (
                                                <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                                                    <XCircle className="h-4 w-4 text-red-500" />
                                                </div>
                                            )}
                                        </div>
                                        <span className="inline-flex items-center px-4 border-2 border-l-0 border-slate-300 rounded-r-lg bg-slate-100 text-slate-600 text-sm font-mono font-medium select-none">
                                            @ms365.pro
                                        </span>
                                    </div>
                                    {errors.usernamePrefix && (
                                        <p className="text-xs text-red-600 mt-1">{errors.usernamePrefix}</p>
                                    )}
                                    {usernameAvailable === true && formData.usernamePrefix.length >= 3 && (
                                        <p className="text-xs text-emerald-600 mt-1 flex items-center gap-1">
                                            <CheckCircle className="h-3 w-3" />
                                            <span className="font-mono">{formData.usernamePrefix}@ms365.pro</span> is available!
                                        </p>
                                    )}
                                    <p className="text-xs text-slate-500 mt-1.5">
                                        Only lowercase letters, numbers, dots, hyphens, and underscores. Must start with a letter.
                                    </p>
                                </div>

                                {/* Name Row */}
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-2">
                                            First Name <span className="text-red-500">*</span>
                                        </label>
                                        <input
                                            type="text"
                                            name="firstName"
                                            value={formData.firstName}
                                            onChange={handleInputChange}
                                            placeholder="John"
                                            className={`w-full px-4 py-3 border-2 rounded-lg text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all ${errors.firstName ? 'border-red-400 bg-red-50' : 'border-slate-300'
                                                }`}
                                        />
                                        {errors.firstName && (
                                            <p className="text-xs text-red-600 mt-1">{errors.firstName}</p>
                                        )}
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-2">
                                            Last Name <span className="text-red-500">*</span>
                                        </label>
                                        <input
                                            type="text"
                                            name="lastName"
                                            value={formData.lastName}
                                            onChange={handleInputChange}
                                            placeholder="Doe"
                                            className={`w-full px-4 py-3 border-2 rounded-lg text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all ${errors.lastName ? 'border-red-400 bg-red-50' : 'border-slate-300'
                                                }`}
                                        />
                                        {errors.lastName && (
                                            <p className="text-xs text-red-600 mt-1">{errors.lastName}</p>
                                        )}
                                    </div>
                                </div>

                                {/* Email Preview */}
                                {orderStatus?.buyerEmail && (
                                    <div className="flex items-center gap-3 p-3 bg-slate-50 border border-slate-200 rounded-lg">
                                        <Mail className="h-4 w-4 text-slate-400 flex-shrink-0" />
                                        <div>
                                            <p className="text-xs text-slate-500">Notifications will be sent to</p>
                                            <p className="text-sm font-medium text-slate-700">{orderStatus.buyerEmail}</p>
                                        </div>
                                    </div>
                                )}

                                {/* Preview */}
                                {formData.usernamePrefix.length >= 3 && (
                                    <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg">
                                        <p className="text-sm text-blue-800 mb-1 font-medium">Your Office 365 email will be:</p>
                                        <p className="text-lg font-bold text-blue-900 font-mono">
                                            {formData.usernamePrefix}@ms365.pro
                                        </p>
                                    </div>
                                )}

                                {/* Submit Button */}
                                <button
                                    type="submit"
                                    disabled={isSubmitting || isCheckingUsername}
                                    className="w-full py-4 bg-[#0078D4] hover:bg-[#005A9E] text-white font-bold rounded-lg shadow-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-lg"
                                >
                                    {isSubmitting ? (
                                        <>
                                            <Loader2 className="h-5 w-5 animate-spin" />
                                            Submitting...
                                        </>
                                    ) : (
                                        <>
                                            <CheckCircle className="h-5 w-5" />
                                            Submit Customization Request
                                        </>
                                    )}
                                </button>

                                {/* What happens next */}
                                <div className="pt-4 border-t border-slate-200">
                                    <h4 className="font-medium text-slate-700 mb-3 text-sm">What happens next?</h4>
                                    <div className="space-y-2">
                                        <div className="flex items-start gap-2">
                                            <CheckCircle className="h-4 w-4 text-emerald-500 flex-shrink-0 mt-0.5" />
                                            <p className="text-sm text-slate-600">
                                                We will create your custom username within 24-48 hours
                                            </p>
                                        </div>
                                        <div className="flex items-start gap-2">
                                            <CheckCircle className="h-4 w-4 text-emerald-500 flex-shrink-0 mt-0.5" />
                                            <p className="text-sm text-slate-600">
                                                You will receive an email with your new login credentials
                                            </p>
                                        </div>
                                        <div className="flex items-start gap-2">
                                            <CheckCircle className="h-4 w-4 text-emerald-500 flex-shrink-0 mt-0.5" />
                                            <p className="text-sm text-slate-600">
                                                Your password remains the same (the one you changed on first login)
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </form>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

export default function RequestCustomizationPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen bg-slate-50 flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
            </div>
        }>
            <RequestCustomizationContent />
        </Suspense>
    );
}
