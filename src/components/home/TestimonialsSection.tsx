'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Star, CheckCircle2, ChevronLeft, ChevronRight, Quote } from 'lucide-react';
import Link from 'next/link';

const testimonials = [
    {
        id: 1,
        name: 'Zaid Nasruddin',
        rating: 5,
        date: '9 hours ago',
        title: 'Seamless experience',
        text: 'Seamless experience. Clear instructions for the downloading process.',
        verified: true,
    },
    {
        id: 2,
        name: 'Pascal Weiss',
        rating: 5,
        date: '21 hours ago',
        title: 'Legit working License delivered in minutes',
        text: 'Easy to purchase, Product and invoice delivered in few minutes. Correct license and working perfectly!',
        verified: true,
    },
    {
        id: 3,
        name: 'Igor',
        rating: 5,
        date: '2 days ago',
        title: 'Ordered VS 2026 License',
        text: 'Ordered VS 2026 License, took them 6 mins to process the license, got an email with clear instructions. Amazing service!',
        verified: true,
    },
    {
        id: 4,
        name: 'Isofache Mihai',
        rating: 4,
        date: '2 days ago',
        title: 'My experience with helpdesk was very good',
        text: 'My experience with helpdesk was very good. The fast reply I have appreciated very much.',
        verified: true,
    },
    {
        id: 5,
        name: 'Lawrence',
        rating: 5,
        date: '3 days ago',
        title: 'After a quick email reply and instructions',
        text: 'After a quick email reply and instructions that were easily followed I had no problems at all.',
        verified: true,
    },
    {
        id: 6,
        name: 'Ayush',
        rating: 5,
        date: '3 days ago',
        title: 'Great website for affordable keys',
        text: 'Great website for affordable keys. Great customer support as well.',
        verified: false,
    },
    {
        id: 7,
        name: 'Randy',
        rating: 5,
        date: '3 days ago',
        title: 'The process was so easy',
        text: 'The process was so easy, and the software was as described! I encountered no issues.',
        verified: true,
    },
    {
        id: 8,
        name: 'Sr Leonard Ramirez',
        rating: 5,
        date: '5 days ago',
        title: 'All excellent',
        text: 'All excellent. Fast delivery and great support.',
        verified: true,
    },
    {
        id: 9,
        name: 'Arturo Cannarozzo',
        rating: 5,
        date: '5 days ago',
        title: 'Great customer service',
        text: 'Great customer service. Quick response and helpful support team.',
        verified: true,
    },
    {
        id: 10,
        name: 'Gruyeria',
        rating: 5,
        date: '5 days ago',
        title: 'Quick delivery and great price',
        text: 'Quick delivery and great price. Will definitely come back!',
        verified: true,
    },
    {
        id: 11,
        name: 'Cliente',
        rating: 5,
        date: '5 days ago',
        title: 'First purchase',
        text: 'First purchase, and everything went incredibly well, licensed keys, with no headaches.',
        verified: true,
    },
    {
        id: 12,
        name: 'Cristiana Njehrrena',
        rating: 5,
        date: '6 days ago',
        title: 'Definitely a customer for life now 🙏🏻',
        text: 'Quickest reply for any help I needed with my license. Best product and service!',
        verified: false,
    },
];

function StarRating({ rating }: { rating: number }) {
    return (
        <div className="flex gap-0.5">
            {[1, 2, 3, 4, 5].map((star) => (
                <div
                    key={star}
                    className={`w-5 h-5 flex items-center justify-center ${star <= rating ? 'bg-[#00b67a]' : 'bg-gray-200'
                        }`}
                >
                    <Star className="w-3.5 h-3.5 text-white" />
                </div>
            ))}
        </div>
    );
}

function TestimonialCard({ testimonial }: { testimonial: typeof testimonials[0] }) {
    return (
        <div className="relative bg-card border rounded-xl p-5 min-w-[320px] max-w-[320px] flex-shrink-0 transition-all duration-300 hover:shadow-lg hover:border-primary/30 group">
            {/* Quote Icon */}
            <div className="absolute -top-3 right-4 w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                <Quote className="w-4 h-4 text-primary fill-primary" />
            </div>

            {/* Header with stars and verified badge */}
            <div className="flex items-center justify-between mb-3">
                <StarRating rating={testimonial.rating} />
                {testimonial.verified && (
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <CheckCircle2 className="w-3.5 h-3.5 text-[#00b67a] fill-[#00b67a]" />
                        <span>Verified</span>
                    </div>
                )}
            </div>

            {/* Title */}
            <h4 className="font-semibold text-foreground mb-2 line-clamp-1 group-hover:text-primary transition-colors">
                {testimonial.title}
            </h4>

            {/* Review Text */}
            <p className="text-sm text-muted-foreground mb-4 line-clamp-3 leading-relaxed">
                {testimonial.text}
            </p>

            {/* Author and Date */}
            <div className="flex items-center justify-between pt-3 border-t border-border/50">
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary/20 to-primary/40 flex items-center justify-center text-sm font-semibold text-primary">
                        {testimonial.name.charAt(0)}
                    </div>
                    <span className="text-sm font-medium text-foreground">{testimonial.name}</span>
                </div>
                <span className="text-xs text-muted-foreground">{testimonial.date}</span>
            </div>
        </div>
    );
}

