import Image from 'next/image';
import Link from 'next/link';
import { ArrowLeft, Download, ExternalLink, AlertCircle, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

export const metadata = {
    title: 'Microsoft 365 Installation Guide | SimplySolutions',
    description: 'Complete step-by-step guide to install and activate Microsoft Office 365 Pro Plus',
};

export default function Office365GuidePage() {
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
                        MS OFFICE 365 PRO PLUS
                    </h1>
                    <p className="text-lg text-muted-foreground">Complete Installation Tutorial</p>
                </div>

                {/* Important Notice */}
                <div className="bg-orange-50 dark:bg-orange-950/30 border border-orange-200 dark:border-orange-900 rounded-lg p-4 mb-8 flex gap-3">
                    <AlertCircle className="h-5 w-5 text-orange-600 flex-shrink-0 mt-0.5" />
                    <div>
                        <p className="font-semibold text-orange-800 dark:text-orange-200">Before You Begin</p>
                        <p className="text-sm text-orange-700 dark:text-orange-300">Make sure to uninstall all previous versions of Microsoft Office before proceeding with the installation.</p>
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
                        <p className="text-muted-foreground mb-4">Download and run the official Microsoft Office removal tool to ensure a clean installation.</p>
                        <a href="https://bit.ly/uninstallmsoffice" target="_blank" rel="noopener noreferrer">
                            <Button className="gap-2">
                                <Download className="h-4 w-4" />
                                Download Removal Tool
                            </Button>
                        </a>
                    </div>

                    {/* Step 2: Run Removal Tool */}
                    <div className="bg-card border rounded-xl p-6">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-sm">2</div>
                            <h2 className="text-xl font-semibold">Run Removal Tool</h2>
                        </div>
                        <p className="text-muted-foreground mb-4">Select <strong>"All Office Version"</strong>, click Next, and wait for the process to complete (approximately 30-45 minutes).</p>
                        <div className="relative w-full max-w-xl aspect-video rounded-lg overflow-hidden border">
                            <Image
                                src="https://8a834f89d81d2df0f6b3ac6599cc874b.cdn.bubble.io/f1696580971033x415392663955621300/ms-office-removal-tool-1024x609.png"
                                alt="Office Removal Tool Selection Screen"
                                fill
                                className="object-contain bg-white"
                            />
                        </div>
                    </div>

                    {/* Step 3: Sign In */}
                    <div className="bg-card border rounded-xl p-6">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-sm">3</div>
                            <h2 className="text-xl font-semibold">Sign In to Office Portal</h2>
                        </div>
                        <p className="text-muted-foreground mb-4">Visit the Microsoft Office portal to sign in with your credentials.</p>
                        <div className="flex gap-3 flex-wrap">
                            <a href="https://portal.office.com" target="_blank" rel="noopener noreferrer">
                                <Button variant="outline" className="gap-2">
                                    <ExternalLink className="h-4 w-4" />
                                    portal.office.com
                                </Button>
                            </a>
                            <a href="https://office.com" target="_blank" rel="noopener noreferrer">
                                <Button variant="outline" className="gap-2">
                                    <ExternalLink className="h-4 w-4" />
                                    office.com
                                </Button>
                            </a>
                        </div>
                    </div>

                    {/* Step 4: Login */}
                    <div className="bg-card border rounded-xl p-6">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-sm">4</div>
                            <h2 className="text-xl font-semibold">Login with Provided Credentials</h2>
                        </div>
                        <p className="text-muted-foreground mb-4">Use the Microsoft 365 login credentials provided with your purchase to sign in.</p>
                        <div className="relative w-full max-w-xl aspect-video rounded-lg overflow-hidden border">
                            <Image
                                src="https://8a834f89d81d2df0f6b3ac6599cc874b.cdn.bubble.io/f1696581423854x381986616601445100/Screenshot%202023-10-06%20at%202.05.51%20PM.png"
                                alt="Office 365 Login Screen"
                                fill
                                className="object-contain bg-white"
                            />
                        </div>
                    </div>

                    {/* Step 5: Password Change */}
                    <div className="bg-card border rounded-xl p-6">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-sm">5</div>
                            <h2 className="text-xl font-semibold">Update Password</h2>
                        </div>
                        <p className="text-muted-foreground mb-4">Upon first login, you'll be prompted to update the temporary password. Choose a new secure password.</p>
                        <div className="relative w-full max-w-xl aspect-video rounded-lg overflow-hidden border">
                            <Image
                                src="https://8a834f89d81d2df0f6b3ac6599cc874b.cdn.bubble.io/f1696581788107x342981571587590800/Screenshot%202023-10-06%20at%202.12.39%20PM.png"
                                alt="Password Update Screen"
                                fill
                                className="object-contain bg-white"
                            />
                        </div>
                    </div>

                    {/* Step 6: Security Info */}
                    <div className="bg-card border rounded-xl p-6">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-sm">6</div>
                            <h2 className="text-xl font-semibold">Skip Security Info (Optional)</h2>
                        </div>
                        <p className="text-muted-foreground mb-4">When you see the "More information required" screen, select <strong>"No thanks"</strong> or <strong>"Skip for now"</strong> (usually at the bottom left).</p>
                    </div>

                    {/* Step 7: Stay Signed In */}
                    <div className="bg-card border rounded-xl p-6">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-sm">7</div>
                            <h2 className="text-xl font-semibold">Stay Signed In</h2>
                        </div>
                        <p className="text-muted-foreground">Select <strong>"Yes"</strong> when asked to stay signed in for easier future access.</p>
                    </div>

                    {/* Step 8: Install Office */}
                    <div className="bg-card border rounded-xl p-6">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-sm">8</div>
                            <h2 className="text-xl font-semibold">Install Office</h2>
                        </div>
                        <p className="text-muted-foreground mb-4">Click the <strong>"Install apps"</strong> or <strong>"Install Office"</strong> button on the top right corner of the portal.</p>
                        <div className="relative w-full max-w-xl aspect-video rounded-lg overflow-hidden border">
                            <Image
                                src="https://8a834f89d81d2df0f6b3ac6599cc874b.cdn.bubble.io/f1696582528172x222216440263309280/Screenshot%202023-10-06%20at%202.25.10%20PM.png"
                                alt="Install Office Button Location"
                                fill
                                className="object-contain bg-white"
                            />
                        </div>
                    </div>

                    {/* Step 9: Alternative Install */}
                    <div className="bg-card border rounded-xl p-6">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-sm">9</div>
                            <h2 className="text-xl font-semibold">Alternative Install Method</h2>
                        </div>
                        <p className="text-muted-foreground">If the "Install" button isn't visible, navigate to: <strong>My Account → Apps & devices → Install Office</strong></p>
                    </div>

                    {/* Step 10: Finalize */}
                    <div className="bg-card border rounded-xl p-6">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-8 h-8 rounded-full bg-green-600 text-white flex items-center justify-center font-bold text-sm">
                                <CheckCircle className="h-5 w-5" />
                            </div>
                            <h2 className="text-xl font-semibold">Finalize Installation</h2>
                        </div>
                        <p className="text-muted-foreground">Run the downloaded setup file and once installed, sign in to any Office application (Word, Excel, etc.) to complete activation.</p>
                    </div>
                </div>

                {/* Tips */}
                <div className="mt-8 bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900 rounded-lg p-4">
                    <p className="font-semibold text-blue-800 dark:text-blue-200 mb-2">💡 Tip</p>
                    <p className="text-sm text-blue-700 dark:text-blue-300">Use Incognito/Private browsing mode if you face any issues downloading from the portal.</p>
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
