import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

const DEFAULT_DOMAIN = 'ms365.pro';

// Extract domain suffix from license key (format: "Username: user@domain | Password: ...")
function extractDomainFromLicenseKey(licenseKey: string | null): string {
    if (!licenseKey) return DEFAULT_DOMAIN;
    const usernameMatch = licenseKey.match(/Username\s*:\s*([^|]+)/i);
    if (usernameMatch) {
        const username = usernameMatch[1].trim();
        const atIndex = username.lastIndexOf('@');
        if (atIndex !== -1) {
            return username.substring(atIndex + 1);
        }
    }
    return DEFAULT_DOMAIN;
}

// GET: List all office365 customization requests
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const status = searchParams.get('status'); // 'pending' | 'fulfilled' | 'all'

        let query = supabase
            .from('office365_customizations')
            .select('*')
            .order('created_at', { ascending: false });

        if (status === 'pending') {
            query = query.eq('is_completed', false).eq('is_rejected', false);
        } else if (status === 'fulfilled') {
            query = query.eq('is_completed', true);
        } else if (status === 'rejected') {
            query = query.eq('is_rejected', true);
        }

        const { data: requests, error } = await query;

        if (error) {
            console.error('Error fetching office365 customizations:', error);
            return NextResponse.json(
                { error: 'Failed to fetch customization requests' },
                { status: 500 }
            );
        }

        // Batch lookup license keys to extract domain for each request
        // Chunk into batches to avoid Supabase URL length limits with .in()
        const orderIds = [...new Set((requests || []).map(r => r.order_id))];
        const domainMap: Record<string, string> = {};
        const BATCH_SIZE = 50;

        if (orderIds.length > 0) {
            // First: get license keys from amazon_orders (in chunks)
            for (let i = 0; i < orderIds.length; i += BATCH_SIZE) {
                const chunk = orderIds.slice(i, i + BATCH_SIZE);
                const { data: orders } = await supabase
                    .from('amazon_orders')
                    .select('order_id, license_key')
                    .in('order_id', chunk);

                if (orders) {
                    for (const o of orders) {
                        if (o.license_key) {
                            domainMap[o.order_id] = extractDomainFromLicenseKey(o.license_key);
                        }
                    }
                }
            }

            // Then: override with amazon_activation_license_keys (more authoritative, in chunks)
            for (let i = 0; i < orderIds.length; i += BATCH_SIZE) {
                const chunk = orderIds.slice(i, i + BATCH_SIZE);
                const { data: licenseKeys } = await supabase
                    .from('amazon_activation_license_keys')
                    .select('order_id, license_key')
                    .in('order_id', chunk);

                if (licenseKeys) {
                    for (const lk of licenseKeys) {
                        if (lk.license_key) {
                            domainMap[lk.order_id] = extractDomainFromLicenseKey(lk.license_key);
                        }
                    }
                }
            }

            console.log(`[O365 List] Domain lookup: ${orderIds.length} orders, ${Object.keys(domainMap).length} domains found. Sample:`, Object.entries(domainMap).slice(0, 3));
        }

        // Attach domain to each request
        const requestsWithDomain = (requests || []).map(r => ({
            ...r,
            domain: domainMap[r.order_id] || DEFAULT_DOMAIN
        }));

        // Get stats
        const { data: allRequests } = await supabase
            .from('office365_customizations')
            .select('is_completed, is_rejected');

        const stats = {
            pending: (allRequests || []).filter(r => !r.is_completed && !r.is_rejected).length,
            fulfilled: (allRequests || []).filter(r => r.is_completed).length,
            rejected: (allRequests || []).filter(r => r.is_rejected).length,
            total: (allRequests || []).length
        };

        return NextResponse.json({
            success: true,
            data: requestsWithDomain,
            stats
        });

    } catch (error) {
        console.error('Admin office365 customizations GET error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}

// DELETE: Bulk delete pending customization requests
export async function DELETE(request: NextRequest) {
    try {
        const body = await request.json();
        const { ids } = body;

        if (!ids || !Array.isArray(ids) || ids.length === 0) {
            return NextResponse.json(
                { error: 'No IDs provided' },
                { status: 400 }
            );
        }

        // Only delete non-fulfilled requests
        const { data: deleted, error } = await supabase
            .from('office365_customizations')
            .delete()
            .in('id', ids)
            .eq('is_completed', false)
            .select('id');

        if (error) {
            console.error('Error bulk deleting customizations:', error);
            return NextResponse.json(
                { error: 'Failed to delete requests' },
                { status: 500 }
            );
        }

        return NextResponse.json({
            success: true,
            deletedCount: deleted?.length || 0,
            message: `${deleted?.length || 0} request(s) deleted`
        });

    } catch (error) {
        console.error('Admin office365 customizations DELETE error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
