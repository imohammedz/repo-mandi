import Link from "next/link";
import {
  BadgeCheck,
  Building2,
  CircleDollarSign,
  Truck,
} from "lucide-react";
import { SearchBar } from "@/components/ui/search-bar";
import { CategorySelector } from "@/components/ui/category-selector";
import { VehicleCard } from "@/components/ui/vehicle-card";
import { db } from "@/lib/db";
import { vehicles as vehiclesTable } from "@/lib/schema";
import { dbToVehicle } from "@/lib/mappers";
import { and, desc, eq, gt, isNull, ne, or } from "drizzle-orm";
import type { Vehicle } from "@/types/vehicle";

const trustItems = [
  { title: "Verified Listings", icon: BadgeCheck },
  { title: "Inspection Support", icon: Truck },
  { title: "Direct Seller Contact", icon: Building2 },
  { title: "Transparent Information", icon: CircleDollarSign },
];

export const revalidate = 60;

export default async function HomePage() {
  let featuredListingVehicles: Vehicle[] = [];
  let recentVehicles: Vehicle[] = [];
  if (!process.env.DATABASE_URL) {
    console.warn("Skipping homepage recent listings because DATABASE_URL is not configured.");
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
      console.error("Failed to load recent listings on homepage", error);
    }
  }

  return (
    <div className="w-full max-w-full overflow-x-hidden">
      <main className="w-full max-w-full space-y-10 overflow-x-hidden px-4 pb-8 pt-6">
        <section className="space-y-3">
          <h1 className="text-3xl font-semibold leading-tight text-slate-900">
            Verified Bank-Seized Commercial Vehicles
          </h1>
          <p className="text-sm leading-6 text-slate-600">
            Discover verified repossessed trucks, tippers and pickups across India with transparent pricing and direct contact.
          </p>
          <SearchBar />
          <CategorySelector />
        </section>

        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-slate-900">Featured Verified Listings</h2>
            <Link href="/vehicles" className="text-sm font-medium text-slate-700">
              View all
            </Link>
          </div>
          <div className="w-full max-w-full space-y-2 overflow-x-hidden">
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
          <h2 className="text-xl font-semibold text-slate-900">Why trust us</h2>
          <div className="grid grid-cols-2 gap-3">
            {trustItems.map((item) => {
              const Icon = item.icon;
              return (
                <article key={item.title} className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
                  <Icon className="h-5 w-5 text-slate-700" />
                  <p className="mt-2 text-sm font-medium text-slate-800">{item.title}</p>
                </article>
              );
            })}
          </div>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold text-slate-900">Recent Listings</h2>
          <div className="w-full max-w-full space-y-2 overflow-x-hidden">
            {recentVehicles.length > 0 ? (
              recentVehicles.map((vehicle) => (
                <VehicleCard key={vehicle.id} vehicle={vehicle} compact />
              ))
            ) : (
              <p className="text-sm text-slate-500">No recent listings yet.</p>
            )}
          </div>
        </section>

        <footer className="pb-2 pt-3 text-xs text-slate-500">© 2026 RepoMandi • Built for Indian trucking marketplace • Developed in Los Angeles, California</footer>
      </main>
    </div>
  );
}
