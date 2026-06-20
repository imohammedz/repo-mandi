"use client";

import { useState } from "react";
import type { DbFeatureCoupon } from "@/lib/schema";

interface AdminCouponsClientProps {
  initialCoupons: DbFeatureCoupon[];
}

function formatDate(value: Date | string | null | undefined): string {
  if (!value) return "—";
  return new Date(value).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function toDateInputValue(value: Date | string | null | undefined): string {
  if (!value) return "";
  return new Date(value).toISOString().slice(0, 10);
}

const EMPTY_FORM = {
  code: "",
  description: "",
  isActive: true,
  maxUses: "",
  expiresAt: "",
  perSellerLimit: "",
  perListingLimit: "",
};

type CouponFormState = typeof EMPTY_FORM;

type EditFormState = {
  description: string;
  isActive: boolean;
  maxUses: string;
  expiresAt: string;
  perSellerLimit: string;
  perListingLimit: string;
};

export default function AdminCouponsClient({ initialCoupons }: AdminCouponsClientProps) {
  const [coupons, setCoupons] = useState<DbFeatureCoupon[]>(initialCoupons);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState<CouponFormState>(EMPTY_FORM);
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState("");

  const [editingId, setEditingId] = useState<number | null>(null);
  const [editForm, setEditForm] = useState<EditFormState>({
    description: "",
    isActive: true,
    maxUses: "",
    expiresAt: "",
    perSellerLimit: "",
    perListingLimit: "",
  });
  const [saving, setSaving] = useState<number | null>(null);
  const [saveError, setSaveError] = useState<Record<number, string>>({});

  const [deleting, setDeleting] = useState<number | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null);

  const handleCreate = async () => {
    setCreateError("");
    if (!form.code.trim()) {
      setCreateError("Coupon code is required.");
      return;
    }
    setCreating(true);
    try {
      const response = await fetch("/api/admin/coupons", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code: form.code.trim(),
          description: form.description.trim() || undefined,
          isActive: form.isActive,
          maxUses: form.maxUses ? parseInt(form.maxUses, 10) : null,
          expiresAt: form.expiresAt || null,
          perSellerLimit: form.perSellerLimit ? parseInt(form.perSellerLimit, 10) : null,
          perListingLimit: form.perListingLimit ? parseInt(form.perListingLimit, 10) : null,
        }),
      });
      const data = (await response.json()) as DbFeatureCoupon & { message?: string };
      if (!response.ok) {
        setCreateError(data.message ?? "Failed to create coupon.");
        return;
      }
      setCoupons((prev) => [data, ...prev]);
      setForm(EMPTY_FORM);
      setShowCreate(false);
    } catch {
      setCreateError("Network error. Please try again.");
    } finally {
      setCreating(false);
    }
  };

  const startEdit = (coupon: DbFeatureCoupon) => {
    setEditingId(coupon.id);
    setEditForm({
      description: coupon.description ?? "",
      isActive: coupon.isActive,
      maxUses: coupon.maxUses !== null ? String(coupon.maxUses) : "",
      expiresAt: toDateInputValue(coupon.expiresAt),
      perSellerLimit: coupon.perSellerLimit !== null ? String(coupon.perSellerLimit) : "",
      perListingLimit: coupon.perListingLimit !== null ? String(coupon.perListingLimit) : "",
    });
    setSaveError((prev) => ({ ...prev, [coupon.id]: "" }));
  };

  const handleSave = async (id: number) => {
    setSaving(id);
    setSaveError((prev) => ({ ...prev, [id]: "" }));
    try {
      const response = await fetch(`/api/admin/coupons/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          description: editForm.description.trim() || null,
          isActive: editForm.isActive,
          maxUses: editForm.maxUses ? parseInt(editForm.maxUses, 10) : null,
          expiresAt: editForm.expiresAt || null,
          perSellerLimit: editForm.perSellerLimit ? parseInt(editForm.perSellerLimit, 10) : null,
          perListingLimit: editForm.perListingLimit ? parseInt(editForm.perListingLimit, 10) : null,
        }),
      });
      const data = (await response.json()) as DbFeatureCoupon & { message?: string };
      if (!response.ok) {
        setSaveError((prev) => ({ ...prev, [id]: data.message ?? "Failed to save." }));
        return;
      }
      setCoupons((prev) => prev.map((c) => (c.id === id ? data : c)));
      setEditingId(null);
    } catch {
      setSaveError((prev) => ({ ...prev, [id]: "Network error. Please try again." }));
    } finally {
      setSaving(null);
    }
  };

  const handleToggleActive = async (coupon: DbFeatureCoupon) => {
    setSaving(coupon.id);
    try {
      const response = await fetch(`/api/admin/coupons/${coupon.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !coupon.isActive }),
      });
      const data = (await response.json()) as DbFeatureCoupon & { message?: string };
      if (response.ok) {
        setCoupons((prev) => prev.map((c) => (c.id === coupon.id ? data : c)));
      }
    } finally {
      setSaving(null);
    }
  };

  const handleDelete = async (id: number) => {
    setDeleting(id);
    try {
      const response = await fetch(`/api/admin/coupons/${id}`, { method: "DELETE" });
      if (response.ok) {
        setCoupons((prev) => prev.filter((c) => c.id !== id));
      }
    } finally {
      setDeleting(null);
      setConfirmDeleteId(null);
    }
  };

  return (
    <main className="space-y-6 px-4 pb-8 pt-4">
      {/* Header */}
      <div className="flex items-center justify-between gap-2">
        <h1 className="text-2xl font-semibold text-slate-900">Feature Coupons</h1>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => { setShowCreate((v) => !v); setCreateError(""); }}
            className="inline-flex min-h-10 items-center rounded-lg bg-amber-500 px-4 text-sm font-semibold text-white hover:bg-amber-600"
          >
            + New Coupon
          </button>
          <a
            href="/admin/dashboard"
            className="inline-flex min-h-10 items-center rounded-lg border border-slate-200 px-3 text-xs font-medium text-slate-700"
          >
            ← Dashboard
          </a>
        </div>
      </div>

      {/* Create form */}
      {showCreate ? (
        <section className="rounded-2xl border border-amber-200 bg-amber-50 p-5 shadow-sm">
          <h2 className="mb-4 text-sm font-semibold text-slate-900">Create New Coupon</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-700">
                Code <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={form.code}
                onChange={(e) => setForm((f) => ({ ...f, code: e.target.value.toUpperCase() }))}
                placeholder="NEWRMFREE"
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm uppercase focus:border-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-100"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-700">Description</label>
              <input
                type="text"
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                placeholder="Free featured listing coupon"
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm focus:border-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-100"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-700">Max Uses (blank = unlimited)</label>
              <input
                type="number"
                min={1}
                value={form.maxUses}
                onChange={(e) => setForm((f) => ({ ...f, maxUses: e.target.value }))}
                placeholder="100"
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm focus:border-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-100"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-700">Expires At (blank = no expiry)</label>
              <input
                type="date"
                value={form.expiresAt}
                onChange={(e) => setForm((f) => ({ ...f, expiresAt: e.target.value }))}
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm focus:border-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-100"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-700">Per-Seller Limit (blank = unlimited)</label>
              <input
                type="number"
                min={1}
                value={form.perSellerLimit}
                onChange={(e) => setForm((f) => ({ ...f, perSellerLimit: e.target.value }))}
                placeholder="1"
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm focus:border-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-100"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-700">Per-Listing Limit (blank = 1)</label>
              <input
                type="number"
                min={1}
                value={form.perListingLimit}
                onChange={(e) => setForm((f) => ({ ...f, perListingLimit: e.target.value }))}
                placeholder="1"
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm focus:border-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-100"
              />
            </div>
            <div className="flex items-center gap-3 sm:col-span-2">
              <label className="text-xs font-medium text-slate-700">Active</label>
              <button
                type="button"
                onClick={() => setForm((f) => ({ ...f, isActive: !f.isActive }))}
                aria-pressed={form.isActive}
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 focus:outline-none ${
                  form.isActive ? "bg-emerald-600" : "bg-slate-200"
                }`}
              >
                <span
                  className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition duration-200 ${
                    form.isActive ? "translate-x-5" : "translate-x-0"
                  }`}
                />
              </button>
            </div>
          </div>
          {createError ? (
            <p className="mt-3 text-sm text-rose-600" role="alert">{createError}</p>
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
              onClick={() => { setShowCreate(false); setCreateError(""); setForm(EMPTY_FORM); }}
              disabled={creating}
              className="inline-flex min-h-10 items-center rounded-xl border border-slate-200 bg-white px-4 text-sm font-medium text-slate-700 disabled:opacity-50"
            >
              Cancel
            </button>
          </div>
        </section>
      ) : null}

      {/* Coupons list */}
      {coupons.length === 0 ? (
        <p className="rounded-2xl border border-slate-100 bg-white p-6 text-center text-sm text-slate-500">
          No coupons yet. Click <strong>+ New Coupon</strong> to create one.
        </p>
      ) : (
        <div className="space-y-3">
          {coupons.map((coupon) => {
            const isEditing = editingId === coupon.id;
            const isSaving = saving === coupon.id;
            const isDeleting = deleting === coupon.id;
            const error = saveError[coupon.id];

            return (
              <article
                key={coupon.id}
                className={`rounded-2xl border bg-white p-4 shadow-sm ${
                  coupon.isActive ? "border-slate-100" : "border-slate-200 opacity-70"
                }`}
              >
                {/* Top row: code + status + actions */}
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-base font-bold text-slate-900">{coupon.code}</span>
                      <span
                        className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                          coupon.isActive
                            ? "bg-emerald-50 text-emerald-700"
                            : "bg-slate-100 text-slate-500"
                        }`}
                      >
                        {coupon.isActive ? "Active" : "Inactive"}
                      </span>
                    </div>
                    {coupon.description ? (
                      <p className="mt-0.5 text-xs text-slate-500">{coupon.description}</p>
                    ) : null}
                  </div>

                  <div className="flex shrink-0 items-center gap-1.5">
                    {/* Toggle active */}
                    <button
                      type="button"
                      onClick={() => void handleToggleActive(coupon)}
                      disabled={isSaving || isDeleting}
                      title={coupon.isActive ? "Deactivate" : "Activate"}
                      aria-label={`${coupon.isActive ? "Deactivate" : "Activate"} coupon ${coupon.code}`}
                      aria-pressed={coupon.isActive}
                      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 focus:outline-none disabled:opacity-50 ${
                        coupon.isActive ? "bg-emerald-600" : "bg-slate-200"
                      }`}
                    >
                      <span
                        className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition duration-200 ${
                          coupon.isActive ? "translate-x-5" : "translate-x-0"
                        }`}
                      />
                    </button>

                    {/* Edit */}
                    {!isEditing ? (
                      <button
                        type="button"
                        onClick={() => startEdit(coupon)}
                        disabled={isSaving || isDeleting}
                        className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                      >
                        Edit
                      </button>
                    ) : null}

                    {/* Delete */}
                    {confirmDeleteId === coupon.id ? (
                      <div className="flex items-center gap-1">
                        <span className="text-xs text-rose-600">Sure?</span>
                        <button
                          type="button"
                          onClick={() => void handleDelete(coupon.id)}
                          disabled={isDeleting}
                          className="rounded-lg bg-rose-600 px-2.5 py-1.5 text-xs font-semibold text-white disabled:opacity-50"
                        >
                          {isDeleting ? "…" : "Yes"}
                        </button>
                        <button
                          type="button"
                          onClick={() => setConfirmDeleteId(null)}
                          disabled={isDeleting}
                          className="rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs font-medium text-slate-600 disabled:opacity-50"
                        >
                          No
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setConfirmDeleteId(coupon.id)}
                        disabled={isSaving || isDeleting}
                        className="rounded-lg border border-rose-200 bg-rose-50 px-2.5 py-1.5 text-xs font-medium text-rose-700 hover:bg-rose-100 disabled:opacity-50"
                      >
                        Delete
                      </button>
                    )}
                  </div>
                </div>

                {/* Stats row */}
                <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500">
                  <span>
                    <span className="font-medium text-slate-700">{coupon.usedCount}</span>
                    {coupon.maxUses !== null ? ` / ${coupon.maxUses}` : ""} uses
                  </span>
                  <span>Expires: {formatDate(coupon.expiresAt)}</span>
                  <span>Per-seller limit: {coupon.perSellerLimit ?? "—"}</span>
                  <span>Created: {formatDate(coupon.createdAt)}</span>
                </div>

                {/* Edit form */}
                {isEditing ? (
                  <div className="mt-4 space-y-3 border-t border-slate-100 pt-4">
                    <div className="grid gap-3 sm:grid-cols-2">
                      <div>
                        <label className="mb-1 block text-xs font-medium text-slate-700">Description</label>
                        <input
                          type="text"
                          value={editForm.description}
                          onChange={(e) => setEditForm((f) => ({ ...f, description: e.target.value }))}
                          placeholder="Description"
                          className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-100"
                        />
                      </div>
                      <div>
                        <label className="mb-1 block text-xs font-medium text-slate-700">Max Uses (blank = unlimited)</label>
                        <input
                          type="number"
                          min={1}
                          value={editForm.maxUses}
                          onChange={(e) => setEditForm((f) => ({ ...f, maxUses: e.target.value }))}
                          placeholder="100"
                          className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-100"
                        />
                      </div>
                      <div>
                        <label className="mb-1 block text-xs font-medium text-slate-700">Expires At</label>
                        <input
                          type="date"
                          value={editForm.expiresAt}
                          onChange={(e) => setEditForm((f) => ({ ...f, expiresAt: e.target.value }))}
                          className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-100"
                        />
                      </div>
                      <div>
                        <label className="mb-1 block text-xs font-medium text-slate-700">Per-Seller Limit (blank = unlimited)</label>
                        <input
                          type="number"
                          min={1}
                          value={editForm.perSellerLimit}
                          onChange={(e) => setEditForm((f) => ({ ...f, perSellerLimit: e.target.value }))}
                          placeholder="1"
                          className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-100"
                        />
                      </div>
                      <div className="flex items-center gap-3 sm:col-span-2">
                        <label className="text-xs font-medium text-slate-700">Active</label>
                        <button
                          type="button"
                          onClick={() => setEditForm((f) => ({ ...f, isActive: !f.isActive }))}
                          aria-pressed={editForm.isActive}
                          className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 focus:outline-none ${
                            editForm.isActive ? "bg-emerald-600" : "bg-slate-200"
                          }`}
                        >
                          <span
                            className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition duration-200 ${
                              editForm.isActive ? "translate-x-5" : "translate-x-0"
                            }`}
                          />
                        </button>
                      </div>
                    </div>
                    {error ? (
                      <p className="text-sm text-rose-600" role="alert">{error}</p>
                    ) : null}
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => void handleSave(coupon.id)}
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
              </article>
            );
          })}
        </div>
      )}
    </main>
  );
}


interface AdminCouponsClientProps {
  initialCoupons: DbFeatureCoupon[];
}

function formatDate(value: Date | string | null | undefined): string {
  if (!value) return "—";
  return new Date(value).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function toDateInputValue(value: Date | string | null | undefined): string {
  if (!value) return "";
  return new Date(value).toISOString().slice(0, 10);
}

const EMPTY_FORM = {
  code: "",
  description: "",
  isActive: true,
  maxUses: "",
  expiresAt: "",
  perSellerLimit: "",
  perListingLimit: "",
};

type CouponFormState = typeof EMPTY_FORM;

export default function AdminCouponsClient({ initialCoupons }: AdminCouponsClientProps) {
  const [coupons, setCoupons] = useState<DbFeatureCoupon[]>(initialCoupons);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState<CouponFormState>(EMPTY_FORM);
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState("");

  const [editingId, setEditingId] = useState<number | null>(null);
  const [editForm, setEditForm] = useState<Partial<CouponFormState>>({});
  const [saving, setSaving] = useState<number | null>(null);
  const [saveError, setSaveError] = useState<Record<number, string>>({});

  const [deleting, setDeleting] = useState<number | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null);

  const handleCreate = async () => {
    setCreateError("");
    if (!form.code.trim()) {
      setCreateError("Coupon code is required.");
      return;
    }
    setCreating(true);
    try {
      const response = await fetch("/api/admin/coupons", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code: form.code.trim(),
          description: form.description.trim() || undefined,
          isActive: form.isActive,
          maxUses: form.maxUses ? parseInt(form.maxUses, 10) : null,
          expiresAt: form.expiresAt || null,
          perSellerLimit: form.perSellerLimit ? parseInt(form.perSellerLimit, 10) : null,
          perListingLimit: form.perListingLimit ? parseInt(form.perListingLimit, 10) : null,
        }),
      });
      const data = (await response.json()) as DbFeatureCoupon & { message?: string };
      if (!response.ok) {
        setCreateError(data.message ?? "Failed to create coupon.");
        return;
      }
      setCoupons((prev) => [data, ...prev]);
      setForm(EMPTY_FORM);
      setShowCreate(false);
    } catch {
      setCreateError("Network error. Please try again.");
    } finally {
      setCreating(false);
    }
  };

  const startEdit = (coupon: DbFeatureCoupon) => {
    setEditingId(coupon.id);
    setEditForm({
      description: coupon.description ?? "",
      isActive: String(coupon.isActive) as unknown as boolean,
      maxUses: coupon.maxUses !== null ? String(coupon.maxUses) : "",
      expiresAt: toDateInputValue(coupon.expiresAt),
      perSellerLimit: coupon.perSellerLimit !== null ? String(coupon.perSellerLimit) : "",
      perListingLimit: coupon.perListingLimit !== null ? String(coupon.perListingLimit) : "",
    });
    setSaveError((prev) => ({ ...prev, [coupon.id]: "" }));
  };

  const handleSave = async (id: number) => {
    setSaving(id);
    setSaveError((prev) => ({ ...prev, [id]: "" }));
    try {
      const response = await fetch(`/api/admin/coupons/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          description: (editForm.description ?? "").trim() || undefined,
          isActive: editForm.isActive === (true as unknown as boolean) || String(editForm.isActive) === "true",
          maxUses: editForm.maxUses ? parseInt(String(editForm.maxUses), 10) : null,
          expiresAt: editForm.expiresAt || null,
          perSellerLimit: editForm.perSellerLimit ? parseInt(String(editForm.perSellerLimit), 10) : null,
          perListingLimit: editForm.perListingLimit ? parseInt(String(editForm.perListingLimit), 10) : null,
        }),
      });
      const data = (await response.json()) as DbFeatureCoupon & { message?: string };
      if (!response.ok) {
        setSaveError((prev) => ({ ...prev, [id]: data.message ?? "Failed to save." }));
        return;
      }
      setCoupons((prev) => prev.map((c) => (c.id === id ? data : c)));
      setEditingId(null);
    } catch {
      setSaveError((prev) => ({ ...prev, [id]: "Network error. Please try again." }));
    } finally {
      setSaving(null);
    }
  };

  const handleToggleActive = async (coupon: DbFeatureCoupon) => {
    setSaving(coupon.id);
    try {
      const response = await fetch(`/api/admin/coupons/${coupon.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !coupon.isActive }),
      });
      const data = (await response.json()) as DbFeatureCoupon & { message?: string };
      if (response.ok) {
        setCoupons((prev) => prev.map((c) => (c.id === coupon.id ? data : c)));
      }
    } finally {
      setSaving(null);
    }
  };

  const handleDelete = async (id: number) => {
    setDeleting(id);
    try {
      const response = await fetch(`/api/admin/coupons/${id}`, { method: "DELETE" });
      if (response.ok) {
        setCoupons((prev) => prev.filter((c) => c.id !== id));
      }
    } finally {
      setDeleting(null);
      setConfirmDeleteId(null);
    }
  };

  return (
    <main className="space-y-6 px-4 pb-8 pt-4">
      {/* Header */}
      <div className="flex items-center justify-between gap-2">
        <h1 className="text-2xl font-semibold text-slate-900">Feature Coupons</h1>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => { setShowCreate((v) => !v); setCreateError(""); }}
            className="inline-flex min-h-10 items-center rounded-lg bg-amber-500 px-4 text-sm font-semibold text-white hover:bg-amber-600"
          >
            + New Coupon
          </button>
          <a
            href="/admin/dashboard"
            className="inline-flex min-h-10 items-center rounded-lg border border-slate-200 px-3 text-xs font-medium text-slate-700"
          >
            ← Dashboard
          </a>
        </div>
      </div>

      {/* Create form */}
      {showCreate ? (
        <section className="rounded-2xl border border-amber-200 bg-amber-50 p-5 shadow-sm">
          <h2 className="mb-4 text-sm font-semibold text-slate-900">Create New Coupon</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-700">
                Code <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={form.code}
                onChange={(e) => setForm((f) => ({ ...f, code: e.target.value.toUpperCase() }))}
                placeholder="NEWRMFREE"
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm uppercase focus:border-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-100"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-700">Description</label>
              <input
                type="text"
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                placeholder="Free featured listing coupon"
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm focus:border-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-100"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-700">Max Uses (blank = unlimited)</label>
              <input
                type="number"
                min={1}
                value={form.maxUses}
                onChange={(e) => setForm((f) => ({ ...f, maxUses: e.target.value }))}
                placeholder="100"
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm focus:border-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-100"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-700">Expires At (blank = no expiry)</label>
              <input
                type="date"
                value={form.expiresAt}
                onChange={(e) => setForm((f) => ({ ...f, expiresAt: e.target.value }))}
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm focus:border-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-100"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-700">Per-Seller Limit (blank = unlimited)</label>
              <input
                type="number"
                min={1}
                value={form.perSellerLimit}
                onChange={(e) => setForm((f) => ({ ...f, perSellerLimit: e.target.value }))}
                placeholder="1"
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm focus:border-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-100"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-700">Per-Listing Limit (blank = 1)</label>
              <input
                type="number"
                min={1}
                value={form.perListingLimit}
                onChange={(e) => setForm((f) => ({ ...f, perListingLimit: e.target.value }))}
                placeholder="1"
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm focus:border-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-100"
              />
            </div>
            <div className="flex items-center gap-3 sm:col-span-2">
              <label className="text-xs font-medium text-slate-700">Active</label>
              <button
                type="button"
                onClick={() => setForm((f) => ({ ...f, isActive: !f.isActive }))}
                aria-pressed={form.isActive}
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 focus:outline-none ${
                  form.isActive ? "bg-emerald-600" : "bg-slate-200"
                }`}
              >
                <span
                  className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition duration-200 ${
                    form.isActive ? "translate-x-5" : "translate-x-0"
                  }`}
                />
              </button>
            </div>
          </div>
          {createError ? (
            <p className="mt-3 text-sm text-rose-600" role="alert">{createError}</p>
          ) : null}
          <div className="mt-4 flex gap-2">
            <button
              type="button"
              onClick={handleCreate}
              disabled={creating}
              className="inline-flex min-h-10 items-center rounded-xl bg-slate-900 px-5 text-sm font-semibold text-white disabled:opacity-50"
            >
              {creating ? "Creating…" : "Create Coupon"}
            </button>
            <button
              type="button"
              onClick={() => { setShowCreate(false); setCreateError(""); setForm(EMPTY_FORM); }}
              disabled={creating}
              className="inline-flex min-h-10 items-center rounded-xl border border-slate-200 bg-white px-4 text-sm font-medium text-slate-700 disabled:opacity-50"
            >
              Cancel
            </button>
          </div>
        </section>
      ) : null}

      {/* Coupons list */}
      {coupons.length === 0 ? (
        <p className="rounded-2xl border border-slate-100 bg-white p-6 text-center text-sm text-slate-500">
          No coupons yet. Click <strong>+ New Coupon</strong> to create one.
        </p>
      ) : (
        <div className="space-y-3">
          {coupons.map((coupon) => {
            const isEditing = editingId === coupon.id;
            const isSaving = saving === coupon.id;
            const isDeleting = deleting === coupon.id;
            const error = saveError[coupon.id];

            return (
              <article
                key={coupon.id}
                className={`rounded-2xl border bg-white p-4 shadow-sm ${
                  coupon.isActive ? "border-slate-100" : "border-slate-200 opacity-70"
                }`}
              >
                {/* Top row: code + status + actions */}
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-base font-bold text-slate-900">{coupon.code}</span>
                      <span
                        className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                          coupon.isActive
                            ? "bg-emerald-50 text-emerald-700"
                            : "bg-slate-100 text-slate-500"
                        }`}
                      >
                        {coupon.isActive ? "Active" : "Inactive"}
                      </span>
                    </div>
                    {coupon.description ? (
                      <p className="mt-0.5 text-xs text-slate-500">{coupon.description}</p>
                    ) : null}
                  </div>

                  <div className="flex shrink-0 items-center gap-1.5">
                    {/* Toggle active */}
                    <button
                      type="button"
                      onClick={() => void handleToggleActive(coupon)}
                      disabled={isSaving || isDeleting}
                      title={coupon.isActive ? "Deactivate" : "Activate"}
                      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 focus:outline-none disabled:opacity-50 ${
                        coupon.isActive ? "bg-emerald-600" : "bg-slate-200"
                      }`}
                    >
                      <span
                        className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition duration-200 ${
                          coupon.isActive ? "translate-x-5" : "translate-x-0"
                        }`}
                      />
                    </button>

                    {/* Edit */}
                    {!isEditing ? (
                      <button
                        type="button"
                        onClick={() => startEdit(coupon)}
                        disabled={isSaving || isDeleting}
                        className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                      >
                        Edit
                      </button>
                    ) : null}

                    {/* Delete */}
                    {confirmDeleteId === coupon.id ? (
                      <div className="flex items-center gap-1">
                        <span className="text-xs text-rose-600">Sure?</span>
                        <button
                          type="button"
                          onClick={() => void handleDelete(coupon.id)}
                          disabled={isDeleting}
                          className="rounded-lg bg-rose-600 px-2.5 py-1.5 text-xs font-semibold text-white disabled:opacity-50"
                        >
                          {isDeleting ? "…" : "Yes"}
                        </button>
                        <button
                          type="button"
                          onClick={() => setConfirmDeleteId(null)}
                          disabled={isDeleting}
                          className="rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs font-medium text-slate-600 disabled:opacity-50"
                        >
                          No
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setConfirmDeleteId(coupon.id)}
                        disabled={isSaving || isDeleting}
                        className="rounded-lg border border-rose-200 bg-rose-50 px-2.5 py-1.5 text-xs font-medium text-rose-700 hover:bg-rose-100 disabled:opacity-50"
                      >
                        Delete
                      </button>
                    )}
                  </div>
                </div>

                {/* Stats row */}
                <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500">
                  <span>
                    <span className="font-medium text-slate-700">{coupon.usedCount}</span>
                    {coupon.maxUses !== null ? ` / ${coupon.maxUses}` : ""} uses
                  </span>
                  <span>Expires: {formatDate(coupon.expiresAt)}</span>
                  <span>Per-seller limit: {coupon.perSellerLimit ?? "—"}</span>
                  <span>Created: {formatDate(coupon.createdAt)}</span>
                </div>

                {/* Edit form */}
                {isEditing ? (
                  <div className="mt-4 space-y-3 border-t border-slate-100 pt-4">
                    <div className="grid gap-3 sm:grid-cols-2">
                      <div>
                        <label className="mb-1 block text-xs font-medium text-slate-700">Description</label>
                        <input
                          type="text"
                          value={String(editForm.description ?? "")}
                          onChange={(e) => setEditForm((f) => ({ ...f, description: e.target.value }))}
                          placeholder="Description"
                          className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-100"
                        />
                      </div>
                      <div>
                        <label className="mb-1 block text-xs font-medium text-slate-700">Max Uses (blank = unlimited)</label>
                        <input
                          type="number"
                          min={1}
                          value={String(editForm.maxUses ?? "")}
                          onChange={(e) => setEditForm((f) => ({ ...f, maxUses: e.target.value as unknown as boolean }))}
                          placeholder="100"
                          className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-100"
                        />
                      </div>
                      <div>
                        <label className="mb-1 block text-xs font-medium text-slate-700">Expires At</label>
                        <input
                          type="date"
                          value={String(editForm.expiresAt ?? "")}
                          onChange={(e) => setEditForm((f) => ({ ...f, expiresAt: e.target.value as unknown as boolean }))}
                          className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-100"
                        />
                      </div>
                      <div>
                        <label className="mb-1 block text-xs font-medium text-slate-700">Per-Seller Limit</label>
                        <input
                          type="number"
                          min={1}
                          value={String(editForm.perSellerLimit ?? "")}
                          onChange={(e) => setEditForm((f) => ({ ...f, perSellerLimit: e.target.value as unknown as boolean }))}
                          placeholder="1"
                          className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-100"
                        />
                      </div>
                    </div>
                    {error ? (
                      <p className="text-sm text-rose-600" role="alert">{error}</p>
                    ) : null}
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => void handleSave(coupon.id)}
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
              </article>
            );
          })}
        </div>
      )}
    </main>
  );
}
