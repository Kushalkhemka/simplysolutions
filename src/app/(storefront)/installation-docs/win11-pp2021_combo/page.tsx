import Image from 'next/image';
import Link from 'next/link';
import { ArrowLeft, Download, AlertCircle, CheckCircle, Key, Phone, ExternalLink, Info, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';

export const metadata = {
    title: 'Windows 11 Pro + Office 2021 Combo Installation Guide | SimplySolutions',
    description: 'Complete step-by-step guide to install Windows 11 Pro and Microsoft Office 2021 Professional Plus',
};

export default function Win11PP2021ComboPage() {
    return (
        <div className="min-h-screen bg-gradient-to-br from-background via-indigo-50/30 dark:via-indigo-950/10 to-background">
            <div className="container max-w-5xl py-10 px-4 mx-auto">
                {/* Header */}
                <div className="mb-10">
                    <Link href="/installation-docs" className="inline-flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors mb-6">
                        <ArrowLeft className="h-4 w-4" />
                        Back to Installation Docs
                    </Link>
                    <div className="text-center">
                        <div className="inline-block px-4 py-1.5 bg-gradient-to-r from-indigo-500 to-purple-500 text-white text-sm font-medium rounded-full mb-4">
                            Combo Pack Guide
                        </div>
                        <h1 className="text-4xl md:text-5xl font-bold mb-3 bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                            WINDOWS 11 PRO + OFFICE 2021
                        </h1>
                        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                            Complete installation guide for Windows 11 Professional and Office 2021 Professional Plus.
                        </p>
                    </div>
                </div>

                {/* PART 1: Windows 11 Pro */}
                <div className="mb-12">
                    <div className="bg-gradient-to-r from-cyan-500 to-blue-500 text-white rounded-2xl p-6 mb-8">
                        <h2 className="text-3xl font-bold">Part 1: Windows 11 Professional</h2>
                        <p className="text-cyan-100 mt-2">Install and activate Windows 11 Pro first</p>
                    </div>

                    <div className="space-y-6">
                        {/* Windows Step 1 */}
                        <div className="bg-card border rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow">
                            <div className="flex items-start gap-4 mb-5">
                                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-500 text-white flex items-center justify-center font-bold text-lg shadow-lg">1</div>
                                <div>
                                    <h3 className="text-2xl font-bold">Download Windows 11</h3>
                                    <p className="text-muted-foreground">Get Windows 11 from the official Microsoft website</p>
                                </div>
                            </div>
                            <div className="ml-14">
                                <a href="https://www.microsoft.com/software-download/windows11" target="_blank" rel="noopener noreferrer">
                                    <Button size="lg" className="gap-2 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white shadow-lg">
                                        <ExternalLink className="h-5 w-5" />
                                        microsoft.com/software-download/windows11
                                    </Button>
                                </a>
                            </div>
                        </div>

                        {/* Windows Step 2 */}
                        <div className="bg-card border rounded-2xl p-6 shadow-sm">
                            <div className="flex items-start gap-4">
                                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-500 text-white flex items-center justify-center font-bold text-lg shadow-lg">2</div>
                                <div>
                                    <h3 className="text-2xl font-bold">Activate Windows 11 Pro</h3>
                                    <p className="text-muted-foreground">Go to: <strong>Start → Settings → System → Activation → Change product key</strong></p>
                                </div>
                            </div>
                        </div>

                        {/* Windows Step 3 */}
                        <div className="bg-card border rounded-2xl p-6 shadow-sm">
                            <div className="flex items-start gap-4">
                                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-green-500 to-emerald-500 text-white flex items-center justify-center font-bold text-lg shadow-lg">
                                    <Key className="h-5 w-5" />
                                </div>
                                <div>
                                    <h3 className="text-2xl font-bold">Enter Windows Product Key</h3>
                                    <p className="text-muted-foreground">Enter the <strong>Windows 11 Pro</strong> product key from your order</p>
                                </div>
                            </div>
                        </div>

                        {/* Windows Success */}
                        <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950/40 dark:to-emerald-950/40 border border-green-200 dark:border-green-700 rounded-2xl p-6">
                            <div className="flex items-center gap-4">
                                <CheckCircle className="h-8 w-8 text-green-600 dark:text-green-400" />
                                <p className="text-lg font-semibold text-green-800 dark:text-green-200">Windows 11 Pro is now activated!</p>
                            </div>
                        </div>

                        {/* Upgrading from Home to Pro */}
                        <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-2xl p-6 mb-6">
                            <div className="flex gap-4">
                                <Info className="h-6 w-6 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
                                <div>
                                    <p className="font-bold text-amber-800 dark:text-amber-200 mb-2">Upgrading from Home Edition?</p>
                                    <p className="text-amber-700 dark:text-amber-300 mb-2">If you have Windows Home and need to upgrade to Pro, use this key first:</p>
                                    <code className="bg-amber-100 dark:bg-amber-900 px-3 py-1 rounded font-mono text-amber-800 dark:text-amber-200">P6782-D2NFT-8WMXK-HC8CP-Q3WXG</code>
                                    <p className="text-amber-700 dark:text-amber-300 mt-2">After upgrading, change the key again and enter your purchased license key.</p>
                                </div>
                            </div>
                        </div>

                        {/* Windows Troubleshooting */}
                        <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-2xl p-6">
                            <div className="flex gap-4">
                                <Settings className="h-6 w-6 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
                                <div>
                                    <h4 className="font-bold text-amber-800 dark:text-amber-200 mb-2">Troubleshooting Tips</h4>
                                    <p className="text-sm text-amber-700 dark:text-amber-300">If you face activation errors, ensure Windows Update, Windows License Manager, and Windows Time services are running. Press Win+R → type <code className="bg-amber-100 dark:bg-amber-900 px-1 rounded">slui 4</code> for phone activation if needed.</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* PART 2: Office 2021 */}
                <div className="mb-12">
                    <div className="bg-gradient-to-r from-blue-500 to-indigo-500 text-white rounded-2xl p-6 mb-8">
                        <h2 className="text-3xl font-bold">Part 2: Office 2021 Professional Plus</h2>
                        <p className="text-blue-100 mt-2">Install and activate Office 2021 after Windows is ready</p>
                    </div>

                    <div className="space-y-8">
                        {/* Office Step 1: Get License Key */}
                        <div className="bg-card border rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow">
                            <div className="flex items-start gap-4 mb-5">
                                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-500 text-white flex items-center justify-center font-bold text-lg shadow-lg">1</div>
                                <div>
                                    <h2 className="text-2xl font-bold">Get Your License Key (Mandatory)</h2>
                                    <p className="text-muted-foreground">Generate your Office 2021 license key from the activation page</p>
                                </div>
                            </div>
                            <div className="ml-14">
                                <a href="https://simplysolutions.co.in/activate" target="_blank" rel="noopener noreferrer">
                                    <Button size="lg" className="gap-2 bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 text-white shadow-lg">
                                        <ExternalLink className="h-5 w-5" />
                                        simplysolutions.co.in/activate
                                    </Button>
                                </a>
                                <p className="mt-3 text-muted-foreground">Enter your Amazon Order ID to receive your Office License Key and download instructions.</p>
                            </div>
                        </div>

                        {/* Office Step 2: Remove Old Office */}
                        <div className="bg-card border rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow">
                            <div className="flex items-start gap-4 mb-5">
                                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-500 text-white flex items-center justify-center font-bold text-lg shadow-lg">2</div>
                                <div>
                                    <h2 className="text-2xl font-bold">Before Installation</h2>
                                    <p className="text-muted-foreground">Ensure no older Microsoft Office version/trial is installed</p>
                                </div>
                            </div>
                            <div className="ml-14">
                                <a href="https://tinyurl.com/uninstallofficesuite" target="_blank" rel="noopener noreferrer">
                                    <Button size="lg" className="gap-2 bg-gradient-to-r from-red-500 to-orange-500 hover:from-red-600 hover:to-orange-600 text-white shadow-lg">
                                        <Download className="h-5 w-5" />
                                        Download Office Removal Tool
                                    </Button>
                                </a>
                                <p className="mt-3 text-muted-foreground">Run the tool, then restart your PC before continuing.</p>
                            </div>
                        </div>

                        {/* Office Step 3: Redeem & Install */}
                        <div className="bg-card border rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow">
                            <div className="flex items-start gap-4 mb-5">
                                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-500 text-white flex items-center justify-center font-bold text-lg shadow-lg">3</div>
                                <div>
                                    <h2 className="text-2xl font-bold">Redeem & Install</h2>
                                    <p className="text-muted-foreground">Sign in to your Microsoft account and redeem your license</p>
                                </div>
                            </div>
                            <div className="ml-14">
                                <a href="https://setup.office.com" target="_blank" rel="noopener noreferrer">
                                    <Button size="lg" className="gap-2 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white shadow-lg">
                                        <ExternalLink className="h-5 w-5" />
                                        setup.office.com
                                    </Button>
                                </a>
                                <ol className="mt-4 list-decimal list-inside space-y-2 text-muted-foreground">
                                    <li>Sign in (or create) your Microsoft account</li>
                                    <li>Enter the generated license key → Click <strong>Next</strong> → <strong>Redeem</strong></li>
                                    <li>Click <strong>Install</strong> (choose 64-bit unless you need 32-bit)</li>
                                    <li>Run OfficeSetup.exe and wait for installation to complete</li>
                                    <li>Open any Office app (Word / Excel)</li>
                                </ol>

                                {/* Visual Guide */}
                                <div className="mt-6 space-y-6">
                                    <div className="border rounded-xl overflow-hidden shadow-md max-w-2xl mx-auto">
                                        <Image
                                            src="/officenewassests/enter_product_key.png"
                                            alt="Enter product key and click Next"
                                            width={800}
                                            height={500}
                                            className="w-full h-auto"
                                            unoptimized
                                        />
                                        <div className="bg-muted p-3 text-center text-sm text-muted-foreground">
                                            Step 1: Enter your product key and click <strong>Next</strong>
                                        </div>
                                    </div>
                                    <div className="border rounded-xl overflow-hidden shadow-md max-w-2xl mx-auto">
                                        <Image
                                            src="/officenewassests/redeem_product_key.png"
                                            alt="Click Redeem to activate your license"
                                            width={800}
                                            height={500}
                                            className="w-full h-auto"
                                            unoptimized
                                        />
                                        <div className="bg-muted p-3 text-center text-sm text-muted-foreground">
                                            Step 2: Click <strong>Redeem</strong> to activate your license
                                        </div>
                                    </div>
                                    <div className="border rounded-xl overflow-hidden shadow-md max-w-2xl mx-auto">
                                        <Image
                                            src="/officenewassests/download_options.png"
                                            alt="Click Install/Download"
                                            width={800}
                                            height={500}
                                            className="w-full h-auto"
                                            unoptimized
                                        />
                                        <div className="bg-muted p-3 text-center text-sm text-muted-foreground">
                                            Step 3: Click <strong>Install</strong> (Download) to get the setup file
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Phone Activation Section */}
                        <div className="border-t-4 border-amber-400 pt-8 mt-8">
                            <div className="bg-gradient-to-r from-amber-50 to-yellow-50 dark:from-amber-950/30 dark:to-yellow-950/30 border border-amber-200 dark:border-amber-800 rounded-2xl p-6 mb-6">
                                <div className="flex gap-4">
                                    <Phone className="h-6 w-6 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
                                    <div>
                                        <h2 className="text-2xl font-bold text-amber-800 dark:text-amber-200 mb-2">Step 4: Activation (Phone Method Only)</h2>
                                        <p className="text-amber-700 dark:text-amber-300">This is the mandatory activation method. Follow the steps below carefully.</p>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-6">
                                <div className="bg-card border rounded-2xl p-6 shadow-sm">
                                    <div className="flex items-start gap-4 mb-4">
                                        <div className="w-8 h-8 rounded-lg bg-amber-100 dark:bg-amber-900 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold">1</div>
                                        <div>
                                            <p className="text-lg">If the Activation Wizard doesn&apos;t appear automatically:</p>
                                            <p className="text-muted-foreground">Open Word/Excel → File Menu → Accounts → Click <strong>Activate Product</strong></p>
                                        </div>
                                    </div>
                                    <div className="relative w-full max-w-2xl mx-auto rounded-xl overflow-hidden border shadow-lg mt-4">
                                        <Image
                                            src="/officenewassests/step4_1.png"
                                            alt="Open Activation Wizard"
                                            width={800}
                                            height={500}
                                            className="w-full h-auto"
                                            unoptimized
                                        />
                                    </div>
                                </div>

                                <div className="bg-card border rounded-2xl p-6 shadow-sm">
                                    <div className="flex items-start gap-4 mb-4">
                                        <div className="w-8 h-8 rounded-lg bg-amber-100 dark:bg-amber-900 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold">2</div>
                                        <p className="text-lg">Select: <strong>&quot;I want to activate the software by telephone&quot;</strong> and click Next</p>
                                    </div>
                                    <div className="relative w-full max-w-lg mx-auto rounded-xl overflow-hidden border shadow-lg mt-4">
                                        <Image
                                            src="/officenewassests/telephone_activation_selection.png"
                                            alt="Telephone Activation Selection"
                                            width={350}
                                            height={300}
                                            className="w-full h-auto"
                                            unoptimized
                                        />
                                    </div>
                                </div>

                                <div className="bg-card border rounded-2xl p-6 shadow-sm">
                                    <div className="flex items-start gap-4 mb-4">
                                        <div className="w-8 h-8 rounded-lg bg-amber-100 dark:bg-amber-900 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold">3</div>
                                        <p className="text-lg">Copy the <strong>63-digit Installation ID</strong> shown on your screen</p>
                                    </div>
                                </div>

                                <div className="bg-card border rounded-2xl p-6 shadow-sm">
                                    <div className="flex items-start gap-4 mb-4">
                                        <div className="w-8 h-8 rounded-lg bg-amber-100 dark:bg-amber-900 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold">4</div>
                                        <div>
                                            <p className="text-lg mb-3">Visit the GetCID page to get your Confirmation ID</p>
                                            <a href="https://simplysolutions.co.in/getcid" target="_blank" rel="noopener noreferrer">
                                                <Button size="lg" className="gap-2 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white shadow-lg">
                                                    <ExternalLink className="h-5 w-5" />
                                                    simplysolutions.co.in/getcid
                                                </Button>
                                            </a>
                                        </div>
                                    </div>
                                    <ol className="list-decimal list-inside space-y-2 text-muted-foreground mt-4">
                                        <li>Enter your Installation ID</li>
                                        <li>Enter your Amazon Order ID</li>
                                        <li>Click <strong>ACTIVATE</strong> and wait 2-3 minutes for the Confirmation ID</li>
                                    </ol>
                                </div>

                                <div className="bg-card border rounded-2xl p-6 shadow-sm">
                                    <div className="flex items-start gap-4 mb-4">
                                        <div className="w-8 h-8 rounded-lg bg-amber-100 dark:bg-amber-900 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold">5</div>
                                        <p className="text-lg">Enter the <strong>Confirmation ID</strong> in the Office app (column by column)</p>
                                    </div>
                                    <div className="relative w-full max-w-2xl mx-auto rounded-xl overflow-hidden border shadow-lg mt-4">
                                        <Image
                                            src="/officenewassests/step4_5.png"
                                            alt="Enter Confirmation ID"
                                            width={800}
                                            height={500}
                                            className="w-full h-auto"
                                            unoptimized
                                        />
                                    </div>
                                </div>

                                {/* Success */}
                                <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950/40 dark:to-emerald-950/40 border-2 border-green-300 dark:border-green-700 rounded-2xl p-6 shadow-lg">
                                    <div className="flex items-center gap-4">
                                        <CheckCircle className="h-8 w-8 text-green-600 dark:text-green-400" />
                                        <div>
                                            <h3 className="text-xl font-bold text-green-800 dark:text-green-200">Office 2021 Activated!</h3>
                                            <p className="text-green-700 dark:text-green-300">Your Office Professional Plus 2021 is now activated for lifetime!</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Final Success */}
                <div className="bg-gradient-to-r from-purple-100 to-indigo-100 dark:from-purple-950/40 dark:to-indigo-950/40 border-2 border-purple-300 dark:border-purple-700 rounded-2xl p-8 text-center mb-8">
                    <CheckCircle className="h-16 w-16 text-purple-600 dark:text-purple-400 mx-auto mb-4" />
                    <h2 className="text-3xl font-bold text-purple-800 dark:text-purple-200 mb-2">Combo Pack Complete!</h2>
                    <p className="text-purple-700 dark:text-purple-300">Both Windows 11 Pro and Office 2021 are now activated.</p>
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
                        <a href="https://wa.me/917011787948" target="_blank" rel="noopener noreferrer">
                            <Button size="lg" className="gap-2 bg-green-600 hover:bg-green-700 text-white">
                                <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" /></svg>
                                WhatsApp: +91-7011787948
                            </Button>
                        </a>
                        <a href="https://wa.me/918595899215" target="_blank" rel="noopener noreferrer">
                            <Button size="lg" variant="outline" className="gap-2 border-2 border-orange-400 text-orange-700 hover:bg-orange-50 dark:border-orange-600 dark:text-orange-300">
                                <Phone className="h-5 w-5" />
                                Escalations: +91-8595899215
                            </Button>
                        </a>
                    </div>
                </div>
            </div>
        </div>
    );
}
