"use client";

import Image from 'next/image';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export function PromoBanners() {
    return (
        <section className="container-dense mb-12">
            <h3 className="font-bold text-xl mb-4 flex items-center gap-2">
                <span className="w-1 h-6 bg-green-500 rounded-full"></span>
                Partnership and Loyalty
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Banner 1: Corporate Offers */}
                <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-2xl p-6 md:p-8 text-white flex items-center justify-between relative overflow-hidden shadow-lg group">
                    <div className="relative z-10 max-w-[60%]">
                        <h3 className="text-2xl md:text-3xl font-black mb-2 leading-tight">
                            Attractive offers for Companies
                        </h3>
                        <Link href="/contact">
                            <Button variant="secondary" className="mt-4 font-bold rounded-full shadow-md bg-white text-green-700 hover:bg-gray-100">
                                Request offer here
                            </Button>
                        </Link>
                    </div>
                    <div className="absolute right-[-20px] top-1/2 -translate-y-1/2 w-48 h-48 md:w-64 md:h-64 animate-float opacity-90 group-hover:scale-105 transition-transform">
                        <Image
                            src="/assets/banners/discount.png"
                            alt="10% Off"
                            fill
                            className="object-contain drop-shadow-xl"
                        />
                    </div>
                </div>

                {/* Banner 2: Loyalty Points */}
                <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-2xl p-6 md:p-8 text-white flex items-center justify-between relative overflow-hidden shadow-lg group">
                    <div className="relative z-10 max-w-[60%]">
                        <h3 className="text-2xl md:text-3xl font-black mb-2 leading-tight">
                            Earn 100% Loyalty Points!
                        </h3>
                        <p className="text-white/90 text-sm md:text-base font-medium mb-1">
                            Get 100 points for every ₹100 spent.
                        </p>
                        <p className="text-white/80 text-xs md:text-sm mb-4">
                            Redeem on your next purchase (up to 10% off)!
                        </p>
                        <Link href="/dashboard/loyalty">
                            <Button variant="secondary" className="font-bold rounded-full shadow-md bg-white text-orange-600 hover:bg-gray-100">
                                View My Points
                            </Button>
                        </Link>
                    </div>
                    <div className="absolute right-[-10px] top-1/2 -translate-y-1/2 w-48 h-48 md:w-60 md:h-60 animate-float-delayed opacity-90 group-hover:scale-105 transition-transform">
                        <Image
                            src="/assets/banners/coins.png"
                            alt="Loyalty Coins"
                            fill
                            className="object-contain drop-shadow-xl"
                        />
                    </div>
                </div>
            </div>
        </section>
    );
}
