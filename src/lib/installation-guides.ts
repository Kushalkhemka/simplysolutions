// Mapping from product SKU/FSN to installation guide file
export const installationGuideMap: Record<string, string> = {
    // Office 2021
    'OFFGHYUUFTD9NQNE': 'office2021.md',
    'OFFG9MREFCXD658G': 'office2021.md',
    'PPBOX21': 'office2021.md',
    'OFF_3': 'office2021.md',
    'OFF_16': 'office2021.md',
    'OFF_15': 'office2021.md',

    // Office 2019
    'OPSG4ZTTK5MMZWPB': 'office2019.md',
    'OPSG4ZTTK5MMZWPB_ALI': 'office2019.md',
    'OFF_2': 'office2019.md',
    'OFF_25': 'office2019.md',

    // Office 2016
    'PP2016': 'office2019.md', // Similar activation
    'OFF_4': 'office2019.md',

    // Office 2024 Windows
    'OFFICE2024-WIN': 'office2024win.md',
    'OFF_7': 'office2024win.md',
    'OFF_21': 'office2024win.md',
    'OFF_35': 'office2024win.md',

    // Office 2024 Mac
    'OFFICE2024-MAC': 'office2024mac.md',
    'OFF_9': 'office2024mac.md',
    'OFF_19': 'office2024mac.md',
    'OFF_20': 'office2024mac.md',

    // Office 365
    'OFFICE365': 'office365.md',
    'OFF_5': 'office365.md',
    'OFF_6': 'office365.md',
    'OFF_30': 'office365.md',

    // Office 365 Enterprise
    '365E5': 'office365ent.md',

    // Home & Business / Student
    'OFFGD398CP5ME6DKSTD': 'home_student_2021.md',
    'OFTFTUVWT2ZMGZK7': 'hb2019.md',
    'HB2021': 'hb2021.md',
    'HB2019': 'hb2019.md',

    // Visio
    'VISIO2021': 'visio2021.md',
    'VISIO2019': 'visio2021.md',
    'OFF_33': 'visio2021.md',

    // Project
    'PROJECT2021': 'project2021.md',
    'PROJECT2019': 'project2021.md',
    'OFF_34': 'project2021.md',

    // Windows
    'OPSG3TNK9HZDZEM9': 'win11-win10pro_noupgrade.md',
    'OPSGZ8QG4JZ3AHMV': 'win11-win10pro_noupgrade.md',
    'WINDOWS11': 'win11-win10pro_noupgrade.md',
    'WIN11HOME': 'win11-win10pro_noupgrade.md',
    'WIN10ENTERPRISE': 'win11-win10pro_noupgrade.md',
    'WIN11ENTERPRISE': 'win11-win10pro_noupgrade.md',
    'OFF_1': 'win11-win10pro_noupgrade.md',
    'OFF_10': 'win11-win10pro_noupgrade.md',
    'OFF_11': 'win11-win10pro_noupgrade.md',
    'OFF_12': 'win11-win10pro_noupgrade.md',
    'OFF_13': 'win11-win10pro_noupgrade.md',
    'OFF_17': 'win11-win10pro_noupgrade.md',

    // Combos
    'WIN11-PP21': 'win11-pp2021_combo.md',
    'WIN10-PP21': 'win11-pp2021_combo.md',
    'OFF_8': 'win11-pp2021_combo.md',
    'OFF_14': 'win11-pp2021_combo.md',

    // GetCID troubleshooting
    'getcid': 'getcid.md',

    // ChatGPT Plus
    'CHATGPT': 'chatgpt',
};

// Get installation guide filename based on SKU, FSN, or product name
export function getInstallationGuide(identifier?: string | null): string | null {
    if (!identifier) return null;

    // Direct lookup
    if (installationGuideMap[identifier]) {
        return installationGuideMap[identifier];
    }

    // Try to match by partial product name
    const lowerIdentifier = identifier.toLowerCase();

    if (lowerIdentifier.includes('2021') && lowerIdentifier.includes('office')) {
        return 'office2021.md';
    }
    if (lowerIdentifier.includes('2019') && lowerIdentifier.includes('office')) {
        return 'office2019.md';
    }
    if (lowerIdentifier.includes('2024') && lowerIdentifier.includes('mac')) {
        return 'office2024mac.md';
    }
    if (lowerIdentifier.includes('2024') && lowerIdentifier.includes('office')) {
        return 'office2024win.md';
    }
    if (lowerIdentifier.includes('365')) {
        return 'office365.md';
    }
    if (lowerIdentifier.includes('windows')) {
        return 'win11-win10pro_noupgrade.md';
    }
    if (lowerIdentifier.includes('visio')) {
        return 'visio2021.md';
    }
    if (lowerIdentifier.includes('project')) {
        return 'project2021.md';
    }

    return null;
}