export function TestimonialsSection() {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isAutoPlaying, setIsAutoPlaying] = useState(true);
    const cardsPerView = 4;
    const maxIndex = testimonials.length - cardsPerView;

    const nextSlide = useCallback(() => {
        setCurrentIndex((prev) => (prev >= maxIndex ? 0 : prev + 1));
    }, [maxIndex]);

    const prevSlide = useCallback(() => {
        setCurrentIndex((prev) => (prev <= 0 ? maxIndex : prev - 1));
    }, [maxIndex]);

    // Auto-play
    useEffect(() => {
        if (!isAutoPlaying) return;
        const interval = setInterval(nextSlide, 4000);
        return () => clearInterval(interval);
    }, [isAutoPlaying, nextSlide]);

    return (
        <section className="py-12 bg-gradient-to-b from-muted/30 to-background overflow-hidden">
            <div className="container-dense">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
                    <div>
                        <div className="flex items-center gap-2 mb-2">
                            <div className="w-1 h-6 bg-[#00b67a] rounded-full"></div>
                            <h2 className="text-2xl font-bold">What Our Customers Say</h2>
                        </div>
                        <p className="text-muted-foreground">
                            Join thousands of satisfied customers who trust SimplySolutions
                        </p>
                    </div>

                    {/* Trustpilot Summary */}
                    <Link
                        href="https://www.trustpilot.com/review/digitallicense.shop"
                        target="_blank"
                        className="flex items-center gap-4 bg-card border rounded-xl px-5 py-3 hover:shadow-md transition-shadow"
                    >
                        <div className="flex flex-col items-center">
                            <span className="text-lg font-bold text-[#00b67a]">Excellent</span>
                            <div className="flex gap-0.5 mt-1">
                                {[1, 2, 3, 4, 5].map((star) => (
                                    <div
                                        key={star}
                                        className={`w-4 h-4 flex items-center justify-center ${star <= 4 ? 'bg-[#00b67a]' : 'bg-[#00b67a]/60'
                                            }`}
                                    >
                                        <Star className="w-2.5 h-2.5 fill-white text-white" />
                                    </div>
                                ))}
                            </div>
                        </div>
                        <div className="border-l pl-4">
                            <div className="text-sm text-muted-foreground">Based on</div>
                            <div className="font-semibold">2,829 reviews</div>
                        </div>
                        <div className="flex items-center gap-1 pl-2 border-l">
                            <svg viewBox="0 0 126 31" className="h-5 w-auto" fill="currentColor">
                                <path d="M30.141707 11.07005H18.63164L15.076408.177071l-3.566342 10.892977L0 11.059002l9.321376 6.739063-3.566343 10.88193 9.321375-6.728016 9.310266 6.728016-3.555233-10.88193 9.310266-6.728016z" fill="#00B67A" />
                                <path d="M21.631369 20.26169l-.799928-2.463625-5.755033 4.153914z" fill="#005128" />
                            </svg>
                            <span className="text-sm font-medium">Trustpilot</span>
                        </div>
                    </Link>
                </div>

                {/* Carousel */}
                <div
                    className="relative"
                    onMouseEnter={() => setIsAutoPlaying(false)}
                    onMouseLeave={() => setIsAutoPlaying(true)}
                >
                    {/* Navigation Buttons */}
                    <button
                        onClick={prevSlide}
                        className="absolute -left-4 top-1/2 -translate-y-1/2 z-10 w-10 h-10 bg-card border rounded-full shadow-lg flex items-center justify-center hover:bg-primary hover:text-white hover:border-primary transition-all duration-200 disabled:opacity-50"
                        disabled={currentIndex === 0}
                        aria-label="Previous reviews"
                    >
                        <ChevronLeft className="w-5 h-5" />
                    </button>
                    <button
                        onClick={nextSlide}
                        className="absolute -right-4 top-1/2 -translate-y-1/2 z-10 w-10 h-10 bg-card border rounded-full shadow-lg flex items-center justify-center hover:bg-primary hover:text-white hover:border-primary transition-all duration-200 disabled:opacity-50"
                        disabled={currentIndex >= maxIndex}
                        aria-label="Next reviews"
                    >
                        <ChevronRight className="w-5 h-5" />
                    </button>

                    {/* Cards Container */}
                    <div className="overflow-hidden mx-6 pt-4">
                        <div
                            className="flex gap-4 transition-transform duration-500 ease-out"
                            style={{
                                transform: `translateX(-${currentIndex * (320 + 16)}px)`,
                            }}
                        >
                            {testimonials.map((testimonial) => (
                                <TestimonialCard key={testimonial.id} testimonial={testimonial} />
                            ))}
                        </div>
                    </div>
                </div>

                {/* Pagination Dots */}
                <div className="flex justify-center gap-2 mt-6">
                    {Array.from({ length: maxIndex + 1 }).map((_, index) => (
                        <button
                            key={index}
                            onClick={() => setCurrentIndex(index)}
                            className={`h-2 rounded-full transition-all duration-300 ${index === currentIndex
                                ? 'w-8 bg-primary'
                                : 'w-2 bg-muted-foreground/30 hover:bg-muted-foreground/50'
                                }`}
                            aria-label={`Go to slide ${index + 1}`}
                        />
                    ))}
                </div>

                {/* CTA */}
                <div className="text-center mt-8">
                    <Link
                        href="https://www.trustpilot.com/review/digitallicense.shop"
                        target="_blank"
                        className="inline-flex items-center gap-2 text-sm font-medium text-primary hover:underline"
                    >
                        Read all reviews on Trustpilot
                        <ChevronRight className="w-4 h-4" />
                    </Link>
                </div>
            </div>
        </section>
    );
}
