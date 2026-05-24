"use client";

import { useState } from "react";

type AdminSettingsClientProps = {
  autoApproveListings: boolean;
};

export default function AdminSettingsClient({ autoApproveListings }: AdminSettingsClientProps) {
  const [enabled, setEnabled] = useState(autoApproveListings);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);

  const toggle = async () => {
    const next = !enabled;
    setSaving(true);
    setError("");
    setSaved(false);
    try {
      const response = await fetch("/api/admin/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ AUTO_APPROVE_LISTINGS: next }),
      });
      if (!response.ok) {
        const data = (await response.json()) as { message?: string };
        setError(data.message ?? "Failed to save setting.");
        return;
      }
      setEnabled(next);
      setSaved(true);
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <main className="space-y-6 px-4 pb-8 pt-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-slate-900">Admin Settings</h1>
        <a
          href="/admin/dashboard"
          className="inline-flex min-h-10 items-center rounded-lg border border-slate-200 px-3 text-xs font-medium text-slate-700"
        >
          ← Dashboard
        </a>
      </div>

      <section className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-1">
            <p className="text-sm font-semibold text-slate-900">Auto-approve new listings</p>
            <p className="text-xs text-slate-500">
              When enabled, new vehicle listings will go live immediately without manual admin review.
            </p>
            <p className={`text-xs font-medium ${enabled ? "text-emerald-600" : "text-slate-400"}`}>
              {enabled ? "Auto approval ON" : "Auto approval OFF"}
            </p>
          </div>
          <button
            type="button"
            onClick={toggle}
            disabled={saving}
            aria-label={`Auto-approve listings is currently ${enabled ? "on" : "off"}. Click to toggle.`}
            className={`relative inline-flex h-7 w-12 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 focus:outline-none disabled:opacity-50 ${
              enabled ? "bg-emerald-600" : "bg-slate-200"
            }`}
          >
            <span
              className={`inline-block h-6 w-6 transform rounded-full bg-white shadow ring-0 transition duration-200 ${
                enabled ? "translate-x-5" : "translate-x-0"
              }`}
            />
          </button>
        </div>

        {saved && (
          <p className="mt-3 text-xs font-medium text-emerald-600">
            Setting saved successfully.
          </p>
        )}
        {error && (
          <p className="mt-3 text-xs font-medium text-rose-600">{error}</p>
        )}
      </section>
    </main>
  );
}
