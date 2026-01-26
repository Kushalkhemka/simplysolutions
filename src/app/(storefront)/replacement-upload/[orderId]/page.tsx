'use client';

import { useState, useRef, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import {
    Upload,
    CheckCircle,
    AlertTriangle,
    Camera,
    Mail,
    Clock,
    X,
    Loader2,
    ArrowLeft,
    Shield,
    Phone
} from 'lucide-react';
import { toast } from 'sonner';

export default function ReplacementUploadPage() {
    const params = useParams();
    const router = useRouter();
    const orderId = params.orderId as string;

    const [isValidating, setIsValidating] = useState(true);
    const [orderValid, setOrderValid] = useState(false);
    const [orderDetails, setOrderDetails] = useState<{
        fsn?: string;
        productName?: string;
    } | null>(null);
    const [existingRequest, setExistingRequest] = useState<{
        status: 'PENDING' | 'APPROVED' | 'REJECTED';
        newLicenseKey?: string;
        createdAt?: string;
    } | null>(null);

    const [email, setEmail] = useState('');
    const [issueDescription, setIssueDescription] = useState('');
    const [screenshot, setScreenshot] = useState<File | null>(null);
    const [screenshotPreview, setScreenshotPreview] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitted, setSubmitted] = useState(false);

    const fileInputRef = useRef<HTMLInputElement>(null);

    // Validate order on mount
    useEffect(() => {
        validateOrder();
    }, [orderId]);

    const validateOrder = async () => {
        setIsValidating(true);
        try {
            // Check if order exists and get any existing replacement request
            const response = await fetch(`/api/replacement-request?orderId=${encodeURIComponent(orderId)}`);
            const data = await response.json();

            if (data.found) {
                // Existing request found
                setExistingRequest({
                    status: data.status,
                    newLicenseKey: data.newLicenseKey,
                    createdAt: data.submittedAt
                });
                setOrderValid(true);
            } else if (response.ok) {
                // No existing request, order is valid
                setOrderValid(true);
            } else {
                // Order not found
                setOrderValid(false);
            }

            // Also fetch order details
            const orderRes = await fetch('/api/activate/verify', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ secretCode: orderId })
            });
            const orderData = await orderRes.json();
            if (orderData.valid && orderData.productInfo) {
                setOrderDetails({
                    fsn: orderData.fsn,
                    productName: orderData.productInfo?.productName
                });
            }

        } catch (error) {
            console.error('Error validating order:', error);
            setOrderValid(false);
        } finally {
            setIsValidating(false);
        }
    };

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            // Validate file type
            if (!file.type.startsWith('image/')) {
                toast.error('Please upload an image file (PNG, JPG, etc.)');
                return;
            }
            // Validate file size (max 10MB)
            if (file.size > 10 * 1024 * 1024) {
                toast.error('File size must be less than 10MB');
                return;
            }
            setScreenshot(file);
            setScreenshotPreview(URL.createObjectURL(file));
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!email.trim()) {
            toast.error('Please enter your email address');
            return;
        }
        if (!screenshot) {
            toast.error('Please upload a screenshot of the error');
            return;
        }

        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email.trim())) {
            toast.error('Please enter a valid email address');
            return;
        }

        setIsSubmitting(true);

        try {
            const formData = new FormData();
            formData.append('orderId', orderId);
            formData.append('customerEmail', email.trim());
            formData.append('screenshot', screenshot);
            if (issueDescription.trim()) {
                formData.append('issueDescription', issueDescription.trim());
            }

            const response = await fetch('/api/replacement-request', {
                method: 'POST',
                body: formData
            });

            const data = await response.json();

            if (data.success) {
                setSubmitted(true);
                toast.success('Replacement request submitted successfully!');
            } else {
                toast.error(data.error || 'Failed to submit replacement request');
            }
        } catch (error) {
            console.error('Submit error:', error);
            toast.error('Network error. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    // Loading state
    if (isValidating) {
        return (
            <div className="min-h-screen bg-[#EAEDED] flex items-center justify-center">
                <div className="text-center">
                    <Loader2 className="w-12 h-12 text-[#FF9900] animate-spin mx-auto" />
                    <p className="mt-4 text-[#565959]">Validating order...</p>
                </div>
            </div>
        );
    }

    // Invalid order
    if (!orderValid) {
        return (
            <div className="min-h-screen bg-[#EAEDED] flex items-center justify-center p-4">
                <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
                    <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <AlertTriangle className="w-8 h-8 text-red-600" />
                    </div>
                    <h1 className="text-xl font-bold text-[#0F1111] mb-2">Order Not Found</h1>
                    <p className="text-[#565959] mb-6">
                        The order ID <code className="font-mono bg-gray-100 px-2 py-1 rounded">{orderId}</code> was not found in our system.
                    </p>
                    <Link
                        href="/activate"
                        className="inline-flex items-center gap-2 px-4 py-2 bg-[#232F3E] text-white rounded-lg hover:bg-[#37475A] transition-colors"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        Go to Activation Page
                    </Link>
                </div>
            </div>
        );
    }

    // Existing PENDING request
    if (existingRequest?.status === 'PENDING') {
        return (
            <div className="min-h-screen bg-[#EAEDED] flex items-center justify-center p-4">
                <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
                    <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Clock className="w-8 h-8 text-amber-600" />
                    </div>
                    <h1 className="text-xl font-bold text-[#0F1111] mb-2">Request Already Pending</h1>
                    <p className="text-[#565959] mb-4">
                        A replacement request for this order is already under review.
                    </p>
                    <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 text-left mb-6">
                        <p className="text-sm text-amber-900">
                            <strong>Expected Response:</strong> 12-24 working hours
                        </p>
                        {existingRequest.createdAt && (
                            <p className="text-sm text-amber-700 mt-1">
                                Submitted: {new Date(existingRequest.createdAt).toLocaleString()}
                            </p>
                        )}
                    </div>
                    <p className="text-sm text-[#565959] mb-4">
                        You will receive the replacement key via email or you can check at:
                    </p>
                    <Link
                        href={`/activate?code=${orderId}`}
                        className="inline-flex items-center gap-2 px-4 py-2 bg-[#FF9900] text-[#0F1111] font-bold rounded-lg hover:bg-[#E08900] transition-colors"
                    >
                        Check Activation Status
                    </Link>
                </div>
            </div>
        );
    }

    // Existing APPROVED request
    if (existingRequest?.status === 'APPROVED') {
        return (
            <div className="min-h-screen bg-[#EAEDED] flex items-center justify-center p-4">
                <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
                    <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <CheckCircle className="w-8 h-8 text-green-600" />
                    </div>
                    <h1 className="text-xl font-bold text-[#0F1111] mb-2">Replacement Already Approved!</h1>
                    <p className="text-[#565959] mb-4">
                        Your replacement request has been approved.
                    </p>
                    {existingRequest.newLicenseKey && (
                        <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
                            <p className="text-sm text-green-700 mb-2">Your New License Key:</p>
                            <code className="font-mono text-lg font-bold text-green-900 break-all">
                                {existingRequest.newLicenseKey}
                            </code>
                        </div>
                    )}
                    <Link
                        href={`/activate?code=${orderId}`}
                        className="inline-flex items-center gap-2 px-4 py-2 bg-[#FF9900] text-[#0F1111] font-bold rounded-lg hover:bg-[#E08900] transition-colors"
                    >
                        Go to Activation Page
                    </Link>
                </div>
            </div>
        );
    }

    // Submitted success state
    if (submitted) {
        return (
            <div className="min-h-screen bg-[#EAEDED] flex items-center justify-center p-4">
                <div className="max-w-lg w-full bg-white rounded-lg shadow-lg overflow-hidden">
                    <div className="bg-[#067D62] text-white p-6 text-center">
                        <CheckCircle className="w-16 h-16 mx-auto mb-4" />
                        <h1 className="text-2xl font-bold">Request Submitted!</h1>
                    </div>
                    <div className="p-6 space-y-4">
                        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                            <p className="text-green-900 font-medium mb-2">What happens next?</p>
                            <ul className="text-sm text-green-800 space-y-2">
                                <li className="flex items-start gap-2">
                                    <CheckCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                                    <span>Your request will be reviewed by our team</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <Clock className="w-4 h-4 mt-0.5 flex-shrink-0" />
                                    <span><strong>Expected response:</strong> 12-24 working hours</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <Mail className="w-4 h-4 mt-0.5 flex-shrink-0" />
                                    <span>Replacement key will be sent to: <strong>{email}</strong></span>
                                </li>
                            </ul>
                        </div>

                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                            <p className="text-blue-900 text-sm">
                                <strong>Tip:</strong> You can also check your replacement status at{' '}
                                <Link href="/activate" className="text-blue-700 underline font-medium">
                                    simplysolutions.co.in/activate
                                </Link>
                                {' '}using your Order ID.
                            </p>
                        </div>

                        <div className="text-center pt-4">
                            <Link
                                href="/"
                                className="inline-flex items-center gap-2 px-6 py-3 bg-[#232F3E] text-white font-bold rounded-lg hover:bg-[#37475A] transition-colors"
                            >
                                <ArrowLeft className="w-4 h-4" />
                                Return to Homepage
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // Main upload form
    return (
        <div className="min-h-screen bg-[#EAEDED]">
            {/* Header */}
            <div className="bg-[#232F3E] py-4 border-b-4 border-[#FF9900]">
                <div className="container mx-auto px-4">
                    <h1 className="text-2xl font-bold text-center text-white">
                        License Key Replacement Request
                    </h1>
                    <p className="text-center text-[#FF9900] text-sm mt-1">
                        Order ID: {orderId}
                    </p>
                </div>
            </div>

            <div className="container mx-auto px-4 py-8 max-w-xl">
                {/* Info Card */}
                <div className="bg-white rounded-lg shadow border border-[#DDD] mb-6 overflow-hidden">
                    <div className="bg-amber-50 border-l-4 border-amber-500 p-4">
                        <div className="flex items-start gap-3">
                            <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                            <div className="text-sm text-amber-900">
                                <p className="font-bold mb-1">Before submitting:</p>
                                <ul className="list-disc ml-4 space-y-1">
                                    <li>Take a clear screenshot of the error message</li>
                                    <li>Make sure the entire error is visible in the screenshot</li>
                                    <li>Use your active email address for updates</li>
                                </ul>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Upload Form */}
                <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-lg border border-[#DDD] overflow-hidden">
                    <div className="bg-gradient-to-b from-[#F7F8FA] to-[#E7E9EC] px-6 py-4 border-b border-[#DDD]">
                        <h2 className="text-lg font-bold text-[#0F1111]">Submit Replacement Request</h2>
                        {orderDetails?.productName && (
                            <p className="text-sm text-[#565959] mt-1">Product: {orderDetails.productName}</p>
                        )}
                    </div>

                    <div className="p-6 space-y-6">
                        {/* Screenshot Upload */}
                        <div>
                            <label className="block text-sm font-bold text-[#0F1111] mb-2">
                                <Camera className="w-4 h-4 inline mr-2" />
                                ERROR SCREENSHOT <span className="text-[#CC0C39]">*</span>
                            </label>

                            <input
                                type="file"
                                ref={fileInputRef}
                                onChange={handleFileSelect}
                                accept="image/*"
                                className="hidden"
                            />

                            {screenshotPreview ? (
                                <div className="relative border-2 border-dashed border-[#DDD] rounded-lg p-2">
                                    <Image
                                        src={screenshotPreview}
                                        alt="Screenshot preview"
                                        width={500}
                                        height={300}
                                        className="w-full h-auto max-h-64 object-contain rounded"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setScreenshot(null);
                                            setScreenshotPreview(null);
                                        }}
                                        className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600"
                                    >
                                        <X className="w-4 h-4" />
                                    </button>
                                </div>
                            ) : (
                                <button
                                    type="button"
                                    onClick={() => fileInputRef.current?.click()}
                                    className="w-full border-2 border-dashed border-[#888C8C] rounded-lg p-8 text-center hover:border-[#FF9900] hover:bg-[#FFF8F0] transition-colors"
                                >
                                    <Upload className="w-10 h-10 text-[#888C8C] mx-auto mb-2" />
                                    <p className="text-sm font-medium text-[#0F1111]">Click to upload screenshot</p>
                                    <p className="text-xs text-[#565959] mt-1">PNG, JPG up to 10MB</p>
                                </button>
                            )}
                        </div>

                        {/* Email Input */}
                        <div>
                            <label className="block text-sm font-bold text-[#0F1111] mb-2">
                                <Mail className="w-4 h-4 inline mr-2" />
                                YOUR EMAIL ADDRESS <span className="text-[#CC0C39]">*</span>
                            </label>
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="email@example.com"
                                className="w-full px-4 py-3 border border-[#888C8C] rounded text-base text-[#0F1111] bg-white focus:outline-none focus:ring-2 focus:ring-[#FF9900] focus:border-[#FF9900]"
                                required
                            />
                            <p className="text-xs text-[#565959] mt-1">
                                Replacement key will be sent to this email address
                            </p>
                        </div>

                        {/* Issue Description (Optional) */}
                        <div>
                            <label className="block text-sm font-bold text-[#0F1111] mb-2">
                                ISSUE DESCRIPTION <span className="text-[#565959] font-normal">(Optional)</span>
                            </label>
                            <textarea
                                value={issueDescription}
                                onChange={(e) => setIssueDescription(e.target.value)}
                                placeholder="Briefly describe the issue you're facing..."
                                rows={3}
                                className="w-full px-4 py-3 border border-[#888C8C] rounded text-sm text-[#0F1111] bg-white focus:outline-none focus:ring-2 focus:ring-[#FF9900] focus:border-[#FF9900] resize-none"
                            />
                        </div>

                        {/* Expected Response Time */}
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                            <div className="flex items-center gap-2 text-blue-900">
                                <Clock className="w-5 h-5" />
                                <span className="font-bold">Expected Response: 12-24 working hours</span>
                            </div>
                            <p className="text-sm text-blue-800 mt-2">
                                Once approved, you will receive the replacement key via email or you can check at{' '}
                                <strong>simplysolutions.co.in/activate</strong>
                            </p>
                        </div>

                        {/* Submit Button */}
                        <button
                            type="submit"
                            disabled={isSubmitting || !screenshot || !email.trim()}
                            className="w-full py-3 bg-gradient-to-b from-[#FFD814] to-[#F7CA00] hover:from-[#F7CA00] hover:to-[#E7B800] disabled:from-[#E7E9EC] disabled:to-[#D5D9D9] text-[#0F1111] disabled:text-[#565959] font-bold rounded-lg border border-[#FCD200] disabled:border-[#D5D9D9] shadow-sm transition-all disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                            {isSubmitting ? (
                                <>
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                    Submitting...
                                </>
                            ) : (
                                <>
                                    <Shield className="w-5 h-5" />
                                    Submit Replacement Request
                                </>
                            )}
                        </button>
                    </div>
                </form>

                {/* Support Contact */}
                <div className="mt-6 bg-white rounded-lg shadow border border-[#DDD] overflow-hidden">
                    <div className="bg-[#FEF8F2] border-l-4 border-[#FF9900] p-4">
                        <p className="text-sm text-[#0F1111]">
                            <span className="font-bold">Need urgent help?</span> Contact us on WhatsApp:{' '}
                            <a
                                href="https://wa.me/918178848830"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="font-bold text-[#007185] hover:text-[#C7511F] hover:underline"
                            >
                                +91 8178848830
                            </a>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
