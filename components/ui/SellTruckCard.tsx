"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useSellDestination } from "@/lib/hooks/use-sell-destination";

export default function SellTruckCard() {
  const pathname = usePathname();
  const sellDestination = useSellDestination();

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
          height={52}
        />
      </div>
      <div className="sell-card-content">
        <h3>Sell Your Truck</h3>
        <p>List for free & reach buyers fast</p>
      </div>
      <Link href={sellDestination} className="sell-card-btn">
        Sell Now
        <span>+</span>
      </Link>
    </div>
  );
}
