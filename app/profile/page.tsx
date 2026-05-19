import Link from "next/link";

export default function ProfilePage() {
  return (
    <main className="space-y-4 px-4 pb-8 pt-4">
      <h1 className="text-2xl font-semibold text-slate-900">Profile</h1>
      <section className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
        <p className="text-sm text-slate-500">Name</p>
        <p className="text-base font-semibold text-slate-900">Guest User</p>
        <p className="mt-3 text-sm text-slate-500">Mobile</p>
        <p className="text-base font-semibold text-slate-900">+91 98XXXXXXXX</p>
      </section>
      <div className="grid grid-cols-2 gap-2">
        <Link href="/seller/dashboard" className="inline-flex min-h-11 items-center justify-center rounded-xl bg-slate-900 px-4 text-sm font-semibold text-white">
          Seller Dashboard
        </Link>
        <Link href="/admin/dashboard" className="inline-flex min-h-11 items-center justify-center rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700">
          Admin Dashboard
        </Link>
      </div>
    </main>
  );
}
