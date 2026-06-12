import type { Metadata } from "next";
import { Geist } from "next/font/google";
import { BottomNav } from "@/components/layout/bottom-nav";
import { SiteFooter } from "@/components/layout/site-footer";
import { TopHeader } from "@/components/layout/top-header";
import { StickyWhatsAppCTA } from "@/components/layout/sticky-whatsapp-cta";
import SellTruckCard from "@/components/ui/SellTruckCard";
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
      <body className="overflow-x-hidden bg-slate-50 font-sans text-slate-900">
        <SavedListingsProvider>
          <TopHeader />
          <div className="mx-auto w-full max-w-xl overflow-x-hidden px-0 pt-14">
            {children}
            <SiteFooter />
            {/* Spacer to ensure footer scrolls fully above the fixed Sell Your Truck CTA (68px)
                and bottom navigation (64px). Total fixed overlay = 132px; 160px gives clearance. */}
            <div className="h-[160px]" aria-hidden="true" />
          </div>
          <StickyWhatsAppCTA />
          <div className="fixed inset-x-0 bottom-[64px] z-50 mx-auto max-w-xl px-3">
            <SellTruckCard />
          </div>
          <BottomNav />
        </SavedListingsProvider>
      </body>
    </html>
  );
}
