'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Mail, Send, CheckCircle, Loader2, ShoppingCart, HelpCircle, Package, Phone } from 'lucide-react';
import { toast } from 'sonner';
import { CustomerPushAutoPrompt } from '@/components/notifications/CustomerPushOptIn';

function AutoCADContent() {
    const searchParams = useSearchParams();
    const [orderId, setOrderId] = useState('');
    const [email, setEmail] = useState('');
    const [phone, setPhone] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isSubmitted, setIsSubmitted] = useState(false);

    // Auto-fill order ID from query parameter
    useEffect(() => {
        const orderIdParam = searchParams.get('orderId');
        if (orderIdParam) {
            setOrderId(orderIdParam);
            toast.info('Order ID filled from your previous entry');
        }
    }, [searchParams]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!orderId.trim() || !email.trim()) {
            toast.error('Please fill in all fields');
            return;
        }

        if (!/\S+@\S+\.\S+/.test(email)) {
            toast.error('Please enter a valid email address');
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
                    requestType: 'autocad',
                    mobileNumber: phone.trim() || null
                }),
            });

            const data = await response.json();

            if (data.success) {
                setIsSubmitted(true);
                toast.success(data.message);
            } else {
                toast.error(data.error || 'Failed to submit request');
            }
        } catch (error) {
            console.error('AutoCAD request error:', error);
            toast.error('Network error. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    if (isSubmitted) {
        return (
            <div className="min-h-screen bg-[#EAEDED]">
                {/* Push notification prompt */}
                <CustomerPushAutoPrompt orderId={orderId} requestType="product_request" />
                {/* Success Banner */}
                <div className="bg-[#067D62] text-white py-3 px-4">
                    <div className="container-dense flex items-center justify-center gap-2 text-sm font-medium">
                        <CheckCircle className="w-5 h-5" />
                        <span className="font-bold">Success!</span>
                        <span className="hidden sm:inline">Your AutoCAD request has been submitted</span>
                    </div>
                </div>

                {/* Amazon-style Header Banner */}
                <div className="bg-[#232F3E] py-4 border-b-4 border-[#FF9900]">
                    <div className="container-dense">
                        <div className="flex items-center justify-center gap-3 mb-1">
                            <Package className="w-6 h-6 text-[#FF9900]" />
                            <h1 className="text-2xl md:text-3xl font-bold text-center text-white uppercase tracking-wider">
                                AutoCAD Subscription
                            </h1>
                        </div>
                        <p className="text-center text-[#FF9900] text-sm font-medium">
                            Request Submitted Successfully
                        </p>
                    </div>
                </div>

                <div className="container-dense py-8 md:py-12">
                    <div className="max-w-2xl mx-auto">
                        <div className="bg-white rounded-lg shadow-lg border border-[#DDD] overflow-hidden">
                            <div className="p-6">
                                <div className="bg-[#F7F8FA] rounded-lg border border-[#DDD] p-6">
                                    <div className="flex items-center gap-3 mb-4">
                                        <div className="w-12 h-12 bg-[#067D62] rounded-full flex items-center justify-center">
                                            <CheckCircle className="w-6 h-6 text-white" />
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-[#0F1111]">Request Submitted!</h3>
                                            <p className="text-sm text-[#565959]">We&apos;ll process your request within 24 hours</p>
                                        </div>
                                    </div>

                                    <div className="bg-[#FCF5EE] border-2 border-[#FF9900] rounded-lg p-4 mb-4">
                                        <p className="text-sm text-[#0F1111]">
                                            Your AutoCAD subscription details will be sent to:
                                        </p>
                                        <p className="font-bold text-[#0F1111] mt-1">{email}</p>
                                    </div>

                                    <p className="text-sm text-[#565959]">
                                        Please check your email (including spam folder) within 24 hours for your AutoCAD subscription details.
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Support Card */}
                        <div className="mt-6 bg-white rounded-lg shadow border border-[#DDD] overflow-hidden">
                            <div className="bg-[#FEF8F2] border-l-4 border-[#FF9900] p-4">
                                <p className="text-sm text-[#0F1111]">
                                    <span className="font-bold">Need Help?</span> Contact us on WhatsApp:{' '}
                                    <a
                                        href="https://wa.me/918178848830"
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="font-bold text-[#007185] hover:text-[#C7511F] hover:underline"
                                    >
                                        +91 8178848830
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

    return (
        <div className="min-h-screen bg-[#EAEDED]">
            {/* Amazon-style Header Banner */}
            <div className="bg-[#232F3E] py-4 border-b-4 border-[#FF9900]">
                <div className="container-dense">
                    <div className="flex items-center justify-center gap-3 mb-1">
                        <Package className="w-6 h-6 text-[#FF9900]" />
                        <h1 className="text-2xl md:text-3xl font-bold text-center text-white uppercase tracking-wider">
                            AutoCAD Subscription
                        </h1>
                    </div>
                    <p className="text-center text-[#FF9900] text-sm font-medium">
                        For Amazon.in Customers
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
                                How It Works
                            </h3>
                        </div>
                        <div className="p-4">
                            <ol className="space-y-2 text-sm text-[#0F1111]">
                                <li className="flex gap-2">
                                    <span className="font-bold text-[#FF9900]">1.</span>
                                    <span>Enter your <strong>Secret Code</strong> or <strong>Amazon Order ID</strong> from your purchase</span>
                                </li>
                                <li className="flex gap-2">
                                    <span className="font-bold text-[#FF9900]">2.</span>
                                    <span>Provide your <strong className="text-[#CC0C39]">Email Address</strong> where you want to receive the subscription</span>
                                </li>
                                <li className="flex gap-2">
                                    <span className="font-bold text-[#FF9900]">3.</span>
                                    <span>We will process your request and send the AutoCAD subscription details within <strong>24 hours</strong></span>
                                </li>
                            </ol>
                        </div>
                    </div>

                    {/* Main Form Card */}
                    <div className="bg-white rounded-lg shadow-lg border border-[#DDD] overflow-hidden">
                        {/* Card Header */}
                        <div className="bg-gradient-to-b from-[#F7F8FA] to-[#E7E9EC] px-6 py-4 border-b border-[#DDD]">
                            <h2 className="text-lg font-bold text-[#0F1111]">Request AutoCAD Subscription</h2>
                            <p className="text-sm text-[#565959] mt-1">
                                Fill in your details below to receive your AutoCAD subscription
                            </p>
                        </div>

                        <div className="p-6">
                            <form onSubmit={handleSubmit} className="space-y-5">
                                {/* Order ID Input */}
                                <div>
                                    <label className="block text-sm font-bold text-[#0F1111] mb-2">
                                        SECRET CODE / AMAZON ORDER ID
                                    </label>
                                    <div className="flex">
                                        <div className="bg-[#F0F2F2] border border-r-0 border-[#888C8C] rounded-l px-3 flex items-center">
                                            <ShoppingCart className="w-5 h-5 text-[#FF9900]" />
                                        </div>
                                        <input
                                            type="text"
                                            value={orderId}
                                            onChange={(e) => setOrderId(e.target.value)}
                                            placeholder="e.g. 534643897517291 or 408-1234567-1234567"
                                            maxLength={25}
                                            className="flex-1 px-4 py-3 border border-[#888C8C] rounded-r text-base font-mono text-[#0F1111] bg-white focus:outline-none focus:ring-2 focus:ring-[#FF9900] focus:border-[#FF9900] placeholder:text-[#6B7280]"
                                        />
                                    </div>
                                    <p className="text-xs text-[#565959] mt-1">
                                        Enter your 15-digit secret code OR Amazon Order ID (format: 408-1234567-1234567)
                                    </p>
                                </div>

                                {/* Email Input */}
                                <div>
                                    <label className="block text-sm font-bold text-[#0F1111] mb-2">
                                        EMAIL ADDRESS
                                    </label>
                                    <div className="flex">
                                        <div className="bg-[#F0F2F2] border border-r-0 border-[#888C8C] rounded-l px-3 flex items-center">
                                            <Mail className="w-5 h-5 text-[#FF9900]" />
                                        </div>
                                        <input
                                            type="email"
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            placeholder="your@email.com"
                                            className="flex-1 px-4 py-3 border border-[#888C8C] rounded-r text-base text-[#0F1111] bg-white focus:outline-none focus:ring-2 focus:ring-[#FF9900] focus:border-[#FF9900] placeholder:text-[#6B7280]"
                                        />
                                    </div>
                                    <p className="text-xs text-[#CC0C39] mt-1">
                                        <strong>Important:</strong> Your AutoCAD subscription details will be sent to this email
                                    </p>
                                </div>

                                {/* WhatsApp Phone Input */}
                                <div>
                                    <label className="block text-sm font-bold text-[#0F1111] mb-2">
                                        WHATSAPP NUMBER <span className="text-[#565959] font-normal">(Optional)</span>
                                    </label>
                                    <div className="flex">
                                        <div className="bg-[#F0F2F2] border border-r-0 border-[#888C8C] rounded-l px-3 flex items-center">
                                            <Phone className="w-5 h-5 text-[#067D62]" />
                                        </div>
                                        <input
                                            type="tel"
                                            value={phone}
                                            onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                                            placeholder="10-digit WhatsApp number"
                                            maxLength={10}
                                            className="flex-1 px-4 py-3 border border-[#888C8C] rounded-r text-base font-mono text-[#0F1111] bg-white focus:outline-none focus:ring-2 focus:ring-[#067D62] focus:border-[#067D62] placeholder:text-[#6B7280]"
                                        />
                                    </div>
                                    <p className="text-xs text-[#565959] mt-1">
                                        We'll notify you on WhatsApp when your subscription is ready
                                    </p>
                                </div>

                                {/* Submit Button */}
                                <button
                                    type="submit"
                                    disabled={isLoading || !orderId.trim() || !email.trim()}
                                    className="w-full py-3 bg-gradient-to-b from-[#FFD814] to-[#F7CA00] hover:from-[#F7CA00] hover:to-[#E7B800] disabled:from-[#E7E9EC] disabled:to-[#D5D9D9] text-[#0F1111] disabled:text-[#565959] font-bold rounded-lg border border-[#FCD200] disabled:border-[#D5D9D9] shadow-sm transition-all disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                >
                                    {isLoading ? (
                                        <>
                                            <Loader2 className="w-5 h-5 animate-spin" />
                                            Submitting...
                                        </>
                                    ) : (
                                        <>
                                            <Send className="w-5 h-5" />
                                            Submit Request
                                        </>
                                    )}
                                </button>
                            </form>
                        </div>
                    </div>

                    {/* Support Card */}
                    <div className="mt-6 bg-white rounded-lg shadow border border-[#DDD] overflow-hidden">
                        <div className="bg-[#FEF8F2] border-l-4 border-[#FF9900] p-4">
                            <p className="text-sm text-[#0F1111]">
                                <span className="font-bold">Need Help?</span> Contact us on WhatsApp:{' '}
                                <a
                                    href="https://wa.me/918178848830"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="font-bold text-[#007185] hover:text-[#C7511F] hover:underline"
                                >
                                    +91 8178848830
                                </a>
                                {' '}(message only)
                            </p>
                        </div>
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

export default function AutoCADPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen bg-[#EAEDED] flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-[#FF9900]" />
            </div>
        }>
            <AutoCADContent />
        </Suspense>
    );
}
