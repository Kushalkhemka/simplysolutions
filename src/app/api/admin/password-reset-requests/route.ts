import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Get all password reset requests (with filters)
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const status = searchParams.get('status');
        const page = parseInt(searchParams.get('page') || '1');
        const limit = parseInt(searchParams.get('limit') || '20');

        let query = supabase
            .from('password_reset_requests')
            .select(`
                id,
                order_id,
                username,
                communication_email,
                original_license_key_id,
                status,
                new_password,
                admin_notes,
                created_at,
                reviewed_at
            `, { count: 'exact' })
            .order('created_at', { ascending: false })
            .range((page - 1) * limit, page * limit - 1);

        if (status && status !== 'all') {
            query = query.eq('status', status);
        }

        const { data: requests, error, count } = await query;

        if (error) {
            console.error('Error fetching password reset requests:', error);
            return NextResponse.json(
                { error: 'Failed to fetch password reset requests' },
                { status: 500 }
            );
        }

        // Get current license key for each request
        const requestsWithKeys = await Promise.all(
            (requests || []).map(async (req) => {
                let currentLicenseKey = null;

                if (req.original_license_key_id) {
                    const { data } = await supabase
                        .from('amazon_activation_license_keys')
                        .select('license_key')
                        .eq('id', req.original_license_key_id)
                        .single();
                    currentLicenseKey = data?.license_key || null;
                }

                return {
                    ...req,
                    current_license_key: currentLicenseKey
                };
            })
        );

        // Get stats
        const { data: allRequests } = await supabase
            .from('password_reset_requests')
            .select('status');

        const statsData = allRequests || [];
        const stats = {
            pending: statsData.filter(r => r.status === 'PENDING').length,
            completed: statsData.filter(r => r.status === 'COMPLETED').length,
            rejected: statsData.filter(r => r.status === 'REJECTED').length,
            total: statsData.length
        };

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
        console.error('Admin password reset requests error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
