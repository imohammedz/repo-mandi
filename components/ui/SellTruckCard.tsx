"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { PlusCircle } from "lucide-react";

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
          fill
          sizes="(min-width: 768px) 240px, 96px"
        />
      </div>
      <div className="sell-card-content">
        <h3>Sell Your Truck Faster</h3>
        <p>Reach 50,000+ verified buyers across India</p>
      </div>
      <Link href="/sell" className="sell-card-btn">
        <span className="sell-card-btn-label">List Your Truck Now</span>
        <PlusCircle className="sell-card-btn-icon" />
      </Link>
    </div>
  );
}
