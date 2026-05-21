import Link from "next/link";
import { redirect } from "next/navigation";
import { desc, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { vehicles, leads } from "@/lib/schema";

export const dynamic = "force-dynamic";

export default async function BankDashboardPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/auth/login");
  if (user.accountType !== "BANK_PARTNER" && user.accountType !== "ADMIN") redirect("/");

  const [vehicleRows, leadRows] = await Promise.all([
    db.select().from(vehicles).where(eq(vehicles.sellerId, user.id)).orderBy(desc(vehicles.createdAt)),
    db.select().from(leads).where(eq(leads.sellerId, user.id)).orderBy(desc(leads.createdAt)),
  ]);

  const pending = vehicleRows.filter((v) => v.listingStatus === "PENDING" || v.listingStatus === "BANK_PENDING_REVIEW").length;
  const live = vehicleRows.filter((v) => v.listingStatus === "VERIFIED").length;
  const sold = vehicleRows.filter((v) => v.listingStatus === "SOLD").length;

  return (
    <main className="space-y-4 px-4 pb-8 pt-4">
      <h1 className="text-2xl font-semibold text-slate-900">Bank Dashboard</h1>
      <section className="grid grid-cols-2 gap-3">
        <article className="rounded-2xl border border-slate-100 bg-white p-4"><p className="text-xs text-slate-500">Total Vehicles</p><p className="text-xl font-semibold">{vehicleRows.length}</p></article>
        <article className="rounded-2xl border border-slate-100 bg-white p-4"><p className="text-xs text-slate-500">Pending Verification</p><p className="text-xl font-semibold">{pending}</p></article>
        <article className="rounded-2xl border border-slate-100 bg-white p-4"><p className="text-xs text-slate-500">Live Listings</p><p className="text-xl font-semibold">{live}</p></article>
        <article className="rounded-2xl border border-slate-100 bg-white p-4"><p className="text-xs text-slate-500">Sold Vehicles</p><p className="text-xl font-semibold">{sold}</p></article>
        <article className="rounded-2xl border border-slate-100 bg-white p-4 col-span-2"><p className="text-xs text-slate-500">Total Leads</p><p className="text-xl font-semibold">{leadRows.length}</p></article>
      </section>
      <section className="grid grid-cols-2 gap-2">
        <Link href="/bank/vehicles" className="inline-flex min-h-11 items-center justify-center rounded-xl border border-slate-200 bg-white text-sm font-semibold text-slate-700">Vehicles</Link>
        <Link href="/bank/leads" className="inline-flex min-h-11 items-center justify-center rounded-xl border border-slate-200 bg-white text-sm font-semibold text-slate-700">Leads</Link>
        <Link href="/bank/vehicles/new" className="inline-flex min-h-11 items-center justify-center rounded-xl border border-slate-200 bg-white text-sm font-semibold text-slate-700">Add Vehicle</Link>
        <Link href="/bank/team" className="inline-flex min-h-11 items-center justify-center rounded-xl border border-slate-200 bg-white text-sm font-semibold text-slate-700">Team</Link>
      </section>
    </main>
  );
}
