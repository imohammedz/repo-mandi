import { redirect } from "next/navigation";
import { and, desc, eq, isNull, or } from "drizzle-orm";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { vehicles } from "@/lib/schema";
import { dbToVehicle } from "@/lib/mappers";
import { StatusBadge } from "@/components/ui/status-badge";
import { EmptyState } from "@/components/ui/empty-state";
import { SupportContactCard } from "@/components/ui/support-contact-card";
import { SUPPORT_SUBJECTS } from "@/lib/config/site";
import { getAssetStructureLabel, getDetachableTypeLabel, getListingModeLabel } from "@/lib/vehicle-classification";

export const dynamic = "force-dynamic";

const getTransferTypeLabel = (transferType: string | null | undefined, nocStatus: string | null | undefined) => {
  const normalizedTransferType = (transferType || "").trim().replace(/[\s-]+/g, "_").toUpperCase();
  if (normalizedTransferType === "RC_TRANSFER") return "RC Transfer";
  if (normalizedTransferType === "RTO_NOC") return "RTO NOC";
  if (normalizedTransferType === "OPEN_NOC") return "Open NOC";
  if (normalizedTransferType === "UNKNOWN") return "Unknown";

  const normalizedNocStatus = (nocStatus || "").trim().replace(/[\s-]+/g, "_").toUpperCase();
  if (normalizedNocStatus === "AVAILABLE") return "RC Transfer";
  return "Unknown";
};

export default async function AdminPendingListingsPage() {
  const currentUser = await getCurrentUser();
  if (!currentUser) redirect("/admin/login");
  if (currentUser.accountType !== "ADMIN") redirect("/admin/login");

  const rows = await db
    .select()
    .from(vehicles)
    .where(
      and(
        or(eq(vehicles.listingStatus, "PENDING"), eq(vehicles.listingStatus, "BANK_PENDING_REVIEW")),
        isNull(vehicles.deletedAt)
      )
    )
    .orderBy(desc(vehicles.createdAt));
  const pending = rows.map(dbToVehicle);

  return (
    <main className="space-y-4 px-4 pb-8 pt-4">
      <h1 className="text-2xl font-semibold text-slate-900">Pending Listings</h1>
      <section className="space-y-3">
        {pending.length === 0 ? (
          <EmptyState title="No verification requests yet." description="New listings pending verification will appear here." />
        ) : null}
        {pending.map((vehicle) => (
          <article key={vehicle.id} className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
            <div className="flex items-start justify-between gap-2">
              <div>
                <h3 className="text-sm font-semibold text-slate-900">{vehicle.title}</h3>
                <p className="text-xs text-slate-500">{vehicle.city}, {vehicle.state}</p>
                <p className="mt-1 text-xs font-medium text-slate-600">
                  Transfer: {getTransferTypeLabel(vehicle.transferType, vehicle.nocStatus)}
                </p>
                <div className="mt-2 flex flex-wrap gap-2 text-[10px] font-semibold">
                  <span className="rounded-full bg-slate-100 px-2 py-0.5 text-slate-700">{vehicle.listingType}</span>
                  <span className="rounded-full bg-sky-50 px-2 py-0.5 text-sky-700">{getListingModeLabel(vehicle.listingMode)}</span>
                  <span className="rounded-full bg-violet-50 px-2 py-0.5 text-violet-700">
                    {getAssetStructureLabel(vehicle.assetStructure) || vehicle.assetConfiguration || "Complete Vehicle"}
                  </span>
                  {vehicle.detachableType ? (
                    <span className="rounded-full bg-fuchsia-50 px-2 py-0.5 text-fuchsia-700">
                      {getDetachableTypeLabel(vehicle.detachableType)}
                    </span>
                  ) : null}
                </div>
                <div className="mt-2 space-y-1 text-xs text-slate-600">
                  <p>Alternate number verified: {vehicle.alternateContactNumberVerified ? "Yes" : "No"}</p>
                  <p>Missing photos warning: {vehicle.missingPhotos ? "Yes" : "No"}</p>
                  <p>Videos uploaded: {vehicle.walkaroundVideo || vehicle.engineStartUpVideo ? "Yes" : "No"}</p>
                  {(vehicle.insuranceValidity || vehicle.permitValidity || vehicle.fitnessStatus || vehicle.taxValidity || vehicle.parkingDue) ? (
                    <div className="mt-2 border-t border-slate-100 pt-2">
                      <p className="font-semibold text-slate-700">Documentation Details</p>
                      {vehicle.insuranceValidity ? <p>Insurance Validity: {vehicle.insuranceValidity}</p> : null}
                      {vehicle.permitValidity ? <p>Permit Validity: {vehicle.permitValidity}</p> : null}
                      {vehicle.fitnessStatus ? <p>Fitness Status: {vehicle.fitnessStatus}</p> : null}
                      {vehicle.taxValidity ? <p>Tax Validity: {vehicle.taxValidity}</p> : null}
                      {vehicle.parkingDue ? <p>Parking Due: {vehicle.parkingDue}</p> : null}
                    </div>
                  ) : null}
                </div>
              </div>
              {vehicle.listingStatus ? <StatusBadge status={vehicle.listingStatus} /> : null}
            </div>
          </article>
        ))}
      </section>
      <SupportContactCard
        title="Need assistance?"
        description="Contact support for Verified Seller, RC Verification, Yard Verification, and Inspection Request help."
        subject={SUPPORT_SUBJECTS.sellerVerification}
      />
    </main>
  );
}
