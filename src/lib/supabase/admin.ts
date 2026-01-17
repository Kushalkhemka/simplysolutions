import { createClient } from '@supabase/supabase-js';

// Admin client with service role key - use only on server side
export function createAdminClient() {
    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
        throw new Error('SUPABASE_SERVICE_ROLE_KEY is not set');
    }

    return createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY,
        {
            auth: {
                autoRefreshToken: false,
                persistSession: false,
            },
        }
    );
}

// Singleton for admin client
let adminClient: ReturnType<typeof createAdminClient> | null = null;

export function getAdminClient() {
    if (typeof window !== 'undefined') {
        throw new Error('Admin client should only be used on the server side');
    }

    if (!adminClient) {
        adminClient = createAdminClient();
    }

    return adminClient;
}
