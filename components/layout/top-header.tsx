"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ArrowLeft, Bell, Shield } from "lucide-react";

const HIDDEN_PREFIXES = ["/auth", "/onboarding", "/admin/login"];

export function TopHeader() {
  const pathname = usePathname();
  const router = useRouter();
  const isHomePage = pathname === "/";

  if (HIDDEN_PREFIXES.some((prefix) => pathname === prefix || pathname.startsWith(prefix + "/"))) {
    return null;
  }

  const goBack = () => {
    if (window.history.length > 1) {
      router.back();
      return;
    }
    router.push("/");
  };

  return (
    <header className="fixed inset-x-0 top-0 z-40 border-b border-slate-200 bg-white/95 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-xl items-center justify-between px-4">
        <div className="flex items-center gap-2">
          {!isHomePage ? (
            <button
              type="button"
              aria-label="Go back"
              onClick={goBack}
              className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-slate-200 text-slate-700 transition hover:bg-slate-100"
            >
              <ArrowLeft className="h-4 w-4" />
            </button>
          ) : null}
          <Link href="/" className="text-lg font-bold tracking-tight text-slate-900">
            Repo<span style={{ color: "#FD5702" }}>Mandi</span>
          </Link>
        </div>
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
