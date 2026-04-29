import type { Metadata, Viewport } from "next";
import { Inter, Montserrat } from "next/font/google";
import "./globals.css";
import { WhatsAppChat } from "@/components/ui/WhatsAppChat";
import { PageTransition } from "@/components/ui/PageTransition";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { GoogleAnalytics, FacebookPixel } from "@/lib/analytics";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const montserrat = Montserrat({
  subsets: ["latin"],
  variable: "--font-montserrat",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Premium Reklam - Reklam və Dekor Xidmətləri",
    template: "%s | Premium Reklam",
  },
  description: "Professional reklam və dekor xidmətləri. Vinil, orakal, banner çapı, dekorasiya və dizayn. Bakı, Azərbaycan.",
  keywords: [
    "reklam",
    "dekor",
    "vinil",
    "orakal",
    "banner",
    "çap",
    "dizayn",
    "Bakı",
    "Azərbaycan",
    "reklam agentliyi",
  ],
  authors: [{ name: "Premium Reklam" }],
  creator: "Premium Reklam",
  publisher: "Premium Reklam",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL("https://premiumreklam.shop"),
  alternates: {
    canonical: "https://premiumreklam.shop",
  },
  openGraph: {
    title: "Premium Reklam - Reklam və Dekor Xidmətləri",
    description: "Professional reklam və dekor xidmətləri. Vinil, orakal, banner çapı, dekorasiya və dizayn.",
    url: "https://premiumreklam.shop",
    siteName: "Premium Reklam",
    locale: "az_AZ",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Premium Reklam - Reklam və Dekor Xidmətləri",
    description: "Professional reklam və dekor xidmətləri",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  icons: {
    icon: "/icon.svg",
    apple: "/icon.svg",
  },
};

export const viewport: Viewport = {
  themeColor: "#FF6600",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="az" data-scroll-behavior="smooth" suppressHydrationWarning>
      <body className={`${inter.variable} ${montserrat.variable} antialiased font-sans bg-[var(--background)] text-[var(--foreground)] transition-colors duration-300 overflow-x-clip`}>
        <GoogleAnalytics />
        <FacebookPixel />
        <PageTransition>{children}</PageTransition>
        <WhatsAppChat />
        <SpeedInsights />
      </body>
    </html>
  );
}
