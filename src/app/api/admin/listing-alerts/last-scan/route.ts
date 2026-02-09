/**
 * API endpoint to fetch the last listing keyword scan results
 * Used by the admin panel to display scan results on page load
 */

import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET() {
    try {
        const supabase = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!
        );

        // Get the most recent scan from listing_keyword_alerts table
        const { data, error } = await supabase
            .from('listing_keyword_alerts')
            .select('*')
            .order('scanned_at', { ascending: false })
            .limit(1)
            .single();

        if (error) {
            // Table might not exist or no data
            if (error.code === 'PGRST116') {
                return NextResponse.json({
                    success: true,
                    hasData: false,
                    message: 'No previous scan results found'
                });
            }
            throw error;
        }

        if (!data) {
            return NextResponse.json({
                success: true,
                hasData: false,
                message: 'No previous scan results found'
            });
        }

        // Format the response to match the scan result format
        const flaggedDetails = data.flagged_details || [];
        const newFlagged = flaggedDetails.filter((p: any) => p.isNew);

        return NextResponse.json({
            success: true,
            hasData: true,
            productsScanned: data.products_scanned,
            productsFlagged: data.products_flagged,
            newProductsFlagged: newFlagged.length,
            baselineIgnored: data.products_flagged - newFlagged.length,
            newFlaggedProducts: newFlagged,
            allFlaggedProducts: flaggedDetails,
            alertSent: data.alert_sent,
            scannedAt: data.scanned_at,
            duration: 'cached'
        });

    } catch (error) {
        console.error('Error fetching last scan:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to fetch last scan results' },
            { status: 500 }
        );
    }
}
