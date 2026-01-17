'use client';

import { useState } from 'react';
import { Settings, Save, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';

export default function AdminSettingsPage() {
    const [isSaving, setIsSaving] = useState(false);

    const [settings, setSettings] = useState({
        siteName: 'SimplySolutions',
        siteDescription: 'Genuine Software Licenses at Best Prices',
        supportEmail: 'support@simplysolutions.com',
        supportPhone: '+91 9999999999',
        referralReward: '50',
        referredReward: '25',
        affiliateCommission: '10',
        minOrderForCoupon: '0',
    });

    const handleSave = async () => {
        setIsSaving(true);
        // Simulate save - in production, this would call an API
        await new Promise(resolve => setTimeout(resolve, 1000));
        toast.success('Settings saved successfully');
        setIsSaving(false);
    };

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold flex items-center gap-2">
                    <Settings className="h-6 w-6" />
                    Admin Settings
                </h1>
                <p className="text-muted-foreground">Configure site-wide settings</p>
            </div>

            <div className="max-w-2xl space-y-6">
                {/* General Settings */}
                <div className="bg-card border rounded-lg p-6 space-y-4">
                    <h2 className="font-semibold">General Settings</h2>

                    <div>
                        <Label>Site Name</Label>
                        <Input
                            value={settings.siteName}
                            onChange={(e) => setSettings({ ...settings, siteName: e.target.value })}
                        />
                    </div>

                    <div>
                        <Label>Site Description</Label>
                        <Input
                            value={settings.siteDescription}
                            onChange={(e) => setSettings({ ...settings, siteDescription: e.target.value })}
                        />
                    </div>
                </div>

                {/* Contact Settings */}
                <div className="bg-card border rounded-lg p-6 space-y-4">
                    <h2 className="font-semibold">Contact Information</h2>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <Label>Support Email</Label>
                            <Input
                                type="email"
                                value={settings.supportEmail}
                                onChange={(e) => setSettings({ ...settings, supportEmail: e.target.value })}
                            />
                        </div>
                        <div>
                            <Label>Support Phone</Label>
                            <Input
                                value={settings.supportPhone}
                                onChange={(e) => setSettings({ ...settings, supportPhone: e.target.value })}
                            />
                        </div>
                    </div>
                </div>

                {/* Referral Settings */}
                <div className="bg-card border rounded-lg p-6 space-y-4">
                    <h2 className="font-semibold">Referral Program</h2>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <Label>Referrer Reward (₹)</Label>
                            <Input
                                type="number"
                                value={settings.referralReward}
                                onChange={(e) => setSettings({ ...settings, referralReward: e.target.value })}
                            />
                            <p className="text-xs text-muted-foreground mt-1">Amount credited to referrer</p>
                        </div>
                        <div>
                            <Label>Referred Reward (₹)</Label>
                            <Input
                                type="number"
                                value={settings.referredReward}
                                onChange={(e) => setSettings({ ...settings, referredReward: e.target.value })}
                            />
                            <p className="text-xs text-muted-foreground mt-1">Amount credited to new user</p>
                        </div>
                    </div>
                </div>

                {/* Affiliate Settings */}
                <div className="bg-card border rounded-lg p-6 space-y-4">
                    <h2 className="font-semibold">Affiliate Program</h2>

                    <div>
                        <Label>Default Commission Rate (%)</Label>
                        <Input
                            type="number"
                            value={settings.affiliateCommission}
                            onChange={(e) => setSettings({ ...settings, affiliateCommission: e.target.value })}
                        />
                        <p className="text-xs text-muted-foreground mt-1">Commission percentage for affiliates</p>
                    </div>
                </div>

                {/* Coupon Settings */}
                <div className="bg-card border rounded-lg p-6 space-y-4">
                    <h2 className="font-semibold">Coupon Settings</h2>

                    <div>
                        <Label>Default Minimum Order Amount (₹)</Label>
                        <Input
                            type="number"
                            value={settings.minOrderForCoupon}
                            onChange={(e) => setSettings({ ...settings, minOrderForCoupon: e.target.value })}
                        />
                    </div>
                </div>

                <Button onClick={handleSave} disabled={isSaving} className="gap-2">
                    {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                    Save Settings
                </Button>
            </div>
        </div>
    );
}
