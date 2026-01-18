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

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://simplysolutions.in';

export const metadata: Metadata = {
  metadataBase: new URL(BASE_URL),
  title: {
    default: "SimplySolutions - Genuine Microsoft Software Licenses | Buy Windows & Office Keys",
    template: "%s | SimplySolutions",
  },
  description: "India's trusted destination for genuine Microsoft software licenses. Buy Windows 11, Office 2024, Microsoft 365 & more at lowest prices with instant digital delivery. 100% authentic keys with lifetime validity.",
  keywords: [
    "Microsoft software",
    "Windows 11 license",
    "Windows 10 key",
    "Office 2024",
    "Office 2021",
    "Microsoft 365",
    "genuine software",
    "digital license",
    "software license India",
    "buy Windows key",
    "Office license India",
    "Microsoft keys",
    "instant delivery",
    "lifetime license",
    "authentic software",
    "SimplySolutions",
  ],
  authors: [{ name: "SimplySolutions", url: BASE_URL }],
  creator: "SimplySolutions",
  publisher: "SimplySolutions",
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
    title: "SimplySolutions - Genuine Microsoft Software Licenses",
    description: "Buy genuine Microsoft software licenses with instant digital delivery. Windows, Office, and more at lowest prices in India.",
    images: [
      {
        url: `${BASE_URL}/logo.png`,
        width: 1200,
        height: 630,
        alt: "SimplySolutions - Genuine Software Licenses",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "SimplySolutions - Genuine Microsoft Software Licenses",
    description: "Buy genuine Microsoft software licenses with instant digital delivery. Windows, Office, and more at lowest prices in India.",
    images: [`${BASE_URL}/logo.png`],
    creator: "@simplysolutions",
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
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} font-sans antialiased`}>
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
