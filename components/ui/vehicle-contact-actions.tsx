"use client";

import { useState } from "react";
import { MessageCircle, Phone, X } from "lucide-react";

type ContactSource = "CALL" | "WHATSAPP" | "REQUEST_DETAILS";

type Props = {
  vehicleId: string;
  sellerPhone: string;
  vehicleTitle: string;
  className?: string;
  showRequestDetails?: boolean;
  layout?: "stacked" | "inline";
};

const otpPattern = /^\d{6}$/;

const normalizeIndianPhone = (value: string) => {
  const digits = value.replace(/\D/g, "");
  if (digits.length === 10) return `+91${digits}`;
  if (digits.length === 12 && digits.startsWith("91")) return `+${digits}`;
  return null;
};

const toWhatsAppPhone = (value: string) => value.replace(/\D/g, "").replace(/^0+/, "");

export function VehicleContactActions({
  vehicleId,
  sellerPhone,
  vehicleTitle,
  className = "",
  showRequestDetails = true,
  layout = "stacked",
}: Props) {
  const [action, setAction] = useState<ContactSource | null>(null);
  const [buyerName, setBuyerName] = useState("");
  const [buyerPhone, setBuyerPhone] = useState("");
  const [message, setMessage] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [awaitingOtp, setAwaitingOtp] = useState(false);
  const [otpEnabled, setOtpEnabled] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const closeSheet = () => {
    setAction(null);
    setAwaitingOtp(false);
    setOtpEnabled(false);
    setOtpCode("");
    setSubmitting(false);
    setError("");
  };

  const triggerAction = (resolvedAction: ContactSource, customMessage: string) => {
    if (resolvedAction === "CALL") {
      window.location.href = `tel:${sellerPhone}`;
      return;
    }

    if (resolvedAction === "WHATSAPP") {
      const text =
        customMessage.trim() ||
        `Hi, I found your vehicle on RepoMandi. I am interested in this listing: ${vehicleTitle}. Please share more details.`;
      const whatsappPhone = toWhatsAppPhone(sellerPhone);
      const url = `https://wa.me/${whatsappPhone}?text=${encodeURIComponent(text)}`;
      window.open(url, "_blank", "noopener,noreferrer");
      return;
    }

    setSuccessMessage("Your request has been sent to the seller.");
  };

  const createLeadAndContinue = async (phoneVerified: boolean) => {
    if (!action) return;
    const normalizedPhone = normalizeIndianPhone(buyerPhone);
    if (!normalizedPhone) {
      setError("Enter a valid Indian mobile number.");
      return;
    }

    const response = await fetch("/api/leads", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        vehicleId,
        source: action,
        buyerName: buyerName.trim(),
        buyerPhone: normalizedPhone,
        message: message.trim() || undefined,
        phoneVerified,
      }),
    });
    const data = (await response.json()) as { message?: string };
    if (!response.ok) {
      throw new Error(data.message ?? "Failed to create lead.");
    }

    triggerAction(action, message);
    closeSheet();
  };

  const handleContinue = async () => {
    if (!action || submitting) return;
    const normalizedPhone = normalizeIndianPhone(buyerPhone);
    if (!buyerName.trim()) {
      setError("Full Name is required.");
      return;
    }
    if (!normalizedPhone) {
      setError("Enter a valid Indian mobile number.");
      return;
    }

    setSubmitting(true);
    setError("");
    try {
      const response = await fetch("/api/leads/otp/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: normalizedPhone }),
      });
      const data = (await response.json()) as { message?: string; otpEnabled?: boolean };
      if (!response.ok) {
        setError(data.message ?? "Failed to continue.");
        return;
      }

      if (data.otpEnabled) {
        setOtpEnabled(true);
        setAwaitingOtp(true);
        return;
      }

      await createLeadAndContinue(false);
    } catch {
      setError("Unable to continue right now. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (submitting) return;
    if (!otpPattern.test(otpCode)) {
      setError("Enter a valid 6-digit OTP.");
      return;
    }

    const normalizedPhone = normalizeIndianPhone(buyerPhone);
    if (!normalizedPhone) {
      setError("Enter a valid Indian mobile number.");
      return;
    }

    setSubmitting(true);
    setError("");
    try {
      const verifyResponse = await fetch("/api/leads/otp/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: normalizedPhone, code: otpCode }),
      });
      const verifyData = (await verifyResponse.json()) as { message?: string };
      if (!verifyResponse.ok) {
        setError(verifyData.message ?? "OTP verification failed.");
        return;
      }

      await createLeadAndContinue(true);
    } catch {
      setError("Unable to verify OTP right now. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const openActionSheet = (nextAction: ContactSource) => {
    setSuccessMessage("");
    setError("");
    setAwaitingOtp(false);
    setOtpCode("");
    setOtpEnabled(false);
    setAction(nextAction);
  };

  const handleResendOtp = async () => {
    if (submitting || !otpEnabled) return;
    const normalizedPhone = normalizeIndianPhone(buyerPhone);
    if (!normalizedPhone) return;
    setSubmitting(true);
    setError("");
    try {
      const response = await fetch("/api/leads/otp/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: normalizedPhone }),
      });
      const data = (await response.json()) as { message?: string };
      if (!response.ok) {
        setError(data.message ?? "Failed to resend OTP.");
      }
    } catch {
      setError("Unable to resend OTP right now. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <div className={className}>
        <div className={`grid gap-2 ${layout === "inline" && showRequestDetails ? "grid-cols-3" : "grid-cols-2"}`}>
          <button
            onClick={() => openActionSheet("CALL")}
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-700"
          >
            <Phone className="h-4 w-4" />
            Call Seller
          </button>
          <button
            onClick={() => openActionSheet("WHATSAPP")}
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-emerald-500 px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-600"
          >
            <MessageCircle className="h-4 w-4" />
            WhatsApp
          </button>
          {showRequestDetails && layout === "inline" ? (
            <button
              onClick={() => openActionSheet("REQUEST_DETAILS")}
              className="inline-flex min-h-11 items-center justify-center rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700"
            >
            Request Details
            </button>
          ) : null}
        </div>

        {showRequestDetails && layout === "stacked" ? (
          <button
            onClick={() => openActionSheet("REQUEST_DETAILS")}
            className="mt-2 inline-flex min-h-11 w-full items-center justify-center rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700"
          >
            Request Details
          </button>
        ) : null}
      </div>

      {successMessage ? <p className="mt-2 text-sm text-emerald-600">{successMessage}</p> : null}

      {action ? (
        <div className="fixed inset-0 z-50">
          <button
            aria-label="Close contact details sheet"
            onClick={closeSheet}
            className="absolute inset-0 bg-slate-900/50"
          />
          <section className="absolute inset-x-0 bottom-0 rounded-t-3xl bg-white p-4 shadow-2xl">
            <div className="mx-auto mb-3 h-1.5 w-12 rounded-full bg-slate-200" />
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-base font-semibold text-slate-900">Share your contact details</h3>
              <button
                onClick={closeSheet}
                className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-slate-200 text-slate-600"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {!awaitingOtp ? (
              <div className="space-y-3">
                <input
                  value={buyerName}
                  onChange={(event) => setBuyerName(event.target.value)}
                  placeholder="Full Name *"
                  className="min-h-12 w-full rounded-xl border border-slate-200 px-4 text-sm outline-none focus:border-slate-900"
                />
                <input
                  value={buyerPhone}
                  onChange={(event) => setBuyerPhone(event.target.value)}
                  placeholder="Mobile Number *"
                  inputMode="tel"
                  className="min-h-12 w-full rounded-xl border border-slate-200 px-4 text-sm outline-none focus:border-slate-900"
                />
                <textarea
                  value={message}
                  onChange={(event) => setMessage(event.target.value)}
                  placeholder="Message (optional)"
                  rows={3}
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-slate-900"
                />
                <p className="text-xs text-slate-500">
                  Your details are shared with the seller only for this vehicle inquiry.
                </p>
                <button
                  onClick={handleContinue}
                  disabled={submitting}
                  className="inline-flex min-h-12 w-full items-center justify-center rounded-xl bg-slate-900 text-sm font-semibold text-white disabled:opacity-50"
                >
                  {submitting ? "Please wait..." : "Continue"}
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                <p className="text-sm text-slate-600">Enter the 6-digit OTP sent to your mobile number.</p>
                <input
                  value={otpCode}
                  onChange={(event) => setOtpCode(event.target.value.replace(/\D/g, "").slice(0, 6))}
                  placeholder="Enter OTP"
                  inputMode="numeric"
                  className="min-h-12 w-full rounded-xl border border-slate-200 px-4 text-sm tracking-[0.2em] outline-none focus:border-slate-900"
                />
                <button
                  onClick={handleVerifyOtp}
                  disabled={submitting}
                  className="inline-flex min-h-12 w-full items-center justify-center rounded-xl bg-slate-900 text-sm font-semibold text-white disabled:opacity-50"
                >
                  {submitting ? "Verifying..." : "Verify & Continue"}
                </button>
                <button
                  onClick={handleResendOtp}
                  disabled={submitting}
                  className="inline-flex min-h-11 w-full items-center justify-center rounded-xl border border-slate-200 bg-white text-sm font-semibold text-slate-700 disabled:opacity-50"
                >
                  Resend OTP
                </button>
              </div>
            )}

            {error ? <p className="mt-3 text-sm text-red-600">{error}</p> : null}
          </section>
        </div>
      ) : null}
    </>
  );
}
