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
          <h1 className="text-3xl font-semibold leading-tight text-slate-900">
            Verified Bank-Seized Commercial Vehicles
          </h1>
          <p className="text-sm leading-6 text-slate-600">
            Discover verified repossessed trucks, tippers and pickups across India with transparent pricing and direct contact.
          </p>
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
            src="https://github.com/user-attachments/assets/2258521d-f557-4376-a600-147d0f6b245e"
            alt="Why trust us"
            width={800}
            height={400}
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
            src="https://github.com/user-attachments/assets/86f809bc-9a47-47ae-8d8d-35c61dd2df7e"
            alt="For bank partners know more"
            width={1536}
            height={1018}
            className="h-auto w-full"
          />
        </Link>
      </section>

      <HomeSellTruckBanner />
    </div>
  );
}
