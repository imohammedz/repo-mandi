"use client";

import { useState } from "react";
import { formatInr } from "@/lib/finance";

type FinanceInquiry = {
  id: number;
  buyerName: string;
  buyerPhone: string;
  listingTitle: string;
  listingPrice: number | null;
  estimatedEmi: number | null;
  requirementText: string;
  status: "NEW" | "CONTACTED" | "CLOSED" | "REJECTED";
  createdAt: string | Date;
  phoneVerified: boolean;
};

type Props = {
  initialRows: FinanceInquiry[];
};

const statusStyles: Record<FinanceInquiry["status"], string> = {
  NEW: "bg-slate-100 text-slate-700",
  CONTACTED: "bg-sky-100 text-sky-700",
  CLOSED: "bg-emerald-100 text-emerald-700",
  REJECTED: "bg-rose-100 text-rose-700",
};

export default function FinanceInquiriesClient({ initialRows }: Props) {
  const [rows, setRows] = useState(initialRows);
  const [updatingId, setUpdatingId] = useState<number | null>(null);

  const updateStatus = async (id: number, status: FinanceInquiry["status"]) => {
    setUpdatingId(id);
    try {
      const response = await fetch(`/api/finance-inquiries/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (!response.ok) return;
      const updated = (await response.json()) as FinanceInquiry;
      setRows((prev) => prev.map((row) => (row.id === id ? { ...row, ...updated } : row)));
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <main className="space-y-5 px-4 pb-8 pt-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-slate-900">Finance Inquiries</h1>
        <a
          href="/admin/dashboard"
          className="inline-flex min-h-10 items-center rounded-lg border border-slate-200 px-3 text-xs font-medium text-slate-700"
        >
          Back to Dashboard
        </a>
      </div>

      {rows.length === 0 ? <p className="text-sm text-slate-500">No finance inquiries yet.</p> : null}

      <section className="space-y-3">
        {rows.map((row) => (
          <article key={row.id} className="space-y-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <p className="text-sm font-semibold text-slate-900">{row.buyerName}</p>
                <p className="text-xs text-slate-600">
                  {row.buyerPhone}
                  {row.phoneVerified ? " • Verified" : " • Unverified"}
                </p>
                <p className="mt-1 text-sm text-slate-700">{row.listingTitle}</p>
              </div>
              <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${statusStyles[row.status]}`}>{row.status}</span>
            </div>
            <div className="grid grid-cols-2 gap-2 rounded-xl border border-slate-100 bg-slate-50 p-3 text-sm">
              <div>
                <p className="text-xs text-slate-500">Price</p>
                <p className="font-semibold text-slate-900">{row.listingPrice ? formatInr(row.listingPrice) : "-"}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500">Estimated EMI</p>
                <p className="font-semibold text-slate-900">{row.estimatedEmi ? `${formatInr(row.estimatedEmi)} / month` : "-"}</p>
              </div>
            </div>
            <div>
              <p className="text-xs text-slate-500">Requirement</p>
              <p className="text-sm text-slate-700">{row.requirementText}</p>
            </div>
            <p className="text-xs text-slate-500">{new Date(row.createdAt).toLocaleString("en-IN")}</p>

            <div className="grid grid-cols-3 gap-2">
              <button
                onClick={() => updateStatus(row.id, "CONTACTED")}
                disabled={updatingId === row.id}
                className="min-h-10 rounded-xl border border-sky-200 bg-sky-50 text-xs font-semibold text-sky-700 disabled:opacity-50"
              >
                Contacted
              </button>
              <button
                onClick={() => updateStatus(row.id, "CLOSED")}
                disabled={updatingId === row.id}
                className="min-h-10 rounded-xl border border-emerald-200 bg-emerald-50 text-xs font-semibold text-emerald-700 disabled:opacity-50"
              >
                Closed
              </button>
              <button
                onClick={() => updateStatus(row.id, "REJECTED")}
                disabled={updatingId === row.id}
                className="min-h-10 rounded-xl border border-rose-200 bg-rose-50 text-xs font-semibold text-rose-700 disabled:opacity-50"
              >
                Rejected
              </button>
            </div>
          </article>
        ))}
      </section>
    </main>
  );
}
