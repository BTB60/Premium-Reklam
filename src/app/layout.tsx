import type { Metadata } from "next";
import { Inter, Manrope } from "next/font/google";
import "./globals.css";
import { WhatsAppChat } from "@/components/ui/WhatsAppChat";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
});

const manrope = Manrope({
  variable: "--font-manrope",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
});

export const metadata: Metadata = {
  title: "Premium Reklam - Reklam və Dekor Xidmətləri",
  description: "Professional reklam və dekor xidmətləri. Vinil, orakal, banner çapı və dizayn.",
  icons: {
    icon: "/icon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="az" data-scroll-behavior="smooth">
      <body
        className={`${inter.variable} ${manrope.variable} antialiased font-sans`}
      >
        {children}
        <WhatsAppChat />
      </body>
    </html>
  );
}
