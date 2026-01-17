'use client';

import { Suspense, useState, useEffect } from 'react';
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

const loginSchema = z.object({
    email: z.string().email('Invalid email address'),
    password: z.string().min(6, 'Password must be at least 6 characters'),
});

type LoginForm = z.infer<typeof loginSchema>;

function LoginContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const redirect = searchParams.get('redirect') || '/dashboard';
    const verified = searchParams.get('verified');
    const message = searchParams.get('message');
    const error = searchParams.get('error');
    const { login, isLoading } = useAuthStore();
    const [showPassword, setShowPassword] = useState(false);

    // Show verification success or error message
    useEffect(() => {
        if (verified === 'true' && message) {
            toast.success(message);
        }
        if (error) {
            toast.error(error);
        }
    }, [verified, message, error]);

    const { register, handleSubmit, formState: { errors } } = useForm<LoginForm>({
        resolver: zodResolver(loginSchema),
    });

    const onSubmit = async (data: LoginForm) => {
        const result = await login(data.email, data.password);

        if (result.success) {
            toast.success('Welcome back!');
            router.push(redirect);
        } else {
            toast.error(result.error || 'Login failed');
        }
    };

    return (
        <div className="min-h-[80vh] flex items-center justify-center px-4">
            <div className="w-full max-w-md">
                <div className="text-center mb-8">
                    <h1 className="text-2xl font-bold">Welcome Back</h1>
                    <p className="text-muted-foreground mt-2">Sign in to your account</p>
                </div>

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
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

                    <div className="flex justify-end">
                        <Link href="/forgot-password" className="text-sm text-primary hover:underline">
                            Forgot password?
                        </Link>
                    </div>

                    <Button type="submit" className="w-full" disabled={isLoading}>
                        {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Sign In
                    </Button>
                </form>

                <p className="text-center text-sm text-muted-foreground mt-6">
                    Don&apos;t have an account?{' '}
                    <Link href={`/register${redirect !== '/dashboard' ? `?redirect=${redirect}` : ''}`} className="text-primary hover:underline">
                        Sign up
                    </Link>
                </p>
            </div>
        </div>
    );
}

export default function LoginPage() {
    return (
        <Suspense fallback={
            <div className="min-h-[80vh] flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin" />
            </div>
        }>
            <LoginContent />
        </Suspense>
    );
}
