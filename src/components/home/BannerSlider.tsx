'use client';

import React, { useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import useEmblaCarousel from 'embla-carousel-react';
import { ChevronLeft, ChevronRight, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import Autoplay from 'embla-carousel-autoplay';

interface BannerSliderProps {
    products?: any[];
}

export function BannerSlider({ products = [] }: BannerSliderProps) {
    const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true }, [
        Autoplay({ delay: 5000, stopOnInteraction: false })
    ]);

    const [selectedIndex, setSelectedIndex] = React.useState(0);

    const scrollPrev = useCallback(() => {
        if (emblaApi) emblaApi.scrollPrev();
    }, [emblaApi]);

    const scrollNext = useCallback(() => {
        if (emblaApi) emblaApi.scrollNext();
    }, [emblaApi]);

    const onSelect = useCallback(() => {
        if (!emblaApi) return;
        setSelectedIndex(emblaApi.selectedScrollSnap());
    }, [emblaApi]);

    React.useEffect(() => {
        if (!emblaApi) return;
        onSelect();
        emblaApi.on('select', onSelect);
        emblaApi.on('reInit', onSelect);
    }, [emblaApi, onSelect]);

    // Fallback if no products
    const slides = products.length > 0 ? products.slice(0, 5) : [
        {
            id: 'fallback-1',
            name: 'Office 2024 Professional Plus',
            description: 'Maximize your productivity with the essential office tools. Outlook, Word, Excel, PowerPoint and more.',
            price: 1499,
            mrp: 24999,
            main_image_url: '/images/offic2024_promo_image-removebg-preview.png',
            slug: 'microsoft-office-pro-plus-ltsc-2024-full-edition-or-new-2025-updated-lifetime-retail-key-for-windows-off_35'
        }
    ];

    return (
        <section className="container-dense py-6 relative group">
            <div className="overflow-hidden rounded-2xl shadow-xl bg-gray-50 dark:bg-gray-900 border border-border/50" ref={emblaRef}>
                <div className="flex">
                    {slides.map((product, index) => {
                        const discount = product.mrp ? Math.round(((product.mrp - product.price) / product.mrp) * 100) : 0;

                        return (
                            <div className="flex-[0_0_100%] min-w-0 relative" key={product.id || index}>
                                {/* Background - Using the generated Dotted Pattern */}
                                <div className="absolute inset-0 bg-[#F3F4F6] dark:bg-[#111] z-0">
                                    <Image
                                        src="/assets/banners/banner-bg-dotted.png"
                                        alt="Background Pattern"
                                        fill
                                        className="object-cover opacity-60 dark:opacity-10 mix-blend-multiply dark:mix-blend-overlay"
                                        priority={index === 0}
                                    />
                                </div>

                                {/* Content Grid */}
                                <div className="relative z-10 grid grid-cols-1 md:grid-cols-12 min-h-[400px] md:h-[480px]">

                                    {/* Left Content */}
                                    <div className="md:col-span-6 flex flex-col justify-center p-8 md:p-16 relative">
                                        {/* Decorative dots for mobile/text area */}
                                        <div className="absolute top-10 left-10 w-24 h-24 opacity-20 pointer-events-none hidden md:block">
                                            <svg width="100%" height="100%" viewBox="0 0 100 100" fill="currentColor" className="text-primary">
                                                <pattern id="dots" x="0" y="0" width="20" height="20" patternUnits="userSpaceOnUse">
                                                    <circle cx="2" cy="2" r="2" />
                                                </pattern>
                                                <rect width="100" height="100" fill="url(#dots)" />
                                            </svg>
                                        </div>

                                        <div className="mb-6 space-y-2 animate-fadeIn">
                                            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-bold uppercase tracking-wider w-fit">
                                                <Sparkles className="w-4 h-4 fill-current" />
                                                New Deals Just Dropped
                                            </div>
                                            <h2 className="text-4xl md:text-6xl font-black text-gray-900 dark:text-white leading-[1.1] tracking-tight">
                                                {product.name}
                                            </h2>
                                            <p className="text-lg text-gray-600 dark:text-gray-300 max-w-lg mt-4 font-medium leading-relaxed">
                                                {product.description?.substring(0, 100)}...
                                                <span className="block mt-2 text-primary font-bold">
                                                    Save up to {discount > 0 ? discount : 70}% off on all our products
                                                </span>
                                            </p>
                                        </div>

                                        <div className="flex flex-wrap gap-4 mt-2">
                                            <Link href={`/products/${product.slug}`}>
                                                <Button size="lg" className="rounded-full px-8 h-12 text-base font-bold bg-[#F97316] hover:bg-[#EA580C] text-white border-0 shadow-lg shadow-orange-500/20 transform transition-transform hover:scale-105">
                                                    Shop Now
                                                </Button>
                                            </Link>
                                            <div className="flex flex-col justify-center">
                                                <span className="text-xs text-muted-foreground line-through">₹{product.mrp?.toLocaleString()}</span>
                                                <span className="text-xl font-bold text-gray-900 dark:text-white">₹{product.price?.toLocaleString()}</span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Right Image */}
                                    <div className="md:col-span-6 flex items-center justify-center relative p-8 md:p-0">
                                        {/* Glow effect behind visual */}
                                        <div className="absolute w-[300px] h-[300px] bg-primary/20 blur-[100px] rounded-full top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 pointer-events-none" />

                                        <div className="relative w-full h-[300px] md:h-[400px] transform transition-transform duration-700 hover:scale-105">
                                            {product.main_image_url ? (
                                                <Image
                                                    src={product.main_image_url}
                                                    alt={product.name}
                                                    fill
                                                    className="object-contain drop-shadow-2xl"
                                                    priority={index === 0}
                                                />
                                            ) : (
                                                // Fallback Visual (Boxes)
                                                <div className="w-full h-full flex items-center justify-center perspective-[1000px]">
                                                    <div className="relative w-48 h-64 bg-white shadow-2xl transform rotate-y-[-15deg] rotate-x-[5deg] border border-gray-100 flex items-center justify-center">
                                                        <span className="font-bold text-gray-300">Product Box</span>
                                                    </div>
                                                    <div className="relative w-48 h-64 bg-white shadow-2xl transform rotate-y-[-15deg] rotate-x-[5deg] -ml-24 mt-12 z-10 border border-gray-100 flex items-center justify-center">
                                                        <span className="font-bold text-gray-300">Product Box</span>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Navigation Buttons */}
            <div className="absolute top-1/2 -translate-y-1/2 left-4 z-20 opacity-0 group-hover:opacity-100 transition-opacity hidden md:block">
                <Button variant="secondary" size="icon" className="h-12 w-12 rounded-full shadow-lg bg-white/80 hover:bg-white dark:bg-black/50 backdrop-blur-sm" onClick={scrollPrev}>
                    <ChevronLeft className="w-6 h-6" />
                </Button>
            </div>
            <div className="absolute top-1/2 -translate-y-1/2 right-4 z-20 opacity-0 group-hover:opacity-100 transition-opacity hidden md:block">
                <Button variant="secondary" size="icon" className="h-12 w-12 rounded-full shadow-lg bg-white/80 hover:bg-white dark:bg-black/50 backdrop-blur-sm" onClick={scrollNext}>
                    <ChevronRight className="w-6 h-6" />
                </Button>
            </div>

            {/* Dots */}
            <div className="absolute bottom-10 left-1/2 -translate-x-1/2 z-20 flex gap-2">
                {slides.map((_, idx) => (
                    <button
                        key={idx}
                        className={cn(
                            "w-2 h-2 rounded-full transition-all duration-300",
                            idx === selectedIndex ? "bg-primary w-6" : "bg-gray-400 hover:bg-primary/50"
                        )}
                        onClick={() => emblaApi && emblaApi.scrollTo(idx)}
                    />
                ))}
            </div>
        </section>
    );
}
