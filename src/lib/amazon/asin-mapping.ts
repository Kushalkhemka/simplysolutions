/**
 * Amazon ASIN Mapping Utilities
 * Provides functions to look up products by ASIN for order sync
 */

import { createClient as createServerClient } from '@/lib/supabase/server';
import { createClient } from '@supabase/supabase-js';

export interface AsinMapping {
    id: string;
    asin: string;
    seller_sku: string;
    product_type: string;
    product_title: string | null;
    installation_doc: string | null;
    price: number | null;
    fulfillment_channel: string | null;
}

/**
 * Look up product info by ASIN from the database
 * @param asin - Amazon Standard Identification Number
 * @returns Product mapping or null if not found
 */
export async function getProductByAsin(asin: string): Promise<AsinMapping | null> {
    const supabase = await createServerClient();

    const { data, error } = await supabase
        .from('amazon_asin_mapping')
        .select('*')
        .eq('asin', asin)
        .single();

    if (error || !data) {
        console.error('ASIN lookup failed:', error?.message || 'Not found');
        return null;
    }

    return data as AsinMapping;
}

/**
 * Look up multiple products by ASINs
 * @param asins - Array of ASINs
 * @returns Array of product mappings
 */
export async function getProductsByAsins(asins: string[]): Promise<AsinMapping[]> {
    const supabase = await createServerClient();

    const { data, error } = await supabase
        .from('amazon_asin_mapping')
        .select('*')
        .in('asin', asins);

    if (error || !data) {
        console.error('ASIN batch lookup failed:', error?.message || 'Not found');
        return [];
    }

    return data as AsinMapping[];
}

/**
 * Get available license key for a product type
 * @param productType - Normalized product type (e.g., 'office-2021-pro-plus')
 * @returns Available license key info or null
 */
export async function getAvailableLicenseKey(productType: string) {
    const supabase = await createServerClient();

    // First, get all SKUs that match this product type
    const { data: mappings } = await supabase
        .from('amazon_asin_mapping')
        .select('seller_sku')
        .eq('product_type', productType);

    if (!mappings || mappings.length === 0) {
        return null;
    }

    const skus = mappings.map(m => m.seller_sku);

    // Find an available (unassigned) license key
    const { data: availableKey, error } = await supabase
        .from('amazon_activation_license_keys')
        .select('id, license_key, sku, product_name, download_url')
        .is('order_id', null)
        .eq('is_assigned', false)
        .in('sku', skus)
        .limit(1)
        .single();

    if (error || !availableKey) {
        return null;
    }

    return availableKey;
}

/**
 * Map Amazon product types to installation documentation paths
 */
export const productTypeToInstallDoc: Record<string, string> = {
    'windows-1011-pro': 'win11-win10pro_upgrade',
    'windows-10-pro': 'win11-win10pro_upgrade',
    'windows-1011-home': 'win11-win10pro_upgrade',
    'windows-1011-enterprise': 'win11-win10pro_upgrade',
    'windows-11-pro': 'win11-win10pro_upgrade',
    'office-2021-pro-plus': 'office2021',
    'office-2024-ltsc-pro-plus': 'office2024win',
    'office-2019-pro-plus': 'office2019',
    'office-2016-pro-plus': 'office2019',
    'ms-365-pro-plus': 'office365',
    'ms-365-enterprise': 'office365ent',
    'office-windows-combo': 'win11-pp2021_combo',
    'office-2024-mac': 'office2024mac',
    'visio-2021': 'visio2021',
    'project-2021': 'project2021',
};

/**
 * Get installation doc URL for a product type
 */
export function getInstallDocUrl(productType: string): string | null {
    const docPath = productTypeToInstallDoc[productType];
    if (!docPath) return null;
    return `/installation-docs/${docPath}`;
}
