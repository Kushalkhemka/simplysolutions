import { createBrowserClient } from '@supabase/ssr';

export function createClient() {
    return createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            auth: {
                autoRefreshToken: true,
                persistSession: true,
            },
            cookieOptions: {
                // Extend cookie expiry to 30 days
                maxAge: 60 * 60 * 24 * 30, // 30 days in seconds
            },
        }
    );
}

// Singleton instance for browser
let browserClient: ReturnType<typeof createClient> | null = null;

export function getSupabaseClient() {
    if (typeof window === 'undefined') {
        throw new Error('getSupabaseClient should only be called on the client side');
    }

    if (!browserClient) {
        browserClient = createClient();
    }

    return browserClient;
}
