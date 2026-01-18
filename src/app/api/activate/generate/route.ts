import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export async function POST(request: NextRequest) {
    try {
        const { secretCode, operatingSystem } = await request.json();

        // Validate input
        if (!secretCode) {
            return NextResponse.json(
                { error: 'Secret code is required' },
                { status: 400 }
            );
        }

        // Remove any spaces or dashes from the code
        const cleanCode = secretCode.replace(/[\s-]/g, '');

        // Create supabase client with service role
        const supabase = createClient(supabaseUrl, supabaseServiceKey);

        // Fetch the secret code record
        const { data: secretCodeData, error: secretCodeError } = await supabase
            .from('amazon_secret_codes')
            .select('*')
            .eq('secret_code', cleanCode)
            .single();

        if (secretCodeError || !secretCodeData) {
            return NextResponse.json(
                { success: false, error: 'Secret code not found' },
                { status: 404 }
            );
        }

        // Check if already redeemed
        if (secretCodeData.is_redeemed && secretCodeData.license_key_id) {
            // Return the existing license key
            const { data: existingKey } = await supabase
                .from('amazon_activation_license_keys')
                .select('*')
                .eq('id', secretCodeData.license_key_id)
                .single();

            if (existingKey) {
                return NextResponse.json({
                    success: true,
                    alreadyRedeemed: true,
                    licenseKey: existingKey.license_key,
                    productInfo: {
                        productName: existingKey.product_name,
                        productImage: existingKey.product_image,
                        downloadUrl: existingKey.download_url,
                        sku: existingKey.sku,
                    }
                });
            }
        }

        // Find an available license key matching the SKU
        const { data: availableKey, error: keyError } = await supabase
            .from('amazon_activation_license_keys')
            .select('*')
            .eq('sku', secretCodeData.sku)
            .eq('is_redeemed', false)
            .limit(1)
            .single();

        if (keyError || !availableKey) {
            return NextResponse.json(
                {
                    success: false,
                    error: 'No license keys available for this product. Please contact support.'
                },
                { status: 404 }
            );
        }

        // Mark the license key as redeemed
        const now = new Date().toISOString();
        const { error: updateKeyError } = await supabase
            .from('amazon_activation_license_keys')
            .update({
                is_redeemed: true,
                redeemed_at: now,
                updated_at: now,
            })
            .eq('id', availableKey.id);

        if (updateKeyError) {
            console.error('Error updating license key:', updateKeyError);
            return NextResponse.json(
                { success: false, error: 'Failed to assign license key' },
                { status: 500 }
            );
        }

        // Update the secret code with the assigned license key
        const { error: updateCodeError } = await supabase
            .from('amazon_secret_codes')
            .update({
                license_key_id: availableKey.id,
                is_redeemed: true,
                redeemed_at: now,
                updated_at: now,
            })
            .eq('id', secretCodeData.id);

        if (updateCodeError) {
            console.error('Error updating secret code:', updateCodeError);
            // Try to rollback the license key update
            await supabase
                .from('amazon_activation_license_keys')
                .update({
                    is_redeemed: false,
                    redeemed_at: null,
                })
                .eq('id', availableKey.id);

            return NextResponse.json(
                { success: false, error: 'Failed to complete activation' },
                { status: 500 }
            );
        }

        return NextResponse.json({
            success: true,
            alreadyRedeemed: false,
            licenseKey: availableKey.license_key,
            productInfo: {
                productName: availableKey.product_name,
                productImage: availableKey.product_image,
                downloadUrl: availableKey.download_url,
                sku: availableKey.sku,
            }
        });

    } catch (error) {
        console.error('Error generating license key:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
