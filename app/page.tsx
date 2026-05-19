import Link from "next/link";
import { VehicleCard } from "@/app/components/vehicle-card";
import { listVehicles } from "@/lib/vehicle-store";

const categories = ["LCV", "Truck", "Tipper", "Pickup", "Trailer"];

export default function Home() {
  const featuredVehicles = listVehicles().slice(0, 3);

  return (
    <div className="space-y-6 pb-8 sm:space-y-8">
      <section className="rounded-3xl bg-gradient-to-br from-slate-900 to-indigo-900 p-5 text-white shadow-lg sm:p-8">
        <p className="mb-3 inline-flex rounded-full bg-white/15 px-3 py-1 text-xs font-medium">Verified Repo Stock</p>
        <h1 className="text-2xl font-semibold leading-tight sm:text-4xl">Find repossessed commercial vehicles across India</h1>
        <p className="mt-3 max-w-2xl text-sm text-slate-200 sm:text-base">
          A clean marketplace for transporters, contractors, and fleet owners to discover bank-seized trucks, tippers, and pickups.
        </p>
        <form action="/vehicles" className="mt-5 flex gap-2 rounded-2xl bg-white p-2 shadow-inner">
          <input
            name="search"
            placeholder="Search Tata 407, Pune, HDFC..."
            className="h-11 w-full rounded-xl border border-slate-200 px-3 text-sm text-slate-900"
          />
          <button type="submit" className="h-11 rounded-xl bg-indigo-600 px-4 text-sm font-semibold text-white">
            Search
          </button>
        </form>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-slate-900">Vehicle categories</h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
          {categories.map((category) => (
            <Link
              key={category}
              href={`/vehicles?vehicleType=${encodeURIComponent(category)}`}
              className="rounded-2xl bg-white p-4 text-center text-sm font-medium text-slate-700 shadow-sm ring-1 ring-slate-200"
            >
              {category}
            </Link>
          ))}
        </div>
      </section>

      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-900">Featured repossessed vehicles</h2>
          <Link href="/vehicles" className="text-sm font-medium text-indigo-600">
            View all
          </Link>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {featuredVehicles.map((vehicle) => (
            <VehicleCard key={vehicle.id} vehicle={vehicle} />
          ))}
        </div>
      </section>

      <section className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200 sm:p-6">
        <h2 className="text-lg font-semibold text-slate-900">Why buyers trust RepoMandi</h2>
        <div className="mt-4 grid gap-3 text-sm text-slate-600 sm:grid-cols-3">
          <p className="rounded-xl bg-slate-50 p-3">Admin-reviewed listing statuses: Pending, Verified, Rejected, Sold.</p>
          <p className="rounded-xl bg-slate-50 p-3">Clear yard locations, finance details, and seller phone verification.</p>
          <p className="rounded-xl bg-slate-50 p-3">Instant call and WhatsApp inquiry buttons to move deals offline quickly.</p>
        </div>
      </section>
    </div>
  );
}
