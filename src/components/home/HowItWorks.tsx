"use client";

import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Search, ShoppingCart, Key } from 'lucide-react';

export function HowItWorks() {
    return (
        <section className="container-dense mb-12 text-center py-8">
            <h3 className="text-3xl font-bold mb-2 text-gray-900 dark:text-white">How does Digital License works</h3>
            <p className="text-muted-foreground dark:text-gray-400 mb-12 text-lg">Explained in three easy steps</p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Step 1 */}
                <div className="bg-white dark:bg-card rounded-[20px] p-8 pb-12 flex flex-col items-start text-left shadow-[0_2px_15px_-3px_rgba(0,0,0,0.07)] hover:shadow-lg transition-all duration-300 group h-full">
                    <div className="w-16 h-16 rounded-[14px] bg-orange-500 flex items-center justify-center mb-6 shadow-md group-hover:scale-105 transition-transform">
                        <Search className="w-8 h-8 text-white stroke-[3px]" />
                    </div>
                    <div className="mb-2 text-sm font-bold text-gray-500 dark:text-gray-400">Step 1</div>
                    <h4 className="text-xl font-bold mb-3 text-gray-900 dark:text-white">Find the correct license</h4>
                    <p className="text-gray-500 dark:text-gray-400 text-[15px] leading-relaxed">
                        Check which software version you are using or want to use. Can&apos;t figure it out? Check out our frequently asked questions.
                    </p>
                </div>

                {/* Step 2 */}
                <div className="bg-white dark:bg-card rounded-[20px] p-8 pb-12 flex flex-col items-start text-left shadow-[0_2px_15px_-3px_rgba(0,0,0,0.07)] hover:shadow-lg transition-all duration-300 group h-full">
                    <div className="w-16 h-16 rounded-[14px] bg-orange-500 flex items-center justify-center mb-6 shadow-md group-hover:scale-105 transition-transform">
                        <ShoppingCart className="w-8 h-8 text-white stroke-[3px]" />
                    </div>
                    <div className="mb-2 text-sm font-bold text-gray-500 dark:text-gray-400">Step 2</div>
                    <h4 className="text-xl font-bold mb-3 text-gray-900 dark:text-white">Order the license</h4>
                    <p className="text-gray-500 dark:text-gray-400 text-[15px] leading-relaxed">
                        Find the right software version in our shop and purchase the license. Are you unsure about the version? Ask your question in the chat and we will be happy to help you!
                    </p>
                </div>

                {/* Step 3 */}
                <div className="bg-white dark:bg-card rounded-[20px] p-8 pb-12 flex flex-col items-start text-left shadow-[0_2px_15px_-3px_rgba(0,0,0,0.07)] hover:shadow-lg transition-all duration-300 group h-full">
                    <div className="w-16 h-16 rounded-[14px] bg-orange-500 flex items-center justify-center mb-6 shadow-md group-hover:scale-105 transition-transform">
                        <Key className="w-8 h-8 text-white stroke-[3px]" />
                    </div>
                    <div className="mb-2 text-sm font-bold text-gray-500 dark:text-gray-400">Step 3</div>
                    <h4 className="text-xl font-bold mb-3 text-gray-900 dark:text-white">Activate your license</h4>
                    <p className="text-gray-500 dark:text-gray-400 text-[15px] leading-relaxed">
                        After you have paid, you will receive the software license in your email within 15 minutes. The license can be used immediately! Do you need help with activation? Check out our tutorials page.
                    </p>
                </div>
            </div>

            <div className="mt-12">
                <Link href="/products">
                    <Button size="lg" className="rounded-full px-10 py-6 text-lg font-bold shadow-lg bg-orange-500 hover:bg-orange-600 transition-all hover:scale-105">
                        Shop Now
                    </Button>
                </Link>
            </div>
        </section>
    );
}
