import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Generate a unique 15-digit code that doesn't start with 0
async function generateUniqueCode(): Promise<string> {
    const maxAttempts = 20;
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
        // First digit: 1-9, remaining 14 digits: 0-9
        const firstDigit = Math.floor(Math.random() * 9) + 1;
        const rest = Array.from({ length: 14 }, () => Math.floor(Math.random() * 10)).join('');
        const code = `${firstDigit}${rest}`;

        // Check uniqueness
        const { data: existing } = await supabase
            .from('amazon_orders')
            .select('id')
            .eq('order_id', code)
            .single();

        if (!existing) {
            return code;
        }
    }
    throw new Error('Could not generate unique code');
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { count, fsn } = body;

        // Validate
        if (!fsn) {
            return NextResponse.json({ error: 'Product FSN is required' }, { status: 400 });
        }

        if (!count || count < 1 || count > 100) {
            return NextResponse.json({ error: 'Count must be between 1 and 100' }, { status: 400 });
        }

        // Generate all unique codes first
        const codes: string[] = [];
        const usedCodes = new Set<string>();

        for (let i = 0; i < count; i++) {
            let code: string;
            let attempts = 0;
            do {
                code = await generateUniqueCode();
                attempts++;
                if (attempts > 30) {
                    return NextResponse.json(
                        { error: `Failed to generate unique codes. Created ${codes.length} before failing.` },
                        { status: 500 }
                    );
                }
            } while (usedCodes.has(code)); // Also ensure no duplicates within this batch

            usedCodes.add(code);
            codes.push(code);
        }

        // Insert all orders
        const orders = codes.map(code => ({
            order_id: code,
            fsn: fsn,
            fulfillment_type: 'amazon_digital',
            warranty_status: 'PENDING',
        }));

        const { data, error } = await supabase
            .from('amazon_orders')
            .insert(orders)
            .select();

        if (error) {
            console.error('Bulk order creation error:', error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({
            success: true,
            created: data?.length || 0,
            codes: codes,
        });

    } catch (error: any) {
        console.error('Bulk order creation error:', error);
        return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
    }
}
