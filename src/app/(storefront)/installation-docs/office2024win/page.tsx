import Image from 'next/image';
import Link from 'next/link';
import { ArrowLeft, Download, AlertCircle, CheckCircle, Key } from 'lucide-react';
import { Button } from '@/components/ui/button';

export const metadata = {
    title: 'Microsoft Office 2024 LTSC Installation Guide | SimplySolutions',
    description: 'Complete step-by-step guide to install and activate Microsoft Office 2024 LTSC Professional Plus on Windows',
};

export default function Office2024WinGuidePage() {
    return (
        <div className="min-h-screen bg-gradient-to-b from-background to-muted/30">
            <div className="container max-w-4xl py-8">
                {/* Header */}
                <div className="mb-8">
                    <Link href="/installation-docs" className="inline-flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors mb-4">
                        <ArrowLeft className="h-4 w-4" />
                        Back to Installation Docs
                    </Link>
                    <h1 className="text-3xl md:text-4xl font-bold mb-2">
                        MS OFFICE 2024 LTSC PROFESSIONAL PLUS
                    </h1>
                    <p className="text-lg text-muted-foreground">Complete Installation Tutorial for Windows</p>
                </div>

                {/* Important Notice */}
                <div className="bg-orange-50 dark:bg-orange-950/30 border border-orange-200 dark:border-orange-900 rounded-lg p-4 mb-8 flex gap-3">
                    <AlertCircle className="h-5 w-5 text-orange-600 flex-shrink-0 mt-0.5" />
                    <div>
                        <p className="font-semibold text-orange-800 dark:text-orange-200">Before You Begin</p>
                        <p className="text-sm text-orange-700 dark:text-orange-300">Ensure all previous versions of Office are fully uninstalled before starting to avoid activation errors.</p>
                    </div>
                </div>

                {/* Steps */}
                <div className="space-y-8">
                    {/* Step 1: Uninstall */}
                    <div className="bg-card border rounded-xl p-6">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-sm">1</div>
                            <h2 className="text-xl font-semibold">Uninstall Previous Office Versions</h2>
                        </div>
                        <p className="text-muted-foreground mb-4">Use the official Office removal tool to ensure a clean installation.</p>
                        <a href="https://bit.ly/uninstallmsoffice" target="_blank" rel="noopener noreferrer">
                            <Button variant="outline" className="gap-2">
                                <Download className="h-4 w-4" />
                                Download Removal Tool
                            </Button>
                        </a>
                    </div>

                    {/* Step 2: Download */}
                    <div className="bg-card border rounded-xl p-6">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-sm">2</div>
                            <h2 className="text-xl font-semibold">Download Office 2024 LTSC</h2>
                        </div>
                        <p className="text-muted-foreground mb-4">Click the button below to download the Office 2024 Professional Plus LTSC setup files.</p>
                        <a href="https://tinyurl.com/office2024ltsc" target="_blank" rel="noopener noreferrer">
                            <Button className="gap-2">
                                <Download className="h-4 w-4" />
                                Download Office 2024 LTSC
                            </Button>
                        </a>
                    </div>

                    {/* Step 3: Extract ZIP */}
                    <div className="bg-card border rounded-xl p-6">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-sm">3</div>
                            <h2 className="text-xl font-semibold">Extract the ZIP File</h2>
                        </div>
                        <p className="text-muted-foreground mb-4">Double-click the downloaded <strong>"OFFICE 2024 Professional Plus LTSC_EN_64Bits"</strong> zip file to extract its contents.</p>
                    </div>

                    {/* Step 4: Run Setup */}
                    <div className="bg-card border rounded-xl p-6">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-sm">4</div>
                            <h2 className="text-xl font-semibold">Run Setup</h2>
                        </div>
                        <p className="text-muted-foreground mb-4">Open the extracted folder and run the <strong>"Setup"</strong> file.</p>
                        <div className="relative w-full max-w-xl aspect-video rounded-lg overflow-hidden border">
                            <Image
                                src="https://8a834f89d81d2df0f6b3ac6599cc874b.cdn.bubble.io/f1725885331690x103980992318859150/image.png"
                                alt="Setup File in Folder"
                                fill
                                className="object-contain bg-white"
                            />
                        </div>
                    </div>

                    {/* Step 5: Installation */}
                    <div className="bg-card border rounded-xl p-6">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-sm">5</div>
                            <h2 className="text-xl font-semibold">Wait for Installation</h2>
                        </div>
                        <p className="text-muted-foreground mb-4">Wait for the installation to complete. You'll see <strong>"You're all set! Office is installed now"</strong> when done. Close the window.</p>
                        <div className="relative w-full max-w-xl aspect-video rounded-lg overflow-hidden border">
                            <Image
                                src="https://8a834f89d81d2df0f6b3ac6599cc874b.cdn.bubble.io/f1725885368305x709033327653556400/image.png"
                                alt="Installation Complete Screen"
                                fill
                                className="object-contain bg-white"
                            />
                        </div>
                    </div>

                    {/* Step 6: Open App */}
                    <div className="bg-card border rounded-xl p-6">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-sm">6</div>
                            <h2 className="text-xl font-semibold">Open Office Application</h2>
                        </div>
                        <p className="text-muted-foreground mb-4">Launch any Office application (Word or Excel) and accept the license agreement.</p>
                        <div className="relative w-full max-w-xl aspect-video rounded-lg overflow-hidden border">
                            <Image
                                src="https://8a834f89d81d2df0f6b3ac6599cc874b.cdn.bubble.io/f1725886111100x803525287515569400/image.png"
                                alt="License Agreement Screen"
                                fill
                                className="object-contain bg-white"
                            />
                        </div>
                    </div>

                    {/* Step 7: Activate */}
                    <div className="bg-card border rounded-xl p-6">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-sm">7</div>
                            <h2 className="text-xl font-semibold">Navigate to Activation</h2>
                        </div>
                        <p className="text-muted-foreground">Go to: <strong>File → Account → Change Product Key</strong></p>
                    </div>

                    {/* Step 8: Enter Key */}
                    <div className="bg-card border rounded-xl p-6">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-8 h-8 rounded-full bg-green-600 text-white flex items-center justify-center font-bold text-sm">
                                <Key className="h-4 w-4" />
                            </div>
                            <h2 className="text-xl font-semibold">Enter Your License Key</h2>
                        </div>
                        <p className="text-muted-foreground mb-4">Input the 25-digit license key provided with your purchase.</p>
                        <div className="relative w-full max-w-xl aspect-video rounded-lg overflow-hidden border">
                            <Image
                                src="https://8a834f89d81d2df0f6b3ac6599cc874b.cdn.bubble.io/f1725886131491x714578964344446300/image.png"
                                alt="Product Key Entry Screen"
                                fill
                                className="object-contain bg-white"
                            />
                        </div>
                    </div>

                    {/* Success */}
                    <div className="bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-900 rounded-xl p-6 flex gap-3">
                        <CheckCircle className="h-6 w-6 text-green-600 flex-shrink-0" />
                        <div>
                            <p className="font-semibold text-green-800 dark:text-green-200">Installation Complete!</p>
                            <p className="text-sm text-green-700 dark:text-green-300">Your Microsoft Office 2024 LTSC Professional Plus is now activated and ready to use.</p>
                        </div>
                    </div>
                </div>

                {/* Support */}
                <div className="mt-8 text-center">
                    <p className="text-muted-foreground mb-3">Need help with installation?</p>
                    <a href="https://wa.me/919953994557" target="_blank" rel="noopener noreferrer">
                        <Button variant="outline" className="gap-2">
                            Contact Support on WhatsApp
                        </Button>
                    </a>
                </div>
            </div>
        </div>
    );
}
