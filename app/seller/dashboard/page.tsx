import Link from "next/link";
import { StatsCard } from "@/components/ui/stats-card";
import { StatusBadge } from "@/components/ui/status-badge";
import { formatCurrency } from "@/data/vehicles";
import { db } from "@/lib/db";
import { vehicles as vehiclesTable } from "@/lib/schema";
import { dbToVehicle } from "@/lib/mappers";
import { desc, eq } from "drizzle-orm";
import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import { MarkSoldButton } from "../listings/mark-sold-button";

export const dynamic = "force-dynamic";

export default async function SellerDashboardPage() {
  const currentUser = await getCurrentUser();
  if (!currentUser) redirect("/auth/login");
  if (!["SELLER", "BANK_PARTNER", "ADMIN"].includes(currentUser.accountType)) redirect("/sell");
  if (!currentUser.isProfileComplete) redirect("/onboarding");

  const rows = await db
    .select()
    .from(vehiclesTable)
    .where(eq(vehiclesTable.sellerId, currentUser.id))
    .orderBy(desc(vehiclesTable.createdAt));
  const vehicleList = rows.map(dbToVehicle);

  const total = vehicleList.length;
  const pending = vehicleList.filter((v) => v.listingStatus === "PENDING" || v.listingStatus === "BANK_PENDING_REVIEW").length;
  const verified = vehicleList.filter((v) => v.listingStatus === "VERIFIED").length;
  const sold = vehicleList.filter((v) => v.listingStatus === "SOLD").length;
  const totalInquiries = vehicleList.reduce((acc, v) => acc + v.inquiries, 0);

  const stats = [
    { label: "Total listings", value: String(total) },
    { label: "Pending", value: String(pending) },
    { label: "Verified", value: String(verified) },
    { label: "Sold", value: String(sold) },
    { label: "Total inquiries", value: String(totalInquiries) },
  ];

  return (
    <main className="space-y-5 px-4 pb-8 pt-4">
      <header className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-slate-900">Seller Dashboard</h1>
        <Link href="/seller/listings/new" className="inline-flex min-h-11 items-center rounded-xl bg-slate-900 px-4 text-sm font-semibold text-white">
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
        {vehicleList.map((vehicle) => (
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
              <div className="flex gap-2">
                <Link
                  href={`/vehicles/${vehicle.id}`}
                  className="min-h-10 rounded-lg border border-slate-200 px-3 font-medium text-slate-700 inline-flex items-center"
                >
                  View
                </Link>
                {vehicle.listingStatus === "PENDING" || vehicle.listingStatus === "REJECTED" ? (
                  <Link
                    href={`/seller/edit-vehicle/${vehicle.id}`}
                    className="min-h-10 rounded-lg border border-slate-200 px-3 font-medium text-slate-700 inline-flex items-center"
                  >
                    Edit
                  </Link>
                ) : null}
                {vehicle.listingStatus === "VERIFIED" || vehicle.listingStatus === "PENDING" ? (
                  <MarkSoldButton vehicleId={vehicle.id} />
                ) : null}
              </div>
            </div>
          </article>
        ))}
      </section>

      <section className="grid grid-cols-2 gap-2">
        <Link href="/seller/listings" className="inline-flex min-h-11 items-center justify-center rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700">
          Manage Listings
        </Link>
        <Link href="/seller/leads" className="inline-flex min-h-11 items-center justify-center rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700">
          View Leads
        </Link>
      </section>
    </main>
  );
}
