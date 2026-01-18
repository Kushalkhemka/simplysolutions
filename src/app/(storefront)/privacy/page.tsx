import { Metadata } from 'next';
import { ShieldCheck, Eye, Lock, Database, Cookie, UserCircle, Envelope } from '@/components/ui/icons';

export const metadata: Metadata = {
    title: 'Privacy Policy | SimplySolutions',
    description: 'Learn how SimplySolutions collects, uses, and protects your personal information.',
};

export default function PrivacyPolicyPage() {
    return (
        <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white dark:from-[#0f1015] dark:to-[#1a1c23]">
            <div className="relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-r from-primary/10 via-transparent to-primary/5" />
                <div className="container-dense py-16 md:py-24 relative">
                    <div className="max-w-3xl mx-auto text-center">
                        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6">
                            <ShieldCheck size={18} weight="duotone" />
                            <span>Your Privacy Matters</span>
                        </div>
                        <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-6">
                            Privacy <span className="text-primary">Policy</span>
                        </h1>
                        <p className="text-lg text-muted-foreground">How we collect, use, and protect your information.</p>
                    </div>
                </div>
            </div>

            <div className="container-dense py-12">
                <div className="max-w-4xl mx-auto space-y-8">
                    {/* Information We Collect */}
                    <div className="bg-white dark:bg-white/5 rounded-2xl p-8 border border-gray-200 dark:border-white/10">
                        <h2 className="text-xl font-bold text-foreground mb-4 flex items-center gap-3">
                            <Database size={24} className="text-primary" /> Information We Collect
                        </h2>
                        <ul className="space-y-3 text-muted-foreground list-disc list-inside">
                            <li><strong className="text-foreground">Personal Information:</strong> Name, email address, phone number when you create an account</li>
                            <li><strong className="text-foreground">Payment Information:</strong> Processed securely through Razorpay; we do not store card details</li>
                            <li><strong className="text-foreground">Order Information:</strong> Purchase history, license keys, and transaction records</li>
                            <li><strong className="text-foreground">Device Information:</strong> IP address, browser type, and device identifiers for security</li>
                        </ul>
                    </div>

                    {/* How We Use Information */}
                    <div className="bg-white dark:bg-white/5 rounded-2xl p-8 border border-gray-200 dark:border-white/10">
                        <h2 className="text-xl font-bold text-foreground mb-4 flex items-center gap-3">
                            <Eye size={24} className="text-primary" /> How We Use Your Information
                        </h2>
                        <ul className="space-y-3 text-muted-foreground list-disc list-inside">
                            <li>To process and deliver your orders</li>
                            <li>To send order confirmations, license keys, and support communications</li>
                            <li>To provide customer support and respond to inquiries</li>
                            <li>To send promotional offers and updates (with your consent)</li>
                            <li>To prevent fraud and ensure security of transactions</li>
                            <li>To improve our website and services</li>
                        </ul>
                    </div>

                    {/* Data Protection */}
                    <div className="bg-white dark:bg-white/5 rounded-2xl p-8 border border-gray-200 dark:border-white/10">
                        <h2 className="text-xl font-bold text-foreground mb-4 flex items-center gap-3">
                            <Lock size={24} className="text-primary" /> Data Protection
                        </h2>
                        <ul className="space-y-3 text-muted-foreground list-disc list-inside">
                            <li>All data transmitted is encrypted using SSL/TLS technology</li>
                            <li>Payment processing is handled by PCI-DSS compliant Razorpay</li>
                            <li>We implement industry-standard security measures</li>
                            <li>Access to personal data is limited to authorized personnel only</li>
                            <li>Regular security audits and updates are performed</li>
                        </ul>
                    </div>

                    {/* Cookies */}
                    <div className="bg-white dark:bg-white/5 rounded-2xl p-8 border border-gray-200 dark:border-white/10">
                        <h2 className="text-xl font-bold text-foreground mb-4 flex items-center gap-3">
                            <Cookie size={24} className="text-primary" /> Cookies
                        </h2>
                        <p className="text-muted-foreground mb-4">We use cookies and similar technologies to:</p>
                        <ul className="space-y-2 text-muted-foreground list-disc list-inside">
                            <li>Keep you logged in to your account</li>
                            <li>Remember your preferences and cart items</li>
                            <li>Analyze website traffic and usage patterns</li>
                            <li>Improve our services and user experience</li>
                        </ul>
                        <p className="text-muted-foreground mt-4">You can manage cookie preferences through your browser settings.</p>
                    </div>

                    {/* Third-Party Sharing */}
                    <div className="bg-white dark:bg-white/5 rounded-2xl p-8 border border-gray-200 dark:border-white/10">
                        <h2 className="text-xl font-bold text-foreground mb-4 flex items-center gap-3">
                            <UserCircle size={24} className="text-primary" /> Third-Party Sharing
                        </h2>
                        <p className="text-muted-foreground mb-4">We do not sell your personal information. We may share data with:</p>
                        <ul className="space-y-2 text-muted-foreground list-disc list-inside">
                            <li><strong className="text-foreground">Payment Processors:</strong> Razorpay for secure payment processing</li>
                            <li><strong className="text-foreground">Email Services:</strong> For sending transactional and promotional emails</li>
                            <li><strong className="text-foreground">Analytics:</strong> Anonymous usage data to improve our services</li>
                            <li><strong className="text-foreground">Legal Requirements:</strong> When required by law or to protect our rights</li>
                        </ul>
                    </div>

                    {/* Your Rights */}
                    <div className="bg-gradient-to-br from-primary/10 to-primary/5 rounded-2xl p-8 border border-primary/20">
                        <h2 className="text-xl font-bold text-foreground mb-4 flex items-center gap-3">
                            <ShieldCheck size={24} className="text-primary" /> Your Rights
                        </h2>
                        <ul className="space-y-2 text-muted-foreground list-disc list-inside">
                            <li>Access, update, or delete your personal information</li>
                            <li>Opt-out of promotional communications</li>
                            <li>Request a copy of your data</li>
                            <li>Withdraw consent for data processing</li>
                        </ul>
                        <p className="text-muted-foreground mt-4">To exercise these rights, contact us at support@simplysolutions.co.in</p>
                    </div>

                    {/* Contact */}
                    <div className="text-center p-8 bg-white dark:bg-white/5 rounded-2xl border border-gray-200 dark:border-white/10">
                        <Envelope size={40} className="text-primary mx-auto mb-4" />
                        <h2 className="text-xl font-bold text-foreground mb-2">Questions About Privacy?</h2>
                        <p className="text-muted-foreground mb-4">Contact our Data Protection team:</p>
                        <a href="mailto:support@simplysolutions.co.in" className="text-primary hover:underline">support@simplysolutions.co.in</a>
                        <p className="text-sm text-muted-foreground mt-6">Last updated: January 2026</p>
                    </div>
                </div>
            </div>
        </div>
    );
}
