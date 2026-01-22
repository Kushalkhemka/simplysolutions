import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Get all replacement requests (with filters)
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const status = searchParams.get('status');
        const page = parseInt(searchParams.get('page') || '1');
        const limit = parseInt(searchParams.get('limit') || '20');

        let query = supabase
            .from('license_replacement_requests')
            .select(`
                id,
                order_id,
                customer_email,
                fsn,
                screenshot_url,
                status,
                admin_notes,
                created_at,
                reviewed_at,
                original_license_key_id,
                new_license_key_id
            `, { count: 'exact' })
            .order('created_at', { ascending: false })
            .range((page - 1) * limit, page * limit - 1);

        if (status && status !== 'all') {
            query = query.eq('status', status);
        }

        const { data: requests, error, count } = await query;

        if (error) {
            console.error('Error fetching replacement requests:', error);
            return NextResponse.json(
                { error: 'Failed to fetch replacement requests' },
                { status: 500 }
            );
        }

        // Get license key details for requests
        const requestsWithKeys = await Promise.all(
            (requests || []).map(async (req) => {
                let originalKey = null;
                let newKey = null;

                if (req.original_license_key_id) {
                    const { data } = await supabase
                        .from('amazon_activation_license_keys')
                        .select('license_key, fsn')
                        .eq('id', req.original_license_key_id)
                        .single();
                    originalKey = data?.license_key;
                }

                if (req.new_license_key_id) {
                    const { data } = await supabase
                        .from('amazon_activation_license_keys')
                        .select('license_key, fsn')
                        .eq('id', req.new_license_key_id)
                        .single();
                    newKey = data?.license_key;
                }

                return {
                    ...req,
                    original_license_key: originalKey,
                    new_license_key: newKey
                };
            })
        );

        // Get stats
        const { data: stats } = await supabase
            .from('license_replacement_requests')
            .select('status')
            .then(result => {
                const data = result.data || [];
                return {
                    data: {
                        pending: data.filter(r => r.status === 'PENDING').length,
                        approved: data.filter(r => r.status === 'APPROVED').length,
                        rejected: data.filter(r => r.status === 'REJECTED').length,
                        total: data.length
                    }
                };
            });

        return NextResponse.json({
            success: true,
            data: requestsWithKeys,
            pagination: {
                page,
                limit,
                total: count || 0,
                totalPages: Math.ceil((count || 0) / limit)
            },
            stats
        });

    } catch (error) {
        console.error('Admin replacement requests error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
