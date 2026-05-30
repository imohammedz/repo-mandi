"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import type { AuthVerifyResponse } from "@/app/auth/types";
import { normalizeIndianPhone } from "@/lib/otp/phone";

type WhatsappOtpFormProps = {
  title: string;
  subtitle: string;
  intent?: "default" | "admin";
  backHref?: string;
  initialPhone?: string;
  deliveryLabel?: string;
};

type Step = "phone" | "code";

export default function WhatsappOtpForm({
  title,
  subtitle,
  intent = "default",
  backHref,
  initialPhone = "",
  deliveryLabel = "WhatsApp",
}: WhatsappOtpFormProps) {
  const router = useRouter();
  const [step, setStep] = useState<Step>("phone");
  const [mobile, setMobile] = useState(initialPhone);
  const [code, setCode] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const redirectAfterAuth = (data: AuthVerifyResponse) => {
    if (intent === "admin") {
      router.replace("/admin/dashboard");
      return;
    }
    if (data.needsOnboarding || !data.user?.isProfileComplete) {
      router.replace("/onboarding");
    } else if (data.user.accountType === "SELLER") {
      router.replace("/seller/dashboard");
    } else if (data.user.accountType === "BANK_PARTNER") {
      router.replace("/bank/dashboard");
    } else if (data.user.accountType === "ADMIN") {
      router.replace("/admin/dashboard");
    } else {
      router.replace("/vehicles");
    }
  };

  const handleSendOtp = async () => {
    const phone = normalizeIndianPhone(mobile);
    if (!phone || submitting) return;

    setSubmitting(true);
    setError("");

    try {
      const response = await fetch("/api/auth/otp/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone, purpose: "login" }),
      });

      const data = (await response.json()) as { message?: string };

      if (!response.ok) {
        setError(data.message ?? "Failed to send OTP. Please try again.");
        return;
      }

      setStep("code");
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleVerifyOtp = async () => {
    const phone = normalizeIndianPhone(mobile);
    const trimmedCode = code.trim();

    if (!phone || !trimmedCode || submitting) return;

    setSubmitting(true);
    setError("");

    try {
      const response = await fetch("/api/auth/otp/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone, code: trimmedCode, purpose: "login" }),
      });

      const data = (await response.json()) as AuthVerifyResponse;

      if (!response.ok) {
        setError(data.message ?? "OTP verification failed. Please try again.");
        return;
      }

      if (intent === "admin" && data.user?.accountType !== "ADMIN") {
        setError("This phone number is not authorized for admin access.");
        return;
      }

      redirectAfterAuth(data);
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="space-y-6 px-4 pb-8 pt-10">
      {backHref ? (
        <Link href={backHref} className="inline-flex items-center gap-1 text-sm text-slate-500">
          <ArrowLeft className="h-4 w-4" /> Back
        </Link>
      ) : null}

      <div className="space-y-1">
        <h1 className="text-2xl font-semibold text-slate-900">{title}</h1>
        <p className="text-sm text-slate-500">{subtitle}</p>
      </div>

      {step === "phone" && (
        <>
          <label className="block">
            <span className="mb-1 block text-sm font-medium text-slate-700">Mobile Number</span>
            <div className="flex">
              <span className="inline-flex min-h-12 items-center rounded-l-xl border border-r-0 border-slate-200 bg-slate-50 px-3 text-sm text-slate-600">
                +91
              </span>
              <input
                type="tel"
                inputMode="numeric"
                maxLength={10}
                placeholder="98XXXXXXXX"
                value={mobile}
                onChange={(event) => setMobile(event.target.value.replace(/\D/g, ""))}
                className="min-h-12 w-full rounded-r-xl border border-slate-200 bg-white px-4 text-base outline-none placeholder:text-slate-400"
              />
            </div>
          </label>

          <button
            onClick={handleSendOtp}
            disabled={mobile.length !== 10 || submitting}
            className="inline-flex min-h-12 w-full items-center justify-center rounded-xl bg-slate-900 text-sm font-semibold text-white disabled:opacity-50"
          >
            {submitting ? "Sending OTP…" : `Send OTP via ${deliveryLabel}`}
          </button>

          <p className="text-center text-xs text-slate-500">
            An OTP will be sent via {deliveryLabel}.
          </p>
        </>
      )}

      {step === "code" && (
        <>
          <div className="rounded-xl border border-slate-100 bg-slate-50 px-4 py-3 text-sm text-slate-700">
            OTP sent for <span className="font-medium">+91 {mobile}</span>.{" "}
            <button
              type="button"
              className="text-slate-500 underline"
              onClick={() => {
                setStep("phone");
                setCode("");
                setError("");
              }}
            >
              Change number
            </button>
          </div>

          <label className="block">
            <span className="mb-1 block text-sm font-medium text-slate-700">Enter OTP</span>
            <input
              type="text"
              inputMode="numeric"
              maxLength={6}
              placeholder="6-digit code"
              value={code}
              onChange={(event) => setCode(event.target.value.replace(/\D/g, ""))}
              className="min-h-12 w-full rounded-xl border border-slate-200 bg-white px-4 text-base outline-none placeholder:text-slate-400"
            />
          </label>

          <button
            onClick={handleVerifyOtp}
            disabled={code.length !== 6 || submitting}
            className="inline-flex min-h-12 w-full items-center justify-center rounded-xl bg-slate-900 text-sm font-semibold text-white disabled:opacity-50"
          >
            {submitting ? "Verifying…" : "Verify OTP"}
          </button>

          <button
            type="button"
            onClick={() => void handleSendOtp()}
            disabled={submitting}
            className="w-full text-center text-xs text-slate-500 underline disabled:opacity-50"
          >
            Resend OTP
          </button>
        </>
      )}

      {error ? <p className="text-center text-sm text-red-600">{error}</p> : null}
    </main>
  );
}
