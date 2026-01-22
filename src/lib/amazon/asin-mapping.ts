/**
 * Amazon ASIN Mapping Utilities
 * Provides functions to look up FSN by ASIN for order sync and activation
 */

import { createClient as createServerClient } from '@/lib/supabase/server';

export interface AsinMapping {
    id: string;
    asin: string;
    fsn: string;
    product_title: string | null;
}

/**
 * Look up FSN by ASIN from the database
 * @param asin - Amazon Standard Identification Number
 * @returns FSN and product details or null if not found
 */
export async function getFsnByAsin(asin: string): Promise<AsinMapping | null> {
    const supabase = await createServerClient();

    const { data, error } = await supabase
        .from('amazon_asin_mapping')
        .select('id, asin, fsn, product_title')
        .eq('asin', asin)
        .single();

    if (error || !data) {
        console.error('ASIN → FSN lookup failed:', error?.message || 'Not found');
        return null;
    }

    return data as AsinMapping;
}

/**
 * Look up FSN for multiple ASINs
 * @param asins - Array of ASINs
 * @returns Map of ASIN to FSN mappings
 */
export async function getFsnsByAsins(asins: string[]): Promise<Map<string, AsinMapping>> {
    const supabase = await createServerClient();

    const { data, error } = await supabase
        .from('amazon_asin_mapping')
        .select('id, asin, fsn, product_title')
        .in('asin', asins);

    if (error || !data) {
        console.error('ASIN batch lookup failed:', error?.message || 'Not found');
        return new Map();
    }

    const map = new Map<string, AsinMapping>();
    for (const row of data) {
        map.set(row.asin, row as AsinMapping);
    }
    return map;
}

/**
 * Get product data by FSN from products_data table
 * @param fsn - Product FSN
 * @returns Product data or null
 */
export async function getProductByFsn(fsn: string) {
    const supabase = await createServerClient();

    const { data, error } = await supabase
        .from('products_data')
        .select('*')
        .eq('fsn', fsn)
        .single();

    if (error || !data) {
        return null;
    }

    return data;
}

/**
 * Map FSN to installation documentation paths
 */
export const fsnToInstallDoc: Record<string, string> = {
    'WINDOWS11': 'win11-win10pro_upgrade',
    'OPSG3TNK9HZDZEM9': 'win11-win10pro_upgrade', // Windows 10 Pro
    'WIN11HOME': 'win11-win10pro_upgrade',
    'WIN10ENTERPRISE': 'win11-win10pro_upgrade',
    'WIN11ENTERPRISE': 'win11-win10pro_upgrade',
    'OFFGHYUUFTD9NQNE': 'office2021', // Office 2021 Pro Plus
    'OFFG9MREFCXD658G': 'office2021',
    'OFFICE2024-WIN': 'office2024win',
    'OPSG4ZTTK5MMZWPB': 'office2019', // Office 2019
    'PP2016': 'office2019',
    'OFFICE365': 'office365',
    '365E5': 'office365ent',
    'WIN11-PP21': 'win11-pp2021_combo',
    'OFFICE2024-MAC': 'office2024mac',
    'VISIO2021': 'visio2021',
    'PROJECT2021': 'project2021',
    'GEMINI': null, // No installation doc for Gemini - invite-based activation
    'ACROBAT2024': 'acrobat2024',
};

/**
 * Get installation doc URL for an FSN
 */
export function getInstallDocUrl(fsn: string): string | null {
    const docPath = fsnToInstallDoc[fsn];
    if (!docPath) return null;
    return `/installation-docs/${docPath}`;
}
