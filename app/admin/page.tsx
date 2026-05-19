import { revalidatePath } from "next/cache";
import { parseListingStatus } from "@/lib/validation";
import { listVehicles, updateListingStatus } from "@/lib/vehicle-store";

async function statusAction(formData: FormData) {
  "use server";

  const id = String(formData.get("id") ?? "");
  const status = parseListingStatus(formData.get("status"));
  updateListingStatus(id, status);
  revalidatePath("/admin");
  revalidatePath("/vehicles");
}

export default function AdminDashboardPage() {
  const pendingListings = listVehicles().filter((vehicle) => vehicle.status === "PENDING");

  return (
    <div className="space-y-4 pb-8">
      <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200 sm:p-5">
        <h1 className="text-xl font-semibold text-slate-900">Admin dashboard</h1>
        <p className="text-sm text-slate-500">Review pending submissions and update verification state.</p>
      </div>

      <div className="space-y-3">
        {pendingListings.length > 0 ? (
          pendingListings.map((vehicle) => (
            <div key={vehicle.id} className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200">
              <h2 className="font-semibold text-slate-900">{vehicle.title}</h2>
              <p className="text-sm text-slate-500">
                {vehicle.city}, {vehicle.state} · {vehicle.financeCompany}
              </p>
              <div className="mt-3 grid grid-cols-2 gap-2 sm:flex">
                <form action={statusAction}>
                  <input type="hidden" name="id" value={vehicle.id} />
                  <input type="hidden" name="status" value="VERIFIED" />
                  <button className="w-full rounded-xl bg-emerald-600 px-3 py-2 text-sm font-semibold text-white">Approve</button>
                </form>
                <form action={statusAction}>
                  <input type="hidden" name="id" value={vehicle.id} />
                  <input type="hidden" name="status" value="REJECTED" />
                  <button className="w-full rounded-xl bg-rose-600 px-3 py-2 text-sm font-semibold text-white">Reject</button>
                </form>
                <form action={statusAction}>
                  <input type="hidden" name="id" value={vehicle.id} />
                  <input type="hidden" name="status" value="SOLD" />
                  <button className="w-full rounded-xl bg-slate-700 px-3 py-2 text-sm font-semibold text-white">Mark sold</button>
                </form>
              </div>
            </div>
          ))
        ) : (
          <p className="rounded-2xl bg-white p-5 text-sm text-slate-500 shadow-sm ring-1 ring-slate-200">No pending listings.</p>
        )}
      </div>
    </div>
  );
}
