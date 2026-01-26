import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET() {
    try {
        const supabase = await createClient();

        const columnChecks: any = {};

        // Check products table columns
        try {
            const { data: products, error } = await supabase
                .from('products')
                .select('slug, category_id, is_active, is_featured')
                .limit(1);

            columnChecks.products = error ? { error: error.message } : { verified: Object.keys(products?.[0] || {}) };
        } catch (e: any) {
            columnChecks.products = { error: e.message };
        }

        // Check orders table columns
        try {
            const { data: orders, error } = await supabase
                .from('orders')
                .select('user_id, status, created_at')
                .limit(1);

            columnChecks.orders = error ? { error: error.message } : { verified: Object.keys(orders?.[0] || {}) };
        } catch (e: any) {
            columnChecks.orders = { error: e.message };
        }

        // Check warranty_registrations table columns
        try {
            const { data: warranty, error } = await supabase
                .from('warranty_registrations')
                .select('status, order_id, created_at')
                .limit(1);

            columnChecks.warranty_registrations = error ? { error: error.message } : { verified: Object.keys(warranty?.[0] || {}) };
        } catch (e: any) {
            columnChecks.warranty_registrations = { error: e.message };
        }

        return NextResponse.json({ columnChecks });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
