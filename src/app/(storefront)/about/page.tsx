import { Metadata } from 'next';
import {
    Building,
    User,
    MapPin,
    Envelope,
    Phone,
    ShieldCheck,
    Clock,
    Headset
} from '@/components/ui/icons';

export const metadata: Metadata = {
    title: 'About Us | SimplySolutions',
    description: 'Learn about SimplySolutions - Your trusted source for genuine software licenses.',
    robots: 'noindex, nofollow', // Hide from search engines
};

export default function AboutPage() {
    return (
        <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white dark:from-[#0f1015] dark:to-[#1a1c23]">
            {/* Hero Section */}
            <div className="relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-r from-primary/10 via-transparent to-primary/5" />
                <div className="container-dense py-16 md:py-24 relative">
                    <div className="max-w-3xl mx-auto text-center">
                        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6">
                            <Building className="w-4.5 h-4.5" />
                            <span>Company Information</span>
                        </div>
                        <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-6">
                            About <span className="text-primary">SimplySolutions</span>
                        </h1>
                        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                            Your trusted partner for genuine software licenses at unbeatable prices.
                        </p>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="container-dense py-12">
                <div className="max-w-4xl mx-auto">
                    {/* Company Overview */}
                    <div className="bg-white dark:bg-white/5 rounded-3xl p-8 md:p-10 border border-gray-200 dark:border-white/10 mb-8">
                        <h2 className="text-2xl font-bold text-foreground mb-4">Who We Are</h2>
                        <p className="text-muted-foreground mb-4">
                            SimplySolutions is a leading provider of genuine software licenses in India.
                            We specialize in offering authentic Microsoft, Adobe, and other premium software
                            products at competitive prices with instant digital delivery.
                        </p>
                        <p className="text-muted-foreground">
                            Our mission is to make premium software accessible and affordable for everyone,
                            backed by exceptional customer support and lifetime warranty protection.
                        </p>
                    </div>

                    {/* Business Information */}
                    <div className="bg-gradient-to-r from-primary/10 to-primary/5 rounded-3xl p-8 md:p-10 border border-primary/20 mb-8">
                        <h2 className="text-2xl font-bold text-foreground mb-6">Business Information</h2>

                        <div className="grid md:grid-cols-2 gap-6">
                            {/* Trade Name */}
                            <div className="bg-white dark:bg-white/10 rounded-2xl p-6 border border-gray-200 dark:border-white/10">
                                <div className="flex items-center gap-3 mb-3">
                                    <div className="p-2 rounded-full bg-primary/10">
                                        <Building className="w-5 h-5 text-primary" />
                                    </div>
                                    <h3 className="font-semibold text-foreground">Trade Name</h3>
                                </div>
                                <p className="text-lg font-medium text-foreground">Shri Ram Enterprises</p>
                            </div>

                            {/* Legal Name / Contact Person */}
                            <div className="bg-white dark:bg-white/10 rounded-2xl p-6 border border-gray-200 dark:border-white/10">
                                <div className="flex items-center gap-3 mb-3">
                                    <div className="p-2 rounded-full bg-primary/10">
                                        <User className="w-5 h-5 text-primary" />
                                    </div>
                                    <h3 className="font-semibold text-foreground">Legal Name / Contact Person</h3>
                                </div>
                                <p className="text-lg font-medium text-foreground">Kirti Khemka</p>
                            </div>

                            {/* Registered Address - Full Width */}
                            <div className="md:col-span-2 bg-white dark:bg-white/10 rounded-2xl p-6 border border-gray-200 dark:border-white/10">
                                <div className="flex items-center gap-3 mb-3">
                                    <div className="p-2 rounded-full bg-primary/10">
                                        <MapPin className="w-5 h-5 text-primary" />
                                    </div>
                                    <h3 className="font-semibold text-foreground">Registered Address</h3>
                                </div>
                                <p className="text-lg font-medium text-foreground">
                                    559, Moti Ram Road, Mansarover Park,<br />
                                    Shahdara, North East Delhi,<br />
                                    Delhi - 110032, India
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Why Choose Us */}
                    <div className="bg-white dark:bg-white/5 rounded-3xl p-8 md:p-10 border border-gray-200 dark:border-white/10 mb-8">
                        <h2 className="text-2xl font-bold text-foreground mb-6">Why Choose SimplySolutions?</h2>

                        <div className="grid sm:grid-cols-3 gap-6">
                            <div className="text-center p-4">
                                <div className="inline-flex p-4 rounded-full bg-green-100 dark:bg-green-900/30 mb-4">
                                    <ShieldCheck className="w-8 h-8 text-green-600 dark:text-green-400" />
                                </div>
                                <h3 className="font-semibold text-foreground mb-2">100% Genuine</h3>
                                <p className="text-sm text-muted-foreground">
                                    All our software licenses are 100% authentic and sourced from authorized distributors.
                                </p>
                            </div>

                            <div className="text-center p-4">
                                <div className="inline-flex p-4 rounded-full bg-blue-100 dark:bg-blue-900/30 mb-4">
                                    <Clock className="w-8 h-8 text-blue-600 dark:text-blue-400" />
                                </div>
                                <h3 className="font-semibold text-foreground mb-2">Instant Delivery</h3>
                                <p className="text-sm text-muted-foreground">
                                    Receive your license key within seconds of completing your purchase.
                                </p>
                            </div>

                            <div className="text-center p-4">
                                <div className="inline-flex p-4 rounded-full bg-purple-100 dark:bg-purple-900/30 mb-4">
                                    <Headset className="w-8 h-8 text-purple-600 dark:text-purple-400" />
                                </div>
                                <h3 className="font-semibold text-foreground mb-2">24/7 Support</h3>
                                <p className="text-sm text-muted-foreground">
                                    Our dedicated support team is available round the clock to assist you.
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Contact Section */}
                    <div className="bg-white dark:bg-white/5 rounded-3xl p-8 md:p-10 border border-gray-200 dark:border-white/10">
                        <h2 className="text-2xl font-bold text-foreground mb-6">Contact Us</h2>

                        <div className="grid md:grid-cols-2 gap-6">
                            <div className="flex items-start gap-4">
                                <div className="p-2 rounded-full bg-primary/10">
                                    <Envelope className="w-5 h-5 text-primary" />
                                </div>
                                <div>
                                    <h3 className="font-semibold text-foreground mb-1">Email</h3>
                                    <a
                                        href="mailto:support@simplysolutions.co.in"
                                        className="text-primary hover:underline"
                                    >
                                        support@simplysolutions.co.in
                                    </a>
                                </div>
                            </div>

                            <div className="flex items-start gap-4">
                                <div className="p-2 rounded-full bg-primary/10">
                                    <Phone className="w-5 h-5 text-primary" />
                                </div>
                                <div>
                                    <h3 className="font-semibold text-foreground mb-1">WhatsApp (No Call)</h3>
                                    <a
                                        href="https://wa.me/918178848830"
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-primary hover:underline"
                                    >
                                        +91 8178848830
                                    </a>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
