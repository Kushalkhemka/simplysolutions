import Image from 'next/image';
import Link from 'next/link';
import { ArrowLeft, Download, AlertCircle, CheckCircle, Key, Phone, Info, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';

export const metadata = {
    title: 'Microsoft Office 2019 Installation Guide | SimplySolutions',
    description: 'Complete step-by-step guide to install and activate Microsoft Office Professional Plus 2019 on Windows',
};

export default function Office2019GuidePage() {
    return (
        <div className="min-h-screen bg-gradient-to-br from-background via-purple-50/30 dark:via-purple-950/10 to-background">
            <div className="container max-w-5xl py-10 px-4 mx-auto">
                {/* Header */}
                <div className="mb-10">
                    <Link href="/installation-docs" className="inline-flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors mb-6">
                        <ArrowLeft className="h-4 w-4" />
                        Back to Installation Docs
                    </Link>
                    <div className="text-center">
                        <div className="inline-block px-4 py-1.5 bg-gradient-to-r from-purple-500 to-pink-500 text-white text-sm font-medium rounded-full mb-4">
                            Complete Guide
                        </div>
                        <h1 className="text-4xl md:text-5xl font-bold mb-3 bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                            MS OFFICE 2019 PROFESSIONAL PLUS
                        </h1>
                        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                            Follow these simple instructions for a smooth installation and activation on Windows.
                        </p>
                    </div>
                </div>

                {/* Important Notice */}
                <div className="bg-gradient-to-r from-red-50 to-orange-50 dark:from-red-950/40 dark:to-orange-950/40 border border-red-200 dark:border-red-800 rounded-2xl p-6 mb-10 flex gap-4">
                    <AlertCircle className="h-6 w-6 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
                    <div>
                        <p className="font-bold text-red-800 dark:text-red-200 text-lg">Important</p>
                        <p className="text-red-700 dark:text-red-300">Please redeem the license within 7 days from date of purchase.</p>
                    </div>
                </div>

                {/* Steps */}
                <div className="space-y-8">
                    {/* Step 1: Remove Old Office */}
                    <div className="bg-card border rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow">
                        <div className="flex items-start gap-4 mb-5">
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 text-white flex items-center justify-center font-bold text-lg shadow-lg">1</div>
                            <div>
                                <h2 className="text-2xl font-bold">Remove Old Office Versions</h2>
                                <p className="text-muted-foreground">Make sure your laptop/PC doesn&apos;t have any old Office version installed</p>
                            </div>
                        </div>
                        <div className="ml-14">
                            <a href="https://tinyurl.com/uninstallofficesuite" target="_blank" rel="noopener noreferrer">
                                <Button size="lg" className="gap-2 bg-gradient-to-r from-red-500 to-orange-500 hover:from-red-600 hover:to-orange-600 text-white shadow-lg">
                                    <Download className="h-5 w-5" />
                                    Download Office Removal Tool
                                </Button>
                            </a>
                            <p className="mt-3 text-muted-foreground">Run the tool to remove any existing Office installation, then continue with fresh installation.</p>
                        </div>
                    </div>

                    {/* Step 2: Visit setup.office.com */}
                    <div className="bg-card border rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow">
                        <div className="flex items-start gap-4 mb-5">
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 text-white flex items-center justify-center font-bold text-lg shadow-lg">2</div>
                            <div>
                                <h2 className="text-2xl font-bold">Redeem & Install Office 2019</h2>
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
                                <li>Login or create a Microsoft Office account</li>
                                <li>Enter the Product License Key from your email → Click <strong>Next</strong> → Click <strong>Redeem</strong></li>
                                <li>Download Office 2019 by clicking Install (select 64-bit, generally systems are 64-bit)</li>
                                <li>Run the downloaded &quot;OfficeSetup.exe&quot; file</li>
                                <li>Wait until Office 2019 installation is completed</li>
                                <li>Open any MS app like Word, Excel, PowerPoint, or Access (recommended)</li>
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
                                    <h2 className="text-2xl font-bold text-amber-800 dark:text-amber-200 mb-2">IMPORTANT STEPS (Follow Carefully for Activation)</h2>
                                    <p className="text-amber-700 dark:text-amber-300">Your software will NOT be activated unless you follow each instruction carefully.</p>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-6">
                            <div className="bg-card border rounded-2xl p-6 shadow-sm">
                                <div className="flex items-start gap-4 mb-4">
                                    <div className="w-8 h-8 rounded-lg bg-amber-100 dark:bg-amber-900 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold">1</div>
                                    <p className="text-lg">Activation Wizard will appear → Click on <strong>&quot;I want to activate the software by telephone&quot;</strong> (DO ONLY THIS) → Click <strong>Next</strong></p>
                                </div>
                                <div className="relative w-full max-w-2xl mx-auto rounded-xl overflow-hidden border shadow-lg mt-4">
                                    <Image
                                        src="/officenewassests/telephone_activation_selection.png"
                                        alt="Select Telephone Activation"
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
                                    <div>
                                        <p className="text-lg mb-3">A 63-digit Installation ID will be displayed on your screen. Visit the GetCID website:</p>
                                        <a href="https://simplysolutions.co.in/getcid" target="_blank" rel="noopener noreferrer">
                                            <Button size="lg" className="gap-2 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white shadow-lg">
                                                <ExternalLink className="h-5 w-5" />
                                                simplysolutions.co.in/getcid
                                            </Button>
                                        </a>
                                    </div>
                                </div>
                                <ul className="list-disc list-inside space-y-2 text-muted-foreground mt-4">
                                    <li>Enter your Installation ID</li>
                                    <li>Enter your Secret Code from the email</li>
                                </ul>
                            </div>

                            <div className="bg-card border rounded-2xl p-6 shadow-sm">
                                <div className="flex items-start gap-4">
                                    <div className="w-8 h-8 rounded-lg bg-amber-100 dark:bg-amber-900 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold">3</div>
                                    <p className="text-lg">Click <strong>ACTIVATE</strong> button on the website to generate Confirmation ID. <strong>Wait for 2-3 minutes.</strong></p>
                                </div>
                            </div>

                            <div className="bg-card border rounded-2xl p-6 shadow-sm">
                                <div className="flex items-start gap-4 mb-4">
                                    <div className="w-8 h-8 rounded-lg bg-amber-100 dark:bg-amber-900 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold">4</div>
                                    <p className="text-lg">After the Confirmation ID is generated, enter it inside your MS application <strong>column by column</strong> to activate your Office 2019.</p>
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
                                        <h3 className="text-xl font-bold text-green-800 dark:text-green-200">Voila! Office 2019 Activated!</h3>
                                        <p className="text-green-700 dark:text-green-300">Your MS Office Suite Professional Plus 2019 will be activated.</p>
                                    </div>
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
                                <p className="text-sm text-gray-300">Get lifetime technical support & reinstallation support</p>
                            </div>
                            <div className="flex-shrink-0">
                                <div className="bg-[#FF9900] text-[#0F1111] font-bold px-4 py-2 rounded text-sm shadow-md">Register →</div>
                            </div>
                        </div>
                    </div>
                </a>

                {/* Support */}
                <div className="mt-8 text-center bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-900/50 dark:to-gray-800/50 rounded-2xl p-8 border">
                    <p className="text-lg text-muted-foreground mb-4">For any queries or installation related issues, feel free to reach out!</p>
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
