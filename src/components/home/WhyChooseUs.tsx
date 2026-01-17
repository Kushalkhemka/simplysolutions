
import React from 'react';
import Link from 'next/link';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowRight, CheckCircle, ShieldCheck, Clock, Globe, CreditCard, Headset, FileText } from '@phosphor-icons/react/dist/ssr';

export function WhyChooseUs() {
    return (
        <section className="py-16 bg-muted/20">
            <div className="container-dense">
                <div className="text-center max-w-3xl mx-auto mb-12">
                    <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl mb-4">
                        Welcome to SimplySolutions
                    </h2>
                    <div className="h-1.5 w-24 bg-primary mx-auto rounded-full mb-6"></div>
                    <p className="text-muted-foreground text-lg">
                        Your trusted source for genuine software licenses, delivered instantly.
                    </p>
                </div>

                <Tabs defaultValue="why-choose-us" className="w-full">
                    <div className="flex justify-center mb-8 pb-2 px-2">
                        <TabsList className="h-auto w-full grid grid-cols-3 sm:flex sm:flex-wrap justify-center bg-transparent gap-1.5 sm:gap-2 p-0">
                            <TabsTrigger
                                value="why-choose-us"
                                className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground px-2 py-1.5 sm:px-4 sm:py-2.5 md:px-6 md:py-3 rounded-full border border-border bg-background text-[10px] sm:text-sm font-medium shadow-sm transition-all hover:bg-muted whitespace-nowrap"
                            >
                                <span className="hidden sm:inline">Why Choose Us?</span>
                                <span className="sm:hidden">About</span>
                            </TabsTrigger>
                            <TabsTrigger
                                value="windows"
                                className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground px-2 py-1.5 sm:px-4 sm:py-2.5 md:px-6 md:py-3 rounded-full border border-border bg-background text-[10px] sm:text-sm font-medium shadow-sm transition-all hover:bg-muted whitespace-nowrap"
                            >
                                <span className="hidden sm:inline">Windows Operating Systems</span>
                                <span className="sm:hidden">Windows</span>
                            </TabsTrigger>
                            <TabsTrigger
                                value="office"
                                className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground px-2 py-1.5 sm:px-4 sm:py-2.5 md:px-6 md:py-3 rounded-full border border-border bg-background text-[10px] sm:text-sm font-medium shadow-sm transition-all hover:bg-muted whitespace-nowrap"
                            >
                                <span className="hidden sm:inline">Microsoft Office Licenses</span>
                                <span className="sm:hidden">Office</span>
                            </TabsTrigger>
                            <TabsTrigger
                                value="project-visio"
                                className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground px-2 py-1.5 sm:px-4 sm:py-2.5 md:px-6 md:py-3 rounded-full border border-border bg-background text-[10px] sm:text-sm font-medium shadow-sm transition-all hover:bg-muted whitespace-nowrap"
                            >
                                <span className="hidden sm:inline">Project, Visio & Visual Studio</span>
                                <span className="sm:hidden">Project</span>
                            </TabsTrigger>
                            <TabsTrigger
                                value="server"
                                className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground px-2 py-1.5 sm:px-4 sm:py-2.5 md:px-6 md:py-3 rounded-full border border-border bg-background text-[10px] sm:text-sm font-medium shadow-sm transition-all hover:bg-muted whitespace-nowrap"
                            >
                                <span className="hidden sm:inline">Microsoft Server Licenses</span>
                                <span className="sm:hidden">Server</span>
                            </TabsTrigger>
                            <TabsTrigger
                                value="security"
                                className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground px-2 py-1.5 sm:px-4 sm:py-2.5 md:px-6 md:py-3 rounded-full border border-border bg-background text-[10px] sm:text-sm font-medium shadow-sm transition-all hover:bg-muted whitespace-nowrap"
                            >
                                <span className="hidden sm:inline">Antivirus & Security</span>
                                <span className="sm:hidden">Security</span>
                            </TabsTrigger>
                        </TabsList>
                    </div>

                    <div className="bg-background rounded-2xl border shadow-sm p-6 md:p-10 min-h-[400px]">
                        {/* Tab 1: Why Choose Us? */}
                        <TabsContent value="why-choose-us" className="mt-0 animate-in fade-in-50 slide-in-from-bottom-2 duration-300">
                            <div className="grid md:grid-cols-1 gap-8">
                                <div>
                                    <h3 className="text-2xl font-bold mb-4 text-primary">Why Choose SimplySolutions?</h3>
                                    <div className="prose prose-neutral dark:prose-invert max-w-none text-muted-foreground">
                                        <p className="mb-4">
                                            At SimplySolutions, we believe that buying software should be fast, secure, and transparent. Our mission is to make genuine digital licences accessible to everyone—whether you’re a home user, IT professional, or business owner managing multiple devices. We partner only with verified Microsoft distributors and reputable software vendors, ensuring that every licence we sell is 100% authentic, globally valid, and permanently activated.
                                        </p>
                                        <p className="mb-6">
                                            Unlike marketplaces that deal with grey-market keys, we operate with full compliance under digital goods regulations. Every licence sold on our platform is legally transferrable and tested to guarantee successful activation through official Microsoft or partner servers. Our automated system delivers your product key instantly by email, allowing you to download and activate your software within minutes—no delays, no subscriptions, and no extra costs.
                                        </p>

                                        <h4 className="text-xl font-bold text-foreground mb-4">What Makes Us Different?</h4>
                                        <ul className="grid sm:grid-cols-2 gap-3 mb-8 list-none pl-0">
                                            <li className="flex items-start gap-3">
                                                <ShieldCheck className="w-5 h-5 text-primary shrink-0 mt-1" />
                                                <span><strong>Authentic software:</strong> all licences come from Microsoft-authorised distributors.</span>
                                            </li>
                                            <li className="flex items-start gap-3">
                                                <Clock className="w-5 h-5 text-primary shrink-0 mt-1" />
                                                <span><strong>Instant digital delivery:</strong> receive your activation key by email immediately after checkout.</span>
                                            </li>
                                            <li className="flex items-start gap-3">
                                                <CheckCircle className="w-5 h-5 text-primary shrink-0 mt-1" />
                                                <span><strong>Lifetime activation:</strong> pay once and use your software for life, with reactivation rights.</span>
                                            </li>
                                            <li className="flex items-start gap-3">
                                                <Globe className="w-5 h-5 text-primary shrink-0 mt-1" />
                                                <span><strong>Multilingual and global:</strong> licences are region-free and support all major languages.</span>
                                            </li>
                                            <li className="flex items-start gap-3">
                                                <CreditCard className="w-5 h-5 text-primary shrink-0 mt-1" />
                                                <span><strong>Secure payments:</strong> all transactions are encrypted and processed via trusted gateways.</span>
                                            </li>
                                            <li className="flex items-start gap-3">
                                                <Headset className="w-5 h-5 text-primary shrink-0 mt-1" />
                                                <span><strong>Dedicated support:</strong> our multilingual team assists with installation and activation.</span>
                                            </li>
                                            <li className="flex items-start gap-3">
                                                <FileText className="w-5 h-5 text-primary shrink-0 mt-1" />
                                                <span><strong>Business-ready invoicing:</strong> every order includes a VAT-compliant invoice.</span>
                                            </li>
                                        </ul>

                                        <p className="mb-6">
                                            Whether you need Microsoft Office, Windows, Server, or Antivirus solutions, SimplySolutions provides a reliable and affordable way to obtain genuine software. Thousands of customers trust us for transparency, professionalism, and lifetime activation guarantees.
                                        </p>

                                        <div className="flex flex-wrap gap-4 pt-4 border-t">
                                            <h4 className="w-full text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-1">Relevant Links</h4>
                                            <Link href="/" className="text-primary hover:underline flex items-center gap-1 font-medium">Home <ArrowRight size={14} /></Link>
                                            <Link href="/about" className="text-primary hover:underline flex items-center gap-1 font-medium">About Us <ArrowRight size={14} /></Link>
                                            <Link href="/faq" className="text-primary hover:underline flex items-center gap-1 font-medium">FAQ <ArrowRight size={14} /></Link>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </TabsContent>

                        {/* Tab 2: Windows Operating Systems */}
                        <TabsContent value="windows" className="mt-0 animate-in fade-in-50 slide-in-from-bottom-2 duration-300">
                            <div>
                                <h3 className="text-2xl font-bold mb-4 text-primary">Windows Operating System Licenses</h3>
                                <div className="prose prose-neutral dark:prose-invert max-w-none text-muted-foreground">
                                    <p className="mb-4">
                                        Discover the complete range of Windows Operating System licenses available at SimplySolutions. From the latest Windows 11 to reliable versions like Windows 10, Windows 8.1, and Windows 7, we offer 100% genuine, lifetime-activated keys with instant digital delivery. Whether you’re upgrading your PC, reinstalling your system, or setting up new devices, our licences ensure fast, secure, and legitimate activation through Microsoft’s official servers.
                                    </p>
                                    <p className="mb-6">
                                        All Windows licenses from SimplySolutions are fully compliant with Microsoft’s terms and verified for authenticity. You’ll receive your key immediately after checkout, along with detailed installation instructions and direct download links. Our licences work globally, support both 32-bit and 64-bit systems, and can be installed in multiple languages—making them ideal for users in any region.
                                    </p>

                                    <h4 className="text-xl font-bold text-foreground mb-4">Why Choose a Windows License from SimplySolutions?</h4>
                                    <ul className="grid sm:grid-cols-2 gap-3 mb-8 list-none pl-0">
                                        <li className="flex items-start gap-3">
                                            <CheckCircle className="w-5 h-5 text-primary shrink-0 mt-1" />
                                            <span><strong>Official and verified keys:</strong> sourced directly from authorised Microsoft partners.</span>
                                        </li>
                                        <li className="flex items-start gap-3">
                                            <CheckCircle className="w-5 h-5 text-primary shrink-0 mt-1" />
                                            <span><strong>Lifetime activation:</strong> one-time payment with permanent use—no subscriptions required.</span>
                                        </li>
                                        <li className="flex items-start gap-3">
                                            <CheckCircle className="w-5 h-5 text-primary shrink-0 mt-1" />
                                            <span><strong>Instant email delivery:</strong> activation key and setup guide sent immediately after purchase.</span>
                                        </li>
                                        <li className="flex items-start gap-3">
                                            <CheckCircle className="w-5 h-5 text-primary shrink-0 mt-1" />
                                            <span><strong>All editions available:</strong> Home, Pro, Enterprise, Education, and LTSC supported.</span>
                                        </li>
                                        <li className="flex items-start gap-3">
                                            <CheckCircle className="w-5 h-5 text-primary shrink-0 mt-1" />
                                            <span><strong>Multilingual installation:</strong> choose your preferred language during setup.</span>
                                        </li>
                                        <li className="flex items-start gap-3">
                                            <CheckCircle className="w-5 h-5 text-primary shrink-0 mt-1" />
                                            <span><strong>Secure and compliant:</strong> every key verified through Microsoft activation servers.</span>
                                        </li>
                                        <li className="flex items-start gap-3">
                                            <CheckCircle className="w-5 h-5 text-primary shrink-0 mt-1" />
                                            <span><strong>Dedicated assistance:</strong> professional support for installation and activation guidance.</span>
                                        </li>
                                    </ul>

                                    <p className="mb-6">
                                        Whether you need Windows 11 Pro for advanced business features, Windows 10 Home for everyday use, or earlier editions for compatibility, SimplySolutions provides an affordable and legal way to activate your system. Each product key is reusable on the same device after formatting and guaranteed for lifetime use.
                                    </p>

                                    <div className="flex flex-wrap gap-4 pt-4 border-t">
                                        <h4 className="w-full text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-1">Relevant Links</h4>
                                        <Link href="/products?category=windows-11" className="text-primary hover:underline flex items-center gap-1 font-medium">Windows 11 <ArrowRight size={14} /></Link>
                                        <Link href="/products?category=windows-10" className="text-primary hover:underline flex items-center gap-1 font-medium">Windows 10 <ArrowRight size={14} /></Link>
                                        <Link href="/products?category=windows-7" className="text-primary hover:underline flex items-center gap-1 font-medium">Windows 7 <ArrowRight size={14} /></Link>
                                    </div>
                                </div>
                            </div>
                        </TabsContent>

                        {/* Tab 3: Microsoft Office Licenses */}
                        <TabsContent value="office" className="mt-0 animate-in fade-in-50 slide-in-from-bottom-2 duration-300">
                            <div>
                                <h3 className="text-2xl font-bold mb-4 text-primary">Microsoft Office Licenses</h3>
                                <div className="prose prose-neutral dark:prose-invert max-w-none text-muted-foreground">
                                    <p className="mb-4">
                                        Boost your productivity with genuine Microsoft Office licenses from SimplySolutions. We provide lifetime-activated, one-time purchase keys for Office 2016, 2019, 2021, and 2024 editions, all delivered instantly by email. Whether you’re a student, freelancer, or business professional, our Office suites include the essential tools you rely on every day—Word, Excel, PowerPoint, Outlook, and OneNote—plus Access and Publisher in selected editions.
                                    </p>
                                    <p className="mb-6">
                                        Our Office licenses are 100% authentic, verified through Microsoft activation servers, and fully compliant with licensing regulations. Each purchase includes a unique product key, official download link, and easy-to-follow installation instructions. You can choose editions for both Windows and Mac, with multilingual support for flexible setup anywhere in the world.
                                    </p>

                                    <h4 className="text-xl font-bold text-foreground mb-4">Why Choose Office from SimplySolutions?</h4>
                                    <ul className="grid sm:grid-cols-2 gap-3 mb-8 list-none pl-0">
                                        <li className="flex items-start gap-3">
                                            <CheckCircle className="w-5 h-5 text-primary shrink-0 mt-1" />
                                            <span><strong>Permanent activation:</strong> buy once, activate for life—no subscription required.</span>
                                        </li>
                                        <li className="flex items-start gap-3">
                                            <CheckCircle className="w-5 h-5 text-primary shrink-0 mt-1" />
                                            <span><strong>Instant digital delivery:</strong> receive your key and installation link by email within minutes.</span>
                                        </li>
                                        <li className="flex items-start gap-3">
                                            <CheckCircle className="w-5 h-5 text-primary shrink-0 mt-1" />
                                            <span><strong>Multiple editions available:</strong> Home & Student, Home & Business, Professional Plus, and Standard.</span>
                                        </li>
                                        <li className="flex items-start gap-3">
                                            <CheckCircle className="w-5 h-5 text-primary shrink-0 mt-1" />
                                            <span><strong>Windows and Mac compatibility:</strong> includes dedicated versions for both operating systems.</span>
                                        </li>
                                        <li className="flex items-start gap-3">
                                            <CheckCircle className="w-5 h-5 text-primary shrink-0 mt-1" />
                                            <span><strong>Multilingual setup:</strong> install Office in English, German, French, Spanish, Italian, and more.</span>
                                        </li>
                                        <li className="flex items-start gap-3">
                                            <CheckCircle className="w-5 h-5 text-primary shrink-0 mt-1" />
                                            <span><strong>Secure payments:</strong> processed through verified, VAT-compliant payment systems.</span>
                                        </li>
                                        <li className="flex items-start gap-3">
                                            <CheckCircle className="w-5 h-5 text-primary shrink-0 mt-1" />
                                            <span><strong>Expert support:</strong> our multilingual team assists with setup, activation, and troubleshooting.</span>
                                        </li>
                                    </ul>
                                    <p className="mb-6">
                                        Each Microsoft Office edition is designed to meet specific needs. Office 2024 Home & Business is perfect for small enterprises, while Office 2021 Professional Plus offers advanced tools for corporate users. Office for Mac provides a smooth, optimised experience for Apple devices, ensuring seamless cross-platform compatibility.
                                    </p>
                                    <div className="flex flex-wrap gap-4 pt-4 border-t">
                                        <h4 className="w-full text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-1">Relevant Links</h4>
                                        <Link href="/products?category=office-2024" className="text-primary hover:underline flex items-center gap-1 font-medium">Office 2024 <ArrowRight size={14} /></Link>
                                        <Link href="/products?category=office-2021" className="text-primary hover:underline flex items-center gap-1 font-medium">Office 2021 <ArrowRight size={14} /></Link>
                                        <Link href="/products?category=office-2019" className="text-primary hover:underline flex items-center gap-1 font-medium">Office 2019 <ArrowRight size={14} /></Link>
                                        <Link href="/products?category=office-mac" className="text-primary hover:underline flex items-center gap-1 font-medium">Office for Mac <ArrowRight size={14} /></Link>
                                    </div>
                                </div>
                            </div>
                        </TabsContent>

                        {/* Tab 4: Project, Visio & Visual Studio Licenses */}
                        <TabsContent value="project-visio" className="mt-0 animate-in fade-in-50 slide-in-from-bottom-2 duration-300">
                            <div>
                                <h3 className="text-2xl font-bold mb-4 text-primary">Project, Visio & Visual Studio Licenses</h3>
                                <div className="prose prose-neutral dark:prose-invert max-w-none text-muted-foreground">
                                    <p className="mb-4">
                                        SimplySolutions offers professional-grade software solutions for productivity, management, and development with genuine Microsoft Project, Microsoft Visio, and Microsoft Visual Studio licenses. Each product key is delivered instantly by email, permanently activated, and fully compliant with Microsoft’s licensing terms.
                                    </p>
                                    <p className="mb-6">
                                        All licences sold through SimplySolutions are verified through official Microsoft activation servers and guaranteed for lifetime use. You can choose between Standard and Professional editions to match your workflow and organisational needs.
                                    </p>

                                    <div className="grid md:grid-cols-3 gap-6 mb-8">
                                        <div className="bg-muted/50 p-4 rounded-lg">
                                            <h4 className="font-bold text-foreground mb-2">Microsoft Project</h4>
                                            <p className="text-sm">
                                                Powerful project management solution for professionals. Includes task tracking, Gantt charts, and resource management tools to help you stay organised and meet deadlines.
                                            </p>
                                        </div>
                                        <div className="bg-muted/50 p-4 rounded-lg">
                                            <h4 className="font-bold text-foreground mb-2">Microsoft Visio</h4>
                                            <p className="text-sm">
                                                Create professional diagrams, process flows, and organisational charts. Its drag-and-drop interface and smart templates make complex data visualisation simple.
                                            </p>
                                        </div>
                                        <div className="bg-muted/50 p-4 rounded-lg">
                                            <h4 className="font-bold text-foreground mb-2">Microsoft Visual Studio</h4>
                                            <p className="text-sm">
                                                Comprehensive development environment for C#, C++, Python, and more. Enables developers to write, debug, test, and deploy software across all platforms.
                                            </p>
                                        </div>
                                    </div>

                                    <ul className="grid sm:grid-cols-2 gap-3 mb-8 list-none pl-0">
                                        <li className="flex items-start gap-3">
                                            <CheckCircle className="w-5 h-5 text-primary shrink-0 mt-1" />
                                            <span><strong>Authentic Microsoft licences:</strong> 100% genuine and permanently activated.</span>
                                        </li>
                                        <li className="flex items-start gap-3">
                                            <CheckCircle className="w-5 h-5 text-primary shrink-0 mt-1" />
                                            <span><strong>Instant delivery:</strong> receive your key by email immediately after checkout.</span>
                                        </li>
                                        <li className="flex items-start gap-3">
                                            <CheckCircle className="w-5 h-5 text-primary shrink-0 mt-1" />
                                            <span><strong>Standard and Professional:</strong> available for businesses and individuals.</span>
                                        </li>
                                        <li className="flex items-start gap-3">
                                            <CheckCircle className="w-5 h-5 text-primary shrink-0 mt-1" />
                                            <span><strong>Multilingual support:</strong> install in your preferred language globally.</span>
                                        </li>
                                    </ul>

                                    <div className="flex flex-wrap gap-4 pt-4 border-t">
                                        <h4 className="w-full text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-1">Relevant Links</h4>
                                        <Link href="/products?category=project" className="text-primary hover:underline flex items-center gap-1 font-medium">Microsoft Project <ArrowRight size={14} /></Link>
                                        <Link href="/products?category=visio" className="text-primary hover:underline flex items-center gap-1 font-medium">Microsoft Visio <ArrowRight size={14} /></Link>
                                        <Link href="/products?category=visual-studio" className="text-primary hover:underline flex items-center gap-1 font-medium">Visual Studio <ArrowRight size={14} /></Link>
                                    </div>
                                </div>
                            </div>
                        </TabsContent>

                        {/* Tab 5: Microsoft Server Licenses */}
                        <TabsContent value="server" className="mt-0 animate-in fade-in-50 slide-in-from-bottom-2 duration-300">
                            <div>
                                <h3 className="text-2xl font-bold mb-4 text-primary">Microsoft Server Licenses</h3>
                                <div className="prose prose-neutral dark:prose-invert max-w-none text-muted-foreground">
                                    <p className="mb-4">
                                        SimplySolutions provides a complete range of genuine Microsoft Server licenses designed for businesses and IT professionals. Whether you are setting up a small office network or managing a full-scale data centre, our selection of Windows Server, Exchange Server, SQL Server, and Remote Desktop Services (RDS) licenses ensures you have the power and reliability you need.
                                    </p>
                                    <p className="mb-6">
                                        All licences are 100% authentic, permanently activated, and delivered instantly by email. Each key is verified through Microsoft’s official activation servers, guaranteeing legal use and long-term stability.
                                    </p>

                                    <div className="grid md:grid-cols-2 gap-6 mb-8">
                                        <div>
                                            <h4 className="font-bold text-foreground mb-1">Windows Server</h4>
                                            <p className="text-sm text-muted-foreground mb-3">
                                                Backbone for modern IT operations. Available in Datacenter, Standard, and Essentials editions.
                                            </p>
                                            <h4 className="font-bold text-foreground mb-1">Exchange Server</h4>
                                            <p className="text-sm text-muted-foreground">
                                                Leading email and collaboration platform. Host your own mail servers securely.
                                            </p>
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-foreground mb-1">SQL Server</h4>
                                            <p className="text-sm text-muted-foreground mb-3">
                                                Robust database management system for structured data, analytics, and business intelligence.
                                            </p>
                                            <h4 className="font-bold text-foreground mb-1">RDS CALs</h4>
                                            <p className="text-sm text-muted-foreground">
                                                Secure remote connection licenses (User/Device CALs) for remote teams.
                                            </p>
                                        </div>
                                    </div>

                                    <ul className="grid sm:grid-cols-2 gap-3 mb-8 list-none pl-0">
                                        <li className="flex items-start gap-3">
                                            <CheckCircle className="w-5 h-5 text-primary shrink-0 mt-1" />
                                            <span><strong>Authentic Microsoft licences:</strong> 100% genuine and lifetime-activated.</span>
                                        </li>
                                        <li className="flex items-start gap-3">
                                            <CheckCircle className="w-5 h-5 text-primary shrink-0 mt-1" />
                                            <span><strong>Instant digital delivery:</strong> product key and setup guide sent immediately.</span>
                                        </li>
                                        <li className="flex items-start gap-3">
                                            <CheckCircle className="w-5 h-5 text-primary shrink-0 mt-1" />
                                            <span><strong>Fully compliant:</strong> validated through Microsoft’s activation servers.</span>
                                        </li>
                                        <li className="flex items-start gap-3">
                                            <CheckCircle className="w-5 h-5 text-primary shrink-0 mt-1" />
                                            <span><strong>Expert support:</strong> professional assistance for setup and activation.</span>
                                        </li>
                                    </ul>

                                    <div className="flex flex-wrap gap-4 pt-4 border-t">
                                        <h4 className="w-full text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-1">Relevant Links</h4>
                                        <Link href="/products?category=server" className="text-primary hover:underline flex items-center gap-1 font-medium">Windows Server <ArrowRight size={14} /></Link>
                                        <Link href="/products?category=rds" className="text-primary hover:underline flex items-center gap-1 font-medium">RDS Licenses <ArrowRight size={14} /></Link>
                                        <Link href="/products?category=sql-server" className="text-primary hover:underline flex items-center gap-1 font-medium">SQL Server <ArrowRight size={14} /></Link>
                                    </div>
                                </div>
                            </div>
                        </TabsContent>

                        {/* Tab 6: Antivirus & Security */}
                        <TabsContent value="security" className="mt-0 animate-in fade-in-50 slide-in-from-bottom-2 duration-300">
                            <div>
                                <h3 className="text-2xl font-bold mb-4 text-primary">Antivirus, Security & Other Software Licenses</h3>
                                <div className="prose prose-neutral dark:prose-invert max-w-none text-muted-foreground">
                                    <p className="mb-4">
                                        Protect and optimise your digital environment with genuine Antivirus, Security, and Utility Software Licenses from SimplySolutions. We offer a curated range of trusted global brands that keep your systems fast, protected, and reliable. Each licence is 100% authentic, instantly delivered by email, and permanently activated.
                                    </p>
                                    <p className="mb-6">
                                        Whether you’re safeguarding a personal computer or managing security for a business network, our licences cover everything from real-time malware defence to system backup and recovery. All product keys are verified through official vendor activation servers.
                                    </p>

                                    <h4 className="text-xl font-bold text-foreground mb-2">Antivirus & Security Software</h4>
                                    <p className="text-sm text-muted-foreground mb-4">
                                        Defend against threats with solutions from Kaspersky, ESET, McAfee, AVG, Bitdefender, Norton, and Avast.
                                    </p>

                                    <h4 className="text-xl font-bold text-foreground mb-2">Utility & Productivity Software</h4>
                                    <p className="text-sm text-muted-foreground mb-6">
                                        Enhance performance with Corel, Ashampoo, AOMEI, VMware, EaseUS, Autodesk, and Parallels.
                                    </p>

                                    <ul className="grid sm:grid-cols-2 gap-3 mb-8 list-none pl-0">
                                        <li className="flex items-start gap-3">
                                            <CheckCircle className="w-5 h-5 text-primary shrink-0 mt-1" />
                                            <span><strong>100% genuine licences:</strong> sourced from verified software distributors.</span>
                                        </li>
                                        <li className="flex items-start gap-3">
                                            <CheckCircle className="w-5 h-5 text-primary shrink-0 mt-1" />
                                            <span><strong>Instant digital delivery:</strong> receive your activation key instantly.</span>
                                        </li>
                                        <li className="flex items-start gap-3">
                                            <CheckCircle className="w-5 h-5 text-primary shrink-0 mt-1" />
                                            <span><strong>Lifetime activation:</strong> single payment with permanent validity.</span>
                                        </li>
                                        <li className="flex items-start gap-3">
                                            <CheckCircle className="w-5 h-5 text-primary shrink-0 mt-1" />
                                            <span><strong>Cross-platform support:</strong> available for Windows, macOS, and Linux.</span>
                                        </li>
                                    </ul>

                                    <div className="flex flex-wrap gap-4 pt-4 border-t">
                                        <h4 className="w-full text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-1">Relevant Links</h4>
                                        <Link href="/products?category=antivirus" className="text-primary hover:underline flex items-center gap-1 font-medium">Antivirus <ArrowRight size={14} /></Link>
                                        <Link href="/products?category=vmware" className="text-primary hover:underline flex items-center gap-1 font-medium">VMware <ArrowRight size={14} /></Link>
                                        <Link href="/products?category=autodesk" className="text-primary hover:underline flex items-center gap-1 font-medium">Autodesk <ArrowRight size={14} /></Link>
                                    </div>
                                </div>
                            </div>
                        </TabsContent>

                    </div>
                </Tabs>
            </div>
        </section>
    );
}
