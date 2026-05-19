import Image from "next/image";
import Link from "next/link";
import type { Vehicle } from "@/lib/types";

const statusStyle: Record<Vehicle["status"], string> = {
  PENDING: "bg-amber-100 text-amber-800",
  VERIFIED: "bg-emerald-100 text-emerald-800",
  REJECTED: "bg-rose-100 text-rose-800",
  SOLD: "bg-slate-200 text-slate-700",
};

const formatter = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0,
});

export function VehicleCard({ vehicle }: { vehicle: Vehicle }) {
  return (
    <Link
      href={`/vehicles/${vehicle.id}`}
      className="block overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-slate-200 transition hover:shadow-md"
    >
      <div className="relative h-44 w-full sm:h-52">
        <Image
          src={vehicle.images[0] ?? "/vehicles/truck-placeholder.svg"}
          alt={vehicle.title}
          fill
          className="object-cover"
          sizes="(max-width: 768px) 100vw, 33vw"
        />
      </div>
      <div className="space-y-3 p-4">
        <div className="flex items-start justify-between gap-3">
          <h3 className="text-base font-semibold text-slate-900">{vehicle.title}</h3>
          <span className={`rounded-full px-2 py-1 text-xs font-medium ${statusStyle[vehicle.status]}`}>
            {vehicle.status}
          </span>
        </div>
        <p className="text-sm text-slate-500">
          {vehicle.city}, {vehicle.state}
        </p>
        <div className="flex items-center justify-between">
          <p className="text-lg font-semibold text-slate-900">{formatter.format(vehicle.price)}</p>
          <p className="text-xs text-slate-500">{vehicle.financeCompany}</p>
        </div>
      </div>
    </Link>
  );
}
