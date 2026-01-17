import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
    const { searchParams, origin } = new URL(request.url);
    const code = searchParams.get('code');
    const token_hash = searchParams.get('token_hash');
    const type = searchParams.get('type');
    const next = searchParams.get('next') ?? '/';
    const error = searchParams.get('error');
    const error_description = searchParams.get('error_description');

    // Handle errors from Supabase
    if (error) {
        console.error('Auth callback error:', error, error_description);
        return NextResponse.redirect(
            `${origin}/login?error=${encodeURIComponent(error_description || error)}`
        );
    }

    const supabase = await createClient();

    // Handle token hash (from email verification links)
    if (token_hash && type) {
        const { error: verifyError } = await supabase.auth.verifyOtp({
            token_hash,
            type: type as 'signup' | 'recovery' | 'invite' | 'email',
        });

        if (verifyError) {
            console.error('Token verification error:', verifyError);
            return NextResponse.redirect(
                `${origin}/login?error=${encodeURIComponent('Verification failed. Please try again.')}`
            );
        }

        // For signup verification, redirect to login with success message
        if (type === 'signup' || type === 'email') {
            return NextResponse.redirect(
                `${origin}/login?verified=true&message=${encodeURIComponent('Email verified successfully! Please log in.')}`
            );
        }

        // For password recovery, redirect to reset password page
        if (type === 'recovery') {
            return NextResponse.redirect(`${origin}/reset-password`);
        }
    }

    // Handle OAuth code exchange
    if (code) {
        const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);

        if (exchangeError) {
            console.error('Code exchange error:', exchangeError);
            return NextResponse.redirect(
                `${origin}/login?error=${encodeURIComponent('Authentication failed. Please try again.')}`
            );
        }

        return NextResponse.redirect(`${origin}${next}`);
    }

    // No valid parameters
    return NextResponse.redirect(`${origin}/login`);
}
