import { Metadata } from 'next';
import {
    FileText,
    Warning,
    XCircle,
    CheckCircle,
    Clock,
    CreditCard,
    ShieldCheck,
    Info,
    ChatCircle
} from '@/components/ui/icons';

export const metadata: Metadata = {
    title: 'Cancellation & Refund Policy | SimplySolutions',
    description: 'Learn about our cancellation and refund policy for digital software licenses at SimplySolutions.',
    keywords: ['cancellation policy', 'refund policy', 'returns', 'SimplySolutions', 'software licenses'],
};

export default function CancellationPage() {
    return (
        <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white dark:from-[#0f1015] dark:to-[#1a1c23]">
            {/* Hero Section */}
            <div className="relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-r from-red-500/10 via-transparent to-red-500/5" />
                <div className="container-dense py-16 md:py-24 relative">
                    <div className="max-w-3xl mx-auto text-center">
                        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-red-500/10 text-red-600 dark:text-red-400 text-sm font-medium mb-6">
                            <XCircle className="w-4.5 h-4.5" />
                            <span>Policy Document</span>
                        </div>
                        <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-6">
                            Cancellation & <span className="text-red-500">Refund Policy</span>
                        </h1>
                        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                            Please read our cancellation and refund policy carefully before making a purchase.
                        </p>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="container-dense py-12">
                <div className="max-w-4xl mx-auto">
                    {/* Important Notice */}
                    <div className="bg-amber-50 dark:bg-amber-900/20 rounded-3xl p-8 md:p-10 border border-amber-200 dark:border-amber-700/50 mb-8">
                        <h2 className="text-2xl font-bold text-amber-800 dark:text-amber-300 mb-4 flex items-center gap-3">
                            <Warning className="w-6 h-6" />
                            Important Notice
                        </h2>
                        <p className="text-amber-700 dark:text-amber-300/90 mb-4">
                            <strong>Digital products are non-refundable once the license key has been revealed or delivered.</strong>
                        </p>
                        <p className="text-amber-600 dark:text-amber-300/80">
                            Due to the nature of digital software licenses, we cannot accept returns or provide refunds
                            once the license key has been disclosed to you. Please ensure you have verified all product
                            details and system requirements before completing your purchase.
                        </p>
                    </div>

                    {/* Before Purchase */}
                    <div className="bg-white dark:bg-white/5 rounded-3xl p-8 md:p-10 border border-gray-200 dark:border-white/10 mb-8">
                        <h2 className="text-2xl font-bold text-foreground mb-4 flex items-center gap-3">
                            <Info className="w-6 h-6 text-primary" />
                            Before You Purchase
                        </h2>
                        <p className="text-muted-foreground mb-4">
                            We strongly recommend verifying the following before completing your purchase:
                        </p>
                        <ul className="space-y-3 text-muted-foreground list-disc list-inside">
                            <li>Confirm that the product is compatible with your operating system (Windows/Mac).</li>
                            <li>Verify your system meets the minimum requirements for the software.</li>
                            <li>Ensure you are purchasing the correct version/edition of the software.</li>
                            <li>Check whether you need a 32-bit or 64-bit version.</li>
                            <li>Read the product description carefully to understand what is included.</li>
                        </ul>
                    </div>

                    {/* Cancellation Before Key Delivery */}
                    <div className="bg-green-50 dark:bg-green-900/20 rounded-3xl p-8 md:p-10 border border-green-200 dark:border-green-700/50 mb-8">
                        <h2 className="text-2xl font-bold text-green-800 dark:text-green-300 mb-4 flex items-center gap-3">
                            <CheckCircle className="w-6 h-6" />
                            Cancellation Before Key Delivery
                        </h2>
                        <p className="text-green-700 dark:text-green-300/90 mb-4">
                            <strong>100% Refund Available</strong>
                        </p>
                        <ul className="space-y-3 text-green-600 dark:text-green-300/80 list-disc list-inside">
                            <li>If you cancel your order <strong>before</strong> the license key has been delivered or revealed, you are eligible for a <strong>full refund</strong>.</li>
                            <li>To cancel, contact us immediately via WhatsApp at <a href="https://wa.me/918178848830" className="underline font-medium">+91 8178848830</a> or email <a href="mailto:support@simplysolutions.co.in" className="underline font-medium">support@simplysolutions.co.in</a></li>
                            <li>Refunds for cancelled orders will be processed within <strong>5-7 business days</strong>.</li>
                        </ul>
                    </div>

                    {/* No Refund After Key Delivery */}
                    <div className="bg-red-50 dark:bg-red-900/20 rounded-3xl p-8 md:p-10 border border-red-200 dark:border-red-700/50 mb-8">
                        <h2 className="text-2xl font-bold text-red-800 dark:text-red-300 mb-4 flex items-center gap-3">
                            <XCircle className="w-6 h-6" />
                            After License Key Delivery
                        </h2>
                        <p className="text-red-700 dark:text-red-300/90 mb-4">
                            <strong>No Refunds Available</strong>
                        </p>
                        <p className="text-red-600 dark:text-red-300/80 mb-4">
                            Once the license key has been revealed, viewed, or delivered to you (via email, SMS, or on our activation page), the order is considered fulfilled and <strong>no refunds or cancellations</strong> will be processed.
                        </p>
                        <p className="text-red-600 dark:text-red-300/80">
                            This is because digital license keys cannot be &quot;returned&quot; – once disclosed, we cannot resell them.
                        </p>
                    </div>

                    {/* Exceptions */}
                    <div className="bg-white dark:bg-white/5 rounded-3xl p-8 md:p-10 border border-gray-200 dark:border-white/10 mb-8">
                        <h2 className="text-2xl font-bold text-foreground mb-4 flex items-center gap-3">
                            <ShieldCheck className="w-6 h-6 text-primary" />
                            Exceptions (When Refund May Be Considered)
                        </h2>
                        <p className="text-muted-foreground mb-4">
                            In rare cases, we may consider a refund or replacement under the following circumstances:
                        </p>
                        <ul className="space-y-3 text-muted-foreground list-disc list-inside">
                            <li><strong>Invalid License Key:</strong> If the license key provided is genuinely invalid or has already been used (not due to user error).</li>
                            <li><strong>Wrong Product Delivered:</strong> If we delivered a different product than what you ordered.</li>
                            <li><strong>Duplicate Order:</strong> If you were accidentally charged twice for the same product.</li>
                            <li><strong>Technical Issues from Our Side:</strong> If there&apos;s a genuine technical fault on our end that prevents activation.</li>
                        </ul>
                        <p className="text-muted-foreground mt-4 text-sm">
                            <strong>Note:</strong> All exception requests are subject to verification. Screenshots and proof may be required.
                        </p>
                    </div>

                    {/* Warranty vs Refund */}
                    <div className="bg-blue-50 dark:bg-blue-900/20 rounded-3xl p-8 md:p-10 border border-blue-200 dark:border-blue-700/50 mb-8">
                        <h2 className="text-2xl font-bold text-blue-800 dark:text-blue-300 mb-4 flex items-center gap-3">
                            <ShieldCheck className="w-6 h-6" />
                            Warranty Coverage (Alternative to Refund)
                        </h2>
                        <p className="text-blue-700 dark:text-blue-300/90 mb-4">
                            Instead of refunds, we offer <strong>FREE Lifetime Warranty</strong> on all our products!
                        </p>
                        <ul className="space-y-3 text-blue-600 dark:text-blue-300/80 list-disc list-inside">
                            <li>If your license key stops working in the future, we will provide a <strong>free replacement</strong>.</li>
                            <li>Register for warranty at <a href="https://simplysolutions.co.in/warranty" className="underline font-medium">simplysolutions.co.in/warranty</a></li>
                            <li>Warranty covers activation issues, key expiration, and technical problems.</li>
                            <li>Warranty does <strong>not</strong> cover buyer&apos;s remorse or change of mind.</li>
                        </ul>
                    </div>

                    {/* Refund Processing */}
                    <div className="bg-white dark:bg-white/5 rounded-3xl p-8 md:p-10 border border-gray-200 dark:border-white/10 mb-8">
                        <h2 className="text-2xl font-bold text-foreground mb-4 flex items-center gap-3">
                            <CreditCard className="w-6 h-6 text-primary" />
                            Refund Processing (If Approved)
                        </h2>
                        <ul className="space-y-3 text-muted-foreground list-disc list-inside">
                            <li>Approved refunds will be processed within <strong>5-7 business days</strong>.</li>
                            <li>Refunds will be credited to the original payment method used during purchase.</li>
                            <li>Bank processing time may vary (typically 3-10 additional business days).</li>
                            <li>You will receive an email confirmation once the refund is initiated.</li>
                        </ul>
                    </div>

                    {/* How to Request */}
                    <div className="bg-white dark:bg-white/5 rounded-3xl p-8 md:p-10 border border-gray-200 dark:border-white/10 mb-8">
                        <h2 className="text-2xl font-bold text-foreground mb-4 flex items-center gap-3">
                            <Clock className="w-6 h-6 text-primary" />
                            How to Request Cancellation/Refund
                        </h2>
                        <ol className="space-y-4 text-muted-foreground list-decimal list-inside">
                            <li>
                                <strong>Contact us within 24 hours</strong> of your purchase for the best chance of cancellation.
                            </li>
                            <li>
                                <strong>Provide your Order ID</strong> (found in your confirmation email or on Amazon/our website).
                            </li>
                            <li>
                                <strong>Explain the reason</strong> for your cancellation request.
                            </li>
                            <li>
                                <strong>Wait for confirmation</strong> – we will review and respond within 12-24 hours.
                            </li>
                        </ol>
                    </div>

                    {/* Contact Section */}
                    <div className="bg-gradient-to-r from-primary/10 to-primary/5 rounded-3xl p-8 md:p-10 border border-primary/20 mb-8">
                        <h2 className="text-2xl font-bold text-foreground mb-4 flex items-center gap-3">
                            <ChatCircle className="w-6 h-6 text-primary" />
                            Contact Us for Cancellation
                        </h2>
                        <div className="grid md:grid-cols-2 gap-6">
                            <div>
                                <h3 className="font-semibold text-foreground mb-2">WhatsApp (Fastest)</h3>
                                <a
                                    href="https://wa.me/918178848830"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-primary hover:underline font-medium"
                                >
                                    +91 8178848830 (No Call)
                                </a>
                            </div>
                            <div>
                                <h3 className="font-semibold text-foreground mb-2">Email Support</h3>
                                <a
                                    href="mailto:support@simplysolutions.co.in"
                                    className="text-primary hover:underline font-medium"
                                >
                                    support@simplysolutions.co.in
                                </a>
                            </div>
                        </div>
                        <p className="text-sm text-muted-foreground mt-6">
                            Response time: Within 12-24 hours (usually faster via WhatsApp)
                        </p>
                    </div>

                    {/* Last Updated */}
                    <div className="text-center">
                        <p className="text-sm text-muted-foreground">
                            Last updated: January 2026
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
