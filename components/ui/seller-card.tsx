"use client";

import { formatEnumLabel } from "@/lib/formatting";
import { UserCircle2 } from "lucide-react";

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
  trucksSold,
  memberSinceYear,
  className = "",
}: Props) {
  const roleLabel = formatEnumLabel(role || "") || "Seller";
  const roleAndLocation = city ? `${roleLabel} • ${city}` : roleLabel;
  const verificationLabel = sellerVerified ? "Verified Seller" : "Unverified Seller";

  return (
    <section id={id} className={`rounded-2xl border border-slate-200 bg-white p-4 shadow-sm ${className}`}>
      <h3 className="text-sm font-semibold tracking-wide text-slate-700">Seller Profile</h3>

      <div className="mt-3 flex items-start gap-3">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-slate-200 bg-slate-50 text-slate-400">
          <UserCircle2 className="h-7 w-7" aria-hidden="true" />
        </div>

        <div className="min-w-0 flex-1">
          <p className="line-clamp-2 text-base font-semibold leading-6 text-slate-900">{name}</p>
          <p className="mt-0.5 truncate text-sm text-slate-500">{roleAndLocation}</p>
          <span
            className={`mt-2 inline-flex rounded-full border px-2.5 py-1 text-xs font-medium ${
              sellerVerified
                ? "border-emerald-100 bg-emerald-50 text-emerald-700"
                : "border-slate-200 bg-slate-100 text-slate-600"
            }`}
          >
            {verificationLabel}
          </span>
        </div>
      </div>

      <div className="mt-4 border-t border-slate-100 pt-3">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-base font-semibold text-slate-900">{trucksSold !== undefined ? String(trucksSold) : "0"}</p>
            <p className="mt-0.5 text-xs text-slate-500">Trucks Sold</p>
          </div>
          <div className="text-right">
            <p className="text-base font-semibold text-slate-900">{memberSinceYear ?? "-"}</p>
            <p className="mt-0.5 text-xs text-slate-500">Member Since</p>
          </div>
        </div>
      </div>
    </section>
  );
}
