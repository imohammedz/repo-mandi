import Link from "next/link";
import { listVehicles } from "@/lib/vehicle-store";

export default function ProducerDashboardPage() {
  const listings = listVehicles();

  return (
    <div className="space-y-4 pb-8">
      <div className="flex items-center justify-between rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200 sm:p-5">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">Producer dashboard</h1>
          <p className="text-sm text-slate-500">Manage submitted repossessed vehicle inventory.</p>
        </div>
        <Link href="/producer/add" className="rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white">
          Add listing
        </Link>
      </div>

      <div className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-slate-200">
        <table className="min-w-full text-left text-sm">
          <thead className="bg-slate-50 text-xs uppercase text-slate-500">
            <tr>
              <th className="px-4 py-3">Vehicle</th>
              <th className="px-4 py-3">Location</th>
              <th className="px-4 py-3">Status</th>
            </tr>
          </thead>
          <tbody>
            {listings.map((listing) => (
              <tr key={listing.id} className="border-t border-slate-100">
                <td className="px-4 py-3 font-medium text-slate-800">{listing.title}</td>
                <td className="px-4 py-3 text-slate-600">
                  {listing.city}, {listing.state}
                </td>
                <td className="px-4 py-3 text-slate-700">{listing.status}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
