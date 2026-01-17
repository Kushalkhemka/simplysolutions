'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Loader2, User, Save, Building2, Award, Crown, Copy, Globe } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuthStore } from '@/stores/auth-store';
import { toast } from 'sonner';

const profileSchema = z.object({
    fullName: z.string().min(2, 'Name must be at least 2 characters'),
    phone: z.string().optional(),
    businessType: z.enum(['individual', 'business']).optional(),
    businessName: z.string().optional(),
    gstn: z.string().optional().refine((val) => {
        if (!val) return true;
        // GSTN format: 2 digits + 10 alphanumeric + 1 digit + Z + 1 alphanumeric
        const gstnRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
        return gstnRegex.test(val.toUpperCase());
    }, 'Invalid GSTN format'),
    preferredCurrency: z.string().optional(),
    preferredLanguage: z.string().optional(),
});

type ProfileForm = z.infer<typeof profileSchema>;

const tierColors = {
    bronze: 'from-amber-600 to-amber-800',
    silver: 'from-gray-400 to-gray-600',
    gold: 'from-yellow-400 to-yellow-600',
    platinum: 'from-purple-400 to-purple-700',
};

const tierBenefits = {
    bronze: 'Earn 1 point per ₹100 spent',
    silver: '5% extra discount on all orders',
    gold: '10% extra discount + Priority support',
    platinum: '15% extra discount + Exclusive deals',
};

