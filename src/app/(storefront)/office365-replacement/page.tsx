'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Loader2, CreditCard, CheckCircle, AlertTriangle, Copy, Key, ArrowRight, Shield } from 'lucide-react';
import { toast } from 'sonner';

declare global {
    interface Window {
        Razorpay: any;
    }
}

// Test Razorpay Key ID
const RAZORPAY_KEY_ID = 'rzp_test_S7h0MP2TLUZGwK';

// Product information
const PRODUCT_NAME = 'Microsoft Office 365 Pro Plus (5 Users, Lifetime Validity) with 100GB Cloud Storage';
const PRODUCT_IMAGE = 'https://api.simplysolutions.co.in/storage/v1/object/public/product-assets/product-images/OFFICE365.jpg';

export default function Office365ReplacementPage() {
    const router = useRouter();
    const [isProcessing, setIsProcessing] = useState(false);
    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
    });
    const [errors, setErrors] = useState<Record<string, string>>({});

    // Success state with countdown
    const [paymentSuccess, setPaymentSuccess] = useState(false);
    const [secretCode, setSecretCode] = useState('');
    const [countdown, setCountdown] = useState(30);
    const [copied, setCopied] = useState(false);

    // Load Razorpay script
    useEffect(() => {
        const script = document.createElement('script');
        script.src = 'https://checkout.razorpay.com/v1/checkout.js';
        script.async = true;
        document.body.appendChild(script);
        return () => {
            if (document.body.contains(script)) {
                document.body.removeChild(script);
            }
        };
    }, []);

    // Countdown effect for success page
    useEffect(() => {
        if (paymentSuccess && countdown > 0) {
            const timer = setTimeout(() => {
                setCountdown(countdown - 1);
            }, 1000);
            return () => clearTimeout(timer);
        } else if (paymentSuccess && countdown === 0) {
            router.push(`/activate?code=${secretCode}`);
        }
    }, [paymentSuccess, countdown, secretCode, router]);

    const validateForm = () => {
        const newErrors: Record<string, string> = {};

        if (!formData.firstName.trim()) {
            newErrors.firstName = 'First name is required';
        }
        if (!formData.lastName.trim()) {
            newErrors.lastName = 'Last name is required';
        }
        if (!formData.email.trim()) {
            newErrors.email = 'Email is required';
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
            newErrors.email = 'Please enter a valid email';
        }
        if (!formData.phone.trim()) {
            newErrors.phone = 'Phone number is required';
        } else if (!/^[6-9]\d{9}$/.test(formData.phone.replace(/\s/g, ''))) {
            newErrors.phone = 'Please enter a valid 10-digit Indian mobile number';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        if (errors[name]) {
            setErrors(prev => ({ ...prev, [name]: '' }));
        }
    };

    const copySecretCode = () => {
        navigator.clipboard.writeText(secretCode);
        setCopied(true);
        toast.success('Secret code copied!');
        setTimeout(() => setCopied(false), 2000);
    };

    const handlePayment = async () => {
        if (!validateForm()) {
            toast.error('Please fill in all required fields correctly');
            return;
        }

        setIsProcessing(true);

        try {
            const res = await fetch('/api/office365-replacement/create-order', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    firstName: formData.firstName.trim(),
                    lastName: formData.lastName.trim(),
                    email: formData.email.trim(),
                    phone: formData.phone.trim(),
                }),
            });

            const result = await res.json();

            if (!result.success) {
                throw new Error(result.error || 'Failed to create order');
            }

            const options = {
                key: RAZORPAY_KEY_ID,
                amount: result.data.amount,
                currency: result.data.currency,
                name: 'SimplySolutions',
                description: 'Office 365 Pro Plus - Replacement',
                order_id: result.data.razorpayOrderId,
                prefill: {
                    name: `${formData.firstName} ${formData.lastName}`,
                    email: formData.email,
                    contact: formData.phone,
                },
                theme: {
                    color: '#232F3E',
                },
                handler: async function (response: any) {
                    try {
                        const verifyRes = await fetch('/api/office365-replacement/verify-payment', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                                razorpay_order_id: response.razorpay_order_id,
                                razorpay_payment_id: response.razorpay_payment_id,
                                razorpay_signature: response.razorpay_signature,
                                firstName: formData.firstName.trim(),
                                lastName: formData.lastName.trim(),
                                email: formData.email.trim(),
                                phone: formData.phone.trim(),
                            }),
                        });

                        const verifyResult = await verifyRes.json();

                        if (verifyResult.success) {
                            setSecretCode(verifyResult.data.secretCode);
                            setPaymentSuccess(true);
                            toast.success('Payment successful!');
                        } else {
                            toast.error(verifyResult.error || 'Payment verification failed');
                            setIsProcessing(false);
                        }
                    } catch (error) {
                        console.error('Verification error:', error);
                        toast.error('Payment verification failed. Please contact support.');
                        setIsProcessing(false);
                    }
                },
                modal: {
                    ondismiss: function () {
                        setIsProcessing(false);
                    },
                },
            };

            const razorpay = new window.Razorpay(options);
            razorpay.open();
        } catch (error) {
            console.error('Payment error:', error);
            toast.error(error instanceof Error ? error.message : 'Payment failed');
            setIsProcessing(false);
        }
    };

    // Success Screen - Show for 30 seconds before redirect
    if (paymentSuccess) {
        return (
            <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 flex items-center justify-center p-4">
                <div className="max-w-lg w-full">
                    {/* Success Card */}
                    <div className="bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
                        {/* Success Header */}
                        <div className="bg-gradient-to-r from-emerald-600 to-emerald-500 px-6 py-8 text-center">
                            <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
                                <CheckCircle className="h-10 w-10 text-emerald-600" />
                            </div>
                            <h1 className="text-2xl font-bold text-white mb-2">Payment Successful</h1>
                            <p className="text-emerald-100">Your Office 365 replacement order is confirmed</p>
                        </div>

                        {/* Secret Code Section */}
                        <div className="p-6">
                            <div className="bg-amber-50 border border-amber-200 rounded-xl p-5 mb-6">
                                <div className="flex items-center gap-2 mb-3">
                                    <Key className="h-5 w-5 text-amber-700" />
                                    <h2 className="font-semibold text-amber-900">Your Secret Code</h2>
                                </div>
                                <p className="text-sm text-amber-700 mb-4">
                                    Save this code. You will need it to activate your Office 365.
                                </p>
                                <div className="flex items-center gap-2">
                                    <div className="flex-1 bg-white border-2 border-amber-300 rounded-lg p-4 font-mono text-xl font-bold text-center text-slate-900 tracking-wider">
                                        {secretCode}
                                    </div>
                                    <button
                                        onClick={copySecretCode}
                                        className={`p-4 rounded-lg border-2 transition-all ${copied
                                                ? 'bg-emerald-600 border-emerald-600 text-white'
                                                : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                                            }`}
                                        title="Copy code"
                                    >
                                        <Copy className="h-5 w-5" />
                                    </button>
                                </div>
                            </div>

                            {/* Email Confirmation */}
                            <div className="flex items-center gap-3 p-4 bg-blue-50 border border-blue-200 rounded-lg mb-6">
                                <CheckCircle className="h-5 w-5 text-blue-600 flex-shrink-0" />
                                <p className="text-sm text-blue-800">
                                    A confirmation email has been sent to <strong>{formData.email}</strong>
                                </p>
                            </div>

                            {/* Countdown & Action */}
                            <div className="text-center">
                                <p className="text-sm text-slate-500 mb-4">
                                    Redirecting to activation page in <span className="font-bold text-slate-700">{countdown}</span> seconds
                                </p>
                                <button
                                    onClick={() => router.push(`/activate?code=${secretCode}`)}
                                    className="w-full py-4 bg-slate-900 hover:bg-slate-800 text-white font-semibold rounded-lg transition-all flex items-center justify-center gap-2 text-lg"
                                >
                                    Go to Activation Now
                                    <ArrowRight className="h-5 w-5" />
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Razorpay Badge */}
                    <div className="flex justify-center mt-6 opacity-60">
                        <img
                            referrerPolicy="origin"
                            src="https://badges.razorpay.com/badge-dark.png"
                            style={{ height: '40px', width: '100px' }}
                            alt="Secured by Razorpay"
                        />
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100">
            {/* Header Banner */}
            <div className="bg-[#232F3E] py-5 border-b-4 border-[#FF9900]">
                <div className="container mx-auto px-4">
                    <h1 className="text-2xl md:text-3xl font-bold text-center text-white">
                        Microsoft Office 365
                    </h1>
                    <p className="text-center text-[#FF9900] text-sm mt-1 font-medium uppercase tracking-wide">
                        Replacement Purchase
                    </p>
                </div>
            </div>

            {/* Main Content */}
            <div className="container mx-auto px-4 py-8 md:py-12">
                <div className="max-w-xl mx-auto">
                    {/* Product Info Card */}
                    <div className="bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden mb-6">
                        <div className="bg-slate-50 px-6 py-4 border-b border-slate-200">
                            <h2 className="text-lg font-semibold text-slate-900">
                                Product Information
                            </h2>
                        </div>
                        <div className="p-6">
                            <div className="flex items-start gap-4">
                                <div className="w-24 h-24 bg-white rounded-lg flex items-center justify-center border border-slate-200 overflow-hidden flex-shrink-0">
                                    <Image
                                        src={PRODUCT_IMAGE}
                                        alt="Microsoft Office 365"
                                        width={96}
                                        height={96}
                                        className="object-contain"
                                        unoptimized
                                    />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="inline-block px-2 py-1 bg-orange-100 text-orange-700 text-xs font-semibold rounded mb-2 uppercase tracking-wide">
                                        Replacement
                                    </div>
                                    <h3 className="font-semibold text-slate-900 text-base leading-snug mb-3">
                                        {PRODUCT_NAME}
                                    </h3>
                                    <div className="flex items-baseline gap-2">
                                        <span className="text-2xl font-bold text-slate-900">₹499</span>
                                        <span className="text-sm text-slate-500">One-time payment</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Customer Form Card */}
                    <div className="bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden">
                        <div className="bg-slate-50 px-6 py-4 border-b border-slate-200">
                            <h2 className="text-lg font-semibold text-slate-900">Customer Information</h2>
                            <p className="text-sm text-slate-500 mt-1">
                                Please fill in your details to complete the replacement purchase
                            </p>
                        </div>

                        <div className="p-6 space-y-5">
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
                                        className={`w-full px-4 py-3 border rounded-lg text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all ${errors.firstName ? 'border-red-400 bg-red-50' : 'border-slate-300'
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
                                        className={`w-full px-4 py-3 border rounded-lg text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all ${errors.lastName ? 'border-red-400 bg-red-50' : 'border-slate-300'
                                            }`}
                                    />
                                    {errors.lastName && (
                                        <p className="text-xs text-red-600 mt-1">{errors.lastName}</p>
                                    )}
                                </div>
                            </div>

                            {/* Email */}
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-2">
                                    Email Address <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="email"
                                    name="email"
                                    value={formData.email}
                                    onChange={handleInputChange}
                                    placeholder="john.doe@example.com"
                                    className={`w-full px-4 py-3 border rounded-lg text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all ${errors.email ? 'border-red-400 bg-red-50' : 'border-slate-300'
                                        }`}
                                />
                                {errors.email && (
                                    <p className="text-xs text-red-600 mt-1">{errors.email}</p>
                                )}
                                <p className="text-xs text-slate-500 mt-1.5">
                                    Your secret code will be sent to this email
                                </p>
                            </div>

                            {/* Phone */}
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-2">
                                    Phone Number <span className="text-red-500">*</span>
                                </label>
                                <div className="flex">
                                    <span className="inline-flex items-center px-4 border border-r-0 border-slate-300 rounded-l-lg bg-slate-50 text-slate-500 text-sm">
                                        +91
                                    </span>
                                    <input
                                        type="tel"
                                        name="phone"
                                        value={formData.phone}
                                        onChange={handleInputChange}
                                        placeholder="9876543210"
                                        maxLength={10}
                                        className={`flex-1 px-4 py-3 border rounded-r-lg text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all ${errors.phone ? 'border-red-400 bg-red-50' : 'border-slate-300'
                                            }`}
                                    />
                                </div>
                                {errors.phone && (
                                    <p className="text-xs text-red-600 mt-1">{errors.phone}</p>
                                )}
                            </div>

                            {/* Important Notice */}
                            <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
                                <div className="flex items-start gap-3">
                                    <AlertTriangle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
                                    <div>
                                        <h4 className="font-semibold text-amber-800 mb-2">Important: After Activation</h4>
                                        <ul className="text-sm text-amber-700 space-y-1.5">
                                            <li className="flex items-start gap-2">
                                                <span className="text-amber-600 mt-1">•</span>
                                                <span>
                                                    <strong>Set up security info:</strong> Visit{' '}
                                                    <a
                                                        href="https://mysignins.microsoft.com/security-info"
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="text-blue-600 underline hover:text-blue-800"
                                                    >
                                                        mysignins.microsoft.com/security-info
                                                    </a>{' '}
                                                    to link your email and phone for account recovery.
                                                </span>
                                            </li>
                                            <li className="flex items-start gap-2">
                                                <span className="text-amber-600 mt-1">•</span>
                                                <span>
                                                    <strong>Save your password:</strong> Store it securely. We cannot recover it.
                                                </span>
                                            </li>
                                        </ul>
                                    </div>
                                </div>
                            </div>

                            {/* Pay Button */}
                            <button
                                onClick={handlePayment}
                                disabled={isProcessing}
                                className="w-full py-4 bg-[#FFD814] hover:bg-[#F7CA00] active:bg-[#E7B800] text-slate-900 font-bold rounded-lg shadow-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-lg"
                            >
                                {isProcessing ? (
                                    <>
                                        <Loader2 className="h-5 w-5 animate-spin" />
                                        Processing...
                                    </>
                                ) : (
                                    <>
                                        <CreditCard className="h-5 w-5" />
                                        Pay ₹499
                                    </>
                                )}
                            </button>

                            {/* Security Badge */}
                            <div className="flex items-center justify-center gap-2 text-slate-400 text-xs">
                                <Shield className="h-4 w-4" />
                                <span>Secured by Razorpay | 256-bit SSL encryption</span>
                            </div>

                            {/* What happens next */}
                            <div className="pt-4 border-t border-slate-200">
                                <h4 className="font-medium text-slate-700 mb-3 text-sm">What happens next?</h4>
                                <div className="space-y-2">
                                    <div className="flex items-start gap-2">
                                        <CheckCircle className="h-4 w-4 text-emerald-500 flex-shrink-0 mt-0.5" />
                                        <p className="text-sm text-slate-600">
                                            After payment, you will receive a unique 15-digit secret code
                                        </p>
                                    </div>
                                    <div className="flex items-start gap-2">
                                        <CheckCircle className="h-4 w-4 text-emerald-500 flex-shrink-0 mt-0.5" />
                                        <p className="text-sm text-slate-600">
                                            You will be redirected to the activation page automatically
                                        </p>
                                    </div>
                                    <div className="flex items-start gap-2">
                                        <CheckCircle className="h-4 w-4 text-emerald-500 flex-shrink-0 mt-0.5" />
                                        <p className="text-sm text-slate-600">
                                            Use the secret code to generate your Office 365 license
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Razorpay Badge */}
                    <div className="flex justify-center mt-6 opacity-60">
                        <a href="https://razorpay.com/" target="_blank" rel="noopener noreferrer">
                            <img
                                referrerPolicy="origin"
                                src="https://badges.razorpay.com/badge-dark.png"
                                style={{ height: '40px', width: '100px' }}
                                alt="Secured by Razorpay"
                            />
                        </a>
                    </div>
                </div>
            </div>
        </div>
    );
}
