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

    // For 365e5 requests, fetch additional data from office365_requests
    const requestsWithNames = await Promise.all(
        (requests || []).map(async (req) => {
            // If it's a 365e5 request and doesn't have name data, fetch from office365_requests
            if (req.request_type === '365e5') {
                const { data: office365Data } = await supabase
                    .from('office365_requests')
                    .select('first_name, last_name, username_prefix, generated_email, generated_password')
                    .eq('order_id', req.order_id)
                    .single();

                if (office365Data) {
                    return {
                        ...req,
                        first_name: req.first_name || office365Data.first_name,
                        last_name: req.last_name || office365Data.last_name,
                        username_prefix: req.username_prefix || office365Data.username_prefix,
                        generated_email: office365Data.generated_email || null,
                        generated_password: office365Data.generated_password || null,
                    };
                }
            }
            return req;
        })
    );

    return (
        <RequestsClient
            requests={requestsWithNames}
            totalCount={count || 0}
        />
    );
}
