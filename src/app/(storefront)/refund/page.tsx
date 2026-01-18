import { Metadata } from 'next';
import Link from 'next/link';
import { ArrowCounterClockwise, CheckCircle, XCircle, Clock, ShieldCheck, Headset } from '@/components/ui/icons';

export const metadata: Metadata = {
    title: 'Cancellation and Refund Policy | SimplySolutions',
    description: 'Learn about our cancellation and refund policy for digital software licenses.',
};

export default function RefundPolicyPage() {
    return (
        <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white dark:from-[#0f1015] dark:to-[#1a1c23]">
            <div className="relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-r from-primary/10 via-transparent to-primary/5" />
                <div className="container-dense py-16 md:py-24 relative">
                    <div className="max-w-3xl mx-auto text-center">
                        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6">
                            <ArrowCounterClockwise size={18} weight="bold" />
                            <span>Customer Protection</span>
                        </div>
                        <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-6">
                            Cancellation &amp; <span className="text-primary">Refund Policy</span>
                        </h1>
                        <p className="text-lg text-muted-foreground">We stand behind our products with a fair refund policy.</p>
                    </div>
                </div>
            </div>

            <div className="container-dense py-12">
                <div className="max-w-4xl mx-auto space-y-8">
                    {/* Refunds Applicable */}
                    <div className="bg-white dark:bg-white/5 rounded-2xl p-8 border border-gray-200 dark:border-white/10">
                        <h2 className="text-xl font-bold text-foreground mb-6 flex items-center gap-3">
                            <CheckCircle size={24} className="text-green-500" /> When Refunds Apply
                        </h2>
                        <ul className="space-y-3 text-muted-foreground">
                            <li className="flex gap-3"><CheckCircle size={18} className="text-green-500 mt-1 flex-shrink-0" /><span><strong className="text-foreground">Invalid License Key</strong> - Full refund or replacement if key doesn&apos;t work</span></li>
                            <li className="flex gap-3"><CheckCircle size={18} className="text-green-500 mt-1 flex-shrink-0" /><span><strong className="text-foreground">Duplicate Purchase</strong> - Refund for accidental double purchases (if unused)</span></li>
                            <li className="flex gap-3"><CheckCircle size={18} className="text-green-500 mt-1 flex-shrink-0" /><span><strong className="text-foreground">Wrong Product</strong> - Correct product provided or full refund</span></li>
                            <li className="flex gap-3"><CheckCircle size={18} className="text-green-500 mt-1 flex-shrink-0" /><span><strong className="text-foreground">Non-Delivery</strong> - Full refund if not delivered within 24 hours</span></li>
                        </ul>
                    </div>

                    {/* Refunds Not Applicable */}
                    <div className="bg-white dark:bg-white/5 rounded-2xl p-8 border border-gray-200 dark:border-white/10">
                        <h2 className="text-xl font-bold text-foreground mb-6 flex items-center gap-3">
                            <XCircle size={24} className="text-red-500" /> When Refunds Don&apos;t Apply
                        </h2>
                        <ul className="space-y-3 text-muted-foreground">
                            <li className="flex gap-3"><XCircle size={18} className="text-red-500 mt-1 flex-shrink-0" /><span><strong className="text-foreground">Change of Mind</strong> - After purchase completion</span></li>
                            <li className="flex gap-3"><XCircle size={18} className="text-red-500 mt-1 flex-shrink-0" /><span><strong className="text-foreground">Activated License</strong> - Once key is used on any device</span></li>
                            <li className="flex gap-3"><XCircle size={18} className="text-red-500 mt-1 flex-shrink-0" /><span><strong className="text-foreground">System Incompatibility</strong> - Check requirements before purchase</span></li>
                        </ul>
                    </div>

                    {/* Refund Process */}
                    <div className="bg-white dark:bg-white/5 rounded-2xl p-8 border border-gray-200 dark:border-white/10">
                        <h2 className="text-xl font-bold text-foreground mb-6 flex items-center gap-3">
                            <Clock size={24} className="text-primary" /> Refund Process
                        </h2>
                        <div className="grid md:grid-cols-3 gap-6 text-center">
                            <div><div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-3 text-primary font-bold">1</div><p className="text-sm text-muted-foreground">Contact support within 7 days</p></div>
                            <div><div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-3 text-primary font-bold">2</div><p className="text-sm text-muted-foreground">Review within 24-48 hours</p></div>
                            <div><div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-3 text-primary font-bold">3</div><p className="text-sm text-muted-foreground">Refund in 5-7 business days</p></div>
                        </div>
                    </div>

                    {/* Replacement Guarantee */}
                    <div className="bg-gradient-to-br from-primary/10 to-primary/5 rounded-2xl p-8 border border-primary/20">
                        <h2 className="text-xl font-bold text-foreground mb-4 flex items-center gap-3">
                            <ShieldCheck size={24} className="text-primary" /> Replacement Guarantee
                        </h2>
                        <p className="text-muted-foreground mb-4">We prefer to offer replacements to ensure you get working software:</p>
                        <ul className="space-y-2 text-muted-foreground">
                            <li className="flex items-center gap-2"><CheckCircle size={16} className="text-green-500" />Free replacement for non-working keys</li>
                            <li className="flex items-center gap-2"><CheckCircle size={16} className="text-green-500" />Priority activation support</li>
                            <li className="flex items-center gap-2"><CheckCircle size={16} className="text-green-500" />Lifetime key replacement guarantee (terms apply)</li>
                        </ul>
                    </div>

                    {/* Contact */}
                    <div className="text-center p-8 bg-white dark:bg-white/5 rounded-2xl border border-gray-200 dark:border-white/10">
                        <Headset size={40} className="text-primary mx-auto mb-4" />
                        <h2 className="text-xl font-bold text-foreground mb-4">Need Help?</h2>
                        <div className="flex flex-col sm:flex-row gap-4 justify-center">
                            <Link href="/dashboard/support/new" className="px-6 py-3 bg-primary text-white font-medium rounded-xl hover:bg-primary/90 transition-colors">Submit Ticket</Link>
                            <a href="mailto:support@simplysolutions.co.in" className="px-6 py-3 bg-gray-100 dark:bg-white/10 text-foreground font-medium rounded-xl hover:bg-gray-200 dark:hover:bg-white/20 transition-colors">Email Support</a>
                        </div>
                        <p className="text-sm text-muted-foreground mt-6">Last updated: January 2026</p>
                    </div>
                </div>
            </div>
        </div>
    );
}
