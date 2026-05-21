"use client";

import { useState } from "react";
import { CallButton } from "@/components/ui/call-button";
import { WhatsAppButton } from "@/components/ui/whatsapp-button";

type Props = {
  name: string;
  role: string;
  phone: string;
  vehicleId?: string;
  sellerId?: number;
  city?: string;
  sellerVerified?: boolean;
};

export function SellerCard({ name, role, phone, vehicleId, city, sellerVerified = false }: Props) {
  const [buyerName, setBuyerName] = useState("");
  const [buyerPhone, setBuyerPhone] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  const requestDetails = async () => {
    if (!vehicleId || submitting) return;
    setSubmitting(true);
    setSuccess(false);
    try {
      const response = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          vehicleId,
          source: "REQUEST_DETAILS",
          buyerName,
          buyerPhone,
          message,
        }),
      });
      if (response.ok) {
        setSuccess(true);
        setBuyerName("");
        setBuyerPhone("");
        setMessage("");
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
      <h3 className="text-sm font-semibold text-slate-900">Seller Profile</h3>
      <p className="mt-2 text-base font-semibold text-slate-800">{name}</p>
      <p className="text-sm text-slate-500">{role}{city ? ` • ${city}` : ""}</p>
      <div className="mt-2 flex items-center gap-2 text-xs text-slate-500">
        {sellerVerified ? (
          <span className="rounded-full bg-emerald-50 px-2 py-1 text-emerald-700">Verified Seller</span>
        ) : (
          <span className="rounded-full bg-slate-100 px-2 py-1 text-slate-600">Unverified Seller</span>
        )}
      </div>
      <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-3">
        <CallButton phone={phone} text="Call Seller" className="w-full" vehicleId={vehicleId} />
        <WhatsAppButton phone={phone} text="WhatsApp" className="w-full" vehicleId={vehicleId} />
      </div>
      <div className="mt-3 space-y-2 rounded-xl border border-slate-100 p-3">
        <p className="text-xs font-medium text-slate-700">Request Details</p>
        <input
          placeholder="Your name (optional)"
          value={buyerName}
          onChange={(e) => setBuyerName(e.target.value)}
          className="min-h-10 w-full rounded-lg border border-slate-200 px-3 text-xs"
        />
        <input
          placeholder="Your phone (optional)"
          value={buyerPhone}
          onChange={(e) => setBuyerPhone(e.target.value)}
          className="min-h-10 w-full rounded-lg border border-slate-200 px-3 text-xs"
        />
        <textarea
          placeholder="Message (optional)"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          rows={2}
          className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs"
        />
        <button
          onClick={requestDetails}
          disabled={submitting || !vehicleId}
          className="min-h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700 disabled:opacity-50"
        >
          {submitting ? "Submitting..." : "Request Details"}
        </button>
        {success ? <p className="text-xs text-emerald-600">Request sent successfully.</p> : null}
      </div>
    </section>
  );
}
