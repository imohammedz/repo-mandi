import Link from "next/link";
import { redirect } from "next/navigation";
import { LogOut } from "lucide-react";
import { getCurrentUser } from "@/lib/auth";
import ProfileCard from "./profile-card";

export const dynamic = "force-dynamic";

export default async function ProfilePage() {
  const user = await getCurrentUser();
  if (!user) redirect("/auth/login");

  return (
    <main className="space-y-4 px-4 pb-8 pt-4">
      <h1 className="text-2xl font-semibold text-slate-900">Profile</h1>
      <ProfileCard
        user={{
          fullName: user.fullName,
          phone: user.phone,
          accountType: user.accountType,
          sellerRole: user.sellerRole ?? null,
          bankRole: user.bankRole ?? null,
        }}
      />
      <div className={`grid gap-2 ${user.accountType === "ADMIN" ? "grid-cols-2" : "grid-cols-1"}`}>
        <Link href="/seller/dashboard" className="inline-flex min-h-11 items-center justify-center rounded-xl bg-slate-900 px-4 text-sm font-semibold text-white">
          Seller Dashboard
        </Link>
        {user.accountType === "ADMIN" && (
          <Link href="/admin/dashboard" className="inline-flex min-h-11 items-center justify-center rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700">
            Admin Dashboard
          </Link>
        )}
      </div>
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
