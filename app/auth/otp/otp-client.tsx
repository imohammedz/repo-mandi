"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import type { ApiMessageResponse } from "@/app/auth/types";

type OtpClientPageProps = {
  phone: string;
};

export default function OtpClientPage({ phone }: OtpClientPageProps) {
  const router = useRouter();
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [resent, setResent] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [resending, setResending] = useState(false);
  const [error, setError] = useState("");
  const inputs = useRef<(HTMLInputElement | null)[]>([]);

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

  const filled = otp.every(Boolean);
  const maskedPhone =
    phone.length === 10 ? `+91 ${phone.slice(0, 2)}XXXXXX${phone.slice(-2)}` : "your mobile number";

  useEffect(() => {
    if (!phone) {
      router.replace("/auth/login");
    }
  }, [phone, router]);

  const handleVerify = async () => {
    if (!filled || submitting || !phone) return;
    setSubmitting(true);
    setError("");

    try {
      const response = await fetch("/api/auth/otp/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone, code: otp.join("") }),
      });
      const data = (await response.json()) as ApiMessageResponse & {
        needsOnboarding?: boolean;
        user?: { accountType?: "BUYER" | "SELLER" | "BANK_PARTNER" | "ADMIN"; isProfileComplete?: boolean };
      };

      if (!response.ok) {
        setError(data.message ?? "OTP verification failed. Please try again.");
        return;
      }

      if (data.needsOnboarding || !data.user?.isProfileComplete) {
        router.push("/onboarding");
      } else if (data.user.accountType === "SELLER") {
        router.push("/seller/dashboard");
      } else if (data.user.accountType === "BANK_PARTNER") {
        router.push("/bank/dashboard");
      } else if (data.user.accountType === "ADMIN") {
        router.push("/admin/dashboard");
      } else {
        router.push("/vehicles");
      }
    } catch {
      setError("Unable to verify OTP right now. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleResend = async () => {
    if (!phone || resending) return;
    setResending(true);
    setError("");

    try {
      const response = await fetch("/api/auth/otp/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone }),
      });
      const data = (await response.json()) as ApiMessageResponse;

      if (!response.ok) {
        setError(data.message ?? "Failed to resend OTP.");
        return;
      }

      setOtp(["", "", "", "", "", ""]);
      inputs.current[0]?.focus();
      setResent(true);
      setTimeout(() => setResent(false), 3000);
    } catch {
      setError("Unable to resend OTP right now. Please try again.");
    } finally {
      setResending(false);
    }
  };

  return (
    <main className="space-y-6 px-4 pb-8 pt-10">
      <Link
        href={`/auth/login${phone ? `?phone=${encodeURIComponent(phone)}` : ""}`}
        className="inline-flex items-center gap-1 text-sm text-slate-500"
      >
        <ArrowLeft className="h-4 w-4" /> Back
      </Link>

      <div className="space-y-1">
        <h1 className="text-2xl font-semibold text-slate-900">Enter OTP</h1>
        <p className="text-sm text-slate-500">6-digit code sent to {maskedPhone}.</p>
      </div>

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
        disabled={!filled || submitting}
        className="inline-flex min-h-12 w-full items-center justify-center rounded-xl bg-slate-900 text-sm font-semibold text-white disabled:opacity-50"
      >
        {submitting ? "Verifying..." : "Verify OTP"}
      </button>

      <p className="text-center text-xs text-slate-500">
        {resent ? (
          <span className="font-medium text-emerald-600">OTP resent!</span>
        ) : (
          <>
            Didn&apos;t receive OTP?{" "}
            <button
              onClick={handleResend}
              disabled={resending}
              className="font-medium text-slate-900"
            >
              {resending ? "Resending..." : "Resend"}
            </button>
          </>
        )}
      </p>

      {error ? <p className="text-center text-sm text-red-600">{error}</p> : null}
    </main>
  );
}
