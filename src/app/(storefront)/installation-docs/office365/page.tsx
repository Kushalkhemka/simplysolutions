import Image from 'next/image';
import Link from 'next/link';
import { ArrowLeft, Download, ExternalLink, AlertCircle, CheckCircle, Shield, Smartphone, Tablet, Monitor, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';

export const metadata = {
    title: 'Microsoft 365 Installation Guide | SimplySolutions',
    description: 'Complete step-by-step guide to install and activate Microsoft Office 365 Pro Plus on Windows, Mac, iOS, and Android',
};

export default function Office365GuidePage() {
    return (
        <div className="min-h-screen bg-gradient-to-br from-background via-orange-50/30 dark:via-orange-950/10 to-background">
            <div className="container max-w-5xl py-10 px-4 mx-auto">
                {/* Header */}
                <div className="mb-10">
                    <Link href="/installation-docs" className="inline-flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors mb-6">
                        <ArrowLeft className="h-4 w-4" />
                        Back to Installation Docs
                    </Link>
                    <div className="text-center">
                        <div className="inline-block px-4 py-1.5 bg-gradient-to-r from-orange-500 to-red-500 text-white text-sm font-medium rounded-full mb-4">
                            Complete Guide
                        </div>
                        <h1 className="text-4xl md:text-5xl font-bold mb-3 bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent">
                            MS OFFICE 365 PRO PLUS
                        </h1>
                        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                            Follow these simple instructions for a smooth activation. Works on Windows, Mac, iOS, and Android.
                        </p>
                    </div>
                </div>

                {/* Important Notice */}
                <div className="bg-gradient-to-r from-orange-50 to-amber-50 dark:from-orange-950/40 dark:to-amber-950/40 border border-orange-200 dark:border-orange-800 rounded-2xl p-6 mb-10 flex gap-4">
                    <AlertCircle className="h-6 w-6 text-orange-600 dark:text-orange-400 flex-shrink-0 mt-0.5" />
                    <div>
                        <p className="font-bold text-orange-800 dark:text-orange-200 text-lg">Before You Begin</p>
                        <p className="text-orange-700 dark:text-orange-300">You must uninstall all old office versions using the official removal tool. This ensures a clean installation without conflicts.</p>
                    </div>
                </div>

                {/* Steps */}
                <div className="space-y-8">
                    {/* Step 1: Uninstall */}
                    <div className="bg-card border rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow">
                        <div className="flex items-start gap-4 mb-5">
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500 to-red-500 text-white flex items-center justify-center font-bold text-lg shadow-lg">1</div>
                            <div>
                                <h2 className="text-2xl font-bold">Uninstall Previous Office Versions</h2>
                                <p className="text-muted-foreground">Download and run the official Microsoft Office removal tool</p>
                            </div>
                        </div>
                        <div className="ml-14">
                            <a href="https://bit.ly/uninstallmsoffice" target="_blank" rel="noopener noreferrer">
                                <Button size="lg" className="gap-2 bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white shadow-lg">
                                    <Download className="h-5 w-5" />
                                    Download Removal Tool
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
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500 to-red-500 text-white flex items-center justify-center font-bold text-lg shadow-lg">2</div>
                            <div>
                                <h2 className="text-2xl font-bold">Run the Removal Tool</h2>
                                <p className="text-muted-foreground">Select "All Office Version" and wait 30-45 minutes for completion</p>
                            </div>
                        </div>
                        <div className="ml-14">
                            <div className="relative w-full max-w-lg mx-auto rounded-xl overflow-hidden border shadow-lg">
                                <Image
                                    src="https://i.postimg.cc/qR8WRx2m/Screenshot-2025-06-01-171331.png"
                                    alt="Office Removal Tool - Select All Office Version"
                                    width={400}
                                    height={250}
                                    className="w-full h-auto"
                                    unoptimized
                                />
                            </div>
                        </div>
                    </div>

                    {/* Conditional Section */}
                    <div className="bg-gradient-to-r from-red-50 to-orange-50 dark:from-red-950/30 dark:to-orange-950/30 border border-red-200 dark:border-red-800 rounded-2xl p-6">
                        <div className="flex gap-4">
                            <AlertCircle className="h-6 w-6 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
                            <div>
                                <p className="font-bold text-red-800 dark:text-red-200 text-lg">Note</p>
                                <p className="text-red-700 dark:text-red-300">If you <strong>don't have any Office 365</strong> programs pre-installed, follow all steps below. If you <strong>already have Office 365</strong> installed, skip to the bottom section "If Office 365 is Pre-installed".</p>
                            </div>
                        </div>
                    </div>

                    {/* Step 3: Sign In */}
                    <div className="bg-card border rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow">
                        <div className="flex items-start gap-4 mb-5">
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500 to-red-500 text-white flex items-center justify-center font-bold text-lg shadow-lg">3</div>
                            <div>
                                <h2 className="text-2xl font-bold">Visit Microsoft Office Portal</h2>
                                <p className="text-muted-foreground">Go to the official portal and sign in with your credentials</p>
                            </div>
                        </div>
                        <div className="ml-14 flex gap-3 flex-wrap">
                            <a href="https://portal.office.com" target="_blank" rel="noopener noreferrer">
                                <Button variant="outline" size="lg" className="gap-2 border-2">
                                    <ExternalLink className="h-4 w-4" />
                                    portal.office.com
                                </Button>
                            </a>
                            <a href="https://office.com" target="_blank" rel="noopener noreferrer">
                                <Button variant="outline" size="lg" className="gap-2 border-2">
                                    <ExternalLink className="h-4 w-4" />
                                    office.com
                                </Button>
                            </a>
                        </div>
                    </div>

                    {/* Step 4: Login */}
                    <div className="bg-card border rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow">
                        <div className="flex items-start gap-4 mb-5">
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500 to-red-500 text-white flex items-center justify-center font-bold text-lg shadow-lg">4</div>
                            <div>
                                <h2 className="text-2xl font-bold">Sign In with Your Credentials</h2>
                                <p className="text-muted-foreground">Use the Microsoft 365 login credentials provided with your purchase</p>
                            </div>
                        </div>
                        <div className="ml-14 grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="relative rounded-xl overflow-hidden border shadow-lg">
                                <Image
                                    src="https://i.postimg.cc/6Ts70w86/c74a0daa48309143749575edf3127e00.png"
                                    alt="Office 365 Sign In - Enter Email"
                                    width={350}
                                    height={250}
                                    className="w-full h-auto"
                                    unoptimized
                                />
                            </div>
                            <div className="relative rounded-xl overflow-hidden border shadow-lg">
                                <Image
                                    src="https://i.postimg.cc/fyrCT4tx/tinywow-37e282b4c28240ea499fe92e2aa4dce3-62490462.png"
                                    alt="Office 365 Sign In - Enter Password"
                                    width={350}
                                    height={250}
                                    className="w-full h-auto"
                                    unoptimized
                                />
                            </div>
                        </div>
                    </div>

                    {/* Step 5: Password Change */}
                    <div className="bg-card border rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow">
                        <div className="flex items-start gap-4 mb-5">
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500 to-red-500 text-white flex items-center justify-center font-bold text-lg shadow-lg">5</div>
                            <div>
                                <h2 className="text-2xl font-bold">Update Your Password</h2>
                                <p className="text-muted-foreground">On first login, you'll be required to change your password for security</p>
                            </div>
                        </div>
                        <div className="ml-14">
                            <div className="p-4 bg-amber-50 dark:bg-amber-950/30 rounded-xl border border-amber-200 dark:border-amber-800 mb-4 flex gap-3">
                                <Info className="h-5 w-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
                                <p className="text-sm text-amber-700 dark:text-amber-300"><strong>TIP:</strong> Make sure to remember this new password and save it somewhere safe!</p>
                            </div>
                            <div className="relative w-full max-w-lg mx-auto rounded-xl overflow-hidden border shadow-lg">
                                <Image
                                    src="https://i.postimg.cc/xTYgnSxV/tinywow-b1bb1109b94e51e960a73bf6117a2305-62490588.png"
                                    alt="Change Password Screen"
                                    width={350}
                                    height={300}
                                    className="w-full h-auto"
                                    unoptimized
                                />
                            </div>
                        </div>
                    </div>

                    {/* Step 6: Security Setup */}
                    <div className="bg-card border rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow">
                        <div className="flex items-start gap-4 mb-5">
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500 to-red-500 text-white flex items-center justify-center font-bold text-lg shadow-lg">6</div>
                            <div>
                                <h2 className="text-2xl font-bold">Set Up Security Info</h2>
                                <p className="text-muted-foreground">Required step for account security - link your phone or email</p>
                            </div>
                        </div>
                        <div className="ml-14">
                            <div className="flex gap-3 items-center mb-4">
                                <Shield className="h-5 w-5 text-green-600" />
                                <span className="text-sm text-muted-foreground">This ensures only you can access your account and helps with password recovery</span>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                <div className="relative rounded-xl overflow-hidden border shadow-lg">
                                    <Image
                                        src="https://i.postimg.cc/VNjdY2Z2/tinywow-314613142838e260ed058209288a2b52-62490540.png"
                                        alt="More Information Required Screen"
                                        width={350}
                                        height={300}
                                        className="w-full h-auto"
                                        unoptimized
                                    />
                                </div>
                                <div className="relative rounded-xl overflow-hidden border shadow-lg">
                                    <Image
                                        src="https://i.postimg.cc/KvfXyf5Q/tinywow-64cb4226fa191cc10138e552b1b01aa8-62490771.png"
                                        alt="Security Info Setup"
                                        width={350}
                                        height={250}
                                        className="w-full h-auto"
                                        unoptimized
                                    />
                                </div>
                            </div>
                            <div className="p-4 bg-blue-50 dark:bg-blue-950/30 rounded-xl border border-blue-200 dark:border-blue-800">
                                <p className="text-sm text-blue-700 dark:text-blue-300">
                                    You can update security info anytime at: <a href="https://mysignins.microsoft.com/security-info" target="_blank" rel="noopener noreferrer" className="font-bold underline hover:text-blue-800">mysignins.microsoft.com/security-info</a>
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Step 7: Install Office */}
                    <div className="bg-card border rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow">
                        <div className="flex items-start gap-4 mb-5">
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500 to-red-500 text-white flex items-center justify-center font-bold text-lg shadow-lg">7</div>
                            <div>
                                <h2 className="text-2xl font-bold">Install Microsoft 365 Apps</h2>
                                <p className="text-muted-foreground">Click "Install and more" → "Install Microsoft 365 apps"</p>
                            </div>
                        </div>
                        <div className="ml-14">
                            <div className="relative w-full max-w-lg mx-auto rounded-xl overflow-hidden border shadow-lg">
                                <Image
                                    src="https://i.postimg.cc/tTpffVV8/tinywow-8df6b51e7dc09b8019e2374f75a36ea7-62500581.png"
                                    alt="Install Microsoft 365 Apps Button"
                                    width={350}
                                    height={250}
                                    className="w-full h-auto"
                                    unoptimized
                                />
                            </div>
                        </div>
                    </div>

                    {/* Step 7b: Alternative if Premium shown */}
                    <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-2xl p-6">
                        <div className="flex gap-4">
                            <Info className="h-6 w-6 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
                            <div className="flex-1">
                                <p className="font-bold text-amber-800 dark:text-amber-200 mb-2">If you see "Buy Microsoft 365" or "Go Premium" instead:</p>
                                <p className="text-amber-700 dark:text-amber-300 mb-4">Click on Profile Icon (top-right) → Switch account → Sign in with a different account (use the generated 365 credentials)</p>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="relative rounded-xl overflow-hidden border shadow-lg">
                                        <Image
                                            src="https://i.postimg.cc/RhrT8k8h/Screenshot-2024-08-17-000724.png"
                                            alt="Go Premium Screen"
                                            width={350}
                                            height={300}
                                            className="w-full h-auto bg-white"
                                            unoptimized
                                        />
                                    </div>
                                    <div className="relative rounded-xl overflow-hidden border shadow-lg">
                                        <Image
                                            src="https://i.postimg.cc/BbXGY1r4/Screenshot-2024-08-17-000445.png"
                                            alt="Switch Account"
                                            width={350}
                                            height={200}
                                            className="w-full h-auto bg-white"
                                            unoptimized
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Step 8: Click Install Office */}
                    <div className="bg-card border rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow">
                        <div className="flex items-start gap-4 mb-5">
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500 to-red-500 text-white flex items-center justify-center font-bold text-lg shadow-lg">8</div>
                            <div>
                                <h2 className="text-2xl font-bold">Click Install Office</h2>
                                <p className="text-muted-foreground">After clicking Install 365 apps, click "Install Office" in the next window</p>
                            </div>
                        </div>
                        <div className="ml-14 grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="relative rounded-xl overflow-hidden border shadow-lg">
                                <Image
                                    src="https://i.postimg.cc/5yDLjTLv/tinywow-aea0cffe80f004ebf4d7f36c01a0a115-62501236.png"
                                    alt="Install Office Step 1"
                                    width={350}
                                    height={250}
                                    className="w-full h-auto"
                                    unoptimized
                                />
                            </div>
                            <div className="relative rounded-xl overflow-hidden border shadow-lg">
                                <Image
                                    src="https://i.postimg.cc/QN47FGST/Screenshot-2024-08-17-001716.png"
                                    alt="Install Office Step 2"
                                    width={350}
                                    height={200}
                                    className="w-full h-auto bg-white"
                                    unoptimized
                                />
                            </div>
                        </div>
                    </div>

                    {/* Step 9: Run Setup */}
                    <div className="bg-card border rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow">
                        <div className="flex items-start gap-4 mb-5">
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500 to-red-500 text-white flex items-center justify-center font-bold text-lg shadow-lg">9</div>
                            <div>
                                <h2 className="text-2xl font-bold">Run OfficeSetup.exe</h2>
                                <p className="text-muted-foreground">Run the downloaded file and click "Yes" when prompted</p>
                            </div>
                        </div>
                        <div className="ml-14 grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="relative rounded-xl overflow-hidden border shadow-lg">
                                <Image
                                    src="https://i.postimg.cc/ZKRyhbkQ/Screenshot-2024-08-17-001852.png"
                                    alt="Office Setup Download"
                                    width={350}
                                    height={225}
                                    className="w-full h-auto bg-white"
                                    unoptimized
                                />
                            </div>
                            <div className="relative rounded-xl overflow-hidden border shadow-lg">
                                <Image
                                    src="https://i.postimg.cc/yd0YHGnW/Screenshot-2024-08-17-002431.png"
                                    alt="Office Installing"
                                    width={350}
                                    height={225}
                                    className="w-full h-auto bg-white"
                                    unoptimized
                                />
                            </div>
                        </div>
                    </div>

                    {/* Step 10: Sign in to Office App */}
                    <div className="bg-card border rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow">
                        <div className="flex items-start gap-4 mb-5">
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500 to-red-500 text-white flex items-center justify-center font-bold text-lg shadow-lg">10</div>
                            <div>
                                <h2 className="text-2xl font-bold">Sign In to Office App</h2>
                                <p className="text-muted-foreground">Open any Office app (Word, Excel) and sign in with your 365 account</p>
                            </div>
                        </div>
                        <div className="ml-14">
                            <div className="p-4 bg-green-50 dark:bg-green-950/30 rounded-xl border border-green-200 dark:border-green-800 mb-4 flex gap-3">
                                <Info className="h-5 w-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
                                <p className="text-sm text-green-700 dark:text-green-300"><strong>TIP:</strong> You can sign in with multiple accounts to access old data from personal/work accounts while keeping Office activated!</p>
                            </div>
                            <div className="relative w-full max-w-lg mx-auto rounded-xl overflow-hidden border shadow-lg">
                                <Image
                                    src="https://i.postimg.cc/Z5PcWYRL/Screenshot-2024-08-17-002650.png"
                                    alt="Sign In to Word"
                                    width={350}
                                    height={200}
                                    className="w-full h-auto bg-white"
                                    unoptimized
                                />
                            </div>
                        </div>
                    </div>

                    {/* Step 11: Activation Complete */}
                    <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950/40 dark:to-emerald-950/40 border-2 border-green-300 dark:border-green-700 rounded-2xl p-6 shadow-lg">
                        <div className="flex items-start gap-4 mb-5">
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-green-500 to-emerald-500 text-white flex items-center justify-center font-bold text-lg shadow-lg">
                                <CheckCircle className="h-6 w-6" />
                            </div>
                            <div>
                                <h2 className="text-2xl font-bold text-green-800 dark:text-green-200">Office 365 Activated!</h2>
                                <p className="text-green-700 dark:text-green-300">Your Office 365 is now activated for lifetime use</p>
                            </div>
                        </div>
                        <div className="ml-14">
                            <div className="relative w-full max-w-lg mx-auto rounded-xl overflow-hidden border shadow-lg">
                                <Image
                                    src="https://i.postimg.cc/wB5C2dBq/tinywow-d4d6504cd45a68e701db9c5b30041ea1-62491022.png"
                                    alt="Office 365 Activated"
                                    width={350}
                                    height={200}
                                    className="w-full h-auto"
                                    unoptimized
                                />
                            </div>
                        </div>
                    </div>

                    {/* OneDrive Access */}
                    <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-2xl p-6">
                        <div className="flex gap-4">
                            <Info className="h-6 w-6 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                            <div>
                                <p className="font-bold text-blue-800 dark:text-blue-200 text-lg mb-2">Access OneDrive Storage</p>
                                <p className="text-blue-700 dark:text-blue-300 mb-3">Download the OneDrive app or visit <a href="https://onedrive.live.com" target="_blank" rel="noopener noreferrer" className="font-bold underline">onedrive.live.com</a>. Sign in with your generated 365 account to enjoy cloud storage.</p>
                            </div>
                        </div>
                    </div>

                    {/* Platform Notice */}
                    <div className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-950/30 dark:to-pink-950/30 border border-purple-200 dark:border-purple-800 rounded-2xl p-6">
                        <p className="text-center text-purple-800 dark:text-purple-200 font-semibold text-lg mb-2">
                            <Monitor className="inline h-5 w-5 mr-2" />
                            Works on Windows & Mac
                        </p>
                        <p className="text-center text-purple-700 dark:text-purple-300">The procedure is similar for both macOS and Windows. You can activate up to <strong>5 devices</strong> of different OS in a similar way.</p>
                    </div>

                    {/* Error Tip */}
                    <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-2xl p-6">
                        <div className="flex gap-4">
                            <AlertCircle className="h-6 w-6 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
                            <div>
                                <p className="font-bold text-amber-800 dark:text-amber-200 text-lg mb-2">If you see error CAAC000E</p>
                                <p className="text-amber-700 dark:text-amber-300">Simply click <strong>"Continue"</strong> to proceed. This error can be safely ignored.</p>
                            </div>
                        </div>
                    </div>

                    {/* Warranty Registration */}
                    <div className="bg-gradient-to-r from-green-50 to-teal-50 dark:from-green-950/30 dark:to-teal-950/30 border-2 border-green-300 dark:border-green-700 rounded-2xl p-6">
                        <div className="flex gap-4">
                            <Shield className="h-6 w-6 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
                            <div>
                                <p className="font-bold text-green-800 dark:text-green-200 text-lg mb-2">Register Your Warranty</p>
                                <p className="text-green-700 dark:text-green-300 mb-3">Register your warranty after activation to receive <strong>lifetime technical and reinstallation support</strong>.</p>
                                <a href="/digital-warranty" className="inline-block">
                                    <Button variant="outline" className="gap-2 border-green-400 text-green-700 hover:bg-green-100 dark:border-green-600 dark:text-green-300 dark:hover:bg-green-900/50">
                                        <ExternalLink className="h-4 w-4" />
                                        Register Warranty
                                    </Button>
                                </a>
                            </div>
                        </div>
                    </div>

                    {/* If Pre-installed Section */}
                    <div className="border-t-4 border-orange-400 pt-8 mt-8">
                        <h2 className="text-3xl font-bold text-center mb-8 bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent">
                            If Office 365 is Pre-installed
                        </h2>

                        <div className="space-y-6">
                            <div className="bg-card border rounded-2xl p-6 shadow-sm">
                                <div className="flex items-start gap-4 mb-4">
                                    <div className="w-8 h-8 rounded-lg bg-orange-100 dark:bg-orange-900 text-orange-600 dark:text-orange-400 flex items-center justify-center font-bold">1</div>
                                    <p className="text-lg"><strong>Open any Office app</strong> (Word, Excel, etc.)</p>
                                </div>
                            </div>

                            <div className="bg-card border rounded-2xl p-6 shadow-sm">
                                <div className="flex items-start gap-4 mb-4">
                                    <div className="w-8 h-8 rounded-lg bg-orange-100 dark:bg-orange-900 text-orange-600 dark:text-orange-400 flex items-center justify-center font-bold">2A</div>
                                    <div>
                                        <p className="text-lg mb-2"><strong>On Windows:</strong> Click File Menu → Account → Activate Product</p>
                                        <div className="relative rounded-xl overflow-hidden border shadow-lg max-w-md">
                                            <Image
                                                src="https://i.postimg.cc/TYX8F9KN/tinywow-c299b52a0cb60debb86057808a2bec55-62490867.png"
                                                alt="Windows Activate Product"
                                                width={350}
                                                height={225}
                                                className="w-full h-auto"
                                                unoptimized
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-card border rounded-2xl p-6 shadow-sm">
                                <div className="flex items-start gap-4 mb-4">
                                    <div className="w-8 h-8 rounded-lg bg-orange-100 dark:bg-orange-900 text-orange-600 dark:text-orange-400 flex items-center justify-center font-bold">2B</div>
                                    <div>
                                        <p className="text-lg mb-2"><strong>On Mac:</strong> Click "Activate" (key icon at bottom left) → "Already bought Office? Sign in"</p>
                                        <div className="relative rounded-xl overflow-hidden border shadow-lg max-w-md">
                                            <Image
                                                src="https://i.postimg.cc/T3gKGQ0y/tinywow-2a9f845fd3044a84a0bca48fc8df8b29-62490938.png"
                                                alt="Mac Activate"
                                                width={350}
                                                height={350}
                                                className="w-full h-auto"
                                                unoptimized
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-card border rounded-2xl p-6 shadow-sm">
                                <div className="flex items-start gap-4 mb-4">
                                    <div className="w-8 h-8 rounded-lg bg-orange-100 dark:bg-orange-900 text-orange-600 dark:text-orange-400 flex items-center justify-center font-bold">3</div>
                                    <div>
                                        <p className="text-lg mb-2"><strong>Sign in</strong> using your purchased credentials. If logged in with another account, click "Use a different account"</p>
                                        <div className="relative rounded-xl overflow-hidden border shadow-lg max-w-md">
                                            <Image
                                                src="https://i.postimg.cc/XYGzvBBB/8d78d83d5e5a8c011aec3801f92b3ba1.png"
                                                alt="Use Different Account"
                                                width={350}
                                                height={250}
                                                className="w-full h-auto"
                                                unoptimized
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950/40 dark:to-emerald-950/40 border border-green-200 dark:border-green-700 rounded-2xl p-6">
                                <div className="flex items-center gap-4">
                                    <CheckCircle className="h-8 w-8 text-green-600 dark:text-green-400" />
                                    <p className="text-lg font-semibold text-green-800 dark:text-green-200">After logging in, the activation is complete!</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Mobile Devices */}
                    <div className="border-t-4 border-blue-400 pt-8 mt-8">
                        <h2 className="text-3xl font-bold text-center mb-8">
                            <Smartphone className="inline h-8 w-8 mr-2 text-blue-600" />
                            Mobile Device Activation
                        </h2>

                        <div className="grid md:grid-cols-2 gap-6">
                            {/* Android */}
                            <div className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/30 dark:to-emerald-950/30 border border-green-200 dark:border-green-800 rounded-2xl p-6">
                                <h3 className="text-xl font-bold mb-4 flex items-center gap-2 text-green-800 dark:text-green-200">
                                    <Smartphone className="h-6 w-6" />
                                    Android Phone/Tablet
                                </h3>
                                <p className="text-green-700 dark:text-green-300 mb-4">Download from Play Store and login with your 365 account:</p>
                                <div className="space-y-2">
                                    <a href="https://play.google.com/store/apps/details?id=com.microsoft.office.officehubrow" target="_blank" rel="noopener noreferrer" className="flex items-center justify-between p-4 bg-white dark:bg-green-900/50 rounded-xl hover:shadow-lg hover:scale-[1.02] transition-all border-2 border-green-300 dark:border-green-600 cursor-pointer group">
                                        <span className="font-bold text-green-800 dark:text-green-200">Microsoft 365 (All-in-One)</span>
                                        <ExternalLink className="h-5 w-5 text-green-600 group-hover:translate-x-1 transition-transform" />
                                    </a>
                                    <a href="https://play.google.com/store/apps/details?id=com.microsoft.office.excel" target="_blank" rel="noopener noreferrer" className="flex items-center justify-between p-4 bg-white dark:bg-green-900/50 rounded-xl hover:shadow-lg hover:scale-[1.02] transition-all border-2 border-green-300 dark:border-green-600 cursor-pointer group">
                                        <span className="font-bold text-green-800 dark:text-green-200">Excel</span>
                                        <ExternalLink className="h-5 w-5 text-green-600 group-hover:translate-x-1 transition-transform" />
                                    </a>
                                    <a href="https://play.google.com/store/apps/details?id=com.microsoft.office.word" target="_blank" rel="noopener noreferrer" className="flex items-center justify-between p-4 bg-white dark:bg-green-900/50 rounded-xl hover:shadow-lg hover:scale-[1.02] transition-all border-2 border-green-300 dark:border-green-600 cursor-pointer group">
                                        <span className="font-bold text-green-800 dark:text-green-200">Word</span>
                                        <ExternalLink className="h-5 w-5 text-green-600 group-hover:translate-x-1 transition-transform" />
                                    </a>
                                    <a href="https://play.google.com/store/apps/details?id=com.microsoft.office.powerpoint" target="_blank" rel="noopener noreferrer" className="flex items-center justify-between p-4 bg-white dark:bg-green-900/50 rounded-xl hover:shadow-lg hover:scale-[1.02] transition-all border-2 border-green-300 dark:border-green-600 cursor-pointer group">
                                        <span className="font-bold text-green-800 dark:text-green-200">PowerPoint</span>
                                        <ExternalLink className="h-5 w-5 text-green-600 group-hover:translate-x-1 transition-transform" />
                                    </a>
                                </div>
                            </div>

                            {/* iOS */}
                            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 border border-blue-200 dark:border-blue-800 rounded-2xl p-6">
                                <h3 className="text-xl font-bold mb-4 flex items-center gap-2 text-blue-800 dark:text-blue-200">
                                    <Tablet className="h-6 w-6" />
                                    iPad / iOS
                                </h3>
                                <p className="text-blue-700 dark:text-blue-300 mb-4">Download from App Store and login with your 365 account:</p>
                                <div className="space-y-2">
                                    <a href="https://apps.apple.com/us/app/microsoft-365-office/id541164041" target="_blank" rel="noopener noreferrer" className="flex items-center justify-between p-4 bg-white dark:bg-blue-900/50 rounded-xl hover:shadow-lg hover:scale-[1.02] transition-all border-2 border-blue-300 dark:border-blue-600 cursor-pointer group">
                                        <span className="font-bold text-blue-800 dark:text-blue-200">Microsoft 365 (All-in-One)</span>
                                        <ExternalLink className="h-5 w-5 text-blue-600 group-hover:translate-x-1 transition-transform" />
                                    </a>
                                    <a href="https://apps.apple.com/us/app/microsoft-excel/id586683407" target="_blank" rel="noopener noreferrer" className="flex items-center justify-between p-4 bg-white dark:bg-blue-900/50 rounded-xl hover:shadow-lg hover:scale-[1.02] transition-all border-2 border-blue-300 dark:border-blue-600 cursor-pointer group">
                                        <span className="font-bold text-blue-800 dark:text-blue-200">Excel</span>
                                        <ExternalLink className="h-5 w-5 text-blue-600 group-hover:translate-x-1 transition-transform" />
                                    </a>
                                    <a href="https://apps.apple.com/us/app/microsoft-word/id586447913" target="_blank" rel="noopener noreferrer" className="flex items-center justify-between p-4 bg-white dark:bg-blue-900/50 rounded-xl hover:shadow-lg hover:scale-[1.02] transition-all border-2 border-blue-300 dark:border-blue-600 cursor-pointer group">
                                        <span className="font-bold text-blue-800 dark:text-blue-200">Word</span>
                                        <ExternalLink className="h-5 w-5 text-blue-600 group-hover:translate-x-1 transition-transform" />
                                    </a>
                                    <a href="https://apps.apple.com/us/app/microsoft-powerpoint/id586449534" target="_blank" rel="noopener noreferrer" className="flex items-center justify-between p-4 bg-white dark:bg-blue-900/50 rounded-xl hover:shadow-lg hover:scale-[1.02] transition-all border-2 border-blue-300 dark:border-blue-600 cursor-pointer group">
                                        <span className="font-bold text-blue-800 dark:text-blue-200">PowerPoint</span>
                                        <ExternalLink className="h-5 w-5 text-blue-600 group-hover:translate-x-1 transition-transform" />
                                    </a>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Support */}
                <div className="mt-12 text-center bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-900/50 dark:to-gray-800/50 rounded-2xl p-8 border">
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
