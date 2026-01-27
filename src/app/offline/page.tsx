'use client';

import { Wifi, WifiOff, RefreshCw, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export default function OfflinePage() {
    return (
        <div className="min-h-screen bg-gradient-to-b from-muted/50 to-background flex items-center justify-center p-4">
            <div className="max-w-md w-full text-center space-y-6">
                {/* Animated Icon */}
                <div className="relative mx-auto w-24 h-24">
                    <div className="absolute inset-0 bg-orange-500/20 rounded-full animate-ping" />
                    <div className="relative bg-orange-500/10 rounded-full w-24 h-24 flex items-center justify-center">
                        <WifiOff className="w-12 h-12 text-orange-500" />
                    </div>
                </div>

                {/* Text */}
                <div className="space-y-2">
                    <h1 className="text-2xl font-bold">You&apos;re Offline</h1>
                    <p className="text-muted-foreground">
                        It looks like you&apos;ve lost your internet connection.
                        Some features may not be available.
                    </p>
                </div>

                {/* Actions */}
                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                    <Button
                        onClick={() => window.location.reload()}
                        className="bg-orange-500 hover:bg-orange-600"
                    >
                        <RefreshCw className="w-4 h-4 mr-2" />
                        Try Again
                    </Button>
                    <Button variant="outline" asChild>
                        <Link href="/">
                            <Home className="w-4 h-4 mr-2" />
                            Go Home
                        </Link>
                    </Button>
                </div>

                {/* Tips */}
                <div className="bg-muted/50 rounded-lg p-4 text-sm text-left space-y-2">
                    <p className="font-medium flex items-center gap-2">
                        <Wifi className="w-4 h-4 text-orange-500" />
                        Tips while offline:
                    </p>
                    <ul className="text-muted-foreground space-y-1 ml-6 list-disc">
                        <li>Check your WiFi or mobile data connection</li>
                        <li>Move closer to your router</li>
                        <li>Toggle airplane mode off</li>
                        <li>Already viewed pages may still work</li>
                    </ul>
                </div>
            </div>
        </div>
    );
}
