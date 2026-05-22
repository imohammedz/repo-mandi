"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LogOut } from "lucide-react";

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
          Repo<span className="text-amber-500">Mandi</span>
        </Link>
        <Link
          href="/logout"
          className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50"
          aria-label="Log out"
        >
          <LogOut className="h-3.5 w-3.5" />
          Logout
        </Link>
      </div>
    </header>
  );
}
