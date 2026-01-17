"use client";

import Image from 'next/image';

const brands = [
    { name: "Microsoft", src: "/assets/brands/microsoft.webp" },
    { name: "Corel", src: "/assets/brands/corel.webp" },
    { name: "Brand2", src: "/assets/brands/brand2.webp" },
    { name: "Kaspersky", src: "/assets/brands/kaspersky.webp" },
    { name: "Amazon", src: "/assets/brands/amazon.webp" },
    { name: "Avast", src: "/assets/brands/avast.webp" },
    { name: "ESET", src: "/assets/brands/eset.webp" },
    { name: "Parallels", src: "/assets/brands/parallels.webp" },
    { name: "Nuance", src: "/assets/brands/nuance.webp" },
    { name: "Norton", src: "/assets/brands/norton.webp" },
    { name: "Adobe", src: "/assets/brands/adobe.webp" },
];

export function BrandSlider() {
    return (
        <section className="border-y dark:border-border bg-white dark:bg-card py-8 overflow-hidden">
            <div className="relative w-full max-w-[100vw] overflow-hidden">
                <div className="flex animate-scroll whitespace-nowrap items-center">
                    {/* First set of logos */}
                    <div className="flex items-center gap-12 md:gap-24 mx-6 md:mx-12">
                        {brands.map((brand, index) => (
                            <div key={`brand-1-${index}`} className="relative h-8 md:h-12 w-24 md:w-32 flex-shrink-0 grayscale opacity-60 hover:grayscale-0 hover:opacity-100 transition-all duration-300">
                                <Image
                                    src={brand.src}
                                    alt={brand.name}
                                    fill
                                    className="object-contain"
                                />
                            </div>
                        ))}
                    </div>
                    {/* Duplicate set for infinite scroll */}
                    <div className="flex items-center gap-12 md:gap-24 mx-6 md:mx-12" aria-hidden="true">
                        {brands.map((brand, index) => (
                            <div key={`brand-2-${index}`} className="relative h-8 md:h-12 w-24 md:w-32 flex-shrink-0 grayscale opacity-60 hover:grayscale-0 hover:opacity-100 transition-all duration-300">
                                <Image
                                    src={brand.src}
                                    alt={brand.name}
                                    fill
                                    className="object-contain"
                                />
                            </div>
                        ))}
                    </div>
                </div>
            </div>
            <style jsx>{`
                @keyframes scroll {
                    0% { transform: translateX(0); }
                    100% { transform: translateX(-50%); }
                }
                .animate-scroll {
                    animation: scroll 30s linear infinite;
                }
                .animate-scroll:hover {
                    animation-play-state: paused;
                }
            `}</style>
        </section>
    );
}
