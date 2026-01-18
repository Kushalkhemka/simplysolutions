import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
    FacebookLogo,
    TwitterLogo,
    InstagramLogo,
    YoutubeLogo,
    Envelope,
    Phone,
    MapPin,
    CreditCard,
    ShieldCheck,
    Truck,
    Headset,
    Clock,
    PaperPlaneRight,
    WhatsappLogo
} from '@/components/ui/icons';

const categories = [
    { name: 'Operating Systems', slug: 'operating-systems' },
    { name: 'Office Suites', slug: 'office-suites' },
    { name: 'Antivirus', slug: 'antivirus' },
    { name: 'Design Software', slug: 'design-software' },
    { name: 'Developer Tools', slug: 'developer-tools' },
];

const quickLinks = [
    { name: 'About Us', href: '/about' },
    { name: 'Contact', href: '/contact' },
    { name: 'FAQs', href: '/faq' },
    { name: 'Blog', href: '/blog' },
    { name: 'Affiliate Program', href: '/affiliate' },
    { name: 'Refer a Friend', href: '/dashboard/referrals' },
];

const customerService = [
    { name: 'My Account', href: '/dashboard' },
    { name: 'Track Order', href: '/dashboard/orders' },
    { name: 'License Recovery', href: '/dashboard/licenses' },
    { name: 'Shipping Policy', href: '/shipping' },
    { name: 'Return Policy', href: '/refund' },
    { name: 'Support Center', href: '/support' },
];

