import Link from 'next/link';
import { FileText, ArrowRight } from 'lucide-react';

export const metadata = {
    title: 'Installation Guides | SimplySolutions',
    description: 'Step-by-step installation guides for Microsoft Office, Windows, and other software products',
};

const guides = [
    {
        title: 'Microsoft Office 365 Pro Plus',
        description: 'Complete installation and activation guide for Office 365',
        href: '/installation-docs/office365',
        category: 'Microsoft Office',
    },
    {
        title: 'Microsoft Office 2024 LTSC (Windows)',
        description: 'Installation guide for Office 2024 Professional Plus on Windows',
        href: '/installation-docs/office2024win',
        category: 'Microsoft Office',
    },
    {
        title: 'Microsoft Office 2024 LTSC (Mac)',
        description: 'Installation guide for Office 2024 Standard on macOS',
        href: '/installation-docs/office2024mac',
        category: 'Microsoft Office',
    },
    {
        title: 'Microsoft Office 2021 Professional Plus',
        description: 'Installation and phone activation guide for Office 2021',
        href: '/installation-docs/office2021',
        category: 'Microsoft Office',
    },
    {
        title: 'Microsoft Office 2019 Professional Plus',
        description: 'Installation and troubleshooting guide for Office 2019',
        href: '/installation-docs/office2019',
        category: 'Microsoft Office',
    },
    {
        title: 'Microsoft Office 2016 Professional Plus',
        description: 'Installation and phone activation guide for Office 2016',
        href: '/installation-docs/office2016',
        category: 'Microsoft Office',
    },
    {
        title: 'Windows 10/11 Pro (Upgrade from Home)',
        description: 'Upgrade your Windows Home edition to Professional',
        href: '/installation-docs/win10_11pro_upgrade',
        category: 'Windows',
    },
    {
        title: 'Windows 10/11 Professional',
        description: 'Fresh installation and activation guide for Windows Pro',
        href: '/installation-docs/win10_11pro',
        category: 'Windows',
    },
    {
        title: 'Windows 10/11 Enterprise',
        description: 'Installation and upgrade guide for Windows Enterprise edition',
        href: '/installation-docs/win11ent',
        category: 'Windows',
    },
    {
        title: 'Windows 11 Pro + Office 2021 Combo',
        description: 'Complete guide for Windows 11 Pro and Office 2021 combo pack',
        href: '/installation-docs/win11-pp2021_combo',
        category: 'Combo Packs',
    },
    {
        title: 'Windows 11 Pro + Office 2024 Combo',
        description: 'Complete guide for Windows 11 Pro and Office 2024 combo pack',
        href: '/installation-docs/win11-pp2024_combo',
        category: 'Combo Packs',
    },
    {
        title: 'Autodesk AutoCAD',
        description: 'Subscription activation guide for AutoCAD',
        href: '/installation-docs/autocad',
        category: 'Autodesk',
    },
    {
        title: 'Canva Pro Lifetime',
        description: 'Activation guide for Canva Pro Lifetime subscription',
        href: '/installation-docs/canva',
        category: 'Design & Graphics',
    },
    {
        title: 'Adobe Acrobat Pro 2024',
        description: 'Installation and activation guide for Adobe Acrobat Pro 2024',
        href: '/installation-docs/acrobat2024',
        category: 'Productivity',
    },
];

export default function InstallationDocsPage() {
    return (
        <div className="min-h-screen bg-gradient-to-b from-background to-muted/30">
            <div className="container max-w-4xl py-12 mx-auto px-4">
                <div className="text-center mb-12">
                    <h1 className="text-3xl md:text-4xl font-bold mb-4">
                        Installation Guides
                    </h1>
                    <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                        Step-by-step tutorials to help you install and activate your software products
                    </p>
                </div>

                <div className="grid gap-4">
                    {guides.map((guide) => (
                        <Link key={guide.href} href={guide.href}>
                            <div className="group bg-card border rounded-xl p-6 hover:border-primary/50 hover:shadow-md transition-all cursor-pointer">
                                <div className="flex items-start gap-4">
                                    <div className="p-3 rounded-lg bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                                        <FileText className="h-6 w-6" />
                                    </div>
                                    <div className="flex-1">
                                        <div className="text-xs text-muted-foreground mb-1">{guide.category}</div>
                                        <h2 className="text-lg font-semibold group-hover:text-primary transition-colors">{guide.title}</h2>
                                        <p className="text-sm text-muted-foreground mt-1">{guide.description}</p>
                                    </div>
                                    <ArrowRight className="h-5 w-5 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
                                </div>
                            </div>
                        </Link>
                    ))}
                </div>

                <div className="mt-12 text-center">
                    <p className="text-muted-foreground">
                        Can't find what you're looking for?{' '}
                        <a href="https://wa.me/919953994557" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                            Contact our support team
                        </a>
                    </p>
                </div>
            </div>
        </div>
    );
}
