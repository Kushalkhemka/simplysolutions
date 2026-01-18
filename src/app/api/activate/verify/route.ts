import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export async function POST(request: NextRequest) {
    try {
        const { secretCode } = await request.json();

        // Validate input
        if (!secretCode) {
            return NextResponse.json(
                { error: 'Secret code is required' },
                { status: 400 }
            );
        }

        // Remove any spaces or dashes from the code
        const cleanCode = secretCode.replace(/[\s-]/g, '');

        // Validate 15-digit format
        if (!/^\d{15,17}$/.test(cleanCode)) {
            return NextResponse.json(
                {
                    valid: false,
                    error: 'Invalid secret code format. Please enter a 15-17 digit code.'
                },
                { status: 400 }
            );
        }

        // Create supabase client with service role
        const supabase = createClient(supabaseUrl, supabaseServiceKey);

        // Check if secret code exists
        const { data: secretCodeData, error: secretCodeError } = await supabase
            .from('amazon_secret_codes')
            .select('*')
            .eq('secret_code', cleanCode)
            .single();

        if (secretCodeError || !secretCodeData) {
            return NextResponse.json(
                {
                    valid: false,
                    error: 'Secret code not found. Please check your code and try again.'
                },
                { status: 404 }
            );
        }

        // Check if already redeemed
        if (secretCodeData.is_redeemed && secretCodeData.license_key_id) {
            // Fetch the already assigned license key
            const { data: existingKey } = await supabase
                .from('amazon_activation_license_keys')
                .select('*')
                .eq('id', secretCodeData.license_key_id)
                .single();

            return NextResponse.json({
                valid: true,
                isAlreadyRedeemed: true,
                sku: secretCodeData.sku,
                licenseKey: existingKey?.license_key || null,
                productInfo: existingKey ? {
                    productName: existingKey.product_name,
                    productImage: existingKey.product_image,
                    downloadUrl: existingKey.download_url,
                } : null
            });
        }

        // Get product info from available license keys with matching SKU
        const { data: availableKey } = await supabase
            .from('amazon_activation_license_keys')
            .select('product_name, product_image, download_url')
            .eq('sku', secretCodeData.sku)
            .eq('is_redeemed', false)
            .limit(1)
            .single();

        return NextResponse.json({
            valid: true,
            isAlreadyRedeemed: false,
            sku: secretCodeData.sku,
            productInfo: availableKey ? {
                productName: availableKey.product_name,
                productImage: availableKey.product_image,
                downloadUrl: availableKey.download_url,
            } : null
        });

    } catch (error) {
        console.error('Error verifying secret code:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
