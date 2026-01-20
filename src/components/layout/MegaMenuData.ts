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
                href: '/products?search=Windows+11',
                items: [
                    { name: 'Windows 11 Pro', href: '/products?search=Windows+11+Pro' },
                    { name: 'Windows 11 Home', href: '/products?search=Windows+11+Home' },
                    { name: 'Windows 11 Pro N', href: '/products?search=Windows+11+Pro+N' },
                    { name: 'Windows 11 Enterprise', href: '/products?search=Windows+11+Enterprise' },
                    { name: 'Windows 11 Education', href: '/products?search=Windows+11+Education' },
                ]
            },
            {
                name: 'Windows 10',
                href: '/products?search=Windows+10',
                items: [
                    { name: 'Windows 10 Pro', href: '/products?search=Windows+10+Pro' },
                    { name: 'Windows 10 Home', href: '/products?search=Windows+10+Home' },
                    { name: 'Windows 10 Pro N', href: '/products?search=Windows+10+Pro+N' },
                    { name: 'Windows 10 Enterprise', href: '/products?search=Windows+10+Enterprise' },
                    { name: 'Windows 10 Education', href: '/products?search=Windows+10+Education' },
                ]
            },
            {
                name: 'Windows 8',
                href: '/products?search=Windows+8',
                items: [
                    { name: 'Windows 8.1 Pro', href: '/products?search=Windows+8+Pro' },
                    { name: 'Windows 8.1 Home', href: '/products?search=Windows+8+Home' },
                ]
            },
            {
                name: 'Windows 7',
                href: '/products?search=Windows+7',
                items: [
                    { name: 'Windows 7 Professional', href: '/products?search=Windows+7+Professional' },
                    { name: 'Windows 7 Ultimate', href: '/products?search=Windows+7+Ultimate' },
                    { name: 'Windows 7 Home', href: '/products?search=Windows+7+Home' },
                ]
            },
        ],
        topSellers: [
            { name: 'Windows 11 Pro', image: '/assets/products/win11-pro.png', price: '₹1,499', href: '/products?search=Windows+11+Pro' },
            { name: 'Windows 11 Home', image: '/assets/products/win11-home.png', price: '₹1,499', href: '/products?search=Windows+11+Home' },
            { name: 'Windows 10 Pro', image: '/assets/products/win10-pro.png', price: '₹999', href: '/products?search=Windows+10+Pro' },
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
                href: '/products?search=Office',
                items: [
                    { name: 'Microsoft Office 2024', href: '/products?search=Office+2024' },
                    { name: 'Microsoft Office 2021', href: '/products?search=Office+2021' },
                    { name: 'Microsoft Office 2019', href: '/products?search=Office+2019' },
                    { name: 'Microsoft Office 2016', href: '/products?search=Office+2016' },
                    { name: 'Microsoft Office 365', href: '/products?search=Office+365' },
                ]
            },
            {
                name: 'Office for Mac',
                href: '/products?search=Office+Mac',
                items: [
                    { name: 'Office 2024 Mac', href: '/products?search=Office+2024+Mac' },
                    { name: 'Office 2021 Home & Business Mac', href: '/products?search=Office+2021+Mac' },
                    { name: 'Office 2019 Home & Business Mac', href: '/products?search=Office+2019+Mac' },
                ]
            },
            {
                name: 'Office Programs',
                href: '/products?search=Office',
                items: [
                    { name: 'Microsoft Word', href: '/products?search=Word' },
                    { name: 'Microsoft Excel', href: '/products?search=Excel' },
                    { name: 'Microsoft Outlook', href: '/products?search=Outlook' },
                    { name: 'Microsoft PowerPoint', href: '/products?search=PowerPoint' },
                    { name: 'Microsoft Access', href: '/products?search=Access' },
                ]
            },
            {
                name: 'Visual Studio',
                href: '/products?search=Visual+Studio',
                items: [
                    { name: 'Visual Studio 2022', href: '/products?search=Visual+Studio+2022' },
                    { name: 'Visual Studio 2019', href: '/products?search=Visual+Studio+2019' },
                    { name: 'Visual Studio 2017', href: '/products?search=Visual+Studio+2017' },
                ]
            },
        ],
        topSellers: [
            { name: 'Office 2024 Professional Plus', image: '/assets/products/office-2024.png', price: '₹2,099', originalPrice: '₹21,999', href: '/products?search=Office+2024+Professional' },
            { name: 'Office 2021 Professional Plus', image: '/assets/products/office-2021.png', price: '₹1,899', href: '/products?search=Office+2021+Professional' },
            { name: 'Office 2024 Standard', image: '/assets/products/office-2024-std.png', price: '₹1,899', originalPrice: '₹20,999', href: '/products?search=Office+2024+Standard' },
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
                href: '/products?search=Windows+Server',
                items: [
                    { name: 'Windows Server 2025', href: '/products?search=Server+2025' },
                    { name: 'Windows Server 2022', href: '/products?search=Server+2022' },
                    { name: 'Windows Server 2019', href: '/products?search=Server+2019' },
                    { name: 'Windows Server 2016', href: '/products?search=Server+2016' },
                ]
            },
            {
                name: 'Windows Server RDS',
                href: '/products?search=RDS',
                items: [
                    { name: 'Server RDS 2025', href: '/products?search=RDS+2025' },
                    { name: 'Server RDS 2022', href: '/products?search=RDS+2022' },
                    { name: 'Server RDS 2019', href: '/products?search=RDS+2019' },
                ]
            },
            {
                name: 'SQL Server',
                href: '/products?search=SQL+Server',
                items: [
                    { name: 'SQL Server 2022', href: '/products?search=SQL+Server+2022' },
                    { name: 'SQL Server 2019', href: '/products?search=SQL+Server+2019' },
                    { name: 'SQL Server 2017', href: '/products?search=SQL+Server+2017' },
                ]
            },
            {
                name: 'Exchange Server',
                href: '/products?search=Exchange+Server',
                items: [
                    { name: 'Exchange Server 2019', href: '/products?search=Exchange+2019' },
                    { name: 'Exchange Server 2016', href: '/products?search=Exchange+2016' },
                ]
            },
        ],
        topSellers: [
            { name: 'SQL Server 2022 Standard', image: '/assets/products/sql-2022.png', price: '₹6,299', originalPrice: '₹84,999', href: '/products?search=SQL+Server+2022' },
            { name: 'Windows Server 2025 Standard', image: '/assets/products/server-2025.png', price: '₹3,299', href: '/products?search=Server+2025' },
            { name: 'Windows Server 2022 Standard', image: '/assets/products/server-2022.png', price: '₹2,499', href: '/products?search=Server+2022' },
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
                href: '/products?search=Kaspersky',
                items: [
                    { name: 'Kaspersky Premium', href: '/products?search=Kaspersky+Premium' },
                    { name: 'Kaspersky Plus', href: '/products?search=Kaspersky+Plus' },
                    { name: 'Kaspersky Standard', href: '/products?search=Kaspersky+Standard' },
                ]
            },
            {
                name: 'Norton',
                href: '/products?search=Norton',
                items: [
                    { name: 'Norton 360 Premium', href: '/products?search=Norton+360+Premium' },
                    { name: 'Norton 360 Deluxe', href: '/products?search=Norton+360+Deluxe' },
                    { name: 'Norton 360 Standard', href: '/products?search=Norton+360+Standard' },
                ]
            },
            {
                name: 'Bitdefender',
                href: '/products?search=Bitdefender',
                items: [
                    { name: 'Bitdefender Total Security', href: '/products?search=Bitdefender+Total' },
                    { name: 'Bitdefender Internet Security', href: '/products?search=Bitdefender+Internet' },
                ]
            },
            {
                name: 'Other Brands',
                href: '/products?search=Antivirus',
                items: [
                    { name: 'Avast', href: '/products?search=Avast' },
                    { name: 'AVG', href: '/products?search=AVG' },
                    { name: 'ESET', href: '/products?search=ESET' },
                    { name: 'McAfee', href: '/products?search=McAfee' },
                ]
            },
        ],
        topSellers: [
            { name: 'Avast Ultimate Suite', image: '/assets/products/avast.png', price: '₹2,499 – ₹8,399', href: '/products?search=Avast+Ultimate' },
            { name: 'Kaspersky Premium', image: '/assets/products/kaspersky.png', price: '₹3,749 – ₹7,499', href: '/products?search=Kaspersky+Premium' },
            { name: 'Norton 360 Premium', image: '/assets/products/norton.png', price: '₹3,299', originalPrice: '₹10,899', href: '/products?search=Norton+360+Premium' },
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
                href: '/products?search=Autodesk',
                items: [
                    { name: 'AutoCAD', href: '/products?search=AutoCAD' },
                    { name: 'Revit', href: '/products?search=Revit' },
                    { name: '3ds Max', href: '/products?search=3ds+Max' },
                ]
            },
            {
                name: 'Corel',
                href: '/products?search=Corel',
                items: [
                    { name: 'CorelDRAW', href: '/products?search=CorelDRAW' },
                    { name: 'Corel Painter', href: '/products?search=Corel+Painter' },
                ]
            },
            {
                name: 'VMware',
                href: '/products?search=VMware',
                items: [
                    { name: 'VMware Workstation Pro', href: '/products?search=VMware+Workstation' },
                    { name: 'VMware Fusion', href: '/products?search=VMware+Fusion' },
                ]
            },
            {
                name: 'Utilities',
                href: '/products?search=Utilities',
                items: [
                    { name: 'Parallels Desktop', href: '/products?search=Parallels' },
                    { name: 'AOMEI Backupper', href: '/products?search=AOMEI' },
                    { name: 'EaseUS', href: '/products?search=EaseUS' },
                    { name: 'Ashampoo', href: '/products?search=Ashampoo' },
                ]
            },
        ],
        topSellers: [
            { name: 'Ashampoo 3D CAD Professional', image: '/assets/products/ashampoo-cad.png', price: '₹4,199', originalPrice: '₹8,399', href: '/products?search=Ashampoo+CAD' },
            { name: 'CorelDRAW 2021 Standard', image: '/assets/products/coreldraw.png', price: '₹4,199', originalPrice: '₹16,799', href: '/products?search=CorelDRAW' },
            { name: 'VMware Workstation 17.5 Pro', image: '/assets/products/vmware.png', price: '₹1,249 – ₹2,899', href: '/products?search=VMware+Workstation' },
        ],
        footerLink: { label: 'Shop Computer Programs', href: '/products?category=design-software' }
    },
    {
        id: 'bundle',
        name: 'Bundle',
        href: '/bundles',
        icon: MENU_ICONS.bundle.path,
        viewBox: MENU_ICONS.bundle.viewBox,
        subCategories: [],
        topSellers: [],
        footerLink: { label: 'Shop Bundle Offers', href: '/bundles' }
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
