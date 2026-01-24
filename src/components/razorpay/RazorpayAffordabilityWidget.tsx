'use client';

import { useEffect, useRef } from 'react';
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

    const amountInPaise = Math.round(amount * 100);
    const razorpayKeyId = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID;

    useEffect(() => {
        // Initialize the widget when script is loaded
        const initWidget = () => {
            if (window.RazorpayAffordabilitySuite && widgetRef.current && razorpayKeyId) {
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

        // Check if script is already loaded
        if (window.RazorpayAffordabilitySuite) {
            initWidget();
        }

        // Listen for script load event
        const handleScriptLoad = () => {
            setTimeout(initWidget, 100); // Small delay to ensure SDK is ready
        };

        window.addEventListener('razorpay-affordability-loaded', handleScriptLoad);

        return () => {
            window.removeEventListener('razorpay-affordability-loaded', handleScriptLoad);
            if (widgetInstanceRef.current) {
                try {
                    widgetInstanceRef.current.close();
                } catch (e) {
                    // Ignore cleanup errors
                }
            }
        };
    }, [amountInPaise, razorpayKeyId]);

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
                strategy="lazyOnload"
                onLoad={() => {
                    window.dispatchEvent(new Event('razorpay-affordability-loaded'));
                }}
            />
            <div
                ref={widgetRef}
                id="razorpay-affordability-widget"
                className={`razorpay-affordability-widget ${className}`}
            />
        </>
    );
}
