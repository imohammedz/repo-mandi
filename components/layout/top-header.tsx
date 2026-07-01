"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Bell, Shield } from "lucide-react";

const HIDDEN_PREFIXES = ["/auth", "/onboarding", "/admin/login"];

export function TopHeader() {
  const pathname = usePathname();

  if (HIDDEN_PREFIXES.some((prefix) => pathname === prefix || pathname.startsWith(prefix + "/"))) {
    return null;
  }

  return (
    <header className="fixed inset-x-0 top-0 z-40 border-b border-slate-200 bg-white/95 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-xl items-center justify-between px-4">
        <Link href="/" className="text-lg font-bold tracking-tight text-slate-900">
          Repo<span className="text-[#FD5702]">Mandi</span>
        </Link>
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-1 text-xs font-medium text-emerald-700">
            <Shield className="h-3 w-3" /> Trusted
          </span>
          <Link href="/notifications" aria-label="Notifications" className="text-slate-600 hover:text-slate-900">
            <Bell className="h-4 w-4" aria-hidden="true" />
          </Link>
        </div>
      </div>
    </header>
  );
}
