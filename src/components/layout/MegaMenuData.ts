// Mega Menu Data Structure with SVG Icons
// Based on digitallicense.shop navigation structure

export interface SubCategoryItem {
    name: string;
    href: string;
}

export interface SubCategory {
    name: string;
    href: string;
    items: SubCategoryItem[];
}

export interface TopSeller {
    name: string;
    image: string;
    price: string;
    originalPrice?: string;
    href: string;
}

export interface MegaMenuCategory {
    id: string;
    name: string;
    href: string;
    icon: string; // SVG path data
    viewBox: string;
    subCategories: SubCategory[];
    topSellers: TopSeller[];
    footerLink: {
        label: string;
        href: string;
    };
}

// SVG Icons as path data for inline rendering
export const MENU_ICONS = {
    windows: {
        viewBox: "0 0 448 448",
        path: "M 0,61.7 183.6,36.4 V 213.8 H 0 Z m 0,324.6 183.6,25.3 V 236.4 H 0 Z m 203.8,28 L 448,448 V 236.4 H 203.8 Z m 0,-380.6 V 213.8 H 448 V 0 Z"
    },
    office: {
        viewBox: "0 0 50 50",
        path: "M44.257,5.333l-12.412-3.3c-0.192-0.051-0.396-0.044-0.582,0.021l-25.588,8.8C5.271,10.993,5,11.373,5,11.8V36v1.2v1.065 v0.01c0,0.363,0.286,0.737,0.675,0.871l25.588,8.8C31.368,47.981,31.478,48,31.588,48c0.086,0,0.173-0.011,0.257-0.033l12.412-3.3 C44.695,44.55,45,44.153,45,43.7V6.3C45,5.847,44.695,5.45,44.257,5.333z M30,10.827v29.532L8.153,37.476l7.191-2.637 C15.738,34.695,16,34.32,16,33.9V13.715L30,10.827z"
    },
    servers: {
        viewBox: "0 0 448 448",
        path: "m64 0c-35.3 0-64 28.7-64 64v64c0 35.3 28.7 64 64 64h320c35.3 0 64-28.7 64-64v-64c0-35.3-28.7-64-64-64zm216 72c13.3 0 24 10.7 24 24s-10.7 24-24 24-24-10.7-24-24 10.7-24 24-24zm56 24c0-13.3 10.7-24 24-24s24 10.7 24 24-10.7 24-24 24-24-10.7-24-24zm-272 160c-35.3 0-64 28.7-64 64v64c0 35.3 28.7 64 64 64h320c35.3 0 64-28.7 64-64v-64c0-35.3-28.7-64-64-64zm216 72c13.3 0 24 10.7 24 24s-10.7 24-24 24-24-10.7-24-24 10.7-24 24-24zm56 24c0-13.3 10.7-24 24-24s24 10.7 24 24-10.7 24-24 24-24-10.7-24-24z"
    },
    antivirus: {
        viewBox: "0 0 480 509.2",
        path: "m239.9 0c4.6 0 9.2 1 13.4 2.9l188.4 79.9c22 9.3 38.4 31 38.3 57.2-0.5 99.2-41.3 280.7-213.6 363.2-16.7 8-36.1 8-52.8 0-172.4-82.5-213.1-264-213.6-363.2-0.1-26.2 16.3-47.9 38.3-57.2l188.3-79.9c4.2-1.9 8.7-2.9 13.3-2.9zm0 66.8v378.1c138-66.8 175.1-214.8 176-303.4l-176-74.6z"
    },
    programs: {
        viewBox: "0 0 640 448",
        path: "m384 64v224h-320v-224zm-320-64c-35.3 0-64 28.7-64 64v224c0 35.3 28.7 64 64 64h117.3l-10.7 32h-74.6c-17.7 0-32 14.3-32 32s14.3 32 32 32h256c17.7 0 32-14.3 32-32s-14.3-32-32-32h-74.7l-10.7-32h117.4c35.3 0 64-28.7 64-64v-224c0-35.3-28.7-64-64-64zm464 0c-26.5 0-48 21.5-48 48v352c0 26.5 21.5 48 48 48h64c26.5 0 48-21.5 48-48v-352c0-26.5-21.5-48-48-48zm16 64h32c8.8 0 16 7.2 16 16s-7.2 16-16 16h-32c-8.8 0-16-7.2-16-16s7.2-16 16-16zm-16 80c0-8.8 7.2-16 16-16h32c8.8 0 16 7.2 16 16s-7.2 16-16 16h-32c-8.8 0-16-7.2-16-16zm32 160a32 32 0 1 1 0 64 32 32 0 1 1 0-64z"
    },
    bundle: {
        viewBox: "0 0 512 512",
        path: "m190.5 68.8 34.8 59.2h-73.3c-22.1 0-40-17.9-40-40s17.9-40 40-40h2.2c14.9 0 28.8 7.9 36.3 20.8zm-126.5 19.2c0 14.4 3.5 28 9.6 40h-41.6c-17.7 0-32 14.3-32 32v64c0 17.7 14.3 32 32 32h448c17.7 0 32-14.3 32-32v-64c0-17.7-14.3-32-32-32h-41.6c6.1-12 9.6-25.6 9.6-40 0-48.6-39.4-88-88-88h-2.2c-31.9 0-61.5 16.9-77.7 44.4l-24.1 41.1-24.1-41c-16.2-27.6-45.8-44.5-77.7-44.5h-2.2c-48.6 0-88 39.4-88 88zm336 0c0 22.1-17.9 40-40 40h-73.3l34.8-59.2c7.6-12.9 21.4-20.8 36.3-20.8h2.2c22.1 0 40 17.9 40 40zm-368 200v176c0 26.5 21.5 48 48 48h144v-224zm256 224h144c26.5 0 48-21.5 48-48v-176h-192z"
    }
};

