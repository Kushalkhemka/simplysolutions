"use client";

import Link from 'next/link';
import Image from 'next/image';
import { useCallback, useEffect, useState } from 'react';
import useEmblaCarousel from 'embla-carousel-react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

const popularCategories = [
    {
        name: 'Windows Operating System Licenses',
        slug: 'operating-systems',
        image: 'https://digitallicense.shop/wp-content/uploads/2025/02/DIGITAL-LICENSE-PAYMENTS-6.svg',
    },
    {
        name: 'Microsoft Office Licenses',
        slug: 'office-suites',
        image: 'https://digitallicense.shop/wp-content/uploads/2025/04/22.svg',
    },
    {
        name: 'Microsoft Server Licenses',
        slug: 'server-licenses',
        image: 'https://digitallicense.shop/wp-content/uploads/2025/07/122.svg',
    },
    {
        name: 'Antivirus Licenses',
        slug: 'antivirus',
        image: 'https://digitallicense.shop/wp-content/uploads/2025/05/Antivirus-Logo.svg',
    },
    {
        name: 'Corel Licenses',
        slug: 'corel-licenses',
        image: 'https://digitallicense.shop/wp-content/uploads/2025/04/DIGITAL-LICENSE-PAYMENTS-14.svg',
    },
    {
        name: 'Autodesk Licenses',
        slug: 'autodesk-licenses',
        image: 'https://digitallicense.shop/wp-content/uploads/2025/04/23.svg',
    },
    {
        name: 'Microsoft Office Suites for Mac',
        slug: 'office-mac',
        image: 'https://digitallicense.shop/wp-content/uploads/2025/04/DIGITAL-LICENSE-PAYMENTS-15.svg',
    },
    {
        name: 'VMware Licenses',
        slug: 'vmware-licenses',
        image: 'https://digitallicense.shop/wp-content/uploads/2025/04/28.svg',
    },
];

export function PopularCategories() {
    const [emblaRef, emblaApi] = useEmblaCarousel({
        loop: true,
        align: 'start',
        skipSnaps: false,
        dragFree: true
    });

    const [canScrollPrev, setCanScrollPrev] = useState(false);
    const [canScrollNext, setCanScrollNext] = useState(true);
    const [isHovered, setIsHovered] = useState(false);

    const scrollPrev = useCallback(() => emblaApi && emblaApi.scrollPrev(), [emblaApi]);
    const scrollNext = useCallback(() => emblaApi && emblaApi.scrollNext(), [emblaApi]);

    const onSelect = useCallback(() => {
        if (!emblaApi) return;
        setCanScrollPrev(emblaApi.canScrollPrev());
        setCanScrollNext(emblaApi.canScrollNext());
    }, [emblaApi]);

    useEffect(() => {
        if (!emblaApi) return;
        onSelect();
        emblaApi.on('select', onSelect);
        emblaApi.on('reInit', onSelect);
    }, [emblaApi, onSelect]);

    // Auto-slide functionality - slides every 2 seconds, pauses on hover
    useEffect(() => {
        if (!emblaApi || isHovered) return;

        const autoSlide = setInterval(() => {
            emblaApi.scrollNext();
        }, 2000);

        return () => clearInterval(autoSlide);
    }, [emblaApi, isHovered]);

    return (
        <section className="container-dense mb-6 mt-8">
            {/* Section Header */}
            <div className="flex items-center justify-between mb-6">
                <h2 className="font-bold text-xl flex items-center gap-2">
                    <span className="w-1 h-6 bg-primary rounded-full"></span>
                    Popular Categories
                </h2>

                {/* Navigation Buttons */}
                <div className="flex gap-2">
                    <button
                        onClick={scrollPrev}
                        className={cn(
                            "w-8 h-8 rounded-full border border-gray-200 flex items-center justify-center text-gray-500 hover:bg-primary hover:text-white hover:border-primary transition-colors",
                            !canScrollPrev && "opacity-50 cursor-not-allowed"
                        )}
                        disabled={!canScrollPrev}
                        aria-label="Previous slide"
                    >
                        <ChevronLeft className="w-4 h-4" />
                    </button>
                    <button
                        onClick={scrollNext}
                        className={cn(
                            "w-8 h-8 rounded-full border border-gray-200 flex items-center justify-center text-gray-500 hover:bg-primary hover:text-white hover:border-primary transition-colors",
                            !canScrollNext && "opacity-50 cursor-not-allowed"
                        )}
                        disabled={!canScrollNext}
                        aria-label="Next slide"
                    >
                        <ChevronRight className="w-4 h-4" />
                    </button>
                </div>
            </div>

            {/* Carousel Container */}
            <div
                className="relative overflow-hidden"
                ref={emblaRef}
                onMouseEnter={() => setIsHovered(true)}
                onMouseLeave={() => setIsHovered(false)}
            >
                <div className="flex -ml-5 py-2">
                    {popularCategories.map((category) => (
                        <div className="flex-[0_0_50%] sm:flex-[0_0_33.33%] md:flex-[0_0_25%] lg:flex-[0_0_20%] pl-5 min-w-0" key={category.slug}>
                            <Link
                                href={`/products?category=${category.slug}`}
                                className="group block h-full"
                            >
                                <div className="h-full bg-[#f4f4f4] border-[3px] border-[#f4f4f4] rounded-[10px] overflow-hidden transition-transform duration-300 hover:-translate-y-1">
                                    {/* Image Container */}
                                    <div className="relative w-full aspect-[325/177] bg-[#f4f4f4] overflow-hidden p-2">
                                        <Image
                                            src={category.image}
                                            alt={category.name}
                                            fill
                                            className="object-contain p-2 group-hover:scale-105 transition-transform duration-500"
                                        />
                                    </div>

                                    {/* Content */}
                                    <div className="bg-white dark:bg-card p-[15px_20px_20px_20px] text-center min-h-[100px] flex flex-col items-center justify-center">
                                        <h3 className="font-medium text-[0.9375rem] leading-[1.35] text-foreground group-hover:text-primary transition-colors">
                                            {category.name}
                                        </h3>
                                        {/* Optional: Add star rating or count if needed later */}
                                    </div>
                                </div>
                            </Link>
                        </div>
                    ))}
                </div>
            </div>

            <div className="h-4 md:h-6 w-full border-b border-dashed border-gray-200 dark:border-gray-800 mt-4 mb-2"></div>
        </section>
    );
}
