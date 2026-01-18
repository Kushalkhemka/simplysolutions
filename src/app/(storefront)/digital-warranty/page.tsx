'use client';

import { useState, useRef } from 'react';
import { Shield, Upload, CheckCircle, Loader2, X, Clock, XCircle } from 'lucide-react';
import { toast } from 'sonner';
import Image from 'next/image';

export default function DigitalWarrantyPage() {
    const [orderId, setOrderId] = useState('');
    const [contact, setContact] = useState('');
    const [sellerFeedback, setSellerFeedback] = useState<File | null>(null);
    const [productReview, setProductReview] = useState<File | null>(null);
    const [sellerPreview, setSellerPreview] = useState<string | null>(null);
    const [reviewPreview, setReviewPreview] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [isSubmitted, setIsSubmitted] = useState(false);
    const [existingStatus, setExistingStatus] = useState<string | null>(null);

    const sellerInputRef = useRef<HTMLInputElement>(null);
    const reviewInputRef = useRef<HTMLInputElement>(null);

    const handleFileChange = (type: 'seller' | 'review', file: File | null) => {
        if (file) {
            const previewUrl = URL.createObjectURL(file);
            if (type === 'seller') {
                setSellerFeedback(file);
                setSellerPreview(previewUrl);
            } else {
                setProductReview(file);
                setReviewPreview(previewUrl);
            }
        }
    };

    const clearFile = (type: 'seller' | 'review') => {
        if (type === 'seller') {
            setSellerFeedback(null);
            setSellerPreview(null);
            if (sellerInputRef.current) sellerInputRef.current.value = '';
        } else {
            setProductReview(null);
            setReviewPreview(null);
            if (reviewInputRef.current) reviewInputRef.current.value = '';
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!orderId.trim()) {
            toast.error('Please enter your Order ID');
            return;
        }

        if (!sellerFeedback || !productReview) {
            toast.error('Please upload both screenshots');
            return;
        }

        setIsLoading(true);

        try {
            const formData = new FormData();
            formData.append('orderId', orderId.trim());
            formData.append('contact', contact.trim());
            formData.append('screenshotSellerFeedback', sellerFeedback);
            formData.append('screenshotProductReview', productReview);

            const response = await fetch('/api/warranty', {
                method: 'POST',
                body: formData,
            });

            const data = await response.json();

            if (data.success) {
                setIsSubmitted(true);
                setExistingStatus(data.status);
                toast.success(data.message);
            } else {
                toast.error(data.error || 'Failed to submit warranty');
            }
        } catch (error) {
            console.error('Warranty submission error:', error);
            toast.error('Network error. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'VERIFIED':
                return <CheckCircle className="w-10 h-10 text-green-600" />;
            case 'REJECTED':
                return <XCircle className="w-10 h-10 text-red-600" />;
            default:
                return <Clock className="w-10 h-10 text-yellow-600" />;
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'VERIFIED':
                return 'bg-green-100';
            case 'REJECTED':
                return 'bg-red-100';
            default:
                return 'bg-yellow-100';
        }
    };

    if (isSubmitted) {
        return (
            <div className="min-h-screen bg-gradient-to-b from-[#232F3E] to-[#131921] flex items-center justify-center p-4">
                <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full text-center">
                    <div className={`w-20 h-20 ${getStatusColor(existingStatus || 'PROCESSING')} rounded-full flex items-center justify-center mx-auto mb-6`}>
                        {getStatusIcon(existingStatus || 'PROCESSING')}
                    </div>
                    <h1 className="text-2xl font-bold text-gray-900 mb-4">
                        {existingStatus === 'VERIFIED' ? 'Warranty Verified!' :
                            existingStatus === 'REJECTED' ? 'Warranty Rejected' :
                                'Warranty Submitted!'}
                    </h1>
                    <p className="text-gray-600 mb-6">
                        {existingStatus === 'VERIFIED'
                            ? 'Your warranty has been verified. You are now covered!'
                            : existingStatus === 'REJECTED'
                                ? 'Unfortunately, your warranty could not be verified. Please contact support.'
                                : 'Your warranty registration has been submitted. We will verify within 24 hours.'}
                    </p>
                    <div className="bg-gray-50 rounded-lg p-4 text-left">
                        <p className="text-sm text-gray-500 mb-1">Order ID</p>
                        <p className="text-gray-900 font-medium">{orderId}</p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-b from-[#232F3E] to-[#131921]">
            {/* Header */}
            <div className="bg-[#232F3E] py-6 border-b border-[#3B4859]">
                <div className="container mx-auto px-4 text-center">
                    <div className="flex items-center justify-center gap-3 mb-2">
                        <Shield className="w-8 h-8 text-[#FF9900]" />
                        <h1 className="text-3xl font-bold text-white">Digital Warranty</h1>
                    </div>
                    <p className="text-gray-300">Register your product warranty with screenshots</p>
                </div>
            </div>

            <div className="container mx-auto px-4 py-8">
                <div className="max-w-2xl mx-auto">
                    <div className="bg-white rounded-2xl shadow-2xl p-8">
                        {/* Instructions */}
                        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6">
                            <h3 className="font-semibold text-blue-900 mb-2">How to Register Warranty</h3>
                            <ol className="text-sm text-blue-800 space-y-1 list-decimal list-inside">
                                <li>Leave a <strong>Seller Feedback</strong> on Amazon</li>
                                <li>Write a <strong>Product Review</strong> on Amazon</li>
                                <li>Take screenshots of both and upload below</li>
                            </ol>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Order ID / Secret Code *
                                </label>
                                <input
                                    type="text"
                                    value={orderId}
                                    onChange={(e) => setOrderId(e.target.value)}
                                    placeholder="Enter your 15-17 digit code"
                                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-[#FF9900] focus:ring-2 focus:ring-[#FF9900]/20 outline-none transition text-gray-900 placeholder:text-gray-400"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Contact (Email or Phone)
                                </label>
                                <input
                                    type="text"
                                    value={contact}
                                    onChange={(e) => setContact(e.target.value)}
                                    placeholder="For warranty communication"
                                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-[#FF9900] focus:ring-2 focus:ring-[#FF9900]/20 outline-none transition text-gray-900 placeholder:text-gray-400"
                                />
                            </div>

                            {/* Screenshot Uploads */}
                            <div className="grid md:grid-cols-2 gap-4">
                                {/* Seller Feedback */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Seller Feedback Screenshot *
                                    </label>
                                    <div className="relative">
                                        {sellerPreview ? (
                                            <div className="relative border-2 border-green-500 rounded-xl overflow-hidden">
                                                <Image
                                                    src={sellerPreview}
                                                    alt="Seller feedback"
                                                    width={300}
                                                    height={200}
                                                    className="w-full h-40 object-cover"
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => clearFile('seller')}
                                                    className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full"
                                                >
                                                    <X className="w-4 h-4" />
                                                </button>
                                            </div>
                                        ) : (
                                            <label className="flex flex-col items-center justify-center h-40 border-2 border-dashed border-gray-300 rounded-xl cursor-pointer hover:border-[#FF9900] transition">
                                                <Upload className="w-8 h-8 text-gray-400" />
                                                <span className="text-sm text-gray-500 mt-2">Upload Screenshot</span>
                                                <input
                                                    ref={sellerInputRef}
                                                    type="file"
                                                    accept="image/*"
                                                    onChange={(e) => handleFileChange('seller', e.target.files?.[0] || null)}
                                                    className="hidden"
                                                />
                                            </label>
                                        )}
                                    </div>
                                </div>

                                {/* Product Review */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Product Review Screenshot *
                                    </label>
                                    <div className="relative">
                                        {reviewPreview ? (
                                            <div className="relative border-2 border-green-500 rounded-xl overflow-hidden">
                                                <Image
                                                    src={reviewPreview}
                                                    alt="Product review"
                                                    width={300}
                                                    height={200}
                                                    className="w-full h-40 object-cover"
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => clearFile('review')}
                                                    className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full"
                                                >
                                                    <X className="w-4 h-4" />
                                                </button>
                                            </div>
                                        ) : (
                                            <label className="flex flex-col items-center justify-center h-40 border-2 border-dashed border-gray-300 rounded-xl cursor-pointer hover:border-[#FF9900] transition">
                                                <Upload className="w-8 h-8 text-gray-400" />
                                                <span className="text-sm text-gray-500 mt-2">Upload Screenshot</span>
                                                <input
                                                    ref={reviewInputRef}
                                                    type="file"
                                                    accept="image/*"
                                                    onChange={(e) => handleFileChange('review', e.target.files?.[0] || null)}
                                                    className="hidden"
                                                />
                                            </label>
                                        )}
                                    </div>
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={isLoading}
                                className="w-full bg-gradient-to-b from-[#f7dfa5] to-[#f0c14b] hover:from-[#f0c14b] hover:to-[#e0a800] text-gray-900 py-4 rounded-xl font-bold text-lg shadow-lg border border-[#a88734] transition disabled:opacity-50 flex items-center justify-center gap-2"
                            >
                                {isLoading ? (
                                    <>
                                        <Loader2 className="w-5 h-5 animate-spin" />
                                        Submitting...
                                    </>
                                ) : (
                                    <>
                                        <Shield className="w-5 h-5" />
                                        Register Warranty
                                    </>
                                )}
                            </button>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
}
