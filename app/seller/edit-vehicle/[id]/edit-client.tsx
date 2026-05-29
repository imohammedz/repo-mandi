"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, CheckCircle2, Trash2 } from "lucide-react";
import type { Vehicle } from "@/types/vehicle";

type Props = {
  vehicle: Vehicle;
};

export default function EditVehicleClient({ vehicle }: Props) {
  const router = useRouter();
  const [form, setForm] = useState({
    title: vehicle.title,
    price: String(vehicle.price),
    yardLocation: vehicle.yardLocation,
    conditionNotes: vehicle.conditionNotes,
    auctionDate: vehicle.auctionDate,
  });
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [saved, setSaved] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [error, setError] = useState("");

  const set = (key: keyof typeof form) => (val: string) =>
    setForm((prev) => ({ ...prev, [key]: val }));

  const handleSave = async () => {
    setSaving(true);
    setError("");
    try {
      const response = await fetch(`/api/seller/vehicles/${vehicle.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, expectedPrice: form.price, vehicleOrYardLocation: form.yardLocation }),
      });
      if (!response.ok) {
        const data = (await response.json()) as { message?: string };
        setError(data.message ?? "Failed to save changes.");
        return;
      }
      const data = (await response.json()) as { message?: string };
      setSuccessMessage(data.message ?? "Changes saved.");
      setSaved(true);
      setTimeout(() => {
        router.push("/seller/listings");
      }, 1200);
    } catch {
      setError("Unable to save right now. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (
      !window.confirm(
        "Are you sure you want to delete this listing? This action will remove it from public listings."
      )
    )
      return;
    setDeleting(true);
    setError("");
    try {
      const response = await fetch(`/api/seller/vehicles/${vehicle.id}`, {
        method: "DELETE",
      });
      if (!response.ok) {
        const data = (await response.json()) as { message?: string };
        setError(data.message ?? "Failed to delete vehicle.");
        return;
      }
      router.push("/seller/listings");
    } catch {
      setError("Unable to delete right now. Please try again.");
    } finally {
      setDeleting(false);
    }
  };

  if (saved) {
    return (
      <main className="flex min-h-[calc(100dvh-80px)] flex-col items-center justify-center px-4 py-10 text-center">
        <CheckCircle2 className="h-16 w-16 text-emerald-500" />
        <h1 className="mt-4 text-xl font-semibold text-slate-900">Changes Saved!</h1>
        <p className="mt-2 text-sm text-slate-500">{successMessage || "Redirecting to your listings…"}</p>
      </main>
    );
  }

  return (
    <main className="space-y-6 px-4 pb-8 pt-4">
      <div className="flex items-center gap-3">
        <Link href="/seller/dashboard" className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-slate-200">
          <ArrowLeft className="h-4 w-4 text-slate-700" />
        </Link>
        <h1 className="text-xl font-semibold text-slate-900">Edit Listing</h1>
      </div>

      <p className="text-sm text-slate-500">{vehicle.id}</p>

      <div className="space-y-4">
        <div className="space-y-1">
          <label className="text-sm font-medium text-slate-700">Title</label>
          <input
            type="text"
            value={form.title}
            onChange={(e) => set("title")(e.target.value)}
            className="min-h-12 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm text-slate-800 outline-none"
          />
        </div>

        <div className="space-y-1">
          <label className="text-sm font-medium text-slate-700">Expected Price (₹)</label>
          <input
            type="tel"
            inputMode="numeric"
            value={form.price}
            onChange={(e) => set("price")(e.target.value.replace(/\D/g, ""))}
            className="min-h-12 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm text-slate-800 outline-none"
          />
        </div>

        <div className="space-y-1">
          <label className="text-sm font-medium text-slate-700">Yard Location</label>
          <input
            type="text"
            value={form.yardLocation}
            onChange={(e) => set("yardLocation")(e.target.value)}
            className="min-h-12 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm text-slate-800 outline-none"
          />
        </div>

        <div className="space-y-1">
          <label className="text-sm font-medium text-slate-700">Auction Date</label>
          <input
            type="date"
            value={form.auctionDate}
            onChange={(e) => set("auctionDate")(e.target.value)}
            className="min-h-12 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm text-slate-800 outline-none"
          />
        </div>

        <div className="space-y-1">
          <label className="text-sm font-medium text-slate-700">Condition Notes</label>
          <textarea
            value={form.conditionNotes}
            onChange={(e) => set("conditionNotes")(e.target.value)}
            rows={3}
            className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800 outline-none"
          />
        </div>
      </div>

      {error ? <p className="text-center text-sm text-red-600">{error}</p> : null}

      <div className="space-y-3">
        <button
          onClick={handleSave}
          disabled={saving || deleting}
          className="inline-flex min-h-12 w-full items-center justify-center rounded-xl bg-slate-900 text-sm font-semibold text-white disabled:opacity-50"
        >
          {saving ? "Saving…" : "Save Changes"}
        </button>

        <button
          onClick={handleDelete}
          disabled={saving || deleting}
          className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl border border-rose-200 bg-rose-50 text-sm font-semibold text-rose-700 disabled:opacity-50"
        >
          <Trash2 className="h-4 w-4" />
          {deleting ? "Deleting…" : "Delete Listing"}
        </button>
      </div>
    </main>
  );
}
