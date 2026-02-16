import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

// POST /api/admin/upload-product-image - Upload product image to storage (bypasses RLS)
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

        if (!file) {
            return NextResponse.json({ success: false, error: 'No file provided' }, { status: 400 });
        }

        // Validate file type
        if (!file.type.startsWith('image/')) {
            return NextResponse.json({ success: false, error: 'Only image files are allowed' }, { status: 400 });
        }

        // Max file size: 5MB
        const maxSize = 5 * 1024 * 1024;
        if (file.size > maxSize) {
            return NextResponse.json({ success: false, error: 'File size must be less than 5MB' }, { status: 400 });
        }

        const adminClient = createAdminClient();

        // Generate unique filename
        const sanitizedName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
        const fileName = `${Date.now()}-${sanitizedName}`;
        const filePath = `product-images/${fileName}`;

        // Convert file to buffer
        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);

        // Upload to Supabase Storage using admin client (bypasses RLS)
        const { error: uploadError } = await adminClient.storage
            .from('product-assets')
            .upload(filePath, buffer, {
                contentType: file.type,
                upsert: true,
            });

        if (uploadError) {
            console.error('Product image upload error:', uploadError);
            return NextResponse.json({ success: false, error: 'Failed to upload image' }, { status: 500 });
        }

        // Get public URL
        const { data: urlData } = adminClient.storage
            .from('product-assets')
            .getPublicUrl(filePath);

        return NextResponse.json({
            success: true,
            data: {
                url: urlData.publicUrl,
                fileName: file.name,
            },
        });
    } catch (error) {
        console.error('Upload product image error:', error);
        return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
    }
}
