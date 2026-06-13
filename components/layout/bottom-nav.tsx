"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { CircleUserRound, Heart, House, Plus, Search } from "lucide-react";
import { useSavedListings } from "@/components/providers/saved-listings-provider";

const items = [
  { label: "Home", href: "/", icon: House },
  { label: "Search", href: "/vehicles", icon: Search },
  { label: "Sell", href: "/sell", icon: Plus, isCenter: true },
  { label: "Saved", href: "/saved", icon: Heart },
  { label: "Profile", href: "/profile", icon: CircleUserRound },
];

export function BottomNav() {
  const pathname = usePathname();
  const { savedCount, isAuthenticated } = useSavedListings();

  if (pathname.startsWith("/auth") || pathname.startsWith("/onboarding")) {
    return null;
  }

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 px-2 pb-2 backdrop-blur">
      <div className="relative mx-auto max-w-xl">
        <div className="pointer-events-none absolute left-1/2 top-0 h-16 w-20 -translate-x-1/2 -translate-y-1/2 rounded-full bg-slate-50" />
        <ul className="relative grid grid-cols-5 rounded-[22px] border border-slate-200 bg-white px-1 pb-3 pt-4 shadow-[0_-8px_20px_rgba(15,23,42,0.06)]">
        {items.map((item) => {
          const Icon = item.icon;
          const active =
            item.href === "/"
              ? pathname === "/"
              : item.href === "/sell"
                ? pathname === "/sell" || pathname.startsWith("/seller/")
                : pathname.startsWith(item.href);

          return (
            <li key={item.href} className="relative">
              {item.isCenter ? (
                <Link href={item.href} className="flex min-h-12 flex-col items-center justify-center text-[11px] font-medium text-slate-600">
                  <span className="mb-1 -mt-10 inline-flex h-14 w-14 items-center justify-center rounded-full border-4 border-slate-50 bg-[#ff8a00] text-white shadow-[0_10px_18px_rgba(255,138,0,0.35)]">
                    <Icon className="h-7 w-7" />
                  </span>
                  {item.label}
                </Link>
              ) : (
                <Link
                  href={item.href}
                  className={`flex min-h-12 flex-col items-center justify-center rounded-xl text-[11px] font-medium ${
                    active ? "text-[#ff8a00]" : "text-slate-500"
                  }`}
                >
                  <span className="relative">
                    <Icon className="h-5 w-5" />
                    {item.href === "/saved" && isAuthenticated && savedCount > 0 ? (
                      <span className="absolute -right-2 -top-2 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-[#FF3B30] px-1 text-[9px] font-semibold text-white">
                        {savedCount > 99 ? "99+" : savedCount}
                      </span>
                    ) : null}
                  </span>
                  {item.label}
                </Link>
              )}
            </li>
          );
        })}
        </ul>
      </div>
    </nav>
  );
}
