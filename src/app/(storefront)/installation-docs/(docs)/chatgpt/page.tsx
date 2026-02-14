import Link from 'next/link';
import { ArrowLeft, CheckCircle, ExternalLink, Mail, Key, Globe, MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';

export const metadata = {
    title: 'ChatGPT Plus Activation Guide | SimplySolutions',
    description: 'Step-by-step guide to activate your ChatGPT Plus 12 Months subscription.',
};

export default function ChatGPTInstallationPage() {
    return (
        <div className="min-h-screen bg-gradient-to-br from-background via-teal-50/30 dark:via-teal-950/10 to-background">
            <div className="container max-w-4xl py-10 px-4 mx-auto">
                {/* Header */}
                <div className="mb-10">
                    <Link href="/installation-docs" className="inline-flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors mb-6">
                        <ArrowLeft className="h-4 w-4" />
                        Back to Installation Docs
                    </Link>

                    <div className="text-center">
                        <div className="inline-block px-4 py-1.5 bg-gradient-to-r from-teal-500 to-green-500 text-white text-sm font-medium rounded-full mb-4">
                            Private Account Access
                        </div>
                        <h1 className="text-4xl md:text-5xl font-bold mb-3 bg-gradient-to-r from-teal-600 to-green-600 bg-clip-text text-transparent">
                            ChatGPT Plus Activation
                        </h1>
                        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                            Activate your 12-month ChatGPT Plus subscription with your private account credentials.
                        </p>
                    </div>
                </div>

                <div className="space-y-8">
                    {/* Important Note */}
                    <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-2xl p-6 flex gap-4">
                        <MessageSquare className="h-6 w-6 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                        <div>
                            <p className="font-bold text-blue-800 dark:text-blue-200 text-lg">How it works</p>
                            <p className="text-blue-700 dark:text-blue-300">
                                You will receive a dedicated Outlook email and password. Use these credentials to log into ChatGPT. The OTP for verification will be sent to your Outlook inbox.
                            </p>
                        </div>
                    </div>

                    {/* Step 1: Generate Credentials */}
                    <div className="bg-card border rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow">
                        <div className="flex items-start gap-4 mb-5">
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-teal-500 to-green-500 text-white flex items-center justify-center font-bold text-lg shadow-lg">1</div>
                            <div>
                                <h2 className="text-2xl font-bold">Generate Your Email ID + Password</h2>
                                <p className="text-muted-foreground">This step is mandatory to receive your login credentials</p>
                            </div>
                        </div>
                        <div className="ml-14">
                            <a href="https://simplysolutions.co.in/activate" target="_blank" rel="noopener noreferrer">
                                <Button size="lg" className="gap-2 bg-gradient-to-r from-teal-500 to-green-500 hover:from-teal-600 hover:to-green-600 text-white shadow-lg w-full sm:w-auto">
                                    <Key className="h-5 w-5" />
                                    Go to Activation Page
                                </Button>
                            </a>
                            <ol className="mt-4 list-decimal list-inside space-y-2 text-muted-foreground">
                                <li>Click the button above to visit <strong>simplysolutions.co.in/activate</strong></li>
                                <li>Enter your <strong>Amazon Order ID</strong></li>
                                <li>You will receive:
                                    <ul className="ml-6 mt-2 space-y-1">
                                        <li className="flex items-center gap-2">
                                            <CheckCircle className="h-4 w-4 text-green-500" />
                                            <span>Outlook Email ID</span>
                                        </li>
                                        <li className="flex items-center gap-2">
                                            <CheckCircle className="h-4 w-4 text-green-500" />
                                            <span>Outlook Password</span>
                                        </li>
                                    </ul>
                                </li>
                            </ol>
                        </div>
                    </div>

                    {/* Step 2: Login to Outlook */}
                    <div className="bg-card border rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow">
                        <div className="flex items-start gap-4 mb-5">
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-teal-500 to-green-500 text-white flex items-center justify-center font-bold text-lg shadow-lg">2</div>
                            <div>
                                <h2 className="text-2xl font-bold">Login to Outlook (To Access OTP)</h2>
                                <p className="text-muted-foreground">Keep your Outlook inbox ready for the verification code</p>
                            </div>
                        </div>
                        <div className="ml-14">
                            <a href="https://outlook.com" target="_blank" rel="noopener noreferrer">
                                <Button size="lg" variant="outline" className="gap-2 w-full sm:w-auto">
                                    <Globe className="h-5 w-5" />
                                    Open Outlook.com
                                </Button>
                            </a>
                            <ol className="mt-4 list-decimal list-inside space-y-2 text-muted-foreground">
                                <li>Open <strong>outlook.com</strong></li>
                                <li>Click <strong>Sign in</strong></li>
                                <li>Login using the <strong>Outlook Email ID + Password</strong> from Step 1</li>
                                <li className="text-amber-600 dark:text-amber-400 font-medium">Keep this Outlook inbox open (OTP will come here during ChatGPT login)</li>
                            </ol>
                        </div>
                    </div>

                    {/* Step 3: Login to ChatGPT */}
                    <div className="bg-card border rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow">
                        <div className="flex items-start gap-4 mb-5">
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-teal-500 to-green-500 text-white flex items-center justify-center font-bold text-lg shadow-lg">3</div>
                            <div>
                                <h2 className="text-2xl font-bold">Login to ChatGPT</h2>
                                <p className="text-muted-foreground">Use your Outlook credentials to access ChatGPT</p>
                            </div>
                        </div>
                        <div className="ml-14">
                            <a href="https://chatgpt.com" target="_blank" rel="noopener noreferrer">
                                <Button size="lg" className="gap-2 bg-gradient-to-r from-teal-500 to-green-500 hover:from-teal-600 hover:to-green-600 text-white shadow-lg w-full sm:w-auto">
                                    <ExternalLink className="h-5 w-5" />
                                    Open ChatGPT
                                </Button>
                            </a>
                            <ol className="mt-4 list-decimal list-inside space-y-2 text-muted-foreground">
                                <li>Open <strong>chatgpt.com</strong></li>
                                <li>Click <strong>Log in</strong></li>
                                <li>Enter the same <strong>Outlook Email ID</strong> (from Step 1)</li>
                                <li>When ChatGPT sends a verification code, <strong>open your Outlook inbox</strong> and copy the OTP</li>
                                <li>Paste the OTP on chatgpt.com to complete login</li>
                            </ol>

                            <div className="mt-6 bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 rounded-xl p-4 flex items-center gap-3">
                                <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
                                <span className="font-medium text-green-800 dark:text-green-200">
                                    Enjoy ChatGPT Plus for 12 months!
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Features */}
                    <div className="bg-gradient-to-br from-teal-50 to-green-50 dark:from-teal-950/20 dark:to-green-950/20 border border-teal-200 dark:border-teal-800 rounded-2xl p-6">
                        <h3 className="text-xl font-bold mb-4 text-teal-800 dark:text-teal-200">What&apos;s Included with ChatGPT Plus</h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {[
                                'Access to GPT-4 & Extended Thinking',
                                'Unlimited Image & Video Generation via SORA',
                                'Access to Codex Coding Agent',
                                'Extended Access on Deep Research',
                                'Unlimited Messaging & File Uploads',
                                'Enhanced Access to ChatGPT Agent',
                                'Beta Feature Preview Access',
                                'Create Custom GPTs & Projects',
                                'Advanced Voice Mode'
                            ].map((feature, i) => (
                                <div key={i} className="flex items-center gap-2 text-teal-700 dark:text-teal-300">
                                    <CheckCircle className="h-4 w-4 text-teal-500 flex-shrink-0" />
                                    <span className="text-sm">{feature}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Support */}
                    <div className="border-t pt-8 mt-8">
                        <h3 className="text-xl font-bold mb-4">Need Help?</h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <a href="https://wa.me/918178848830" target="_blank" rel="noopener noreferrer" className="block">
                                <div className="p-4 border rounded-xl hover:bg-muted/50 transition-colors flex items-center gap-3">
                                    <Mail className="h-5 w-5 text-green-600" />
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
