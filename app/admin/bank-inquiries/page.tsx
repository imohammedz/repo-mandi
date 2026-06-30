import Link from "next/link";
import { desc } from "drizzle-orm";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { bankPartnerInquiries } from "@/lib/schema";

export const dynamic = "force-dynamic";

export default async function AdminBankInquiriesPage() {
  const currentUser = await getCurrentUser();
  if (!currentUser || currentUser.accountType !== "ADMIN") redirect("/admin/login");

  const rows = await db.select().from(bankPartnerInquiries).orderBy(desc(bankPartnerInquiries.createdAt));

  return (
    <main className="space-y-5 px-4 pb-8 pt-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-slate-900">Bank Inquiries</h1>
        <Link
          href="/admin/dashboard"
          className="inline-flex min-h-10 items-center rounded-lg border border-slate-200 px-3 text-xs font-medium text-slate-700"
        >
          Back to Dashboard
        </Link>
      </div>

      {rows.length === 0 ? <p className="text-sm text-slate-500">No bank inquiries yet.</p> : null}

      <section className="space-y-3">
        {rows.map((row) => (
          <article key={row.id} className="space-y-2 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <p className="text-sm font-semibold text-slate-900">{row.bankName}</p>
                <p className="text-xs text-slate-600">
                  Branch: {row.branchName} • {row.branchLocation}
                </p>
              </div>
              <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700">{row.status}</span>
            </div>

            <div className="grid gap-2 text-sm text-slate-700 sm:grid-cols-2">
              <p>
                <span className="text-slate-500">Contact Person:</span> {row.contactPersonName}
              </p>
              <p>
                <span className="text-slate-500">Phone:</span> {row.contactNumber}
              </p>
              <p>
                <span className="text-slate-500">Email:</span> {row.bankEmail}
              </p>
              <p>
                <span className="text-slate-500">Designation:</span> {row.designation}
              </p>
            </div>

            <p className="text-sm text-slate-700">
              <span className="text-slate-500">Message:</span> {row.message || "-"}
            </p>
            <p className="text-xs text-slate-500">
              <span className="text-slate-500">Submitted:</span> {new Date(row.createdAt).toLocaleString("en-IN")}
            </p>
          </article>
        ))}
      </section>
    </main>
  );
}
