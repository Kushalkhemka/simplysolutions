import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

async function checkAdmin() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return false;
    const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();
    return profile?.role === 'admin' || profile?.role === 'super_admin';
}

// GET - fetch all ASIN mappings
export async function GET() {
    if (!(await checkAdmin())) {
        return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }
    const adminClient = createAdminClient();
    const { data, error } = await adminClient
        .from('amazon_asin_mapping')
        .select('*')
        .order('fsn', { ascending: true });

    if (error) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
    return NextResponse.json({ success: true, data });
}

// POST - create a new ASIN mapping (auto-fetches product title from products_data)
export async function POST(request: NextRequest) {
    if (!(await checkAdmin())) {
        return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }
    const body = await request.json();
    const { asin, fsn, product_title } = body;

    if (!asin?.trim() || !fsn?.trim()) {
        return NextResponse.json({ success: false, error: 'ASIN and FSN are required' }, { status: 400 });
    }

    const adminClient = createAdminClient();

    // Auto-fetch product title from products_data if not provided
    let resolvedTitle = product_title?.trim() || null;
    if (!resolvedTitle) {
        const { data: product } = await adminClient
            .from('products_data')
            .select('product_title')
            .eq('fsn', fsn.trim())
            .single();
        if (product) {
            resolvedTitle = product.product_title;
        }
    }

    const { data, error } = await adminClient
        .from('amazon_asin_mapping')
        .insert({
            asin: asin.trim(),
            fsn: fsn.trim(),
            product_title: resolvedTitle,
        })
        .select()
        .single();

    if (error) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
    return NextResponse.json({ success: true, data });
}

// PUT - update an existing ASIN mapping
export async function PUT(request: NextRequest) {
    if (!(await checkAdmin())) {
        return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }
    const body = await request.json();
    const { id, asin, fsn, product_title } = body;

    if (!id) {
        return NextResponse.json({ success: false, error: 'ID is required' }, { status: 400 });
    }

    const adminClient = createAdminClient();

    // Auto-fetch product title from products_data if not provided
    let resolvedTitle = product_title?.trim() || null;
    if (!resolvedTitle && fsn) {
        const { data: product } = await adminClient
            .from('products_data')
            .select('product_title')
            .eq('fsn', fsn.trim())
            .single();
        if (product) {
            resolvedTitle = product.product_title;
        }
    }

    const { error } = await adminClient
        .from('amazon_asin_mapping')
        .update({
            asin: asin,
            fsn: fsn,
            product_title: resolvedTitle,
        })
        .eq('id', id);

    if (error) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
    return NextResponse.json({ success: true });
}

// DELETE - delete an ASIN mapping
export async function DELETE(request: NextRequest) {
    if (!(await checkAdmin())) {
        return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
        return NextResponse.json({ success: false, error: 'ID is required' }, { status: 400 });
    }

    const adminClient = createAdminClient();
    const { error } = await adminClient
        .from('amazon_asin_mapping')
        .delete()
        .eq('id', id);

    if (error) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
    return NextResponse.json({ success: true });
}
