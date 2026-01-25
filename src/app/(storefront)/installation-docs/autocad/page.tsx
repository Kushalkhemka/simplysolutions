import Link from 'next/link';
import { ArrowLeft, AlertCircle, CheckCircle, Key, ExternalLink, Settings, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

export const metadata = {
    title: 'AutoCAD Installation Guide | SimplySolutions',
    description: 'Complete step-by-step guide to activate AutoCAD subscription on your Autodesk account',
};

export default function AutoCADGuidePage() {
    return (
        <div className="min-h-screen bg-gradient-to-br from-background via-red-50/30 dark:via-red-950/10 to-background">
            <div className="container max-w-5xl py-10 px-4 mx-auto">
                {/* Header */}
                <div className="mb-10">
                    <Link href="/installation-docs" className="inline-flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors mb-6">
                        <ArrowLeft className="h-4 w-4" />
                        Back to Installation Docs
                    </Link>
                    <div className="text-center">
                        <div className="inline-block px-4 py-1.5 bg-gradient-to-r from-red-500 to-pink-500 text-white text-sm font-medium rounded-full mb-4">
                            Complete Guide
                        </div>
                        <h1 className="text-4xl md:text-5xl font-bold mb-3 bg-gradient-to-r from-red-600 to-pink-600 bg-clip-text text-transparent">
                            AUTODESK AUTOCAD
                        </h1>
                        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                            Follow these instructions to get AutoCAD subscription added to your Autodesk account.
                        </p>
                    </div>
                </div>

                {/* Important Notice */}
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/40 dark:to-indigo-950/40 border border-blue-200 dark:border-blue-800 rounded-2xl p-6 mb-10 flex gap-4">
                    <AlertCircle className="h-6 w-6 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                    <div>
                        <p className="font-bold text-blue-800 dark:text-blue-200 text-lg">No Product Key Required</p>
                        <p className="text-blue-700 dark:text-blue-300">This method adds AutoCAD subscription directly to your Autodesk account. Processing time: up to 1 working day.</p>
                    </div>
                </div>

                {/* Steps */}
                <div className="space-y-8">
                    {/* Step 1: Submit Request */}
                    <div className="bg-card border rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow">
                        <div className="flex items-start gap-4 mb-5">
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-red-500 to-pink-500 text-white flex items-center justify-center font-bold text-lg shadow-lg">1</div>
                            <div>
                                <h2 className="text-2xl font-bold">Get AutoCAD Subscription Added</h2>
                                <p className="text-muted-foreground">Submit your Autodesk account details to activate the subscription</p>
                            </div>
                        </div>
                        <div className="ml-14">
                            <a href="https://simplysolutions.co.in/autocad" target="_blank" rel="noopener noreferrer">
                                <Button size="lg" className="gap-2 bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600 text-white shadow-lg">
                                    <ExternalLink className="h-5 w-5" />
                                    simplysolutions.co.in/autocad
                                </Button>
                            </a>
                            <ol className="mt-4 list-decimal list-inside space-y-2 text-muted-foreground">
                                <li>Enter your 17-Digit Amazon Order ID</li>
                                <li>Scroll down and follow the on-screen form</li>
                                <li>Enter your <strong>Autodesk Email ID</strong> (the email you will use to login)</li>
                                <li>Fill required details and submit the request</li>
                            </ol>
                            <div className="mt-4 p-4 bg-amber-50 dark:bg-amber-950/30 rounded-xl border border-amber-200 dark:border-amber-800">
                                <p className="text-sm text-amber-700 dark:text-amber-300">
                                    <strong>Note:</strong> You will be notified on the given email once your subscription is added.
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Step 2: Download & Install */}
                    <div className="bg-card border rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow">
                        <div className="flex items-start gap-4 mb-5">
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-red-500 to-pink-500 text-white flex items-center justify-center font-bold text-lg shadow-lg">2</div>
                            <div>
                                <h2 className="text-2xl font-bold">Download & Install AutoCAD</h2>
                                <p className="text-muted-foreground">After receiving confirmation, login to your Autodesk account</p>
                            </div>
                        </div>
                        <div className="ml-14">
                            <a href="https://manage.autodesk.com/products" target="_blank" rel="noopener noreferrer">
                                <Button size="lg" className="gap-2 bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 text-white shadow-lg">
                                    <ExternalLink className="h-5 w-5" />
                                    manage.autodesk.com/products
                                </Button>
                            </a>
                            <ol className="mt-4 list-decimal list-inside space-y-2 text-muted-foreground">
                                <li>Login with the <strong>same email</strong> you submitted</li>
                                <li>Open <strong>All Products and Services</strong> from the left menu</li>
                                <li>Find <strong>AutoCAD</strong> and click <strong>Download</strong></li>
                                <li>Install the software</li>
                                <li>Open AutoCAD and login with the same account for activation</li>
                            </ol>
                        </div>
                    </div>

                    {/* Step 3: After Install */}
                    <div className="bg-card border rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow">
                        <div className="flex items-start gap-4 mb-5">
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-red-500 to-pink-500 text-white flex items-center justify-center font-bold text-lg shadow-lg">
                                <RefreshCw className="h-5 w-5" />
                            </div>
                            <div>
                                <h2 className="text-2xl font-bold">After Installation (Important)</h2>
                                <p className="text-muted-foreground">Refresh your subscription sync</p>
                            </div>
                        </div>
                        <div className="ml-14">
                            <ol className="list-decimal list-inside space-y-2 text-muted-foreground">
                                <li><strong>Logout</strong> from your Autodesk account once</li>
                                <li><strong>Re-login</strong> (this refreshes the subscription sync)</li>
                            </ol>
                        </div>
                    </div>

                    {/* Troubleshooting */}
                    <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-2xl p-6">
                        <div className="flex gap-4">
                            <Settings className="h-6 w-6 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
                            <div>
                                <h3 className="text-lg font-bold text-amber-800 dark:text-amber-200 mb-2">AutoCAD Not Appearing in Your Account?</h3>
                                <ul className="list-disc list-inside space-y-2 text-amber-700 dark:text-amber-300">
                                    <li>Confirm you logged in with the <strong>same Autodesk email</strong> you submitted</li>
                                    <li>Logout → Login again, then wait 10-15 minutes and recheck Products</li>
                                </ul>
                            </div>
                        </div>
                    </div>

                    {/* Success */}
                    <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950/40 dark:to-emerald-950/40 border-2 border-green-300 dark:border-green-700 rounded-2xl p-6 shadow-lg">
                        <div className="flex items-center gap-4">
                            <CheckCircle className="h-8 w-8 text-green-600 dark:text-green-400" />
                            <div>
                                <h3 className="text-xl font-bold text-green-800 dark:text-green-200">AutoCAD Activated!</h3>
                                <p className="text-green-700 dark:text-green-300">Your AutoCAD subscription is now active!</p>
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
                                <p className="text-sm text-gray-300">Get lifetime technical support & reinstallation assistance</p>
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
                        <a href="https://wa.me/918178848830" target="_blank" rel="noopener noreferrer">
                            <Button size="lg" variant="outline" className="gap-2 border-2 border-orange-400 text-orange-700 hover:bg-orange-50 dark:border-orange-600 dark:text-orange-300">
                                Escalations: +91-8178848830
                            </Button>
                        </a>
                    </div>
                </div>
            </div>
        </div>
    );
}
