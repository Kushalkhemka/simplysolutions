import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

// Check admin helper
async function checkAdmin() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();

    return (profile?.role === 'admin' || profile?.role === 'super_admin') ? user : null;
}

// GET /api/admin/products-data - List all products_data
export async function GET() {
    try {
        const admin = await checkAdmin();
        if (!admin) {
            return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
        }

        const adminClient = createAdminClient();
        const { data, error } = await adminClient
            .from('products_data')
            .select('*')
            .order('product_title', { ascending: true });

        if (error) {
            return NextResponse.json({ success: false, error: 'Failed to fetch products' }, { status: 500 });
        }

        return NextResponse.json({ success: true, data: data || [] });
    } catch (error) {
        console.error('Fetch products_data error:', error);
        return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
    }
}

// POST /api/admin/products-data - Create new product in products_data
export async function POST(request: NextRequest) {
    try {
        const admin = await checkAdmin();
        if (!admin) {
            return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const { fsn, product_title, download_link, product_image, installation_doc } = body;

        if (!fsn?.trim() || !product_title?.trim()) {
            return NextResponse.json({ success: false, error: 'FSN and Product Title are required' }, { status: 400 });
        }

        const adminClient = createAdminClient();
        const { data, error } = await adminClient
            .from('products_data')
            .insert({
                fsn: fsn.trim(),
                product_title: product_title.trim(),
                download_link: download_link?.trim() || null,
                product_image: product_image?.trim() || null,
                installation_doc: installation_doc?.trim() || null,
            })
            .select()
            .single();

        if (error) {
            console.error('Create product_data error:', error);
            return NextResponse.json({ success: false, error: error.message || 'Failed to add product' }, { status: 500 });
        }

        return NextResponse.json({ success: true, data });
    } catch (error) {
        console.error('Create products_data error:', error);
        return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
    }
}

// PUT /api/admin/products-data - Update a product in products_data
export async function PUT(request: NextRequest) {
    try {
        const admin = await checkAdmin();
        if (!admin) {
            return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const { id, fsn, product_title, download_link, product_image, installation_doc } = body;

        if (!id) {
            return NextResponse.json({ success: false, error: 'Product ID is required' }, { status: 400 });
        }

        const adminClient = createAdminClient();
        const { data, error } = await adminClient
            .from('products_data')
            .update({
                fsn,
                product_title,
                download_link: download_link || null,
                product_image: product_image || null,
                installation_doc: installation_doc || null,
            })
            .eq('id', id)
            .select()
            .single();

        if (error) {
            console.error('Update product_data error:', error);
            return NextResponse.json({ success: false, error: error.message || 'Failed to update product' }, { status: 500 });
        }

        return NextResponse.json({ success: true, data });
    } catch (error) {
        console.error('Update products_data error:', error);
        return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
    }
}

// DELETE /api/admin/products-data - Delete a product from products_data
export async function DELETE(request: NextRequest) {
    try {
        const admin = await checkAdmin();
        if (!admin) {
            return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');

        if (!id) {
            return NextResponse.json({ success: false, error: 'Product ID is required' }, { status: 400 });
        }

        const adminClient = createAdminClient();
        const { error } = await adminClient
            .from('products_data')
            .delete()
            .eq('id', id);

        if (error) {
            console.error('Delete product_data error:', error);
            return NextResponse.json({ success: false, error: 'Failed to delete product' }, { status: 500 });
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Delete products_data error:', error);
        return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
    }
}
