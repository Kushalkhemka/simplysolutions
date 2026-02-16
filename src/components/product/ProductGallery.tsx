'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import Image from 'next/image';
import useEmblaCarousel from 'embla-carousel-react';
import Autoplay from 'embla-carousel-autoplay';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface ProductGalleryProps {
    images: string[];
    productName: string;
    discountPercent?: number;
    isBestseller?: boolean;
}

export function ProductGallery({
    images = [],
    productName,
    discountPercent = 0,
    isBestseller = false,
}: ProductGalleryProps) {
    // Use images directly without duplication
    const displayImages = images;

    const [selectedIndex, setSelectedIndex] = useState(0);
    const resumeAutoplayTimer = useRef<NodeJS.Timeout | null>(null);

    const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true }, [
        Autoplay({ delay: 5500, stopOnInteraction: false })
    ]);

    const onSelect = useCallback(() => {
        if (!emblaApi) return;
        setSelectedIndex(emblaApi.selectedScrollSnap());
    }, [emblaApi]);

    useEffect(() => {
        if (!emblaApi) return;
        emblaApi.on('select', onSelect);
        return () => {
            emblaApi.off('select', onSelect);
        };
    }, [emblaApi, onSelect]);

    const handleThumbnailClick = (index: number) => {
        if (!emblaApi) return;
        emblaApi.scrollTo(index);

        // Pause autoplay
        const autoplay = emblaApi.plugins().autoplay;
        if (autoplay) {
            autoplay.stop();
        }

        // Clear existing timer
        if (resumeAutoplayTimer.current) {
            clearTimeout(resumeAutoplayTimer.current);
        }

        // Resume after 10 seconds
        resumeAutoplayTimer.current = setTimeout(() => {
            if (autoplay) autoplay.play();
        }, 10000);
    };

    // Cleanup timer on unmount
    useEffect(() => {
        return () => {
            if (resumeAutoplayTimer.current) clearTimeout(resumeAutoplayTimer.current);
        };
    }, []);

    if (displayImages.length === 0) {
        return (
            <div className="relative aspect-square bg-muted rounded-lg overflow-hidden flex items-center justify-center text-muted-foreground">
                No Image
            </div>
        );
    }

    return (
        <div className="space-y-4" style={{ maxWidth: 'calc(100vw - 2rem)', overflow: 'hidden' }}>
            <div className="relative aspect-square bg-muted rounded-lg overflow-hidden group" style={{ maxWidth: '100%' }}>
                <div className="overflow-hidden h-full" ref={emblaRef}>
                    <div className="flex h-full touch-pan-y">
                        {displayImages.map((img, idx) => (
                            <div key={idx} className="relative flex-[0_0_100%] min-w-0 h-full">
                                <Image
                                    src={img}
                                    alt={`${productName} - Image ${idx + 1}`}
                                    fill
                                    className="object-contain p-8"
                                    priority={idx === 0}
                                    loading={idx === 0 ? 'eager' : 'lazy'}
                                    placeholder="blur"
                                    blurDataURL="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZjNmNGY2Ii8+PC9zdmc+"
                                />
                            </div>
                        ))}
                    </div>
                </div>

                {/* Badges */}
                <div className="absolute top-4 left-4 flex flex-col gap-2 z-10">
                    {discountPercent > 0 && (
                        <Badge variant="destructive">{discountPercent}% OFF</Badge>
                    )}
                    {isBestseller && (
                        <Badge className="bg-amber-500">Bestseller</Badge>
                    )}
                </div>
            </div>

            {/* Thumbnails */}
            {displayImages.length > 1 && (
                <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide max-w-full scroll-smooth snap-x snap-mandatory" style={{ WebkitOverflowScrolling: 'touch' }}>
                    {displayImages.map((img, idx) => (
                        <button
                            key={idx}
                            onClick={() => handleThumbnailClick(idx)}
                            className={cn(
                                "relative w-20 h-20 flex-shrink-0 border-2 rounded-md overflow-hidden hover:border-primary transition-all duration-200 snap-start",
                                selectedIndex === idx ? "border-primary ring-1 ring-primary scale-105" : "border-transparent opacity-70 hover:opacity-100"
                            )}
                        >
                            <Image
                                src={img}
                                alt={`${productName} thumbnail ${idx + 1}`}
                                fill
                                className="object-contain p-2"
                                loading="lazy"
                                placeholder="blur"
                                blurDataURL="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZjNmNGY2Ii8+PC9zdmc+"
                            />
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}
