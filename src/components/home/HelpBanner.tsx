"use client";

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { LifeBuoy, ExternalLink } from 'lucide-react';

export function HelpBanner() {
    return (
        <section className="container-dense mb-12">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
                {/* Left: Contact / Need Help (Green) */}
                <div className="bg-primary rounded-xl p-8 flex items-center justify-between relative overflow-hidden shadow-sm min-h-[140px]">
                    <div className="relative z-10 flex items-center gap-6">
                        {/* Icon/Character Placeholder - Using a friendly icon since we can't generate the 3D character right now */}
                        <div className="hidden sm:flex w-16 h-16 bg-white/20 backdrop-blur-sm rounded-full items-center justify-center shrink-0">
                            <LifeBuoy className="w-8 h-8 text-white" />
                        </div>

                        <div>
                            <h3 className="text-2xl font-bold text-white mb-1">Need Any Help?</h3>
                            <p className="text-white/90 font-medium">We are here to help you with any question.</p>
                        </div>
                    </div>

                    {/* Decorative dots pattern */}
                    <div className="absolute left-6 top-1/2 -translate-y-1/2 flex flex-col gap-1 opacity-30">
                        {[...Array(6)].map((_, i) => (
                            <div key={i} className="flex gap-1">
                                <div className="w-1 h-1 bg-white rounded-full"></div>
                                <div className="w-1 h-1 bg-white rounded-full"></div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Right: Contact Buttons (White) */}
                <div className="bg-white dark:bg-card border rounded-xl p-8 flex flex-col sm:flex-row items-center justify-between gap-6 shadow-sm min-h-[140px]">
                    <Link href="/contact" className="w-full sm:w-auto">
                        <Button variant="secondary" size="lg" className="w-full sm:w-auto font-bold bg-[#F3F4F8] hover:bg-gray-200 text-gray-900 gap-2">
                            Contact Us <ExternalLink size={16} />
                        </Button>
                    </Link>

                    <div className="text-center sm:text-right">
                        <p className="text-gray-500 font-medium mb-1 text-sm">Monday to Sunday - 24/7</p>
                        <Link href="/faq" className="text-[#8B5CF6] font-bold hover:underline decoration-2 underline-offset-4">
                            Frequently Asked Questions
                        </Link>
                    </div>
                </div>
            </div>
        </section>
    );
}
