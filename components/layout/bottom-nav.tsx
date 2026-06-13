"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { CircleUserRound, Heart, House, Plus, Search } from "lucide-react";
import { useSavedListings } from "@/components/providers/saved-listings-provider";

const SELL_ORANGE = "var(--repomandi-orange)";
// Tuned so the circular cutout visually hugs the raised Sell button like the provided reference.
const CENTER_CUTOUT_Y_OFFSET = "-42%";

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
    <nav className="fixed inset-x-0 bottom-0 z-40 px-3 pb-[calc(8px+env(safe-area-inset-bottom))]">
      <div className="relative mx-auto max-w-xl">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute left-1/2 top-0 h-16 w-[92px] -translate-x-1/2 rounded-full bg-slate-50"
          style={{ transform: `translate(-50%, ${CENTER_CUTOUT_Y_OFFSET})` }}
        />
        <ul className="relative grid grid-cols-5 rounded-[26px] border border-slate-200/90 bg-white px-2 pb-3 pt-4 shadow-[0_10px_28px_rgba(15,23,42,0.08)]">
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
                <Link
                  href={item.href}
                  className="relative z-10 flex min-h-14 flex-col items-center justify-center gap-1 text-[11px] font-medium text-slate-500"
                  style={active ? { color: SELL_ORANGE } : undefined}
                >
                  <span
                    className="inline-flex h-[60px] w-[60px] -translate-y-8 items-center justify-center rounded-full border-4 border-white text-white shadow-[0_10px_20px_rgba(255,138,0,0.32)]"
                    style={{ backgroundColor: SELL_ORANGE }}
                  >
                    <Icon className="h-7 w-7 stroke-[2.4]" />
                  </span>
                  <span className="-mt-8">{item.label}</span>
                </Link>
              ) : (
                <Link
                  href={item.href}
                  className="flex min-h-14 flex-col items-center justify-center gap-1 rounded-xl text-[11px] font-medium text-slate-500"
                  style={active ? { color: SELL_ORANGE } : undefined}
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
