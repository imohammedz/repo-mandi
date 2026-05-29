import { FilterDrawer } from "@/components/ui/filter-drawer";
import { SearchBar } from "@/components/ui/search-bar";
import { VehicleCard } from "@/components/ui/vehicle-card";
import { VehicleSort } from "@/components/ui/vehicle-sort";
import { db } from "@/lib/db";
import { vehicles as vehiclesTable } from "@/lib/schema";
import { dbToVehicle } from "@/lib/mappers";
import { and, asc, desc, eq, gte, ilike, isNull, lte, ne, or, SQL } from "drizzle-orm";

export const dynamic = "force-dynamic";

export default async function VehicleListingPage({
  searchParams,
}: {
  searchParams: Promise<{
    q?: string;
    type?: string;
    listingType?: string;
    listingMode?: string;
    assetStructure?: string;
    detachableType?: string;
    assetCategory?: string;
    bodyType?: string;
    bodyApplicationType?: string;
    brand?: string;
    model?: string;
    location?: string;
    city?: string;
    state?: string;
    runningCondition?: string;
    repoStatus?: string;
    sellerRole?: string;
    financeCompany?: string;
    minPrice?: string;
    maxPrice?: string;
    verifiedOnly?: string;
    sort?: string;
  }>;
}) {
  const params = await searchParams;
  const conditions: SQL[] = [
    eq(vehiclesTable.isPublished, true),
    eq(vehiclesTable.listingStatus, "VERIFIED"),
    isNull(vehiclesTable.deletedAt),
    ne(vehiclesTable.status, "SOLD"),
  ];

  if (params.q) {
    conditions.push(
      or(
        ilike(vehiclesTable.title, `%${params.q}%`),
        ilike(vehiclesTable.brand, `%${params.q}%`),
        ilike(vehiclesTable.model, `%${params.q}%`),
        ilike(vehiclesTable.assetCategory, `%${params.q}%`),
        ilike(vehiclesTable.bodyApplicationType, `%${params.q}%`),
        ilike(vehiclesTable.vehicleOrYardLocation, `%${params.q}%`),
        ilike(vehiclesTable.yardLocation, `%${params.q}%`),
        ilike(vehiclesTable.city, `%${params.q}%`),
        ilike(vehiclesTable.state, `%${params.q}%`),
        ilike(vehiclesTable.vehicleRegistrationNumber, `%${params.q}%`)
      )!
    );
  }
  if (params.type) conditions.push(eq(vehiclesTable.type, params.type as typeof vehiclesTable.type._.data));
  if (params.listingType)
    conditions.push(eq(vehiclesTable.listingType, params.listingType as typeof vehiclesTable.listingType._.data));
  if (params.listingMode)
    conditions.push(eq(vehiclesTable.listingMode, params.listingMode as typeof vehiclesTable.listingMode._.data));
  if (params.assetStructure)
    conditions.push(eq(vehiclesTable.assetStructure, params.assetStructure as typeof vehiclesTable.assetStructure._.data));
  if (params.detachableType)
    conditions.push(eq(vehiclesTable.detachableType, params.detachableType as typeof vehiclesTable.detachableType._.data));
  if (params.assetCategory) conditions.push(ilike(vehiclesTable.assetCategory, `%${params.assetCategory}%`));
  if (params.bodyType) conditions.push(ilike(vehiclesTable.bodyType, `%${params.bodyType}%`));
  if (params.bodyApplicationType)
    conditions.push(ilike(vehiclesTable.bodyApplicationType, `%${params.bodyApplicationType}%`));
  if (params.brand) conditions.push(ilike(vehiclesTable.brand, `%${params.brand}%`));
  if (params.model) conditions.push(ilike(vehiclesTable.model, `%${params.model}%`));
  if (params.location) {
    conditions.push(
      or(
        ilike(vehiclesTable.vehicleOrYardLocation, `%${params.location}%`),
        ilike(vehiclesTable.yardLocation, `%${params.location}%`),
        ilike(vehiclesTable.city, `%${params.location}%`),
        ilike(vehiclesTable.state, `%${params.location}%`)
      )!
    );
  }
  if (params.city) conditions.push(ilike(vehiclesTable.city, `%${params.city}%`));
  if (params.state) conditions.push(ilike(vehiclesTable.state, `%${params.state}%`));
  if (params.runningCondition)
    conditions.push(eq(vehiclesTable.runningCondition, params.runningCondition as typeof vehiclesTable.runningCondition._.data));
  if (params.repoStatus) conditions.push(ilike(vehiclesTable.repoStatus, `%${params.repoStatus}%`));
  if (params.sellerRole) conditions.push(ilike(vehiclesTable.sellerRole, `%${params.sellerRole}%`));
  if (params.financeCompany) conditions.push(ilike(vehiclesTable.financeCompany, `%${params.financeCompany}%`));
  if (params.minPrice) conditions.push(gte(vehiclesTable.price, params.minPrice));
  if (params.maxPrice) conditions.push(lte(vehiclesTable.price, params.maxPrice));
  if (params.verifiedOnly === "1") conditions.push(eq(vehiclesTable.sellerVerified, true));

  const sort = params.sort ?? "newest";
  const orderBy =
    sort === "priceAsc"
      ? asc(vehiclesTable.price)
      : sort === "priceDesc"
        ? desc(vehiclesTable.price)
        : desc(vehiclesTable.createdAt);

  const vehicleList = await db
    .select()
    .from(vehiclesTable)
    .where(and(...conditions))
    .orderBy(orderBy);

  const appVehicles = vehicleList.map(dbToVehicle);

  return (
    <main className="space-y-4 px-4 pb-8 pt-4">
      <header className="sticky top-0 z-20 -mx-4 border-b border-slate-100 bg-slate-50 px-4 pb-3 pt-2">
        <SearchBar compact />
        <div className="mt-3 flex items-center justify-between gap-2">
          <FilterDrawer />
          <VehicleSort value={sort} />
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
        {appVehicles.length ? (
          appVehicles.map((vehicle) => <VehicleCard key={vehicle.id} vehicle={vehicle} compact />)
        ) : (
          <div className="rounded-2xl border border-slate-200 bg-white p-6 text-center">
            <p className="text-base font-semibold text-slate-900">No vehicles found</p>
            <a
              href="/vehicles"
              className="mt-3 inline-flex min-h-10 items-center rounded-xl border border-slate-200 px-4 text-sm font-medium text-slate-700"
            >
              Clear filters
            </a>
          </div>
        )}
      </section>
    </main>
  );
}
