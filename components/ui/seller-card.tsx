"use client";

import { VehicleContactActions } from "@/components/ui/vehicle-contact-actions";

type Props = {
  name: string;
  role: string;
  phone: string;
  vehicleTitle: string;
  vehicleId?: string;
  sellerId?: number;
  city?: string;
  sellerVerified?: boolean;
};

export function SellerCard({ name, role, phone, vehicleTitle, vehicleId, city, sellerVerified = false }: Props) {
  return (
    <section className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
      <h3 className="text-sm font-semibold text-slate-900">Seller Profile</h3>
      <p className="mt-2 text-base font-semibold text-slate-800">{name}</p>
      <p className="text-sm text-slate-500">{role}{city ? ` • ${city}` : ""}</p>
      <div className="mt-2 flex items-center gap-2 text-xs text-slate-500">
        {sellerVerified ? (
          <span className="rounded-full bg-emerald-50 px-2 py-1 text-emerald-700">Verified Seller</span>
        ) : (
          <span className="rounded-full bg-slate-100 px-2 py-1 text-slate-600">Unverified Seller</span>
        )}
      </div>
      {vehicleId ? (
        <VehicleContactActions
          vehicleId={vehicleId}
          sellerPhone={phone}
          vehicleTitle={vehicleTitle}
          className="mt-4"
          showRequestDetails
        />
      ) : null}
    </section>
  );
}
