"use client";

import { VehicleContactActions } from "@/components/ui/vehicle-contact-actions";
import { formatEnumLabel } from "@/lib/formatting";
import { CircleCheck } from "lucide-react";

type Props = {
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
  className?: string;
};

export function SellerCard({
  name,
  role,
  phone,
  vehicleTitle,
  vehicleId,
  city,
  sellerVerified = false,
  photosVerified = false,
  rcVerified = false,
  yardVerified = false,
  className = "",
}: Props) {
  const trustBadges = [
    sellerVerified ? "Verified Seller" : "",
    photosVerified ? "Photos Verified" : "",
    rcVerified ? "RC Verified" : "",
    yardVerified ? "Yard Verified" : "",
  ].filter(Boolean);

  return (
    <section className={`rounded-2xl border border-slate-200 bg-white p-5 shadow-sm ${className}`}>
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
      {vehicleId ? (
        <VehicleContactActions
          vehicleId={vehicleId}
          sellerPhone={phone}
          vehicleTitle={vehicleTitle}
          className="mt-5"
          showRequestDetails
        />
      ) : null}
    </section>
  );
}