export const megaMenuCategories: MegaMenuCategory[] = [
    {
        id: 'operating-systems',
        name: 'Operating Systems',
        href: '/products?category=operating-systems',
        icon: MENU_ICONS.windows.path,
        viewBox: MENU_ICONS.windows.viewBox,
        subCategories: [
            {
                name: 'Windows 11',
                href: '/products?category=windows-11',
                items: [
                    { name: 'Windows 11 Pro', href: '/products/windows-11-pro' },
                    { name: 'Windows 11 Home', href: '/products/windows-11-home' },
                    { name: 'Windows 11 Pro N', href: '/products/windows-11-pro-n' },
                    { name: 'Windows 11 Enterprise', href: '/products/windows-11-enterprise' },
                    { name: 'Windows 11 Education', href: '/products/windows-11-education' },
                ]
            },
            {
                name: 'Windows 10',
                href: '/products?category=windows-10',
                items: [
                    { name: 'Windows 10 Pro', href: '/products/windows-10-pro' },
                    { name: 'Windows 10 Home', href: '/products/windows-10-home' },
                    { name: 'Windows 10 Pro N', href: '/products/windows-10-pro-n' },
                    { name: 'Windows 10 Enterprise', href: '/products/windows-10-enterprise' },
                    { name: 'Windows 10 Education', href: '/products/windows-10-education' },
                ]
            },
            {
                name: 'Windows 8',
                href: '/products?category=windows-8',
                items: [
                    { name: 'Windows 8.1 Pro', href: '/products/windows-8-pro' },
                    { name: 'Windows 8.1 Home', href: '/products/windows-8-home' },
                ]
            },
            {
                name: 'Windows 7',
                href: '/products?category=windows-7',
                items: [
                    { name: 'Windows 7 Professional', href: '/products/windows-7-pro' },
                    { name: 'Windows 7 Ultimate', href: '/products/windows-7-ultimate' },
                    { name: 'Windows 7 Home Premium', href: '/products/windows-7-home' },
                ]
            },
        ],
        topSellers: [
            { name: 'Windows 11 Pro', image: '/assets/products/win11-pro.png', price: '₹1,499', href: '/products/windows-11-pro' },
            { name: 'Windows 11 Home', image: '/assets/products/win11-home.png', price: '₹1,499', href: '/products/windows-11-home' },
            { name: 'Windows 10 Pro', image: '/assets/products/win10-pro.png', price: '₹999', href: '/products/windows-10-pro' },
        ],
        footerLink: { label: 'Shop Windows Licenses', href: '/products?category=operating-systems' }
    },
    {
        id: 'office-suites',
        name: 'Microsoft Office',
        href: '/products?category=office-suites',
        icon: MENU_ICONS.office.path,
        viewBox: MENU_ICONS.office.viewBox,
        subCategories: [
            {
                name: 'Office Suites',
                href: '/products?category=office-suites',
                items: [
                    { name: 'Microsoft Office 2024', href: '/products?category=office-2024' },
                    { name: 'Microsoft Office 2021', href: '/products?category=office-2021' },
                    { name: 'Microsoft Office 2019', href: '/products?category=office-2019' },
                    { name: 'Microsoft Office 2016', href: '/products?category=office-2016' },
                    { name: 'Microsoft Office 365', href: '/products?category=office-365' },
                ]
            },
            {
                name: 'Office for Mac',
                href: '/products?category=office-mac',
                items: [
                    { name: 'Office 2024 Mac', href: '/products/office-2024-mac' },
                    { name: 'Office 2021 Home & Business Mac', href: '/products/office-2021-mac' },
                    { name: 'Office 2019 Home & Business Mac', href: '/products/office-2019-mac' },
                ]
            },
            {
                name: 'Office Programs',
                href: '/products?category=office-programs',
                items: [
                    { name: 'Microsoft Word', href: '/products?category=microsoft-word' },
                    { name: 'Microsoft Excel', href: '/products?category=microsoft-excel' },
                    { name: 'Microsoft Outlook', href: '/products?category=microsoft-outlook' },
                    { name: 'Microsoft PowerPoint', href: '/products?category=microsoft-powerpoint' },
                    { name: 'Microsoft Access', href: '/products?category=microsoft-access' },
                ]
            },
            {
                name: 'Visual Studio',
                href: '/products?category=visual-studio',
                items: [
                    { name: 'Visual Studio 2022', href: '/products?category=vs-2022' },
                    { name: 'Visual Studio 2019', href: '/products?category=vs-2019' },
                    { name: 'Visual Studio 2017', href: '/products?category=vs-2017' },
                ]
            },
        ],
        topSellers: [
            { name: 'Office 2024 Professional Plus', image: '/assets/products/office-2024.png', price: '₹2,099', originalPrice: '₹21,999', href: '/products/office-2024-pro-plus' },
            { name: 'Office 2021 Professional Plus', image: '/assets/products/office-2021.png', price: '₹1,899', href: '/products/office-2021-pro-plus' },
            { name: 'Office 2024 Standard', image: '/assets/products/office-2024-std.png', price: '₹1,899', originalPrice: '₹20,999', href: '/products/office-2024-standard' },
        ],
        footerLink: { label: 'Microsoft Office Licenses', href: '/products?category=office-suites' }
    },
    {
        id: 'servers',
        name: 'Servers',
        href: '/products?category=servers',
        icon: MENU_ICONS.servers.path,
        viewBox: MENU_ICONS.servers.viewBox,
        subCategories: [
            {
                name: 'Windows Server',
                href: '/products?category=windows-server',
                items: [
                    { name: 'Windows Server 2025', href: '/products?category=server-2025' },
                    { name: 'Windows Server 2022', href: '/products?category=server-2022' },
                    { name: 'Windows Server 2019', href: '/products?category=server-2019' },
                    { name: 'Windows Server 2016', href: '/products?category=server-2016' },
                ]
            },
            {
                name: 'Windows Server RDS',
                href: '/products?category=server-rds',
                items: [
                    { name: 'Server RDS 2025', href: '/products?category=rds-2025' },
                    { name: 'Server RDS 2022', href: '/products?category=rds-2022' },
                    { name: 'Server RDS 2019', href: '/products?category=rds-2019' },
                ]
            },
            {
                name: 'SQL Server',
                href: '/products?category=sql-server',
                items: [
                    { name: 'SQL Server 2022', href: '/products?category=sql-2022' },
                    { name: 'SQL Server 2019', href: '/products?category=sql-2019' },
                    { name: 'SQL Server 2017', href: '/products?category=sql-2017' },
                ]
            },
            {
                name: 'Exchange Server',
                href: '/products?category=exchange-server',
                items: [
                    { name: 'Exchange Server 2019', href: '/products?category=exchange-2019' },
                    { name: 'Exchange Server 2016', href: '/products?category=exchange-2016' },
                ]
            },
        ],
        topSellers: [
            { name: 'SQL Server 2022 Standard', image: '/assets/products/sql-2022.png', price: '₹6,299', originalPrice: '₹84,999', href: '/products/sql-server-2022' },
            { name: 'Windows Server 2025 Standard', image: '/assets/products/server-2025.png', price: '₹3,299', href: '/products/server-2025-standard' },
            { name: 'Windows Server 2022 Standard', image: '/assets/products/server-2022.png', price: '₹2,499', href: '/products/server-2022-standard' },
        ],
        footerLink: { label: 'Shop Microsoft Server Licenses', href: '/products?category=servers' }
    },
    {
        id: 'antivirus',
        name: 'Antivirus',
        href: '/products?category=antivirus',
        icon: MENU_ICONS.antivirus.path,
        viewBox: MENU_ICONS.antivirus.viewBox,
        subCategories: [
            {
                name: 'Kaspersky',
                href: '/products?category=kaspersky',
                items: [
                    { name: 'Kaspersky Premium', href: '/products/kaspersky-premium' },
                    { name: 'Kaspersky Plus', href: '/products/kaspersky-plus' },
                    { name: 'Kaspersky Standard', href: '/products/kaspersky-standard' },
                ]
            },
            {
                name: 'Norton',
                href: '/products?category=norton',
                items: [
                    { name: 'Norton 360 Premium', href: '/products/norton-360-premium' },
                    { name: 'Norton 360 Deluxe', href: '/products/norton-360-deluxe' },
                    { name: 'Norton 360 Standard', href: '/products/norton-360-standard' },
                ]
            },
            {
                name: 'Bitdefender',
                href: '/products?category=bitdefender',
                items: [
                    { name: 'Bitdefender Total Security', href: '/products/bitdefender-total' },
                    { name: 'Bitdefender Internet Security', href: '/products/bitdefender-internet' },
                ]
            },
            {
                name: 'Other Brands',
                href: '/products?category=antivirus',
                items: [
                    { name: 'Avast', href: '/products?category=avast' },
                    { name: 'AVG', href: '/products?category=avg' },
                    { name: 'ESET', href: '/products?category=eset' },
                    { name: 'McAfee', href: '/products?category=mcafee' },
                ]
            },
        ],
        topSellers: [
            { name: 'Avast Ultimate Suite', image: '/assets/products/avast.png', price: '₹2,499 – ₹8,399', href: '/products/avast-ultimate' },
            { name: 'Kaspersky Premium', image: '/assets/products/kaspersky.png', price: '₹3,749 – ₹7,499', href: '/products/kaspersky-premium' },
            { name: 'Norton 360 Premium', image: '/assets/products/norton.png', price: '₹3,299', originalPrice: '₹10,899', href: '/products/norton-360-premium' },
        ],
        footerLink: { label: 'Shop Antivirus Licenses', href: '/products?category=antivirus' }
    },
    {
        id: 'computer-programs',
        name: 'Computer Programs',
        href: '/products?category=design-software',
        icon: MENU_ICONS.programs.path,
        viewBox: MENU_ICONS.programs.viewBox,
        subCategories: [
            {
                name: 'Autodesk',
                href: '/products?category=autodesk',
                items: [
                    { name: 'AutoCAD', href: '/products/autocad' },
                    { name: 'Revit', href: '/products/revit' },
                    { name: '3ds Max', href: '/products/3ds-max' },
                ]
            },
            {
                name: 'Corel',
                href: '/products?category=corel',
                items: [
                    { name: 'CorelDRAW', href: '/products/coreldraw' },
                    { name: 'Corel Painter', href: '/products/corel-painter' },
                ]
            },
            {
                name: 'VMware',
                href: '/products?category=vmware',
                items: [
                    { name: 'VMware Workstation Pro', href: '/products/vmware-workstation' },
                    { name: 'VMware Fusion', href: '/products/vmware-fusion' },
                ]
            },
            {
                name: 'Utilities',
                href: '/products?category=utilities',
                items: [
                    { name: 'Parallels Desktop', href: '/products/parallels' },
                    { name: 'AOMEI Backupper', href: '/products/aomei' },
                    { name: 'EaseUS', href: '/products/easeus' },
                    { name: 'Ashampoo', href: '/products/ashampoo' },
                ]
            },
        ],
        topSellers: [
            { name: 'Ashampoo 3D CAD Professional', image: '/assets/products/ashampoo-cad.png', price: '₹4,199', originalPrice: '₹8,399', href: '/products/ashampoo-3d-cad' },
            { name: 'CorelDRAW 2021 Standard', image: '/assets/products/coreldraw.png', price: '₹4,199', originalPrice: '₹16,799', href: '/products/coreldraw-2021' },
            { name: 'VMware Workstation 17.5 Pro', image: '/assets/products/vmware.png', price: '₹1,249 – ₹2,899', href: '/products/vmware-workstation' },
        ],
        footerLink: { label: 'Shop Computer Programs', href: '/products?category=design-software' }
    },
    {
        id: 'bundle',
        name: 'Bundle',
        href: '/products?category=bundles',
        icon: MENU_ICONS.bundle.path,
        viewBox: MENU_ICONS.bundle.viewBox,
        subCategories: [],
        topSellers: [],
        footerLink: { label: 'Shop Bundle Offers', href: '/products?category=bundles' }
    }
];

// Currency options for the top bar
export const currencies = [
    { code: 'INR', symbol: '₹', name: 'Indian Rupee' },
    { code: 'USD', symbol: '$', name: 'US Dollar' },
    { code: 'EUR', symbol: '€', name: 'Euro' },
    { code: 'GBP', symbol: '£', name: 'British Pound' },
];

// Language options for the top bar
export const languages = [
    { code: 'en', name: 'English', flag: '🇺🇸' },
    { code: 'hi', name: 'हिंदी', flag: '🇮🇳' },
];
