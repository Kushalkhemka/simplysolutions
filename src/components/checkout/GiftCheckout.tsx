'use client';

import { useState } from 'react';
import { Gift, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface GiftCheckoutProps {
    onGiftChange: (isGift: boolean, giftDetails: GiftDetails | null) => void;
}

export interface GiftDetails {
    recipientName: string;
    recipientEmail: string;
    message: string;
}

export function GiftCheckout({ onGiftChange }: GiftCheckoutProps) {
    const [isGift, setIsGift] = useState(false);
    const [giftDetails, setGiftDetails] = useState<GiftDetails>({
        recipientName: '',
        recipientEmail: '',
        message: '',
    });

    const handleToggleGift = () => {
        const newIsGift = !isGift;
        setIsGift(newIsGift);
        if (!newIsGift) {
            onGiftChange(false, null);
        }
    };

    const handleDetailsChange = (field: keyof GiftDetails, value: string) => {
        const newDetails = { ...giftDetails, [field]: value };
        setGiftDetails(newDetails);
        onGiftChange(isGift, newDetails);
    };

    return (
        <div className="border rounded-lg overflow-hidden">
            <button
                type="button"
                onClick={handleToggleGift}
                className={`w-full p-4 flex items-center gap-3 transition-colors ${isGift ? 'bg-primary/10' : 'bg-muted/30 hover:bg-muted/50'
                    }`}
            >
                <div className={`p-2 rounded-full ${isGift ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
                    <Gift className="h-5 w-5" />
                </div>
                <div className="flex-1 text-left">
                    <p className="font-medium">Send as a Gift</p>
                    <p className="text-sm text-muted-foreground">
                        Deliver license key directly to recipient's email
                    </p>
                </div>
                <div className={`w-5 h-5 rounded border-2 flex items-center justify-center ${isGift ? 'bg-primary border-primary' : 'border-muted-foreground'
                    }`}>
                    {isGift && <span className="text-primary-foreground text-xs">✓</span>}
                </div>
            </button>

            {isGift && (
                <div className="p-4 space-y-4 bg-primary/5 animate-in slide-in-from-top-2">
                    <div className="grid gap-4 md:grid-cols-2">
                        <div>
                            <Label htmlFor="recipientName">Recipient Name *</Label>
                            <Input
                                id="recipientName"
                                value={giftDetails.recipientName}
                                onChange={(e) => handleDetailsChange('recipientName', e.target.value)}
                                placeholder="John Doe"
                                required
                            />
                        </div>
                        <div>
                            <Label htmlFor="recipientEmail">Recipient Email *</Label>
                            <Input
                                id="recipientEmail"
                                type="email"
                                value={giftDetails.recipientEmail}
                                onChange={(e) => handleDetailsChange('recipientEmail', e.target.value)}
                                placeholder="john@example.com"
                                required
                            />
                        </div>
                    </div>

                    <div>
                        <Label htmlFor="giftMessage">Personal Message (Optional)</Label>
                        <textarea
                            id="giftMessage"
                            value={giftDetails.message}
                            onChange={(e) => handleDetailsChange('message', e.target.value)}
                            placeholder="Enjoy your new software! 🎁"
                            className="w-full min-h-[80px] p-3 border rounded-md bg-background resize-none"
                            maxLength={500}
                        />
                        <p className="text-xs text-muted-foreground mt-1">
                            {giftDetails.message.length}/500 characters
                        </p>
                    </div>

                    <div className="flex items-start gap-2 p-3 bg-yellow-50 dark:bg-yellow-950/20 rounded-lg text-sm">
                        <Gift className="h-4 w-4 text-yellow-600 flex-shrink-0 mt-0.5" />
                        <p className="text-yellow-800 dark:text-yellow-200">
                            The license key will be sent directly to the recipient's email with your personal message.
                            You will also receive a copy for your records.
                        </p>
                    </div>
                </div>
            )}
        </div>
    );
}
