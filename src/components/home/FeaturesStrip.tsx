"use client";

import { Rocket, Tag, Headphones, ShieldCheck, CreditCard } from "lucide-react";

export function FeaturesStrip() {
    const features = [
        {
            icon: Rocket,
            title: "Instant Delivery",
            description: "Get your license keys immediately via email",
        },
        {
            icon: Tag,
            title: "Best Price Guarantee",
            description: "We match or beat competitor prices",
        },
        {
            icon: Headphones,
            title: "24/7 Free Assistance",
            description: "Expert support whenever you need it",
        },
        {
            icon: ShieldCheck,
            title: "100% Authentic",
            description: "Genuine Microsoft license keys",
        },
        {
            icon: CreditCard,
            title: "Secure Payments",
            description: "Encrypted & safe checkout process",
        },
    ];

    return (
        <section className="w-full bg-[#111111] border-y border-white/5 relative overflow-hidden">
            {/* Subtle top gloss effect */}
            <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />

            <div className="container-dense py-6">
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-y-8 gap-x-4">
                    {features.map((feature, index) => (
                        <div
                            key={index}
                            className={`
                                group flex items-center gap-3 relative
                                ${index === features.length - 1 ? 'col-span-2 lg:col-span-1 justify-center lg:justify-start' : 'justify-start'}
                            `}
                        >
                            {/* Vertical Divider (Desktop Only) */}
                            {index !== 0 && (
                                <div className="hidden lg:block absolute left-0 top-1/2 -translate-y-1/2 h-8 w-px bg-gradient-to-b from-transparent via-white/10 to-transparent" style={{ left: '-1rem' }} />
                            )}

                            {/* Icon Container */}
                            <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center flex-shrink-0 group-hover:bg-orange-500/10 transition-colors duration-300">
                                <feature.icon
                                    className="w-5 h-5 text-orange-500 group-hover:scale-110 transition-transform duration-300"
                                    strokeWidth={1.5}
                                />
                            </div>

                            {/* Text Content */}
                            <div className="flex flex-col min-w-0">
                                <span className="font-semibold text-sm text-white leading-tight mb-0.5 group-hover:text-orange-500 transition-colors duration-300">
                                    {feature.title}
                                </span>
                                <span className="text-xs text-zinc-400 leading-snug truncate pr-2">
                                    {feature.description}
                                </span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}
