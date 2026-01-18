'use client';

import { useEffect, useRef } from 'react';

declare global {
    interface Window {
        RazorpayAffordabilitySuite: new (config: {
            key: string;
            amount: number;
        }) => {
            render: () => void;
        };
    }
}

interface RazorpayAffordabilityWidgetProps {
    /** Product price in rupees (will be converted to paise) */
    amount: number;
}

export function RazorpayAffordabilityWidget({ amount }: RazorpayAffordabilityWidgetProps) {
    const hasRendered = useRef(false);

    useEffect(() => {
        // Prevent double rendering in React strict mode
        if (hasRendered.current) return;

        const key = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID;

        if (!key) {
            console.warn('Razorpay key not configured');
            return;
        }

        // Convert rupees to paise
        const amountInPaise = Math.round(amount * 100);

        // Wait for the script to load
        const initWidget = () => {
            if (typeof window.RazorpayAffordabilitySuite !== 'undefined') {
                const widgetConfig = {
                    key,
                    amount: amountInPaise,
                };

                const rzpAffordabilitySuite = new window.RazorpayAffordabilitySuite(widgetConfig);
                rzpAffordabilitySuite.render();
                hasRendered.current = true;
            } else {
                // Script not loaded yet, retry after a short delay
                setTimeout(initWidget, 100);
            }
        };

        initWidget();
    }, [amount]);

    return (
        <div
            id="razorpay-affordability-widget"
            className="mt-4"
        />
    );
}
