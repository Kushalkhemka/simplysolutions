import { Metadata } from 'next';
import Link from 'next/link';
import {
    Envelope,
    Phone,
    MapPin,
    WhatsappLogo,
    Clock,
    Headset,
    ChatCircle,
    PaperPlaneTilt
} from '@/components/ui/icons';

export const metadata: Metadata = {
    title: 'Contact Us | SimplySolutions',
    description: 'Get in touch with SimplySolutions. We offer 24/7 customer support via email, WhatsApp, and live chat for all your software licensing needs.',
    keywords: ['contact', 'support', 'customer service', 'help', 'SimplySolutions'],
};

export default function ContactPage() {
    return (
        <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white dark:from-[#0f1015] dark:to-[#1a1c23]">
            {/* Hero Section */}
            <div className="relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-r from-primary/10 via-transparent to-primary/5" />
                <div className="container-dense py-16 md:py-24 relative">
                    <div className="max-w-3xl mx-auto text-center">
                        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6">
                            <Headset className="w-4.5 h-4.5" />
                            <span>24/7 Customer Support</span>
                        </div>
                        <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-6">
                            Get in <span className="text-primary">Touch</span>
                        </h1>
                        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                            Have questions about our software licenses? Need help with your order?
                            Our dedicated support team is here to assist you around the clock.
                        </p>
                    </div>
                </div>
            </div>

            {/* Contact Methods */}
            <div className="container-dense py-12">
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-16">
                    {/* Email */}
                    <div className="group relative bg-white dark:bg-white/5 rounded-2xl p-8 border border-gray-200 dark:border-white/10 hover:border-primary/50 transition-all duration-300 hover:shadow-lg hover:shadow-primary/5">
                        <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-primary/10 to-transparent rounded-bl-[100px]" />
                        <div className="relative">
                            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                                <Envelope className="w-7 h-7 text-primary" />
                            </div>
                            <h3 className="text-xl font-bold text-foreground mb-2">Email Us</h3>
                            <p className="text-muted-foreground text-sm mb-4">
                                Send us an email and we&apos;ll respond within 24 hours
                            </p>
                            <a
                                href="mailto:support@simplysolutions.co.in"
                                className="text-primary font-medium hover:underline inline-flex items-center gap-2"
                            >
                                support@simplysolutions.co.in
                                <PaperPlaneTilt className="w-4 h-4" />
                            </a>
                        </div>
                    </div>

                    {/* WhatsApp Support */}
                    <div className="group relative bg-white dark:bg-white/5 rounded-2xl p-8 border border-gray-200 dark:border-white/10 hover:border-[#25D366]/50 transition-all duration-300 hover:shadow-lg hover:shadow-[#25D366]/5">
                        <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-[#25D366]/10 to-transparent rounded-bl-[100px]" />
                        <div className="relative">
                            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#25D366]/20 to-[#25D366]/5 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                                <WhatsappLogo className="w-7 h-7 text-[#25D366]" />
                            </div>
                            <h3 className="text-xl font-bold text-foreground mb-2">WhatsApp Support</h3>
                            <p className="text-muted-foreground text-sm mb-4">
                                Get instant support via WhatsApp
                            </p>
                            <div className="space-y-2">
                                <a
                                    href="https://wa.me/918178848830"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-[#25D366] font-medium hover:underline block"
                                >
                                    +91 8178848830 (Escalations)
                                </a>
                                <a
                                    href="https://wa.me/919953994557"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-[#25D366] font-medium hover:underline block"
                                >
                                    +91 9953994557 (24/7 AI Support)
                                </a>
                            </div>
                        </div>
                    </div>

                    {/* Live Chat */}
                    <div className="group relative bg-white dark:bg-white/5 rounded-2xl p-8 border border-gray-200 dark:border-white/10 hover:border-blue-500/50 transition-all duration-300 hover:shadow-lg hover:shadow-blue-500/5">
                        <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-blue-500/10 to-transparent rounded-bl-[100px]" />
                        <div className="relative">
                            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500/20 to-blue-500/5 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                                <ChatCircle className="w-7 h-7 text-blue-500" />
                            </div>
                            <h3 className="text-xl font-bold text-foreground mb-2">Live Chat</h3>
                            <p className="text-muted-foreground text-sm mb-4">
                                Chat with our support team in real-time
                            </p>
                            <p className="text-blue-500 font-medium">
                                Available via chat widget on website
                            </p>
                        </div>
                    </div>
                </div>

                {/* Business Information */}
                <div className="bg-gradient-to-br from-gray-50 to-gray-100 dark:from-white/5 dark:to-white/[0.02] rounded-3xl p-8 md:p-12 border border-gray-200 dark:border-white/10">
                    <div className="grid md:grid-cols-2 gap-12">
                        <div>
                            <h2 className="text-2xl font-bold text-foreground mb-6">Business Information</h2>
                            <div className="space-y-6">
                                <div className="flex items-start gap-4">
                                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                                        <MapPin className="w-5 h-5 text-primary" />
                                    </div>
                                    <div>
                                        <h4 className="font-semibold text-foreground mb-1">Address</h4>
                                        <p className="text-muted-foreground">Delhi, India</p>
                                    </div>
                                </div>
                                <div className="flex items-start gap-4">
                                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                                        <Clock className="w-5 h-5 text-primary" />
                                    </div>
                                    <div>
                                        <h4 className="font-semibold text-foreground mb-1">Business Hours</h4>
                                        <p className="text-muted-foreground">24/7 Online Support</p>
                                        <p className="text-sm text-muted-foreground">We operate entirely online with round-the-clock support</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div>
                            <h2 className="text-2xl font-bold text-foreground mb-6">Quick Links</h2>
                            <div className="grid grid-cols-2 gap-4">
                                <Link href="/dashboard/support/new" className="flex items-center gap-3 p-4 rounded-xl bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 hover:border-primary/50 transition-colors">
                                    <Headset className="w-5 h-5 text-primary" />
                                    <span className="text-sm font-medium text-foreground">Submit Ticket</span>
                                </Link>
                                <Link href="/dashboard/orders" className="flex items-center gap-3 p-4 rounded-xl bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 hover:border-primary/50 transition-colors">
                                    <Clock className="w-5 h-5 text-primary" />
                                    <span className="text-sm font-medium text-foreground">Track Order</span>
                                </Link>
                                <Link href="/refund" className="flex items-center gap-3 p-4 rounded-xl bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 hover:border-primary/50 transition-colors">
                                    <Envelope className="w-5 h-5 text-primary" />
                                    <span className="text-sm font-medium text-foreground">Refund Policy</span>
                                </Link>
                                <Link href="/faq" className="flex items-center gap-3 p-4 rounded-xl bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 hover:border-primary/50 transition-colors">
                                    <ChatCircle className="w-5 h-5 text-primary" />
                                    <span className="text-sm font-medium text-foreground">FAQs</span>
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
