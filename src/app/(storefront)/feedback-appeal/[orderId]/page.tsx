'use client';

import { useState, useRef, use } from 'react';
import { AlertTriangle, Upload, CheckCircle, Loader2, X, Shield, XCircle, ArrowRight, Clock, IndianRupee } from 'lucide-react';
import { toast } from 'sonner';
import Image from 'next/image';
import Link from 'next/link';

interface PageProps {
    params: Promise<{ orderId: string }>;
}

type RefundType = 'none' | 'partial' | 'full';

export default function FeedbackAppealPage({ params }: PageProps) {
    const { orderId } = use(params);

    const [screenshot, setScreenshot] = useState<File | null>(null);
    const [screenshotPreview, setScreenshotPreview] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [isSubmitted, setIsSubmitted] = useState(false);
    const [appealStatus, setAppealStatus] = useState<string | null>(null);

    // Refund options
    const [refundType, setRefundType] = useState<RefundType>('none');
    const [partialAmount, setPartialAmount] = useState<string>('');

    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileChange = (file: File | null) => {
        if (file) {
            const previewUrl = URL.createObjectURL(file);
            setScreenshot(file);
            setScreenshotPreview(previewUrl);
        }
    };

    const clearFile = () => {
        setScreenshot(null);
        setScreenshotPreview(null);
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!screenshot) {
            toast.error('Please upload a screenshot showing the feedback has been removed');
            return;
        }

        if (refundType === 'partial' && (!partialAmount || parseFloat(partialAmount) <= 0)) {
            toast.error('Please enter a valid refund amount');
            return;
        }

        setIsLoading(true);

        try {
            const formData = new FormData();
            formData.append('orderId', orderId);
            formData.append('screenshot', screenshot);
            formData.append('refundType', refundType);
            if (refundType === 'partial') {
                formData.append('partialAmount', partialAmount);
            }

            const response = await fetch('/api/feedback-appeal', {
                method: 'POST',
                body: formData,
            });

            const data = await response.json();

            if (data.success) {
                setIsSubmitted(true);
                setAppealStatus('PENDING');
                toast.success(data.message);
            } else {
                toast.error(data.error || 'Failed to submit appeal');
            }
        } catch (error) {
            console.error('Appeal submission error:', error);
            toast.error('Network error. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    if (isSubmitted) {
        return (
            <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white flex items-center justify-center p-4">
                <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full text-center border border-gray-100">
                    <div className="w-20 h-20 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-6">
                        <Clock className="w-10 h-10 text-yellow-600" />
                    </div>
                    <h1 className="text-2xl font-bold text-gray-900 mb-4">
                        Submitted Successfully
                    </h1>
                    <p className="text-gray-600 mb-6">
                        Your submission for Order ID <span className="font-semibold">{orderId}</span> has been received.
                        Our team will manually verify the feedback removal within 24-48 hours.
                    </p>
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-left mb-6">
                        <p className="text-sm text-green-800 font-medium mb-2">What happens next?</p>
                        <ul className="text-sm text-green-700 space-y-1">
                            <li>• We will verify the feedback has been removed</li>
                            <li>• Your warranty will be activated upon approval</li>
                            <li>• Refund (if applicable) will be processed via Amazon</li>
                            <li>• You will be notified via WhatsApp</li>
                        </ul>
                    </div>
                    <Link
                        href="/"
                        className="inline-flex items-center gap-2 bg-gray-900 text-white px-6 py-3 rounded-lg font-medium hover:bg-gray-800 transition-colors"
                    >
                        Return to Home
                        <ArrowRight className="w-4 h-4" />
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header - Softer tone */}
            <div className="bg-amber-500 text-white py-4">
                <div className="container mx-auto px-4 text-center">
                    <div className="flex items-center justify-center gap-2 mb-2">
                        <AlertTriangle className="w-6 h-6" />
                        <h1 className="text-xl font-bold">FEEDBACK REMOVAL REQUEST</h1>
                    </div>
                    <p className="text-amber-100">
                        Order ID: <span className="font-mono font-semibold">{orderId}</span>
                    </p>
                </div>
            </div>

            <div className="container mx-auto px-4 py-8">
                <div className="max-w-3xl mx-auto">

                    {/* Why Remove Feedback */}
                    <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6 md:p-8 mb-8">
                        <h2 className="text-xl font-bold text-gray-900 mb-4">
                            Why Remove Feedback?
                        </h2>
                        <p className="text-gray-600 mb-4">
                            Feedback is crucial for our success as a small business. We strive to offer the best service,
                            but occasional guidance issues may arise. Negative feedback severely impacts our ability to serve customers.
                        </p>
                        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                            <p className="text-sm text-amber-800">
                                <span className="font-semibold">Note:</span> If you faced a genuine issue with the product or service,
                                please <a href="https://wa.me/918178848830" target="_blank" rel="noopener noreferrer" className="text-amber-700 underline font-medium">contact us on WhatsApp</a> first.
                                We will resolve your issue before asking for feedback removal.
                            </p>
                        </div>
                    </div>

                    {/* Consequences Section */}
                    <div className="bg-white rounded-2xl shadow-lg border border-red-200 p-6 md:p-8 mb-8">
                        <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                            <XCircle className="w-6 h-6 text-red-600" />
                            What You Lose with 1-Star Feedback
                        </h2>
                        <div className="space-y-3">
                            <div className="flex items-start gap-3 p-3 bg-red-50 rounded-lg border border-red-100">
                                <X className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
                                <div>
                                    <p className="font-medium text-gray-900">No Warranty Registration</p>
                                    <p className="text-sm text-gray-600">Lifetime warranty benefits will not be available.</p>
                                </div>
                            </div>
                            <div className="flex items-start gap-3 p-3 bg-red-50 rounded-lg border border-red-100">
                                <X className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
                                <div>
                                    <p className="font-medium text-gray-900">No Future Support</p>
                                    <p className="text-sm text-gray-600">Technical support, installation assistance, and replacements will not be provided.</p>
                                </div>
                            </div>
                            <div className="flex items-start gap-3 p-3 bg-red-50 rounded-lg border border-red-100">
                                <X className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
                                <div>
                                    <p className="font-medium text-gray-900">No Refund Processing</p>
                                    <p className="text-sm text-gray-600">Any refund claims will not be processed.</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Before/After Section */}
                    <div className="grid md:grid-cols-2 gap-6 mb-8">
                        {/* Before */}
                        <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
                            <div className="flex items-center gap-2 mb-4">
                                <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
                                    <X className="w-5 h-5 text-red-600" />
                                </div>
                                <h3 className="font-bold text-gray-900">WITH 1-STAR FEEDBACK</h3>
                            </div>
                            <ul className="space-y-2 text-sm text-gray-600">
                                <li className="flex items-center gap-2">
                                    <X className="w-4 h-4 text-red-500" />
                                    No Warranty
                                </li>
                                <li className="flex items-center gap-2">
                                    <X className="w-4 h-4 text-red-500" />
                                    No Technical Support
                                </li>
                                <li className="flex items-center gap-2">
                                    <X className="w-4 h-4 text-red-500" />
                                    No Replacements
                                </li>
                                <li className="flex items-center gap-2">
                                    <X className="w-4 h-4 text-red-500" />
                                    No Refund Processing
                                </li>
                            </ul>
                        </div>

                        {/* After */}
                        <div className="bg-white rounded-2xl shadow-lg border border-green-200 p-6">
                            <div className="flex items-center gap-2 mb-4">
                                <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                                    <CheckCircle className="w-5 h-5 text-green-600" />
                                </div>
                                <h3 className="font-bold text-gray-900">AFTER FEEDBACK REMOVAL</h3>
                            </div>
                            <ul className="space-y-2 text-sm text-gray-600">
                                <li className="flex items-center gap-2">
                                    <CheckCircle className="w-4 h-4 text-green-500" />
                                    Warranty Activated
                                </li>
                                <li className="flex items-center gap-2">
                                    <CheckCircle className="w-4 h-4 text-green-500" />
                                    Lifetime Technical Support
                                </li>
                                <li className="flex items-center gap-2">
                                    <CheckCircle className="w-4 h-4 text-green-500" />
                                    Free Replacements
                                </li>
                                <li className="flex items-center gap-2">
                                    <CheckCircle className="w-4 h-4 text-green-500" />
                                    Refund (if applicable)
                                </li>
                            </ul>
                        </div>
                    </div>

                    {/* Submission Form */}
                    <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 md:p-8 mb-8">
                        <h2 className="text-xl font-bold text-gray-900 mb-2">Submit Feedback Removal Proof</h2>
                        <p className="text-gray-600 mb-6">
                            Remove your feedback on Amazon and upload a screenshot as proof.
                        </p>

                        {/* Steps */}
                        <div className="bg-gray-50 rounded-xl p-4 mb-6">
                            <p className="font-medium text-gray-900 mb-3">How to remove feedback:</p>
                            <ol className="space-y-2 text-sm text-gray-700">
                                <li className="flex gap-2">
                                    <span className="font-bold text-amber-600">1.</span>
                                    Visit <a href="https://www.amazon.in/hz/feedback/list" target="_blank" rel="noopener noreferrer" className="text-amber-600 underline font-medium">amazon.in/hz/feedback/list</a>
                                </li>
                                <li className="flex gap-2">
                                    <span className="font-bold text-amber-600">2.</span>
                                    Log in with the Amazon account used for Order ID: {orderId}
                                </li>
                                <li className="flex gap-2">
                                    <span className="font-bold text-amber-600">3.</span>
                                    Click &quot;Remove&quot; next to your feedback, select any reason, and confirm
                                </li>
                                <li className="flex gap-2">
                                    <span className="font-bold text-amber-600">4.</span>
                                    Take a screenshot showing the feedback has been removed
                                </li>
                            </ol>
                        </div>

                        <form onSubmit={handleSubmit}>
                            {/* Screenshot Upload */}
                            <div className="mb-6">
                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                    Screenshot of Removed Feedback *
                                </label>
                                <div className="relative">
                                    {screenshotPreview ? (
                                        <div className="relative border-2 border-green-500 rounded-xl overflow-hidden">
                                            <Image
                                                src={screenshotPreview}
                                                alt="Feedback removal proof"
                                                width={600}
                                                height={400}
                                                className="w-full h-64 object-contain bg-gray-100"
                                            />
                                            <button
                                                type="button"
                                                onClick={clearFile}
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
                                        <label className="flex flex-col items-center justify-center h-48 border-2 border-dashed border-gray-300 rounded-xl cursor-pointer hover:border-amber-500 hover:bg-amber-50/50 transition-all group">
                                            <Upload className="w-10 h-10 text-gray-400 group-hover:text-amber-500 transition-colors" />
                                            <span className="text-sm text-gray-500 mt-2 group-hover:text-amber-600 font-medium">Click to Upload Screenshot</span>
                                            <span className="text-xs text-gray-400 mt-1">PNG, JPG up to 10MB</span>
                                            <input
                                                ref={fileInputRef}
                                                type="file"
                                                accept="image/*"
                                                onChange={(e) => handleFileChange(e.target.files?.[0] || null)}
                                                className="hidden"
                                            />
                                        </label>
                                    )}
                                </div>
                            </div>

                            {/* Refund Options */}
                            <div className="mb-6">
                                <label className="block text-sm font-semibold text-gray-700 mb-3">
                                    Refund Preference *
                                </label>
                                <div className="space-y-3">
                                    {/* No Refund */}
                                    <label className={`flex items-start gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all ${refundType === 'none' ? 'border-green-500 bg-green-50' : 'border-gray-200 hover:border-gray-300'}`}>
                                        <input
                                            type="radio"
                                            name="refundType"
                                            value="none"
                                            checked={refundType === 'none'}
                                            onChange={() => setRefundType('none')}
                                            className="mt-1"
                                        />
                                        <div>
                                            <p className="font-medium text-gray-900">No Refund Needed</p>
                                            <p className="text-sm text-gray-600">I just want my warranty activated.</p>
                                        </div>
                                    </label>

                                    {/* Partial Refund */}
                                    <label className={`flex items-start gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all ${refundType === 'partial' ? 'border-amber-500 bg-amber-50' : 'border-gray-200 hover:border-gray-300'}`}>
                                        <input
                                            type="radio"
                                            name="refundType"
                                            value="partial"
                                            checked={refundType === 'partial'}
                                            onChange={() => setRefundType('partial')}
                                            className="mt-1"
                                        />
                                        <div className="flex-1">
                                            <p className="font-medium text-gray-900">Partial Refund Needed</p>
                                            <p className="text-sm text-gray-600 mb-2">I would like a partial refund for the inconvenience.</p>
                                            {refundType === 'partial' && (
                                                <div className="flex items-center gap-2">
                                                    <IndianRupee className="w-4 h-4 text-gray-500" />
                                                    <input
                                                        type="number"
                                                        value={partialAmount}
                                                        onChange={(e) => setPartialAmount(e.target.value)}
                                                        placeholder="Enter amount"
                                                        className="w-32 px-3 py-2 border border-gray-300 rounded-lg focus:border-amber-500 focus:ring-1 focus:ring-amber-500 outline-none bg-white text-gray-900"
                                                        min="1"
                                                    />
                                                </div>
                                            )}
                                        </div>
                                    </label>

                                    {/* Full Refund */}
                                    <label className={`flex items-start gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all ${refundType === 'full' ? 'border-red-500 bg-red-50' : 'border-gray-200 hover:border-gray-300'}`}>
                                        <input
                                            type="radio"
                                            name="refundType"
                                            value="full"
                                            checked={refundType === 'full'}
                                            onChange={() => setRefundType('full')}
                                            className="mt-1"
                                        />
                                        <div>
                                            <p className="font-medium text-gray-900">Full Refund Needed</p>
                                            <p className="text-sm text-gray-600">I have NOT generated or used the product key.</p>
                                            {refundType === 'full' && (
                                                <div className="mt-2 p-3 bg-red-100 border border-red-200 rounded-lg">
                                                    <p className="text-xs text-red-800 font-medium">
                                                        Important: Full refund is only applicable if the product key has NOT been generated or used.
                                                        If the key has been activated, full refund cannot be processed.
                                                    </p>
                                                </div>
                                            )}
                                        </div>
                                    </label>
                                </div>
                            </div>

                            {/* Submit Button */}
                            <button
                                type="submit"
                                disabled={isLoading || !screenshot}
                                className="w-full bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white py-4 rounded-xl font-bold text-lg shadow-lg transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                            >
                                {isLoading ? (
                                    <>
                                        <Loader2 className="w-5 h-5 animate-spin" />
                                        Submitting...
                                    </>
                                ) : (
                                    <>
                                        <Shield className="w-5 h-5" />
                                        Submit for Review
                                    </>
                                )}
                            </button>
                        </form>
                    </div>

                    {/* Trust Section */}
                    <div className="bg-blue-50 border border-blue-200 rounded-2xl p-6 mb-8">
                        <h3 className="font-bold text-blue-900 mb-4 flex items-center gap-2">
                            <Shield className="w-5 h-5" />
                            Important Information
                        </h3>
                        <div className="space-y-3 text-sm text-blue-800">
                            <div className="flex items-start gap-2">
                                <CheckCircle className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                                <p><span className="font-semibold">We NEVER ask for extra payment.</span> All our services are included with your purchase.</p>
                            </div>
                            <div className="flex items-start gap-2">
                                <CheckCircle className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                                <p><span className="font-semibold">Refunds (if applicable)</span> will be issued to your original payment method via Amazon only. You will be notified when processed.</p>
                            </div>
                            <div className="flex items-start gap-2">
                                <CheckCircle className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                                <p><span className="font-semibold">Review Time:</span> 24-48 hours. Our team manually verifies each submission.</p>
                            </div>
                        </div>
                    </div>

                    {/* Contact Support */}
                    <div className="text-center text-gray-600">
                        <p className="mb-2">Facing a genuine product issue?</p>
                        <a
                            href="https://wa.me/918178848830"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 text-green-600 font-semibold hover:text-green-700 transition-colors"
                        >
                            Contact us on WhatsApp: 8178848830
                            <ArrowRight className="w-4 h-4" />
                        </a>
                    </div>

                </div>
            </div>
        </div>
    );
}
