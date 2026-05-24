"use client";

import { useState } from "react";

export default function AdminBanksClient() {
  const [form, setForm] = useState({
    fullName: "",
    phone: "",
    email: "",
    institutionName: "",
    branchName: "",
    bankRole: "BANK_ADMIN",
    city: "",
    state: "",
    employeeId: "",
  });
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const submit = async () => {
    if (saving) return;
    setSaving(true);
    setMessage("");
    setError("");
    try {
      const response = await fetch("/api/admin/bank-users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = (await response.json()) as { message?: string };
      if (!response.ok) {
        setError(data.message ?? "Failed to create bank user.");
        return;
      }
      setMessage("Bank partner user created/updated.");
      setForm({
        fullName: "",
        phone: "",
        email: "",
        institutionName: "",
        branchName: "",
        bankRole: "BANK_ADMIN",
        city: "",
        state: "",
        employeeId: "",
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <main className="space-y-4 px-4 pb-8 pt-4">
      <h1 className="text-2xl font-semibold text-slate-900">Create Bank Partner User</h1>
      <section className="space-y-2 rounded-2xl border border-slate-100 bg-white p-4">
        <input value={form.fullName} onChange={(e) => setForm((p) => ({ ...p, fullName: e.target.value }))} placeholder="Full name" className="min-h-10 w-full rounded-lg border border-slate-200 px-3 text-sm" />
        <input value={form.phone} onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value.replace(/\D/g, "") }))} placeholder="Mobile" className="min-h-10 w-full rounded-lg border border-slate-200 px-3 text-sm" />
        <input value={form.email} onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))} placeholder="Official email" className="min-h-10 w-full rounded-lg border border-slate-200 px-3 text-sm" />
        <input value={form.institutionName} onChange={(e) => setForm((p) => ({ ...p, institutionName: e.target.value }))} placeholder="Bank/NBFC name" className="min-h-10 w-full rounded-lg border border-slate-200 px-3 text-sm" />
        <input value={form.branchName} onChange={(e) => setForm((p) => ({ ...p, branchName: e.target.value }))} placeholder="Branch name" className="min-h-10 w-full rounded-lg border border-slate-200 px-3 text-sm" />
        <select value={form.bankRole} onChange={(e) => setForm((p) => ({ ...p, bankRole: e.target.value }))} className="min-h-10 w-full rounded-lg border border-slate-200 px-3 text-sm">
          <option value="BANK_ADMIN">Bank Admin</option>
          <option value="BANK_MANAGER">Bank Manager</option>
          <option value="BRANCH_ADMIN">Branch Admin</option>
          <option value="RECOVERY_OFFICER">Recovery Officer</option>
          <option value="COLLECTION_AGENT">Collection Agent</option>
          <option value="VIEWER">Viewer</option>
        </select>
        <input value={form.city} onChange={(e) => setForm((p) => ({ ...p, city: e.target.value }))} placeholder="City" className="min-h-10 w-full rounded-lg border border-slate-200 px-3 text-sm" />
        <input value={form.state} onChange={(e) => setForm((p) => ({ ...p, state: e.target.value }))} placeholder="State" className="min-h-10 w-full rounded-lg border border-slate-200 px-3 text-sm" />
        <input value={form.employeeId} onChange={(e) => setForm((p) => ({ ...p, employeeId: e.target.value }))} placeholder="Employee ID (optional)" className="min-h-10 w-full rounded-lg border border-slate-200 px-3 text-sm" />
        <button onClick={submit} disabled={saving} className="inline-flex min-h-10 items-center justify-center rounded-lg bg-slate-900 px-4 text-sm font-semibold text-white disabled:opacity-50">
          {saving ? "Saving..." : "Create Bank User"}
        </button>
        {message ? <p className="text-xs text-emerald-600">{message}</p> : null}
        {error ? <p className="text-xs text-red-600">{error}</p> : null}
      </section>
    </main>
  );
}

