import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

// POST /api/admin/upload-guide - Upload installation guide PDF
export async function POST(request: NextRequest) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
        }

        // Check if admin
        const { data: profile } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', user.id)
            .single();

        if (profile?.role !== 'admin' && profile?.role !== 'super_admin') {
            return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
        }

        const formData = await request.formData();
        const file = formData.get('file') as File | null;
        const productId = formData.get('productId') as string | null;

        if (!file) {
            return NextResponse.json({ success: false, error: 'No file provided' }, { status: 400 });
        }

        if (!productId) {
            return NextResponse.json({ success: false, error: 'No product ID provided' }, { status: 400 });
        }

        // Validate file type
        const allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
        if (!allowedTypes.includes(file.type)) {
            return NextResponse.json({ success: false, error: 'Only PDF and DOC files are allowed' }, { status: 400 });
        }

        // Max file size: 10MB
        const maxSize = 10 * 1024 * 1024;
        if (file.size > maxSize) {
            return NextResponse.json({ success: false, error: 'File size must be less than 10MB' }, { status: 400 });
        }

        const adminClient = createAdminClient();

        // Generate unique filename
        const ext = file.name.split('.').pop();
        const fileName = `${productId}-${Date.now()}.${ext}`;
        const filePath = `installation-guides/${fileName}`;

        // Convert file to buffer
        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);

        // Upload to Supabase Storage
        const { data: uploadData, error: uploadError } = await adminClient.storage
            .from('product-assets')
            .upload(filePath, buffer, {
                contentType: file.type,
                upsert: true,
            });

        if (uploadError) {
            console.error('Upload error:', uploadError);
            return NextResponse.json({ success: false, error: 'Failed to upload file' }, { status: 500 });
        }

        // Get public URL
        const { data: urlData } = adminClient.storage
            .from('product-assets')
            .getPublicUrl(filePath);

        const guideUrl = urlData.publicUrl;

        // Update product with guide URL
        const { error: updateError } = await adminClient
            .from('products')
            .update({ installation_guide_url: guideUrl })
            .eq('id', productId);

        if (updateError) {
            console.error('Update error:', updateError);
            return NextResponse.json({ success: false, error: 'Failed to update product' }, { status: 500 });
        }

        return NextResponse.json({
            success: true,
            data: {
                url: guideUrl,
                fileName: file.name,
            },
        });
    } catch (error) {
        console.error('Upload guide error:', error);
        return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
    }
}

// DELETE /api/admin/upload-guide - Remove installation guide
export async function DELETE(request: NextRequest) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
        }

        // Check if admin
        const { data: profile } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', user.id)
            .single();

        if (profile?.role !== 'admin' && profile?.role !== 'super_admin') {
            return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
        }

        const { searchParams } = new URL(request.url);
        const productId = searchParams.get('productId');

        if (!productId) {
            return NextResponse.json({ success: false, error: 'No product ID provided' }, { status: 400 });
        }

        const adminClient = createAdminClient();

        // Clear the guide URL from product
        const { error: updateError } = await adminClient
            .from('products')
            .update({ installation_guide_url: null })
            .eq('id', productId);

        if (updateError) {
            console.error('Update error:', updateError);
            return NextResponse.json({ success: false, error: 'Failed to update product' }, { status: 500 });
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Delete guide error:', error);
        return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
    }
}
