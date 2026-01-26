import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

interface InstantReplacementRequest {
    orderId: string;
    installationId: string;
}

export async function POST(request: NextRequest) {
    try {
        const body: InstantReplacementRequest = await request.json();
        const { orderId, installationId } = body;

        if (!orderId || !installationId) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        const cleanOrderId = orderId.trim().replace(/\s+/g, '');

        // 1. Check if order exists
        const { data: order, error: orderError } = await supabase
            .from('amazon_orders')
            .select('id, order_id, fsn, contact_email')
            .eq('order_id', cleanOrderId)
            .single();

        if (orderError || !order) {
            return NextResponse.json({
                error: 'Order not found. Please check your order ID.'
            }, { status: 404 });
        }

        // 2. Check if order has already used instant replacement (check for auto-approved requests)
        const { data: existingAutoApproved } = await supabase
            .from('license_replacement_requests')
            .select('id')
            .eq('order_id', cleanOrderId)
            .eq('status', 'APPROVED')
            .eq('admin_notes', 'AUTO-APPROVED: Instant replacement for blocked/exceeded Installation ID')
            .single();

        if (existingAutoApproved) {
            return NextResponse.json({
                error: 'You have already used the instant replacement feature for this order. Please contact support for additional help.'
            }, { status: 403 });
        }

        // 3. Get current assigned license key(s) for this order
        const { data: currentKeys } = await supabase
            .from('amazon_activation_license_keys')
            .select('id, license_key')
            .eq('order_id', cleanOrderId);

        const currentKeyIds = currentKeys?.map(k => k.id) || [];
        const currentKeyStrings = currentKeys?.map(k => k.license_key) || [];

        // 4. Find an available replacement key
        // Must be: same FSN, not redeemed, DIFFERENT BASE KEY (not just different suffix)
        const { data: availableKeys, error: keysError } = await supabase
            .from('amazon_activation_license_keys')
            .select('id, license_key, fsn')
            .eq('fsn', order.fsn)
            .eq('is_redeemed', false)
            .is('order_id', null);

        if (keysError || !availableKeys || availableKeys.length === 0) {
            return NextResponse.json({
                error: 'No replacement keys available for this product. Please contact support.'
            }, { status: 404 });
        }

        // Extract base keys from current assigned keys (strip trailing special chars)
        const getBaseKey = (key: string) => key.replace(/[-~!@#$%^&*()_+=\[\]{}|;:'",.<>?\\\/]+$/, '');
        const currentBaseKeys = currentKeyStrings.map(k => getBaseKey(k));

        // Filter to keys with DIFFERENT base (exclude any key that shares base with current keys)
        const keysWithDifferentBase = availableKeys.filter(k => {
            const keyBase = getBaseKey(k.license_key);
            // Only include if base key is NOT in current base keys
            return !currentBaseKeys.includes(keyBase);
        });

        if (keysWithDifferentBase.length === 0) {
            return NextResponse.json({
                error: 'No replacement keys with different base key available. Please contact support.'
            }, { status: 404 });
        }

        const selectedKey = keysWithDifferentBase[0];

        // 5. Mark the new key as redeemed and assign to this order
        const { error: updateError } = await supabase
            .from('amazon_activation_license_keys')
            .update({
                is_redeemed: true,
                order_id: cleanOrderId
            })
            .eq('id', selectedKey.id);

        if (updateError) {
            console.error('Error updating replacement key:', updateError);
            return NextResponse.json({
                error: 'Failed to assign replacement key. Please try again.'
            }, { status: 500 });
        }

        // 6. Create auto-approved replacement request record
        const { error: requestError } = await supabase
            .from('license_replacement_requests')
            .insert({
                order_id: cleanOrderId,
                customer_email: order.contact_email || 'unknown@email.com',
                fsn: order.fsn,
                original_license_key_id: currentKeyIds[0] || null,
                new_license_key_id: selectedKey.id,
                screenshot_url: `data:text/plain;base64,${Buffer.from(`Instant Replacement - Blocked IID: ${installationId}`).toString('base64')}`,
                status: 'APPROVED',
                admin_notes: 'AUTO-APPROVED: Instant replacement for blocked/exceeded Installation ID',
                reviewed_at: new Date().toISOString()
            });

        if (requestError) {
            console.error('Error creating replacement request record:', requestError);
            // Continue anyway - key is already assigned
        }

        return NextResponse.json({
            success: true,
            replacementKey: selectedKey.license_key,
            message: 'Replacement key generated successfully!'
        });

    } catch (error) {
        console.error('Instant replacement error:', error);
        return NextResponse.json({
            error: 'Internal server error. Please try again.'
        }, { status: 500 });
    }
}
