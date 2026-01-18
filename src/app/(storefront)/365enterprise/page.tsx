'use client';

import { useState } from 'react';
import { User, Building, Phone, Send, CheckCircle, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export default function Office365EnterprisePage() {
    const [formData, setFormData] = useState({
        orderId: '',
        displayName: '',
        firstName: '',
        lastName: '',
        address: '',
        phoneNumber: ''
    });
    const [isLoading, setIsLoading] = useState(false);
    const [isSubmitted, setIsSubmitted] = useState(false);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        setFormData(prev => ({
            ...prev,
            [e.target.name]: e.target.value
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!formData.orderId.trim() || !formData.displayName.trim()) {
            toast.error('Order ID and Display Name are required');
            return;
        }

        setIsLoading(true);

        try {
            const response = await fetch('/api/365enterprise', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData),
            });

            const data = await response.json();

            if (data.success) {
                setIsSubmitted(true);
                toast.success(data.message);
            } else {
                toast.error(data.error || 'Failed to submit request');
            }
        } catch (error) {
            console.error('365 Enterprise request error:', error);
            toast.error('Network error. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    if (isSubmitted) {
        return (
            <div className="min-h-screen bg-gradient-to-b from-[#0078D4] to-[#004080] flex items-center justify-center p-4">
                <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full text-center">
                    <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                        <CheckCircle className="w-10 h-10 text-green-600" />
                    </div>
                    <h1 className="text-2xl font-bold text-gray-900 mb-4">Request Submitted!</h1>
                    <p className="text-gray-600 mb-6">
                        Your Office 365 Enterprise account request has been received. We will create your customized account within 24 hours and send the credentials to your registered contact.
                    </p>
                    <div className="bg-gray-50 rounded-lg p-4 text-left">
                        <p className="text-sm text-gray-500 mb-1">Display Name</p>
                        <p className="text-gray-900 font-medium">{formData.displayName}</p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-b from-[#0078D4] to-[#004080]">
            {/* Header */}
            <div className="py-8">
                <div className="container mx-auto px-4 text-center">
                    <div className="flex items-center justify-center gap-3 mb-4">
                        <Building className="w-10 h-10 text-white" />
                        <h1 className="text-3xl font-bold text-white">Office 365 Enterprise</h1>
                    </div>
                    <p className="text-white/90">Enter your details to set up your Office 365 E5 account</p>
                </div>
            </div>

            <div className="container mx-auto px-4 py-8">
                <div className="max-w-lg mx-auto">
                    <div className="bg-white rounded-2xl shadow-2xl p-8">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="w-12 h-12 bg-[#0078D4] rounded-full flex items-center justify-center">
                                <User className="w-6 h-6 text-white" />
                            </div>
                            <div>
                                <h2 className="text-xl font-bold text-gray-900">Account Setup</h2>
                                <p className="text-sm text-gray-500">We&apos;ll create your licensed account</p>
                            </div>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-5">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Order ID / Secret Code *
                                </label>
                                <input
                                    type="text"
                                    name="orderId"
                                    value={formData.orderId}
                                    onChange={handleChange}
                                    placeholder="Enter your 15-17 digit code"
                                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-[#0078D4] focus:ring-2 focus:ring-[#0078D4]/20 outline-none transition text-gray-900 placeholder:text-gray-400"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Display Name *
                                </label>
                                <input
                                    type="text"
                                    name="displayName"
                                    value={formData.displayName}
                                    onChange={handleChange}
                                    placeholder="How your name appears in Office 365"
                                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-[#0078D4] focus:ring-2 focus:ring-[#0078D4]/20 outline-none transition text-gray-900 placeholder:text-gray-400"
                                    required
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        First Name
                                    </label>
                                    <input
                                        type="text"
                                        name="firstName"
                                        value={formData.firstName}
                                        onChange={handleChange}
                                        placeholder="First name"
                                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-[#0078D4] focus:ring-2 focus:ring-[#0078D4]/20 outline-none transition text-gray-900 placeholder:text-gray-400"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Last Name
                                    </label>
                                    <input
                                        type="text"
                                        name="lastName"
                                        value={formData.lastName}
                                        onChange={handleChange}
                                        placeholder="Last name"
                                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-[#0078D4] focus:ring-2 focus:ring-[#0078D4]/20 outline-none transition text-gray-900 placeholder:text-gray-400"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    <Phone className="w-4 h-4 inline mr-1" />
                                    Phone Number
                                </label>
                                <input
                                    type="tel"
                                    name="phoneNumber"
                                    value={formData.phoneNumber}
                                    onChange={handleChange}
                                    placeholder="+91 XXXXX XXXXX"
                                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-[#0078D4] focus:ring-2 focus:ring-[#0078D4]/20 outline-none transition text-gray-900 placeholder:text-gray-400"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Address
                                </label>
                                <textarea
                                    name="address"
                                    value={formData.address}
                                    onChange={handleChange}
                                    placeholder="Your address (optional)"
                                    rows={2}
                                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-[#0078D4] focus:ring-2 focus:ring-[#0078D4]/20 outline-none transition text-gray-900 placeholder:text-gray-400 resize-none"
                                />
                            </div>

                            <button
                                type="submit"
                                disabled={isLoading}
                                className="w-full bg-[#0078D4] hover:bg-[#005a9e] text-white py-4 rounded-xl font-bold text-lg shadow-lg transition disabled:opacity-50 flex items-center justify-center gap-2"
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
                                <a href="mailto:support@simplysolutions.store" className="text-[#0078D4] hover:underline">
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
