"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { CircleUserRound, House, PlusCircle, Search, Heart } from "lucide-react";

const items = [
  { label: "Home", href: "/", icon: House },
  { label: "Search", href: "/vehicles", icon: Search },
  { label: "Sell", href: "/sell", icon: PlusCircle },
  { label: "Saved", href: "/saved", icon: Heart },
  { label: "Profile", href: "/profile", icon: CircleUserRound },
];

export function BottomNav() {
  const pathname = usePathname();

  if (pathname.startsWith("/auth") || pathname.startsWith("/onboarding")) {
    return null;
  }

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-slate-200 bg-white/95 px-2 py-2 backdrop-blur">
      <ul className="mx-auto grid max-w-xl grid-cols-5 gap-1">
        {items.map((item) => {
          const Icon = item.icon;
          const active =
            item.href === "/"
              ? pathname === "/"
              : item.href === "/sell"
                ? pathname === "/sell" || pathname.startsWith("/seller/")
                : pathname.startsWith(item.href);

          return (
            <li key={item.href}>
              <Link
                href={item.href}
                className={`flex min-h-12 flex-col items-center justify-center rounded-xl text-[11px] font-medium ${
                  active ? "bg-slate-900 text-white" : "text-slate-600"
                }`}
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
