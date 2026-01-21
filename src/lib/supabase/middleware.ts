import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function updateSession(request: NextRequest) {
    let supabaseResponse = NextResponse.next({
        request,
    });

    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            auth: {
                autoRefreshToken: true,
                persistSession: true,
            },
            cookies: {
                getAll() {
                    return request.cookies.getAll();
                },
                setAll(cookiesToSet) {
                    cookiesToSet.forEach(({ name, value }) =>
                        request.cookies.set(name, value)
                    );
                    supabaseResponse = NextResponse.next({
                        request,
                    });
                    cookiesToSet.forEach(({ name, value, options }) =>
                        supabaseResponse.cookies.set(name, value, {
                            ...options,
                            // Extend cookie expiry to 30 days
                            maxAge: 60 * 60 * 24 * 30, // 30 days in seconds
                        })
                    );
                },
            },
        }
    );

    // Refresh session if expired
    const {
        data: { user },
    } = await supabase.auth.getUser();

    // Protected routes check
    const protectedPaths = ['/dashboard', '/orders', '/profile', '/licenses', '/checkout'];
    const adminPaths = ['/admin'];
    const authPaths = ['/login', '/register'];

    const path = request.nextUrl.pathname;

    // Redirect to login if accessing protected route without auth
    if (protectedPaths.some(p => path.startsWith(p)) && !user) {
        const url = request.nextUrl.clone();
        url.pathname = '/login';
        url.searchParams.set('redirect', path);
        return NextResponse.redirect(url);
    }

    // Redirect away from auth pages if already logged in
    if (authPaths.some(p => path.startsWith(p)) && user) {
        const redirect = request.nextUrl.searchParams.get('redirect') || '/dashboard';
        const url = request.nextUrl.clone();
        url.pathname = redirect;
        url.searchParams.delete('redirect');
        return NextResponse.redirect(url);
    }

    // Admin routes - check for admin role
    if (adminPaths.some(p => path.startsWith(p))) {
        console.log('[Middleware] Admin path detected:', path);
        console.log('[Middleware] User:', user?.id, user?.email);

        if (!user) {
            console.log('[Middleware] No user, redirecting to login');
            const url = request.nextUrl.clone();
            url.pathname = '/login';
            url.searchParams.set('redirect', path);
            return NextResponse.redirect(url);
        }

        // Check admin role using service role to bypass RLS
        // This is necessary because RLS only allows users to see their own profile
        // but the middleware needs to verify the role
        let role: string | null = null;

        try {
            // Use service role key to bypass RLS
            const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
            console.log('[Middleware] Service role key exists:', !!serviceRoleKey);

            if (serviceRoleKey) {
                const fetchUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/profiles?id=eq.${user.id}&select=role`;
                console.log('[Middleware] Fetching:', fetchUrl);

                const response = await fetch(fetchUrl, {
                    headers: {
                        'apikey': serviceRoleKey,
                        'Authorization': `Bearer ${serviceRoleKey}`,
                        'Content-Type': 'application/json',
                    },
                });

                console.log('[Middleware] Fetch response status:', response.status);

                if (response.ok) {
                    const profiles = await response.json();
                    console.log('[Middleware] Profiles result:', profiles);
                    if (profiles && profiles.length > 0) {
                        role = profiles[0].role;
                    }
                } else {
                    const errorText = await response.text();
                    console.log('[Middleware] Fetch error:', errorText);
                }
            }

            // Fallback to regular client if service role didn't work
            if (!role) {
                console.log('[Middleware] Using fallback supabase client');
                const { data: profile, error } = await supabase
                    .from('profiles')
                    .select('role')
                    .eq('id', user.id)
                    .single();
                console.log('[Middleware] Fallback result:', profile, 'Error:', error);
                role = (profile as { role?: string } | null)?.role || null;
            }
        } catch (error) {
            console.error('[Middleware] Error checking admin role:', error);
        }

        console.log('[Middleware] Final role:', role);

        if (!role || !['admin', 'super_admin'].includes(role)) {
            console.log('[Middleware] Access denied, role not in allowed list');
            const url = request.nextUrl.clone();
            url.pathname = '/';
            return NextResponse.redirect(url);
        }

        console.log('[Middleware] Access granted!');
    }

    return supabaseResponse;
}
