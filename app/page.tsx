import Link from "next/link";
import Image from "next/image";
import { Suspense } from "react";
import { HomeSellTruckBanner } from "@/components/ui/home-sell-truck-banner";
import { SearchBar } from "@/components/ui/search-bar";
import { CategorySelector } from "@/components/ui/category-selector";
import { VehicleCard } from "@/components/ui/vehicle-card";
import { db } from "@/lib/db";
import { vehicles as vehiclesTable } from "@/lib/schema";
import { dbToVehicle } from "@/lib/mappers";
import { and, desc, eq, gt, isNull, ne, or } from "drizzle-orm";
import type { Vehicle } from "@/types/vehicle";


export const revalidate = 60;

export default async function HomePage() {
  let featuredListingVehicles: Vehicle[] = [];
  let recentVehicles: Vehicle[] = [];
  if (!process.env.DATABASE_URL) {
    console.warn("Skipping homepage listings because DATABASE_URL is not configured.");
  } else {
    try {
      const now = new Date();
      const featuredListingsRows = await db
        .select()
        .from(vehiclesTable)
        .where(
          and(
            eq(vehiclesTable.isFeatured, true),
            eq(vehiclesTable.listingStatus, "VERIFIED"),
            eq(vehiclesTable.isPublished, true),
            ne(vehiclesTable.status, "SOLD"),
            isNull(vehiclesTable.deletedAt),
            or(
              gt(vehiclesTable.featuredExpiresAt, now),
              isNull(vehiclesTable.featuredExpiresAt),
            ),
          ),
        )
        .orderBy(desc(vehiclesTable.featuredAt), desc(vehiclesTable.updatedAt))
        .limit(3);
      featuredListingVehicles = featuredListingsRows.map(dbToVehicle);

      const recentListingsRows = await db
        .select()
        .from(vehiclesTable)
        .where(
          and(
            eq(vehiclesTable.isPublished, true),
            eq(vehiclesTable.listingStatus, "VERIFIED"),
            isNull(vehiclesTable.deletedAt)
          )
        )
        .orderBy(desc(vehiclesTable.createdAt))
        .limit(3);
      recentVehicles = recentListingsRows.map(dbToVehicle);
    } catch (error) {
      console.error("Failed to load listings on homepage", error);
    }
  }

  return (
    <div className="w-full overflow-x-clip">
      {/* Sections above the sticky banner: hero, featured listings, recent listings */}
      <div className="space-y-10 px-4 pb-0 pt-6">
        <section className="space-y-3">
          <div className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm">
            <Image
              src="https://github.com/user-attachments/assets/f5556275-0d6e-4c73-8d55-557439055d24"
              alt="Buy commercial vehicles directly"
              width={1707}
              height={923}
              sizes="(max-width: 768px) 100vw, 1200px"
              className="h-auto w-full"
              priority
            />
          </div>
          <SearchBar />
          <Suspense>
            <CategorySelector />
          </Suspense>
        </section>

        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-slate-900">Featured Verified Listings</h2>
            <Link href="/vehicles" className="text-sm font-medium text-slate-700">
              View all
            </Link>
          </div>
          <div className="w-full max-w-full space-y-2 overflow-x-clip">
            {featuredListingVehicles.length > 0 ? (
              featuredListingVehicles.map((vehicle) => (
                <VehicleCard key={vehicle.id} vehicle={vehicle} compact />
              ))
            ) : (
              <p className="text-sm text-slate-500">No featured listings yet.</p>
            )}
          </div>
        </section>

        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-slate-900">Recent Listings</h2>
            <Link href="/vehicles" className="text-sm font-medium text-slate-700">
              Load More Listings
            </Link>
          </div>
          <div className="w-full max-w-full space-y-2 overflow-x-clip">
            {recentVehicles.length > 0 ? (
              recentVehicles.map((vehicle) => (
                <VehicleCard key={vehicle.id} vehicle={vehicle} compact />
              ))
            ) : (
              <p className="text-sm text-slate-500">No recent listings yet.</p>
            )}
          </div>
        </section>
      </div>

      {/* Why trust us section */}
      <section className="mt-10 px-4 pb-8">
        <div className="rounded-2xl border border-slate-100 bg-white shadow-sm overflow-hidden">
          <Image
            src="https://github.com/user-attachments/assets/d8ade89f-139f-4071-b72a-7d2dbdce9d84"
            alt="Why trust us"
            width={1455}
            height={835}
            className="w-full h-auto"
          />
        </div>
      </section>

      <section className="px-4 pb-8">
        <Link
          href="/bank-inquiry"
          className="block overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm"
          aria-label="Know more about RepoMandi bank partner program"
        >
          <Image
            src="https://github.com/user-attachments/assets/e8032d45-7ee7-44c6-bc86-c4a90192a1c9"
            alt="For bank partners know more"
            width={1707}
            height={923}
            className="h-auto w-full"
          />
        </Link>
      </section>

      <HomeSellTruckBanner />
    </div>
  );
}
