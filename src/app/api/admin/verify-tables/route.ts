import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET() {
    try {
        const supabase = await createClient();

        const tables = [
            'products_data',
            'amazon_orders',
            'amazon_asin_mapping',
            'amazon_activation_license_keys',
            'getcid_usage',
            'warranty_registrations',
            'product_requests'
        ];

        const results: any = {};

        for (const tableName of tables) {
            try {
                const { data, error } = await supabase
                    .from(tableName)
                    .select('*')
                    .limit(1);

                if (error) {
                    results[tableName] = { exists: false, error: error.message };
                } else {
                    results[tableName] = {
                        exists: true,
                        sampleColumns: data && data.length > 0 ? Object.keys(data[0]) : []
                    };
                }
            } catch (e: any) {
                results[tableName] = { exists: false, error: e.message };
            }
        }

        return NextResponse.json(results);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
