'use client';

import { useState } from 'react';
import { Mail, Send, CheckCircle, Loader2, Palette } from 'lucide-react';
import { toast } from 'sonner';

export default function CanvaPage() {
    const [orderId, setOrderId] = useState('');
    const [email, setEmail] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isSubmitted, setIsSubmitted] = useState(false);

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
                    requestType: 'canva'
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
            console.error('Canva request error:', error);
            toast.error('Network error. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    if (isSubmitted) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-purple-600 via-pink-500 to-orange-400 flex items-center justify-center p-4">
                <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full text-center">
                    <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                        <CheckCircle className="w-10 h-10 text-green-600" />
                    </div>
                    <h1 className="text-2xl font-bold text-gray-900 mb-4">Request Submitted!</h1>
                    <p className="text-gray-600 mb-6">
                        Your Canva Pro subscription request has been received. We will process it within 24 hours and send the subscription details to your email.
                    </p>
                    <div className="bg-gray-50 rounded-lg p-4 text-left">
                        <p className="text-sm text-gray-500 mb-1">Email</p>
                        <p className="text-gray-900 font-medium">{email}</p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-purple-600 via-pink-500 to-orange-400">
            {/* Header */}
            <div className="py-8">
                <div className="container mx-auto px-4 text-center">
                    <div className="flex items-center justify-center gap-3 mb-4">
                        <Palette className="w-10 h-10 text-white" />
                        <h1 className="text-4xl font-bold text-white">Canva Pro</h1>
                    </div>
                    <p className="text-white/90 text-lg">Enter your details to receive your Canva Pro subscription</p>
                </div>
            </div>

            <div className="container mx-auto px-4 py-8">
                <div className="max-w-md mx-auto">
                    <div className="bg-white rounded-2xl shadow-2xl p-8">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                                <Mail className="w-6 h-6 text-white" />
                            </div>
                            <div>
                                <h2 className="text-xl font-bold text-gray-900">Request Canva Pro</h2>
                                <p className="text-sm text-gray-500">Subscription will be sent to your email</p>
                            </div>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Order ID / Secret Code
                                </label>
                                <input
                                    type="text"
                                    value={orderId}
                                    onChange={(e) => setOrderId(e.target.value)}
                                    placeholder="Enter your 15-17 digit code"
                                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 outline-none transition text-gray-900 placeholder:text-gray-400"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Email Address
                                </label>
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="your@email.com"
                                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 outline-none transition text-gray-900 placeholder:text-gray-400"
                                />
                                <p className="text-xs text-gray-500 mt-2">
                                    Your Canva Pro subscription details will be sent to this email
                                </p>
                            </div>

                            <button
                                type="submit"
                                disabled={isLoading}
                                className="w-full bg-gradient-to-r from-purple-600 to-pink-500 hover:from-purple-700 hover:to-pink-600 text-white py-4 rounded-xl font-bold text-lg shadow-lg transition disabled:opacity-50 flex items-center justify-center gap-2"
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

                        <div className="mt-6 pt-6 border-t border-gray-200">
                            <p className="text-sm text-gray-500 text-center">
                                Need help? Contact us at{' '}
                                <a href="mailto:support@simplysolutions.store" className="text-purple-600 hover:underline">
                                    support@simplysolutions.store
                                </a>
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
