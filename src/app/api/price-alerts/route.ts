import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

// GET /api/price-alerts - Get user's price alerts
export async function GET(request: NextRequest) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
        }

        const { data: alerts, error } = await supabase
            .from('price_alerts')
            .select(`
                *,
                product:products(id, name, slug, price, main_image_url)
            `)
            .eq('user_id', user.id)
            .eq('is_active', true)
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Error fetching price alerts:', error);
            return NextResponse.json({ success: false, error: 'Failed to fetch alerts' }, { status: 500 });
        }

        return NextResponse.json({ success: true, data: alerts });
    } catch (error) {
        console.error('Price alerts GET error:', error);
        return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
    }
}

// POST /api/price-alerts - Create a price alert
export async function POST(request: NextRequest) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const { productId, targetPrice } = body;

        if (!productId) {
            return NextResponse.json({ success: false, error: 'Product ID is required' }, { status: 400 });
        }

        const adminClient = createAdminClient();

        // Get current product price
        const { data: product } = await adminClient
            .from('products')
            .select('price')
            .eq('id', productId)
            .single();

        if (!product) {
            return NextResponse.json({ success: false, error: 'Product not found' }, { status: 404 });
        }

        // Check if alert already exists
        const { data: existing } = await adminClient
            .from('price_alerts')
            .select('id')
            .eq('user_id', user.id)
            .eq('product_id', productId)
            .eq('is_active', true)
            .single();

        if (existing) {
            return NextResponse.json({ success: false, error: 'Alert already exists for this product' }, { status: 400 });
        }

        const { data: alert, error } = await adminClient
            .from('price_alerts')
            .insert({
                user_id: user.id,
                product_id: productId,
                target_price: targetPrice || null,
                current_price: product.price,
                is_active: true,
            })
            .select()
            .single();

        if (error) {
            console.error('Error creating price alert:', error);
            return NextResponse.json({ success: false, error: 'Failed to create alert' }, { status: 500 });
        }

        return NextResponse.json({ success: true, data: alert });
    } catch (error) {
        console.error('Price alerts POST error:', error);
        return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
    }
}

// DELETE /api/price-alerts - Remove a price alert
export async function DELETE(request: NextRequest) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const alertId = searchParams.get('id');

        if (!alertId) {
            return NextResponse.json({ success: false, error: 'Alert ID is required' }, { status: 400 });
        }

        const adminClient = createAdminClient();

        const { error } = await adminClient
            .from('price_alerts')
            .update({ is_active: false })
            .eq('id', alertId)
            .eq('user_id', user.id);

        if (error) {
            console.error('Error deleting price alert:', error);
            return NextResponse.json({ success: false, error: 'Failed to delete alert' }, { status: 500 });
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Price alerts DELETE error:', error);
        return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
    }
}
