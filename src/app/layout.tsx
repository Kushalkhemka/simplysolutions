import type { Metadata } from "next";
import { Inter } from "next/font/google";
import Script from "next/script";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";
import { ThemeProvider } from "@/components/theme/ThemeProvider";
import { InstallAppPrompt } from "@/components/pwa/InstallAppPrompt";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
});

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://simplysolutions.co.in';

export const metadata: Metadata = {
  metadataBase: new URL(BASE_URL),
  title: {
    default: "Buy Genuine Microsoft Software License Keys Online India | Windows 11, Office 2024 | SimplySolutions",
    template: "%s | SimplySolutions - Digital License Keys India",
  },
  description: "India's #1 trusted store for genuine Microsoft digital license keys. Buy Windows 11 Pro, Windows 10, Office 2024, Office 2021, Microsoft 365 at lowest prices. Instant email delivery, lifetime validity, 24/7 support. 100% authentic product keys with money-back guarantee. Activate your software in minutes!",
  keywords: [
    // === HIGH-VALUE TARGET KEYWORDS ===
    "digital key",
    "digital license key",
    "software license key",
    "product key",
    "activation key",
    "Microsoft license keys",
    "Microsoft license keys India",
    "genuine license key",
    "authentic software key",

    // === WINDOWS KEYWORDS ===
    "Windows 11 key",
    "Windows 11 Pro key",
    "Windows 11 Home key",
    "Windows 11 license",
    "Windows 11 product key",
    "Windows 11 activation key",
    "Windows 11 Pro license India",
    "buy Windows 11 key online",
    "cheap Windows 11 license",
    "Windows 11 digital key",
    "Windows 10 key",
    "Windows 10 Pro key",
    "Windows 10 Home key",
    "Windows 10 license India",
    "Windows 10 product key cheap",
    "Windows 10 activation key online",

    // === OFFICE KEYWORDS ===
    "Office 2024 key",
    "Office 2024 license",
    "Office 2024 product key",
    "Office 2024 Pro Plus key",
    "Microsoft Office 2024 India",
    "Office 2021 key",
    "Office 2021 license",
    "Office 2021 Pro Plus",
    "Office 2021 Home and Business",
    "Office 2019 key",
    "cheap Office license India",
    "Office license key instant delivery",

    // === MICROSOFT 365 KEYWORDS ===
    "Microsoft 365",
    "Microsoft 365 subscription",
    "Microsoft 365 Family",
    "Microsoft 365 Personal",
    "Microsoft 365 Business",
    "Office 365 subscription India",
    "M365 license cheap",

    // === PRICING & PURCHASE KEYWORDS ===
    "buy software license online India",
    "cheap software license",
    "affordable license key",
    "lowest price Windows key",
    "discount Office license",
    "best price Microsoft license",
    "software key low price India",

    // === DELIVERY & TRUST KEYWORDS ===
    "instant delivery license key",
    "instant download software",
    "email delivery license",
    "genuine software India",
    "authentic Microsoft key",
    "100% genuine license",
    "lifetime license key",
    "permanent activation key",
    "legal software license",

    // === INDIA SPECIFIC ===
    "software license India",
    "Microsoft India",
    "Windows key India",
    "Office key India",
    "buy license India",
    "software store India",
    "digital software India",

    // === MAC KEYWORDS ===
    "Office for Mac",
    "Office 2024 Mac",
    "Microsoft Office Mac license",

    // === BRAND ===
    "SimplySolutions",
    "SimplySolutions India",
    "SimplySolutions software",
  ],
  applicationName: "SimplySolutions",
  authors: [{ name: "SimplySolutions", url: BASE_URL }],
  creator: "SimplySolutions",
  publisher: "SimplySolutions",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  openGraph: {
    type: "website",
    locale: "en_IN",
    url: BASE_URL,
    siteName: "SimplySolutions",
    title: "SimplySolutions - Genuine Microsoft Software Licenses India",
    description: "Buy genuine Microsoft software licenses with instant digital delivery. Windows 11, Office 2024, Microsoft 365 and more at lowest prices in India.",
    images: [
      {
        url: `${BASE_URL}/social-media-banner.png`,
        width: 1200,
        height: 630,
        alt: "SimplySolutions - Genuine Software Licenses India",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "SimplySolutions - Genuine Microsoft Software Licenses",
    description: "Buy genuine Microsoft software licenses with instant digital delivery. Windows, Office, and more at lowest prices in India.",
    images: [`${BASE_URL}/social-media-banner.png`],
    creator: "@simplysolutions",
    site: "@simplysolutions",
  },
  alternates: {
    canonical: BASE_URL,
  },
  icons: {
    icon: "/logo-symbol.png",
    shortcut: "/logo-symbol.png",
    apple: "/logo-symbol.png",
  },
  category: "software",
  // Add verification when you have the Google Search Console code
  // verification: {
  //   google: 'your-google-verification-code',
  // },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* Preconnect to external domains for faster resource loading */}
        <link rel="preconnect" href="https://qcsdnlakugvnwlflhwpo.supabase.co" />
        <link rel="preconnect" href="https://api.simplysolutions.co.in" />
        <link rel="dns-prefetch" href="https://m.media-amazon.com" />
        <link rel="dns-prefetch" href="https://i.postimg.cc" />
      </head>
      <body className={`${inter.variable} font-sans antialiased`} suppressHydrationWarning>
        <Script
          src="https://cdn.razorpay.com/widgets/affordability/affordability.js"
          strategy="lazyOnload"
        />
        <ThemeProvider>
          {children}
          <Toaster />
          <InstallAppPrompt />
        </ThemeProvider>
      </body>
    </html>
  );
}
