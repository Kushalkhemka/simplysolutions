'use client';

import { useState, useEffect } from 'react';
import { Bell, BellOff, X, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

interface PushPermissionProps {
    showBanner?: boolean;
}

export function PushPermission({ showBanner = true }: PushPermissionProps) {
    const [permission, setPermission] = useState<NotificationPermission | 'unsupported'>('default');
    const [isLoading, setIsLoading] = useState(false);
    const [isDismissed, setIsDismissed] = useState(false);
    const [isSubscribed, setIsSubscribed] = useState(false);

    useEffect(() => {
        checkPermissionStatus();
    }, []);

    const checkPermissionStatus = async () => {
        if (!('Notification' in window) || !('serviceWorker' in navigator)) {
            setPermission('unsupported');
            return;
        }

        setPermission(Notification.permission);

        // Check if already subscribed
        if (Notification.permission === 'granted') {
            const registration = await navigator.serviceWorker.ready;
            const subscription = await registration.pushManager.getSubscription();
            setIsSubscribed(!!subscription);
        }

        // Check if dismissed
        const dismissed = localStorage.getItem('push_permission_dismissed');
        if (dismissed) {
            setIsDismissed(true);
        }
    };

    const subscribeToPush = async () => {
        setIsLoading(true);
        try {
            const permission = await Notification.requestPermission();
            setPermission(permission);

            if (permission !== 'granted') {
                toast.error('Notification permission denied');
                return;
            }

            // Register service worker
            const registration = await navigator.serviceWorker.register('/sw.js');
            await navigator.serviceWorker.ready;

            // Get VAPID public key
            const vapidRes = await fetch('/api/push/vapid-key');
            const { key: vapidKey } = await vapidRes.json();

            if (!vapidKey) {
                console.warn('VAPID key not configured');
                return;
            }

            // Subscribe to push
            const subscription = await registration.pushManager.subscribe({
                userVisibleOnly: true,
                applicationServerKey: urlBase64ToUint8Array(vapidKey),
            });

            // Send subscription to server
            const res = await fetch('/api/push/subscribe', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(subscription),
            });

            const data = await res.json();
            if (data.success) {
                setIsSubscribed(true);
                toast.success('Notifications enabled!');
            }
        } catch (error) {
            console.error('Push subscription error:', error);
            toast.error('Failed to enable notifications');
        } finally {
            setIsLoading(false);
        }
    };

    const unsubscribe = async () => {
        setIsLoading(true);
        try {
            const registration = await navigator.serviceWorker.ready;
            const subscription = await registration.pushManager.getSubscription();

            if (subscription) {
                await subscription.unsubscribe();

                // Remove from server
                await fetch('/api/push/unsubscribe', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ endpoint: subscription.endpoint }),
                });
            }

            setIsSubscribed(false);
            toast.success('Notifications disabled');
        } catch (error) {
            console.error('Unsubscribe error:', error);
            toast.error('Failed to disable notifications');
        } finally {
            setIsLoading(false);
        }
    };

    const dismiss = () => {
        setIsDismissed(true);
        localStorage.setItem('push_permission_dismissed', 'true');
    };

    // Don't show if unsupported, already subscribed, or dismissed
    if (permission === 'unsupported' || isSubscribed || isDismissed || permission === 'denied') {
        return null;
    }

    if (!showBanner) {
        return (
            <Button
                variant="outline"
                size="sm"
                onClick={subscribeToPush}
                disabled={isLoading}
                className="gap-2"
            >
                {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Bell className="h-4 w-4" />}
                Enable Notifications
            </Button>
        );
    }

    return (
        <div className="fixed bottom-20 left-4 md:left-4 md:right-auto md:max-w-sm bg-card border shadow-lg rounded-lg p-4 z-40 animate-in slide-in-from-bottom-4">
            <button
                onClick={dismiss}
                className="absolute top-2 right-2 text-muted-foreground hover:text-foreground"
            >
                <X className="h-4 w-4" />
            </button>

            <div className="flex gap-3">
                <div className="p-2 bg-primary/10 rounded-full h-fit">
                    <Bell className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1">
                    <h4 className="font-semibold text-sm">Stay Updated!</h4>
                    <p className="text-xs text-muted-foreground mb-3">
                        Get instant updates on orders, offers, and support replies.
                    </p>
                    <div className="flex gap-2">
                        <Button size="sm" onClick={subscribeToPush} disabled={isLoading}>
                            {isLoading && <Loader2 className="h-3 w-3 mr-1 animate-spin" />}
                            Enable
                        </Button>
                        <Button size="sm" variant="ghost" onClick={dismiss}>
                            Not Now
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}

