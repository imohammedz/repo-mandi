import Link from "next/link";

export default function OtpPage() {
  return (
    <main className="space-y-5 px-4 pb-8 pt-10">
      <h1 className="text-3xl font-semibold text-slate-900">Verify OTP</h1>
      <p className="text-sm text-slate-600">Enter the 6-digit code sent to your mobile number.</p>
      <div className="grid grid-cols-6 gap-2">
        {Array.from({ length: 6 }).map((_, index) => (
          <input
            key={index}
            maxLength={1}
            className="min-h-12 rounded-xl border border-slate-200 bg-white text-center text-lg font-semibold outline-none"
          />
        ))}
      </div>
      <Link href="/auth/role" className="inline-flex min-h-12 w-full items-center justify-center rounded-xl bg-slate-900 text-sm font-semibold text-white">
        Verify OTP
      </Link>
    </main>
  );
}
