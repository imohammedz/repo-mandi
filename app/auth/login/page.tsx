"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [mobile, setMobile] = useState("");

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
        onClick={() => mobile.length === 10 && router.push("/auth/otp")}
        disabled={mobile.length !== 10}
        className="inline-flex min-h-12 w-full items-center justify-center rounded-xl bg-slate-900 text-sm font-semibold text-white disabled:opacity-50"
      >
        Continue
      </button>
    </main>
  );
}
