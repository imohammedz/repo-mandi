"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function OtpPage() {
  const router = useRouter();
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
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

  return (
    <main className="space-y-6 px-4 pb-8 pt-10">
      <Link href="/auth/login" className="inline-flex items-center gap-1 text-sm text-slate-500">
        <ArrowLeft className="h-4 w-4" /> Back
      </Link>

      <div className="space-y-1">
        <h1 className="text-2xl font-semibold text-slate-900">Enter OTP</h1>
        <p className="text-sm text-slate-500">6-digit code sent to your mobile number.</p>
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
        onClick={() => filled && router.push("/auth/role")}
        disabled={!filled}
        className="inline-flex min-h-12 w-full items-center justify-center rounded-xl bg-slate-900 text-sm font-semibold text-white disabled:opacity-50"
      >
        Verify OTP
      </button>

      <p className="text-center text-xs text-slate-500">
        Didn&apos;t receive OTP?{" "}
        <button className="font-medium text-slate-900">Resend</button>
      </p>
    </main>
  );
}
