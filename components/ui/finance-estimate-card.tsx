"use client";

import { useState } from "react";
import { Info, X } from "lucide-react";
import { calculateFinanceEstimate, DEFAULT_FINANCE_ASSUMPTIONS, formatInr } from "@/lib/finance";

type Props = {
  vehicleId: string;
  vehicleTitle: string;
  listingPrice: number | null | undefined;
};

const otpPattern = /^\d{6}$/;
const indianTenDigitPattern = /^\d{10}$/;

const normalizeIndianPhone = (rawPhone: string) => {
  const digits = rawPhone.replace(/\D/g, "");
  if (indianTenDigitPattern.test(digits)) return `+91${digits}`;
  if (digits.length === 12 && digits.startsWith("91")) return `+${digits}`;
  return null;
};

export function FinanceEstimateCard({ vehicleId, vehicleTitle, listingPrice }: Props) {
  const estimate = calculateFinanceEstimate({ listingPrice });
  const [open, setOpen] = useState(false);
  const [buyerName, setBuyerName] = useState("");
  const [buyerPhone, setBuyerPhone] = useState("");
  const [requirementText, setRequirementText] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [awaitingOtp, setAwaitingOtp] = useState(false);
  const [otpEnabled, setOtpEnabled] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const close = () => {
    setOpen(false);
    setAwaitingOtp(false);
    setOtpEnabled(false);
    setOtpCode("");
    setSubmitting(false);
    setError("");
  };

  const submitInquiry = async (phoneVerified: boolean) => {
    const normalizedPhone = normalizeIndianPhone(buyerPhone);
    if (!normalizedPhone) {
      setError("Enter a valid Indian mobile number.");
      return;
    }
    if (!buyerName.trim() || !requirementText.trim()) {
      setError("Full Name and Finance Requirement are required.");
      return;
    }

    const response = await fetch("/api/finance-inquiries", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        vehicleId,
        buyerName: buyerName.trim(),
        buyerPhone: normalizedPhone,
        requirementText: requirementText.trim(),
        phoneVerified,
      }),
    });

    const data = (await response.json()) as { message?: string };
    if (!response.ok) throw new Error(data.message ?? "Failed to submit inquiry.");

    setSuccessMessage("Finance inquiry submitted. Our team will contact you after review.");
    close();
  };

  const handleContinue = async () => {
    if (submitting) return;
    const normalizedPhone = normalizeIndianPhone(buyerPhone);
    if (!buyerName.trim()) {
      setError("Full Name is required.");
      return;
    }
    if (!normalizedPhone) {
      setError("Enter a valid Indian mobile number.");
      return;
    }
    if (!requirementText.trim()) {
      setError("Finance Requirement is required.");
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

      await submitInquiry(false);
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
      await submitInquiry(true);
    } catch {
      setError("Unable to verify OTP right now. Please try again.");
    } finally {
      setSubmitting(false);
    }
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
      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-base font-semibold text-slate-900">Finance Estimate</h2>
        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="rounded-xl border border-slate-100 bg-slate-50 px-3 py-2.5">
            <p className="text-xs text-slate-500">Vehicle Price</p>
            <p className="mt-1 text-lg font-semibold text-slate-900">
              {estimate ? formatInr(estimate.listingPrice) : "Finance estimate unavailable"}
            </p>
          </div>
          <div className="rounded-xl border border-slate-100 bg-slate-50 px-3 py-2.5">
            <p className="inline-flex items-center gap-1 text-xs text-slate-500">
              Estimated EMI <Info className="h-3.5 w-3.5" />
            </p>
            <p className="mt-1 text-lg font-semibold text-slate-900">
              {estimate ? `${formatInr(estimate.estimatedEmi)} / month` : "Finance estimate unavailable"}
            </p>
          </div>
        </div>

        <div className="mt-3 rounded-xl border border-slate-100 bg-white px-3 py-2">
          <p className="text-xs font-medium text-slate-500">Based on:</p>
          <p className="mt-1 text-sm text-slate-700">
            {`${DEFAULT_FINANCE_ASSUMPTIONS.downPaymentPercent}% down payment • ${DEFAULT_FINANCE_ASSUMPTIONS.tenureMonths} months tenure • ${DEFAULT_FINANCE_ASSUMPTIONS.annualInterestRate}% annual interest`}
          </p>
        </div>

        <p className="mt-3 text-xs leading-5 text-slate-500">
          EMI is only an estimate. Final finance approval and EMI depend on CIBIL score, repayment track record,
          vehicle condition, documents, financier policy, down payment, and other checks.
        </p>

        <button
          onClick={() => {
            setError("");
            setAwaitingOtp(false);
            setOtpEnabled(false);
            setOtpCode("");
            setOpen(true);
          }}
          className="mt-4 inline-flex min-h-11 w-full items-center justify-center rounded-xl bg-slate-900 px-4 text-sm font-semibold text-white hover:bg-slate-700"
        >
          Check Finance Options
        </button>
        {successMessage ? <p className="mt-2 text-sm text-emerald-600">{successMessage}</p> : null}
      </section>

      {open ? (
        <div className="fixed inset-0 z-50">
          <button
            aria-label="Close finance inquiry sheet"
            onClick={close}
            className="absolute inset-0 bg-slate-900/50"
          />
          <section className="absolute inset-x-0 bottom-0 rounded-t-3xl bg-white p-4 shadow-2xl">
            <div className="mx-auto mb-3 h-1.5 w-12 rounded-full bg-slate-200" />
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-base font-semibold text-slate-900">Check Finance Options</h3>
              <button
                onClick={close}
                className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-slate-200 text-slate-600"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <p className="mb-3 text-xs text-slate-500">Listing: {vehicleTitle}</p>

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
                <label className="block text-xs text-slate-500">
                  Finance Requirement *
                  <textarea
                    value={requirementText}
                    onChange={(event) => setRequirementText(event.target.value)}
                    placeholder="Example: I want finance for this vehicle with 20% down payment."
                    rows={3}
                    aria-required="true"
                    className="mt-1 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-slate-900"
                  />
                </label>
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
