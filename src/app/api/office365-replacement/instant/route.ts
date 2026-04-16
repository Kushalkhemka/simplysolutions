import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

export async function POST(request: NextRequest) {
    try {
        const { orderId } = await request.json();

        if (!orderId || typeof orderId !== 'string') {
            return NextResponse.json(
                { success: false, error: 'Order ID is required' },
                { status: 400 }
            );
        }

        const cleanOrderId = orderId.trim().replace(/\s+/g, '');

        // 1. Find the order
        const { data: order, error: orderError } = await supabase
            .from('amazon_orders')
            .select('id, order_id, fsn, license_key_id, contact_email')
            .eq('order_id', cleanOrderId)
            .maybeSingle();

        if (orderError || !order) {
            return NextResponse.json(
                { success: false, error: 'Order not found. Please check your Order ID and try again.' },
                { status: 404 }
            );
        }

        // 2. Check FSN is OFFICE365
        if (!order.fsn || !order.fsn.toUpperCase().startsWith('OFFICE365')) {
            return NextResponse.json(
                { success: false, error: 'Replacement is only available for Office 365 orders.' },
                { status: 400 }
            );
        }

        // 3. Check if order has been activated (has a license key assigned)
        const { data: currentKeys } = await supabase
            .from('amazon_activation_license_keys')
            .select('id, license_key')
            .eq('order_id', cleanOrderId);

        if (!currentKeys || currentKeys.length === 0) {
            return NextResponse.json(
                { success: false, error: 'This order has not been activated yet. Please activate your order first at the activation page.' },
                { status: 400 }
            );
        }

        // 4. Check if replacement has already been used (max 1 time - any type, instant or manual)
        const { data: existingReplacements } = await supabase
            .from('license_replacement_requests')
            .select('id')
            .eq('order_id', cleanOrderId)
            .eq('status', 'APPROVED');

        if (existingReplacements && existingReplacements.length >= 1) {
            return NextResponse.json(
                { success: false, error: 'You have already used your one-time replacement for this order. Please contact support for further assistance.' },
                { status: 403 }
            );
        }

        // 4b. If there are any PENDING replacement requests for this order, delete them
        //     so the instant replacement takes over cleanly
        const { data: pendingRequests } = await supabase
            .from('license_replacement_requests')
            .select('id')
            .eq('order_id', cleanOrderId)
            .eq('status', 'PENDING');

        if (pendingRequests && pendingRequests.length > 0) {
            const pendingIds = pendingRequests.map(r => r.id);
            await supabase
                .from('license_replacement_requests')
                .delete()
                .in('id', pendingIds);
        }

        // 5. Find an available OFFICE365 key that is different from current keys
        const currentKeyIds = currentKeys.map(k => k.id);
        const currentKeyStrings = currentKeys.map(k => k.license_key);

        const { data: availableKeys, error: keysError } = await supabase
            .from('amazon_activation_license_keys')
            .select('id, license_key, fsn')
            .eq('fsn', order.fsn)
            .eq('is_redeemed', false)
            .is('order_id', null);

        if (keysError || !availableKeys || availableKeys.length === 0) {
            return NextResponse.json(
                { success: false, error: 'No replacement keys available at the moment. Please contact support.' },
                { status: 404 }
            );
        }

        // Filter to keys with different base (not same credential)
        const getBaseKey = (key: string) => key.replace(/[-~!@#$%^&*()_+=\[\]{}|;:'",.<>?\\\/]+$/, '');
        const currentBaseKeys = currentKeyStrings.map(k => getBaseKey(k));

        const keysWithDifferentBase = availableKeys.filter(k => {
            const keyBase = getBaseKey(k.license_key);
            return !currentBaseKeys.includes(keyBase);
        });

        if (keysWithDifferentBase.length === 0) {
            return NextResponse.json(
                { success: false, error: 'No replacement keys with different credentials available. Please contact support.' },
                { status: 404 }
            );
        }

        const selectedKey = keysWithDifferentBase[0];

        // 6. Mark new key as redeemed and assign to this order
        const { error: updateError } = await supabase
            .from('amazon_activation_license_keys')
            .update({
                is_redeemed: true,
                order_id: cleanOrderId,
                redeemed_at: new Date().toISOString()
            })
            .eq('id', selectedKey.id);

        if (updateError) {
            console.error('Error updating replacement key:', updateError);
            return NextResponse.json(
                { success: false, error: 'Failed to assign replacement key. Please try again.' },
                { status: 500 }
            );
        }

        // 7. Update amazon_orders license_key_id to the new key
        const { error: orderUpdateError } = await supabase
            .from('amazon_orders')
            .update({ license_key_id: selectedKey.id })
            .eq('id', order.id);

        if (orderUpdateError) {
            console.error('Error updating order license_key_id:', orderUpdateError);
            // Non-fatal - key is already assigned
        }

        // 8. Create auto-approved replacement request record for tracking
        const { error: requestError } = await supabase
            .from('license_replacement_requests')
            .insert({
                order_id: cleanOrderId,
                customer_email: order.contact_email || 'unknown@email.com',
                fsn: order.fsn,
                original_license_key_id: currentKeyIds[0] || null,
                new_license_key_id: selectedKey.id,
                screenshot_url: 'N/A - Instant O365 Replacement',
                status: 'APPROVED',
                admin_notes: 'INSTANT-O365-REPLACEMENT: Self-service replacement via /get-replacement page',
                reviewed_at: new Date().toISOString()
            });

        if (requestError) {
            console.error('Error creating replacement request record:', requestError);
            // Non-fatal - key is already assigned
        }

        console.log('Office 365 instant replacement issued:', {
            orderId: cleanOrderId,
            oldKeyId: currentKeyIds[0],
            newKeyId: selectedKey.id,
        });

        return NextResponse.json({
            success: true,
            newLicenseKey: selectedKey.license_key,
            message: 'Replacement license key issued successfully!'
        });

    } catch (error) {
        console.error('Instant replacement error:', error);
        return NextResponse.json(
            { success: false, error: 'Internal server error. Please try again.' },
            { status: 500 }
        );
    }
}
