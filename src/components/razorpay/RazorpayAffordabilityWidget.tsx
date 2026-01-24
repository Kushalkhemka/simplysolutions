'use client';

import { useEffect, useRef, useState } from 'react';
import Script from 'next/script';

interface RazorpayAffordabilityWidgetProps {
    amount: number; // Amount in rupees
    className?: string;
}

declare global {
    interface Window {
        RazorpayAffordabilitySuite?: any;
    }
}

export function RazorpayAffordabilityWidget({ amount, className = '' }: RazorpayAffordabilityWidgetProps) {
    const widgetRef = useRef<HTMLDivElement>(null);
    const widgetInstanceRef = useRef<any>(null);
    const [scriptLoaded, setScriptLoaded] = useState(false);

    const amountInPaise = Math.round(amount * 100);
    const razorpayKeyId = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID;

    useEffect(() => {
        if (!scriptLoaded || !razorpayKeyId || !widgetRef.current) return;

        const initWidget = () => {
            if (window.RazorpayAffordabilitySuite) {
                // Clean up previous instance if it exists
                if (widgetInstanceRef.current) {
                    try {
                        widgetInstanceRef.current.close();
                    } catch (e) {
                        // Ignore cleanup errors
                    }
                }

                try {
                    widgetInstanceRef.current = new window.RazorpayAffordabilitySuite({
                        key: razorpayKeyId,
                        amount: amountInPaise,
                    });

                    widgetInstanceRef.current.render();
                } catch (error) {
                    console.error('Failed to initialize Razorpay affordability widget:', error);
                }
            }
        };

        // Small delay to ensure SDK is fully ready
        const timer = setTimeout(initWidget, 200);

        return () => {
            clearTimeout(timer);
            if (widgetInstanceRef.current) {
                try {
                    widgetInstanceRef.current.close();
                } catch (e) {
                    // Ignore cleanup errors
                }
            }
        };
    }, [scriptLoaded, amountInPaise, razorpayKeyId]);

    // Don't render if no Razorpay key
    if (!razorpayKeyId) {
        return null;
    }

    // Don't show for very low amounts
    if (amount < 500) {
        return null;
    }

    return (
        <>
            <Script
                src="https://cdn.razorpay.com/widgets/affordability/affordability.js"
                strategy="afterInteractive"
                onLoad={() => setScriptLoaded(true)}
            />
            <div
                ref={widgetRef}
                id="razorpay-affordability-widget"
                className={`razorpay-affordability-widget mt-3 ${className}`}
            />
        </>
    );
}
