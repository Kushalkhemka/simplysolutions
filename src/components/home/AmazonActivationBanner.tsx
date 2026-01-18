'use client';

import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight, KeyRound, ShieldCheck } from 'lucide-react';

export function AmazonActivationBanner() {
    return (
        <section className="container-dense py-6">
            <div className="relative overflow-hidden rounded-2xl bg-orange-500 shadow-xl">
                {/* Subtle background elements */}
                <div className="absolute inset-0 overflow-hidden">
                    <div className="absolute -top-1/2 -right-1/4 w-96 h-96 bg-white/10 rounded-full blur-3xl" />
                    <div className="absolute -bottom-1/2 -left-1/4 w-96 h-96 bg-orange-600/30 rounded-full blur-3xl" />
                </div>

                <div className="relative z-10 px-6 py-8 md:px-10 md:py-10">
                    <div className="flex flex-col md:flex-row items-center justify-between gap-6 md:gap-8">
                        {/* Left Content */}
                        <div className="flex flex-col md:flex-row items-center gap-4 md:gap-6 text-center md:text-left">
                            {/* Amazon Logo */}
                            <div className="flex-shrink-0 p-3 bg-white rounded-xl shadow-lg">
                                <Image
                                    src="/images/Amazon_logo.svg.webp"
                                    alt="Amazon"
                                    width={100}
                                    height={30}
                                    className="h-8 w-auto"
                                />
                            </div>

                            <div>
                                <h3 className="text-xl md:text-2xl font-bold text-white mb-1">
                                    Ordered from Amazon?
                                </h3>
                                <p className="text-white/90 font-medium text-sm md:text-base">
                                    Generate & Activate your license keys instantly — No login required!
                                </p>
                            </div>
                        </div>

                        {/* Right Content - Features & CTA */}
                        <div className="flex flex-col sm:flex-row items-center gap-4 md:gap-6">
                            {/* Feature pills */}
                            <div className="hidden lg:flex items-center gap-3">
                                <div className="flex items-center gap-1.5 px-3 py-1.5 bg-white/15 backdrop-blur-sm rounded-full">
                                    <ShieldCheck className="w-4 h-4 text-white" />
                                    <span className="text-xs text-white font-medium">No Account Needed</span>
                                </div>
                                <div className="flex items-center gap-1.5 px-3 py-1.5 bg-white/15 backdrop-blur-sm rounded-full">
                                    <KeyRound className="w-4 h-4 text-white" />
                                    <span className="text-xs text-white font-medium">Instant Key</span>
                                </div>
                            </div>

                            {/* CTA Button */}
                            <Link
                                href="/activate"
                                className="group flex items-center gap-2 px-6 py-3 bg-white hover:bg-gray-50 text-orange-600 font-bold rounded-full shadow-lg hover:shadow-xl transition-all duration-300"
                            >
                                <span>Activate Now</span>
                                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
