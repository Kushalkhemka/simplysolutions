import { NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { successResponse, errorResponse } from '@/lib/utils/api-response';
import { registerSchema } from '@/lib/utils/validation';
import { sendVerificationEmail } from '@/lib/email';
import { createServerClient } from '@supabase/ssr';

// Create admin client with service role key for user management
function createAdminClient() {
    return createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!,
        {
            cookies: {
                getAll: () => [],
                setAll: () => { },
            },
        }
    );
}

// POST /api/auth/register - Register new user
export async function POST(request: NextRequest) {
    try {
        const supabase = await createClient();
        const adminSupabase = createAdminClient();
        const body = await request.json();

        const parsed = registerSchema.safeParse(body);
        if (!parsed.success) {
            return errorResponse('Invalid registration data', 400);
        }

        const { email, password, fullName, referralCode } = parsed.data;

        // Use Admin API to create user - this NEVER sends emails
        const { data: userData, error: createError } = await adminSupabase.auth.admin.createUser({
            email,
            password,
            email_confirm: false, // User must verify via our email
            user_metadata: {
                full_name: fullName,
            },
        });

        if (createError) {
            console.error('User creation error:', createError);

            // Check for duplicate user
            if (createError.message.includes('already been registered') ||
                createError.message.includes('already exists')) {
                return errorResponse('An account with this email already exists', 400);
            }

            return errorResponse(createError.message, 400);
        }

        if (!userData?.user) {
            return errorResponse('Failed to create user', 500);
        }

        // Generate a verification link using Admin API
        const { data: linkData, error: linkError } = await adminSupabase.auth.admin.generateLink({
            type: 'signup',
            email: email,
            password: password,
            options: {
                redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/login?verified=true`,
            },
        });

        if (linkError) {
            console.error('Failed to generate verification link:', linkError);
            // User was created but we couldn't generate link - still return success
        } else if (linkData?.properties?.action_link) {
            // Transform Supabase's link to use our callback route
            // Supabase link format: https://supabase-url/auth/v1/verify?token=xxx&type=signup&redirect_to=...
            // We need to extract token and type, then create our own URL
            const supabaseUrl = new URL(linkData.properties.action_link);
            const token = supabaseUrl.searchParams.get('token');
            const tokenType = supabaseUrl.searchParams.get('type');

            // Create a verification URL that goes through our app's callback
            const verificationUrl = `${process.env.NEXT_PUBLIC_APP_URL}/auth/callback?token_hash=${token}&type=${tokenType}`;

            // Send verification email via Resend
            const emailResult = await sendVerificationEmail({
                to: email,
                customerName: fullName,
                verificationUrl: verificationUrl,
            });

            if (!emailResult.success) {
                console.error('Failed to send verification email via Resend:', emailResult.error);
            } else {
                console.log('Verification email sent successfully to:', email);
            }
        }

        // If referred, update the referral
        if (referralCode && userData.user) {
            const { data: referrer } = await supabase
                .from('profiles')
                .select('id')
                .eq('referral_code', referralCode)
                .single();

            if (referrer) {
                await adminSupabase
                    .from('profiles')
                    .update({ referred_by: referrer.id })
                    .eq('id', userData.user.id);
            }
        }

        return successResponse({
            message: 'Registration successful. Please check your email to verify your account.',
            user: {
                id: userData.user.id,
                email: userData.user.email,
            },
        });
    } catch (error) {
        console.error('Register API error:', error);
        return errorResponse('Internal server error', 500);
    }
}
