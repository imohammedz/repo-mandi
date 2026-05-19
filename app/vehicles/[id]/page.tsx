import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getVehicleById } from "@/lib/vehicle-store";

const formatter = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0,
});

export default async function VehicleDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const vehicle = getVehicleById(id);

  if (!vehicle) {
    notFound();
  }

  const whatsappUrl = `https://wa.me/${vehicle.sellerPhone}?text=${encodeURIComponent(`Hi, I am interested in ${vehicle.title} listed on RepoMandi.`)}`;

  return (
    <div className="space-y-5 pb-8">
      <Link href="/vehicles" className="text-sm font-medium text-indigo-600">
        ← Back to listings
      </Link>

      <div className="overflow-hidden rounded-3xl bg-white shadow-sm ring-1 ring-slate-200">
        <div className="relative h-64 w-full sm:h-80">
          <Image
            src={vehicle.images[0] ?? "/vehicles/truck-placeholder.svg"}
            alt={vehicle.title}
            fill
            className="object-cover"
            sizes="100vw"
          />
        </div>
        <div className="space-y-5 p-5 sm:p-6">
          <div className="space-y-2">
            <h1 className="text-2xl font-semibold text-slate-900">{vehicle.title}</h1>
            <p className="text-xl font-semibold text-slate-900">{formatter.format(vehicle.price)}</p>
            <div className="flex flex-wrap gap-2 text-xs font-medium">
              <span className="rounded-full bg-emerald-100 px-3 py-1 text-emerald-800">
                {vehicle.verificationStatus === "VERIFIED" ? "Verified listing" : "Verification pending"}
              </span>
              <span className="rounded-full bg-slate-100 px-3 py-1 text-slate-700">Status: {vehicle.status}</span>
            </div>
          </div>

          <div className="grid gap-3 text-sm text-slate-700 sm:grid-cols-2">
            <p>
              <strong>Vehicle Type:</strong> {vehicle.vehicleType}
            </p>
            <p>
              <strong>Brand / Model:</strong> {vehicle.brand} {vehicle.model}
            </p>
            <p>
              <strong>Year:</strong> {vehicle.year}
            </p>
            <p>
              <strong>Registration:</strong> {vehicle.registrationState}
            </p>
            <p>
              <strong>Finance Company:</strong> {vehicle.financeCompany}
            </p>
            <p>
              <strong>Yard Location:</strong> {vehicle.yardLocation}
            </p>
            <p className="sm:col-span-2">
              <strong>Location:</strong> {vehicle.city}, {vehicle.state}
            </p>
            <p className="sm:col-span-2">
              <strong>Condition:</strong> {vehicle.condition}
            </p>
          </div>

          <div className="grid gap-2 sm:grid-cols-2">
            <a
              href={`tel:+${vehicle.sellerPhone}`}
              className="h-12 rounded-xl bg-indigo-600 text-center text-sm font-semibold leading-[3rem] text-white"
            >
              Call seller
            </a>
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="h-12 rounded-xl bg-emerald-600 text-center text-sm font-semibold leading-[3rem] text-white"
            >
              WhatsApp inquiry
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
