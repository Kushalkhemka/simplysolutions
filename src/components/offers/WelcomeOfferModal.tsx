'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { X, Zap, Percent, Gift, Clock, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { motion, AnimatePresence } from 'framer-motion';

interface UserOffer {
    id: string;
    offer_type: 'flash_deal' | 'price_slash' | 'bogo' | 'welcome_back';
    product_id: string | null;
    discount_value: number | null;
    original_price: number | null;
    offer_price: number | null;
    expires_at: string;
    product?: {
        name: string;
        slug: string;
        main_image_url: string | null;
    };
}

interface WelcomeOfferModalProps {
    isOpen: boolean;
    onClose: () => void;
    offers: {
        flashDeal: UserOffer | null;
        priceSlash: UserOffer | null;
        bogo: UserOffer | null;
    };
    isFirstLogin: boolean;
}

function CountdownTimer({ expiresAt }: { expiresAt: string }) {
    const [timeLeft, setTimeLeft] = useState<{ minutes: number; seconds: number }>({ minutes: 0, seconds: 0 });

    useEffect(() => {
        const calculateTimeLeft = () => {
            const difference = new Date(expiresAt).getTime() - Date.now();
            if (difference > 0) {
                setTimeLeft({
                    minutes: Math.floor((difference / 1000 / 60) % 60),
                    seconds: Math.floor((difference / 1000) % 60),
                });
            } else {
                setTimeLeft({ minutes: 0, seconds: 0 });
            }
        };

        calculateTimeLeft();
        const timer = setInterval(calculateTimeLeft, 1000);
        return () => clearInterval(timer);
    }, [expiresAt]);

    return (
        <div className="flex items-center gap-2 text-sm font-mono">
            <Clock className="h-4 w-4 text-red-500 animate-pulse" />
            <span className="text-red-500 font-bold">
                {String(timeLeft.minutes).padStart(2, '0')}:{String(timeLeft.seconds).padStart(2, '0')}
            </span>
        </div>
    );
}

export function WelcomeOfferModal({ isOpen, onClose, offers, isFirstLogin }: WelcomeOfferModalProps) {
    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-50 flex items-center justify-center">
                {/* Backdrop */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="absolute inset-0 bg-black/70 backdrop-blur-sm"
                    onClick={onClose}
                />

                {/* Modal */}
                <motion.div
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.9, opacity: 0 }}
                    className="relative bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 rounded-2xl p-6 max-w-lg w-full mx-4 shadow-2xl border border-purple-500/30 overflow-hidden"
                >
                    {/* Decorative elements */}
                    <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
                        <div className="absolute -top-20 -right-20 w-40 h-40 bg-yellow-500/20 rounded-full blur-3xl" />
                        <div className="absolute -bottom-20 -left-20 w-40 h-40 bg-purple-500/20 rounded-full blur-3xl" />
                    </div>

                    {/* Close button */}
                    <button
                        onClick={onClose}
                        className="absolute top-4 right-4 text-white/60 hover:text-white transition-colors z-10"
                    >
                        <X className="h-6 w-6" />
                    </button>

                    {/* Content */}
                    <div className="relative z-10">
                        {/* Header */}
                        <div className="text-center mb-6">
                            <div className="inline-flex items-center gap-2 bg-gradient-to-r from-yellow-500 to-orange-500 text-black font-bold px-4 py-1.5 rounded-full text-sm mb-3">
                                <Zap className="h-4 w-4" />
                                {isFirstLogin ? 'WELCOME OFFERS!' : 'WELCOME BACK!'}
                            </div>
                            <h2 className="text-2xl font-bold text-white mb-1">
                                {isFirstLogin ? 'Thanks for Joining!' : 'We Missed You!'}
                            </h2>
                            <p className="text-white/70 text-sm">
                                Exclusive offers just for you - don't miss out!
                            </p>
                        </div>

                        {/* Offers */}
                        <div className="space-y-3">
                            {/* Flash Deal */}
                            {offers.flashDeal && (
                                <div className="bg-gradient-to-r from-red-600/20 to-orange-600/20 border border-red-500/30 rounded-xl p-4">
                                    <div className="flex items-center justify-between mb-2">
                                        <div className="flex items-center gap-2">
                                            <Zap className="h-5 w-5 text-yellow-400" />
                                            <span className="font-bold text-white">FLASH DEAL</span>
                                        </div>
                                        <CountdownTimer expiresAt={offers.flashDeal.expires_at} />
                                    </div>
                                    <div className="flex items-center gap-4">
                                        {offers.flashDeal.product?.main_image_url && (
                                            <Image
                                                src={offers.flashDeal.product.main_image_url}
                                                alt={offers.flashDeal.product?.name || ''}
                                                width={60}
                                                height={60}
                                                className="rounded-lg object-contain bg-white p-1"
                                            />
                                        )}
                                        <div className="flex-1">
                                            <p className="text-white font-medium text-sm truncate">
                                                {offers.flashDeal.product?.name}
                                            </p>
                                            <div className="flex items-center gap-2">
                                                <span className="text-2xl font-bold text-yellow-400">
                                                    ₹{offers.flashDeal.offer_price}
                                                </span>
                                                <span className="text-sm text-white/50 line-through">
                                                    ₹{offers.flashDeal.original_price}
                                                </span>
                                            </div>
                                        </div>
                                        <Link href={`/products/${offers.flashDeal.product?.slug}`}>
                                            <Button size="sm" className="bg-gradient-to-r from-yellow-500 to-orange-500 text-black hover:from-yellow-400 hover:to-orange-400">
                                                Grab Now
                                            </Button>
                                        </Link>
                                    </div>
                                </div>
                            )}

                            {/* 50% Price Slash */}
                            {offers.priceSlash && (
                                <div className="bg-gradient-to-r from-purple-600/20 to-pink-600/20 border border-purple-500/30 rounded-xl p-4">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-purple-500/20 rounded-lg">
                                            <Percent className="h-6 w-6 text-purple-400" />
                                        </div>
                                        <div className="flex-1">
                                            <p className="font-bold text-white">50% OFF - Any Product!</p>
                                            <p className="text-sm text-white/60">One-time use, valid for 24 hours</p>
                                        </div>
                                        <Link href="/products">
                                            <Button size="sm" variant="outline" className="border-purple-500 text-purple-400 hover:bg-purple-500/10">
                                                <span>Browse</span>
                                                <ArrowRight className="h-4 w-4 ml-1" />
                                            </Button>
                                        </Link>
                                    </div>
                                </div>
                            )}

                            {/* BOGO */}
                            {offers.bogo && (
                                <div className="bg-gradient-to-r from-green-600/20 to-emerald-600/20 border border-green-500/30 rounded-xl p-4">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-green-500/20 rounded-lg">
                                            <Gift className="h-6 w-6 text-green-400" />
                                        </div>
                                        <div className="flex-1">
                                            <p className="font-bold text-white">Buy 1 Get 1 FREE!</p>
                                            <p className="text-sm text-white/60">Add 2 items, pay for 1 only</p>
                                        </div>
                                        <Link href="/products">
                                            <Button size="sm" variant="outline" className="border-green-500 text-green-400 hover:bg-green-500/10">
                                                <span>Shop</span>
                                                <ArrowRight className="h-4 w-4 ml-1" />
                                            </Button>
                                        </Link>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Footer */}
                        <p className="text-center text-white/40 text-xs mt-4">
                            Offers cannot be combined. Limited time only.
                        </p>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
}
