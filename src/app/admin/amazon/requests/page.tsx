import { createAdminClient } from '@/lib/supabase/admin';
import RequestsClient from './RequestsClient';

export default async function ProductRequestsPage() {
    const supabase = createAdminClient();

    // Fetch product requests
    const { data: requests, count } = await supabase
        .from('product_requests')
        .select('*', { count: 'exact' })
        .order('created_at', { ascending: false })
        .limit(500);

    return (
        <RequestsClient
            requests={requests || []}
            totalCount={count || 0}
        />
    );
}
