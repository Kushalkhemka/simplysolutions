'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { X, Percent, Gift, Clock, ArrowRight, Sparkles, Timer, Zap } from 'lucide-react';
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
    const [timeLeft, setTimeLeft] = useState<{ hours: number; minutes: number; seconds: number }>({ hours: 0, minutes: 0, seconds: 0 });

    useEffect(() => {
        const calculateTimeLeft = () => {
            const difference = new Date(expiresAt).getTime() - Date.now();
            if (difference > 0) {
                setTimeLeft({
                    hours: Math.floor(difference / (1000 * 60 * 60)),
                    minutes: Math.floor((difference / 1000 / 60) % 60),
                    seconds: Math.floor((difference / 1000) % 60),
                });
            } else {
                setTimeLeft({ hours: 0, minutes: 0, seconds: 0 });
            }
        };

        calculateTimeLeft();
        const timer = setInterval(calculateTimeLeft, 1000);
        return () => clearInterval(timer);
    }, [expiresAt]);

    return (
        <div className="flex items-center gap-1">
            <Clock className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="text-xs font-medium text-muted-foreground tabular-nums">
                {String(timeLeft.hours).padStart(2, '0')}:{String(timeLeft.minutes).padStart(2, '0')}:{String(timeLeft.seconds).padStart(2, '0')}
            </span>
        </div>
    );
}

