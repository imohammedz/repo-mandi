import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: "RepoMandi | Repossessed Commercial Vehicles",
  description: "Mobile-first marketplace for bank-seized and repossessed commercial vehicles in India.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full bg-slate-50 text-slate-900">
        <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/95 backdrop-blur">
          <nav className="mx-auto flex w-full max-w-6xl items-center justify-between px-4 py-3 sm:px-6">
            <Link href="/" className="text-lg font-semibold tracking-tight text-slate-900">
              RepoMandi
            </Link>
            <div className="flex items-center gap-3 text-sm font-medium text-slate-600">
              <Link href="/vehicles">Browse</Link>
              <Link href="/producer">Producer</Link>
              <Link href="/admin">Admin</Link>
            </div>
          </nav>
        </header>
        <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-4 sm:px-6 sm:py-6">{children}</main>
      </body>
    </html>
  );
}
