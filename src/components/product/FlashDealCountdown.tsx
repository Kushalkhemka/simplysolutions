'use client';

import { useEffect, useState } from 'react';
import { Zap } from 'lucide-react';

interface TimeLeft {
    days: number;
    hours: number;
    minutes: number;
    seconds: number;
}

interface FlashDealCountdownProps {
    endDate?: Date;
    title?: string;
}

export function FlashDealCountdown({
    endDate = new Date('2026-01-31T00:00:00'),
    title = "Flash Deal"
}: FlashDealCountdownProps) {
    const [timeLeft, setTimeLeft] = useState<TimeLeft>({ days: 0, hours: 0, minutes: 0, seconds: 0 });
    const [isVisible, setIsVisible] = useState(true);

    useEffect(() => {
        const calculateTimeLeft = () => {
            const difference = endDate.getTime() - new Date().getTime();

            if (difference <= 0) {
                setIsVisible(false);
                return { days: 0, hours: 0, minutes: 0, seconds: 0 };
            }

            return {
                days: Math.floor(difference / (1000 * 60 * 60 * 24)),
                hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
                minutes: Math.floor((difference / (1000 * 60)) % 60),
                seconds: Math.floor((difference / 1000) % 60),
            };
        };

        setTimeLeft(calculateTimeLeft());

        const timer = setInterval(() => {
            setTimeLeft(calculateTimeLeft());
        }, 1000);

        return () => clearInterval(timer);
    }, [endDate]);

    if (!isVisible) return null;

    const TimeBlock = ({ value, label }: { value: number; label: string }) => (
        <div className="flex flex-col items-center mx-0.5 sm:mx-2 min-w-[40px] sm:min-w-[60px]">
            <div className="bg-white/20 backdrop-blur-sm rounded-lg p-1.5 sm:p-2 w-full text-center shadow-sm border border-white/10">
                <span className="block text-lg sm:text-2xl font-bold text-white tabular-nums leading-none">
                    {String(value).padStart(2, '0')}
                </span>
            </div>
            <span className="text-[9px] sm:text-xs font-semibold text-white/90 uppercase mt-1 tracking-wider">
                {label}
            </span>
        </div>
    );

    return (
        <div className="flash-deal-container relative overflow-hidden rounded-xl shadow-lg my-6">
            <div className="absolute inset-0 bg-gradient-to-r from-[#FF6B35] to-[#FF3E3E]"></div>

            {/* Glossy overlay effect */}
            <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.1)_0%,transparent_50%)]"></div>

            <div className="relative z-10 flex flex-col md:flex-row items-center justify-between px-4 py-4 md:px-6 md:py-3 gap-4">
                {/* Left Side: Title & Icon */}
                <div className="flex items-center gap-3">
                    <div className="bg-white text-[#FF3E3E] p-2 rounded-full shadow-md animate-pulse-slow">
                        <Zap className="w-5 h-5 sm:w-6 sm:h-6 fill-current" />
                    </div>
                    <div className="text-center md:text-left min-w-0 max-w-full">
                        <h3 className="text-base sm:text-xl md:text-2xl font-black text-white italic uppercase tracking-wide drop-shadow-sm truncate">
                            {title}
                        </h3>
                        <p className="text-white/90 text-xs sm:text-sm font-medium">
                            Limited Time Offer Ends In:
                        </p>
                    </div>
                </div>

                {/* Right Side: Timer */}
                <div className="flex items-start flex-wrap justify-center">
                    <TimeBlock value={timeLeft.days} label="Days" />
                    <span className="text-white/60 text-xl sm:text-2xl font-bold mt-1">:</span>
                    <TimeBlock value={timeLeft.hours} label="Hours" />
                    <span className="text-white/60 text-xl sm:text-2xl font-bold mt-1">:</span>
                    <TimeBlock value={timeLeft.minutes} label="Mins" />
                    <span className="text-white/60 text-xl sm:text-2xl font-bold mt-1">:</span>
                    <TimeBlock value={timeLeft.seconds} label="Secs" />
                </div>
            </div>

            <style jsx>{`
                .animate-pulse-slow {
                    animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
                }
                
                @keyframes pulse {
                    0%, 100% { opacity: 1; transform: scale(1); }
                    50% { opacity: 0.9; transform: scale(1.05); }
                }
            `}</style>
        </div>
    );
}
