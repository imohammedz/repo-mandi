import Link from "next/link";
import { redirect } from "next/navigation";
import { LogOut } from "lucide-react";
import { SupportContactCard } from "@/components/ui/support-contact-card";
import { SUPPORT_SUBJECTS } from "@/lib/config/site";
import { getCurrentUser } from "@/lib/auth";
import { formatDisplayLabel } from "@/lib/formatting";

export const dynamic = "force-dynamic";

export default async function ProfilePage() {
  const user = await getCurrentUser();
  if (!user) redirect("/auth/login");

  return (
    <main className="space-y-4 px-4 pb-8 pt-4">
      <h1 className="text-2xl font-semibold text-slate-900">Profile</h1>
      <section className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
        <p className="text-sm text-slate-500">Name</p>
        <p className="text-base font-semibold text-slate-900">{user.fullName || "Guest User"}</p>
        <p className="mt-3 text-sm text-slate-500">Mobile</p>
        <p className="text-base font-semibold text-slate-900">+91 {user.phone}</p>
        <p className="mt-3 text-sm text-slate-500">Account Type</p>
        <p className="text-base font-semibold text-slate-900">{formatDisplayLabel(user.accountType)}</p>
        {user.sellerRole ? (
          <>
            <p className="mt-3 text-sm text-slate-500">Seller Role</p>
            <p className="text-base font-semibold text-slate-900">{formatDisplayLabel(user.sellerRole)}</p>
          </>
        ) : null}
        {user.bankRole ? (
          <>
            <p className="mt-3 text-sm text-slate-500">Bank Role</p>
            <p className="text-base font-semibold text-slate-900">{formatDisplayLabel(user.bankRole)}</p>
          </>
        ) : null}
      </section>
      <div className="grid grid-cols-2 gap-2">
        <Link href="/seller/dashboard" className="inline-flex min-h-11 items-center justify-center rounded-xl bg-slate-900 px-4 text-sm font-semibold text-white">
          Seller Dashboard
        </Link>
        <Link href="/admin/dashboard" className="inline-flex min-h-11 items-center justify-center rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700">
          Admin Dashboard
        </Link>
      </div>
      <SupportContactCard
        title="Need Help?"
        description="Contact RepoMandi Support"
        subject={SUPPORT_SUBJECTS.general}
        ctaLabel="Contact Support"
      />
      <Link
        href="/logout"
        className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 transition-colors hover:border-red-200 hover:bg-red-50 hover:text-red-600 active:border-red-200 active:bg-red-100 active:text-red-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-200 focus-visible:ring-offset-2"
      >
        <LogOut className="h-4 w-4" />
        Logout
      </Link>
    </main>
  );
}
