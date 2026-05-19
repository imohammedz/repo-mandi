import { VehicleCard } from "@/app/components/vehicle-card";
import { getFilterOptions, listVehicles } from "@/lib/vehicle-store";

type SearchParams = Record<string, string | string[] | undefined>;

const readParam = (value: string | string[] | undefined) => (Array.isArray(value) ? value[0] : value) ?? "";

export default async function VehiclesPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const resolvedParams = await searchParams;
  const filters = {
    search: readParam(resolvedParams.search),
    vehicleType: readParam(resolvedParams.vehicleType),
    brand: readParam(resolvedParams.brand),
    city: readParam(resolvedParams.city),
    state: readParam(resolvedParams.state),
    financeCompany: readParam(resolvedParams.financeCompany),
    verificationStatus: readParam(resolvedParams.verificationStatus),
    minPrice: Number(readParam(resolvedParams.minPrice)) || undefined,
    maxPrice: Number(readParam(resolvedParams.maxPrice)) || undefined,
  };

  const vehicles = listVehicles(filters);
  const options = getFilterOptions();

  return (
    <div className="space-y-5 pb-8">
        <section className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200 sm:p-5">
          <h1 className="text-xl font-semibold text-slate-900">Browse listings</h1>
          <form className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
            <input
              name="search"
              defaultValue={filters.search}
              placeholder="Search"
              className="col-span-2 h-11 rounded-xl border border-slate-300 px-3 text-sm"
            />
            <select name="vehicleType" defaultValue={filters.vehicleType} className="h-11 rounded-xl border border-slate-300 px-3 text-sm">
              <option value="">Vehicle type</option>
              {options.vehicleTypes.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
            <select name="brand" defaultValue={filters.brand} className="h-11 rounded-xl border border-slate-300 px-3 text-sm">
              <option value="">Brand</option>
              {options.brands.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
            <select name="city" defaultValue={filters.city} className="h-11 rounded-xl border border-slate-300 px-3 text-sm">
              <option value="">City</option>
              {options.cities.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
            <select name="state" defaultValue={filters.state} className="h-11 rounded-xl border border-slate-300 px-3 text-sm">
              <option value="">State</option>
              {options.states.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
            <select
              name="financeCompany"
              defaultValue={filters.financeCompany}
              className="h-11 rounded-xl border border-slate-300 px-3 text-sm"
            >
              <option value="">Finance company</option>
              {options.financeCompanies.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
            <select
              name="verificationStatus"
              defaultValue={filters.verificationStatus}
              className="h-11 rounded-xl border border-slate-300 px-3 text-sm"
            >
              <option value="">Verification</option>
              <option value="VERIFIED">Verified</option>
              <option value="UNVERIFIED">Unverified</option>
              <option value="REJECTED">Rejected</option>
            </select>
            <input name="minPrice" defaultValue={filters.minPrice} placeholder="Min ₹" className="h-11 rounded-xl border border-slate-300 px-3 text-sm" />
            <input name="maxPrice" defaultValue={filters.maxPrice} placeholder="Max ₹" className="h-11 rounded-xl border border-slate-300 px-3 text-sm" />
            <button type="submit" className="col-span-2 h-11 rounded-xl bg-indigo-600 text-sm font-semibold text-white sm:col-span-1">
              Apply filters
            </button>
          </form>
        </section>

        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {vehicles.length > 0 ? (
            vehicles.map((vehicle) => <VehicleCard key={vehicle.id} vehicle={vehicle} />)
          ) : (
            <p className="col-span-full rounded-2xl bg-white p-6 text-center text-sm text-slate-500 shadow-sm ring-1 ring-slate-200">
              No listings matched your filters.
            </p>
          )}
        </section>
    </div>
  );
}
