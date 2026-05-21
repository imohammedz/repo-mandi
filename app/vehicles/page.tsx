import { ChevronDown } from "lucide-react";
import { FilterDrawer } from "@/components/ui/filter-drawer";
import { SearchBar } from "@/components/ui/search-bar";
import { VehicleCard } from "@/components/ui/vehicle-card";
import { db } from "@/lib/db";
import { vehicles as vehiclesTable } from "@/lib/schema";
import { dbToVehicle } from "@/lib/mappers";
import { and, desc, eq, gte, ilike, lte, ne } from "drizzle-orm";

export const dynamic = "force-dynamic";

export default async function VehicleListingPage({
  searchParams,
}: {
  searchParams: Promise<{
    type?: string;
    brand?: string;
    city?: string;
    state?: string;
    financeCompany?: string;
    minPrice?: string;
    maxPrice?: string;
    verifiedOnly?: string;
  }>;
}) {
  const params = await searchParams;
  const conditions = [
    eq(vehiclesTable.isPublished, true),
    eq(vehiclesTable.listingStatus, "VERIFIED"),
    ne(vehiclesTable.listingStatus, "SOLD"),
  ];

  if (params.type) conditions.push(eq(vehiclesTable.type, params.type as typeof vehiclesTable.type._.data));
  if (params.brand) conditions.push(ilike(vehiclesTable.brand, `%${params.brand}%`));
  if (params.city) conditions.push(ilike(vehiclesTable.city, `%${params.city}%`));
  if (params.state) conditions.push(ilike(vehiclesTable.state, `%${params.state}%`));
  if (params.financeCompany) conditions.push(ilike(vehiclesTable.financeCompany, `%${params.financeCompany}%`));
  if (params.minPrice) conditions.push(gte(vehiclesTable.price, params.minPrice));
  if (params.maxPrice) conditions.push(lte(vehiclesTable.price, params.maxPrice));
  if (params.verifiedOnly === "1") conditions.push(eq(vehiclesTable.sellerVerified, true));

  const vehicleList = await db
    .select()
    .from(vehiclesTable)
    .where(and(...conditions))
    .orderBy(desc(vehiclesTable.createdAt));

  const appVehicles = vehicleList.map(dbToVehicle);

  return (
    <main className="space-y-4 px-4 pb-8 pt-4">
      <header className="sticky top-0 z-20 -mx-4 border-b border-slate-100 bg-slate-50 px-4 pb-3 pt-2">
        <SearchBar compact />
        <div className="mt-3 flex items-center justify-between gap-2">
          <FilterDrawer />
          <button className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-medium text-slate-700 shadow-sm">
            Sort: Latest <ChevronDown className="h-4 w-4" />
          </button>
        </div>
      </header>

      <section className="space-y-2">
        <div className="flex items-center justify-between">
          <p className="text-sm text-slate-600">
            <span className="font-semibold text-slate-900">{appVehicles.length}</span> listings found
          </p>
        </div>
      </section>

      <section className="space-y-4">
        {appVehicles.map((vehicle) => (
          <VehicleCard key={vehicle.id} vehicle={vehicle} compact />
        ))}
      </section>

      <div className="flex items-center justify-center gap-2 pt-2">
        <button className="min-h-11 rounded-xl border border-slate-200 bg-white px-4 text-sm text-slate-700">Previous</button>
        <button className="min-h-11 rounded-xl bg-slate-900 px-4 text-sm font-semibold text-white">1</button>
        <button className="min-h-11 rounded-xl border border-slate-200 bg-white px-4 text-sm text-slate-700">2</button>
        <button className="min-h-11 rounded-xl border border-slate-200 bg-white px-4 text-sm text-slate-700">Next</button>
      </div>
    </main>
  );
}
