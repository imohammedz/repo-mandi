"use client";

import Link from "next/link";
import Image from "next/image";
import { Plus } from "lucide-react";
import { usePathname } from "next/navigation";

export default function SellTruckCard() {
  const pathname = usePathname();

  const hidden =
    pathname.startsWith("/auth") ||
    pathname.startsWith("/onboarding") ||
    pathname === "/sell";

  if (hidden) return null;

  return (
    <div className="sell-card">
      <div className="sell-card-img">
        <Image
          src="/sell-truck-banner.jpg"
          alt="Sell your truck on RepoMandi"
          width={90}
          height={68}
        />
      </div>
      <div className="sell-card-content">
        <h3>Sell Your Truck</h3>
        <p>List for free & reach buyers fast</p>
      </div>
      <Link href="/sell" className="sell-card-btn">
        Sell Now
        <span>
          <Plus size={11} strokeWidth={2.5} aria-hidden="true" />
        </span>
      </Link>
    </div>
  );
}
