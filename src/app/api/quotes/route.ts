import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

// GET /api/quotes - Get user's quotes
export async function GET(request: NextRequest) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
        }

        const { data: quotes, error } = await supabase
            .from('quotes')
            .select('*')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Error fetching quotes:', error);
            return NextResponse.json({ success: false, error: 'Failed to fetch quotes' }, { status: 500 });
        }

        return NextResponse.json({ success: true, data: quotes });
    } catch (error) {
        console.error('Quotes GET error:', error);
        return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
    }
}

// POST /api/quotes - Submit a quote request
export async function POST(request: NextRequest) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        const body = await request.json();
        const { companyName, contactName, email, phone, gstn, notes, products, total_quantity } = body;

        if (!companyName || !contactName || !email || !products || products.length === 0) {
            return NextResponse.json(
                { success: false, error: 'Missing required fields' },
                { status: 400 }
            );
        }

        const adminClient = createAdminClient();

        const { data: quote, error } = await adminClient
            .from('quotes')
            .insert({
                user_id: user?.id || null,
                status: 'pending',
                company_name: companyName,
                contact_name: contactName,
                email: email,
                phone: phone || null,
                gstn: gstn || null,
                products: products,
                total_quantity: total_quantity,
                notes: notes || null,
            })
            .select()
            .single();

        if (error) {
            console.error('Error creating quote:', error);
            return NextResponse.json({ success: false, error: 'Failed to create quote' }, { status: 500 });
        }

        // TODO: Send email notification to admin

        return NextResponse.json({ success: true, data: quote });
    } catch (error) {
        console.error('Quotes POST error:', error);
        return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
    }
}
