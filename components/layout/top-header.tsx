"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Shield } from "lucide-react";

const HIDDEN_PREFIXES = ["/auth", "/onboarding", "/admin/login"];

export function TopHeader() {
  const pathname = usePathname();

  if (HIDDEN_PREFIXES.some((prefix) => pathname === prefix || pathname.startsWith(prefix + "/"))) {
    return null;
  }

  const isHome = pathname === "/";

  return (
    <header className="fixed inset-x-0 top-0 z-40 border-b border-slate-200 bg-white/95 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-xl items-center justify-between px-4 sm:h-16">
        <Link
          href="/"
          aria-label="RepoMandi home"
          className="inline-flex items-center gap-2.5 sm:gap-3"
        >
          <Image
            src="/favicon_io/favicon.ico"
            alt="RepoMandi Logo"
            width={28}
            height={28}
            sizes="(max-width: 640px) 24px, 28px"
            className="h-6 w-6 object-contain sm:h-7 sm:w-7"
          />
          <span className="text-lg font-bold tracking-tight sm:text-xl">
            <span className="text-slate-950">Repo</span>
            <span className="text-orange-500">Mandi</span>
          </span>
        </Link>
        {isHome ? (
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-1 text-xs font-medium text-emerald-700">
            <Shield className="h-3 w-3" /> Trusted
          </span>
        ) : null}
      </div>
    </header>
  );
}
