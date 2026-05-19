import Link from "next/link";
import { StatsCard } from "@/components/ui/stats-card";
import { StatusBadge } from "@/components/ui/status-badge";
import { formatCurrency, vehicles } from "@/data/vehicles";

const stats = [
  { label: "Total listings", value: "24" },
  { label: "Pending", value: "5" },
  { label: "Verified", value: "14" },
  { label: "Sold", value: "3" },
  { label: "Total inquiries", value: "192" },
];

export default function SellerDashboardPage() {
  return (
    <main className="space-y-5 px-4 pb-8 pt-4">
      <header className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-slate-900">Seller Dashboard</h1>
        <Link href="/seller/add-vehicle" className="inline-flex min-h-11 items-center rounded-xl bg-slate-900 px-4 text-sm font-semibold text-white">
          Add Vehicle
        </Link>
      </header>

      <section className="grid grid-cols-2 gap-3">
        {stats.map((item) => (
          <StatsCard key={item.label} label={item.label} value={item.value} />
        ))}
      </section>

      <section className="space-y-3">
        <h2 className="text-base font-semibold text-slate-900">Your Listings</h2>
        {vehicles.map((vehicle) => (
          <article key={vehicle.id} className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="text-sm font-semibold text-slate-900">{vehicle.title}</h3>
                <p className="mt-1 text-xs text-slate-500">{formatCurrency(vehicle.price)}</p>
              </div>
              {vehicle.listingStatus ? <StatusBadge status={vehicle.listingStatus} /> : null}
            </div>
            <div className="mt-3 flex items-center justify-between text-xs text-slate-500">
              <span>{vehicle.inquiries} inquiries</span>
              <button className="min-h-10 rounded-lg border border-slate-200 px-3 font-medium text-slate-700">Edit</button>
            </div>
          </article>
        ))}
      </section>
    </main>
  );
}
