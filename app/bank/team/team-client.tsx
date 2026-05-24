"use client";

import { useCallback, useEffect, useState } from "react";

type TeamUser = {
  id: number;
  fullName: string;
  phone: string;
  email: string | null;
  bankRole: string | null;
  branchName: string;
  verificationStatus: string;
};

export default function BankTeamClient() {
  const [users, setUsers] = useState<TeamUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    fullName: "",
    phone: "",
    email: "",
    bankRole: "COLLECTION_AGENT",
    city: "",
    state: "",
    employeeId: "",
  });

  const load = useCallback(async () => {
    try {
      const response = await fetch("/api/bank/team");
      if (!response.ok) return;
      const data = (await response.json()) as TeamUser[];
      setUsers(data);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const submit = async () => {
    if (saving) return;
    setSaving(true);
    setError("");
    try {
      const response = await fetch("/api/bank/team", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = (await response.json()) as { message?: string };
      if (!response.ok) {
        setError(data.message ?? "Failed to add team member.");
        return;
      }
      setForm({
        fullName: "",
        phone: "",
        email: "",
        bankRole: "COLLECTION_AGENT",
        city: "",
        state: "",
        employeeId: "",
      });
      await load();
    } finally {
      setSaving(false);
    }
  };

  return (
    <main className="space-y-4 px-4 pb-8 pt-4">
      <h1 className="text-2xl font-semibold text-slate-900">Bank Team</h1>
      <section className="space-y-2 rounded-2xl border border-slate-100 bg-white p-4">
        <h2 className="text-sm font-semibold text-slate-900">Add Team Member</h2>
        <input value={form.fullName} onChange={(e) => setForm((p) => ({ ...p, fullName: e.target.value }))} placeholder="Full name" className="min-h-10 w-full rounded-lg border border-slate-200 px-3 text-sm" />
        <input value={form.phone} onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value.replace(/\D/g, "") }))} placeholder="Mobile" className="min-h-10 w-full rounded-lg border border-slate-200 px-3 text-sm" />
        <input value={form.email} onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))} placeholder="Official email" className="min-h-10 w-full rounded-lg border border-slate-200 px-3 text-sm" />
        <select value={form.bankRole} onChange={(e) => setForm((p) => ({ ...p, bankRole: e.target.value }))} className="min-h-10 w-full rounded-lg border border-slate-200 px-3 text-sm">
          <option value="COLLECTION_AGENT">Collection Agent</option>
          <option value="RECOVERY_OFFICER">Recovery Officer</option>
          <option value="VIEWER">Viewer</option>
        </select>
        <button onClick={submit} disabled={saving} className="inline-flex min-h-10 items-center justify-center rounded-lg bg-slate-900 px-4 text-sm font-semibold text-white disabled:opacity-50">
          {saving ? "Saving..." : "Add Team Member"}
        </button>
        {error ? <p className="text-xs text-red-600">{error}</p> : null}
      </section>
      <section className="space-y-2">
        <h2 className="text-sm font-semibold text-slate-900">Members</h2>
        {loading ? <p className="text-sm text-slate-500">Loading...</p> : null}
        {users.map((member) => (
          <article key={member.id} className="rounded-xl border border-slate-100 bg-white p-3 text-xs text-slate-600">
            <p className="font-medium text-slate-900">{member.fullName}</p>
            <p>{member.bankRole} • {member.phone}</p>
            <p>{member.email ?? "-"}</p>
            <p>Status: {member.verificationStatus}</p>
          </article>
        ))}
      </section>
    </main>
  );
}
