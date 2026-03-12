import type { Metadata } from "next";
import "./globals.css";
import { WhatsAppChat } from "@/components/ui/WhatsAppChat";
import { SpeedInsights } from "@vercel/speed-insights/next";

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
  metadataBase: new URL("https://premiumreklambaku.shop"),
  alternates: {
    canonical: "https://premiumreklambaku.shop",
  },
  openGraph: {
    title: "Premium Reklam - Reklam və Dekor Xidmətləri",
    description: "Professional reklam və dekor xidmətləri. Vinil, orakal, banner çapı, dekorasiya və dizayn.",
    url: "https://premiumreklambaku.shop",
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

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="az" data-scroll-behavior="smooth">
      <body className="antialiased font-sans">
        {children}
        <WhatsAppChat />
        <SpeedInsights />
      </body>
    </html>
  );
}
