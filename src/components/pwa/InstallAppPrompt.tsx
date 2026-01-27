'use client';

import { useState, useEffect } from 'react';
import { Download, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface BeforeInstallPromptEvent extends Event {
    prompt: () => Promise<void>;
    userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export function InstallAppPrompt() {
    const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
    const [showPrompt, setShowPrompt] = useState(false);
    const [isMobile, setIsMobile] = useState(false);
    const [isInstalled, setIsInstalled] = useState(false);

    useEffect(() => {
        // Check if mobile device
        const checkMobile = () => {
            const mobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
                navigator.userAgent
            );
            setIsMobile(mobile);
        };
        checkMobile();

        // Check if already installed
        if (window.matchMedia('(display-mode: standalone)').matches) {
            setIsInstalled(true);
            return;
        }

        // Check if user dismissed recently
        const dismissedAt = localStorage.getItem('pwa-install-dismissed');
        if (dismissedAt) {
            const dismissedTime = parseInt(dismissedAt, 10);
            const daysSinceDismiss = (Date.now() - dismissedTime) / (1000 * 60 * 60 * 24);
            if (daysSinceDismiss < 7) {
                return; // Don't show for 7 days after dismiss
            }
        }

        // Listen for install prompt
        const handleBeforeInstallPrompt = (e: Event) => {
            e.preventDefault();
            setDeferredPrompt(e as BeforeInstallPromptEvent);
            setShowPrompt(true);
        };

        window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

        // Listen for app installed
        const handleAppInstalled = () => {
            setIsInstalled(true);
            setShowPrompt(false);
            setDeferredPrompt(null);
        };

        window.addEventListener('appinstalled', handleAppInstalled);

        return () => {
            window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
            window.removeEventListener('appinstalled', handleAppInstalled);
        };
    }, []);

    const handleInstall = async () => {
        if (!deferredPrompt) return;

        try {
            await deferredPrompt.prompt();
            const { outcome } = await deferredPrompt.userChoice;

            if (outcome === 'accepted') {
                setShowPrompt(false);
            }
        } catch (error) {
            console.error('Install prompt error:', error);
        }

        setDeferredPrompt(null);
    };

    const handleDismiss = () => {
        setShowPrompt(false);
        localStorage.setItem('pwa-install-dismissed', Date.now().toString());
    };

    // Only show on mobile, when not installed, and prompt is available
    if (!isMobile || isInstalled || !showPrompt || !deferredPrompt) {
        return null;
    }

    return (
        <div className="fixed bottom-20 left-4 right-4 z-50 animate-in slide-in-from-bottom-4 duration-300">
            <div className="bg-gradient-to-r from-orange-500 to-orange-600 rounded-xl shadow-2xl p-4 flex items-center gap-3">
                <div className="bg-white/20 rounded-lg p-2">
                    <Download className="h-6 w-6 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                    <p className="text-white font-semibold text-sm">
                        Install SimplySolutions
                    </p>
                    <p className="text-white/80 text-xs truncate">
                        Add to home screen for quick access
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <Button
                        onClick={handleInstall}
                        size="sm"
                        className="bg-white text-orange-600 hover:bg-white/90 font-semibold"
                    >
                        Install
                    </Button>
                    <button
                        onClick={handleDismiss}
                        className="text-white/80 hover:text-white p-1"
                        aria-label="Dismiss"
                    >
                        <X className="h-5 w-5" />
                    </button>
                </div>
            </div>
        </div>
    );
}
