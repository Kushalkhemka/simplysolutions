import { Metadata } from 'next';
import {
    FileText,
    ShieldCheck,
    Warning,
    Scales,
    UserCircle,
    CreditCard,
    Gavel,
    Info
} from '@/components/ui/icons';

export const metadata: Metadata = {
    title: 'Terms and Conditions | SimplySolutions',
    description: 'Read our terms and conditions governing the use of SimplySolutions website and purchase of software licenses.',
    keywords: ['terms and conditions', 'terms of service', 'legal', 'user agreement', 'SimplySolutions'],
};

export default function TermsPage() {
    return (
        <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white dark:from-[#0f1015] dark:to-[#1a1c23]">
            {/* Hero Section */}
            <div className="relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-r from-primary/10 via-transparent to-primary/5" />
                <div className="container-dense py-16 md:py-24 relative">
                    <div className="max-w-3xl mx-auto text-center">
                        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6">
                            <FileText size={18} weight="duotone" />
                            <span>Legal Agreement</span>
                        </div>
                        <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-6">
                            Terms and <span className="text-primary">Conditions</span>
                        </h1>
                        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                            Please read these terms carefully before using our services or making a purchase.
                        </p>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="container-dense py-12">
                <div className="max-w-4xl mx-auto">
                    {/* Introduction */}
                    <div className="bg-white dark:bg-white/5 rounded-3xl p-8 md:p-10 border border-gray-200 dark:border-white/10 mb-8">
                        <h2 className="text-2xl font-bold text-foreground mb-4 flex items-center gap-3">
                            <Info size={24} className="text-primary" />
                            Introduction
                        </h2>
                        <p className="text-muted-foreground mb-4">
                            Welcome to SimplySolutions (&quot;we,&quot; &quot;our,&quot; or &quot;us&quot;). These Terms and Conditions
                            (&quot;Terms&quot;) govern your access to and use of our website at simplysolutions.co.in and
                            any related services, including the purchase of digital software licenses.
                        </p>
                        <p className="text-muted-foreground">
                            By accessing our website or making a purchase, you agree to be bound by these Terms.
                            If you do not agree to these Terms, please do not use our services.
                        </p>
                    </div>

                    {/* Definitions */}
                    <div className="bg-white dark:bg-white/5 rounded-3xl p-8 md:p-10 border border-gray-200 dark:border-white/10 mb-8">
                        <h2 className="text-2xl font-bold text-foreground mb-4 flex items-center gap-3">
                            <FileText size={24} className="text-primary" />
                            Definitions
                        </h2>
                        <ul className="space-y-3 text-muted-foreground">
                            <li><strong className="text-foreground">&quot;Products&quot;</strong> refers to digital software licenses sold through our platform.</li>
                            <li><strong className="text-foreground">&quot;License Key&quot;</strong> means the alphanumeric code provided to activate the purchased software.</li>
                            <li><strong className="text-foreground">&quot;User&quot; or &quot;Customer&quot;</strong> refers to any individual or entity using our website or purchasing our products.</li>
                            <li><strong className="text-foreground">&quot;Account&quot;</strong> means the registered user profile on our platform.</li>
                        </ul>
                    </div>

                    {/* Account Registration */}
                    <div className="bg-white dark:bg-white/5 rounded-3xl p-8 md:p-10 border border-gray-200 dark:border-white/10 mb-8">
                        <h2 className="text-2xl font-bold text-foreground mb-4 flex items-center gap-3">
                            <UserCircle size={24} className="text-primary" />
                            Account Registration
                        </h2>
                        <ul className="space-y-3 text-muted-foreground list-disc list-inside">
                            <li>You must create an account to make purchases on our platform.</li>
                            <li>You are responsible for maintaining the confidentiality of your account credentials.</li>
                            <li>You must provide accurate and complete information during registration.</li>
                            <li>You are responsible for all activities that occur under your account.</li>
                            <li>We reserve the right to suspend or terminate accounts that violate these Terms.</li>
                        </ul>
                    </div>

                    {/* Products and Licenses */}
                    <div className="bg-white dark:bg-white/5 rounded-3xl p-8 md:p-10 border border-gray-200 dark:border-white/10 mb-8">
                        <h2 className="text-2xl font-bold text-foreground mb-4 flex items-center gap-3">
                            <ShieldCheck size={24} className="text-primary" />
                            Products and Licenses
                        </h2>
                        <ul className="space-y-3 text-muted-foreground list-disc list-inside">
                            <li>All products sold are genuine, legitimate software licenses sourced from authorized distributors.</li>
                            <li>Each license key is valid for single use unless otherwise specified in the product description.</li>
                            <li>License keys are non-transferable once activated.</li>
                            <li>We do not guarantee compatibility with all systems; please verify system requirements before purchase.</li>
                            <li>Software functionality is governed by the respective software vendor&apos;s terms.</li>
                        </ul>
                    </div>

                    {/* Pricing and Payment */}
                    <div className="bg-white dark:bg-white/5 rounded-3xl p-8 md:p-10 border border-gray-200 dark:border-white/10 mb-8">
                        <h2 className="text-2xl font-bold text-foreground mb-4 flex items-center gap-3">
                            <CreditCard size={24} className="text-primary" />
                            Pricing and Payment
                        </h2>
                        <ul className="space-y-3 text-muted-foreground list-disc list-inside">
                            <li>All prices are displayed in Indian Rupees (INR) and are inclusive of applicable taxes.</li>
                            <li>Prices are subject to change without prior notice.</li>
                            <li>Payment must be completed through our secure payment gateway (Razorpay) at the time of purchase.</li>
                            <li>We accept various payment methods including credit/debit cards, UPI, net banking, and wallets.</li>
                            <li>Upon successful payment, you will receive an order confirmation email.</li>
                        </ul>
                    </div>

                    {/* Delivery */}
                    <div className="bg-white dark:bg-white/5 rounded-3xl p-8 md:p-10 border border-gray-200 dark:border-white/10 mb-8">
                        <h2 className="text-2xl font-bold text-foreground mb-4 flex items-center gap-3">
                            <FileText size={24} className="text-primary" />
                            Delivery
                        </h2>
                        <ul className="space-y-3 text-muted-foreground list-disc list-inside">
                            <li>All products are delivered digitally via email and through your account dashboard.</li>
                            <li>Delivery is typically instant upon payment confirmation.</li>
                            <li>In case of any delay, please contact our support team.</li>
                            <li>It is your responsibility to ensure your email address is correct to receive delivery.</li>
                        </ul>
                    </div>

                    {/* Prohibited Uses */}
                    <div className="bg-white dark:bg-white/5 rounded-3xl p-8 md:p-10 border border-gray-200 dark:border-white/10 mb-8">
                        <h2 className="text-2xl font-bold text-foreground mb-4 flex items-center gap-3">
                            <Warning size={24} className="text-red-500" />
                            Prohibited Uses
                        </h2>
                        <p className="text-muted-foreground mb-4">You agree NOT to:</p>
                        <ul className="space-y-3 text-muted-foreground list-disc list-inside">
                            <li>Resell, redistribute, or transfer license keys purchased from us.</li>
                            <li>Use our website for any unlawful purpose.</li>
                            <li>Attempt to gain unauthorized access to our systems or servers.</li>
                            <li>Engage in any activity that disrupts or interferes with our services.</li>
                            <li>Use automated systems or bots to access our website.</li>
                            <li>Provide false information or misrepresent your identity.</li>
                        </ul>
                    </div>

                    {/* Intellectual Property */}
                    <div className="bg-white dark:bg-white/5 rounded-3xl p-8 md:p-10 border border-gray-200 dark:border-white/10 mb-8">
                        <h2 className="text-2xl font-bold text-foreground mb-4 flex items-center gap-3">
                            <Scales size={24} className="text-primary" />
                            Intellectual Property
                        </h2>
                        <ul className="space-y-3 text-muted-foreground list-disc list-inside">
                            <li>All content on our website, including logos, text, images, and design, is our property or licensed to us.</li>
                            <li>Software trademarks belong to their respective owners (e.g., Microsoft, Adobe, etc.).</li>
                            <li>You may not copy, reproduce, or distribute any content from our website without permission.</li>
                        </ul>
                    </div>

                    {/* Limitation of Liability */}
                    <div className="bg-white dark:bg-white/5 rounded-3xl p-8 md:p-10 border border-gray-200 dark:border-white/10 mb-8">
                        <h2 className="text-2xl font-bold text-foreground mb-4 flex items-center gap-3">
                            <Warning size={24} className="text-amber-500" />
                            Limitation of Liability
                        </h2>
                        <ul className="space-y-3 text-muted-foreground list-disc list-inside">
                            <li>Our liability is limited to the purchase price of the product.</li>
                            <li>We are not liable for any indirect, incidental, or consequential damages.</li>
                            <li>We do not guarantee uninterrupted access to our website.</li>
                            <li>Software performance is subject to the respective vendor&apos;s terms and your system specifications.</li>
                        </ul>
                    </div>

                    {/* Governing Law */}
                    <div className="bg-white dark:bg-white/5 rounded-3xl p-8 md:p-10 border border-gray-200 dark:border-white/10 mb-8">
                        <h2 className="text-2xl font-bold text-foreground mb-4 flex items-center gap-3">
                            <Gavel size={24} className="text-primary" />
                            Governing Law
                        </h2>
                        <p className="text-muted-foreground">
                            These Terms shall be governed by and construed in accordance with the laws of India.
                            Any disputes arising out of or in connection with these Terms shall be subject to
                            the exclusive jurisdiction of the courts in Delhi, India.
                        </p>
                    </div>

                    {/* Changes to Terms */}
                    <div className="bg-white dark:bg-white/5 rounded-3xl p-8 md:p-10 border border-gray-200 dark:border-white/10 mb-8">
                        <h2 className="text-2xl font-bold text-foreground mb-4 flex items-center gap-3">
                            <FileText size={24} className="text-primary" />
                            Changes to Terms
                        </h2>
                        <p className="text-muted-foreground">
                            We reserve the right to modify these Terms at any time. Changes will be effective
                            immediately upon posting on our website. Your continued use of our services after
                            any changes constitutes acceptance of the new Terms.
                        </p>
                    </div>

                    {/* Contact Section */}
                    <div className="text-center">
                        <p className="text-muted-foreground mb-4">
                            For questions about these Terms, contact us at{' '}
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
        </div>
    );
}
