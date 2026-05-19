import Link from "next/link";

export default function LoginPage() {
  return (
    <main className="space-y-5 px-4 pb-8 pt-10">
      <h1 className="text-3xl font-semibold text-slate-900">Login with Mobile OTP</h1>
      <p className="text-sm text-slate-600">Fast and secure access for buyers and sellers.</p>
      <label className="block">
        <span className="mb-1 block text-sm font-medium text-slate-700">Mobile Number</span>
        <input
          placeholder="+91 98XXXXXXXX"
          className="min-h-12 w-full rounded-xl border border-slate-200 bg-white px-4 text-base outline-none placeholder:text-slate-400"
        />
      </label>
      <Link href="/auth/otp" className="inline-flex min-h-12 w-full items-center justify-center rounded-xl bg-slate-900 text-sm font-semibold text-white">
        Send OTP
      </Link>
    </main>
  );
}
