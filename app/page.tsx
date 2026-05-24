import Link from "next/link";
import { BadgeCheck, Building2, CircleDollarSign, Truck } from "lucide-react";
import { SearchBar } from "@/components/ui/search-bar";
import { VehicleCard } from "@/components/ui/vehicle-card";
import { featuredVehicles, vehicleCategories } from "@/data/vehicles";
import { db } from "@/lib/db";
import { vehicles as vehiclesTable } from "@/lib/schema";
import { dbToVehicle } from "@/lib/mappers";
import { and, desc, eq } from "drizzle-orm";
import type { Vehicle } from "@/types/vehicle";

const trustItems = [
  { title: "Verified Listings", icon: BadgeCheck },
  { title: "Inspection Support", icon: Truck },
  { title: "Direct Seller Contact", icon: Building2 },
  { title: "Transparent Information", icon: CircleDollarSign },
];

export const revalidate = 60;

export default async function HomePage() {
  let recentVehicles: Vehicle[] = [];
  try {
    const recentListingsRows = await db
      .select()
      .from(vehiclesTable)
      .where(and(eq(vehiclesTable.isPublished, true), eq(vehiclesTable.listingStatus, "VERIFIED")))
      .orderBy(desc(vehiclesTable.createdAt))
      .limit(3);
    recentVehicles = recentListingsRows.map(dbToVehicle);
  } catch (error) {
    if (
      !(error instanceof Error &&
        error.message.includes("DATABASE_URL environment variable is not set."))
    ) {
      console.error("Failed to load recent listings on homepage", error);
    }
  }

  return (
    <div>
      <main className="space-y-10 px-4 pb-8 pt-6">
        <section className="space-y-4">
          <h1 className="text-3xl font-semibold leading-tight text-slate-900">
            Verified Bank-Seized Commercial Vehicles
          </h1>
          <p className="text-sm leading-6 text-slate-600">
            Discover verified repossessed trucks, tippers and pickups across India with transparent pricing and direct contact.
          </p>
          <SearchBar />
          <div className="flex flex-wrap gap-2">
            {vehicleCategories.slice(0, 5).map((category) => (
              <button
                key={category}
                className="min-h-10 rounded-full border border-slate-200 bg-white px-4 text-xs font-medium text-slate-700"
              >
                {category}
              </button>
            ))}
          </div>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold text-slate-900">Vehicle Categories</h2>
          <div className="grid grid-cols-2 gap-3">
            {vehicleCategories.map((category) => (
              <article key={category} className="rounded-2xl border border-slate-100 bg-white p-4 text-center shadow-sm">
                <Truck className="mx-auto h-5 w-5 text-slate-700" />
                <p className="mt-2 text-sm font-medium text-slate-800">{category}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-slate-900">Featured Verified Listings</h2>
            <Link href="/vehicles" className="text-sm font-medium text-slate-700">
              View all
            </Link>
          </div>
          <div className="space-y-4">
            {featuredVehicles.map((vehicle) => (
              <VehicleCard key={vehicle.id} vehicle={vehicle} compact />
            ))}
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
          <div className="space-y-4">
            {recentVehicles.length > 0 ? (
              recentVehicles.map((vehicle) => (
                <VehicleCard key={vehicle.id} vehicle={vehicle} compact />
              ))
            ) : (
              <p className="text-sm text-slate-500">No recent listings yet.</p>
            )}
          </div>
        </section>

        <section className="rounded-2xl bg-slate-900 p-5 text-white shadow-sm">
          <h3 className="text-xl font-semibold">List your vehicle in minutes</h3>
          <p className="mt-2 text-sm text-slate-200">Get buyer leads quickly with verification support and transparent updates.</p>
          <Link
            href="/sell"
            className="mt-4 inline-flex min-h-11 items-center rounded-xl bg-white px-4 text-sm font-semibold text-slate-900"
          >
            Sell Vehicle
          </Link>
        </section>

        <footer className="pb-2 pt-3 text-xs text-slate-500">© 2026 RepoMandi • Built for Indian trucking marketplace</footer>
      </main>
    </div>
  );
}
