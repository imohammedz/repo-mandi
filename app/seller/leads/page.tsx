import { redirect } from "next/navigation";
import { desc, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { leads, vehicles } from "@/lib/schema";

export const dynamic = "force-dynamic";

export default async function SellerLeadsPage() {
  const currentUser = await getCurrentUser();
  if (!currentUser) redirect("/auth/login");
  if (!["SELLER", "BANK_PARTNER", "ADMIN"].includes(currentUser.accountType)) redirect("/sell");
  if (!currentUser.isProfileComplete) redirect("/onboarding");

  const rows = await db
    .select({
      id: leads.id,
      vehicleId: leads.vehicleId,
      source: leads.source,
      buyerName: leads.buyerName,
      buyerPhone: leads.buyerPhone,
      message: leads.message,
      createdAt: leads.createdAt,
      vehicleTitle: vehicles.title,
    })
    .from(leads)
    .leftJoin(vehicles, eq(leads.vehicleId, vehicles.id))
    .where(eq(leads.sellerId, currentUser.id))
    .orderBy(desc(leads.createdAt));

  return (
    <main className="space-y-4 px-4 pb-8 pt-4">
      <h1 className="text-2xl font-semibold text-slate-900">Seller Leads</h1>
      <section className="space-y-3">
        {rows.length === 0 ? (
          <p className="text-sm text-slate-500">No leads yet.</p>
        ) : null}
        {rows.map((lead) => (
          <article key={lead.id} className="space-y-2 rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
            <h3 className="text-sm font-semibold text-slate-900">{lead.vehicleTitle ?? lead.vehicleId}</h3>
            <p className="text-xs text-slate-600">Source: {lead.source}</p>
            <p className="text-xs text-slate-600">Buyer: {lead.buyerName || "Anonymous"} {lead.buyerPhone ? `• ${lead.buyerPhone}` : ""}</p>
            {lead.message ? <p className="text-xs text-slate-600">Message: {lead.message}</p> : null}
            <p className="text-xs text-slate-500">{new Date(lead.createdAt).toLocaleString("en-IN")}</p>
          </article>
        ))}
      </section>
    </main>
  );
}

