import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { formatCurrency } from "@/data/vehicles";
import { db } from "@/lib/db";
import { vehicles as vehiclesTable } from "@/lib/schema";
import { dbToVehicle } from "@/lib/mappers";
import { eq, ne, desc, and } from "drizzle-orm";
import { ImageGallery } from "@/components/ui/image-gallery";
import { SellerCard } from "@/components/ui/seller-card";
import { VehicleCard } from "@/components/ui/vehicle-card";
import { VerificationBadge } from "@/components/ui/verification-badge";
import { getCurrentUser } from "@/lib/auth";
import { VehicleContactActions } from "@/components/ui/vehicle-contact-actions";

export const dynamic = "force-dynamic";

export default async function VehicleDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const currentUser = await getCurrentUser();

  const [row] = await db.select().from(vehiclesTable).where(eq(vehiclesTable.id, id));
  if (!row) notFound();
  const isPublicLive = row.isPublished && row.listingStatus === "VERIFIED";
  const canViewPrivate =
    currentUser?.accountType === "ADMIN" || (currentUser?.id && row.sellerId === currentUser.id);
  if (!isPublicLive && !canViewPrivate) notFound();
  const vehicle = dbToVehicle(row);
  const displayLocation =
    vehicle.vehicleOrYardLocation || [vehicle.city, vehicle.state].filter(Boolean).join(", ");
  const isTrailerOnly = vehicle.assetConfiguration === "Trailer Only";
  const assetConfigurationLabel = vehicle.assetConfiguration ?? "Complete Vehicle";

  const similarRows = await db
    .select()
    .from(vehiclesTable)
    .where(
      and(
        ne(vehiclesTable.id, id),
        eq(vehiclesTable.isPublished, true),
        eq(vehiclesTable.listingStatus, "VERIFIED")
      )
    )
    .orderBy(desc(vehiclesTable.createdAt))
    .limit(3);
  const similar = similarRows.map(dbToVehicle);

  return (
    <main className="space-y-5 px-4 pb-28 pt-4">
      <Link href="/vehicles" className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-medium text-slate-700">
        <ArrowLeft className="h-4 w-4" /> Back to listings
      </Link>

      <ImageGallery images={vehicle.gallery} title={vehicle.title} />

      <section className="space-y-3 rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
        <span className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold ${vehicle.listingType === "REPO" ? "bg-amber-50 text-amber-700" : "bg-emerald-50 text-emerald-700"}`}>
          {vehicle.listingType === "REPO" ? "REPO" : "REGULAR"}
        </span>
        <span className="ml-2 inline-flex rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-700">
          {assetConfigurationLabel}
        </span>
        <h1 className="text-2xl font-semibold text-slate-900">{vehicle.title}</h1>
        <p className="text-xl font-semibold text-slate-900">{formatCurrency(vehicle.expectedPrice ?? vehicle.price)}</p>
        <div className="grid grid-cols-2 gap-2 text-sm text-slate-600">
          <p>Type: {[vehicle.type, vehicle.vehicleSubType].filter(Boolean).join(" • ")}</p>
          {!isTrailerOnly ? <p>Running: {vehicle.runningCondition ?? vehicle.condition}</p> : null}
          {vehicle.listingType === "REPO" ? <p>Finance: {vehicle.financeCompany}</p> : null}
          {vehicle.listingType === "REPO" ? <p>Repo Status: {vehicle.repoStatus}</p> : null}
          <p>{displayLocation || "Location unavailable"}</p>
          <p>Seller: {vehicle.businessName || vehicle.sellerName}</p>
        </div>
      </section>

      {isTrailerOnly ? (
        <section className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
          <h2 className="text-base font-semibold text-slate-900">Trailer Specs</h2>
          <dl className="mt-3 grid grid-cols-2 gap-3 text-sm">
            <div><dt className="text-slate-500">Trailer Type</dt><dd className="font-medium text-slate-900">{vehicle.trailerType || "N/A"}</dd></div>
            <div><dt className="text-slate-500">Trailer Length</dt><dd className="font-medium text-slate-900">{vehicle.trailerLength || "N/A"}</dd></div>
            <div><dt className="text-slate-500">Number of Axles</dt><dd className="font-medium text-slate-900">{vehicle.numberOfAxles ?? "N/A"}</dd></div>
            <div><dt className="text-slate-500">Body Dimensions</dt><dd className="font-medium text-slate-900">{vehicle.bodyDimensions || "N/A"}</dd></div>
            <div><dt className="text-slate-500">Suspension Type</dt><dd className="font-medium text-slate-900">{vehicle.suspensionType || "N/A"}</dd></div>
            <div><dt className="text-slate-500">ABS</dt><dd className="font-medium text-slate-900">{vehicle.abs || "N/A"}</dd></div>
          </dl>
        </section>
      ) : null}

      <section className="space-y-2 rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
        <h2 className="text-base font-semibold text-slate-900">Verification</h2>
        <div className="flex flex-wrap gap-2">
          {vehicle.verifiedBadges.map((badge) => (
            <VerificationBadge key={badge} label={badge} />
          ))}
        </div>
      </section>

      <SellerCard
        name={vehicle.sellerName}
        role={vehicle.sellerRole}
        phone={vehicle.sellerPhone}
        vehicleTitle={vehicle.title}
        vehicleId={vehicle.id}
        sellerId={vehicle.sellerId ?? undefined}
        city={displayLocation}
        sellerVerified={vehicle.sellerVerified ?? false}
      />

      {!isTrailerOnly ? (
        <section className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
          <h2 className="text-base font-semibold text-slate-900">Vehicle Specs</h2>
          <dl className="mt-3 grid grid-cols-2 gap-3 text-sm">
            <div><dt className="text-slate-500">Brand</dt><dd className="font-medium text-slate-900">{vehicle.brand}</dd></div>
            <div><dt className="text-slate-500">Model</dt><dd className="font-medium text-slate-900">{vehicle.model}</dd></div>
            <div><dt className="text-slate-500">Year</dt><dd className="font-medium text-slate-900">{vehicle.year}</dd></div>
            <div><dt className="text-slate-500">KM Driven</dt><dd className="font-medium text-slate-900">{typeof vehicle.kmDriven === "number" ? vehicle.kmDriven.toLocaleString("en-IN") : "Unknown"}</dd></div>
            <div><dt className="text-slate-500">Fuel</dt><dd className="font-medium text-slate-900">{vehicle.fuelType}</dd></div>
            <div><dt className="text-slate-500">Axle</dt><dd className="font-medium text-slate-900">{vehicle.axleType}</dd></div>
            <div><dt className="text-slate-500">Registration</dt><dd className="font-medium text-slate-900">{vehicle.registrationState}</dd></div>
            <div><dt className="text-slate-500">Condition</dt><dd className="font-medium text-slate-900">{vehicle.condition}</dd></div>
          </dl>
        </section>
      ) : null}

      {vehicle.listingType === "REPO" ? (
        <section className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
          <h2 className="text-base font-semibold text-slate-900">Repo Details</h2>
          <ul className="mt-3 space-y-2 text-sm text-slate-700">
            <li>Finance company: {vehicle.financeCompany}</li>
            <li>Reserve price: {formatCurrency(vehicle.reservePrice)}</li>
            <li>Auction date: {vehicle.auctionDate ? new Date(vehicle.auctionDate).toLocaleDateString("en-IN") : "N/A"}</li>
            <li>Yard location: {vehicle.vehicleOrYardLocation || vehicle.yardLocation}</li>
          </ul>
        </section>
      ) : null}

      <section className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
        <h2 className="text-base font-semibold text-slate-900">Inspection Notes</h2>
        <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-slate-700">
          {vehicle.inspectionNotes.map((note) => (
            <li key={note}>{note}</li>
          ))}
        </ul>
      </section>

      <section className="space-y-3">
        <h2 className="text-base font-semibold text-slate-900">Similar Vehicles</h2>
        <div className="space-y-4">
          {similar.map((item) => (
            <VehicleCard key={item.id} vehicle={item} compact />
          ))}
        </div>
      </section>

      <div className="fixed inset-x-0 bottom-16 z-30 mx-auto flex w-full max-w-xl gap-2 border-t border-slate-100 bg-white p-3">
        <VehicleContactActions
          vehicleId={vehicle.id}
          sellerPhone={vehicle.sellerPhone}
          vehicleTitle={vehicle.title}
          className="w-full"
          showRequestDetails={false}
        />
      </div>
    </main>
  );
}
