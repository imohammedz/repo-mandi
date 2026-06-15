import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { getSellerListings, type SellerListingSearchParams } from "@/lib/seller-listings";
import { SellerListingsSection } from "./seller-listings-section";
import { SellerListingsSort } from "./seller-listings-sort";

export const dynamic = "force-dynamic";

function formatCount(value: number) {
  return new Intl.NumberFormat("en-IN").format(value);
}

export default async function SellerListingsPage({
  searchParams,
}: {
  searchParams: Promise<SellerListingSearchParams>;
}) {
  const currentUser = await getCurrentUser();
  if (!currentUser) redirect("/auth/login");
  if (!["SELLER", "BANK_PARTNER", "ADMIN"].includes(currentUser.accountType)) redirect("/sell");
  if (!currentUser.isProfileComplete) redirect("/onboarding");

  const params = await searchParams;
  const { items, pagination, sort } = await getSellerListings(currentUser.id, params, {
    includePagesUpToCurrent: true,
  });

  return (
    <main className="space-y-4 px-4 pb-8 pt-4">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">My Listings</h1>
          <p className="mt-1 text-sm text-slate-500">
            Track listing performance, feature status, and buyer activity in one place.
          </p>
        </div>
        <Link
          href="/seller/listings/new"
          className="inline-flex min-h-11 items-center justify-center rounded-2xl bg-slate-900 px-4 text-sm font-semibold text-white"
        >
          Add Vehicle
        </Link>
      </header>

      <section className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-slate-500">
          <span className="font-semibold text-slate-900">{formatCount(pagination.total)}</span>{" "}
          vehicle{pagination.total === 1 ? "" : "s"} in your inventory
        </p>
        <SellerListingsSort value={sort} />
      </section>

      <SellerListingsSection initialItems={items} initialPagination={pagination} />
    </main>
  );
}
