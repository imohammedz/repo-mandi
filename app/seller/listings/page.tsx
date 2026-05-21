import Link from "next/link";
import { redirect } from "next/navigation";
import { desc, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { vehicles } from "@/lib/schema";
import { dbToVehicle } from "@/lib/mappers";
import { StatusBadge } from "@/components/ui/status-badge";
import { formatCurrency } from "@/data/vehicles";
import { MarkSoldButton } from "./mark-sold-button";

export const dynamic = "force-dynamic";

export default async function SellerListingsPage() {
  const currentUser = await getCurrentUser();
  if (!currentUser) redirect("/auth/login");
  if (!["SELLER", "BANK_PARTNER", "ADMIN"].includes(currentUser.accountType)) redirect("/sell");
  if (!currentUser.isProfileComplete) redirect("/onboarding");

  const rows = await db
    .select()
    .from(vehicles)
    .where(eq(vehicles.sellerId, currentUser.id))
    .orderBy(desc(vehicles.createdAt));
  const listingRows = rows.map(dbToVehicle);

  return (
    <main className="space-y-4 px-4 pb-8 pt-4">
      <header className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-slate-900">My Listings</h1>
        <Link href="/seller/listings/new" className="inline-flex min-h-11 items-center rounded-xl bg-slate-900 px-4 text-sm font-semibold text-white">
          Add Vehicle
        </Link>
      </header>

      <section className="space-y-3">
        {listingRows.map((item) => (
          <article key={item.id} className="space-y-3 rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
            <div className="flex items-start justify-between gap-2">
              <div>
                <h3 className="text-sm font-semibold text-slate-900">{item.title}</h3>
                <p className="text-xs text-slate-500">{formatCurrency(item.price)} • {item.city}, {item.state}</p>
              </div>
              {item.listingStatus ? <StatusBadge status={item.listingStatus} /> : null}
            </div>
            {item.rejectionReason ? (
              <p className="rounded-lg bg-rose-50 px-3 py-2 text-xs text-rose-700">
                Rejection reason: {item.rejectionReason}
              </p>
            ) : null}
            <div className="flex flex-wrap gap-2">
              <Link href={`/vehicles/${item.id}`} className="inline-flex min-h-10 items-center rounded-lg border border-slate-200 px-3 text-xs font-medium text-slate-700">
                View
              </Link>
              {(item.listingStatus === "PENDING" || item.listingStatus === "REJECTED") && (
                <Link href={`/seller/edit-vehicle/${item.id}`} className="inline-flex min-h-10 items-center rounded-lg border border-slate-200 px-3 text-xs font-medium text-slate-700">
                  Edit
                </Link>
              )}
              {item.listingStatus === "VERIFIED" && (
                <MarkSoldButton vehicleId={item.id} />
              )}
            </div>
          </article>
        ))}
      </section>
    </main>
  );
}
