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

  const updateStatus = async (id: string, status: "Verified" | "Rejected") => {
    setUpdating(id);
    try {
      const response = await fetch(`/api/vehicles/${id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (response.ok) {
        setVehicles((prev) =>
          prev.map((v) => (v.id === id ? { ...v, listingStatus: status } : v))
        );
      }
    } finally {
      setUpdating(null);
    }
  };

  const pending = vehicles.filter((v) => !v.listingStatus || v.listingStatus === "Pending");
  const total = vehicles.length;
  const verified = vehicles.filter((v) => v.listingStatus === "Verified").length;

  const liveStats = [
    ...stats.slice(0, 2),
    { label: "Total listings (live)", value: String(total) },
    { label: "Verified (live)", value: String(verified) },
    ...stats.slice(4),
  ];

  return (
    <main className="space-y-5 px-4 pb-8 pt-4">
      <h1 className="text-2xl font-semibold text-slate-900">Admin Dashboard</h1>

      <section className="grid grid-cols-2 gap-3">
        {liveStats.map((item) => (
          <StatsCard key={item.label} label={item.label} value={item.value} hint={item.hint} />
        ))}
      </section>

      <section className="space-y-3">
        <h2 className="text-base font-semibold text-slate-900">
          Pending approvals ({pending.length})
        </h2>
        {pending.length === 0 && (
          <p className="text-sm text-slate-500">No pending approvals.</p>
        )}
        {pending.map((vehicle) => (
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
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => updateStatus(vehicle.id, "Verified")}
                disabled={updating === vehicle.id}
                className="min-h-11 rounded-xl bg-emerald-600 text-sm font-semibold text-white disabled:opacity-50"
              >
                {updating === vehicle.id ? "Saving…" : "Approve"}
              </button>
              <button
                onClick={() => updateStatus(vehicle.id, "Rejected")}
                disabled={updating === vehicle.id}
                className="min-h-11 rounded-xl border border-rose-200 bg-rose-50 text-sm font-semibold text-rose-700 disabled:opacity-50"
              >
                {updating === vehicle.id ? "Saving…" : "Reject"}
              </button>
            </div>
          </article>
        ))}
      </section>
    </main>
  );
}
