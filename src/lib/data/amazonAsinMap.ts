/**
 * Amazon ASIN mapping for products
 * Maps product name patterns to Amazon ASINs
 * Source: All Listings Report 01-13-2026
 * 
 * Link format: https://www.amazon.in/dp/{ASIN}
 */

export const amazonAsinMap: Record<string, string> = {
    // Windows Products
    'windows-1011-pro': 'B0GFD39GSF',
    'windows-10-pro': 'B0GFCQVPFP',
    'windows-1011-home': 'B0GFD43YQ6',
    'windows-1011-enterprise': 'B0GFCYLGZ2',
    'windows-11-pro': 'B0GFCY86RC',

    // Office 2021
    'office-2021-professional-plus': 'B0GFCYYX99',
    'office-professional-plus-2021': 'B0GFCYYX99',
    'ms-professional-plus-2021': 'B0GFCXTRX8',

    // Office 2024
    'office-2024-ltsc-professional-plus': 'B0GFCW7Z2Q',
    'office-ltsc-2024': 'B0GFD279VQ',
    'office-pro-plus-ltsc-2024': 'B0GFCQ2KHC',

    // Office 2019
    'office-2019-professional-plus': 'B0GFCWLDM7',

    // Office 2016
    'office-2016-professional-plus': 'B0GFD71MNQ',

    // Microsoft 365
    'microsoft-365-professional-plus': 'B0GFD767NM',
    'ms-365-pro-plus': 'B0GFCVV92K',
    'ms-365-enterprise': 'B0GFD2TPQD',
    'ms-365-copilot': 'B0GFCWMC8G',
    'ms-professional-plus-365': 'B0GFDB19CZ',

    // Combo Packs
    'office-2021-windows-11-combo': 'B0GFD72V9P',
    'office-2024-windows-combo': 'B0GFD36XZN',

    // Mac Office
    'office-2024-mac': 'B0GFCWP2RS',
    'ms-home-2024-macos': 'B0GFDBZLPK',
    'microsoft-home-2024': 'B0GFDBZLPK',
    'ms-home-suite-2024-macos': 'B0GFCXT8RG',

    // AutoCAD
    'autocad-1-year': 'B0GFCW3XDK',
    'autocad-3-year': 'B0GFD7FY8D',
    'autocad-2026': 'B0GFD217X6',

    // Canva
    'canva-pro': 'B0GFCNRFMF',

    // Adobe Acrobat
    'acrobat-pro-2024': 'B0GFD821W3',
    'acrobat-dc-pro': 'B0GFD1SXMQ',

    // Visio & Project
    'visio-2021': 'B0GFCY2D33',
    'project-2021': 'B0GFD2PRY1',

    // Gemini
    'gemini-pro-advanced': 'B0GFD2WW8R',
};

/**
 * Get Amazon ASIN for a product based on its name or slug
 * Returns null if no matching ASIN found
 */
export function getAmazonAsin(productNameOrSlug: string): string | null {
    const normalized = productNameOrSlug.toLowerCase().replace(/[^a-z0-9]+/g, '-');

    // Try exact match first
    for (const [key, asin] of Object.entries(amazonAsinMap)) {
        if (normalized.includes(key)) {
            return asin;
        }
    }

    // Fallback patterns for common products
    if (normalized.includes('windows') && normalized.includes('pro')) {
        if (normalized.includes('11') && !normalized.includes('10')) {
            return amazonAsinMap['windows-11-pro'];
        }
        if (normalized.includes('enterprise')) {
            return amazonAsinMap['windows-1011-enterprise'];
        }
        if (normalized.includes('home')) {
            return amazonAsinMap['windows-1011-home'];
        }
        return amazonAsinMap['windows-1011-pro'];
    }

    if (normalized.includes('office') || normalized.includes('ms-')) {
        if (normalized.includes('2024') && normalized.includes('ltsc')) {
            return amazonAsinMap['office-2024-ltsc-professional-plus'];
        }
        if (normalized.includes('2021')) {
            return amazonAsinMap['office-2021-professional-plus'];
        }
        if (normalized.includes('2019')) {
            return amazonAsinMap['office-2019-professional-plus'];
        }
        if (normalized.includes('365')) {
            return amazonAsinMap['microsoft-365-professional-plus'];
        }
    }

    if (normalized.includes('canva')) {
        return amazonAsinMap['canva-pro'];
    }

    if (normalized.includes('autocad')) {
        if (normalized.includes('3-year') || normalized.includes('3year')) {
            return amazonAsinMap['autocad-3-year'];
        }
        return amazonAsinMap['autocad-1-year'];
    }

    if (normalized.includes('acrobat')) {
        return amazonAsinMap['acrobat-pro-2024'];
    }

    if (normalized.includes('gemini')) {
        return amazonAsinMap['gemini-pro-advanced'];
    }

    if (normalized.includes('visio')) {
        return amazonAsinMap['visio-2021'];
    }

    if (normalized.includes('project')) {
        return amazonAsinMap['project-2021'];
    }

    return null;
}

/**
 * Get Amazon product URL
 */
export function getAmazonProductUrl(asin: string): string {
    return `https://www.amazon.in/dp/${asin}`;
}
