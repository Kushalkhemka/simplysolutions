import Image from 'next/image';
import Link from 'next/link';
import { ArrowLeft, CheckCircle, ExternalLink, Mail, Zap, Smartphone } from 'lucide-react';
import { Button } from '@/components/ui/button';

export const metadata = {
    title: 'Canva Pro Lifetime Activation Guide | SimplySolutions',
    description: 'Step-by-step guide to activate your Canva Pro Lifetime subscription.',
};

export default function CanvaInstallationPage() {
    return (
        <div className="min-h-screen bg-gradient-to-br from-background via-purple-50/30 dark:via-purple-950/10 to-background">
            <div className="container max-w-4xl py-10 px-4 mx-auto">
                {/* Header */}
                <div className="mb-10">
                    <Link href="/installation-docs" className="inline-flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors mb-6">
                        <ArrowLeft className="h-4 w-4" />
                        Back to Installation Docs
                    </Link>

                    <div className="text-center">
                        <div className="inline-block px-4 py-1.5 bg-gradient-to-r from-purple-500 to-pink-500 text-white text-sm font-medium rounded-full mb-4">
                            Instant Activation
                        </div>
                        <h1 className="text-4xl md:text-5xl font-bold mb-3 bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                            Canva Pro Lifetime Activation
                        </h1>
                        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                            Activate your lifetime Canva Pro subscription on your existing account. No product key required.
                        </p>
                    </div>
                </div>

                <div className="space-y-8">
                    {/* Important Note */}
                    <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-2xl p-6 flex gap-4">
                        <Zap className="h-6 w-6 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                        <div>
                            <p className="font-bold text-blue-800 dark:text-blue-200 text-lg">How it works</p>
                            <p className="text-blue-700 dark:text-blue-300">
                                This is a direct account upgrade. You will provide your Canva email address, and we will send you an official team invitation to unlock all Pro features.
                            </p>
                        </div>
                    </div>

                    {/* Step 1: Submit Details */}
                    <div className="bg-card border rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow">
                        <div className="flex items-start gap-4 mb-5">
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 text-white flex items-center justify-center font-bold text-lg shadow-lg">1</div>
                            <div>
                                <h2 className="text-2xl font-bold">Submit Your Details</h2>
                                <p className="text-muted-foreground">Enter your Order ID and Canva Email to start the process</p>
                            </div>
                        </div>
                        <div className="ml-14">
                            <a href="https://simplysolutions.co.in/canva" target="_blank" rel="noopener noreferrer">
                                <Button size="lg" className="gap-2 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white shadow-lg w-full sm:w-auto">
                                    <ExternalLink className="h-5 w-5" />
                                    Go to Activation Page
                                </Button>
                            </a>
                            <ol className="mt-4 list-decimal list-inside space-y-2 text-muted-foreground">
                                <li>Click the button above to visit the activation page</li>
                                <li>Enter your <strong>17-Digit Amazon Order ID</strong></li>
                                <li>Enter your <strong>Canva Registered Email ID</strong></li>
                                <li>Submit the form</li>
                            </ol>
                        </div>
                    </div>

                    {/* Step 2: Accept Invitation */}
                    <div className="bg-card border rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow">
                        <div className="flex items-start gap-4 mb-5">
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 text-white flex items-center justify-center font-bold text-lg shadow-lg">2</div>
                            <div>
                                <h2 className="text-2xl font-bold">Accept Invitation</h2>
                                <p className="text-muted-foreground">Look for the invitation email from Canva</p>
                            </div>
                        </div>
                        <div className="ml-14">
                            <div className="flex flex-col sm:flex-row gap-4 mb-4">
                                <div className="flex-1 p-4 bg-muted rounded-xl border">
                                    <Mail className="h-6 w-6 text-primary mb-2" />
                                    <h3 className="font-semibold mb-1">Check Email</h3>
                                    <p className="text-sm text-muted-foreground">Within 24 hours (usually faster), you will receive an email from Canva.</p>
                                </div>
                                <div className="flex-1 p-4 bg-muted rounded-xl border">
                                    <CheckCircle className="h-6 w-6 text-green-600 mb-2" />
                                    <h3 className="font-semibold mb-1">Join Team</h3>
                                    <p className="text-sm text-muted-foreground">Open the email and click <strong>"Join Team"</strong> or <strong>"Accept Invitation"</strong>.</p>
                                </div>
                            </div>
                            <p className="text-amber-600 dark:text-amber-400 text-sm font-medium">
                                Note: Please accept the invitation within 72 hours to avoid expiration.
                            </p>
                        </div>
                    </div>

                    {/* Step 3: Complete Setup */}
                    <div className="bg-card border rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow">
                        <div className="flex items-start gap-4 mb-5">
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 text-white flex items-center justify-center font-bold text-lg shadow-lg">3</div>
                            <div>
                                <h2 className="text-2xl font-bold">Log Out & Relogin</h2>
                                <p className="text-muted-foreground">Final step to refresh account status</p>
                            </div>
                        </div>
                        <div className="ml-14">
                            <p className="mb-4 text-muted-foreground">
                                After accepting the invite, assume the role of your new Pro team:
                            </p>
                            <ul className="list-disc list-inside space-y-2 text-muted-foreground">
                                <li><strong>Log out</strong> of your Canva account completely.</li>
                                <li><strong>Log back in</strong> using the same email address.</li>
                                <li>Switch to the new Team if not automatically selected (click your profile icon → Switch Team).</li>
                            </ul>

                            <div className="mt-6 bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 rounded-xl p-4 flex items-center gap-3">
                                <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
                                <span className="font-medium text-green-800 dark:text-green-200">
                                    Enjoy full Canva Pro features!
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Support */}
                    <div className="border-t pt-8 mt-8">
                        <h3 className="text-xl font-bold mb-4">Need Help?</h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <a href="https://wa.me/918178848830" target="_blank" rel="noopener noreferrer" className="block">
                                <div className="p-4 border rounded-xl hover:bg-muted/50 transition-colors flex items-center gap-3">
                                    <Smartphone className="h-5 w-5 text-green-600" />
                                    <div>
                                        <div className="font-semibold">WhatsApp Support</div>
                                        <div className="text-sm text-muted-foreground">+91 70117 87948</div>
                                    </div>
                                </div>
                            </a>
                            <div className="p-4 border rounded-xl flex items-center gap-3 bg-muted/30">
                                <div className="h-2 w-2 rounded-full bg-green-500"></div>
                                <span className="text-sm text-muted-foreground">Average response time: &lt; 2 hours</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
