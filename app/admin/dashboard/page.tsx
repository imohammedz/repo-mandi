import { StatsCard } from "@/components/ui/stats-card";
import { StatusBadge } from "@/components/ui/status-badge";
import { vehicles } from "@/data/vehicles";

export default function AdminDashboardPage() {
  return (
    <main className="space-y-5 px-4 pb-8 pt-4">
      <h1 className="text-2xl font-semibold text-slate-900">Admin Dashboard</h1>

      <section className="grid grid-cols-2 gap-3">
        <StatsCard label="Total listings" value="248" />
        <StatsCard label="Total verified" value="161" />
        <StatsCard label="Most active city" value="Pune" />
        <StatsCard label="Most viewed type" value="Tipper" />
        <StatsCard label="Inquiry trends" value="+18%" hint="Last 30 days" />
      </section>

      <section className="space-y-3">
        <h2 className="text-base font-semibold text-slate-900">Pending approvals</h2>
        {vehicles.map((vehicle) => (
          <article key={vehicle.id} className="space-y-3 rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
            <div className="flex items-start justify-between gap-2">
              <div>
                <h3 className="text-sm font-semibold text-slate-900">{vehicle.title}</h3>
                <p className="text-xs text-slate-500">Seller: {vehicle.sellerName}</p>
              </div>
              {vehicle.listingStatus ? <StatusBadge status={vehicle.listingStatus} /> : null}
            </div>
            <p className="rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-700">Suspicious flag: Verify mileage and ownership timeline.</p>
            <div className="grid grid-cols-2 gap-2">
              <button className="min-h-11 rounded-xl bg-emerald-600 text-sm font-semibold text-white">Approve</button>
              <button className="min-h-11 rounded-xl border border-rose-200 bg-rose-50 text-sm font-semibold text-rose-700">Reject</button>
            </div>
          </article>
        ))}
      </section>
    </main>
  );
}
