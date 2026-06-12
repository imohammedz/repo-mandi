"use client";

import Link from "next/link";
import Image from "next/image";
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
      <div
        className="sell-card-img"
        style={{
          width: 90,
          height: 68,
          flexShrink: 0,
          overflow: "hidden",
          background: "#fff3e4",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Image
          src="/sell-truck-banner.jpg"
          alt="Sell your truck on RepoMandi"
          width={90}
          height={68}
          style={{ display: "block", objectFit: "contain", width: "100%", height: "100%" }}
        />
      </div>
      <div className="sell-card-content">
        <h3>Sell Your Truck</h3>
        <p>List for free & reach buyers fast</p>
      </div>
      <Link href="/sell" className="sell-card-btn">
        Sell Now
        <span
          style={{
            width: 18,
            height: 18,
            border: "1.5px solid white",
            borderRadius: "50%",
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 13,
            fontWeight: 400,
            lineHeight: 1,
            flexShrink: 0,
          }}
        >
          +
        </span>
      </Link>
    </div>
  );
}
