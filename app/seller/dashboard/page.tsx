import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { StatsCard } from "@/components/ui/stats-card";
import { getCurrentUser } from "@/lib/auth";
import { getSellerListings, type SellerListingSearchParams } from "@/lib/seller-listings";
import { SellerListingsSection } from "../listings/seller-listings-section";
import { SellerListingsSort } from "../listings/seller-listings-sort";

export const dynamic = "force-dynamic";

function formatCount(value: number) {
  return new Intl.NumberFormat("en-IN").format(value);
}

export default async function SellerDashboardPage({
  searchParams,
}: {
  searchParams: Promise<SellerListingSearchParams>;
}) {
  const currentUser = await getCurrentUser();
  if (!currentUser) redirect("/auth/login");
  if (!["SELLER", "BANK_PARTNER", "ADMIN"].includes(currentUser.accountType)) redirect("/sell");
  if (!currentUser.isProfileComplete) redirect("/onboarding");

  const params = await searchParams;
  const { items, metrics, pagination, sort, hasFeatureRequests } = await getSellerListings(
    currentUser.id,
    params,
    { includePagesUpToCurrent: true },
  );

  const stats = [
    {
      label: "Total Listings",
      value: formatCount(metrics.totalListings),
      hint: "Your active inventory",
    },
    { label: "Total Views", value: formatCount(metrics.totalViews), hint: "Buyer attention so far" },
    {
      label: "Total Inquiries",
      value: formatCount(metrics.totalInquiries),
      hint: "Leads across listings",
    },
    {
      label: "Featured Listings",
      value: formatCount(metrics.featuredListings),
      hint: "Currently promoted",
    },
    { label: "Sold Listings", value: formatCount(metrics.soldListings), hint: "Completed deals" },
  ];

  return (
    <main className="space-y-5 px-4 pb-8 pt-4">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Seller Dashboard</h1>
          <p className="mt-1 text-sm text-slate-500">
            Manage inventory, monitor buyer interest, and promote your best vehicles.
          </p>
        </div>
        <Link
          href="/seller/listings/new"
          className="inline-flex min-h-11 items-center justify-center rounded-2xl bg-slate-900 px-4 text-sm font-semibold text-white"
        >
          Add Vehicle
        </Link>
      </header>

      <section className="grid grid-cols-2 gap-3 xl:grid-cols-5">
        {stats.map((item) => (
          <StatsCard key={item.label} label={item.label} value={item.value} hint={item.hint} />
        ))}
      </section>

      <section className="overflow-hidden rounded-[28px] border border-amber-200 bg-gradient-to-br from-[#FFF5E8] via-[#FFF8EF] to-white shadow-sm">
        <div className="grid items-center gap-6 p-5 lg:grid-cols-[minmax(0,1.1fr)_300px] lg:p-7">
          <div className="space-y-4">
            <span className="inline-flex rounded-full bg-white px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-amber-700 shadow-sm">
              Premium Visibility
            </span>
            <div className="space-y-3">
              <h2 className="text-2xl font-semibold text-slate-950">🚀 Get Seen by More Buyers</h2>
              <p className="max-w-xl text-sm leading-6 text-slate-600">
                Feature your listing to appear on the Home Page, top search results, and featured
                slots that attract serious buyers faster.
              </p>
            </div>
            <div className="grid gap-2 text-sm text-slate-700 sm:grid-cols-3">
              <div className="rounded-2xl bg-white/90 px-3 py-2 shadow-sm">✓ Home Page</div>
              <div className="rounded-2xl bg-white/90 px-3 py-2 shadow-sm">
                ✓ Top Search Results
              </div>
              <div className="rounded-2xl bg-white/90 px-3 py-2 shadow-sm">✓ Featured Listings</div>
            </div>
            <p className="text-sm text-slate-600">Increase visibility and get more buyer inquiries.</p>
            <Link
              href="#your-listings"
              className="inline-flex min-h-11 items-center justify-center rounded-2xl bg-amber-500 px-5 text-sm font-semibold text-white hover:bg-amber-600"
            >
              Feature My Listing
            </Link>
          </div>

          <div className="relative mx-auto h-48 w-full max-w-[320px] overflow-hidden rounded-[24px] border border-white/70 bg-white/70 shadow-sm">
            <Image
              src="/sell-truck-banner.jpg"
              alt="RepoMandi featured listing promotion"
              fill
              sizes="(max-width: 1024px) 100vw, 320px"
              className="object-cover"
              priority
            />
            <div className="absolute inset-x-3 bottom-3 rounded-2xl bg-white/90 px-4 py-3 shadow-sm backdrop-blur">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-amber-700">
                Featured Upgrade
              </p>
              <p className="mt-1 text-sm font-semibold text-slate-900">
                Stand out in front of ready-to-buy truck buyers.
              </p>
            </div>
          </div>
        </div>
      </section>

      {!hasFeatureRequests && metrics.totalListings > 0 ? (
        <section className="rounded-[28px] border border-dashed border-amber-200 bg-amber-50/70 px-5 py-4 text-sm text-amber-900 shadow-sm">
          <p className="font-semibold">No Feature Requests</p>
          <p className="mt-1">Feature your listing to reach more buyers.</p>
        </section>
      ) : null}

      <section id="your-listings" className="space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">Your Listings</h2>
            <p className="mt-1 text-sm text-slate-500">
              <span className="font-semibold text-slate-900">{formatCount(pagination.total)}</span>{" "}
              vehicle{pagination.total === 1 ? "" : "s"} in your inventory
            </p>
          </div>
          <SellerListingsSort value={sort} />
        </div>
        <SellerListingsSection initialItems={items} initialPagination={pagination} />
      </section>
    </main>
  );
}
