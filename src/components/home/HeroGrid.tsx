'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import {
    ArrowRight,
    ShieldCheck,
    Lightning, // Zap 
    LockKey, // Lock 
    Headset // Headphones 
} from '@/components/ui/icons';

export function HeroGrid() {
    return (
        <section className="container-dense py-6">
            <div className="grid grid-cols-1 md:grid-cols-12 gap-4 md:h-[500px]">
                {/* Main Hero Banner (Approx 8 cols) - Windows 11 */}
                <div className="md:col-span-8 relative rounded-2xl overflow-hidden group shadow-lg min-h-[280px] md:min-h-0">
                    <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/20 to-transparent z-10" />
                    <Image
                        src="/assets/banners/windows-hero.png"
                        alt="Windows 11 Pro"
                        fill
                        className="object-cover transition-transform duration-700 group-hover:scale-105"
                        priority
                    />
                    <div className="absolute inset-0 z-20 flex flex-col justify-center p-8 md:p-12">
                        <span className="inline-block px-3 py-1 bg-blue-500 text-white font-bold text-xs rounded-full mb-4 w-fit animate-fadeIn uppercase tracking-wider">
                            Flagship OS
                        </span>
                        <h2 className="text-3xl md:text-5xl font-black text-white mb-4 leading-tight drop-shadow-xl">
                            Windows 11 Pro <br />
                            <span className="text-blue-400 bg-clip-text">Lifetime License</span>
                        </h2>
                        <p className="text-gray-100 text-lg mb-8 max-w-md font-medium drop-shadow-md">
                            Upgrade to the latest operating system. Instant delivery via email. 100% Genuine Retail Key.
                        </p>
                        <div className="flex flex-wrap gap-4">
                            <Link href="/products/windows-11-pro-retail-key-global">
                                <Button size="lg" className="font-bold text-lg px-8 bg-blue-600 hover:bg-blue-500 border-0 shadow-lg shadow-blue-900/20">
                                    Buy Now - ₹499
                                </Button>
                            </Link>
                            <Link href="/products?category=operating-systems">
                                <Button size="lg" variant="outline" className="font-bold text-lg px-8 bg-white/10 text-white border-white/20 hover:bg-white/20 backdrop-blur-sm">
                                    View All OS
                                </Button>
                            </Link>
                        </div>
                    </div>
                </div>

                {/* Side Banners (Approx 4 cols) */}
                <div className="md:col-span-4 flex flex-col gap-4">
                    {/* Top Side Banner - Office */}
                    <div className="flex-1 relative rounded-2xl overflow-hidden group shadow-md min-h-[160px] md:min-h-0">
                        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent z-10" />
                        <Image
                            src="/assets/banners/office-hero.png"
                            alt="Office 2021"
                            fill
                            className="object-cover transition-transform duration-500 group-hover:scale-105"
                        />
                        <div className="absolute bottom-0 left-0 right-0 p-6 z-20">
                            <h3 className="text-2xl font-bold text-white mb-1 drop-shadow-lg">Office 2021 Pro</h3>
                            <p className="text-gray-200 text-sm mb-3 font-medium">Maximize productivity with classic apps.</p>
                            <Link href="/products/microsoft-office-2021-professional-plus-global">
                                <span className="inline-flex items-center text-orange-400 font-bold hover:underline gap-1">
                                    Shop Now <ArrowRight size={16} weight="bold" />
                                </span>
                            </Link>
                        </div>
                    </div>

                    {/* Bottom Side Banner - AI Tools */}
                    <div className="flex-1 relative rounded-2xl overflow-hidden group shadow-md min-h-[160px] md:min-h-0">
                        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent z-10" />
                        <Image
                            src="/assets/banners/ai-tools-hero-v3.png"
                            alt="AI & Creative Tools"
                            fill
                            className="object-cover transition-transform duration-500 group-hover:scale-105"
                        />
                        <div className="absolute bottom-0 left-0 right-0 p-6 z-20">
                            <span className="inline-block px-2 py-0.5 bg-purple-600 text-white text-[10px] font-bold rounded mb-2">NEW</span>
                            <h3 className="text-xl font-bold text-white mb-1 drop-shadow-lg">AI & Creative Tools</h3>
                            <p className="text-gray-200 text-sm mb-3 font-medium">Unlock your potential with premium tools.</p>
                            <Link href="/products?category=ai-tools">
                                <span className="inline-flex items-center text-purple-400 font-bold hover:underline gap-1">
                                    Explore <ArrowRight size={16} weight="bold" />
                                </span>
                            </Link>
                        </div>
                    </div>
                </div>
            </div>


        </section>
    );
}
