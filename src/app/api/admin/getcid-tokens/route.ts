import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// GET - List all tokens with their usage
export async function GET() {
    try {
        const { data: tokens, error } = await supabase
            .from('getcid_tokens')
            .select('*')
            .order('priority', { ascending: false });

        if (error) {
            console.error('Error fetching tokens:', error);
            return NextResponse.json({ error: 'Failed to fetch tokens' }, { status: 500 });
        }

        // Calculate totals
        const totalUsed = tokens?.reduce((sum, t) => sum + t.count_used, 0) || 0;
        const totalAvailable = tokens?.reduce((sum, t) => sum + t.total_available, 0) || 0;

        return NextResponse.json({
            tokens,
            summary: {
                totalTokens: tokens?.length || 0,
                totalUsed,
                totalAvailable,
                totalRemaining: totalAvailable - totalUsed,
            },
        });
    } catch (error) {
        console.error('GetCID tokens API error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

// POST - Add a new token
export async function POST(request: NextRequest) {
    try {
        const { token } = await request.json();

        if (!token || typeof token !== 'string' || token.length < 8) {
            return NextResponse.json({ error: 'Invalid token' }, { status: 400 });
        }

        // Verify token with GetCID API first
        const verifyResponse = await fetch('https://getcid.info/verify-api-token-getcid', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: `tokenApi=${token}`,
        });

        const verifyData = await verifyResponse.json();

        if (verifyData.Status !== 'Success' || !verifyData.Result) {
            return NextResponse.json({ error: 'Invalid token - verification failed' }, { status: 400 });
        }

        const { email, count_token, total_token } = verifyData.Result;

        // Get max priority to set new token priority
        const { data: maxPriorityData } = await supabase
            .from('getcid_tokens')
            .select('priority')
            .order('priority', { ascending: false })
            .limit(1)
            .single();

        const newPriority = (maxPriorityData?.priority || 0) + 1;

        // Insert or update token
        const { data: insertedToken, error } = await supabase
            .from('getcid_tokens')
            .upsert({
                token: token.toLowerCase(),
                email,
                count_used: Math.floor(count_token || 0),
                total_available: Math.floor(total_token || 100),
                priority: newPriority,
                is_active: true,
                last_verified_at: new Date().toISOString(),
            }, { onConflict: 'token' })
            .select()
            .single();

        if (error) {
            console.error('Error inserting token:', error);
            return NextResponse.json({ error: 'Failed to add token' }, { status: 500 });
        }

        return NextResponse.json({
            success: true,
            token: insertedToken,
            message: 'Token added successfully',
        });
    } catch (error) {
        console.error('Add token error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

// PATCH - Update token (toggle active, update priority)
export async function PATCH(request: NextRequest) {
    try {
        const { id, is_active, priority, sync } = await request.json();

        if (!id) {
            return NextResponse.json({ error: 'Token ID required' }, { status: 400 });
        }

        // If sync is requested, verify with API first
        if (sync) {
            const { data: tokenData } = await supabase
                .from('getcid_tokens')
                .select('token')
                .eq('id', id)
                .single();

            if (tokenData) {
                const verifyResponse = await fetch('https://getcid.info/verify-api-token-getcid', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                    body: `tokenApi=${tokenData.token}`,
                });

                const verifyData = await verifyResponse.json();

                if (verifyData.Status === 'Success' && verifyData.Result) {
                    const { count_token, total_token } = verifyData.Result;
                    await supabase
                        .from('getcid_tokens')
                        .update({
                            count_used: Math.floor(count_token || 0),
                            total_available: Math.floor(total_token || 100),
                            last_verified_at: new Date().toISOString(),
                            updated_at: new Date().toISOString(),
                        })
                        .eq('id', id);
                }
            }
        }

        // Build update object
        const updates: Record<string, any> = { updated_at: new Date().toISOString() };
        if (typeof is_active === 'boolean') updates.is_active = is_active;
        if (typeof priority === 'number') updates.priority = priority;

        const { data: updatedToken, error } = await supabase
            .from('getcid_tokens')
            .update(updates)
            .eq('id', id)
            .select()
            .single();

        if (error) {
            console.error('Error updating token:', error);
            return NextResponse.json({ error: 'Failed to update token' }, { status: 500 });
        }

        return NextResponse.json({
            success: true,
            token: updatedToken,
        });
    } catch (error) {
        console.error('Update token error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

// DELETE - Remove a token
export async function DELETE(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');

        if (!id) {
            return NextResponse.json({ error: 'Token ID required' }, { status: 400 });
        }

        const { error } = await supabase
            .from('getcid_tokens')
            .delete()
            .eq('id', id);

        if (error) {
            console.error('Error deleting token:', error);
            return NextResponse.json({ error: 'Failed to delete token' }, { status: 500 });
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Delete token error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
