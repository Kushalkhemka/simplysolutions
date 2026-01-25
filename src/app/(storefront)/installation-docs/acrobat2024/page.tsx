import Image from 'next/image';
import Link from 'next/link';
import { ArrowLeft, Download, Disc, Play, Key, CheckCircle, Smartphone, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';

export const metadata = {
    title: 'Adobe Acrobat Pro 2024 Installation Guide | SimplySolutions',
    description: 'Step-by-step installation and activation guide for Adobe Acrobat Pro 2024',
};

export default function Acrobat2024Page() {
    return (
        <div className="min-h-screen bg-gradient-to-br from-background via-red-50/30 dark:via-red-950/10 to-background">
            <div className="container max-w-4xl py-10 px-4 mx-auto">
                {/* Header */}
                <div className="mb-10">
                    <Link href="/installation-docs" className="inline-flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors mb-6">
                        <ArrowLeft className="h-4 w-4" />
                        Back to Installation Docs
                    </Link>

                    <div className="text-center">
                        <div className="inline-block px-4 py-1.5 bg-gradient-to-r from-red-500 to-red-600 text-white text-sm font-medium rounded-full mb-4">
                            PDF Solution
                        </div>
                        <h1 className="text-4xl md:text-5xl font-bold mb-3 bg-gradient-to-r from-red-600 to-red-700 bg-clip-text text-transparent">
                            Adobe Acrobat Pro 2024
                        </h1>
                        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                            Installation & Activation Guide for Windows
                        </p>
                    </div>
                </div>

                <div className="space-y-8">
                    {/* Important Note */}
                    <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-2xl p-6 flex gap-4">
                        <AlertTriangle className="h-6 w-6 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
                        <div>
                            <p className="font-bold text-amber-800 dark:text-amber-200 text-lg">Important</p>
                            <p className="text-amber-700 dark:text-amber-300">
                                Close any running Adobe applications before starting the installation. For best results, run the installer as Administrator.
                            </p>
                        </div>
                    </div>

                    {/* Step 1: Download */}
                    <div className="bg-card border rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow">
                        <div className="flex items-start gap-4 mb-5">
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-red-500 to-red-600 text-white flex items-center justify-center font-bold text-lg shadow-lg">
                                <Download className="h-5 w-5" />
                            </div>
                            <div>
                                <h2 className="text-2xl font-bold">Download the Installer</h2>
                                <p className="text-muted-foreground">Get the official ISO file</p>
                            </div>
                        </div>
                        <div className="ml-14">
                            {/* Note: The reference site didn't have a direct link, but implied a download button. 
                                Since we don't have a specific URL provided by the user other than "check this", 
                                and the reference site uses a generic "Download button", 
                                I will place a placeholder or instruction to check their order email/dashboard. 
                            */}
                            <p className="mb-4">
                                Download the installation file from the link provided in your order email or dashboard.
                            </p>
                            <div className="p-4 bg-muted rounded-xl text-sm font-mono border">
                                Filename: AdobeAcrobatPro2024.iso
                            </div>
                            <div className="mt-4 border rounded-xl overflow-hidden shadow-sm">
                                <Image
                                    src="/adobe_assets/step1_download.png"
                                    alt="Download Adobe Acrobat Pro ISO"
                                    width={800}
                                    height={500}
                                    className="w-full h-auto"
                                    unoptimized
                                />
                            </div>
                        </div>
                    </div>

                    {/* Step 2: Mount */}
                    <div className="bg-card border rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow">
                        <div className="flex items-start gap-4 mb-5">
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-red-500 to-red-600 text-white flex items-center justify-center font-bold text-lg shadow-lg">
                                <Disc className="h-5 w-5" />
                            </div>
                            <div>
                                <h2 className="text-2xl font-bold">Mount & Open</h2>
                                <p className="text-muted-foreground">Access the installation files</p>
                            </div>
                        </div>
                        <div className="ml-14">
                            <ol className="list-decimal list-inside space-y-2 text-muted-foreground">
                                <li>Navigate to your <strong>Downloads</strong> folder.</li>
                                <li>Right-click the <strong>AdobeAcrobatPro2024.iso</strong> file.</li>
                                <li>Select <strong>Mount</strong> from the context menu.</li>
                                <li>The file will open as a virtual DVD drive in File Explorer. Open it.</li>
                            </ol>
                            <div className="mt-4 border rounded-xl overflow-hidden shadow-sm">
                                <Image
                                    src="/adobe_assets/step2_mount.png"
                                    alt="Mount the ISO file"
                                    width={800}
                                    height={500}
                                    className="w-full h-auto"
                                    unoptimized
                                />
                            </div>
                        </div>
                    </div>

                    {/* Step 3: Install */}
                    <div className="bg-card border rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow">
                        <div className="flex items-start gap-4 mb-5">
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-red-500 to-red-600 text-white flex items-center justify-center font-bold text-lg shadow-lg">
                                <Play className="h-5 w-5" />
                            </div>
                            <div>
                                <h2 className="text-2xl font-bold">Install the Software</h2>
                                <p className="text-muted-foreground">Run the setup wizard</p>
                            </div>
                        </div>
                        <div className="ml-14">
                            <ol className="list-decimal list-inside space-y-2 text-muted-foreground">
                                <li>Find and run <strong>Setup.exe</strong> from the mounted drive.</li>
                                <li>Follow the on-screen instructions to proceed with the installation.</li>
                            </ol>
                            <div className="mt-4 border rounded-xl overflow-hidden shadow-sm">
                                <Image
                                    src="/adobe_assets/step3_install.png"
                                    alt="Adobe Acrobat Installation Progress"
                                    width={800}
                                    height={500}
                                    className="w-full h-auto"
                                    unoptimized
                                />
                            </div>
                        </div>
                    </div>

                    {/* Step 4: Activate */}
                    <div className="bg-card border rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow">
                        <div className="flex items-start gap-4 mb-5">
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-red-500 to-red-600 text-white flex items-center justify-center font-bold text-lg shadow-lg">
                                <Key className="h-5 w-5" />
                            </div>
                            <div>
                                <h2 className="text-2xl font-bold">Activate with Serial</h2>
                                <p className="text-muted-foreground">Enter your license key</p>
                            </div>
                        </div>
                        <div className="ml-14">
                            <ol className="list-decimal list-inside space-y-2 text-muted-foreground">
                                <li>When prompted, select <strong>&quot;I have a serial number&quot;</strong>.</li>
                                <li>Copy and paste the serial key required from your order.</li>
                                <li>Click <strong>Install</strong> to begin the process.</li>
                            </ol>
                            <div className="mt-4 border rounded-xl overflow-hidden shadow-sm">
                                <Image
                                    src="/adobe_assets/step4_activate.png"
                                    alt="Enter Serial Number for Activation"
                                    width={800}
                                    height={500}
                                    className="w-full h-auto"
                                    unoptimized
                                />
                            </div>
                        </div>
                    </div>

                    {/* Step 5: Verify */}
                    <div className="bg-card border rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow">
                        <div className="flex items-start gap-4 mb-5">
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-red-500 to-red-600 text-white flex items-center justify-center font-bold text-lg shadow-lg">
                                <CheckCircle className="h-5 w-5" />
                            </div>
                            <div>
                                <h2 className="text-2xl font-bold">Verify Activation</h2>
                                <p className="text-muted-foreground">Confirm your license status</p>
                            </div>
                        </div>
                        <div className="ml-14">
                            <ol className="list-decimal list-inside space-y-2 text-muted-foreground">
                                <li>Wait for the installation to finish and open <strong>Adobe Acrobat</strong>.</li>
                                <li>Go to <strong>Help</strong> &rarr; <strong>About Adobe Acrobat Pro...</strong></li>
                                <li>Confirm that the product is activated.</li>
                                <li><em>If not activated immediately, restart your PC and check again.</em></li>
                            </ol>
                        </div>
                    </div>

                    {/* FAQ */}
                    <div className="bg-gray-50 dark:bg-gray-900 border rounded-2xl p-6">
                        <h3 className="text-xl font-bold mb-4">Frequently Asked Questions</h3>
                        <div className="space-y-4">
                            <div>
                                <h4 className="font-semibold">How many devices can I use this on?</h4>
                                <p className="text-muted-foreground text-sm">You can activate up to 3 devices per license.</p>
                            </div>
                            <div>
                                <h4 className="font-semibold">What if I reinstall Windows?</h4>
                                <p className="text-muted-foreground text-sm">Contact support with proof of purchase for re-activation within 30 days.</p>
                            </div>
                        </div>
                    </div>

                    {/* Support */}
                    <div className="border-t pt-8 mt-8">
                        <h3 className="text-xl font-bold mb-4">Need Help?</h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <a href="https://wa.me/917011787948" target="_blank" rel="noopener noreferrer" className="block">
                                <div className="p-4 border rounded-xl hover:bg-muted/50 transition-colors flex items-center gap-3">
                                    <Smartphone className="h-5 w-5 text-green-600" />
                                    <div>
                                        <div className="font-semibold">WhatsApp Support</div>
                                        <div className="text-sm text-muted-foreground">+91 70117 87948</div>
                                        <div className="text-xs text-muted-foreground mt-1">Message with screenshot of error</div>
                                    </div>
                                </div>
                            </a>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
