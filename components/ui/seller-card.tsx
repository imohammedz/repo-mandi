"use client";

import { formatEnumLabel } from "@/lib/formatting";
import { CircleCheck } from "lucide-react";

type StatCell = {
  label: string;
  value: string;
};

type Props = {
  id?: string;
  name: string;
  role: string;
  phone: string;
  vehicleTitle: string;
  vehicleId?: string;
  sellerId?: number;
  city?: string;
  sellerVerified?: boolean;
  photosVerified?: boolean;
  rcVerified?: boolean;
  yardVerified?: boolean;
  trucksSold?: number;
  memberSinceYear?: string;
  className?: string;
};

export function SellerCard({
  id,
  name,
  role,
  city,
  sellerVerified = false,
  photosVerified = false,
  rcVerified = false,
  yardVerified = false,
  trucksSold,
  memberSinceYear,
  className = "",
}: Props) {
  const trustBadges: string[] = [];
  if (sellerVerified) trustBadges.push("Verified Seller");
  if (photosVerified) trustBadges.push("Photos Verified");
  if (rcVerified) trustBadges.push("RC Verified");
  if (yardVerified) trustBadges.push("Yard Verified");

  const stats: StatCell[] = [
    { label: "Trucks Sold", value: trucksSold !== undefined ? String(trucksSold) : "0" },
    { label: "Seller Rating", value: "- / 5" },
    { label: "Response Rate", value: "-" },
    { label: "Member Since", value: memberSinceYear ?? "-" },
  ];

  return (
    <section id={id} className={`rounded-2xl border border-slate-200 bg-white p-5 shadow-sm ${className}`}>
      <h3 className="text-sm font-semibold tracking-wide text-slate-700">Seller Profile</h3>
      <p className="mt-3 text-lg font-semibold text-slate-900">{name}</p>
      <p className="text-sm text-slate-500">
        {formatEnumLabel(role || "") || "Seller"}
        {city ? ` • ${city}` : ""}
      </p>
      {trustBadges.length ? (
        <div className="mt-4 flex flex-wrap gap-2">
          {trustBadges.map((badge) => (
            <span
              key={badge}
              className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700"
            >
              <CircleCheck className="h-3.5 w-3.5" aria-hidden="true" />
              <span>{badge}</span>
            </span>
          ))}
        </div>
      ) : (
        <div className="mt-4">
          <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600">
            Not Verified
          </span>
        </div>
      )}
      <div className="mt-4 grid grid-cols-2 gap-2">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="rounded-xl border border-slate-100 bg-slate-50 px-3 py-2.5"
          >
            <p className="text-base font-semibold text-slate-900">{stat.value}</p>
            <p className="mt-0.5 text-xs text-slate-500">{stat.label}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
