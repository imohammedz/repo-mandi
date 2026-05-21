import { redirect } from "next/navigation";
import { desc, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { leads, vehicles } from "@/lib/schema";

export const dynamic = "force-dynamic";

export default async function BankLeadsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/auth/login");
  if (user.accountType !== "BANK_PARTNER" && user.accountType !== "ADMIN") redirect("/");

  const rows = await db
    .select({
      id: leads.id,
      source: leads.source,
      buyerName: leads.buyerName,
      buyerPhone: leads.buyerPhone,
      message: leads.message,
      createdAt: leads.createdAt,
      vehicleTitle: vehicles.title,
    })
    .from(leads)
    .leftJoin(vehicles, eq(leads.vehicleId, vehicles.id))
    .where(eq(leads.sellerId, user.id))
    .orderBy(desc(leads.createdAt));

  return (
    <main className="space-y-4 px-4 pb-8 pt-4">
      <h1 className="text-2xl font-semibold text-slate-900">Bank Leads</h1>
      <section className="space-y-3">
        {rows.length === 0 ? <p className="text-sm text-slate-500">No leads yet.</p> : null}
        {rows.map((lead) => (
          <article key={lead.id} className="space-y-1 rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
            <h3 className="text-sm font-semibold text-slate-900">{lead.vehicleTitle ?? "-"}</h3>
            <p className="text-xs text-slate-600">Source: {lead.source}</p>
            <p className="text-xs text-slate-600">Buyer: {lead.buyerName || "Anonymous"} {lead.buyerPhone ? `• ${lead.buyerPhone}` : ""}</p>
            {lead.message ? <p className="text-xs text-slate-600">{lead.message}</p> : null}
          </article>
        ))}
      </section>
    </main>
  );
}