export default function SettingsPage() {
    const router = useRouter();
    const { user, isAuthenticated, fetchUser, isLoading: authLoading } = useAuthStore();
    const [isSaving, setIsSaving] = useState(false);
    const [showBusinessFields, setShowBusinessFields] = useState(false);

    const { register, handleSubmit, formState: { errors }, setValue, watch } = useForm<ProfileForm>({
        resolver: zodResolver(profileSchema),
    });

    const businessType = watch('businessType');

    useEffect(() => {
        if (!authLoading && !isAuthenticated) {
            router.push('/login?redirect=/dashboard/settings');
        }
    }, [authLoading, isAuthenticated, router]);

    useEffect(() => {
        if (user) {
            setValue('fullName', user.full_name || '');
            setValue('phone', user.phone || '');
            setValue('businessType', (user as any).business_type || 'individual');
            setValue('businessName', (user as any).business_name || '');
            setValue('gstn', (user as any).gstn || '');
            setValue('preferredCurrency', (user as any).preferred_currency || 'INR');
            setValue('preferredLanguage', (user as any).preferred_language || 'en');
            setShowBusinessFields((user as any).business_type === 'business');
        }
    }, [user, setValue]);

    useEffect(() => {
        setShowBusinessFields(businessType === 'business');
    }, [businessType]);

    const onSubmit = async (data: ProfileForm) => {
        setIsSaving(true);
        try {
            const res = await fetch('/api/profile', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    full_name: data.fullName,
                    phone: data.phone,
                    business_type: data.businessType,
                    business_name: data.businessName,
                    gstn: data.gstn?.toUpperCase(),
                    preferred_currency: data.preferredCurrency,
                    preferred_language: data.preferredLanguage,
                }),
            });

            if (res.ok) {
                await fetchUser();
                toast.success('Profile updated successfully');
            } else {
                toast.error('Failed to update profile');
            }
        } catch (error) {
            console.error('Update error:', error);
            toast.error('An error occurred');
        } finally {
            setIsSaving(false);
        }
    };

    if (authLoading || !isAuthenticated) {
        return (
            <div className="container mx-auto px-4 py-16 text-center">
                <Loader2 className="h-8 w-8 animate-spin mx-auto" />
            </div>
        );
    }

    const userTier = (user as any)?.tier || 'bronze';
    const userPoints = (user as any)?.points || 0;
    const lifetimePoints = (user as any)?.lifetime_points || 0;

    return (
        <div className="container-dense py-8">
            <h1 className="text-2xl md:text-3xl font-bold mb-8">Account Settings</h1>

            <div className="space-y-8">
                {/* Rewards Tier Card */}
                <div className={`border rounded-lg p-6 bg-gradient-to-r ${tierColors[userTier as keyof typeof tierColors]} text-white`}>
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-white/20 rounded-full">
                                <Crown className="h-8 w-8" />
                            </div>
                            <div>
                                <p className="text-sm opacity-90">Your Membership</p>
                                <h2 className="text-2xl font-bold capitalize">{userTier}</h2>
                            </div>
                        </div>
                        <div className="text-right">
                            <p className="text-3xl font-bold">{userPoints.toLocaleString()}</p>
                            <p className="text-sm opacity-90">Points Available</p>
                        </div>
                    </div>
                    <div className="mt-4 pt-4 border-t border-white/20">
                        <div className="flex justify-between items-center">
                            <p className="text-sm opacity-90">{tierBenefits[userTier as keyof typeof tierBenefits]}</p>
                            <p className="text-sm opacity-75">Lifetime: {lifetimePoints.toLocaleString()} pts</p>
                        </div>
                    </div>
                </div>

                {/* Profile Section */}
                <div className="border rounded-lg p-6">
                    <div className="flex items-center gap-4 mb-6">
                        <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                            <User className="h-8 w-8 text-primary" />
                        </div>
                        <div>
                            <h2 className="font-semibold text-lg">{user?.full_name || 'User'}</h2>
                            <p className="text-muted-foreground">{user?.email}</p>
                        </div>
                    </div>

                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                        {/* Basic Info */}
                        <div className="grid gap-4 md:grid-cols-2">
                            <div>
                                <Label htmlFor="fullName">Full Name</Label>
                                <Input
                                    id="fullName"
                                    {...register('fullName')}
                                    className={errors.fullName ? 'border-destructive' : ''}
                                />
                                {errors.fullName && (
                                    <p className="text-sm text-destructive mt-1">{errors.fullName.message}</p>
                                )}
                            </div>

                            <div>
                                <Label htmlFor="phone">Phone Number</Label>
                                <Input
                                    id="phone"
                                    type="tel"
                                    {...register('phone')}
                                    placeholder="+91 98765 43210"
                                />
                            </div>
                        </div>

                        <div>
                            <Label htmlFor="email">Email Address</Label>
                            <Input
                                id="email"
                                type="email"
                                value={user?.email || ''}
                                disabled
                                className="bg-muted"
                            />
                            <p className="text-xs text-muted-foreground mt-1">
                                Email cannot be changed
                            </p>
                        </div>

                        {/* Business Information */}
                        <div className="pt-4 border-t">
                            <div className="flex items-center gap-2 mb-4">
                                <Building2 className="h-5 w-5 text-primary" />
                                <h3 className="font-semibold">Business Information</h3>
                                <span className="text-xs text-muted-foreground">(For GST invoices)</span>
                            </div>

                            <div className="space-y-4">
                                <div>
                                    <Label>Account Type</Label>
                                    <div className="flex gap-4 mt-2">
                                        <label className="flex items-center gap-2 cursor-pointer">
                                            <input
                                                type="radio"
                                                value="individual"
                                                {...register('businessType')}
                                                className="w-4 h-4"
                                            />
                                            <span>Individual</span>
                                        </label>
                                        <label className="flex items-center gap-2 cursor-pointer">
                                            <input
                                                type="radio"
                                                value="business"
                                                {...register('businessType')}
                                                className="w-4 h-4"
                                            />
                                            <span>Business</span>
                                        </label>
                                    </div>
                                </div>

                                {showBusinessFields && (
                                    <div className="grid gap-4 md:grid-cols-2 animate-in slide-in-from-top-2">
                                        <div>
                                            <Label htmlFor="businessName">Business Name</Label>
                                            <Input
                                                id="businessName"
                                                {...register('businessName')}
                                                placeholder="Your Company Pvt. Ltd."
                                            />
                                        </div>

                                        <div>
                                            <Label htmlFor="gstn">GSTN (GST Number)</Label>
                                            <Input
                                                id="gstn"
                                                {...register('gstn')}
                                                placeholder="22AAAAA0000A1Z5"
                                                className={errors.gstn ? 'border-destructive' : ''}
                                            />
                                            {errors.gstn && (
                                                <p className="text-sm text-destructive mt-1">{errors.gstn.message}</p>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Preferences */}
                        <div className="pt-4 border-t">
                            <div className="flex items-center gap-2 mb-4">
                                <Globe className="h-5 w-5 text-primary" />
                                <h3 className="font-semibold">Preferences</h3>
                            </div>

                            <div className="grid gap-4 md:grid-cols-2">
                                <div>
                                    <Label htmlFor="preferredCurrency">Currency</Label>
                                    <select
                                        id="preferredCurrency"
                                        {...register('preferredCurrency')}
                                        className="w-full h-10 px-3 border rounded-md bg-background"
                                    >
                                        <option value="INR">₹ INR (Indian Rupee)</option>
                                        <option value="USD">$ USD (US Dollar)</option>
                                        <option value="EUR">€ EUR (Euro)</option>
                                    </select>
                                </div>

                                <div>
                                    <Label htmlFor="preferredLanguage">Language</Label>
                                    <select
                                        id="preferredLanguage"
                                        {...register('preferredLanguage')}
                                        className="w-full h-10 px-3 border rounded-md bg-background"
                                    >
                                        <option value="en">English</option>
                                        <option value="hi">हिंदी (Hindi)</option>
                                    </select>
                                </div>
                            </div>
                        </div>

                        <Button type="submit" disabled={isSaving} className="gap-2">
                            {isSaving ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                                <Save className="h-4 w-4" />
                            )}
                            Save Changes
                        </Button>
                    </form>
                </div>

                {/* Referral Section */}
                {user?.referral_code && (
                    <div className="border rounded-lg p-6">
                        <h3 className="font-semibold mb-4">Your Referral Code</h3>
                        <div className="flex items-center gap-2">
                            <code className="bg-muted px-4 py-2 rounded text-lg font-mono flex-1">
                                {user.referral_code}
                            </code>
                            <Button
                                variant="outline"
                                onClick={() => {
                                    navigator.clipboard.writeText(user.referral_code || '');
                                    toast.success('Copied to clipboard');
                                }}
                            >
                                <Copy className="h-4 w-4" />
                            </Button>
                        </div>
                        <p className="text-sm text-muted-foreground mt-2">
                            Share this code with friends. Earn 50 points for each successful referral!
                        </p>
                    </div>
                )}

                {/* Password Section */}
                <div className="border rounded-lg p-6">
                    <h3 className="font-semibold mb-4">Password</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                        To change your password, you'll receive a reset link via email.
                    </p>
                    <Button variant="outline">Send Password Reset Email</Button>
                </div>

                {/* Danger Zone */}
                <div className="border border-destructive/20 rounded-lg p-6">
                    <h3 className="font-semibold text-destructive mb-4">Danger Zone</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                        Once you delete your account, there is no going back. Please be certain.
                    </p>
                    <Button variant="destructive" disabled>
                        Delete Account
                    </Button>
                </div>
            </div>
        </div>
    );
}
