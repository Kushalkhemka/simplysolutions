import Image from 'next/image';
import Link from 'next/link';
import { ArrowLeft, AlertCircle, CheckCircle, Key, Info, Settings, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';

export const metadata = {
    title: 'Windows 10/11 Pro Upgrade Guide | SimplySolutions',
    description: 'Complete step-by-step guide to upgrade from Windows Home to Professional edition',
};

export default function Win1011ProUpgradePage() {
    return (
        <div className="min-h-screen bg-gradient-to-br from-background via-cyan-50/30 dark:via-cyan-950/10 to-background">
            <div className="container max-w-5xl py-10 px-4 mx-auto">
                {/* Header */}
                <div className="mb-10">
                    <Link href="/installation-docs" className="inline-flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors mb-6">
                        <ArrowLeft className="h-4 w-4" />
                        Back to Installation Docs
                    </Link>
                    <div className="text-center">
                        <div className="inline-block px-4 py-1.5 bg-gradient-to-r from-cyan-500 to-blue-500 text-white text-sm font-medium rounded-full mb-4">
                            Upgrade Guide
                        </div>
                        <h1 className="text-4xl md:text-5xl font-bold mb-3 bg-gradient-to-r from-cyan-600 to-blue-600 bg-clip-text text-transparent">
                            WINDOWS 10/11 HOME TO PRO UPGRADE
                        </h1>
                        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                            Follow these instructions to upgrade your Windows Home edition to Professional.
                        </p>
                    </div>
                </div>

                {/* Important Notice */}
                <div className="bg-gradient-to-r from-amber-50 to-yellow-50 dark:from-amber-950/40 dark:to-yellow-950/40 border border-amber-200 dark:border-amber-800 rounded-2xl p-6 mb-10 flex gap-4">
                    <AlertCircle className="h-6 w-6 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
                    <div>
                        <p className="font-bold text-amber-800 dark:text-amber-200 text-lg">Important</p>
                        <p className="text-amber-700 dark:text-amber-300">Please redeem the license within 1 month from date of purchase.</p>
                    </div>
                </div>

                {/* Steps */}
                <div className="space-y-8">
                    {/* Step 1 */}
                    <div className="bg-card border rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow">
                        <div className="flex items-start gap-4 mb-5">
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-500 text-white flex items-center justify-center font-bold text-lg shadow-lg">1</div>
                            <div>
                                <h2 className="text-2xl font-bold">Open Activation Settings</h2>
                                <p className="text-muted-foreground">Go to Start → Settings → System → Activation → Update product key → Change product key → Click Change</p>
                            </div>
                        </div>
                        <div className="ml-14">
                            <div className="relative w-full max-w-lg mx-auto rounded-xl overflow-hidden border shadow-lg">
                                <Image
                                    src="https://api.simplysolutions.co.in/storage/v1/object/public/product-assets/installation-guide-images/STEP1.png"
                                    alt="Open Activation Settings"
                                    width={400}
                                    height={250}
                                    className="w-full h-auto"
                                    unoptimized
                                />
                            </div>
                        </div>
                    </div>

                    {/* Step 2 */}
                    <div className="bg-card border rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow">
                        <div className="flex items-start gap-4 mb-5">
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-500 text-white flex items-center justify-center font-bold text-lg shadow-lg">2</div>
                            <div>
                                <h2 className="text-2xl font-bold">Enter Upgrade Edition Key</h2>
                                <p className="text-muted-foreground">Enter the <strong>Upgrade Edition Product Key</strong> first. Your system will start downloading & installing the Professional version (approx 30-45 mins)</p>
                            </div>
                        </div>
                        <div className="ml-14">
                            <div className="relative w-full max-w-lg mx-auto rounded-xl overflow-hidden border shadow-lg">
                                <Image
                                    src="https://api.simplysolutions.co.in/storage/v1/object/public/product-assets/installation-guide-images/STEP2.png"
                                    alt="Enter Upgrade Key"
                                    width={400}
                                    height={250}
                                    className="w-full h-auto"
                                    unoptimized
                                />
                            </div>
                        </div>
                    </div>

                    {/* Step 3 */}
                    <div className="bg-card border rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow">
                        <div className="flex items-start gap-4 mb-5">
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-500 text-white flex items-center justify-center font-bold text-lg shadow-lg">3</div>
                            <div>
                                <h2 className="text-2xl font-bold">Click Start</h2>
                                <p className="text-muted-foreground">Click Start to begin the upgrade process</p>
                            </div>
                        </div>
                        <div className="ml-14">
                            <div className="relative w-full max-w-lg mx-auto rounded-xl overflow-hidden border shadow-lg">
                                <Image
                                    src="https://api.simplysolutions.co.in/storage/v1/object/public/product-assets/installation-guide-images/STEP-3.png"
                                    alt="Click Start"
                                    width={400}
                                    height={250}
                                    className="w-full h-auto"
                                    unoptimized
                                />
                            </div>
                        </div>
                    </div>

                    {/* Step 4 */}
                    <div className="bg-card border rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow">
                        <div className="flex items-start gap-4 mb-5">
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-500 text-white flex items-center justify-center font-bold text-lg shadow-lg">4</div>
                            <div>
                                <h2 className="text-2xl font-bold">Wait for Upgrade</h2>
                                <p className="text-muted-foreground">Wait 30-45 minutes for the upgrade to complete</p>
                            </div>
                        </div>
                        <div className="ml-14">
                            <div className="relative w-full max-w-lg mx-auto rounded-xl overflow-hidden border shadow-lg">
                                <Image
                                    src="https://api.simplysolutions.co.in/storage/v1/object/public/product-assets/installation-guide-images/step-5.png"
                                    alt="Wait for Upgrade"
                                    width={400}
                                    height={250}
                                    className="w-full h-auto"
                                    unoptimized
                                />
                            </div>
                        </div>
                    </div>

                    {/* Step 5 - Error */}
                    <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-2xl p-6">
                        <div className="flex gap-4">
                            <Info className="h-6 w-6 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
                            <div className="flex-1">
                                <p className="font-bold text-amber-800 dark:text-amber-200 mb-2">Expected Error: 0x80072EE7</p>
                                <p className="text-amber-700 dark:text-amber-300 mb-4">You will face an error with code 0x80072EE7 - DON&apos;T WORRY, this is normal!</p>
                                <div className="relative w-full max-w-lg mx-auto rounded-xl overflow-hidden border shadow-lg">
                                    <Image
                                        src="https://api.simplysolutions.co.in/storage/v1/object/public/product-assets/installation-guide-images/step-6.png"
                                        alt="Expected Error"
                                        width={400}
                                        height={250}
                                        className="w-full h-auto"
                                        unoptimized
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Step 6 */}
                    <div className="bg-card border rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow">
                        <div className="flex items-start gap-4 mb-5">
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-500 text-white flex items-center justify-center font-bold text-lg shadow-lg">6</div>
                            <div>
                                <h2 className="text-2xl font-bold">Click Change Again</h2>
                                <p className="text-muted-foreground">Click on &quot;Change&quot; in Change Product Key option</p>
                            </div>
                        </div>
                        <div className="ml-14">
                            <div className="relative w-full max-w-lg mx-auto rounded-xl overflow-hidden border shadow-lg">
                                <Image
                                    src="https://api.simplysolutions.co.in/storage/v1/object/public/product-assets/installation-guide-images/step-7.png"
                                    alt="Click Change Again"
                                    width={400}
                                    height={250}
                                    className="w-full h-auto"
                                    unoptimized
                                />
                            </div>
                        </div>
                    </div>

                    {/* Step 7 */}
                    <div className="bg-card border rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow">
                        <div className="flex items-start gap-4 mb-5">
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-green-500 to-emerald-500 text-white flex items-center justify-center font-bold text-lg shadow-lg">
                                <Key className="h-5 w-5" />
                            </div>
                            <div>
                                <h2 className="text-2xl font-bold">Enter Activation Key</h2>
                                <p className="text-muted-foreground">This time, insert the <strong>Activation Key</strong> and click Activate</p>
                            </div>
                        </div>
                        <div className="ml-14 grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="relative rounded-xl overflow-hidden border shadow-lg">
                                <Image
                                    src="https://api.simplysolutions.co.in/storage/v1/object/public/product-assets/installation-guide-images/step-8.png"
                                    alt="Enter Activation Key"
                                    width={350}
                                    height={250}
                                    className="w-full h-auto"
                                    unoptimized
                                />
                            </div>
                            <div className="relative rounded-xl overflow-hidden border shadow-lg">
                                <Image
                                    src="https://api.simplysolutions.co.in/storage/v1/object/public/product-assets/installation-guide-images/step-9.png"
                                    alt="Click Activate"
                                    width={350}
                                    height={250}
                                    className="w-full h-auto"
                                    unoptimized
                                />
                            </div>
                        </div>
                    </div>

                    {/* Success */}
                    <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950/40 dark:to-emerald-950/40 border-2 border-green-300 dark:border-green-700 rounded-2xl p-6 shadow-lg">
                        <div className="flex items-start gap-4 mb-5">
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-green-500 to-emerald-500 text-white flex items-center justify-center font-bold text-lg shadow-lg">
                                <CheckCircle className="h-6 w-6" />
                            </div>
                            <div>
                                <h2 className="text-2xl font-bold text-green-800 dark:text-green-200">Windows Activated!</h2>
                                <p className="text-green-700 dark:text-green-300">Your Windows 11/10 Professional is now activated!</p>
                            </div>
                        </div>
                        <div className="ml-14">
                            <div className="relative w-full max-w-lg mx-auto rounded-xl overflow-hidden border shadow-lg">
                                <Image
                                    src="https://api.simplysolutions.co.in/storage/v1/object/public/product-assets/installation-guide-images/step-10.png"
                                    alt="Windows Activated"
                                    width={400}
                                    height={250}
                                    className="w-full h-auto"
                                    unoptimized
                                />
                            </div>
                        </div>
                    </div>

                    {/* Troubleshooting Section */}
                    <div className="border-t-4 border-red-400 pt-8 mt-8">
                        <div className="bg-gradient-to-r from-red-50 to-orange-50 dark:from-red-950/30 dark:to-orange-950/30 border border-red-200 dark:border-red-800 rounded-2xl p-6 mb-6">
                            <div className="flex gap-4">
                                <Settings className="h-6 w-6 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
                                <div>
                                    <h2 className="text-2xl font-bold text-red-800 dark:text-red-200 mb-2">Common Troubleshooting Steps</h2>
                                    <p className="text-red-700 dark:text-red-300">If you face issues like &quot;unable to reach windows services&quot; (Error Codes: 0x80070422, 0x80072ee2, 0x80072EE7)</p>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-6">
                            <div className="bg-card border rounded-2xl p-6 shadow-sm">
                                <h3 className="text-lg font-bold mb-4">Fix Windows Services:</h3>
                                <ol className="list-decimal list-inside space-y-2 text-muted-foreground">
                                    <li>Search &quot;Services&quot; on Search Bar → Click on Services</li>
                                    <li>Find: Windows License Manager Service, Windows Update, Windows Event Log, Windows Event Collector, Windows Time</li>
                                    <li>All must be in <strong>Running</strong> status with <strong>Automatic</strong> startup type</li>
                                    <li>If not, right-click → Properties → Set to Automatic → Start → Apply</li>
                                </ol>
                            </div>

                            <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-2xl p-6">
                                <h3 className="text-lg font-bold mb-4 text-amber-800 dark:text-amber-200">Error 0xc004f050:</h3>
                                <p className="text-amber-700 dark:text-amber-300">This is due to Windows &apos;N&apos; edition or previous organization activation. You need to perform a fresh Windows reinstallation.</p>
                            </div>

                            <div className="bg-card border rounded-2xl p-6 shadow-sm">
                                <h3 className="text-lg font-bold mb-4">Error 0xc004c008 - Phone Activation:</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                    <div className="relative rounded-xl overflow-hidden border shadow-lg">
                                        <Image
                                            src="https://api.simplysolutions.co.in/storage/v1/object/public/product-assets/installation-guide-images/88483-2012619efb9a246b442e3b6d41cd0644-1.webp"
                                            alt="Error 0xc004c008"
                                            width={350}
                                            height={250}
                                            className="w-full h-auto"
                                            unoptimized
                                        />
                                    </div>
                                    <div className="relative rounded-xl overflow-hidden border shadow-lg">
                                        <Image
                                            src="https://api.simplysolutions.co.in/storage/v1/object/public/product-assets/installation-guide-images/e08597ec-214a-42ef-ad78-5ec48a21b5d1.png"
                                            alt="Phone Activation"
                                            width={350}
                                            height={250}
                                            className="w-full h-auto"
                                            unoptimized
                                        />
                                    </div>
                                </div>
                                <ol className="list-decimal list-inside space-y-2 text-muted-foreground">
                                    <li>Press Windows + R → Type <code className="bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">slui 4</code> → Enter</li>
                                    <li>Select your country (e.g., India) → Click Next</li>
                                    <li>Note your 63-digit Installation ID</li>
                                    <li>
                                        Enter Installation ID on the <a href="https://simplysolutions.co.in/getcid" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline font-medium">GetCID activation page</a>
                                    </li>
                                    <li>Wait 2-3 minutes for Confirmation ID</li>
                                    <li>Enter Confirmation ID → Windows Activated!</li>
                                </ol>
                                <div className="mt-4">
                                    <a href="https://simplysolutions.co.in/getcid" target="_blank" rel="noopener noreferrer">
                                        <Button size="sm" className="gap-2 bg-blue-600 hover:bg-blue-700 text-white">
                                            <ExternalLink className="h-4 w-4" />
                                            Open GetCID Page
                                        </Button>
                                    </a>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Warranty Registration */}
                <a href="/digital-warranty" className="block mt-8">
                    <div className="bg-gradient-to-r from-[#232F3E] to-[#37475A] rounded-2xl shadow-lg border border-[#232F3E] overflow-hidden hover:shadow-xl transition-all hover:scale-[1.01] cursor-pointer">
                        <div className="p-5 flex items-center gap-4">
                            <div className="w-14 h-14 bg-gradient-to-br from-[#FF9900] to-[#FF6600] rounded-full flex items-center justify-center flex-shrink-0 shadow-lg">
                                <svg className="w-7 h-7 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                                </svg>
                            </div>
                            <div className="flex-1 min-w-0">
                                <h3 className="text-lg font-bold text-white mb-0.5">Register for FREE Warranty</h3>
                                <p className="text-sm text-gray-300">Get lifetime technical support & remote desktop assistance</p>
                            </div>
                            <div className="flex-shrink-0">
                                <div className="bg-[#FF9900] text-[#0F1111] font-bold px-4 py-2 rounded text-sm shadow-md">Register →</div>
                            </div>
                        </div>
                    </div>
                </a>

                {/* Support */}
                <div className="mt-8 text-center bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-900/50 dark:to-gray-800/50 rounded-2xl p-8 border">
                    <p className="text-lg text-muted-foreground mb-4">In case of any error or query, feel free to reach out to us!</p>
                    <div className="flex flex-wrap justify-center gap-4">
                        <a href="https://wa.me/918178848830" target="_blank" rel="noopener noreferrer">
                            <Button size="lg" className="gap-2 bg-green-600 hover:bg-green-700 text-white">
                                <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" /></svg>
                                WhatsApp: +91-8178848830
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
