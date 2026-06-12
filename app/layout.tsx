import type { Metadata } from "next";
import { Geist } from "next/font/google";
import { BottomNav } from "@/components/layout/bottom-nav";
import { SiteFooter } from "@/components/layout/site-footer";
import { TopHeader } from "@/components/layout/top-header";
import { StickyWhatsAppCTA } from "@/components/layout/sticky-whatsapp-cta";
import { SavedListingsProvider } from "@/components/providers/saved-listings-provider";
import { SITE_CONFIG } from "@/lib/config/site";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "RepoMandi - Verified Bank-Seized Commercial Vehicles",
  description: "Mobile-first marketplace for verified repossessed commercial vehicles in India",
  metadataBase: new URL(SITE_CONFIG.primaryDomain),
  applicationName: SITE_CONFIG.name,
  alternates: {
    canonical: SITE_CONFIG.primaryDomain,
  },
  openGraph: {
    siteName: SITE_CONFIG.name,
    url: SITE_CONFIG.primaryDomain,
  },
  other: {
    "organization:name": SITE_CONFIG.name,
    "organization:email": SITE_CONFIG.supportEmail,
    "organization:url": SITE_CONFIG.primaryDomain,
    "organization:sameAs": SITE_CONFIG.secondaryDomain,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${geistSans.variable} antialiased`}>
      <body className="overflow-x-clip bg-slate-50 font-sans text-slate-900">
        <SavedListingsProvider>
          <TopHeader />
          <div className="mx-auto w-full max-w-xl overflow-x-clip px-0 pt-14">
            {children}
            <SiteFooter />
            {/* Spacer to ensure footer scrolls fully above the fixed bottom navigation (64px). */}
            <div className="h-[80px]" aria-hidden="true" />
          </div>
          <StickyWhatsAppCTA />
          <BottomNav />
        </SavedListingsProvider>
      </body>
    </html>
  );
}
