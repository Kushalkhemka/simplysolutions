import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;

    if (!id) {
        return NextResponse.json({ error: 'Request ID is required' }, { status: 400 });
    }

    const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    try {
        // First check if the request exists
        const { data: existingRequest, error: fetchError } = await supabase
            .from('product_requests')
            .select('id, request_type')
            .eq('id', id)
            .single();

        if (fetchError || !existingRequest) {
            return NextResponse.json({ error: 'Request not found' }, { status: 404 });
        }

        // If it's a 365e5 request, also delete from office365_requests
        if (existingRequest.request_type === '365e5') {
            await supabase
                .from('office365_requests')
                .delete()
                .eq('product_request_id', id);
        }

        // Delete the product request
        const { error: deleteError } = await supabase
            .from('product_requests')
            .delete()
            .eq('id', id);

        if (deleteError) {
            console.error('Error deleting product request:', deleteError);
            return NextResponse.json({ error: 'Failed to delete request' }, { status: 500 });
        }

        return NextResponse.json({ success: true, message: 'Request deleted successfully' });
    } catch (error) {
        console.error('Error in delete request:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
