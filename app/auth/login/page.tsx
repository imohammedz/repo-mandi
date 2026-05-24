"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import type { ApiMessageResponse } from "@/app/auth/types";

export default function LoginPage() {
  const router = useRouter();
  const [mobile, setMobile] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const load = async () => {
      try {
        const response = await fetch("/api/auth/session");
        if (!response.ok) return;
        const data = (await response.json()) as { user?: { accountType?: string; isProfileComplete?: boolean } };
        if (!data.user) return;
        if (!data.user.isProfileComplete) {
          router.replace("/onboarding");
          return;
        }
        if (data.user.accountType === "SELLER") router.replace("/seller/dashboard");
        else if (data.user.accountType === "BANK_PARTNER") router.replace("/bank/dashboard");
        else if (data.user.accountType === "ADMIN") router.replace("/admin/dashboard");
        else router.replace("/vehicles");
      } catch {
        // ignore
      }
    };
    load();
  }, [router]);

  const handleContinue = async () => {
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

      router.push(`/auth/otp?phone=${encodeURIComponent(mobile)}`);
    } catch {
      setError("Unable to send OTP right now. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="space-y-6 px-4 pb-8 pt-10">
      <Link href="/sell" className="inline-flex items-center gap-1 text-sm text-slate-500">
        <ArrowLeft className="h-4 w-4" /> Back
      </Link>

      <div className="space-y-1">
        <h1 className="text-2xl font-semibold text-slate-900">List Your Vehicle</h1>
        <p className="text-sm text-slate-500">Sell repossessed commercial vehicles faster.</p>
      </div>

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
        onClick={handleContinue}
        disabled={mobile.length !== 10 || submitting}
        className="inline-flex min-h-12 w-full items-center justify-center rounded-xl bg-slate-900 text-sm font-semibold text-white disabled:opacity-50"
      >
        {submitting ? "Sending OTP..." : "Continue"}
      </button>

      {error ? <p className="text-center text-sm text-red-600">{error}</p> : null}
    </main>
  );
}
