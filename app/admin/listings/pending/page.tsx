import { redirect } from "next/navigation";
import { desc, eq, or } from "drizzle-orm";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { vehicles } from "@/lib/schema";
import { dbToVehicle } from "@/lib/mappers";
import { StatusBadge } from "@/components/ui/status-badge";

export const dynamic = "force-dynamic";

export default async function AdminPendingListingsPage() {
  const currentUser = await getCurrentUser();
  if (!currentUser) redirect("/admin/login");
  if (currentUser.accountType !== "ADMIN") redirect("/admin/login");

  const rows = await db
    .select()
    .from(vehicles)
    .where(or(eq(vehicles.listingStatus, "PENDING"), eq(vehicles.listingStatus, "BANK_PENDING_REVIEW")))
    .orderBy(desc(vehicles.createdAt));
  const pending = rows.map(dbToVehicle);

  return (
    <main className="space-y-4 px-4 pb-8 pt-4">
      <h1 className="text-2xl font-semibold text-slate-900">Pending Listings</h1>
      <section className="space-y-3">
        {pending.map((vehicle) => (
          <article key={vehicle.id} className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
            <div className="flex items-start justify-between gap-2">
              <div>
                <h3 className="text-sm font-semibold text-slate-900">{vehicle.title}</h3>
                <p className="text-xs text-slate-500">{vehicle.city}, {vehicle.state}</p>
              </div>
              {vehicle.listingStatus ? <StatusBadge status={vehicle.listingStatus} /> : null}
            </div>
          </article>
        ))}
      </section>
    </main>
  );
}
