"use client";

import Link from "next/link";
import { useState } from "react";
import type { DbFeatureCoupon } from "@/lib/schema";

interface FeatureCouponsClientProps {
  initialCoupons: DbFeatureCoupon[];
}

interface FeatureCouponUsageRow {
  id: number;
  couponId: number;
  couponCode: string | null;
  sellerId: number;
  sellerName: string | null;
  sellerPhone: string | null;
  vehicleId: string;
  vehicleTitle: string | null;
  usedAt: string | Date;
}

function formatDate(value: Date | string | null | undefined): string {
  if (!value) return "No Expiry";
  return new Date(value).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function formatDateTime(value: Date | string | null | undefined): string {
  if (!value) return "—";
  return new Date(value).toLocaleString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function toDateInputValue(value: Date | string | null | undefined): string {
  if (!value) return "";
  return new Date(value).toISOString().slice(0, 10);
}

function isExpired(value: Date | string | null | undefined) {
  return Boolean(value && new Date(value).getTime() < Date.now());
}

const EMPTY_FORM = {
  code: "",
  description: "",
  isActive: true,
  maxUses: "",
  expiresAt: "",
  durationDays: "30",
};

type CouponFormState = typeof EMPTY_FORM;

type EditFormState = {
  code: string;
  description: string;
  isActive: boolean;
  maxUses: string;
  expiresAt: string;
  durationDays: string;
};

export default function FeatureCouponsClient({ initialCoupons }: FeatureCouponsClientProps) {
  const [coupons, setCoupons] = useState<DbFeatureCoupon[]>(initialCoupons);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState<CouponFormState>(EMPTY_FORM);
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState("");
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editForm, setEditForm] = useState<EditFormState>({
    code: "",
    description: "",
    isActive: true,
    maxUses: "",
    expiresAt: "",
    durationDays: "30",
  });
  const [savingId, setSavingId] = useState<number | null>(null);
  const [saveError, setSaveError] = useState<Record<number, string>>({});
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null);
  const [expandedUsage, setExpandedUsage] = useState<Record<number, boolean>>({});
  const [usageRows, setUsageRows] = useState<Record<number, FeatureCouponUsageRow[]>>({});
  const [usageLoadingId, setUsageLoadingId] = useState<number | null>(null);
  const [usageError, setUsageError] = useState<Record<number, string>>({});

  const resetCreateForm = () => {
    setForm(EMPTY_FORM);
    setCreateError("");
  };

  const handleCreate = async () => {
    setCreateError("");
    if (!form.code.trim()) {
      setCreateError("Coupon code is required.");
      return;
    }

    if (!form.durationDays.trim()) {
      setCreateError("Duration days is required.");
      return;
    }

    setCreating(true);
    try {
      const response = await fetch("/api/admin/feature-coupons", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code: form.code.trim(),
          description: form.description.trim() || undefined,
          isActive: form.isActive,
          maxUses: form.maxUses ? Number.parseInt(form.maxUses, 10) : null,
          expiresAt: form.expiresAt || null,
          durationDays: Number.parseInt(form.durationDays, 10),
        }),
      });
      const data = (await response.json()) as DbFeatureCoupon & { message?: string };
      if (!response.ok) {
        setCreateError(data.message ?? "Failed to create coupon.");
        return;
      }
      setCoupons((prev) => [data, ...prev]);
      setShowCreate(false);
      resetCreateForm();
    } catch {
      setCreateError("Network error. Please try again.");
    } finally {
      setCreating(false);
    }
  };

  const startEdit = (coupon: DbFeatureCoupon) => {
    setEditingId(coupon.id);
    setEditForm({
      code: coupon.code,
      description: coupon.description ?? "",
      isActive: coupon.isActive,
      maxUses: coupon.maxUses !== null ? String(coupon.maxUses) : "",
      expiresAt: toDateInputValue(coupon.expiresAt),
      durationDays: String(coupon.durationDays),
    });
    setSaveError((prev) => ({ ...prev, [coupon.id]: "" }));
  };

  const handleSave = async (coupon: DbFeatureCoupon) => {
    setSavingId(coupon.id);
    setSaveError((prev) => ({ ...prev, [coupon.id]: "" }));
    try {
      const response = await fetch(`/api/admin/feature-coupons/${coupon.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code: editForm.code.trim(),
          description: editForm.description.trim() || null,
          isActive: editForm.isActive,
          maxUses: editForm.maxUses ? Number.parseInt(editForm.maxUses, 10) : null,
          expiresAt: editForm.expiresAt || null,
          durationDays: Number.parseInt(editForm.durationDays, 10),
        }),
      });
      const data = (await response.json()) as DbFeatureCoupon & { message?: string };
      if (!response.ok) {
        setSaveError((prev) => ({ ...prev, [coupon.id]: data.message ?? "Failed to save coupon." }));
        return;
      }
      setCoupons((prev) => prev.map((entry) => (entry.id === coupon.id ? data : entry)));
      setEditingId(null);
    } catch {
      setSaveError((prev) => ({ ...prev, [coupon.id]: "Network error. Please try again." }));
    } finally {
      setSavingId(null);
    }
  };

  const handleToggleActive = async (coupon: DbFeatureCoupon) => {
    setSavingId(coupon.id);
    setSaveError((prev) => ({ ...prev, [coupon.id]: "" }));
    try {
      const response = await fetch(`/api/admin/feature-coupons/${coupon.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !coupon.isActive }),
      });
      const data = (await response.json()) as DbFeatureCoupon & { message?: string };
      if (!response.ok) {
        setSaveError((prev) => ({ ...prev, [coupon.id]: data.message ?? "Failed to update coupon." }));
        return;
      }
      setCoupons((prev) => prev.map((entry) => (entry.id === coupon.id ? data : entry)));
    } catch {
      setSaveError((prev) => ({ ...prev, [coupon.id]: "Network error. Please try again." }));
    } finally {
      setSavingId(null);
    }
  };

  const handleDelete = async (couponId: number) => {
    setDeletingId(couponId);
    setSaveError((prev) => ({ ...prev, [couponId]: "" }));
    try {
      const response = await fetch(`/api/admin/feature-coupons/${couponId}`, { method: "DELETE" });
      const data = (await response.json().catch(() => null)) as { message?: string } | null;
      if (!response.ok) {
        setSaveError((prev) => ({ ...prev, [couponId]: data?.message ?? "Failed to delete coupon." }));
        return;
      }
      setCoupons((prev) => prev.filter((coupon) => coupon.id !== couponId));
      setConfirmDeleteId(null);
    } catch {
      setSaveError((prev) => ({ ...prev, [couponId]: "Network error. Please try again." }));
    } finally {
      setDeletingId(null);
    }
  };

  const toggleUsage = async (couponId: number) => {
    const isOpen = expandedUsage[couponId] ?? false;
    if (isOpen) {
      setExpandedUsage((prev) => ({ ...prev, [couponId]: false }));
      return;
    }

    setExpandedUsage((prev) => ({ ...prev, [couponId]: true }));
    if (usageRows[couponId] || usageLoadingId === couponId) {
      return;
    }

    setUsageLoadingId(couponId);
    setUsageError((prev) => ({ ...prev, [couponId]: "" }));
    try {
      const response = await fetch(`/api/admin/feature-coupons/${couponId}/usage`);
      const data = (await response.json()) as FeatureCouponUsageRow[] | { message?: string };
      if (!response.ok) {
        const message = "message" in data ? data.message : "Failed to load coupon usage.";
        setUsageError((prev) => ({ ...prev, [couponId]: message ?? "Failed to load coupon usage." }));
        return;
      }
      setUsageRows((prev) => ({ ...prev, [couponId]: data as FeatureCouponUsageRow[] }));
    } catch {
      setUsageError((prev) => ({ ...prev, [couponId]: "Network error. Please try again." }));
    } finally {
      setUsageLoadingId(null);
    }
  };

  return (
    <main className="space-y-6 px-4 pb-8 pt-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Feature Coupons</h1>
          <p className="text-sm text-slate-500">Create, edit, disable, and review featured listing coupon usage.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => {
              setShowCreate((value) => !value);
              if (showCreate) {
                resetCreateForm();
              }
            }}
            className="inline-flex min-h-10 items-center rounded-lg bg-amber-500 px-4 text-sm font-semibold text-white hover:bg-amber-600"
          >
            {showCreate ? "Close" : "+ New Coupon"}
          </button>
          <Link
            href="/admin/settings"
            className="inline-flex min-h-10 items-center rounded-lg border border-slate-200 px-3 text-xs font-medium text-slate-700"
          >
            Settings
          </Link>
          <Link
            href="/admin/dashboard"
            className="inline-flex min-h-10 items-center rounded-lg border border-slate-200 px-3 text-xs font-medium text-slate-700"
          >
            ← Dashboard
          </Link>
        </div>
      </div>

      {showCreate ? (
        <section className="rounded-2xl border border-amber-200 bg-amber-50 p-5 shadow-sm">
          <h2 className="mb-4 text-sm font-semibold text-slate-900">Create Feature Coupon</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-700">
                Coupon Code <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={form.code}
                onChange={(event) =>
                  setForm((prev) => ({
                    ...prev,
                    code: event.target.value.toUpperCase().replace(/\s+/g, ""),
                  }))
                }
                placeholder="NEWRMFREE"
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm uppercase focus:border-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-100"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-700">Description</label>
              <input
                type="text"
                value={form.description}
                onChange={(event) => setForm((prev) => ({ ...prev, description: event.target.value }))}
                placeholder="New RepoMandi free featured listing coupon"
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm focus:border-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-100"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-700">
                Duration Days <span className="text-rose-500">*</span>
              </label>
              <input
                type="number"
                min={1}
                value={form.durationDays}
                onChange={(event) => setForm((prev) => ({ ...prev, durationDays: event.target.value }))}
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm focus:border-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-100"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-700">Max Uses</label>
              <input
                type="number"
                min={1}
                value={form.maxUses}
                onChange={(event) => setForm((prev) => ({ ...prev, maxUses: event.target.value }))}
                placeholder="100"
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm focus:border-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-100"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-700">Expiry Date</label>
              <input
                type="date"
                value={form.expiresAt}
                onChange={(event) => setForm((prev) => ({ ...prev, expiresAt: event.target.value }))}
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm focus:border-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-100"
              />
            </div>
            <div className="flex items-center gap-3">
              <label className="text-xs font-medium text-slate-700">Active</label>
              <button
                type="button"
                onClick={() => setForm((prev) => ({ ...prev, isActive: !prev.isActive }))}
                aria-pressed={form.isActive}
                className={`relative inline-flex h-6 w-11 rounded-full transition-colors ${
                  form.isActive ? "bg-emerald-600" : "bg-slate-300"
                }`}
              >
                <span
                  className={`inline-block h-5 w-5 translate-y-0.5 rounded-full bg-white shadow transition ${
                    form.isActive ? "translate-x-5" : "translate-x-0.5"
                  }`}
                />
              </button>
            </div>
          </div>
          {createError ? (
            <p className="mt-3 text-sm text-rose-600" role="alert">
              {createError}
            </p>
          ) : null}
          <div className="mt-4 flex gap-2">
            <button
              type="button"
              onClick={() => void handleCreate()}
              disabled={creating}
              className="inline-flex min-h-10 items-center rounded-xl bg-slate-900 px-5 text-sm font-semibold text-white disabled:opacity-50"
            >
              {creating ? "Creating…" : "Create Coupon"}
            </button>
            <button
              type="button"
              onClick={() => {
                setShowCreate(false);
                resetCreateForm();
              }}
              disabled={creating}
              className="inline-flex min-h-10 items-center rounded-xl border border-slate-200 bg-white px-4 text-sm font-medium text-slate-700 disabled:opacity-50"
            >
              Cancel
            </button>
          </div>
        </section>
      ) : null}

      {coupons.length === 0 ? (
        <p className="rounded-2xl border border-slate-100 bg-white p-6 text-center text-sm text-slate-500">
          No feature coupons yet.
        </p>
      ) : (
        <div className="space-y-4">
          {coupons.map((coupon) => {
            const isEditing = editingId === coupon.id;
            const isSaving = savingId === coupon.id;
            const isDeleting = deletingId === coupon.id;
            const canDelete = coupon.usedCount === 0;
            const codeLocked = coupon.usedCount > 0;
            const couponUsageRows = usageRows[coupon.id] ?? [];

            return (
              <article key={coupon.id} className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-base font-bold text-slate-900">{coupon.code}</span>
                      <span
                        className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                          coupon.isActive ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-500"
                        }`}
                      >
                        {coupon.isActive ? "Active" : "Disabled"}
                      </span>
                      {isExpired(coupon.expiresAt) ? (
                        <span className="inline-flex rounded-full bg-rose-50 px-2 py-0.5 text-xs font-medium text-rose-700">
                          Expired
                        </span>
                      ) : null}
                    </div>
                    <p className="text-sm text-slate-600">{coupon.description ?? "No description"}</p>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {!isEditing ? (
                      <button
                        type="button"
                        onClick={() => startEdit(coupon)}
                        disabled={isSaving || isDeleting}
                        className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-700 disabled:opacity-50"
                      >
                        Edit
                      </button>
                    ) : null}
                    <button
                      type="button"
                      onClick={() => void handleToggleActive(coupon)}
                      disabled={isSaving || isDeleting}
                      className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-700 disabled:opacity-50"
                    >
                      {coupon.isActive ? "Disable" : "Enable"}
                    </button>
                    <button
                      type="button"
                      onClick={() => void toggleUsage(coupon.id)}
                      disabled={usageLoadingId === coupon.id}
                      className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-700 disabled:opacity-50"
                    >
                      {expandedUsage[coupon.id] ? "Hide Usage" : "View Usage"}
                    </button>
                    {confirmDeleteId === coupon.id ? (
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => void handleDelete(coupon.id)}
                          disabled={isDeleting}
                          className="rounded-lg bg-rose-600 px-3 py-2 text-xs font-semibold text-white disabled:opacity-50"
                        >
                          {isDeleting ? "Deleting…" : "Confirm Delete"}
                        </button>
                        <button
                          type="button"
                          onClick={() => setConfirmDeleteId(null)}
                          disabled={isDeleting}
                          className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-medium text-slate-600 disabled:opacity-50"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setConfirmDeleteId(coupon.id)}
                        disabled={!canDelete || isSaving || isDeleting}
                        className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-medium text-rose-700 disabled:cursor-not-allowed disabled:opacity-50"
                        title={canDelete ? "Delete coupon" : "Only unused coupons can be deleted"}
                      >
                        Delete
                      </button>
                    )}
                  </div>
                </div>

                <div className="mt-4 grid gap-3 text-sm text-slate-600 sm:grid-cols-3 lg:grid-cols-6">
                  <div>
                    <p className="text-xs uppercase tracking-wide text-slate-400">Used Count</p>
                    <p className="font-medium text-slate-800">
                      {coupon.usedCount} / {coupon.maxUses ?? "∞"}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-wide text-slate-400">Max Uses</p>
                    <p className="font-medium text-slate-800">{coupon.maxUses ?? "Unlimited"}</p>
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-wide text-slate-400">Duration</p>
                    <p className="font-medium text-slate-800">{coupon.durationDays} Days</p>
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-wide text-slate-400">Expires At</p>
                    <p className="font-medium text-slate-800">{formatDate(coupon.expiresAt)}</p>
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-wide text-slate-400">Created</p>
                    <p className="font-medium text-slate-800">{formatDate(coupon.createdAt)}</p>
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-wide text-slate-400">Actions</p>
                    <p className="font-medium text-slate-800">{canDelete ? "Edit / Enable / Delete" : "Edit / Enable"}</p>
                  </div>
                </div>

                {saveError[coupon.id] ? (
                  <p className="mt-3 text-sm text-rose-600" role="alert">
                    {saveError[coupon.id]}
                  </p>
                ) : null}

                {isEditing ? (
                  <div className="mt-4 space-y-3 border-t border-slate-100 pt-4">
                    <div className="grid gap-3 sm:grid-cols-2">
                      <div>
                        <label className="mb-1 block text-xs font-medium text-slate-700">Coupon Code</label>
                        <input
                          type="text"
                          value={editForm.code}
                          onChange={(event) =>
                            setEditForm((prev) => ({
                              ...prev,
                              code: event.target.value.toUpperCase().replace(/\s+/g, ""),
                            }))
                          }
                          disabled={codeLocked}
                          className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm uppercase disabled:bg-slate-50 disabled:text-slate-400"
                        />
                        <p className="mt-1 text-xs text-slate-400">
                          {codeLocked ? "Code cannot be changed after the coupon is used." : "Uppercase only, no spaces."}
                        </p>
                      </div>
                      <div>
                        <label className="mb-1 block text-xs font-medium text-slate-700">Description</label>
                        <input
                          type="text"
                          value={editForm.description}
                          onChange={(event) => setEditForm((prev) => ({ ...prev, description: event.target.value }))}
                          className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                        />
                      </div>
                      <div>
                        <label className="mb-1 block text-xs font-medium text-slate-700">Duration Days</label>
                        <input
                          type="number"
                          min={1}
                          value={editForm.durationDays}
                          onChange={(event) => setEditForm((prev) => ({ ...prev, durationDays: event.target.value }))}
                          className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                        />
                      </div>
                      <div>
                        <label className="mb-1 block text-xs font-medium text-slate-700">Max Uses</label>
                        <input
                          type="number"
                          min={1}
                          value={editForm.maxUses}
                          onChange={(event) => setEditForm((prev) => ({ ...prev, maxUses: event.target.value }))}
                          className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                        />
                      </div>
                      <div>
                        <label className="mb-1 block text-xs font-medium text-slate-700">Expiry Date</label>
                        <input
                          type="date"
                          value={editForm.expiresAt}
                          onChange={(event) => setEditForm((prev) => ({ ...prev, expiresAt: event.target.value }))}
                          className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                        />
                      </div>
                      <div className="flex items-center gap-3">
                        <label className="text-xs font-medium text-slate-700">Active</label>
                        <button
                          type="button"
                          onClick={() => setEditForm((prev) => ({ ...prev, isActive: !prev.isActive }))}
                          aria-pressed={editForm.isActive}
                          className={`relative inline-flex h-6 w-11 rounded-full transition-colors ${
                            editForm.isActive ? "bg-emerald-600" : "bg-slate-300"
                          }`}
                        >
                          <span
                            className={`inline-block h-5 w-5 translate-y-0.5 rounded-full bg-white shadow transition ${
                              editForm.isActive ? "translate-x-5" : "translate-x-0.5"
                            }`}
                          />
                        </button>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => void handleSave(coupon)}
                        disabled={isSaving}
                        className="inline-flex min-h-9 items-center rounded-xl bg-slate-900 px-4 text-sm font-semibold text-white disabled:opacity-50"
                      >
                        {isSaving ? "Saving…" : "Save Changes"}
                      </button>
                      <button
                        type="button"
                        onClick={() => setEditingId(null)}
                        disabled={isSaving}
                        className="inline-flex min-h-9 items-center rounded-xl border border-slate-200 bg-white px-4 text-sm font-medium text-slate-700 disabled:opacity-50"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : null}

                {expandedUsage[coupon.id] ? (
                  <div className="mt-4 border-t border-slate-100 pt-4">
                    <h3 className="text-sm font-semibold text-slate-900">Usage History</h3>
                    {usageLoadingId === coupon.id ? (
                      <p className="mt-2 text-sm text-slate-500">Loading usage…</p>
                    ) : usageError[coupon.id] ? (
                      <p className="mt-2 text-sm text-rose-600">{usageError[coupon.id]}</p>
                    ) : couponUsageRows.length === 0 ? (
                      <p className="mt-2 text-sm text-slate-500">No usage recorded yet.</p>
                    ) : (
                      <div className="mt-3 space-y-2">
                        {couponUsageRows.map((usage) => (
                          <div
                            key={usage.id}
                            className="rounded-xl border border-slate-100 bg-slate-50 px-3 py-3 text-sm text-slate-600"
                          >
                            <div className="flex flex-wrap items-center justify-between gap-2">
                              <p className="font-medium text-slate-900">
                                {usage.couponCode ?? coupon.code} • {usage.sellerName || usage.sellerPhone || `Seller #${usage.sellerId}`}
                              </p>
                              <span className="text-xs text-slate-500">{formatDateTime(usage.usedAt)}</span>
                            </div>
                            <p className="mt-1 text-sm text-slate-600">
                              Vehicle:{" "}
                              <Link
                                href={`/vehicles/${usage.vehicleId}`}
                                className="font-medium text-slate-900 underline underline-offset-2"
                              >
                                {usage.vehicleTitle || usage.vehicleId}
                              </Link>
                            </p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ) : null}
              </article>
            );
          })}
        </div>
      )}
    </main>
  );
}