// Toggle button for settings page
export function NotificationToggle() {
    const [isSubscribed, setIsSubscribed] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [isSupported, setIsSupported] = useState(true);

    useEffect(() => {
        checkStatus();
    }, []);

    const checkStatus = async () => {
        if (!('Notification' in window) || !('serviceWorker' in navigator)) {
            setIsSupported(false);
            setIsLoading(false);
            return;
        }

        try {
            const registration = await navigator.serviceWorker.ready;
            const subscription = await registration.pushManager.getSubscription();
            setIsSubscribed(!!subscription);
        } catch (error) {
            console.error('Error checking subscription:', error);
        }
        setIsLoading(false);
    };

    const toggle = async () => {
        if (isSubscribed) {
            // Unsubscribe logic
            setIsLoading(true);
            const registration = await navigator.serviceWorker.ready;
            const subscription = await registration.pushManager.getSubscription();
            if (subscription) {
                await subscription.unsubscribe();
                await fetch('/api/push/unsubscribe', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ endpoint: subscription.endpoint }),
                });
            }
            setIsSubscribed(false);
            setIsLoading(false);
            toast.success('Notifications disabled');
        } else {
            // Subscribe
            setIsLoading(true);
            try {
                const permission = await Notification.requestPermission();
                if (permission !== 'granted') {
                    toast.error('Permission denied');
                    setIsLoading(false);
                    return;
                }

                const registration = await navigator.serviceWorker.register('/sw.js');
                await navigator.serviceWorker.ready;

                const vapidRes = await fetch('/api/push/vapid-key');
                const { key: vapidKey } = await vapidRes.json();

                const subscription = await registration.pushManager.subscribe({
                    userVisibleOnly: true,
                    applicationServerKey: urlBase64ToUint8Array(vapidKey),
                });

                await fetch('/api/push/subscribe', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(subscription),
                });

                setIsSubscribed(true);
                toast.success('Notifications enabled!');
            } catch (error) {
                console.error('Subscribe error:', error);
                toast.error('Failed to enable notifications');
            }
            setIsLoading(false);
        }
    };

    if (!isSupported) {
        return (
            <div className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                    <div className="font-medium">Push Notifications</div>
                    <div className="text-sm text-muted-foreground">Not supported in this browser</div>
                </div>
                <BellOff className="h-5 w-5 text-muted-foreground" />
            </div>
        );
    }

    return (
        <div className="flex items-center justify-between p-4 border rounded-lg">
            <div>
                <div className="font-medium">Push Notifications</div>
                <div className="text-sm text-muted-foreground">
                    {isSubscribed ? 'Enabled - You will receive updates' : 'Get instant updates on orders and offers'}
                </div>
            </div>
            <Button
                variant={isSubscribed ? 'destructive' : 'default'}
                size="sm"
                onClick={toggle}
                disabled={isLoading}
            >
                {isLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                ) : isSubscribed ? (
                    <>
                        <BellOff className="h-4 w-4 mr-2" />
                        Disable
                    </>
                ) : (
                    <>
                        <Bell className="h-4 w-4 mr-2" />
                        Enable
                    </>
                )}
            </Button>
        </div>
    );
}

// Helper function to convert VAPID key
function urlBase64ToUint8Array(base64String: string): ArrayBuffer {
    const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);
    for (let i = 0; i < rawData.length; ++i) {
        outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray.buffer as ArrayBuffer;
}
