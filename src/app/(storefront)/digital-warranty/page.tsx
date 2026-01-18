'use client';

import { useState, useRef } from 'react';
import { Shield, Upload, CheckCircle, Loader2, X, Clock, XCircle, Search, ExternalLink, Star, ArrowRight, Award, Gift } from 'lucide-react';
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
            <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white flex items-center justify-center p-4">
                <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full text-center border border-gray-100">
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
        <div className="min-h-screen bg-gray-50">
            {/* Hero Header */}
            <div className="bg-white border-b border-gray-200 py-8">
                <div className="container mx-auto px-4 text-center">
                    <h1 className="text-3xl md:text-4xl font-bold text-gray-900 tracking-tight mb-3">
                        WARRANTY REGISTRATION
                    </h1>
                    <p className="text-gray-600 max-w-2xl mx-auto">
                        Please follow the below Steps &amp; Enter your Amazon Order ID &amp; Upload Screenshot of Ratings to Get <span className="font-semibold text-red-600">Lifetime Technical/Installation Support</span>.
                    </p>
                </div>
            </div>

            <div className="container mx-auto px-4 py-8">
                <div className="max-w-4xl mx-auto">

                    {/* Step-by-Step Instructions */}
                    <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 md:p-8 mb-8">
                        <div className="grid md:grid-cols-2 gap-6">
                            {/* Step 1: Seller Feedback */}
                            <div className="bg-gradient-to-br from-red-50 to-orange-50 rounded-xl p-5 border border-red-100">
                                <div className="flex items-start gap-3 mb-3">
                                    <div className="w-8 h-8 rounded-full bg-red-500 text-white flex items-center justify-center font-bold text-sm flex-shrink-0">
                                        1
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-gray-900 text-lg">SELLER FEEDBACK</h3>
                                        <p className="text-sm text-gray-600 mt-1">
                                            Do the 5 star seller feedback if you have liked the service. (If not, then <a href="https://wa.me/918595899215" target="_blank" rel="noopener noreferrer" className="text-red-600 underline font-medium">contact us</a> we will make it right)
                                        </p>
                                    </div>
                                </div>
                                <a
                                    href="https://www.amazon.in/sp?ie=UTF8&seller=AZ2XPXOSNBQ89"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-2 bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg font-semibold text-sm transition-colors"
                                >
                                    Click Here
                                    <ExternalLink className="w-4 h-4" />
                                </a>
                            </div>

                            {/* Step 2: Product Review */}
                            <div className="bg-gradient-to-br from-red-50 to-orange-50 rounded-xl p-5 border border-red-100">
                                <div className="flex items-start gap-3 mb-3">
                                    <div className="w-8 h-8 rounded-full bg-red-500 text-white flex items-center justify-center font-bold text-sm flex-shrink-0">
                                        2
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-gray-900 text-lg">PRODUCT REVIEW</h3>
                                        <p className="text-sm text-gray-600 mt-1">
                                            Do the product rating for the purchased product if satisfied with the product. (If not, then <a href="https://wa.me/918595899215" target="_blank" rel="noopener noreferrer" className="text-red-600 underline font-medium">contact us</a> we will make it right)
                                        </p>
                                    </div>
                                </div>
                                <a
                                    href="https://www.amazon.in/hz/reviews-render/create-review"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-2 bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg font-semibold text-sm transition-colors"
                                >
                                    Click Here
                                    <ExternalLink className="w-4 h-4" />
                                </a>
                            </div>
                        </div>
                    </div>

                    {/* Order ID Input Section */}
                    <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 md:p-8 mb-8">
                        <form onSubmit={handleSubmit} className="space-y-6">
                            {/* Order ID Input with Search Icon */}
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                    Enter your 17-Digit Order ID
                                </label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                        <Search className="w-5 h-5 text-gray-400" />
                                    </div>
                                    <input
                                        type="text"
                                        value={orderId}
                                        onChange={(e) => setOrderId(e.target.value)}
                                        placeholder="e.g. 408-2477254-5428882"
                                        className="w-full pl-12 pr-4 py-4 border-2 border-gray-200 rounded-xl focus:border-red-500 focus:ring-2 focus:ring-red-500/20 outline-none transition text-gray-900 placeholder:text-gray-400 text-lg"
                                        required
                                    />
                                </div>
                            </div>

                            {/* Contact Input */}
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                    Contact (Email or Phone) - Optional
                                </label>
                                <input
                                    type="text"
                                    value={contact}
                                    onChange={(e) => setContact(e.target.value)}
                                    placeholder="For warranty communication"
                                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-red-500 focus:ring-2 focus:ring-red-500/20 outline-none transition text-gray-900 placeholder:text-gray-400"
                                />
                            </div>

                            {/* Submit Button */}
                            <button
                                type="submit"
                                disabled={isLoading}
                                className="w-full bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white py-4 rounded-xl font-bold text-lg shadow-lg transition disabled:opacity-50 flex items-center justify-center gap-2"
                            >
                                {isLoading ? (
                                    <>
                                        <Loader2 className="w-5 h-5 animate-spin" />
                                        Submitting...
                                    </>
                                ) : (
                                    <>
                                        <Shield className="w-5 h-5" />
                                        Register/Claim Warranty
                                    </>
                                )}
                            </button>
                        </form>
                    </div>

                    {/* Reference Images Section */}
                    <div className="grid md:grid-cols-2 gap-8 mb-8">
                        {/* Step 1 Reference Image */}
                        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 overflow-hidden">
                            <h3 className="font-bold text-gray-900 text-lg mb-4 flex items-center gap-2">
                                <span className="w-6 h-6 rounded-full bg-red-500 text-white flex items-center justify-center text-xs font-bold">1</span>
                                STEP 1 REFERENCE IMAGE
                            </h3>
                            <div className="rounded-xl overflow-hidden border border-gray-200">
                                <Image
                                    src="https://supabase-supabase2.exxngc.easypanel.host/storage/v1/object/public/product-assets/warranty-reference/seller-feedback-reference.png"
                                    alt="Seller Feedback Reference - Check seller name, rate 5 stars, write comment"
                                    width={600}
                                    height={400}
                                    className="w-full h-auto"
                                    unoptimized
                                />
                            </div>
                        </div>

                        {/* Step 2 Reference Image */}
                        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 overflow-hidden">
                            <h3 className="font-bold text-gray-900 text-lg mb-4 flex items-center gap-2">
                                <span className="w-6 h-6 rounded-full bg-red-500 text-white flex items-center justify-center text-xs font-bold">2</span>
                                STEP 2 REFERENCE IMAGE
                            </h3>
                            <div className="rounded-xl overflow-hidden border border-gray-200">
                                <Image
                                    src="https://supabase-supabase2.exxngc.easypanel.host/storage/v1/object/public/product-assets/warranty-reference/product-review-reference.png"
                                    alt="Product Review Reference - Create review, rate 5 stars, add headline and written review"
                                    width={600}
                                    height={400}
                                    className="w-full h-auto"
                                    unoptimized
                                />
                            </div>
                        </div>
                    </div>

                    {/* Screenshot Upload Section */}
                    <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 md:p-8 mb-8">
                        <h3 className="font-bold text-gray-900 text-xl mb-6 text-center">
                            Upload Your Screenshots
                        </h3>

                        <div className="grid md:grid-cols-2 gap-6">
                            {/* Seller Feedback Upload */}
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">
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
                                                className="w-full h-48 object-cover"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => clearFile('seller')}
                                                className="absolute top-2 right-2 bg-red-500 text-white p-1.5 rounded-full hover:bg-red-600 transition-colors"
                                            >
                                                <X className="w-4 h-4" />
                                            </button>
                                            <div className="absolute bottom-2 left-2 bg-green-500 text-white px-2 py-1 rounded text-xs font-medium flex items-center gap-1">
                                                <CheckCircle className="w-3 h-3" />
                                                Uploaded
                                            </div>
                                        </div>
                                    ) : (
                                        <label className="flex flex-col items-center justify-center h-48 border-2 border-dashed border-gray-300 rounded-xl cursor-pointer hover:border-red-500 hover:bg-red-50/50 transition-all group">
                                            <Upload className="w-10 h-10 text-gray-400 group-hover:text-red-500 transition-colors" />
                                            <span className="text-sm text-gray-500 mt-2 group-hover:text-red-600 font-medium">Click to Upload Screenshot</span>
                                            <span className="text-xs text-gray-400 mt-1">PNG, JPG up to 10MB</span>
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

                            {/* Product Review Upload */}
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">
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
                                                className="w-full h-48 object-cover"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => clearFile('review')}
                                                className="absolute top-2 right-2 bg-red-500 text-white p-1.5 rounded-full hover:bg-red-600 transition-colors"
                                            >
                                                <X className="w-4 h-4" />
                                            </button>
                                            <div className="absolute bottom-2 left-2 bg-green-500 text-white px-2 py-1 rounded text-xs font-medium flex items-center gap-1">
                                                <CheckCircle className="w-3 h-3" />
                                                Uploaded
                                            </div>
                                        </div>
                                    ) : (
                                        <label className="flex flex-col items-center justify-center h-48 border-2 border-dashed border-gray-300 rounded-xl cursor-pointer hover:border-red-500 hover:bg-red-50/50 transition-all group">
                                            <Upload className="w-10 h-10 text-gray-400 group-hover:text-red-500 transition-colors" />
                                            <span className="text-sm text-gray-500 mt-2 group-hover:text-red-600 font-medium">Click to Upload Screenshot</span>
                                            <span className="text-xs text-gray-400 mt-1">PNG, JPG up to 10MB</span>
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
                    </div>

                    {/* Benefits Section */}
                    <div className="grid md:grid-cols-2 gap-6 mb-8">
                        {/* Limited Offer */}
                        <div className="bg-gradient-to-br from-purple-600 to-purple-800 rounded-2xl p-6 text-white shadow-lg">
                            <div className="flex items-center gap-3 mb-3">
                                <Gift className="w-8 h-8" />
                                <h3 className="font-bold text-xl">LIMITED OFFER</h3>
                            </div>
                            <p className="text-purple-100 text-sm mb-4">
                                Get exclusive discounts on future purchases when you register your warranty!
                            </p>
                            <a
                                href="/products"
                                className="inline-flex items-center gap-2 bg-white text-purple-700 px-4 py-2 rounded-lg font-semibold text-sm hover:bg-purple-50 transition-colors"
                            >
                                50% OFF REPEAT
                                <ArrowRight className="w-4 h-4" />
                            </a>
                        </div>

                        {/* Lifetime Warranty */}
                        <div className="bg-gradient-to-br from-green-600 to-green-800 rounded-2xl p-6 text-white shadow-lg">
                            <div className="flex items-center gap-3 mb-3">
                                <Award className="w-8 h-8" />
                                <h3 className="font-bold text-xl">LIFETIME WARRANTY</h3>
                            </div>
                            <p className="text-green-100 text-sm mb-4">
                                Register now and get lifetime technical and installation support for your product!
                            </p>
                            <div className="bg-white/20 rounded-lg px-4 py-2 text-sm">
                                <p className="font-semibold">WHY TO REGISTER?</p>
                                <p className="text-green-100 text-xs mt-1">
                                    FREE Replacement even after product license expires!
                                </p>
                            </div>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
}
