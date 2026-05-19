import type { Metadata } from "next";
import { Geist } from "next/font/google";
import { BottomNav } from "@/components/layout/bottom-nav";
import { StickyWhatsAppCTA } from "@/components/layout/sticky-whatsapp-cta";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "RepoMandi - Verified Bank-Seized Commercial Vehicles",
  description: "Mobile-first marketplace for verified repossessed commercial vehicles in India",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${geistSans.variable} antialiased`}>
      <body className="bg-slate-50 font-sans text-slate-900">
        <div className="mx-auto min-h-screen w-full max-w-xl pb-24">{children}</div>
        <StickyWhatsAppCTA />
        <BottomNav />
      </body>
    </html>
  );
}
