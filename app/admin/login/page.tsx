"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type { ApiMessageResponse } from "@/app/auth/types";

export default function AdminLoginPage() {
  const router = useRouter();
  const [mobile, setMobile] = useState("");
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [step, setStep] = useState<"phone" | "otp">("phone");
  const [submitting, setSubmitting] = useState(false);
  const [resending, setResending] = useState(false);
  const [error, setError] = useState("");
  const inputs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    const load = async () => {
      try {
        const response = await fetch("/api/auth/session");
        if (!response.ok) return;
        const data = (await response.json()) as { user?: { accountType?: string } };
        if (data.user?.accountType === "ADMIN") {
          router.replace("/admin/dashboard");
        }
      } catch {
        // ignore
      }
    };
    load();
  }, [router]);

  const handleSendOtp = async () => {
    if (mobile.length !== 10 || submitting) return;
    setSubmitting(true);
    setError("");
    try {
      const response = await fetch("/api/auth/otp/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: mobile }),
      });
      const data = (await response.json()) as ApiMessageResponse;
      if (!response.ok) {
        setError(data.message ?? "Failed to send OTP. Please try again.");
        return;
      }
      setStep("otp");
      setOtp(["", "", "", "", "", ""]);
      setTimeout(() => inputs.current[0]?.focus(), 0);
    } catch {
      setError("Unable to send OTP right now. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleVerify = async () => {
    const filled = otp.every(Boolean);
    if (!filled || submitting || mobile.length !== 10) return;
    setSubmitting(true);
    setError("");
    try {
      const response = await fetch("/api/auth/otp/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phone: mobile,
          code: otp.join(""),
          intent: "admin",
        }),
      });
      const data = (await response.json()) as ApiMessageResponse & {
        user?: { accountType?: "BUYER" | "SELLER" | "BANK_PARTNER" | "ADMIN" };
      };

      if (!response.ok) {
        setError(data.message ?? "OTP verification failed. Please try again.");
        return;
      }

      if (data.user?.accountType !== "ADMIN") {
        setError("This phone number is not authorized for admin access.");
        return;
      }

      router.replace("/admin/dashboard");
    } catch {
      setError("Unable to verify OTP right now. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleResend = async () => {
    if (mobile.length !== 10 || resending) return;
    setResending(true);
    setError("");
    try {
      const response = await fetch("/api/auth/otp/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: mobile }),
      });
      const data = (await response.json()) as ApiMessageResponse;
      if (!response.ok) {
        setError(data.message ?? "Failed to resend OTP.");
        return;
      }
      setOtp(["", "", "", "", "", ""]);
      inputs.current[0]?.focus();
    } catch {
      setError("Unable to resend OTP right now. Please try again.");
    } finally {
      setResending(false);
    }
  };

  const handleChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;
    const updated = [...otp];
    updated[index] = value.slice(-1);
    setOtp(updated);
    if (value && index < 5) inputs.current[index + 1]?.focus();
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      inputs.current[index - 1]?.focus();
    }
  };

  const maskedPhone =
    mobile.length === 10 ? `+91 ${mobile.slice(0, 2)}XXXXXX${mobile.slice(-2)}` : "your mobile number";

  return (
    <main className="space-y-6 px-4 pb-8 pt-10">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold text-slate-900">Admin Login</h1>
        <p className="text-sm text-slate-500">
          {step === "phone" ? "Enter your approved admin number." : `Enter the OTP sent to ${maskedPhone}.`}
        </p>
      </div>

      {step === "phone" ? (
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
                onChange={(e) => setMobile(e.target.value.replace(/\D/g, ""))}
                className="min-h-12 w-full rounded-r-xl border border-slate-200 bg-white px-4 text-base outline-none placeholder:text-slate-400"
              />
            </div>
          </label>

          <button
            onClick={handleSendOtp}
            disabled={mobile.length !== 10 || submitting}
            className="inline-flex min-h-12 w-full items-center justify-center rounded-xl bg-slate-900 text-sm font-semibold text-white disabled:opacity-50"
          >
            {submitting ? "Sending OTP..." : "Continue"}
          </button>
        </>
      ) : (
        <>
          <div className="grid grid-cols-6 gap-2">
            {otp.map((digit, i) => (
              <input
                key={i}
                ref={(el) => {
                  inputs.current[i] = el;
                }}
                type="tel"
                inputMode="numeric"
                maxLength={1}
                value={digit}
                onChange={(e) => handleChange(i, e.target.value)}
                onKeyDown={(e) => handleKeyDown(i, e)}
                className="min-h-12 rounded-xl border border-slate-200 bg-white text-center text-lg font-semibold outline-none focus:border-slate-900"
              />
            ))}
          </div>

          <button
            onClick={handleVerify}
            disabled={!otp.every(Boolean) || submitting}
            className="inline-flex min-h-12 w-full items-center justify-center rounded-xl bg-slate-900 text-sm font-semibold text-white disabled:opacity-50"
          >
            {submitting ? "Verifying..." : "Verify OTP"}
          </button>

          <div className="flex items-center justify-between text-xs">
            <button
              onClick={() => {
                setStep("phone");
                setOtp(["", "", "", "", "", ""]);
                setError("");
              }}
              className="font-medium text-slate-600"
            >
              Change number
            </button>
            <button onClick={handleResend} disabled={resending} className="font-medium text-slate-900">
              {resending ? "Resending..." : "Resend OTP"}
            </button>
          </div>
        </>
      )}

      {error ? <p className="text-center text-sm text-red-600">{error}</p> : null}
    </main>
  );
}
