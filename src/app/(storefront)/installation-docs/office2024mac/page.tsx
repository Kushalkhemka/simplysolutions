import Image from 'next/image';
import Link from 'next/link';
import { ArrowLeft, Download, AlertCircle, CheckCircle, Info, ExternalLink, Apple } from 'lucide-react';
import { Button } from '@/components/ui/button';

export const metadata = {
    title: 'Microsoft Office 2024 LTSC for Mac Installation Guide | SimplySolutions',
    description: 'Complete step-by-step guide to install and activate Microsoft Office 2024 LTSC Standard for macOS',
};

export default function Office2024MacGuidePage() {
    return (
        <div className="min-h-screen bg-gradient-to-br from-background via-blue-50/30 dark:via-blue-950/10 to-background">
            <div className="container max-w-5xl py-10 px-4 mx-auto">
                {/* Header */}
                <div className="mb-10">
                    <Link href="/installation-docs" className="inline-flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors mb-6">
                        <ArrowLeft className="h-4 w-4" />
                        Back to Installation Docs
                    </Link>
                    <div className="text-center">
                        <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-gradient-to-r from-blue-500 to-indigo-500 text-white text-sm font-medium rounded-full mb-4">
                            <Apple className="h-4 w-4" />
                            macOS Guide
                        </div>
                        <h1 className="text-4xl md:text-5xl font-bold mb-3 bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                            MS OFFICE 2024 LTSC STANDARD FOR MAC
                        </h1>
                        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                            Follow these simple instructions for a smooth installation and activation on macOS.
                        </p>
                    </div>
                </div>

                {/* Important Notice */}
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/40 dark:to-indigo-950/40 border border-blue-200 dark:border-blue-800 rounded-2xl p-6 mb-10 flex gap-4">
                    <AlertCircle className="h-6 w-6 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                    <div>
                        <p className="font-bold text-blue-800 dark:text-blue-200 text-lg">Before You Begin</p>
                        <p className="text-blue-700 dark:text-blue-300">You must uninstall all old office versions using the official removal tool. This ensures a clean installation without conflicts.</p>
                    </div>
                </div>

                {/* Steps */}
                <div className="space-y-8">
                    {/* Step 1: Uninstall */}
                    <div className="bg-card border rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow">
                        <div className="flex items-start gap-4 mb-5">
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-500 text-white flex items-center justify-center font-bold text-lg shadow-lg">1</div>
                            <div>
                                <h2 className="text-2xl font-bold">Uninstall Previous Office Versions</h2>
                                <p className="text-muted-foreground">Download and run the official Microsoft Office removal tool for Mac</p>
                            </div>
                        </div>
                        <div className="ml-14">
                            <a href="https://bit.ly/uninstalloffice-mac" target="_blank" rel="noopener noreferrer">
                                <Button size="lg" className="gap-2 bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 text-white shadow-lg">
                                    <Download className="h-5 w-5" />
                                    Download Removal Tool for Mac
                                </Button>
                            </a>
                            <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-950/30 rounded-xl border border-blue-200 dark:border-blue-800 flex gap-3">
                                <Info className="h-5 w-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                                <p className="text-sm text-blue-700 dark:text-blue-300">If you face issues downloading, try using <strong>Incognito Mode</strong> or a different browser.</p>
                            </div>
                        </div>
                    </div>

                    {/* Step 2: Run Removal Tool */}
                    <div className="bg-card border rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow">
                        <div className="flex items-start gap-4 mb-5">
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-500 text-white flex items-center justify-center font-bold text-lg shadow-lg">2</div>
                            <div>
                                <h2 className="text-2xl font-bold">Run the Removal Tool</h2>
                                <p className="text-muted-foreground">Run the office license removal tool for Mac and follow on-screen instructions</p>
                            </div>
                        </div>
                        <div className="ml-14">
                            <div className="relative w-full max-w-lg mx-auto rounded-xl overflow-hidden border shadow-lg">
                                <Image
                                    src="https://api.simplysolutions.co.in/storage/v1/object/public/product-assets/installation-guide-images/mac-Office-Issue-using-License-Removal-Tool.webp"
                                    alt="Office Removal Tool for Mac"
                                    width={500}
                                    height={350}
                                    className="w-full h-auto"
                                    unoptimized
                                />
                            </div>
                            <div className="mt-4 relative w-full max-w-lg mx-auto rounded-xl overflow-hidden border shadow-lg">
                                <Image
                                    src="https://api.simplysolutions.co.in/storage/v1/object/public/product-assets/installation-guide-images/c6e7669c-f638-40a8-99c1-fc0fb16d8805.png"
                                    alt="Follow on-screen instructions"
                                    width={500}
                                    height={350}
                                    className="w-full h-auto"
                                    unoptimized
                                />
                            </div>
                        </div>
                    </div>

                    {/* Step 3: Download Office 2024 for Mac */}
                    <div className="bg-card border rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow">
                        <div className="flex items-start gap-4 mb-5">
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-500 text-white flex items-center justify-center font-bold text-lg shadow-lg">3</div>
                            <div>
                                <h2 className="text-2xl font-bold">Download Office 2024 for Mac</h2>
                                <p className="text-muted-foreground">Download the Office 2024 installer package and serializer</p>
                            </div>
                        </div>
                        <div className="ml-14 space-y-4">
                            <div className="flex flex-wrap gap-4">
                                <a href="https://tinyurl.com/office2024-mac" target="_blank" rel="noopener noreferrer">
                                    <Button size="lg" className="gap-2 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white shadow-lg">
                                        <Download className="h-5 w-5" />
                                        Download Installer (2.43 GB)
                                    </Button>
                                </a>
                                <a href="https://tinyurl.com/office24-serializer" target="_blank" rel="noopener noreferrer">
                                    <Button size="lg" variant="outline" className="gap-2 border-2 border-blue-400 text-blue-700 hover:bg-blue-50 dark:border-blue-600 dark:text-blue-300">
                                        <Download className="h-5 w-5" />
                                        Download Serializer (9 MB)
                                    </Button>
                                </a>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                                <div className="space-y-2">
                                    <p className="font-medium text-sm text-muted-foreground">FOR SERIALIZER:</p>
                                    <div className="relative rounded-xl overflow-hidden border shadow-lg">
                                        <Image
                                            src="https://api.simplysolutions.co.in/storage/v1/object/public/product-assets/installation-guide-images/Screenshot-2024-12-07-225840.png"
                                            alt="Download Serializer"
                                            width={350}
                                            height={250}
                                            className="w-full h-auto"
                                            unoptimized
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <p className="font-medium text-sm text-muted-foreground">FOR INSTALLER.PKG:</p>
                                    <div className="relative rounded-xl overflow-hidden border shadow-lg">
                                        <Image
                                            src="https://api.simplysolutions.co.in/storage/v1/object/public/product-assets/installation-guide-images/Screenshot-2024-12-07-225747.png"
                                            alt="Download Installer"
                                            width={350}
                                            height={250}
                                            className="w-full h-auto"
                                            unoptimized
                                        />
                                    </div>
                                </div>
                            </div>
                            <div className="p-4 bg-amber-50 dark:bg-amber-950/30 rounded-xl border border-amber-200 dark:border-amber-800 flex gap-3">
                                <AlertCircle className="h-5 w-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
                                <p className="text-sm text-amber-700 dark:text-amber-300"><strong>Note:</strong> If you face issues unzipping the downloaded file, you can download an unzipper tool from the <strong>Apple App Store</strong>.</p>
                            </div>
                            <div className="relative w-full max-w-md mx-auto rounded-xl overflow-hidden border shadow-lg">
                                <Image
                                    src="https://api.simplysolutions.co.in/storage/v1/object/public/product-assets/installation-guide-images/Whats-App-Image-2024-07-22-at-09-51-25-b5f54657.jpg"
                                    alt="Unzip Issue"
                                    width={350}
                                    height={200}
                                    className="w-full h-auto"
                                    unoptimized
                                />
                            </div>
                        </div>
                    </div>

                    {/* Step 4: Extract and Open */}
                    <div className="bg-card border rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow">
                        <div className="flex items-start gap-4 mb-5">
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-500 text-white flex items-center justify-center font-bold text-lg shadow-lg">4</div>
                            <div>
                                <h2 className="text-2xl font-bold">Extract and Open the Downloaded Files</h2>
                                <p className="text-muted-foreground">After extracting the downloaded ZIP file, open the extracted folder</p>
                            </div>
                        </div>
                        <div className="ml-14">
                            <div className="relative w-full max-w-lg mx-auto rounded-xl overflow-hidden border shadow-lg">
                                <Image
                                    src="https://api.simplysolutions.co.in/storage/v1/object/public/product-assets/installation-guide-images/Screenshot-2024-07-16-010206.png"
                                    alt="Extracted Files"
                                    width={500}
                                    height={300}
                                    className="w-full h-auto"
                                    unoptimized
                                />
                            </div>
                        </div>
                    </div>

                    {/* Step 5: Run Installer */}
                    <div className="bg-card border rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow">
                        <div className="flex items-start gap-4 mb-5">
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-500 text-white flex items-center justify-center font-bold text-lg shadow-lg">5</div>
                            <div>
                                <h2 className="text-2xl font-bold">Run the Installer Package</h2>
                                <p className="text-muted-foreground">Double-click on <strong>installer.pkg</strong> (~2.43 GB) and follow on-screen instructions</p>
                            </div>
                        </div>
                        <div className="ml-14 grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="relative rounded-xl overflow-hidden border shadow-lg">
                                <Image
                                    src="https://api.simplysolutions.co.in/storage/v1/object/public/product-assets/installation-guide-images/Screenshot-2024-07-16-010101.png"
                                    alt="Run Installer"
                                    width={350}
                                    height={250}
                                    className="w-full h-auto"
                                    unoptimized
                                />
                            </div>
                            <div className="relative rounded-xl overflow-hidden border shadow-lg">
                                <Image
                                    src="https://api.simplysolutions.co.in/storage/v1/object/public/product-assets/installation-guide-images/Screenshot-2024-07-16-010932.png"
                                    alt="Installation Progress"
                                    width={350}
                                    height={250}
                                    className="w-full h-auto"
                                    unoptimized
                                />
                            </div>
                        </div>
                    </div>

                    {/* Step 6: Run Serializer */}
                    <div className="bg-card border rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow">
                        <div className="flex items-start gap-4 mb-5">
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-500 text-white flex items-center justify-center font-bold text-lg shadow-lg">6</div>
                            <div>
                                <h2 className="text-2xl font-bold">Run the Serializer to Activate</h2>
                                <p className="text-muted-foreground">Double-click on <strong>Microsoft_Office_Preview_Serializer.pkg</strong> (~9 MB) and follow instructions</p>
                            </div>
                        </div>
                        <div className="ml-14 grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="relative rounded-xl overflow-hidden border shadow-lg">
                                <Image
                                    src="https://api.simplysolutions.co.in/storage/v1/object/public/product-assets/installation-guide-images/Screenshot-2024-07-16-010207.png"
                                    alt="Run Serializer"
                                    width={350}
                                    height={250}
                                    className="w-full h-auto"
                                    unoptimized
                                />
                            </div>
                            <div className="relative rounded-xl overflow-hidden border shadow-lg">
                                <Image
                                    src="https://api.simplysolutions.co.in/storage/v1/object/public/product-assets/installation-guide-images/Screenshot-2024-07-16-011240.png"
                                    alt="Serializer Installation"
                                    width={350}
                                    height={250}
                                    className="w-full h-auto"
                                    unoptimized
                                />
                            </div>
                        </div>
                    </div>

                    {/* Step 7: Success */}
                    <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950/40 dark:to-emerald-950/40 border-2 border-green-300 dark:border-green-700 rounded-2xl p-6 shadow-lg">
                        <div className="flex items-start gap-4 mb-5">
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-green-500 to-emerald-500 text-white flex items-center justify-center font-bold text-lg shadow-lg">
                                <CheckCircle className="h-6 w-6" />
                            </div>
                            <div>
                                <h2 className="text-2xl font-bold text-green-800 dark:text-green-200">Voila! Office 2024 is Activated!</h2>
                                <p className="text-green-700 dark:text-green-300">Your Office LTSC 2024 Preview for Mac is now activated for lifetime!</p>
                            </div>
                        </div>
                    </div>

                    {/* Step 8: Verify Activation */}
                    <div className="bg-card border rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow">
                        <div className="flex items-start gap-4 mb-5">
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-500 text-white flex items-center justify-center font-bold text-lg shadow-lg">7</div>
                            <div>
                                <h2 className="text-2xl font-bold">Verify Your Activation</h2>
                                <p className="text-muted-foreground">Open any MS Office app (e.g., Excel) → Click on <strong>Excel</strong> (top left) → Click <strong>About Excel</strong> to see licensing details</p>
                            </div>
                        </div>
                        <div className="ml-14 grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="relative rounded-xl overflow-hidden border shadow-lg">
                                <Image
                                    src="https://api.simplysolutions.co.in/storage/v1/object/public/product-assets/installation-guide-images/Screenshot-2024-07-16-011313.png"
                                    alt="About Excel Menu"
                                    width={350}
                                    height={250}
                                    className="w-full h-auto"
                                    unoptimized
                                />
                            </div>
                            <div className="relative rounded-xl overflow-hidden border shadow-lg">
                                <Image
                                    src="https://api.simplysolutions.co.in/storage/v1/object/public/product-assets/installation-guide-images/Screenshot-2024-07-16-011429.png"
                                    alt="Office Activated - Licensing Details"
                                    width={350}
                                    height={250}
                                    className="w-full h-auto"
                                    unoptimized
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Warranty Registration */}
                <div className="mt-8 bg-gradient-to-r from-green-50 to-teal-50 dark:from-green-950/30 dark:to-teal-950/30 border-2 border-green-300 dark:border-green-700 rounded-2xl p-6">
                    <div className="flex gap-4">
                        <CheckCircle className="h-6 w-6 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
                        <div>
                            <p className="font-bold text-green-800 dark:text-green-200 text-lg mb-2">Register Your Warranty</p>
                            <p className="text-green-700 dark:text-green-300 mb-3">Register your warranty to receive <strong>lifetime technical and reinstallation support</strong>. We also offer <strong>remote desktop support via AnyDesk</strong> if you face issues!</p>
                            <a href="/digital-warranty" className="inline-block">
                                <Button variant="outline" className="gap-2 border-green-400 text-green-700 hover:bg-green-100 dark:border-green-600 dark:text-green-300 dark:hover:bg-green-900/50">
                                    <ExternalLink className="h-4 w-4" />
                                    Register Warranty
                                </Button>
                            </a>
                        </div>
                    </div>
                </div>

                {/* Support */}
                <div className="mt-8 text-center bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-900/50 dark:to-gray-800/50 rounded-2xl p-8 border">
                    <p className="text-lg text-muted-foreground mb-4">In case of any error or query, feel free to reach out to us!</p>
                    <div className="flex flex-wrap justify-center gap-4">
                        <a href="https://wa.me/918595899215" target="_blank" rel="noopener noreferrer">
                            <Button size="lg" className="gap-2 bg-green-600 hover:bg-green-700 text-white">
                                <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" /></svg>
                                WhatsApp: +91-8595899215
                            </Button>
                        </a>
                        <a href="mailto:support@simplysolutions.co.in">
                            <Button size="lg" variant="outline" className="gap-2 border-2">
                                <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" /><polyline points="22,6 12,13 2,6" /></svg>
                                support@simplysolutions.co.in
                            </Button>
                        </a>
                    </div>
                </div>
            </div>
        </div>
    );
}
