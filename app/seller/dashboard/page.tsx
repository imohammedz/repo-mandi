import Link from "next/link";
import { StatsCard } from "@/components/ui/stats-card";
import { db } from "@/lib/db";
import { featureRequests, vehicles as vehiclesTable } from "@/lib/schema";
import { dbToVehicle } from "@/lib/mappers";
import { and, desc, eq, inArray, isNull } from "drizzle-orm";
import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import { SellerListingsSection } from "../listings/seller-listings-section";

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

  // Fetch latest feature request status per vehicle
  const featureRequestRows =
    vehicleIds.length === 0
      ? []
      : await db
          .select({ vehicleId: featureRequests.vehicleId, status: featureRequests.status })
          .from(featureRequests)
          .where(
            and(
              eq(featureRequests.sellerId, currentUser.id),
              inArray(featureRequests.vehicleId, vehicleIds),
            ),
          )
          .orderBy(desc(featureRequests.createdAt));

  // Keep only the latest request per vehicle
  const latestFeatureStatusByVehicle = new Map<string, string>();
  for (const row of featureRequestRows) {
    if (!latestFeatureStatusByVehicle.has(row.vehicleId)) {
      latestFeatureStatusByVehicle.set(row.vehicleId, row.status);
    }
  }

  const total = vehicleList.length;
  const active = vehicleList.filter((v) => v.listingStatus === "VERIFIED").length;
  const sold = vehicleList.filter((v) => v.listingStatus === "SOLD").length;
  const pending = vehicleList.filter(
    (v) => v.listingStatus === "PENDING" || v.listingStatus === "BANK_PENDING_REVIEW",
  ).length;
  const totalInquiries = vehicleList.reduce((acc, v) => acc + v.inquiries, 0);

  const stats = [
    { label: "Total listings", value: String(total) },
    { label: "Active", value: String(active) },
    { label: "Pending", value: String(pending) },
    { label: "Sold", value: String(sold) },
    { label: "Total inquiries", value: String(totalInquiries) },
  ];

  const now = new Date();
  const listings = vehicleList.map((vehicle) => {
    const featuredExpiry = vehicle.featuredExpiresAt ? new Date(vehicle.featuredExpiresAt) : null;
    const isFeaturedActive = Boolean(vehicle.isFeatured) && (!featuredExpiry || featuredExpiry > now);
    const featuredUntil = vehicle.featuredExpiresAt ?? null;

    type FeatureStatus = "FEATURED" | "PENDING" | "REJECTED" | "NONE";
    let featureStatus: FeatureStatus = "NONE";
    if (isFeaturedActive) {
      featureStatus = "FEATURED";
    } else {
      const latestStatus = latestFeatureStatusByVehicle.get(vehicle.id);
      if (latestStatus === "PENDING") featureStatus = "PENDING";
      else if (latestStatus === "REJECTED") featureStatus = "REJECTED";
    }

    return { vehicle, featureStatus, featuredUntil };
  });

  return (
    <main className="space-y-5 px-4 pb-8 pt-4">
      <header className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-slate-900">Seller Dashboard</h1>
        <Link
          href="/seller/listings/new"
          className="inline-flex min-h-11 items-center rounded-xl bg-slate-900 px-4 text-sm font-semibold text-white"
        >
          Add Vehicle
        </Link>
      </header>

      <section className="grid grid-cols-3 gap-3 sm:grid-cols-5">
        {stats.map((item) => (
          <StatsCard key={item.label} label={item.label} value={item.value} />
        ))}
      </section>

      {/* Feature CTA banner */}
      <section className="rounded-2xl border border-amber-200 bg-gradient-to-r from-amber-50 to-orange-50 p-4 shadow-sm">
        <div className="space-y-2">
          <h2 className="text-lg font-semibold text-amber-950">🚀 Get Seen by More Buyers</h2>
          <p className="text-sm text-amber-900/90">Feature your listing to appear:</p>
          <ul className="space-y-1 text-sm text-amber-900/90">
            <li>✓ Home Page</li>
            <li>✓ Top of Search Results</li>
            <li>✓ Featured Listings</li>
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

      {/* Listings */}
      <section id="your-listings" className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold text-slate-900">Your Listings</h2>
          <p className="text-xs text-slate-500">{total} listing{total !== 1 ? "s" : ""}</p>
        </div>
        <SellerListingsSection listings={listings} />
      </section>
    </main>
  );
}

