import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET() {
    try {
        // Query amazon_activation_license_keys for OFFICE365 product info
        const { data, error } = await supabase
            .from('amazon_activation_license_keys')
            .select('product_name, product_image')
            .eq('sku', 'OFFICE365')
            .limit(1)
            .single();

        if (error || !data) {
            // Fallback to default values
            return NextResponse.json({
                success: true,
                data: {
                    product_name: 'Microsoft Office 365',
                    product_image: 'https://api.simplysolutions.co.in/storage/v1/object/public/product-images/office-365-logo.png',
                },
            });
        }

        return NextResponse.json({
            success: true,
            data: {
                product_name: data.product_name || 'Microsoft Office 365',
                product_image: data.product_image || 'https://api.simplysolutions.co.in/storage/v1/object/public/product-images/office-365-logo.png',
            },
        });
    } catch (error: any) {
        console.error('Product info fetch error:', error);
        return NextResponse.json({
            success: true,
            data: {
                product_name: 'Microsoft Office 365',
                product_image: 'https://api.simplysolutions.co.in/storage/v1/object/public/product-images/office-365-logo.png',
            },
        });
    }
}
