'use client';

import { useState, useEffect } from 'react';
import { Bell, BellOff, Check } from 'lucide-react';
import { toast } from 'sonner';

interface CustomerPushOptInProps {
    orderId?: string;
    requestType: 'replacement' | 'product_request' | 'warranty' | 'activation';
    showInline?: boolean; // Show as inline toggle vs floating banner
}

// Convert VAPID key to ArrayBuffer (for applicationServerKey)
function urlBase64ToUint8Array(base64String: string): ArrayBuffer {
    const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
    const rawData = atob(base64);
    const outputArray = new Uint8Array(rawData.length);
    for (let i = 0; i < rawData.length; ++i) {
        outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray.buffer as ArrayBuffer;
}

export function CustomerPushOptIn({ orderId, requestType, showInline = false }: CustomerPushOptInProps) {
    const [isSupported, setIsSupported] = useState(false);
    const [isSubscribed, setIsSubscribed] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [dismissed, setDismissed] = useState(false);

    const storageKey = `push_customer_${requestType}_${orderId || 'general'}`;

    useEffect(() => {
        // Check if push notifications are supported
        const checkSupport = () => {
            if (typeof window === 'undefined') return false;
            if (!('Notification' in window)) return false;
            if (!('serviceWorker' in navigator)) return false;
            if (!('PushManager' in window)) return false;
            return true;
        };

        setIsSupported(checkSupport());

        // Check if already subscribed or dismissed
        if (typeof window !== 'undefined') {
            const storedState = localStorage.getItem(storageKey);
            if (storedState === 'subscribed') {
                setIsSubscribed(true);
            } else if (storedState === 'dismissed') {
                setDismissed(true);
            }
        }
    }, [storageKey]);

    const subscribe = async () => {
        if (!isSupported) return;

        setIsLoading(true);
        try {
            // Request permission
            const permission = await Notification.requestPermission();
            if (permission !== 'granted') {
                localStorage.setItem(storageKey, 'dismissed');
                setDismissed(true);
                return;
            }

            // Ensure service worker is registered (important for mobile)
            let registration: ServiceWorkerRegistration;
            try {
                registration = await navigator.serviceWorker.getRegistration('/') as ServiceWorkerRegistration;
                if (!registration) {
                    registration = await navigator.serviceWorker.register('/sw.js', { scope: '/' });
                }

                // Wait with timeout
                const timeoutPromise = new Promise<never>((_, reject) =>
                    setTimeout(() => reject(new Error('Service worker timeout')), 10000)
                );
                await Promise.race([navigator.serviceWorker.ready, timeoutPromise]);
            } catch (swError) {
                console.error('Service worker error:', swError);
                toast.error('Service worker not available. Try refreshing.');
                return;
            }

            // Subscribe to push
            const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
            if (!vapidPublicKey) {
                console.error('VAPID public key not found');
                return;
            }

            const subscription = await registration.pushManager.subscribe({
                userVisibleOnly: true,
                applicationServerKey: urlBase64ToUint8Array(vapidPublicKey),
            });

            // Send subscription to server
            const response = await fetch('/api/push/customer-subscribe', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    subscription: subscription.toJSON(),
                    orderId,
                    requestType,
                }),
            });

            if (response.ok) {
                localStorage.setItem(storageKey, 'subscribed');
                setIsSubscribed(true);
                toast.success('You\'ll be notified when your request is updated!');
            } else {
                throw new Error('Failed to save subscription');
            }
        } catch (error) {
            console.error('Push subscription error:', error);
            toast.error('Failed to enable notifications');
        } finally {
            setIsLoading(false);
        }
    };

    const dismiss = () => {
        localStorage.setItem(storageKey, 'dismissed');
        setDismissed(true);
    };

    // Don't show if not supported, already subscribed, or dismissed
    if (!isSupported || isSubscribed || dismissed) return null;

    // Inline toggle version
    if (showInline) {
        return (
            <button
                onClick={subscribe}
                disabled={isLoading}
                className="flex items-center gap-2 text-sm text-primary hover:underline disabled:opacity-50"
            >
                <Bell className="h-4 w-4" />
                {isLoading ? 'Enabling...' : 'Get notified when approved'}
            </button>
        );
    }

    // Banner version
    return (
        <div className="bg-gradient-to-r from-orange-50 to-amber-50 dark:from-orange-900/20 dark:to-amber-900/20 border border-orange-200 dark:border-orange-800 rounded-lg p-4 mb-4">
            <div className="flex items-start gap-3">
                <div className="p-2 bg-orange-100 dark:bg-orange-900/30 rounded-full">
                    <Bell className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                </div>
                <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-sm">Get notified about your request</h4>
                    <p className="text-xs text-muted-foreground mt-0.5">
                        We&apos;ll send you a notification when your request is approved
                    </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                    <button
                        onClick={dismiss}
                        className="text-xs text-muted-foreground hover:text-foreground"
                    >
                        No thanks
                    </button>
                    <button
                        onClick={subscribe}
                        disabled={isLoading}
                        className="px-3 py-1.5 text-xs font-medium bg-orange-500 text-white rounded-lg hover:bg-orange-600 disabled:opacity-50"
                    >
                        {isLoading ? 'Enabling...' : 'Enable'}
                    </button>
                </div>
            </div>
        </div>
    );
}

// Auto-subscribe component - shows a subtle toast after form submission
export function CustomerPushAutoPrompt({ orderId, requestType }: Omit<CustomerPushOptInProps, 'showInline'>) {
    useEffect(() => {
        const storageKey = `push_customer_${requestType}_${orderId || 'general'}`;
        const storedState = localStorage.getItem(storageKey);

        // Only prompt if not already subscribed or dismissed, and notifications are supported
        if (storedState) return;
        if (!('Notification' in window) || !('serviceWorker' in navigator)) return;
        if (Notification.permission === 'denied') return;

        // Show prompt after a short delay
        const timer = setTimeout(() => {
            toast(
                <div className="flex items-center gap-3">
                    <Bell className="h-5 w-5 text-orange-500" />
                    <div className="flex-1">
                        <p className="font-medium text-sm">Want to be notified?</p>
                        <p className="text-xs text-muted-foreground">Get updates when your request is processed</p>
                    </div>
                </div>,
                {
                    duration: 10000,
                    action: {
                        label: 'Enable',
                        onClick: async () => {
                            try {
                                const permission = await Notification.requestPermission();
                                if (permission === 'granted') {
                                    const registration = await navigator.serviceWorker.ready;
                                    const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
                                    if (!vapidPublicKey) return;

                                    const subscription = await registration.pushManager.subscribe({
                                        userVisibleOnly: true,
                                        applicationServerKey: urlBase64ToUint8Array(vapidPublicKey),
                                    });

                                    await fetch('/api/push/customer-subscribe', {
                                        method: 'POST',
                                        headers: { 'Content-Type': 'application/json' },
                                        body: JSON.stringify({
                                            subscription: subscription.toJSON(),
                                            orderId,
                                            requestType,
                                        }),
                                    });

                                    localStorage.setItem(storageKey, 'subscribed');
                                    toast.success('Notifications enabled!');
                                }
                            } catch (error) {
                                console.error('Push subscription error:', error);
                            }
                        },
                    },
                }
            );
        }, 2000);

        return () => clearTimeout(timer);
    }, [orderId, requestType]);

    return null;
}
