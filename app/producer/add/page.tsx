import { redirect } from "next/navigation";
import { parseListingPayload } from "@/lib/validation";
import { submitVehicleListing } from "@/lib/vehicle-store";

async function submitAction(formData: FormData) {
  "use server";

  const payload = parseListingPayload({
    vehicleType: formData.get("vehicleType"),
    brand: formData.get("brand"),
    model: formData.get("model"),
    year: formData.get("year"),
    registrationState: formData.get("registrationState"),
    price: formData.get("price"),
    financeCompany: formData.get("financeCompany"),
    city: formData.get("city"),
    state: formData.get("state"),
    yardLocation: formData.get("yardLocation"),
    condition: formData.get("condition"),
    sellerName: formData.get("sellerName"),
    sellerPhone: formData.get("sellerPhone"),
  });

  submitVehicleListing(payload);

  redirect("/producer");
}

export default function AddVehiclePage() {
  return (
    <div className="pb-8">
      <form action={submitAction} className="space-y-4 rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200 sm:p-6">
        <h1 className="text-xl font-semibold text-slate-900">Add vehicle listing</h1>
        <div className="grid grid-cols-2 gap-3">
          <select name="vehicleType" className="h-11 rounded-xl border border-slate-300 px-3 text-sm" required>
            <option value="LCV">LCV</option>
            <option value="Truck">Truck</option>
            <option value="Tipper">Tipper</option>
            <option value="Pickup">Pickup</option>
            <option value="Trailer">Trailer</option>
          </select>
          <input name="brand" placeholder="Brand" className="h-11 rounded-xl border border-slate-300 px-3 text-sm" required />
          <input name="model" placeholder="Model" className="h-11 rounded-xl border border-slate-300 px-3 text-sm" required />
          <input name="year" placeholder="Year" type="number" className="h-11 rounded-xl border border-slate-300 px-3 text-sm" required />
          <input name="registrationState" placeholder="Registration state" className="h-11 rounded-xl border border-slate-300 px-3 text-sm" required />
          <input name="price" placeholder="Price / reserve price" type="number" className="h-11 rounded-xl border border-slate-300 px-3 text-sm" required />
          <input name="financeCompany" placeholder="Finance company" className="h-11 rounded-xl border border-slate-300 px-3 text-sm" required />
          <input name="yardLocation" placeholder="Yard location" className="h-11 rounded-xl border border-slate-300 px-3 text-sm" required />
          <input name="city" placeholder="City" className="h-11 rounded-xl border border-slate-300 px-3 text-sm" required />
          <input name="state" placeholder="State" className="h-11 rounded-xl border border-slate-300 px-3 text-sm" required />
          <input name="sellerName" placeholder="Seller name" className="h-11 rounded-xl border border-slate-300 px-3 text-sm" required />
          <input name="sellerPhone" placeholder="Seller phone" className="h-11 rounded-xl border border-slate-300 px-3 text-sm" required />
          <textarea
            name="condition"
            placeholder="Condition notes"
            className="col-span-2 min-h-24 rounded-xl border border-slate-300 px-3 py-2 text-sm"
            required
          />
        </div>

        <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-4 text-sm text-slate-500">
          Photos upload UI placeholder (Stage 1 MVP)
        </div>

        <button type="submit" className="h-12 w-full rounded-xl bg-indigo-600 text-sm font-semibold text-white sm:w-auto sm:px-8">
          Submit listing
        </button>
      </form>
    </div>
  );
}
