import { NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { successResponse, errorResponse } from '@/lib/utils/api-response';
import { loginSchema } from '@/lib/utils/validation';

// POST /api/auth/login - Login user
export async function POST(request: NextRequest) {
    try {
        const supabase = await createClient();
        const body = await request.json();

        const parsed = loginSchema.safeParse(body);
        if (!parsed.success) {
            return errorResponse('Invalid email or password', 400);
        }

        const { email, password } = parsed.data;

        const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password,
        });

        if (error) {
            console.error('Login error:', error);
            return errorResponse('Invalid email or password', 401);
        }

        // Update last login
        if (data.user) {
            await supabase
                .from('profiles')
                .update({ last_login_at: new Date().toISOString() })
                .eq('id', data.user.id);
        }

        return successResponse({
            message: 'Login successful',
            user: {
                id: data.user.id,
                email: data.user.email,
            },
        });
    } catch (error) {
        console.error('Login API error:', error);
        return errorResponse('Internal server error', 500);
    }
}
