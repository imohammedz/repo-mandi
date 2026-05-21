import Link from "next/link";

export default function AdminLoginPage() {
  return (
    <main className="space-y-4 px-4 pb-8 pt-10">
      <h1 className="text-2xl font-semibold text-slate-900">Admin Login</h1>
      <p className="text-sm text-slate-500">
        Use normal OTP login with an ADMIN account, then continue to admin dashboard.
      </p>
      <Link
        href="/auth/login"
        className="inline-flex min-h-12 w-full items-center justify-center rounded-xl bg-slate-900 text-sm font-semibold text-white"
      >
        Continue with OTP
      </Link>
    </main>
  );
}

