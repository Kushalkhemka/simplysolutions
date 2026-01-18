import { Metadata } from 'next';
import {
    Lightning,
    Envelope,
    ShieldCheck,
    Clock,
    CloudArrowDown,
    CheckCircle,
    Info
} from '@/components/ui/icons';

export const metadata: Metadata = {
    title: 'Shipping Policy | SimplySolutions',
    description: 'Learn about our instant digital delivery policy. All software licenses are delivered electronically within seconds of purchase confirmation.',
    keywords: ['shipping policy', 'digital delivery', 'instant delivery', 'software download', 'SimplySolutions'],
};

export default function ShippingPolicyPage() {
    return (
        <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white dark:from-[#0f1015] dark:to-[#1a1c23]">
            {/* Hero Section */}
            <div className="relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-r from-primary/10 via-transparent to-primary/5" />
                <div className="container-dense py-16 md:py-24 relative">
                    <div className="max-w-3xl mx-auto text-center">
                        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6">
                            <Lightning size={18} weight="fill" />
                            <span>Instant Digital Delivery</span>
                        </div>
                        <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-6">
                            Shipping <span className="text-primary">Policy</span>
                        </h1>
                        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                            All our products are digital software licenses delivered instantly via email.
                            No physical shipping required.
                        </p>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="container-dense py-12">
                {/* Highlight Box */}
                <div className="bg-gradient-to-br from-primary/10 to-primary/5 rounded-3xl p-8 md:p-12 border border-primary/20 mb-12">
                    <div className="flex flex-col md:flex-row items-center gap-8">
                        <div className="w-20 h-20 rounded-2xl bg-primary/20 flex items-center justify-center flex-shrink-0">
                            <CloudArrowDown size={40} weight="duotone" className="text-primary" />
                        </div>
                        <div>
                            <h2 className="text-2xl font-bold text-foreground mb-3">100% Digital Delivery</h2>
                            <p className="text-muted-foreground">
                                SimplySolutions exclusively sells digital software licenses. All products are delivered
                                electronically - there is no physical shipping involved. Your license keys and download
                                links are delivered instantly to your registered email address upon successful payment.
                            </p>
                        </div>
                    </div>
                </div>

                {/* Delivery Process */}
                <div className="mb-12">
                    <h2 className="text-2xl font-bold text-foreground mb-8 text-center">How Delivery Works</h2>
                    <div className="grid md:grid-cols-3 gap-6">
                        <div className="relative bg-white dark:bg-white/5 rounded-2xl p-8 border border-gray-200 dark:border-white/10">
                            <div className="absolute -top-4 left-8 w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center font-bold text-sm">1</div>
                            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4 mt-2">
                                <ShieldCheck size={24} weight="duotone" className="text-primary" />
                            </div>
                            <h3 className="text-lg font-bold text-foreground mb-2">Complete Payment</h3>
                            <p className="text-muted-foreground text-sm">
                                Complete your purchase through our secure Razorpay payment gateway with your preferred payment method.
                            </p>
                        </div>

                        <div className="relative bg-white dark:bg-white/5 rounded-2xl p-8 border border-gray-200 dark:border-white/10">
                            <div className="absolute -top-4 left-8 w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center font-bold text-sm">2</div>
                            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4 mt-2">
                                <Lightning size={24} weight="fill" className="text-primary" />
                            </div>
                            <h3 className="text-lg font-bold text-foreground mb-2">Instant Processing</h3>
                            <p className="text-muted-foreground text-sm">
                                Your order is automatically processed within seconds of payment confirmation.
                            </p>
                        </div>

                        <div className="relative bg-white dark:bg-white/5 rounded-2xl p-8 border border-gray-200 dark:border-white/10">
                            <div className="absolute -top-4 left-8 w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center font-bold text-sm">3</div>
                            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4 mt-2">
                                <Envelope size={24} weight="duotone" className="text-primary" />
                            </div>
                            <h3 className="text-lg font-bold text-foreground mb-2">Email Delivery</h3>
                            <p className="text-muted-foreground text-sm">
                                Receive your license key and download instructions via email and in your dashboard.
                            </p>
                        </div>
                    </div>
                </div>

                {/* Policy Details */}
                <div className="bg-white dark:bg-white/5 rounded-3xl p-8 md:p-12 border border-gray-200 dark:border-white/10">
                    <h2 className="text-2xl font-bold text-foreground mb-8">Policy Details</h2>

                    <div className="space-y-8">
                        <div className="flex gap-4">
                            <div className="w-10 h-10 rounded-xl bg-green-500/10 flex items-center justify-center flex-shrink-0">
                                <CheckCircle size={20} weight="fill" className="text-green-500" />
                            </div>
                            <div>
                                <h3 className="font-bold text-foreground mb-2">Delivery Time</h3>
                                <p className="text-muted-foreground">
                                    All orders are delivered instantly upon successful payment verification. In rare cases
                                    of payment gateway delays, delivery may take up to 15 minutes. If you haven&apos;t received
                                    your order within this time, please contact our support team.
                                </p>
                            </div>
                        </div>

                        <div className="flex gap-4">
                            <div className="w-10 h-10 rounded-xl bg-green-500/10 flex items-center justify-center flex-shrink-0">
                                <CheckCircle size={20} weight="fill" className="text-green-500" />
                            </div>
                            <div>
                                <h3 className="font-bold text-foreground mb-2">Delivery Method</h3>
                                <p className="text-muted-foreground">
                                    Your license key will be sent to the email address registered with your account.
                                    Additionally, you can access all your purchased licenses anytime from your dashboard
                                    under &quot;My Licenses&quot; section.
                                </p>
                            </div>
                        </div>

                        <div className="flex gap-4">
                            <div className="w-10 h-10 rounded-xl bg-green-500/10 flex items-center justify-center flex-shrink-0">
                                <CheckCircle size={20} weight="fill" className="text-green-500" />
                            </div>
                            <div>
                                <h3 className="font-bold text-foreground mb-2">No Physical Shipping</h3>
                                <p className="text-muted-foreground">
                                    As all our products are digital licenses, there are no shipping charges, customs fees,
                                    or delivery delays associated with physical shipments. You receive your product
                                    immediately, regardless of your location worldwide.
                                </p>
                            </div>
                        </div>

                        <div className="flex gap-4">
                            <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center flex-shrink-0">
                                <Info size={20} weight="fill" className="text-blue-500" />
                            </div>
                            <div>
                                <h3 className="font-bold text-foreground mb-2">Download Instructions</h3>
                                <p className="text-muted-foreground">
                                    Along with your license key, you will receive detailed installation and activation
                                    instructions. For certain products, official download links from Microsoft or the
                                    respective software vendor will be provided.
                                </p>
                            </div>
                        </div>

                        <div className="flex gap-4">
                            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                                <Clock size={20} weight="duotone" className="text-primary" />
                            </div>
                            <div>
                                <h3 className="font-bold text-foreground mb-2">Support Available 24/7</h3>
                                <p className="text-muted-foreground">
                                    If you face any issues with delivery or need assistance with installation, our
                                    customer support team is available 24/7 via WhatsApp, email, or live chat to help you.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Contact Section */}
                <div className="mt-12 text-center">
                    <p className="text-muted-foreground mb-4">
                        Have questions about delivery? Contact us at{' '}
                        <a href="mailto:support@simplysolutions.co.in" className="text-primary hover:underline">
                            support@simplysolutions.co.in
                        </a>
                    </p>
                    <p className="text-sm text-muted-foreground">
                        Last updated: January 2026
                    </p>
                </div>
            </div>
        </div>
    );
}
