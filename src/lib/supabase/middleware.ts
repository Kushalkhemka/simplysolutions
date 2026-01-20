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
        if (!user) {
            const url = request.nextUrl.clone();
            url.pathname = '/login';
            url.searchParams.set('redirect', path);
            return NextResponse.redirect(url);
        }

        // Check admin role - use untyped query to avoid type issues
        const { data: profile } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', user.id)
            .single();

        const role = (profile as { role?: string } | null)?.role;
        if (!role || !['admin', 'super_admin'].includes(role)) {
            const url = request.nextUrl.clone();
            url.pathname = '/';
            return NextResponse.redirect(url);
        }
    }

    return supabaseResponse;
}
