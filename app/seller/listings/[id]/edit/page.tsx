import { db } from "@/lib/db";
import { vehicles as vehiclesTable } from "@/lib/schema";
import { dbToVehicle } from "@/lib/mappers";
import { eq } from "drizzle-orm";
import { notFound, redirect } from "next/navigation";
import EditVehicleClient from "@/app/seller/edit-vehicle/[id]/edit-client";
import { getCurrentUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function EditSellerListingPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const currentUser = await getCurrentUser();
  if (!currentUser) redirect("/auth/login");
  if (!["SELLER", "BANK_PARTNER", "ADMIN"].includes(currentUser.accountType)) redirect("/sell");

  const { id } = await params;
  const [row] = await db.select().from(vehiclesTable).where(eq(vehiclesTable.id, id));
  if (!row || row.deletedAt) notFound();
  if (currentUser.accountType !== "ADMIN" && row.sellerId !== currentUser.id) {
    notFound();
  }

  return <EditVehicleClient vehicle={dbToVehicle(row)} />;
}
