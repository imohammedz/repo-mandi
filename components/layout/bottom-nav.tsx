"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { CircleUserRound, House, Plus, Search, Heart } from "lucide-react";
import { motion, useAnimation } from "framer-motion";
import { useSavedListings } from "@/components/providers/saved-listings-provider";

const items = [
  { label: "Home", href: "/", icon: House },
  { label: "Search", href: "/vehicles", icon: Search },
  { label: "Sell", href: "/sell", icon: null },
  { label: "Saved", href: "/saved", icon: Heart },
  { label: "Profile", href: "/profile", icon: CircleUserRound },
];

export function BottomNav() {
  const pathname = usePathname();
  const router = useRouter();
  const { savedCount, isAuthenticated } = useSavedListings();
  const sellControls = useAnimation();

  if (pathname.startsWith("/auth") || pathname.startsWith("/onboarding")) {
    return null;
  }

  const isSellActive = pathname === "/sell" || pathname.startsWith("/seller/");

  async function handleSellTap(e: React.MouseEvent) {
    e.preventDefault();
    await sellControls.start({
      scale: [1, 0.85, 1.1, 1],
      transition: { duration: 0.27, ease: "easeOut", times: [0, 0.2, 0.65, 1] },
    });
    router.push("/sell");
  }

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40" style={{ height: "64px" }}>
      {/* Nav bar background with rounded top corners and notch cutout */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: "radial-gradient(circle at 50% 0px, transparent 40px, white 41px)",
          borderRadius: "24px 24px 0 0",
          filter: "drop-shadow(0 -2px 10px rgba(0,0,0,0.10))",
        }}
      />

      {/* Floating Sell FAB — protrudes above the notch */}
      <div className="absolute left-1/2 -translate-x-1/2 z-10" style={{ bottom: "38px" }}>
        <motion.a
          href="/sell"
          aria-label="Sell"
          className="flex h-14 w-14 items-center justify-center rounded-full shadow-lg"
          style={{
            backgroundColor: "#E8651A",
            boxShadow: "0 4px 16px rgba(232,101,26,0.45)",
          }}
          animate={sellControls}
          onClick={handleSellTap}
        >
          <Plus className="h-7 w-7 text-white" strokeWidth={2.5} />
        </motion.a>
      </div>

      {/* Nav items */}
      <ul className="relative z-[1] mx-auto grid h-full max-w-xl grid-cols-5 items-end px-2 pb-2">
        {items.map((item) => {
          if (item.label === "Sell") {
            return (
              <li key={item.href} className="flex flex-col items-center justify-end pb-0.5">
                <span
                  className="text-[11px] font-medium"
                  style={{ color: isSellActive ? "#E8651A" : "#64748b" }}
                >
                  Sell
                </span>
              </li>
            );
          }

          const Icon = item.icon;
          if (!Icon) return null;
          const active =
            item.href === "/"
              ? pathname === "/"
              : pathname.startsWith(item.href);

          return (
            <li key={item.href}>
              <Link
                href={item.href}
                className="flex min-h-12 flex-col items-center justify-center rounded-xl text-[11px] font-medium"
                style={{ color: active ? "#E8651A" : "#94a3b8" }}
              >
                <span className="relative">
                  <Icon className="h-4 w-4" />
                  {item.href === "/saved" && isAuthenticated && savedCount > 0 ? (
                    <span className="absolute -right-2 -top-2 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-[#FF3B30] px-1 text-[9px] font-semibold text-white">
                      {savedCount > 99 ? "99+" : savedCount}
                    </span>
                  ) : null}
                </span>
                {item.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