export function WelcomeOfferModal({ isOpen, onClose, offers, isFirstLogin }: WelcomeOfferModalProps) {
    const router = useRouter();

    if (!isOpen) return null;

    const handleNavigate = (path: string) => {
        onClose();
        router.push(path);
    };

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                {/* Backdrop */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                    onClick={onClose}
                />

                {/* Modal */}
                <motion.div
                    initial={{ scale: 0.95, opacity: 0, y: 20 }}
                    animate={{ scale: 1, opacity: 1, y: 0 }}
                    exit={{ scale: 0.95, opacity: 0, y: 20 }}
                    transition={{ type: "spring", duration: 0.4, bounce: 0.2 }}
                    className="relative w-full max-w-md"
                >
                    {/* Card */}
                    <div className="relative bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-border overflow-hidden">

                        {/* Top Accent */}
                        <div className="h-1.5 bg-gradient-to-r from-orange-500 via-orange-400 to-orange-500" />

                        {/* Close button */}
                        <button
                            onClick={onClose}
                            className="absolute top-4 right-4 z-20 p-2 rounded-full hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                        >
                            <X className="h-5 w-5" />
                        </button>

                        {/* Content */}
                        <div className="p-6 pt-8">
                            {/* Header */}
                            <div className="text-center mb-6">
                                <motion.div
                                    initial={{ scale: 0.8, opacity: 0 }}
                                    animate={{ scale: 1, opacity: 1 }}
                                    transition={{ delay: 0.1 }}
                                    className="inline-flex items-center gap-2 bg-orange-500 text-white font-bold px-4 py-1.5 rounded-full text-sm mb-4"
                                >
                                    <Sparkles className="h-4 w-4" />
                                    {isFirstLogin ? 'WELCOME!' : 'WELCOME BACK!'}
                                    <Sparkles className="h-4 w-4" />
                                </motion.div>
                                <motion.h2
                                    initial={{ y: 10, opacity: 0 }}
                                    animate={{ y: 0, opacity: 1 }}
                                    transition={{ delay: 0.15 }}
                                    className="text-2xl font-bold text-foreground mb-2"
                                >
                                    {isFirstLogin ? 'Thanks for Joining!' : 'Great to See You!'}
                                </motion.h2>
                                <motion.p
                                    initial={{ y: 10, opacity: 0 }}
                                    animate={{ y: 0, opacity: 1 }}
                                    transition={{ delay: 0.2 }}
                                    className="text-muted-foreground text-sm"
                                >
                                    We have exclusive offers waiting for you
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
                                        className="bg-orange-50 dark:bg-orange-950/20 border border-orange-200 dark:border-orange-800 rounded-xl p-4"
                                    >
                                        <div className="flex items-center justify-between mb-3">
                                            <div className="flex items-center gap-2">
                                                <div className="p-1.5 bg-orange-500 rounded-lg">
                                                    <Zap className="h-4 w-4 text-white" fill="white" />
                                                </div>
                                                <span className="font-semibold text-orange-600 dark:text-orange-400 text-sm">FLASH DEAL</span>
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
                                                    className="rounded-lg object-contain bg-white p-1 border"
                                                />
                                            )}
                                            <div className="flex-1 min-w-0">
                                                <p className="font-medium text-sm text-foreground leading-tight mb-1 truncate">
                                                    {offers.flashDeal.product?.name || 'Special Product'}
                                                </p>
                                                <div className="flex items-baseline gap-2">
                                                    <span className="text-xl font-bold text-orange-600">
                                                        ₹{offers.flashDeal.offer_price}
                                                    </span>
                                                    <span className="text-sm text-muted-foreground line-through">
                                                        ₹{offers.flashDeal.original_price}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>

                                        <Button
                                            onClick={() => handleNavigate(`/products/${offers.flashDeal?.product?.slug}`)}
                                            className="w-full mt-3 bg-orange-500 hover:bg-orange-600 text-white"
                                        >
                                            <Zap className="h-4 w-4 mr-2" />
                                            Claim Now
                                        </Button>
                                    </motion.div>
                                )}

                                {/* 50% OFF */}
                                {offers.priceSlash && (
                                    <motion.div
                                        initial={{ x: -20, opacity: 0 }}
                                        animate={{ x: 0, opacity: 1 }}
                                        transition={{ delay: 0.3 }}
                                        className="bg-muted/50 border border-border rounded-xl p-4"
                                    >
                                        <div className="flex items-center gap-4">
                                            <div className="p-3 bg-primary/10 rounded-xl border border-primary/20">
                                                <Percent className="h-5 w-5 text-primary" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="font-semibold text-foreground">50% OFF - Any Product!</p>
                                                <p className="text-xs text-muted-foreground mt-0.5">One-time use • Valid for 12 hours</p>
                                            </div>
                                            <Button
                                                onClick={() => handleNavigate('/products')}
                                                variant="outline"
                                                size="sm"
                                                className="gap-1.5"
                                            >
                                                Browse
                                                <ArrowRight className="h-3.5 w-3.5" />
                                            </Button>
                                        </div>
                                    </motion.div>
                                )}

                                {/* BOGO */}
                                {offers.bogo && (
                                    <motion.div
                                        initial={{ x: -20, opacity: 0 }}
                                        animate={{ x: 0, opacity: 1 }}
                                        transition={{ delay: 0.35 }}
                                        className="bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-xl p-4"
                                    >
                                        <div className="flex items-center gap-4">
                                            <div className="p-3 bg-green-500/10 rounded-xl border border-green-500/20">
                                                <Gift className="h-5 w-5 text-green-600 dark:text-green-400" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="font-semibold text-foreground">Buy 1 Get 1 FREE!</p>
                                                <p className="text-xs text-muted-foreground mt-0.5">Add 2 items, pay for the expensive one</p>
                                            </div>
                                            <Button
                                                onClick={() => handleNavigate('/products')}
                                                variant="outline"
                                                size="sm"
                                                className="gap-1.5 border-green-300 text-green-700 hover:bg-green-50 dark:border-green-700 dark:text-green-400 dark:hover:bg-green-950/30"
                                            >
                                                Shop
                                                <ArrowRight className="h-3.5 w-3.5" />
                                            </Button>
                                        </div>
                                    </motion.div>
                                )}
                            </div>

                            {/* Footer */}
                            <motion.p
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 0.4 }}
                                className="text-center text-muted-foreground text-xs mt-5"
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
