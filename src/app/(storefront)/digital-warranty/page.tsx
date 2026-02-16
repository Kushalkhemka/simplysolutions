'use client';

import { useState, useRef, useEffect, Suspense } from 'react';
import { Shield, Upload, CheckCircle, Loader2, X, Clock, XCircle, Search, ExternalLink, Star, ArrowRight, Award, AlertTriangle, Mail } from 'lucide-react';
import { toast } from 'sonner';
import Image from 'next/image';
import { useSearchParams } from 'next/navigation';
import { CrossSellBanner } from '@/components/CrossSellBanner';

function DigitalWarrantyContent() {
    const searchParams = useSearchParams();
    const prefilledOrderId = searchParams.get('orderId') || '';

    const [orderId, setOrderId] = useState(prefilledOrderId);
    const [customerEmail, setCustomerEmail] = useState('');
    const [sellerFeedback, setSellerFeedback] = useState<File | null>(null);
    const [productReview, setProductReview] = useState<File | null>(null);
    const [sellerPreview, setSellerPreview] = useState<string | null>(null);
    const [reviewPreview, setReviewPreview] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [isSubmitted, setIsSubmitted] = useState(false);
    const [existingStatus, setExistingStatus] = useState<string | null>(null);
    const [failedAttempts, setFailedAttempts] = useState(0);

    // Resubmission state
    const [isResubmission, setIsResubmission] = useState(false);
    const [missingSeller, setMissingSeller] = useState(false);
    const [missingReview, setMissingReview] = useState(false);
    const [adminNotes, setAdminNotes] = useState<string | null>(null);

    const sellerInputRef = useRef<HTMLInputElement>(null);
    const reviewInputRef = useRef<HTMLInputElement>(null);
    const uploadSectionRef = useRef<HTMLDivElement>(null);

    // Check for existing warranty status on page load if orderId is provided
    useEffect(() => {
        if (prefilledOrderId) {
            checkExistingWarranty(prefilledOrderId);
        }
    }, [prefilledOrderId]);

    const checkExistingWarranty = async (orderIdToCheck: string) => {
        try {
            const response = await fetch(`/api/warranty?orderId=${orderIdToCheck}`);
            const data = await response.json();

            if (data.found && data.status === 'NEEDS_RESUBMISSION') {
                setIsResubmission(true);
                setMissingSeller(data.missingSeller || false);
                setMissingReview(data.missingReview || false);
                setAdminNotes(data.adminNotes);
                setCustomerEmail(data.customerEmail || '');
                toast.info('Please submit the missing screenshot(s) to complete your warranty registration');
            } else if (data.found) {
                setExistingStatus(data.status);
                setIsSubmitted(true);
            }
        } catch (error) {
            console.error('Error checking warranty status:', error);
        }
    };

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

    const validateEmail = (email: string): boolean => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!orderId.trim()) {
            toast.error('Please enter your Order ID');
            return;
        }

        if (!customerEmail.trim() || !validateEmail(customerEmail.trim())) {
            toast.error('Please enter a valid email address');
            return;
        }

        // Check what screenshots are required
        if (isResubmission) {
            if (missingSeller && !sellerFeedback) {
                toast.error('Please upload the seller feedback screenshot');
                return;
            }
            if (missingReview && !productReview) {
                toast.error('Please upload the product review screenshot');
                return;
            }
        } else {
            if (!sellerFeedback || !productReview) {
                toast.error('Please upload both screenshots');
                // Scroll to upload section
                uploadSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                return;
            }
            // Prevent uploading the same file in both fields
            if (sellerFeedback.name === productReview.name) {
                toast.error('Please upload two different screenshots - one for Seller Feedback and one for Product Review.');
                return;
            }
        }

        setIsLoading(true);

        try {
            const formData = new FormData();
            formData.append('orderId', orderId.trim());
            formData.append('customerEmail', customerEmail.trim());
            formData.append('isResubmission', isResubmission.toString());

            if (sellerFeedback) {
                formData.append('screenshotSellerFeedback', sellerFeedback);
            }
            if (productReview) {
                formData.append('screenshotProductReview', productReview);
            }

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
                // Track failed attempts for order not found
                if (data.orderNotFound) {
                    const newAttempts = failedAttempts + 1;
                    setFailedAttempts(newAttempts);
                    if (newAttempts >= 3) {
                        toast.error('⚠️ This Order ID does not belong to SimplySolutions. This product may have been sold by a fake seller who copies our listings. We recommend you REQUEST A REFUND immediately and give a 1-STAR RATING to warn other buyers.', { duration: 10000 });
                    } else {
                        toast.error(data.error || 'Order ID not found.');
                    }
                } else {
                    toast.error(data.error || 'Failed to submit warranty');
                }
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
            case 'NEEDS_RESUBMISSION':
                return <AlertTriangle className="w-10 h-10 text-orange-600" />;
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
            case 'NEEDS_RESUBMISSION':
                return 'bg-orange-100';
            default:
                return 'bg-yellow-100';
        }
    };

    if (isSubmitted && existingStatus !== 'NEEDS_RESUBMISSION') {
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
                            ? 'Your warranty has been verified. You are now covered with lifetime support!'
                            : existingStatus === 'REJECTED'
                                ? 'Unfortunately, your warranty could not be verified. Please contact support on WhatsApp: 8178848830'
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

                    {/* Resubmission Alert */}
                    {isResubmission && (
                        <div className="bg-orange-50 border-2 border-orange-400 rounded-2xl p-6 mb-8">
                            <div className="flex items-start gap-4">
                                <AlertTriangle className="w-8 h-8 text-orange-600 flex-shrink-0" />
                                <div>
                                    <h3 className="font-bold text-orange-800 text-lg mb-2">Action Required: Complete Your Registration</h3>
                                    <p className="text-orange-700 mb-3">
                                        Please submit the following missing screenshot(s):
                                    </p>
                                    <ul className="list-disc list-inside text-orange-700 mb-3">
                                        {missingSeller && <li>Seller Feedback Screenshot</li>}
                                        {missingReview && <li>Product Review Screenshot</li>}
                                    </ul>
                                    {adminNotes && (
                                        <p className="text-sm text-orange-600 italic">
                                            Note from our team: {adminNotes}
                                        </p>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Step-by-Step Instructions */}
                    <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 md:p-8 mb-8">
                        <div className="grid md:grid-cols-2 gap-6">
                            {/* Step 1: Seller Feedback */}
                            <div className={`bg-gradient-to-br from-red-50 to-orange-50 rounded-xl p-5 border ${isResubmission && missingSeller ? 'border-orange-400 ring-2 ring-orange-300' : 'border-red-100'}`}>
                                <div className="flex items-start gap-3 mb-3">
                                    <div className="w-8 h-8 rounded-full bg-red-500 text-white flex items-center justify-center font-bold text-sm flex-shrink-0">
                                        1
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-gray-900 text-lg">SELLER FEEDBACK</h3>
                                        <p className="text-sm text-gray-600 mt-1">
                                            Go to <a href="https://www.amazon.in/hz/feedback" target="_blank" rel="noopener noreferrer" className="text-red-600 underline font-medium">amazon.in/hz/feedback</a> and give 5 star seller feedback if you liked the service. Login with the same Amazon account used for purchase if asked. (Not satisfied? <a href="https://wa.me/918178848830" target="_blank" rel="noopener noreferrer" className="text-red-600 underline font-medium">Contact us</a> and we will make it right)
                                        </p>
                                    </div>
                                </div>
                                <a
                                    href="https://www.amazon.in/hz/feedback"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-2 bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg font-semibold text-sm transition-colors"
                                >
                                    Leave Seller Feedback
                                    <ExternalLink className="w-4 h-4" />
                                </a>
                            </div>

                            {/* Step 2: Product Review */}
                            <div className={`bg-gradient-to-br from-red-50 to-orange-50 rounded-xl p-5 border ${isResubmission && missingReview ? 'border-orange-400 ring-2 ring-orange-300' : 'border-red-100'}`}>
                                <div className="flex items-start gap-3 mb-3">
                                    <div className="w-8 h-8 rounded-full bg-red-500 text-white flex items-center justify-center font-bold text-sm flex-shrink-0">
                                        2
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-gray-900 text-lg">PRODUCT REVIEW</h3>
                                        <p className="text-sm text-gray-600 mt-1">
                                            Go to <a href="https://www.amazon.in/review/review-your-purchases/listing" target="_blank" rel="noopener noreferrer" className="text-red-600 underline font-medium">amazon.in/review/review-your-purchases</a> and rate the purchased product 5 stars. Login with the same Amazon account used for purchase if asked. (Not satisfied? <a href="https://wa.me/918178848830" target="_blank" rel="noopener noreferrer" className="text-red-600 underline font-medium">Contact us</a> and we will make it right)
                                        </p>
                                    </div>
                                </div>
                                <a
                                    href="https://www.amazon.in/review/review-your-purchases/listing"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-2 bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg font-semibold text-sm transition-colors"
                                >
                                    Leave Product Review
                                    <ExternalLink className="w-4 h-4" />
                                </a>
                            </div>
                        </div>
                    </div>

                    {/* Order ID and Email Input Section */}
                    <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 md:p-8 mb-8">
                        <form onSubmit={handleSubmit} className="space-y-6">
                            {/* Order ID Input with Search Icon */}
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                    Enter your 17-Digit Order ID *
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
                                        disabled={isResubmission}
                                    />
                                </div>
                            </div>

                            {/* Email Input - MANDATORY */}
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                    Email Address * <span className="text-gray-500 font-normal">(For warranty communication)</span>
                                </label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                        <Mail className="w-5 h-5 text-gray-400" />
                                    </div>
                                    <input
                                        type="email"
                                        value={customerEmail}
                                        onChange={(e) => setCustomerEmail(e.target.value)}
                                        placeholder="your.email@example.com"
                                        className="w-full pl-12 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:border-red-500 focus:ring-2 focus:ring-red-500/20 outline-none transition text-gray-900 placeholder:text-gray-400"
                                        required
                                    />
                                </div>
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
                                        {isResubmission ? 'Submit Missing Screenshot' : 'Register/Claim Warranty'}
                                    </>
                                )}
                            </button>
                        </form>
                    </div>

                    {/* Reference Images Section */}
                    <div className="grid md:grid-cols-2 gap-8 mb-8">
                        {/* Step 1 Reference Image */}
                        {(!isResubmission || missingSeller) && (
                            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 overflow-hidden">
                                <h3 className="font-bold text-gray-900 text-lg mb-4 flex items-center gap-2">
                                    <span className="w-6 h-6 rounded-full bg-red-500 text-white flex items-center justify-center text-xs font-bold">1</span>
                                    STEP 1 REFERENCE IMAGE
                                </h3>
                                <div className="rounded-xl overflow-hidden border border-gray-200">
                                    <Image
                                        src="/assets/seller_feedback.png"
                                        alt="Seller Feedback Reference - Check seller name, rate 5 stars, write comment"
                                        width={600}
                                        height={400}
                                        className="w-full h-auto"
                                    />
                                </div>
                            </div>
                        )}

                        {/* Step 2 Reference Image */}
                        {(!isResubmission || missingReview) && (
                            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 overflow-hidden">
                                <h3 className="font-bold text-gray-900 text-lg mb-4 flex items-center gap-2">
                                    <span className="w-6 h-6 rounded-full bg-red-500 text-white flex items-center justify-center text-xs font-bold">2</span>
                                    STEP 2 REFERENCE IMAGE
                                </h3>
                                <div className="rounded-xl overflow-hidden border border-gray-200">
                                    <Image
                                        src="/assets/product_review_image.png"
                                        alt="Product Review Reference - Create review, rate 5 stars, add headline and written review"
                                        width={600}
                                        height={400}
                                        className="w-full h-auto"
                                    />
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Screenshot Upload Section */}
                    <div ref={uploadSectionRef} className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 md:p-8 mb-8">
                        <h3 className="font-bold text-gray-900 text-xl mb-6 text-center">
                            {isResubmission ? 'Upload Missing Screenshot(s)' : 'Upload Your Screenshots'}
                        </h3>

                        <div className="grid md:grid-cols-2 gap-6">
                            {/* Seller Feedback Upload - Show only if not resubmission OR if it's the missing one */}
                            {(!isResubmission || missingSeller) && (
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                                        Seller Feedback Screenshot *
                                        {isResubmission && missingSeller && (
                                            <span className="ml-2 px-2 py-0.5 bg-orange-100 text-orange-700 text-xs rounded-full">Required</span>
                                        )}
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
                                            <label className={`flex flex-col items-center justify-center h-48 border-2 border-dashed rounded-xl cursor-pointer hover:border-red-500 hover:bg-red-50/50 transition-all group ${isResubmission && missingSeller ? 'border-orange-400 bg-orange-50/50' : 'border-gray-300'}`}>
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
                            )}

                            {/* Product Review Upload - Show only if not resubmission OR if it's the missing one */}
                            {(!isResubmission || missingReview) && (
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                                        Product Review Screenshot *
                                        {isResubmission && missingReview && (
                                            <span className="ml-2 px-2 py-0.5 bg-orange-100 text-orange-700 text-xs rounded-full">Required</span>
                                        )}
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
                                            <label className={`flex flex-col items-center justify-center h-48 border-2 border-dashed rounded-xl cursor-pointer hover:border-red-500 hover:bg-red-50/50 transition-all group ${isResubmission && missingReview ? 'border-orange-400 bg-orange-50/50' : 'border-gray-300'}`}>
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
                            )}
                        </div>
                    </div>

                    {/* Benefits Section */}
                    <div className="grid md:grid-cols-2 gap-6 mb-8">
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
                                <p className="font-semibold">WHAT'S INCLUDED?</p>
                                <ul className="text-green-100 text-xs mt-1 list-disc list-inside">
                                    <li>Lifetime Technical Support</li>
                                    <li>Installation Assistance</li>
                                    <li>Free License Key Replacement</li>
                                </ul>
                            </div>
                        </div>

                        {/* Support Contact */}
                        <div className="bg-gradient-to-br from-blue-600 to-blue-800 rounded-2xl p-6 text-white shadow-lg">
                            <div className="flex items-center gap-3 mb-3">
                                <Shield className="w-8 h-8" />
                                <h3 className="font-bold text-xl">NEED HELP?</h3>
                            </div>
                            <p className="text-blue-100 text-sm mb-4">
                                Our support team is here to help you 24/7 with any questions or issues.
                            </p>
                            <a
                                href="https://wa.me/918178848830"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-2 bg-white text-blue-700 px-4 py-2 rounded-lg font-semibold text-sm hover:bg-blue-50 transition-colors"
                            >
                                WhatsApp: 8178848830
                                <ArrowRight className="w-4 h-4" />
                            </a>
                        </div>
                    </div>

                    {/* Why Section */}
                    <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 md:p-8 mb-8">
                        <h3 className="font-bold text-gray-900 text-xl mb-4 flex items-center gap-2">
                            <span className="text-2xl">❓</span> Why do we ask for these screenshots?
                        </h3>
                        <div className="space-y-4 text-gray-600">
                            <p>
                                The <span className="font-semibold text-gray-800">Lifetime Warranty</span> is provided directly by us,
                                the seller. We bear all the expenses for providing you with technical support, installation assistance,
                                and license key replacements — <span className="font-semibold">at no extra cost to you</span>.
                            </p>
                            <p>
                                In return, we only ask for your <span className="font-semibold text-green-700">honest feedback</span> —
                                but <span className="italic">only after you are fully satisfied</span> with your product.
                            </p>
                            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                                <p className="font-semibold text-amber-800 mb-2">⚠️ Before submitting:</p>
                                <ul className="list-disc list-inside text-amber-700 text-sm space-y-1">
                                    <li>Make sure your product is activated and working properly</li>
                                    <li>If you face any issues, please <a href="https://wa.me/918178848830" target="_blank" rel="noopener noreferrer" className="text-red-600 underline font-medium">contact us</a> first</li>
                                    <li>Only provide feedback when you are genuinely satisfied</li>
                                </ul>
                            </div>
                            <p className="text-sm text-gray-500 italic">
                                We humbly apologise for any issue or inconvenience caused. Your satisfaction is our priority,
                                and we are always here to help. Thank you for choosing SimplySolutions! 🙏
                            </p>
                        </div>
                    </div>

                    {/* Cross-Sell Recommendations */}
                    <CrossSellBanner currentProduct="all" title="Explore More Software Deals" />

                </div>
            </div>
        </div>
    );
}

export default function DigitalWarrantyPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
            </div>
        }>
            <DigitalWarrantyContent />
        </Suspense>
    );
}
