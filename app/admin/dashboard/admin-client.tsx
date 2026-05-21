"use client";

import { useState } from "react";
import { StatsCard } from "@/components/ui/stats-card";
import { StatusBadge } from "@/components/ui/status-badge";
import type { Vehicle } from "@/types/vehicle";

type AdminDashboardClientProps = {
  vehicleList: Vehicle[];
  stats: { label: string; value: string; hint?: string }[];
};

export default function AdminDashboardClient({ vehicleList, stats }: AdminDashboardClientProps) {
  const [vehicles, setVehicles] = useState(vehicleList);
  const [updating, setUpdating] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"PENDING" | "HIGH_RISK" | "VERIFIED" | "REJECTED" | "SOLD">("PENDING");
  const [rejectionReason, setRejectionReason] = useState<Record<string, string>>({});

  const updateStatus = async (id: string, status: "VERIFIED" | "REJECTED" | "SOLD") => {
    setUpdating(id);
    try {
      const response = await fetch(`/api/vehicles/${id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status,
          rejectionReason: rejectionReason[id] || undefined,
          sellerVerified: status === "VERIFIED",
          rcVerified: status === "VERIFIED",
          photosVerified: status === "VERIFIED",
          yardVerified: status === "VERIFIED",
        }),
      });
      if (response.ok) {
        const updated = (await response.json()) as Vehicle;
        setVehicles((prev) => prev.map((v) => (v.id === id ? { ...v, ...updated } : v)));
      }
    } finally {
      setUpdating(null);
    }
  };

  const pending = vehicles.filter((v) => !v.listingStatus || v.listingStatus === "PENDING" || v.listingStatus === "BANK_PENDING_REVIEW");
  const verified = vehicles.filter((v) => v.listingStatus === "VERIFIED");
  const rejected = vehicles.filter((v) => v.listingStatus === "REJECTED");
  const sold = vehicles.filter((v) => v.listingStatus === "SOLD");
  const highRisk = vehicles.filter(
    (v) =>
      v.missingPhotos ||
      v.priceTooLow ||
      v.duplicateRegistration ||
      v.newSeller ||
      v.missingYardLocation
  );
  const total = vehicles.length;
  const verifiedCount = verified.length;

  const liveStats = [
    ...stats.slice(0, 2),
    { label: "Total listings (live)", value: String(total) },
    { label: "Verified (live)", value: String(verifiedCount) },
    ...stats.slice(4),
  ];

  const listToShow =
    activeTab === "PENDING"
      ? pending
      : activeTab === "HIGH_RISK"
        ? highRisk
        : activeTab === "VERIFIED"
          ? verified
          : activeTab === "REJECTED"
            ? rejected
            : sold;

  return (
    <main className="space-y-5 px-4 pb-8 pt-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-slate-900">Admin Dashboard</h1>
        <div className="flex gap-2">
          <a
            href="/admin/listings/pending"
            className="inline-flex min-h-10 items-center rounded-lg border border-slate-200 px-3 text-xs font-medium text-slate-700"
          >
            Pending Queue
          </a>
          <a
            href="/admin/banks"
            className="inline-flex min-h-10 items-center rounded-lg border border-slate-200 px-3 text-xs font-medium text-slate-700"
          >
            Bank Users
          </a>
        </div>
      </div>

      <section className="grid grid-cols-2 gap-3">
        {liveStats.map((item) => (
          <StatsCard key={item.label} label={item.label} value={item.value} hint={item.hint} />
        ))}
      </section>

      <section className="space-y-3">
        <div className="flex flex-wrap gap-2">
          {[
            { key: "PENDING", label: `Pending (${pending.length})` },
            { key: "HIGH_RISK", label: `High Risk (${highRisk.length})` },
            { key: "VERIFIED", label: `Verified (${verified.length})` },
            { key: "REJECTED", label: `Rejected (${rejected.length})` },
            { key: "SOLD", label: `Sold (${sold.length})` },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as typeof activeTab)}
              className={`rounded-full border px-3 py-1 text-xs font-medium ${
                activeTab === tab.key ? "border-slate-900 bg-slate-900 text-white" : "border-slate-200 bg-white text-slate-700"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
        {listToShow.length === 0 && (
          <p className="text-sm text-slate-500">No listings in this queue.</p>
        )}
        {listToShow.map((vehicle) => (
          <article key={vehicle.id} className="space-y-3 rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
            <div className="flex items-start justify-between gap-2">
              <div>
                <h3 className="text-sm font-semibold text-slate-900">{vehicle.title}</h3>
                <p className="text-xs text-slate-500">Seller: {vehicle.sellerName}</p>
              </div>
              {vehicle.listingStatus ? <StatusBadge status={vehicle.listingStatus} /> : null}
            </div>
            <p className="rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-700">
              Verify mileage ({vehicle.kmDriven.toLocaleString("en-IN")} km), condition: {vehicle.condition}
            </p>
            {(vehicle.missingPhotos || vehicle.priceTooLow || vehicle.duplicateRegistration || vehicle.newSeller || vehicle.missingYardLocation) && (
              <div className="flex flex-wrap gap-2">
                {vehicle.missingPhotos && <span className="rounded-full bg-rose-50 px-2 py-1 text-[11px] text-rose-700">Missing Photos</span>}
                {vehicle.priceTooLow && <span className="rounded-full bg-rose-50 px-2 py-1 text-[11px] text-rose-700">Price Too Low</span>}
                {vehicle.duplicateRegistration && <span className="rounded-full bg-rose-50 px-2 py-1 text-[11px] text-rose-700">Duplicate Registration</span>}
                {vehicle.newSeller && <span className="rounded-full bg-amber-50 px-2 py-1 text-[11px] text-amber-700">New Seller</span>}
                {vehicle.missingYardLocation && <span className="rounded-full bg-rose-50 px-2 py-1 text-[11px] text-rose-700">Missing Yard Location</span>}
              </div>
            )}
            <input
              value={rejectionReason[vehicle.id] ?? ""}
              onChange={(e) => setRejectionReason((prev) => ({ ...prev, [vehicle.id]: e.target.value }))}
              placeholder="Rejection reason (for reject action)"
              className="min-h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-xs text-slate-700"
            />
            <div className="grid grid-cols-3 gap-2">
              <button
                onClick={() => updateStatus(vehicle.id, "VERIFIED")}
                disabled={updating === vehicle.id}
                className="min-h-11 rounded-xl bg-emerald-600 text-sm font-semibold text-white disabled:opacity-50"
              >
                {updating === vehicle.id ? "Saving…" : "Approve"}
              </button>
              <button
                onClick={() => updateStatus(vehicle.id, "REJECTED")}
                disabled={updating === vehicle.id}
                className="min-h-11 rounded-xl border border-rose-200 bg-rose-50 text-sm font-semibold text-rose-700 disabled:opacity-50"
              >
                {updating === vehicle.id ? "Saving…" : "Reject"}
              </button>
              <button
                onClick={() => updateStatus(vehicle.id, "SOLD")}
                disabled={updating === vehicle.id}
                className="min-h-11 rounded-xl border border-sky-200 bg-sky-50 text-sm font-semibold text-sky-700 disabled:opacity-50"
              >
                {updating === vehicle.id ? "Saving…" : "Mark Sold"}
              </button>
            </div>
          </article>
        ))}
      </section>
    </main>
  );
}
