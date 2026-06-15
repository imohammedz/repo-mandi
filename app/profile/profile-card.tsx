"use client";

import { useState } from "react";
import { Pencil, Check, X } from "lucide-react";
import { formatDisplayLabel } from "@/lib/formatting";

type AccountType = "BUYER" | "SELLER" | "BANK_PARTNER" | "ADMIN";
type SellerRole = "BROKER" | "DEALER" | "YARD_OWNER" | "RECOVERY_AGENT" | "TRUCK_OWNER" | "FLEET_OWNER";

const SELLER_ROLES: { value: SellerRole; label: string }[] = [
  { value: "BROKER", label: "Broker" },
  { value: "DEALER", label: "Dealer" },
  { value: "YARD_OWNER", label: "Yard Owner" },
  { value: "RECOVERY_AGENT", label: "Recovery Agent" },
  { value: "TRUCK_OWNER", label: "Truck Owner" },
  { value: "FLEET_OWNER", label: "Fleet Owner" },
];

type Props = {
  user: {
    fullName: string;
    phone: string;
    accountType: AccountType;
    sellerRole: string | null;
    bankRole: string | null;
  };
};

export default function ProfileCard({ user }: Props) {
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [fullName, setFullName] = useState(user.fullName);
  const [sellerRole, setSellerRole] = useState(user.sellerRole ?? "");

  // Displayed values (updated after save)
  const [displayed, setDisplayed] = useState({
    fullName: user.fullName,
    sellerRole: user.sellerRole,
  });

  const handleEdit = () => {
    setFullName(displayed.fullName);
    setSellerRole(displayed.sellerRole ?? "");
    setError("");
    setEditing(true);
  };

  const handleCancel = () => {
    setEditing(false);
    setError("");
  };

  const handleSave = async () => {
    if (!fullName.trim()) return;
    setSaving(true);
    setError("");
    try {
      const body: Record<string, string> = { fullName: fullName.trim() };
      if (user.accountType === "SELLER" && sellerRole) {
        body.sellerRole = sellerRole;
      }
      const res = await fetch("/api/users/me", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = (await res.json()) as { message?: string; fullName?: string; sellerRole?: string | null };
      if (!res.ok) {
        setError(data.message ?? "Failed to save profile.");
        return;
      }
      setDisplayed({
        fullName: data.fullName ?? fullName.trim(),
        sellerRole: data.sellerRole ?? null,
      });
      setEditing(false);
    } catch {
      setError("Unable to save profile right now.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between">
        <span className="text-sm font-medium text-slate-500">Profile Details</span>
        {!editing ? (
          <button
            type="button"
            onClick={handleEdit}
            className="flex items-center gap-1 rounded-lg border border-slate-200 px-2.5 py-1 text-xs font-medium text-slate-600 hover:bg-slate-50 active:bg-slate-100"
          >
            <Pencil className="h-3 w-3" />
            Edit
          </button>
        ) : (
          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleCancel}
              disabled={saving}
              className="flex items-center gap-1 rounded-lg border border-slate-200 px-2.5 py-1 text-xs font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-50"
            >
              <X className="h-3 w-3" />
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={saving || !fullName.trim()}
              className="flex items-center gap-1 rounded-lg bg-slate-900 px-2.5 py-1 text-xs font-semibold text-white disabled:opacity-50"
            >
              <Check className="h-3 w-3" />
              {saving ? "Saving…" : "Save"}
            </button>
          </div>
        )}
      </div>

      <div className="mt-3">
        <p className="text-sm text-slate-500">Name</p>
        {editing ? (
          <input
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            className="mt-1 min-h-10 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm font-semibold text-slate-900 focus:border-slate-400 focus:outline-none"
          />
        ) : (
          <p className="text-base font-semibold text-slate-900">{displayed.fullName || "Guest User"}</p>
        )}
      </div>

      <div className="mt-3">
        <p className="text-sm text-slate-500">Mobile</p>
        <p className="text-base font-semibold text-slate-900">+91 {user.phone}</p>
      </div>

      <div className="mt-3">
        <p className="text-sm text-slate-500">Account Type</p>
        <p className="text-base font-semibold text-slate-900">{formatDisplayLabel(user.accountType)}</p>
      </div>

      {user.accountType === "SELLER" ? (
        <div className="mt-3">
          <p className="text-sm text-slate-500">Seller Role</p>
          {editing ? (
            <select
              value={sellerRole}
              onChange={(e) => setSellerRole(e.target.value)}
              className="mt-1 min-h-10 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm font-semibold text-slate-900 focus:border-slate-400 focus:outline-none"
            >
              <option value="">Select role</option>
              {SELLER_ROLES.map((r) => (
                <option key={r.value} value={r.value}>{r.label}</option>
              ))}
            </select>
          ) : (
            <p className="text-base font-semibold text-slate-900">
              {displayed.sellerRole ? formatDisplayLabel(displayed.sellerRole) : "—"}
            </p>
          )}
        </div>
      ) : null}

      {user.bankRole ? (
        <div className="mt-3">
          <p className="text-sm text-slate-500">Bank Role</p>
          <p className="text-base font-semibold text-slate-900">{formatDisplayLabel(user.bankRole)}</p>
        </div>
      ) : null}

      {error ? <p className="mt-3 text-sm text-red-600">{error}</p> : null}
    </section>
  );
}
