/**
 * Combo Products Configuration
 * 
 * Maps combo FSNs to their component FSNs.
 * When a combo product is activated, one key is issued for each component.
 */

export const COMBO_PRODUCTS: Record<string, string[]> = {
    // Windows 11 Pro + Office 2021 Pro Plus
    'WIN11-PP21': ['WINDOWS11', 'OFFG9MREFCXD658G'],

    // Windows 11 Pro + Office 2024 Pro Plus
    'WIN11-PP24': ['WINDOWS11', 'OFFICE2024-WIN'],
};

/**
 * Check if an FSN is a combo product
 */
export function isComboProduct(fsn: string): boolean {
    return fsn in COMBO_PRODUCTS;
}

/**
 * Get component FSNs for a product.
 * For combo products, returns array of component FSNs.
 * For single products, returns array with just that FSN.
 */
export function getComponentFSNs(fsn: string): string[] {
    return COMBO_PRODUCTS[fsn] || [fsn];
}

/**
 * Get display names for combo products
 */
export const COMBO_DISPLAY_NAMES: Record<string, string> = {
    'WIN11-PP21': 'Windows 11 Pro + Office 2021 Pro Plus Combo',
    'WIN11-PP24': 'Windows 11 Pro + Office 2024 Pro Plus Combo',
};
