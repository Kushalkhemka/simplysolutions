'use client';

import { useState, useEffect } from 'react';
import { Bell, X, Sparkles, Gift, CheckCircle2, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface CustomerPushOptInProps {
    orderId?: string;
    requestType: 'replacement' | 'product_request' | 'warranty' | 'activation';
    showInline?: boolean;
}

// Convert VAPID key to ArrayBuffer
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

// Global key to check if user has EVER subscribed on this device
const GLOBAL_SUBSCRIPTION_KEY = 'push_global_subscribed';

// Check if already subscribed globally
function isGloballySubscribed(): boolean {
    if (typeof window === 'undefined') return false;
    return localStorage.getItem(GLOBAL_SUBSCRIPTION_KEY) === 'true';
}

// Mark as globally subscribed
function setGloballySubscribed() {
    if (typeof window !== 'undefined') {
        localStorage.setItem(GLOBAL_SUBSCRIPTION_KEY, 'true');
    }
}

// Check if browser already has push permission
async function checkExistingSubscription(): Promise<boolean> {
    try {
        if (!('serviceWorker' in navigator) || !('PushManager' in window)) return false;

        const registration = await navigator.serviceWorker.getRegistration('/');
        if (!registration) return false;

        const subscription = await registration.pushManager.getSubscription();
        return subscription !== null;
    } catch {
        return false;
    }
}

export function CustomerPushOptIn({ orderId, requestType, showInline = false }: CustomerPushOptInProps) {
    const [isSupported, setIsSupported] = useState(false);
    const [isSubscribed, setIsSubscribed] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [dismissed, setDismissed] = useState(false);
    const [checking, setChecking] = useState(true);

    useEffect(() => {
        const checkStatus = async () => {
            // Check if push notifications are supported
            const supported =
                typeof window !== 'undefined' &&
                'Notification' in window &&
                'serviceWorker' in navigator &&
                'PushManager' in window;

            setIsSupported(supported);

            // Check if already globally subscribed
            if (isGloballySubscribed()) {
                setIsSubscribed(true);
                setChecking(false);
                return;
            }

            // Check if browser already has subscription
            if (supported) {
                const hasSubscription = await checkExistingSubscription();
                if (hasSubscription) {
                    setGloballySubscribed();
                    setIsSubscribed(true);
                }
            }

            // Check local storage for this specific order
            const storageKey = `push_customer_${requestType}_${orderId || 'general'}`;
            const storedState = localStorage.getItem(storageKey);
            if (storedState === 'subscribed') {
                setGloballySubscribed();
                setIsSubscribed(true);
            } else if (storedState === 'dismissed') {
                setDismissed(true);
            }

            setChecking(false);
        };

        checkStatus();
    }, [orderId, requestType]);

    const subscribe = async () => {
        if (!isSupported) return;

        setIsLoading(true);
        try {
            // Request permission
            const permission = await Notification.requestPermission();
            if (permission !== 'granted') {
                const storageKey = `push_customer_${requestType}_${orderId || 'general'}`;
                localStorage.setItem(storageKey, 'dismissed');
                setDismissed(true);
                toast.error('Permission denied. You can enable notifications from browser settings.');
                return;
            }

            // Ensure service worker is registered
            let registration: ServiceWorkerRegistration;
            try {
                registration = await navigator.serviceWorker.getRegistration('/') as ServiceWorkerRegistration;
                if (!registration) {
                    registration = await navigator.serviceWorker.register('/sw.js', { scope: '/' });
                }

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
                const storageKey = `push_customer_${requestType}_${orderId || 'general'}`;
                localStorage.setItem(storageKey, 'subscribed');
                setGloballySubscribed();
                setIsSubscribed(true);
                toast.success('🔔 Notifications enabled! We\'ll keep you updated.');
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
        const storageKey = `push_customer_${requestType}_${orderId || 'general'}`;
        localStorage.setItem(storageKey, 'dismissed');
        setDismissed(true);
    };

    // Don't show while checking, if not supported, already subscribed, or dismissed
    if (checking || !isSupported || isSubscribed || dismissed) return null;

    // Inline toggle version
    if (showInline) {
        return (
            <button
                onClick={subscribe}
                disabled={isLoading}
                className="flex items-center gap-2 text-sm text-[#FF9900] hover:text-[#E08900] transition-colors disabled:opacity-50"
            >
                <Bell className="h-4 w-4" />
                {isLoading ? 'Enabling...' : 'Get notified when ready'}
            </button>
        );
    }

    // No render for CustomerPushOptIn when used alone - use CustomerPushAutoPrompt instead
    return null;
}

// Beautiful auto-prompt component
export function CustomerPushAutoPrompt({ orderId, requestType }: Omit<CustomerPushOptInProps, 'showInline'>) {
    const [show, setShow] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [isSubscribed, setIsSubscribed] = useState(false);

    useEffect(() => {
        const checkAndShow = async () => {
            // Already globally subscribed - don't show
            if (isGloballySubscribed()) return;

            // Check if dismissed for this type
            const storageKey = `push_customer_${requestType}_${orderId || 'general'}`;
            const storedState = localStorage.getItem(storageKey);
            if (storedState === 'subscribed' || storedState === 'dismissed') return;

            // Check if notifications supported
            if (!('Notification' in window) || !('serviceWorker' in navigator)) return;
            if (Notification.permission === 'denied') return;

            // Check if already has subscription
            const hasSubscription = await checkExistingSubscription();
            if (hasSubscription) {
                setGloballySubscribed();
                return;
            }

            // Show after delay
            setTimeout(() => setShow(true), 1500);
        };

        checkAndShow();
    }, [orderId, requestType]);

    const handleSubscribe = async () => {
        setIsLoading(true);
        try {
            const permission = await Notification.requestPermission();
            if (permission !== 'granted') {
                setShow(false);
                toast.error('Permission denied');
                return;
            }

            let registration: ServiceWorkerRegistration;
            try {
                registration = await navigator.serviceWorker.getRegistration('/') as ServiceWorkerRegistration;
                if (!registration) {
                    registration = await navigator.serviceWorker.register('/sw.js', { scope: '/' });
                }
                const timeoutPromise = new Promise<never>((_, reject) =>
                    setTimeout(() => reject(new Error('Timeout')), 10000)
                );
                await Promise.race([navigator.serviceWorker.ready, timeoutPromise]);
            } catch {
                toast.error('Service worker not ready. Try again.');
                setIsLoading(false);
                return;
            }

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

            const storageKey = `push_customer_${requestType}_${orderId || 'general'}`;
            localStorage.setItem(storageKey, 'subscribed');
            setGloballySubscribed();
            setIsSubscribed(true);

            setTimeout(() => setShow(false), 2000);
        } catch (error) {
            console.error('Push subscription error:', error);
            toast.error('Failed to enable notifications');
        } finally {
            setIsLoading(false);
        }
    };

    const handleDismiss = () => {
        const storageKey = `push_customer_${requestType}_${orderId || 'general'}`;
        localStorage.setItem(storageKey, 'dismissed');
        setShow(false);
    };

    if (!show) return null;

    // Success state
    if (isSubscribed) {
        return (
            <div className="fixed inset-x-0 bottom-0 z-50 p-4 sm:p-6 pointer-events-none">
                <div className="mx-auto max-w-sm pointer-events-auto animate-in slide-in-from-bottom-4 duration-300">
                    <div className="bg-gradient-to-r from-emerald-500 to-green-500 rounded-2xl shadow-2xl p-5 text-white">
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                                <CheckCircle2 className="w-6 h-6" />
                            </div>
                            <div>
                                <h4 className="font-bold text-lg">Notifications Enabled!</h4>
                                <p className="text-sm text-white/90">We&apos;ll keep you updated</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // Beautiful prompt UI
    return (
        <div className="fixed inset-x-0 bottom-0 z-50 p-4 sm:p-6 pointer-events-none">
            <div className="mx-auto max-w-sm pointer-events-auto animate-in slide-in-from-bottom-4 duration-300">
                <div className="relative bg-white rounded-2xl shadow-2xl overflow-hidden border border-gray-100">
                    {/* Close button */}
                    <button
                        onClick={handleDismiss}
                        className="absolute top-3 right-3 w-7 h-7 bg-gray-100 hover:bg-gray-200 rounded-full flex items-center justify-center transition-colors z-10"
                    >
                        <X className="w-4 h-4 text-gray-500" />
                    </button>

                    {/* Gradient header */}
                    <div className="bg-gradient-to-r from-[#FF9900] via-[#FFAD33] to-[#FFB84D] px-5 pt-5 pb-8">
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 bg-white/25 backdrop-blur-sm rounded-xl flex items-center justify-center shadow-lg">
                                <Bell className="w-6 h-6 text-white" />
                            </div>
                            <div>
                                <h4 className="font-bold text-lg text-white drop-shadow-sm">Stay Updated!</h4>
                                <p className="text-sm text-white/90">Don&apos;t miss important updates</p>
                            </div>
                        </div>
                    </div>

                    {/* Content */}
                    <div className="px-5 pb-5 -mt-3">
                        <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-4">
                            <div className="space-y-3">
                                <div className="flex items-start gap-3">
                                    <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                                        <Sparkles className="w-4 h-4 text-blue-600" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium text-gray-900">Instant Updates</p>
                                        <p className="text-xs text-gray-500">Know when your request is approved</p>
                                    </div>
                                </div>
                                <div className="flex items-start gap-3">
                                    <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0">
                                        <Gift className="w-4 h-4 text-purple-600" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium text-gray-900">Exclusive Offers</p>
                                        <p className="text-xs text-gray-500">Get special deals & discounts</p>
                                    </div>
                                </div>
                            </div>

                            <button
                                onClick={handleSubscribe}
                                disabled={isLoading}
                                className="w-full mt-4 py-3 bg-gradient-to-r from-[#FF9900] to-[#FFB84D] hover:from-[#E08900] hover:to-[#FFA500] text-white font-bold rounded-xl shadow-lg shadow-orange-200 transition-all disabled:opacity-70 flex items-center justify-center gap-2"
                            >
                                {isLoading ? (
                                    <>
                                        <Loader2 className="w-5 h-5 animate-spin" />
                                        Enabling...
                                    </>
                                ) : (
                                    <>
                                        <Bell className="w-5 h-5" />
                                        Enable Notifications
                                    </>
                                )}
                            </button>

                            <button
                                onClick={handleDismiss}
                                className="w-full mt-2 py-2 text-sm text-gray-400 hover:text-gray-600 transition-colors"
                            >
                                Maybe later
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