export function Footer() {
    return (
        <footer className="bg-gray-50 dark:bg-[#1a1c23] text-gray-900 dark:text-white pt-12 border-t border-gray-200 dark:border-white/5">
            {/* 1. Newsletter & Features */}
            <div className="container-dense pb-12 border-b border-gray-200 dark:border-white/10">
                <div className="flex flex-col lg:flex-row gap-8 items-center justify-between">
                    <div className="flex-1 w-full lg:max-w-xl">
                        <h3 className="text-xl font-bold mb-2 flex items-center gap-2 text-foreground">
                            <PaperPlaneRight className="w-6 h-6 text-primary" />
                            Subscribe to our Newsletter
                        </h3>
                        <p className="text-muted-foreground text-sm mb-4">Get the latest updates on new products and upcoming sales.</p>
                        <form className="flex gap-2">
                            <Input
                                placeholder="Enter your email address"
                                className="bg-white dark:bg-white/5 border-gray-200 dark:border-white/10 text-foreground dark:text-white placeholder:text-muted-foreground focus-visible:ring-primary h-11"
                            />
                            <Button className="h-11 px-8 font-bold text-white">Subscribe</Button>
                        </form>
                    </div>
                    <div className="flex gap-8 lg:gap-12 flex-wrap justify-center lg:justify-end">
                        <div className="flex gap-3 items-center">
                            <div className="p-3 rounded-full bg-primary/10 text-primary">
                                <ShieldCheck className="w-6 h-6" />
                            </div>
                            <div>
                                <div className="font-bold text-sm text-foreground">100% Secure</div>
                                <div className="text-xs text-muted-foreground">256-bit Encrpytion</div>
                            </div>
                        </div>
                        <div className="flex gap-3 items-center">
                            <div className="p-3 rounded-full bg-primary/10 text-primary">
                                <Clock className="w-6 h-6" />
                            </div>
                            <div>
                                <div className="font-bold text-sm text-foreground">Instant Delivery</div>
                                <div className="text-xs text-muted-foreground">Within seconds</div>
                            </div>
                        </div>
                        <div className="flex gap-3 items-center">
                            <div className="p-3 rounded-full bg-primary/10 text-primary">
                                <Headset className="w-6 h-6" />
                            </div>
                            <div>
                                <div className="font-bold text-sm text-foreground">24/7 Support</div>
                                <div className="text-xs text-muted-foreground">Live Chat Assistance</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* 2. Main Footer Links */}
            <div className="container-dense py-12">
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-8">
                    <div className="col-span-2 lg:col-span-2 pr-8">
                        <Link href="/" className="flex items-center gap-2 mb-6 group">
                            <div className="relative w-8 h-8 group-hover:scale-105 transition-transform">
                                <Image
                                    src="/logo-symbol.png"
                                    alt="SimplySolutions"
                                    fill
                                    className="object-contain"
                                />
                            </div>
                            <h2 className="text-2xl font-bold tracking-tight text-foreground dark:text-white">
                                Simply<span className="text-primary text-orange-600 dark:text-orange-500">Solutions</span>
                            </h2>
                        </Link>
                        <p className="text-muted-foreground text-sm leading-relaxed mb-6 max-w-sm">
                            SimplySolutions is your premier destination for genuine software licenses.
                            We partner directly with authorized distributors to provide you with the best prices
                            for 100% authentic digital products.
                        </p>
                        <div className="flex gap-4">
                            {[
                                { Icon: FacebookLogo, href: '#' },
                                { Icon: TwitterLogo, href: '#' },
                                { Icon: InstagramLogo, href: '#' },
                                { Icon: YoutubeLogo, href: '#' }
                            ].map(({ Icon, href }, i) => (
                                <Link key={i} href={href} className="w-10 h-10 rounded-full bg-gray-100 dark:bg-white/5 flex items-center justify-center hover:bg-primary hover:text-white transition-all text-muted-foreground">
                                    <Icon className="w-5 h-5" />
                                </Link>
                            ))}
                        </div>
                    </div>

                    <div>
                        <h4 className="font-bold text-lg mb-6 text-foreground">Categories</h4>
                        <ul className="space-y-3">
                            {categories.map((item) => (
                                <li key={item.slug}>
                                    <Link href={`/products?category=${item.slug}`} className="text-muted-foreground hover:text-primary transition-colors text-sm">
                                        {item.name}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>

                    <div>
                        <h4 className="font-bold text-lg mb-6 text-foreground">Customer Care</h4>
                        <ul className="space-y-3">
                            {customerService.map((item) => (
                                <li key={item.name}>
                                    <Link href={item.href} className="text-muted-foreground hover:text-primary transition-colors text-sm">
                                        {item.name}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>

                    <div>
                        <h4 className="font-bold text-lg mb-6 text-foreground">Contact Us</h4>
                        <ul className="space-y-4">
                            <li className="flex gap-3 text-sm text-muted-foreground">
                                <MapPin className="w-5 h-5 text-primary flex-shrink-0" />
                                <span>Delhi, India</span>
                            </li>
                            <li className="flex gap-3 text-sm text-muted-foreground">
                                <Envelope className="w-5 h-5 text-primary flex-shrink-0" />
                                <a href="mailto:support@simplysolutions.co.in" className="hover:text-foreground transition-colors">support@simplysolutions.co.in</a>
                            </li>
                            <li className="flex gap-3 text-sm text-muted-foreground">
                                <WhatsappLogo className="w-5 h-5 text-[#25D366] flex-shrink-0 mt-0.5" />
                                <div>
                                    <span className="block font-medium text-foreground text-xs mb-0.5">Escalations</span>
                                    <a href="https://wa.me/918595899215" target="_blank" rel="noopener noreferrer" className="hover:text-primary transition-colors">
                                        +91 8595899215
                                    </a>
                                </div>
                            </li>
                            <li className="flex gap-3 text-sm text-muted-foreground">
                                <WhatsappLogo className="w-5 h-5 text-[#25D366] flex-shrink-0 mt-0.5" />
                                <div>
                                    <span className="block font-medium text-foreground text-xs mb-0.5">24/7 AI Tech Support</span>
                                    <a href="https://wa.me/919953994557" target="_blank" rel="noopener noreferrer" className="hover:text-primary transition-colors">
                                        +91 99539 94557
                                    </a>
                                </div>
                            </li>
                        </ul>
                    </div>
                </div>
            </div>

            {/* 3. Partner Badge & Payment Methods Section */}
            <div className="bg-gray-100 dark:bg-[#15161b] py-8 border-t border-gray-200 dark:border-white/5">
                <div className="container-dense">
                    {/* Partner Badge & Payment Methods Row */}
                    <div className="flex flex-col md:flex-row items-center justify-between gap-6 mb-6 pb-6 border-b border-gray-200 dark:border-white/10">
                        {/* Microsoft Partner Badge */}
                        <div className="flex items-center">
                            <Image
                                src="https://digitallicense.shop/wp-content/uploads/2024/07/Microsoft-Parnter.svg"
                                alt="Microsoft Certified Partner"
                                width={250}
                                height={100}
                                className="object-contain dark:brightness-0 dark:invert"
                            />
                        </div>

                        {/* Payment Methods */}
                        <div className="flex flex-wrap items-center gap-3">
                            <span className="text-sm text-muted-foreground mr-2">We Accept:</span>
                            {/* Visa */}
                            <div className="h-8 w-14 bg-white rounded border border-gray-200 dark:border-gray-300 flex items-center justify-center px-2">
                                <svg viewBox="0 0 750 471" className="w-full h-full">
                                    <path d="M278.198,334.228 L311.563,138.248 L364.373,138.248 L330.995,334.228 L278.198,334.228 Z" fill="#00579f" />
                                    <path d="M524.307,142.687 C513.573,138.746 496.485,134.509 475.537,134.509 C423.178,134.509 386.284,162.126 385.987,201.593 C385.687,231.229 412.952,247.666 433.437,257.482 C454.436,267.523 461.566,274.037 461.471,283.035 C461.313,296.906 444.473,303.248 428.753,303.248 C406.836,303.248 395.202,300.103 377.285,292.266 L370.095,288.807 L362.28,336.309 C375.14,342.073 397.854,347.032 421.46,347.277 C477.12,347.277 513.277,320.054 513.717,278.073 C513.925,254.793 499.477,237.014 468.462,222.309 C449.748,213.035 438.253,206.712 438.367,197.144 C438.367,188.554 448.239,179.352 469.627,179.352 C487.375,179.096 500.555,182.847 510.835,186.788 L515.671,189.093 L523.263,143.013" fill="#00579f" />
                                    <path d="M661.615,138.248 L620.858,138.248 C607.861,138.248 598.211,141.832 592.373,155.122 L514.268,334.228 L569.844,334.228 C569.844,334.228 578.941,309.979 581.092,304.047 C587.139,304.047 641.241,304.131 648.992,304.131 C650.681,311.839 655.792,334.228 655.792,334.228 L704.861,334.228 L661.615,138.248 Z M596.795,263.353 C601.22,251.929 619.063,203.392 619.063,203.392 C618.766,203.886 623.471,191.693 626.212,184.088 L629.755,201.711 C629.755,201.711 640.762,253.272 643.011,263.353 L596.795,263.353 L596.795,263.353 Z" fill="#00579f" />
                                    <path d="M232.903,138.248 L181.119,271.338 L175.535,244.212 C166.058,213.858 137.907,180.781 106.453,164.223 L153.985,333.983 L210.023,333.922 L289.061,138.248 L232.903,138.248" fill="#00579f" />
                                    <path d="M131.92,138.248 L45.879,138.248 L45.139,142.158 C111.576,158.989 156.423,199.476 175.535,244.236 L156.028,155.367 C152.619,142.285 143.089,138.681 131.92,138.248" fill="#faa61a" />
                                </svg>
                            </div>
                            {/* Mastercard */}
                            <div className="h-8 w-14 bg-white rounded border border-gray-200 dark:border-gray-300 flex items-center justify-center px-2">
                                <svg viewBox="0 0 750 471" className="w-full h-full">
                                    <rect fill="#ff5f00" x="299" y="80" width="152" height="311" />
                                    <path fill="#eb001b" d="M325,235.5 C325,171.1 355.4,114.2 401.8,80 C369.7,54.8 329.3,40 285.3,40 C175.4,40 86.3,129.1 86.3,239 C86.3,348.9 175.4,438 285.3,438 C329.3,438 369.7,423.2 401.8,398 C355.4,364.3 325,306.9 325,235.5" />
                                    <path fill="#f79e1b" d="M663.7,239 C663.7,348.9 574.6,438 464.7,438 C420.7,438 380.3,423.2 348.2,398 C394.6,363.8 425,306.9 425,235.5 C425,164.1 394.6,107.2 348.2,73 C380.3,47.8 420.7,33 464.7,33 C574.6,33 663.7,129.1 663.7,239" />
                                </svg>
                            </div>
                            {/* PayPal */}
                            <div className="h-8 w-14 bg-white rounded border border-gray-200 dark:border-gray-300 flex items-center justify-center px-2">
                                <svg viewBox="0 0 124 33" className="w-full h-full">
                                    <path fill="#253B80" d="M46.211 6.749h-6.839a.95.95 0 0 0-.939.802l-2.766 17.537a.57.57 0 0 0 .564.658h3.265a.95.95 0 0 0 .939-.803l.746-4.73a.95.95 0 0 1 .938-.803h2.165c4.505 0 7.105-2.18 7.784-6.5.306-1.89.013-3.375-.872-4.415-.972-1.142-2.696-1.746-4.985-1.746zM47 13.154c-.374 2.454-2.249 2.454-4.062 2.454h-1.032l.724-4.583a.57.57 0 0 1 .563-.481h.473c1.235 0 2.4 0 3.002.704.359.42.469 1.044.332 1.906zM66.654 13.075h-3.275a.57.57 0 0 0-.563.481l-.145.916-.229-.332c-.709-1.029-2.29-1.373-3.868-1.373-3.619 0-6.71 2.741-7.312 6.586-.313 1.918.132 3.752 1.22 5.031.998 1.176 2.426 1.666 4.125 1.666 2.916 0 4.533-1.875 4.533-1.875l-.146.91a.57.57 0 0 0 .562.66h2.95a.95.95 0 0 0 .939-.803l1.77-11.209a.568.568 0 0 0-.561-.658zm-4.565 6.374c-.316 1.871-1.801 3.127-3.695 3.127-.951 0-1.711-.305-2.199-.883-.484-.574-.668-1.391-.514-2.301.295-1.855 1.805-3.152 3.67-3.152.93 0 1.686.309 2.184.892.501.589.699 1.411.554 2.317zM84.096 13.075h-3.291a.954.954 0 0 0-.787.417l-4.539 6.686-1.924-6.425a.953.953 0 0 0-.912-.678h-3.234a.57.57 0 0 0-.541.754l3.625 10.638-3.408 4.811a.57.57 0 0 0 .465.9h3.287a.949.949 0 0 0 .781-.408l10.946-15.8a.57.57 0 0 0-.468-.895z" />
                                    <path fill="#179BD7" d="M94.992 6.749h-6.84a.95.95 0 0 0-.938.802l-2.766 17.537a.569.569 0 0 0 .562.658h3.51a.665.665 0 0 0 .656-.562l.785-4.971a.95.95 0 0 1 .938-.803h2.164c4.506 0 7.105-2.18 7.785-6.5.307-1.89.012-3.375-.873-4.415-.971-1.142-2.694-1.746-4.983-1.746zm.789 6.405c-.373 2.454-2.248 2.454-4.062 2.454h-1.031l.725-4.583a.568.568 0 0 1 .562-.481h.473c1.234 0 2.4 0 3.002.704.359.42.468 1.044.331 1.906zM115.434 13.075h-3.273a.567.567 0 0 0-.562.481l-.145.916-.23-.332c-.709-1.029-2.289-1.373-3.867-1.373-3.619 0-6.709 2.741-7.311 6.586-.312 1.918.131 3.752 1.219 5.031 1 1.176 2.426 1.666 4.125 1.666 2.916 0 4.533-1.875 4.533-1.875l-.146.91a.57.57 0 0 0 .564.66h2.949a.95.95 0 0 0 .938-.803l1.771-11.209a.571.571 0 0 0-.565-.658zm-4.565 6.374c-.314 1.871-1.801 3.127-3.695 3.127-.949 0-1.711-.305-2.199-.883-.484-.574-.666-1.391-.514-2.301.297-1.855 1.805-3.152 3.67-3.152.93 0 1.686.309 2.184.892.501.589.699 1.411.554 2.317zM119.295 7.23l-2.807 17.858a.569.569 0 0 0 .562.658h2.822c.469 0 .867-.34.939-.803l2.768-17.536a.57.57 0 0 0-.562-.659h-3.16a.571.571 0 0 0-.562.482z" />
                                </svg>
                            </div>
                            {/* RuPay */}
                            <div className="h-8 w-14 bg-white rounded border border-gray-200 dark:border-gray-300 flex items-center justify-center px-2">
                                <svg viewBox="0 0 200 60" className="w-full h-full">
                                    <path fill="#097A44" d="M15,15 L25,15 C35,15 40,20 40,28 C40,36 35,42 25,42 L20,42 L18,55 L8,55 L15,15 Z M22,22 L19,35 L24,35 C28,35 31,32 31,28 C31,24 28,22 24,22 L22,22 Z" />
                                    <path fill="#F37021" d="M45,15 L55,15 L52,32 C51,38 55,42 61,42 C67,42 73,38 74,32 L77,15 L87,15 L84,32 C82,44 72,52 60,52 C48,52 42,44 44,32 L45,15 Z M92,15 L110,15 C118,15 123,19 123,26 C123,32 119,36 114,38 L122,55 L110,55 L104,40 L99,40 L96,55 L86,55 L92,15 Z M103,22 L100,33 L107,33 C111,33 114,30 114,27 C114,24 111,22 107,22 L103,22 Z" />
                                    <path fill="#097A44" d="M125,15 L135,15 L132,32 C131,38 135,42 141,42 C147,42 153,38 154,32 L157,15 L167,15 L164,32 C162,44 152,52 140,52 C128,52 122,44 124,32 L125,15 Z" />
                                    <path fill="#F37021" d="M170,15 L180,15 L185,35 L195,15 L205,15 L188,55 L178,55 L170,15 Z" />
                                </svg>
                            </div>
                            {/* UPI */}
                            <div className="h-8 w-14 bg-white rounded border border-gray-200 dark:border-gray-300 flex items-center justify-center px-2">
                                <svg viewBox="0 0 100 40" className="w-full h-full">
                                    <path fill="#3D8168" d="M5,5 L25,5 L25,35 L5,35 Z" />
                                    <path fill="#ED752E" d="M30,5 L50,5 L40,35 L20,35 Z" />
                                    <text x="55" y="28" fontFamily="Arial, sans-serif" fontSize="18" fontWeight="bold" fill="#5F259F">U</text>
                                    <text x="68" y="28" fontFamily="Arial, sans-serif" fontSize="18" fontWeight="bold" fill="#5F259F">P</text>
                                    <text x="81" y="28" fontFamily="Arial, sans-serif" fontSize="18" fontWeight="bold" fill="#5F259F">I</text>
                                </svg>
                            </div>
                            {/* Apple Pay */}
                            <div className="h-8 w-14 bg-black rounded border border-gray-800 flex items-center justify-center px-2">
                                <svg viewBox="0 0 165.521 105.965" className="w-full h-full">
                                    <path fill="#fff" d="M150.698 0H14.823c-.566 0-1.133 0-1.698.003-.477.004-.953.009-1.43.022-1.039.028-2.087.09-3.114.274a10.51 10.51 0 0 0-2.958.975 9.932 9.932 0 0 0-4.35 4.35 10.463 10.463 0 0 0-.975 2.96C.113 9.611.052 10.658.024 11.696a70.22 70.22 0 0 0-.022 1.43C0 13.69 0 14.256 0 14.823v76.318c0 .567 0 1.132.002 1.699.003.476.009.953.022 1.43.028 1.036.09 2.084.275 3.11a10.46 10.46 0 0 0 .974 2.96 9.897 9.897 0 0 0 1.83 2.52 9.874 9.874 0 0 0 2.52 1.83c.947.483 1.917.79 2.96.977 1.025.183 2.073.245 3.112.273.477.011.953.017 1.43.02.565.004 1.132.004 1.698.004h135.875c.565 0 1.132 0 1.697-.004.476-.002.954-.009 1.431-.02 1.037-.028 2.085-.09 3.113-.273a10.478 10.478 0 0 0 2.958-.977 9.955 9.955 0 0 0 4.35-4.35c.483-.947.789-1.917.974-2.96.186-1.026.246-2.074.274-3.11.013-.477.02-.954.022-1.43.004-.567.004-1.132.004-1.699V14.824c0-.567 0-1.133-.004-1.699a63.067 63.067 0 0 0-.022-1.429c-.028-1.038-.088-2.085-.274-3.112a10.4 10.4 0 0 0-.974-2.96 9.94 9.94 0 0 0-4.35-4.35A10.52 10.52 0 0 0 156.939.3c-1.028-.185-2.076-.246-3.113-.274a71.417 71.417 0 0 0-1.431-.022C151.83 0 151.263 0 150.698 0z" />
                                    <path d="M150.698 3.532l1.672.003c.452.003.905.008 1.36.02.793.022 1.719.065 2.583.22.75.135 1.38.34 1.984.648a6.392 6.392 0 0 1 2.804 2.807c.306.6.51 1.226.645 1.983.154.854.197 1.783.218 2.58.013.45.019.9.02 1.36.005.557.005 1.113.005 1.671v76.318c0 .558 0 1.114-.004 1.682-.002.45-.008.9-.02 1.35-.022.796-.065 1.725-.221 2.589a6.855 6.855 0 0 1-.645 1.975 6.397 6.397 0 0 1-2.808 2.807c-.6.306-1.228.511-1.971.645-.881.157-1.847.2-2.574.22-.457.01-.912.017-1.379.019-.555.004-1.113.004-1.669.004H14.801c-.013 0-.025 0-.037 0-.556 0-1.113 0-1.658-.004a56.827 56.827 0 0 1-1.364-.018c-.79-.022-1.722-.064-2.584-.22a6.938 6.938 0 0 1-1.98-.646 6.375 6.375 0 0 1-1.622-1.18 6.376 6.376 0 0 1-1.18-1.623 6.855 6.855 0 0 1-.646-1.979c-.156-.863-.2-1.788-.22-2.578a66.088 66.088 0 0 1-.02-1.355l-.003-1.327V14.824l.002-1.349a68.7 68.7 0 0 1 .02-1.353c.022-.792.065-1.717.222-2.587a6.924 6.924 0 0 1 .646-1.98c.304-.598.7-1.144 1.18-1.623a6.386 6.386 0 0 1 1.624-1.18 6.96 6.96 0 0 1 1.98-.646c.865-.155 1.792-.198 2.586-.22.452-.012.905-.017 1.354-.02L14.823 3.53l135.875.002z" />
                                    <path fill="#fff" d="M43.508 35.77c1.404-1.755 2.356-4.112 2.105-6.52-2.054.102-4.56 1.355-6.012 3.112-1.303 1.504-2.456 3.96-2.156 6.266 2.306.2 4.61-1.152 6.063-2.858m2.09 3.238c-3.35-.2-6.196 1.9-7.795 1.9-1.6 0-4.049-1.8-6.698-1.751-3.449.05-6.646 2-8.398 5.1-3.6 6.2-.95 15.4 2.55 20.45 1.699 2.5 3.747 5.25 6.445 5.15 2.55-.1 3.549-1.65 6.647-1.65 3.097 0 3.997 1.65 6.696 1.6 2.798-.05 4.548-2.5 6.247-5 1.95-2.85 2.747-5.6 2.797-5.75-.05-.05-5.396-2.1-5.446-8.25-.05-5.15 4.198-7.6 4.398-7.75-2.399-3.55-6.146-3.95-7.443-4.05m23.838-12.088v42.72h6.598V55.088h9.14c8.352 0 14.223-5.728 14.223-13.86 0-8.13-5.77-13.758-13.97-13.758h-15.99zm6.598 5.72h7.617c5.737 0 9.016 3.065 9.016 8.438 0 5.372-3.28 8.47-9.05 8.47H75.035v-16.91zm35.2 37.47c4.144 0 7.99-2.1 9.74-5.428h.13v5.098h6.11V42.66c0-6.13-4.902-10.08-12.44-10.08-7.036 0-12.24 4-12.44 9.498h5.934c.496-2.6 2.896-4.308 6.287-4.308 4.062 0 6.346 1.9 6.346 5.378v2.35l-8.302.502c-7.72.45-11.894 3.622-11.894 9.11 0 5.55 4.343 9.22 10.529 9.22zm1.76-5.08c-3.545 0-5.803-1.7-5.803-4.30 0-4.38 2.58-5.48 7.53-5.79l7.39-.45v2.4c0 4.78-4.053 8.14-9.117 8.14zm27.97 17.56c6.441 0 9.47-2.46 12.116-9.9l11.593-32.542h-6.74l-7.766 25.1h-.129l-7.768-25.1h-6.938l11.145 30.83-.6 1.882c-1.007 3.18-2.634 4.41-5.537 4.41-.52 0-1.527-.05-1.93-.1v5.12c.35.1 1.845.15 2.554.15z" />
                                </svg>
                            </div>
                            {/* Google Pay */}
                            <div className="h-8 w-14 bg-white rounded border border-gray-200 dark:border-gray-300 flex items-center justify-center px-1">
                                <svg viewBox="0 0 435.97 173.13" className="w-full h-full">
                                    <path fill="#5F6368" d="M206.2,84.58v50.75H190.1V10h42.7a38.61,38.61,0,0,1,27.65,10.85A34.88,34.88,0,0,1,272,47.3a34.72,34.72,0,0,1-11.55,26.6q-11.2,10.68-27.65,10.67H206.2Zm0-59.15V69.18h27a21.28,21.28,0,0,0,15.93-6.48,21.36,21.36,0,0,0,0-30.63,20.78,20.78,0,0,0-15.93-6.65h-27Z" />
                                    <path fill="#5F6368" d="M309.1,46.78q17.85,0,28.18,9.54T347.6,82.48v52.85H332.2V122.71h-.7q-10,15.4-26.6,15.4-14.17,0-23.63-8.4a26.92,26.92,0,0,1-9.45-21q0-13.3,10.08-21.17t26.6-7.88q14.08,0,23.1,5.26V81.43a18.35,18.35,0,0,0-6.83-14.52,24.69,24.69,0,0,0-16.62-5.95q-14.35,0-22.75,12.08l-14-8.75Q282.55,46.78,309.1,46.78Zm-20.47,62.13a12.86,12.86,0,0,0,5.34,10.5,19.62,19.62,0,0,0,12.51,4.2,25.83,25.83,0,0,0,18.2-7.53,23.68,23.68,0,0,0,8-17.85q-7.35-6-20.3-6-9.45,0-16.1,4.81a14.85,14.85,0,0,0-6.65,11.87Z" />
                                    <path fill="#5F6368" d="M436,49.63,382.24,173.13H365.79l19.95-43.23L350.57,49.63h17.5l25.55,61.6h.35l24.85-61.6Z" />
                                    <path fill="#4285F4" d="M141.14,73.64A85.79,85.79,0,0,0,139.9,59H72.1V86.73h38.89a33.33,33.33,0,0,1-14.38,21.88v17.93H115.7C128.24,114.63,141.14,96.51,141.14,73.64Z" />
                                    <path fill="#34A853" d="M72.1,142.44c19.43,0,35.79-6.38,47.72-17.38l-23.09-17.93c-6.49,4.35-14.85,6.82-24.63,6.82-18.88,0-34.87-12.74-40.6-29.92H7.67v18.55A72.01,72.01,0,0,0,72.1,142.44Z" />
                                    <path fill="#FBBC04" d="M31.5,84a43.09,43.09,0,0,1,0-27.51V38.02H7.67A72.1,72.1,0,0,0,7.67,132l23.83-18.55Z" />
                                    <path fill="#EA4335" d="M72.1,26.58a39.18,39.18,0,0,1,27.65,10.8l20.55-20.55A69.15,69.15,0,0,0,72.1,0,72.01,72.01,0,0,0,7.67,38.02L31.5,56.57C37.23,39.39,53.22,26.58,72.1,26.58Z" />
                                </svg>
                            </div>
                        </div>
                    </div>

                    {/* Copyright & Links Row */}
                    <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                        <p className="text-xs text-muted-foreground">
                            © {new Date().getFullYear()} SimplySolutions. All rights reserved.
                        </p>
                        <div className="flex items-center gap-6">
                            <Link href="/privacy" className="text-xs text-muted-foreground hover:text-foreground">Privacy Policy</Link>
                            <Link href="/terms" className="text-xs text-muted-foreground hover:text-foreground">Terms of Usage</Link>
                            <Link href="/sitemap" className="text-xs text-muted-foreground hover:text-foreground">Sitemap</Link>
                        </div>
                    </div>
                </div>
            </div>
        </footer >
    );
}
