import type { Metadata } from "next";
import { Inter } from "next/font/google";
import Script from "next/script";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";
import { ThemeProvider } from "@/components/theme/ThemeProvider";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
});

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://simplysolutions.co.in';

export const metadata: Metadata = {
  metadataBase: new URL(BASE_URL),
  title: {
    default: "SimplySolutions - Genuine Microsoft Software Licenses | Buy Windows & Office Keys India",
    template: "%s | SimplySolutions",
  },
  description: "India's #1 trusted destination for genuine Microsoft software licenses. Buy Windows 11 Pro, Office 2024, Microsoft 365 & more at lowest prices with instant digital delivery. 100% authentic keys with lifetime validity & free support.",
  keywords: [
    // Primary keywords
    "Microsoft software",
    "genuine software license India",
    "buy Windows 11 license India",
    "Windows 10 Pro key online",
    "Office 2024 license key",
    "Office 2021 product key India",
    "Microsoft 365 subscription",
    // Long-tail keywords
    "buy genuine Windows key online India",
    "cheap Microsoft Office license",
    "instant delivery software license",
    "lifetime Windows license India",
    "affordable Office 365 subscription",
    "authentic Microsoft product key",
    "digital license instant download",
    // Product-specific
    "Windows 11 Pro activation key",
    "Windows 10 Home license",
    "Office Home and Business 2024",
    "Microsoft 365 Family India",
    // Brand
    "SimplySolutions",
    "SimplySolutions India",
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
        url: `${BASE_URL}/logo.png`,
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
    images: [`${BASE_URL}/logo.png`],
    creator: "@simplysolutions",
    site: "@simplysolutions",
  },
  alternates: {
    canonical: BASE_URL,
  },
  icons: {
    icon: "/logo-icon.png",
    shortcut: "/logo-icon.png",
    apple: "/logo-icon.png",
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
      <body className={`${inter.variable} font-sans antialiased`} suppressHydrationWarning>
        <Script
          src="https://cdn.razorpay.com/widgets/affordability/affordability.js"
          strategy="lazyOnload"
        />
        <ThemeProvider>
          {children}
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
