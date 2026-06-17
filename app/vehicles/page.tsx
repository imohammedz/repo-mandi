import { FilterDrawer } from "@/components/ui/filter-drawer";
import { SearchBar } from "@/components/ui/search-bar";
import { VehicleListingsResults } from "@/components/ui/vehicle-listings-results";
import { VehicleSort } from "@/components/ui/vehicle-sort";
import { getPaginatedPublicVehicleListings, getVehicleListingLimit, getVehicleListingPage, type VehicleListingSearchParams } from "@/lib/vehicle-listings";

export const dynamic = "force-dynamic";

export default async function VehicleListingPage({
  searchParams,
}: {
  searchParams: Promise<VehicleListingSearchParams>;
}) {
  const params = await searchParams;
  const page = getVehicleListingPage(params.page);
  const limit = getVehicleListingLimit(params.limit);
  const { items, pagination } = await getPaginatedPublicVehicleListings(params, {
    page,
    limit,
    includePagesUpToCurrent: true,
  });
  const sort = params.sort ?? "newest";
  const listingStateKey = JSON.stringify(params);

  return (
    <main className="w-full max-w-full space-y-4 overflow-x-hidden px-4 pb-8 pt-4">
      <header className="sticky top-0 z-50 isolate -mx-4 border-b border-slate-100 bg-slate-50 px-4 pb-3 pt-2">
        <SearchBar compact />
        <div className="mt-3 flex items-center justify-between gap-2">
          <FilterDrawer />
          <VehicleSort value={sort} />
        </div>
      </header>

      <VehicleListingsResults key={listingStateKey} initialItems={items} initialPagination={pagination} />
    </main>
  );
}
