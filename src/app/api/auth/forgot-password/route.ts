import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { sendPasswordResetEmail } from '@/lib/email';
import crypto from 'crypto';

const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
);

export async function POST(request: Request) {
    try {
        const { email } = await request.json();

        if (!email) {
            return NextResponse.json(
                { error: 'Email is required' },
                { status: 400 }
            );
        }

        // Check if user exists
        const { data: users, error: fetchError } = await supabaseAdmin.auth.admin.listUsers();

        if (fetchError) {
            console.error('Error fetching users:', fetchError);
            // Don't reveal if user exists or not
            return NextResponse.json({ success: true });
        }

        const user = users.users.find(u => u.email?.toLowerCase() === email.toLowerCase());

        if (!user) {
            // Don't reveal if user exists - return success anyway for security
            return NextResponse.json({ success: true });
        }

        // Generate a secure reset token
        const resetToken = crypto.randomBytes(32).toString('hex');
        const resetTokenExpiry = new Date(Date.now() + 3600000); // 1 hour from now

        // Store the reset token in user's metadata
        const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
            user.id,
            {
                user_metadata: {
                    ...user.user_metadata,
                    reset_token: resetToken,
                    reset_token_expiry: resetTokenExpiry.toISOString(),
                }
            }
        );

        if (updateError) {
            console.error('Error storing reset token:', updateError);
            return NextResponse.json(
                { error: 'Failed to process request' },
                { status: 500 }
            );
        }

        // Build reset URL
        const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://simplysolutions.co.in';
        const resetUrl = `${baseUrl}/reset-password?token=${resetToken}&email=${encodeURIComponent(email)}`;

        // Send reset email via Resend
        const emailResult = await sendPasswordResetEmail({
            to: email,
            customerName: user.user_metadata?.full_name || user.email?.split('@')[0] || 'Customer',
            resetUrl,
        });

        if (!emailResult.success) {
            console.error('Failed to send password reset email:', emailResult.error);
            return NextResponse.json(
                { error: 'Failed to send reset email' },
                { status: 500 }
            );
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Password reset error:', error);
        return NextResponse.json(
            { error: 'An unexpected error occurred' },
            { status: 500 }
        );
    }
}
