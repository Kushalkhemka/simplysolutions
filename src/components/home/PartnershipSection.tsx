import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Coins } from 'lucide-react';

export default function PartnershipSection() {
    return (
        <section className="container-dense py-8 md:py-12">
            <h2 className="text-2xl font-bold mb-6 text-gray-900 dark:text-white">Partnership and Loyalty</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Left Card: 10% OFF */}
                <div className="relative overflow-hidden rounded-xl bg-orange-500 min-h-[250px] p-8 flex flex-col justify-center text-white transition-transform hover:scale-[1.01] duration-300 shadow-sm">

                    <div className="relative z-10 max-w-[65%]">
                        <h3 className="text-3xl md:text-4xl font-bold leading-tight mb-2">
                            Attractive offers<br />for Companies
                        </h3>
                        <Button
                            asChild
                            variant="secondary"
                            className="mt-6 font-bold bg-white text-orange-600 hover:bg-gray-50 border-none rounded-full px-8 shadow-sm"
                        >
                            <Link href="/contact">
                                Request offer here
                            </Link>
                        </Button>
                    </div>

                    {/* 3D Asset Placeholder / Image */}
                    <div className="absolute right-[-10px] top-1/2 -translate-y-1/2 w-[180px] h-[180px] md:w-[240px] md:h-[240px] flex items-center justify-center pointer-events-none">
                        {/* 
                    <Image src="/10-percent-off.png" alt="10% Off" width={240} height={240} className="object-contain" />
                 */}
                        <div className="relative w-full h-full flex items-center justify-center transform rotate-[-10deg]">
                            <span className="text-[100px] md:text-[120px] font-black text-white drop-shadow-md leading-none select-none" style={{ textShadow: '4px 4px 0px rgba(194, 65, 12, 0.4)' }}>
                                10<span className="text-[50px] md:text-[60px] align-top">%</span><br />
                                <span className="text-[50px] md:text-[60px] block -mt-4 md:-mt-8 ml-2">OFF</span>
                            </span>
                        </div>
                    </div>
                </div>

                {/* Right Card: Loyalty Points */}
                <div className="relative overflow-hidden rounded-xl bg-orange-500 min-h-[250px] p-8 flex flex-col justify-center text-white transition-transform hover:scale-[1.01] duration-300 shadow-sm">
                    <div className="relative z-10 max-w-[65%]">
                        <h3 className="text-3xl md:text-4xl font-bold mb-3">
                            Loyalty Points
                        </h3>
                        <p className="mb-6 text-lg font-medium opacity-95 leading-relaxed">
                            Collect loyalty points with every purchase!
                        </p>
                        <Button
                            asChild
                            variant="secondary"
                            className="font-bold bg-white text-orange-600 hover:bg-gray-50 border-none rounded-full px-8 shadow-sm"
                        >
                            <Link href="/dashboard/rewards">
                                Points & Rewards
                            </Link>
                        </Button>
                    </div>

                    {/* 3D Asset Placeholder / Image */}
                    <div className="absolute right-4 md:right-12 top-1/2 -translate-y-1/2 w-[140px] h-[140px] md:w-[180px] md:h-[180px] pointer-events-none">
                        {/* 
                    <Image src="/loyalty-coins.png" alt="Loyalty Coins" width={220} height={220} className="object-contain" />
                 */}
                        <div className="relative w-full h-full">
                            {/* CSS-only coins representation */}
                            <Coins className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 md:w-40 md:h-40 text-white drop-shadow-lg opacity-90" strokeWidth={1.5} />
                            <div className="absolute -top-4 -right-4 w-16 h-16 rounded-full border-[4px] border-white/40 bg-transparent animate-pulse" />
                            <div className="absolute bottom-0 -left-4 w-12 h-12 rounded-full border-[3px] border-white/30 bg-transparent" />
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
