export const SUBSCRIPTION_INSTRUCTIONS: Record<string, {
    productName: string;
    downloadUrl: string;
    steps: string[];
    afterInstall?: string[];
}> = {
    'AUTOCAD': {
        productName: 'AutoCAD Subscription',
        downloadUrl: 'https://manage.autodesk.com/products',
        steps: [
            'Log on to the official website with your email address: <a href="https://manage.autodesk.com/products" style="color: #DC3E15; text-decoration: underline;">manage.autodesk.com/products</a>',
            'Click "All Products and Services" in the left catalog bar of the interface',
            'Download the software you purchased'
        ],
        afterInstall: [
            'Logout the account once',
            'Re-login to complete activation'
        ]
    },
    'CANVA': {
        productName: 'Canva Pro Lifetime Access',
        downloadUrl: 'https://canva.com',
        steps: [
            'Within 1 working day, you will receive a <strong>Canva Pro invitation email</strong> on your submitted ID',
            'Accept the invitation from Canva to activate your <strong>Canva Pro Lifetime Access</strong>',
            '<strong>NOTE:</strong> This process activates Canva Pro directly on your account for lifetime use'
        ],
        afterInstall: [
            'Once you accept the invitation, <strong>log out and re-login</strong> to your Canva account to enjoy full Canva Pro features',
            'Make sure to accept the invite within <strong>24 hours</strong> to avoid expiration'
        ]
    },
    'REVIT': {
        productName: 'Revit Subscription',
        downloadUrl: 'https://manage.autodesk.com/products',
        steps: [
            'Log on to the official website with your email address: <a href="https://manage.autodesk.com/products" style="color: #DC3E15; text-decoration: underline;">manage.autodesk.com/products</a>',
            'Click "All Products and Services" in the left catalog bar of the interface',
            'Download Revit from your product list'
        ],
        afterInstall: [
            'Logout the account once',
            'Re-login to complete activation'
        ]
    },
    '3DSMAX': {
        productName: '3DS Max Subscription',
        downloadUrl: 'https://manage.autodesk.com/products',
        steps: [
            'Log on to the official website with your email address: <a href="https://manage.autodesk.com/products" style="color: #DC3E15; text-decoration: underline;">manage.autodesk.com/products</a>',
            'Click "All Products and Services" in the left catalog bar of the interface',
            'Download 3DS Max from your product list'
        ],
        afterInstall: [
            'Logout the account once',
            'Re-login to complete activation'
        ]
    },
    'MAYA': {
        productName: 'Maya Subscription',
        downloadUrl: 'https://manage.autodesk.com/products',
        steps: [
            'Log on to the official website with your email address: <a href="https://manage.autodesk.com/products" style="color: #DC3E15; text-decoration: underline;">manage.autodesk.com/products</a>',
            'Click "All Products and Services" in the left catalog bar of the interface',
            'Download Maya from your product list'
        ],
        afterInstall: [
            'Logout the account once',
            'Re-login to complete activation'
        ]
    },
    'FUSION360': {
        productName: 'Fusion 360 Subscription',
        downloadUrl: 'https://manage.autodesk.com/products',
        steps: [
            'Log on to the official website with your email address: <a href="https://manage.autodesk.com/products" style="color: #DC3E15; text-decoration: underline;">manage.autodesk.com/products</a>',
            'Click "All Products and Services" in the left catalog bar of the interface',
            'Download Fusion 360 from your product list'
        ],
        afterInstall: [
            'Logout the account once',
            'Re-login to complete activation'
        ]
    },
    '365E5': {
        productName: 'Microsoft 365 E5 Subscription',
        downloadUrl: 'https://www.office.com',
        steps: [
            'Go to <a href="https://www.office.com" style="color: #0078D4; text-decoration: underline;">office.com</a>',
            'Sign in with your Microsoft 365 email and password (provided in this email)',
            'Access Word, Excel, PowerPoint, Teams, OneDrive, and all Microsoft 365 apps'
        ],
        afterInstall: [
            '<strong>Change your password</strong> on first login for security',
            'Set up <strong>two-factor authentication</strong> for enhanced security',
            'Download the Microsoft 365 desktop apps for the best experience'
        ]
    }
};

export function getSubscriptionConfig(fsn: string) {
    // Extract base product from FSN (e.g., AUTOCAD-1YEAR -> AUTOCAD)
    for (const key of Object.keys(SUBSCRIPTION_INSTRUCTIONS)) {
        if (fsn.startsWith(key)) {
            return { key, ...SUBSCRIPTION_INSTRUCTIONS[key] };
        }
    }
    return null;
}
