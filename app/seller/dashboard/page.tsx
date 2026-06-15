import Link from "next/link";
import { StatsCard } from "@/components/ui/stats-card";
import { StatusBadge } from "@/components/ui/status-badge";
import { formatCurrency } from "@/data/vehicles";
import { db } from "@/lib/db";
import { featureRequests, vehicles as vehiclesTable } from "@/lib/schema";
import { dbToVehicle } from "@/lib/mappers";
import { and, desc, eq, inArray, isNull } from "drizzle-orm";
import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import { FeatureListingButton } from "../listings/feature-listing-button";
import { ListingActionsMenu } from "../listings/listing-actions-menu";

export const dynamic = "force-dynamic";

export default async function SellerDashboardPage() {
  const currentUser = await getCurrentUser();
  if (!currentUser) redirect("/auth/login");
  if (!["SELLER", "BANK_PARTNER", "ADMIN"].includes(currentUser.accountType)) redirect("/sell");
  if (!currentUser.isProfileComplete) redirect("/onboarding");

  const rows = await db
    .select()
    .from(vehiclesTable)
    .where(and(eq(vehiclesTable.sellerId, currentUser.id), isNull(vehiclesTable.deletedAt)))
    .orderBy(desc(vehiclesTable.createdAt));
  const vehicleList = rows.map(dbToVehicle);
  const vehicleIds = rows.map((row) => row.id);
  const pendingFeatureRequests =
    vehicleIds.length === 0
      ? []
      : await db
          .select({ vehicleId: featureRequests.vehicleId })
          .from(featureRequests)
          .where(
            and(
              eq(featureRequests.sellerId, currentUser.id),
              eq(featureRequests.status, "PENDING"),
              inArray(featureRequests.vehicleId, vehicleIds),
            ),
          );
  const pendingFeatureRequestVehicleIds = new Set(pendingFeatureRequests.map((row) => row.vehicleId));

  const total = vehicleList.length;
  const pending = vehicleList.filter((v) => v.listingStatus === "PENDING" || v.listingStatus === "BANK_PENDING_REVIEW").length;
  const verified = vehicleList.filter((v) => v.listingStatus === "VERIFIED").length;
  const sold = vehicleList.filter((v) => v.listingStatus === "SOLD").length;
  const totalInquiries = vehicleList.reduce((acc, v) => acc + v.inquiries, 0);

  const stats = [
    { label: "Total listings", value: String(total) },
    { label: "Pending", value: String(pending) },
    { label: "Verified", value: String(verified) },
    { label: "Sold", value: String(sold) },
    { label: "Total inquiries", value: String(totalInquiries) },
  ];

  const formatFeaturedLabel = (featuredUntil?: string | null) => {
    if (!featuredUntil) return "⭐ Featured";
    const formatted = new Date(featuredUntil).toLocaleDateString("en-GB");
    return `⭐ Featured Until ${formatted}`;
  };

  return (
    <main className="space-y-5 px-4 pb-8 pt-4">
      <header className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-slate-900">Seller Dashboard</h1>
        <Link href="/seller/listings/new" className="inline-flex min-h-11 items-center rounded-xl bg-slate-900 px-4 text-sm font-semibold text-white">
          Add Vehicle
        </Link>
      </header>

      <section className="grid grid-cols-2 gap-3">
        {stats.map((item) => (
          <StatsCard key={item.label} label={item.label} value={item.value} />
        ))}
      </section>

      <section className="rounded-2xl border border-amber-200 bg-gradient-to-r from-amber-50 to-orange-50 p-4 shadow-sm">
        <div className="space-y-2">
          <h2 className="text-lg font-semibold text-amber-950">🚀 Get Seen by More Buyers</h2>
          <p className="text-sm text-amber-900/90">
            Feature your listing to appear:
          </p>
          <ul className="space-y-1 text-sm text-amber-900/90">
            <li>✓ On Home Page</li>
            <li>✓ At the Top of Search Results</li>
            <li>✓ In Featured Listings</li>
          </ul>
          <p className="text-sm text-amber-900/90">Increase visibility and get more buyer inquiries.</p>
        </div>
        <Link
          href="#your-listings"
          className="mt-4 inline-flex min-h-11 items-center rounded-xl bg-amber-500 px-4 text-sm font-semibold text-white hover:bg-amber-600"
        >
          ⭐ Feature My Listing
        </Link>
      </section>

      <section id="your-listings" className="space-y-3">
        <h2 className="text-base font-semibold text-slate-900">Your Listings</h2>
        {vehicleList.map((vehicle) => {
          const featuredUntil = vehicle.featuredExpiresAt ?? null;
          const featuredExpiry = featuredUntil ? new Date(featuredUntil) : null;
          const isFeatured = Boolean(vehicle.isFeatured) && (!featuredExpiry || featuredExpiry > new Date());
          const hasPendingRequest = pendingFeatureRequestVehicleIds.has(vehicle.id);
          const views = (vehicle as typeof vehicle & { views?: number }).views ?? 0;

          return (
            <article key={vehicle.id} className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="text-sm font-semibold text-slate-900">{vehicle.title}</h3>
                {isFeatured ? (
                  <p className="mt-1 text-xs font-medium text-amber-700">{formatFeaturedLabel(featuredUntil)}</p>
                ) : hasPendingRequest ? (
                  <p className="mt-1 text-xs font-medium text-slate-500">Feature Requested</p>
                ) : null}
                <p className="mt-1 text-xs text-slate-500">{formatCurrency(vehicle.price)}</p>
              </div>
              <div className="flex items-start gap-2">
                {vehicle.listingStatus ? <StatusBadge status={vehicle.listingStatus} /> : null}
                <ListingActionsMenu
                  vehicleId={vehicle.id}
                  title={vehicle.title}
                  price={vehicle.expectedPrice ?? vehicle.price}
                  location={[vehicle.city, vehicle.state].filter(Boolean).join(", ")}
                  canMarkSold={vehicle.listingStatus === "VERIFIED" || vehicle.listingStatus === "PENDING"}
                />
              </div>
            </div>
            <div className="mt-3 flex items-center justify-between text-xs text-slate-500">
              <span>{vehicle.inquiries} inquiries</span>
              <span>{views} views</span>
            </div>
            <div className="mt-3 grid grid-cols-2 gap-2">
              <FeatureListingButton
                listingId={vehicle.id}
                isFeatured={isFeatured}
                hasPendingRequest={hasPendingRequest}
                featuredUntil={featuredUntil}
                className="w-full"
              />
              <Link
                href={`/seller/leads?listing=${vehicle.id}`}
                className="inline-flex min-h-10 items-center justify-center rounded-lg border border-slate-200 bg-white px-3 text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                View Leads
              </Link>
            </div>
            </article>
          );
        })}
      </section>
    </main>
  );
}
