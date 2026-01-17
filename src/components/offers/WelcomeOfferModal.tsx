'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { X, Zap, Percent, Gift, Clock, ArrowRight, Sparkles, Timer, Star } from 'lucide-react';
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
        <div className="flex items-center gap-1.5">
            <div className="flex items-center gap-1 bg-black/30 backdrop-blur-sm px-2 py-1 rounded-lg border border-red-500/30">
                <Timer className="h-3.5 w-3.5 text-red-400" />
                <span className="text-xs font-bold text-red-400 tabular-nums">
                    {String(timeLeft.minutes).padStart(2, '0')}:{String(timeLeft.seconds).padStart(2, '0')}
                </span>
            </div>
        </div>
    );
}

export function WelcomeOfferModal({ isOpen, onClose, offers, isFirstLogin }: WelcomeOfferModalProps) {
    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                {/* Backdrop */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="absolute inset-0 bg-black/80 backdrop-blur-md"
                    onClick={onClose}
                />

                {/* Modal */}
                <motion.div
                    initial={{ scale: 0.95, opacity: 0, y: 20 }}
                    animate={{ scale: 1, opacity: 1, y: 0 }}
                    exit={{ scale: 0.95, opacity: 0, y: 20 }}
                    transition={{ type: "spring", duration: 0.5, bounce: 0.3 }}
                    className="relative w-full max-w-md overflow-hidden"
                >
                    {/* Glass Card */}
                    <div className="relative bg-gradient-to-b from-slate-900/95 via-slate-900/98 to-slate-950 rounded-3xl border border-white/10 shadow-2xl shadow-purple-500/10 overflow-hidden">

                        {/* Top Gradient Accent */}
                        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-violet-500 via-fuchsia-500 to-amber-500" />

                        {/* Background Effects */}
                        <div className="absolute inset-0 pointer-events-none overflow-hidden">
                            <div className="absolute -top-32 -right-32 w-64 h-64 bg-gradient-to-br from-violet-600/30 to-fuchsia-600/20 rounded-full blur-3xl" />
                            <div className="absolute -bottom-32 -left-32 w-64 h-64 bg-gradient-to-tr from-blue-600/20 to-cyan-600/10 rounded-full blur-3xl" />
                            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-r from-purple-600/5 to-pink-600/5 rounded-full blur-3xl" />
                        </div>

                        {/* Close button */}
                        <button
                            onClick={onClose}
                            className="absolute top-4 right-4 z-20 p-2 rounded-full bg-white/5 hover:bg-white/10 text-white/40 hover:text-white transition-all duration-200 backdrop-blur-sm border border-white/5"
                        >
                            <X className="h-5 w-5" />
                        </button>

                        {/* Content */}
                        <div className="relative z-10 p-6 pt-8">
                            {/* Header */}
                            <div className="text-center mb-6">
                                <motion.div
                                    initial={{ scale: 0.8, opacity: 0 }}
                                    animate={{ scale: 1, opacity: 1 }}
                                    transition={{ delay: 0.1 }}
                                    className="inline-flex items-center gap-2 bg-gradient-to-r from-amber-500 via-orange-500 to-amber-500 text-black font-bold px-5 py-2 rounded-full text-sm mb-4 shadow-lg shadow-amber-500/30"
                                >
                                    <Sparkles className="h-4 w-4" />
                                    {isFirstLogin ? 'WELCOME OFFERS!' : 'WELCOME BACK!'}
                                    <Sparkles className="h-4 w-4" />
                                </motion.div>
                                <motion.h2
                                    initial={{ y: 10, opacity: 0 }}
                                    animate={{ y: 0, opacity: 1 }}
                                    transition={{ delay: 0.15 }}
                                    className="text-2xl font-bold text-white mb-2"
                                >
                                    {isFirstLogin ? 'Thanks for Joining!' : 'We Missed You!'}
                                </motion.h2>
                                <motion.p
                                    initial={{ y: 10, opacity: 0 }}
                                    animate={{ y: 0, opacity: 1 }}
                                    transition={{ delay: 0.2 }}
                                    className="text-white/60 text-sm"
                                >
                                    Exclusive offers just for you - don't miss out!
                                </motion.p>
                            </div>

                            {/* Offers */}
                            <div className="space-y-3">
                                {/* Flash Deal */}
                                {offers.flashDeal && (
                                    <motion.div
                                        initial={{ x: -20, opacity: 0 }}
                                        animate={{ x: 0, opacity: 1 }}
                                        transition={{ delay: 0.25 }}
                                        className="group relative bg-gradient-to-r from-orange-600/20 via-red-600/15 to-orange-600/20 border border-orange-500/40 rounded-2xl p-4 overflow-hidden hover:border-orange-400/60 transition-all duration-300"
                                    >
                                        {/* Shimmer Effect */}
                                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />

                                        <div className="relative">
                                            <div className="flex items-center justify-between mb-3">
                                                <div className="flex items-center gap-2">
                                                    <div className="p-1.5 bg-gradient-to-br from-amber-500 to-orange-600 rounded-lg shadow-lg shadow-orange-500/30">
                                                        <Zap className="h-4 w-4 text-white" fill="white" />
                                                    </div>
                                                    <span className="font-bold text-white text-sm tracking-wide">FLASH DEAL</span>
                                                </div>
                                                <CountdownTimer expiresAt={offers.flashDeal.expires_at} />
                                            </div>

                                            <div className="flex items-center gap-4">
                                                {offers.flashDeal.product?.main_image_url && (
                                                    <div className="relative flex-shrink-0">
                                                        <div className="absolute inset-0 bg-gradient-to-br from-blue-500/30 to-purple-500/30 rounded-xl blur-xl" />
                                                        <Image
                                                            src={offers.flashDeal.product.main_image_url}
                                                            alt={offers.flashDeal.product?.name || ''}
                                                            width={70}
                                                            height={70}
                                                            className="relative rounded-xl object-contain bg-white p-2 shadow-lg"
                                                        />
                                                    </div>
                                                )}
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-white font-semibold text-sm leading-tight mb-1">
                                                        Windows 11 Professional Key
                                                    </p>
                                                    <p className="text-white/50 text-xs mb-2">Genuine Digital License</p>
                                                    <div className="flex items-baseline gap-2">
                                                        <span className="text-2xl font-black bg-gradient-to-r from-amber-400 to-orange-400 bg-clip-text text-transparent">
                                                            ₹{offers.flashDeal.offer_price}
                                                        </span>
                                                        <span className="text-sm text-white/40 line-through">
                                                            ₹{offers.flashDeal.original_price}
                                                        </span>
                                                        <span className="text-[10px] font-bold bg-green-500/20 text-green-400 px-1.5 py-0.5 rounded-full">
                                                            {Math.round(((offers.flashDeal.original_price || 0) - (offers.flashDeal.offer_price || 0)) / (offers.flashDeal.original_price || 1) * 100)}% OFF
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>

                                            <Link href={`/products/${offers.flashDeal.product?.slug}`} className="block mt-3">
                                                <Button
                                                    size="sm"
                                                    className="w-full h-10 bg-gradient-to-r from-amber-500 via-orange-500 to-red-500 hover:from-amber-400 hover:via-orange-400 hover:to-red-400 text-black font-bold rounded-xl shadow-lg shadow-orange-500/30 transition-all duration-300 hover:shadow-orange-500/50 hover:scale-[1.02]"
                                                >
                                                    <Zap className="h-4 w-4 mr-2" />
                                                    Claim Now
                                                </Button>
                                            </Link>
                                        </div>
                                    </motion.div>
                                )}

                                {/* 50% Price Slash */}
                                {offers.priceSlash && (
                                    <motion.div
                                        initial={{ x: -20, opacity: 0 }}
                                        animate={{ x: 0, opacity: 1 }}
                                        transition={{ delay: 0.3 }}
                                        className="group relative bg-gradient-to-r from-violet-600/15 via-purple-600/10 to-violet-600/15 border border-violet-500/30 rounded-2xl p-4 hover:border-violet-400/50 transition-all duration-300"
                                    >
                                        <div className="flex items-center gap-4">
                                            <div className="relative flex-shrink-0">
                                                <div className="absolute inset-0 bg-gradient-to-br from-violet-500/40 to-purple-500/40 rounded-xl blur-lg" />
                                                <div className="relative p-3 bg-gradient-to-br from-violet-500/20 to-purple-500/20 rounded-xl border border-violet-500/30">
                                                    <Percent className="h-6 w-6 text-violet-400" />
                                                </div>
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="font-bold text-white text-sm">50% OFF - Any Product!</p>
                                                <p className="text-xs text-white/50 mt-0.5">One-time use • Valid for 24 hours</p>
                                            </div>
                                            <Link href="/products">
                                                <Button
                                                    size="sm"
                                                    className="h-9 px-4 bg-violet-500/10 border border-violet-500/40 text-violet-300 hover:bg-violet-500/20 hover:border-violet-400/60 rounded-xl transition-all duration-200 font-medium"
                                                >
                                                    Browse
                                                    <ArrowRight className="h-3.5 w-3.5 ml-1.5" />
                                                </Button>
                                            </Link>
                                        </div>
                                    </motion.div>
                                )}

                                {/* BOGO */}
                                {offers.bogo && (
                                    <motion.div
                                        initial={{ x: -20, opacity: 0 }}
                                        animate={{ x: 0, opacity: 1 }}
                                        transition={{ delay: 0.35 }}
                                        className="group relative bg-gradient-to-r from-emerald-600/15 via-green-600/10 to-emerald-600/15 border border-emerald-500/30 rounded-2xl p-4 hover:border-emerald-400/50 transition-all duration-300"
                                    >
                                        <div className="flex items-center gap-4">
                                            <div className="relative flex-shrink-0">
                                                <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/40 to-green-500/40 rounded-xl blur-lg" />
                                                <div className="relative p-3 bg-gradient-to-br from-emerald-500/20 to-green-500/20 rounded-xl border border-emerald-500/30">
                                                    <Gift className="h-6 w-6 text-emerald-400" />
                                                </div>
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="font-bold text-white text-sm">Buy 1 Get 1 FREE!</p>
                                                <p className="text-xs text-white/50 mt-0.5">Add 2 items, pay for 1 only</p>
                                            </div>
                                            <Link href="/products">
                                                <Button
                                                    size="sm"
                                                    className="h-9 px-4 bg-emerald-500/10 border border-emerald-500/40 text-emerald-300 hover:bg-emerald-500/20 hover:border-emerald-400/60 rounded-xl transition-all duration-200 font-medium"
                                                >
                                                    Shop
                                                    <ArrowRight className="h-3.5 w-3.5 ml-1.5" />
                                                </Button>
                                            </Link>
                                        </div>
                                    </motion.div>
                                )}
                            </div>

                            {/* Footer */}
                            <motion.p
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 0.4 }}
                                className="text-center text-white/30 text-xs mt-5 font-medium"
                            >
                                Offers cannot be combined • Limited time only
                            </motion.p>
                        </div>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
}
