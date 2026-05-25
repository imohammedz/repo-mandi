import type { Metadata } from "next";
import { Geist } from "next/font/google";
import { BottomNav } from "@/components/layout/bottom-nav";
import { TopHeader } from "@/components/layout/top-header";
import { StickyWhatsAppCTA } from "@/components/layout/sticky-whatsapp-cta";
import { SavedListingsProvider } from "@/components/providers/saved-listings-provider";
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
        <SavedListingsProvider>
          <TopHeader />
          <div className="mx-auto min-h-screen w-full max-w-xl pb-24 pt-14">{children}</div>
          <StickyWhatsAppCTA />
          <BottomNav />
        </SavedListingsProvider>
      </body>
    </html>
  );
}
