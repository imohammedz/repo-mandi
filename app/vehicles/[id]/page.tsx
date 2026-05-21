import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { formatCurrency } from "@/data/vehicles";
import { db } from "@/lib/db";
import { vehicles as vehiclesTable } from "@/lib/schema";
import { dbToVehicle } from "@/lib/mappers";
import { eq, ne, desc, and } from "drizzle-orm";
import { CallButton } from "@/components/ui/call-button";
import { ImageGallery } from "@/components/ui/image-gallery";
import { SellerCard } from "@/components/ui/seller-card";
import { VehicleCard } from "@/components/ui/vehicle-card";
import { VerificationBadge } from "@/components/ui/verification-badge";
import { getCurrentUser } from "@/lib/auth";
import { WhatsAppButton } from "@/components/ui/whatsapp-button";

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
  const isPublicLive =
    row.isPublished && row.listingStatus === "VERIFIED" && row.listingStatus !== "SOLD";
  const canViewPrivate =
    currentUser?.accountType === "ADMIN" || (currentUser?.id && row.sellerId === currentUser.id);
  if (!isPublicLive && !canViewPrivate) notFound();
  const vehicle = dbToVehicle(row);

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
        <h1 className="text-2xl font-semibold text-slate-900">{vehicle.title}</h1>
        <p className="text-xl font-semibold text-slate-900">{formatCurrency(vehicle.price)}</p>
        <div className="grid grid-cols-2 gap-2 text-sm text-slate-600">
          <p>Finance: {vehicle.financeCompany}</p>
          <p>Status: {vehicle.repoStatus}</p>
          <p>{vehicle.city}, {vehicle.state}</p>
          <p>Seller: {vehicle.sellerType}</p>
        </div>
      </section>

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
        vehicleId={vehicle.id}
        sellerId={vehicle.sellerId ?? undefined}
        city={vehicle.city}
        sellerVerified={vehicle.sellerVerified ?? false}
      />

      <section className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
        <h2 className="text-base font-semibold text-slate-900">Vehicle Specs</h2>
        <dl className="mt-3 grid grid-cols-2 gap-3 text-sm">
          <div><dt className="text-slate-500">Brand</dt><dd className="font-medium text-slate-900">{vehicle.brand}</dd></div>
          <div><dt className="text-slate-500">Model</dt><dd className="font-medium text-slate-900">{vehicle.model}</dd></div>
          <div><dt className="text-slate-500">Year</dt><dd className="font-medium text-slate-900">{vehicle.year}</dd></div>
          <div><dt className="text-slate-500">KM Driven</dt><dd className="font-medium text-slate-900">{vehicle.kmDriven.toLocaleString("en-IN")}</dd></div>
          <div><dt className="text-slate-500">Fuel</dt><dd className="font-medium text-slate-900">{vehicle.fuelType}</dd></div>
          <div><dt className="text-slate-500">Axle</dt><dd className="font-medium text-slate-900">{vehicle.axleType}</dd></div>
          <div><dt className="text-slate-500">Registration</dt><dd className="font-medium text-slate-900">{vehicle.registrationState}</dd></div>
          <div><dt className="text-slate-500">Condition</dt><dd className="font-medium text-slate-900">{vehicle.condition}</dd></div>
        </dl>
      </section>

      <section className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
        <h2 className="text-base font-semibold text-slate-900">Repo Details</h2>
        <ul className="mt-3 space-y-2 text-sm text-slate-700">
          <li>Finance company: {vehicle.financeCompany}</li>
          <li>Reserve price: {formatCurrency(vehicle.reservePrice)}</li>
          <li>Auction date: {new Date(vehicle.auctionDate).toLocaleDateString("en-IN")}</li>
          <li>Yard location: {vehicle.yardLocation}</li>
        </ul>
      </section>

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
        <CallButton phone={vehicle.sellerPhone} text="Call Seller" className="flex-1" vehicleId={vehicle.id} />
        <WhatsAppButton phone={vehicle.sellerPhone} text="WhatsApp" className="flex-1" vehicleId={vehicle.id} />
      </div>
    </main>
  );
}
