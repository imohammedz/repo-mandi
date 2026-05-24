import Link from "next/link";
import { redirect } from "next/navigation";
import { desc, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { vehicles } from "@/lib/schema";
import { StatusBadge } from "@/components/ui/status-badge";
import { formatCurrency } from "@/data/vehicles";

export const dynamic = "force-dynamic";

export default async function BankVehiclesPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/auth/login");
  if (user.accountType !== "BANK_PARTNER" && user.accountType !== "ADMIN") redirect("/");

  const rows = await db.select().from(vehicles).where(eq(vehicles.sellerId, user.id)).orderBy(desc(vehicles.createdAt));

  return (
    <main className="space-y-4 px-4 pb-8 pt-4">
      <header className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-slate-900">Bank Vehicles</h1>
        <Link href="/bank/vehicles/new" className="inline-flex min-h-11 items-center rounded-xl bg-slate-900 px-4 text-sm font-semibold text-white">
          Add Vehicle
        </Link>
      </header>
      <section className="space-y-3">
        {rows.map((row) => (
          <article key={row.id} className="space-y-2 rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
            <div className="flex items-start justify-between gap-2">
              <div>
                <h3 className="text-sm font-semibold text-slate-900">{row.title}</h3>
                <p className="text-xs text-slate-500">{formatCurrency(Number(row.price))}</p>
              </div>
              <StatusBadge status={row.listingStatus} />
            </div>
            <p className="text-xs text-slate-500">Branch: {row.branchName || "N/A"} • Leads: {row.inquiries}</p>
          </article>
        ))}
      </section>
    </main>
  );
}

