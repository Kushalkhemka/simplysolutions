'use client';

import { useState, useEffect } from 'react';
import { Bell, BellOff, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

function urlBase64ToUint8Array(base64String: string): ArrayBuffer {
    const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding)
        .replace(/-/g, '+')
        .replace(/_/g, '/');

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
        outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray.buffer as ArrayBuffer;
}

export function AdminPushToggle() {
    const [isSubscribed, setIsSubscribed] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [isSupported, setIsSupported] = useState(false);

    useEffect(() => {
        checkStatus();
    }, []);

    const checkStatus = async () => {
        // Check if push notifications are supported
        if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
            setIsSupported(false);
            setIsLoading(false);
            return;
        }

        setIsSupported(true);

        try {
            // Check if service worker is registered first
            const registrations = await navigator.serviceWorker.getRegistrations();
            if (registrations.length === 0) {
                // No service worker registered yet - that's OK, just show unsubscribed state
                setIsLoading(false);
                return;
            }

            // Add timeout to prevent hanging
            const timeoutPromise = new Promise<null>((_, reject) =>
                setTimeout(() => reject(new Error('SW ready timeout')), 3000)
            );

            const registration = await Promise.race([
                navigator.serviceWorker.ready,
                timeoutPromise
            ]);

            if (registration) {
                const subscription = await registration.pushManager.getSubscription();
                setIsSubscribed(!!subscription);
            }
        } catch (error) {
            console.error('Error checking push status:', error);
        }

        setIsLoading(false);
    };

    const subscribe = async () => {
        setIsLoading(true);

        try {
            // Request notification permission
            const permission = await Notification.requestPermission();
            if (permission !== 'granted') {
                toast.error('Notification permission denied');
                setIsLoading(false);
                return;
            }

            // Get VAPID public key
            const vapidRes = await fetch('/api/push/vapid-key');
            const { publicKey } = await vapidRes.json();

            if (!publicKey) {
                toast.error('Push notifications not configured');
                setIsLoading(false);
                return;
            }

            // Subscribe to push
            const registration = await navigator.serviceWorker.ready;
            const subscription = await registration.pushManager.subscribe({
                userVisibleOnly: true,
                applicationServerKey: urlBase64ToUint8Array(publicKey),
            });

            // Send subscription to server with admin flag
            const res = await fetch('/api/push/subscribe', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...subscription.toJSON(),
                    isAdminSubscriber: true,
                }),
            });

            if (!res.ok) throw new Error('Failed to save subscription');

            setIsSubscribed(true);
            toast.success('Admin notifications enabled');
        } catch (error) {
            console.error('Error subscribing:', error);
            toast.error('Failed to enable notifications');
        }

        setIsLoading(false);
    };

    const unsubscribe = async () => {
        setIsLoading(true);

        try {
            const registration = await navigator.serviceWorker.ready;
            const subscription = await registration.pushManager.getSubscription();

            if (subscription) {
                await subscription.unsubscribe();

                // Notify server
                await fetch('/api/push/unsubscribe', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ endpoint: subscription.endpoint }),
                });
            }

            setIsSubscribed(false);
            toast.success('Notifications disabled');
        } catch (error) {
            console.error('Error unsubscribing:', error);
            toast.error('Failed to disable notifications');
        }

        setIsLoading(false);
    };

    if (!isSupported) {
        return null;
    }

    return (
        <Button
            variant="ghost"
            size="icon"
            onClick={isSubscribed ? unsubscribe : subscribe}
            disabled={isLoading}
            className="relative"
            title={isSubscribed ? 'Disable notifications' : 'Enable admin notifications'}
        >
            {isLoading ? (
                <Loader2 className="h-5 w-5 animate-spin" />
            ) : isSubscribed ? (
                <>
                    <Bell className="h-5 w-5 text-orange-500" />
                    <span className="absolute top-1 right-1 w-2 h-2 bg-green-500 rounded-full" />
                </>
            ) : (
                <BellOff className="h-5 w-5 text-muted-foreground" />
            )}
        </Button>
    );
}
