import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
);

export async function POST(request: Request) {
    try {
        const { email, token, newPassword } = await request.json();

        if (!email || !token || !newPassword) {
            return NextResponse.json(
                { error: 'Email, token, and new password are required' },
                { status: 400 }
            );
        }

        if (newPassword.length < 8) {
            return NextResponse.json(
                { error: 'Password must be at least 8 characters' },
                { status: 400 }
            );
        }

        // Find user by email
        const { data: users, error: fetchError } = await supabaseAdmin.auth.admin.listUsers();

        if (fetchError) {
            console.error('Error fetching users:', fetchError);
            return NextResponse.json(
                { error: 'Failed to process request' },
                { status: 500 }
            );
        }

        const user = users.users.find(u => u.email?.toLowerCase() === email.toLowerCase());

        if (!user) {
            return NextResponse.json(
                { error: 'Invalid or expired reset link' },
                { status: 400 }
            );
        }

        // Verify token
        const storedToken = user.user_metadata?.reset_token;
        const tokenExpiry = user.user_metadata?.reset_token_expiry;

        if (!storedToken || storedToken !== token) {
            return NextResponse.json(
                { error: 'Invalid or expired reset link' },
                { status: 400 }
            );
        }

        if (tokenExpiry && new Date(tokenExpiry) < new Date()) {
            return NextResponse.json(
                { error: 'Reset link has expired. Please request a new one.' },
                { status: 400 }
            );
        }

        // Update password and clear reset token
        const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
            user.id,
            {
                password: newPassword,
                user_metadata: {
                    ...user.user_metadata,
                    reset_token: null,
                    reset_token_expiry: null,
                }
            }
        );

        if (updateError) {
            console.error('Error updating password:', updateError);
            return NextResponse.json(
                { error: 'Failed to update password' },
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
