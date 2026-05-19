import Link from "next/link";

const roles = ["Seller", "Buyer"];

export default function RolePage() {
  return (
    <main className="space-y-5 px-4 pb-8 pt-10">
      <h1 className="text-3xl font-semibold text-slate-900">Select Role</h1>
      <p className="text-sm text-slate-600">Choose your account type to continue onboarding.</p>
      <div className="space-y-3">
        {roles.map((role) => (
          <button
            key={role}
            className="min-h-12 w-full rounded-xl border border-slate-200 bg-white px-4 text-left text-base font-medium text-slate-800"
          >
            {role}
          </button>
        ))}
      </div>
      <Link href="/" className="inline-flex min-h-12 w-full items-center justify-center rounded-xl bg-slate-900 text-sm font-semibold text-white">
        Continue
      </Link>
    </main>
  );
}
