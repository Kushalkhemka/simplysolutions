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
        <div className="flex flex-col items-center">
            <div className="bg-white/20 backdrop-blur-sm rounded-md sm:rounded-lg p-1 sm:p-1.5 min-w-[28px] sm:min-w-[40px] text-center shadow-sm border border-white/10">
                <span className="block text-sm sm:text-lg md:text-xl font-bold text-white tabular-nums leading-none">
                    {String(value).padStart(2, '0')}
                </span>
            </div>
            <span className="text-[7px] sm:text-[9px] font-semibold text-white/90 uppercase mt-0.5 tracking-wide">
                {label}
            </span>
        </div>
    );

    return (
        <div className="flash-deal-container relative overflow-hidden rounded-lg sm:rounded-xl shadow-lg my-4 sm:my-6">
            <div className="absolute inset-0 bg-gradient-to-r from-[#FF6B35] to-[#FF3E3E]"></div>

            {/* Glossy overlay effect */}
            <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.1)_0%,transparent_50%)]"></div>

            <div className="relative z-10 flex flex-row items-center justify-between px-2 py-2 sm:px-4 sm:py-3 gap-2 sm:gap-4">
                {/* Left Side: Title & Icon */}
                <div className="flex items-center gap-1.5 sm:gap-3 min-w-0 flex-shrink">
                    <div className="bg-white text-[#FF3E3E] p-1 sm:p-2 rounded-full shadow-md flex-shrink-0">
                        <Zap className="w-3 h-3 sm:w-5 sm:h-5 fill-current" />
                    </div>
                    <div className="min-w-0">
                        <h3 className="text-[10px] sm:text-sm md:text-lg font-black text-white italic uppercase tracking-wide drop-shadow-sm leading-tight">
                            {title}
                        </h3>
                        <p className="text-white/90 text-[8px] sm:text-xs font-medium hidden sm:block">
                            Limited Time Offer Ends In:
                        </p>
                    </div>
                </div>

                {/* Right Side: Timer */}
                <div className="flex items-start justify-end gap-0.5 sm:gap-1 flex-shrink-0">
                    <TimeBlock value={timeLeft.days} label="Days" />
                    <span className="text-white/60 text-xs sm:text-lg font-bold mt-0.5 sm:mt-1">:</span>
                    <TimeBlock value={timeLeft.hours} label="Hrs" />
                    <span className="text-white/60 text-xs sm:text-lg font-bold mt-0.5 sm:mt-1">:</span>
                    <TimeBlock value={timeLeft.minutes} label="Min" />
                    <span className="text-white/60 text-xs sm:text-lg font-bold mt-0.5 sm:mt-1">:</span>
                    <TimeBlock value={timeLeft.seconds} label="Sec" />
                </div>
            </div>
        </div>
    );
}
