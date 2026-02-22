import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const period = searchParams.get('period') || '7d'; // today, yesterday, 7d, 30d

        // Calculate date range
        const now = new Date();
        let startDate: Date;
        let endDate: Date = new Date(now);
        let groupByHour = false;

        switch (period) {
            case 'today':
                startDate = new Date(now);
                startDate.setHours(0, 0, 0, 0);
                groupByHour = true;
                break;
            case 'yesterday':
                startDate = new Date(now);
                startDate.setDate(startDate.getDate() - 1);
                startDate.setHours(0, 0, 0, 0);
                endDate = new Date(now);
                endDate.setHours(0, 0, 0, 0);
                groupByHour = true;
                break;
            case '7d':
                startDate = new Date(now);
                startDate.setDate(startDate.getDate() - 7);
                startDate.setHours(0, 0, 0, 0);
                break;
            case '30d':
                startDate = new Date(now);
                startDate.setDate(startDate.getDate() - 30);
                startDate.setHours(0, 0, 0, 0);
                break;
            default:
                startDate = new Date(now);
                startDate.setDate(startDate.getDate() - 7);
                startDate.setHours(0, 0, 0, 0);
        }

        // Fetch all orders in the period
        const { data: orders, error } = await supabase
            .from('amazon_orders')
            .select('created_at, fulfillment_type, license_key_id')
            .gte('created_at', startDate.toISOString())
            .lte('created_at', endDate.toISOString())
            .order('created_at', { ascending: true });

        // Fetch keys added in the period
        const { data: keysAddedData } = await supabase
            .from('amazon_activation_license_keys')
            .select('created_at')
            .gte('created_at', startDate.toISOString())
            .lte('created_at', endDate.toISOString())
            .order('created_at', { ascending: true });

        if (error) {
            console.error('Chart data fetch error:', error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        // Aggregate data by time bucket
        const buckets: Record<string, {
            mfn: number;
            fba: number;
            keysAdded: number;
            total: number;
            keysRedeemed: number;
        }> = {};

        // Initialize all buckets for the period
        if (groupByHour) {
            // Hourly buckets
            const hours = period === 'today' ? 24 : 24;
            for (let h = 0; h < hours; h++) {
                const key = `${h.toString().padStart(2, '0')}:00`;
                buckets[key] = { mfn: 0, fba: 0, keysAdded: 0, total: 0, keysRedeemed: 0 };
            }
        } else {
            // Daily buckets
            const dayCount = period === '30d' ? 30 : 7;
            for (let d = dayCount; d >= 0; d--) {
                const date = new Date(now);
                date.setDate(date.getDate() - d);
                const key = date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });
                buckets[key] = { mfn: 0, fba: 0, keysAdded: 0, total: 0, keysRedeemed: 0 };
            }
        }

        // Populate buckets
        (orders || []).forEach((order: any) => {
            const orderDate = new Date(order.created_at);
            let key: string;

            if (groupByHour) {
                key = `${orderDate.getHours().toString().padStart(2, '0')}:00`;
            } else {
                key = orderDate.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });
            }

            if (!buckets[key]) {
                buckets[key] = { mfn: 0, fba: 0, keysAdded: 0, total: 0, keysRedeemed: 0 };
            }

            buckets[key].total++;

            switch (order.fulfillment_type) {
                case 'amazon_mfn':
                    buckets[key].mfn++;
                    break;
                case 'amazon_fba':
                    buckets[key].fba++;
                    break;
                default:
                    // Count unknown types in total only
                    break;
            }

            if (order.license_key_id) {
                buckets[key].keysRedeemed++;
            }
        });

        // Populate keys added buckets
        (keysAddedData || []).forEach((keyItem: any) => {
            const keyDate = new Date(keyItem.created_at);
            let key: string;

            if (groupByHour) {
                key = `${keyDate.getHours().toString().padStart(2, '0')}:00`;
            } else {
                key = keyDate.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });
            }

            if (buckets[key]) {
                buckets[key].keysAdded++;
            }
        });

        // Convert to array
        const chartData = Object.entries(buckets).map(([label, data]) => ({
            label,
            ...data,
        }));

        // Summary stats
        const totalOrders = (orders || []).length;
        const mfnTotal = (orders || []).filter((o: any) => o.fulfillment_type === 'amazon_mfn').length;
        const fbaTotal = (orders || []).filter((o: any) => o.fulfillment_type === 'amazon_fba').length;
        const keysAddedTotal = (keysAddedData || []).length;
        const keysRedeemedTotal = (orders || []).filter((o: any) => o.license_key_id).length;

        return NextResponse.json({
            chartData,
            summary: {
                totalOrders,
                mfn: mfnTotal,
                fba: fbaTotal,
                keysAdded: keysAddedTotal,
                keysRedeemed: keysRedeemedTotal,
            },
            period,
        });

    } catch (error: any) {
        console.error('Chart data error:', error);
        return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
    }
}
