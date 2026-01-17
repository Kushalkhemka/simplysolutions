'use client';

import { Suspense, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Eye, EyeOff, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuthStore } from '@/stores/auth-store';
import { toast } from 'sonner';

const registerSchema = z.object({
    fullName: z.string().min(2, 'Name must be at least 2 characters'),
    email: z.string().email('Invalid email address'),
    password: z.string().min(6, 'Password must be at least 6 characters'),
    confirmPassword: z.string(),
    referralCode: z.string().optional(),
}).refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword'],
});

type RegisterForm = z.infer<typeof registerSchema>;

function RegisterContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const redirect = searchParams.get('redirect') || '/dashboard';
    const { register: registerUser, isLoading } = useAuthStore();
    const [showPassword, setShowPassword] = useState(false);

    const { register, handleSubmit, formState: { errors } } = useForm<RegisterForm>({
        resolver: zodResolver(registerSchema),
    });

    const onSubmit = async (data: RegisterForm) => {
        const result = await registerUser({
            email: data.email,
            password: data.password,
            fullName: data.fullName,
            referralCode: data.referralCode,
        });

        if (result.success) {
            toast.success('Account created! Please check your email to verify your account.');
            router.push('/login');
        } else {
            toast.error(result.error || 'Registration failed');
        }
    };

    return (
        <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
            <div className="w-full max-w-md">
                <div className="text-center mb-8">
                    <h1 className="text-2xl font-bold">Create Account</h1>
                    <p className="text-muted-foreground mt-2">Join SimplySolutions today</p>
                </div>

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                    <div>
                        <Label htmlFor="fullName">Full Name</Label>
                        <Input
                            id="fullName"
                            placeholder="John Doe"
                            {...register('fullName')}
                            className={errors.fullName ? 'border-destructive' : ''}
                        />
                        {errors.fullName && (
                            <p className="text-sm text-destructive mt-1">{errors.fullName.message}</p>
                        )}
                    </div>

                    <div>
                        <Label htmlFor="email">Email</Label>
                        <Input
                            id="email"
                            type="email"
                            placeholder="you@example.com"
                            {...register('email')}
                            className={errors.email ? 'border-destructive' : ''}
                        />
                        {errors.email && (
                            <p className="text-sm text-destructive mt-1">{errors.email.message}</p>
                        )}
                    </div>

                    <div>
                        <Label htmlFor="password">Password</Label>
                        <div className="relative">
                            <Input
                                id="password"
                                type={showPassword ? 'text' : 'password'}
                                placeholder="••••••••"
                                {...register('password')}
                                className={errors.password ? 'border-destructive' : ''}
                            />
                            <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="absolute right-0 top-0"
                                onClick={() => setShowPassword(!showPassword)}
                            >
                                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                            </Button>
                        </div>
                        {errors.password && (
                            <p className="text-sm text-destructive mt-1">{errors.password.message}</p>
                        )}
                    </div>

                    <div>
                        <Label htmlFor="confirmPassword">Confirm Password</Label>
                        <Input
                            id="confirmPassword"
                            type="password"
                            placeholder="••••••••"
                            {...register('confirmPassword')}
                            className={errors.confirmPassword ? 'border-destructive' : ''}
                        />
                        {errors.confirmPassword && (
                            <p className="text-sm text-destructive mt-1">{errors.confirmPassword.message}</p>
                        )}
                    </div>

                    <div>
                        <Label htmlFor="referralCode">Referral Code (Optional)</Label>
                        <Input
                            id="referralCode"
                            placeholder="REF12345"
                            {...register('referralCode')}
                        />
                    </div>

                    <Button type="submit" className="w-full" disabled={isLoading}>
                        {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Create Account
                    </Button>
                </form>

                <p className="text-center text-sm text-muted-foreground mt-6">
                    Already have an account?{' '}
                    <Link href={`/login${redirect !== '/dashboard' ? `?redirect=${redirect}` : ''}`} className="text-primary hover:underline">
                        Sign in
                    </Link>
                </p>

                <p className="text-center text-xs text-muted-foreground mt-4">
                    By creating an account, you agree to our{' '}
                    <Link href="/terms" className="underline">Terms of Service</Link>
                    {' '}and{' '}
                    <Link href="/privacy" className="underline">Privacy Policy</Link>
                </p>
            </div>
        </div>
    );
}

export default function RegisterPage() {
    return (
        <Suspense fallback={
            <div className="min-h-[80vh] flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin" />
            </div>
        }>
            <RegisterContent />
        </Suspense>
    );
}
