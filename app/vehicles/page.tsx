import { ChevronDown } from "lucide-react";
import { FilterDrawer } from "@/components/ui/filter-drawer";
import { SearchBar } from "@/components/ui/search-bar";
import { VehicleCard } from "@/components/ui/vehicle-card";
import { vehicles } from "@/data/vehicles";

const activeFilters = ["Truck", "Maharashtra", "Verified Only", "Under ₹20L"];

export default function VehicleListingPage() {
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
            <span className="font-semibold text-slate-900">{vehicles.length}</span> listings found
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {activeFilters.map((filter) => (
            <span key={filter} className="rounded-full bg-slate-200 px-3 py-1 text-xs font-medium text-slate-700">
              {filter}
            </span>
          ))}
        </div>
      </section>

      <section className="space-y-4">
        {vehicles.map((vehicle) => (
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
