import { db } from "@/lib/db";
import { vehicles as vehiclesTable } from "@/lib/schema";
import { dbToVehicle } from "@/lib/mappers";
import { eq } from "drizzle-orm";
import { notFound, redirect } from "next/navigation";
import EditVehicleClient from "./edit-client";
import { getCurrentUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function EditVehiclePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const currentUser = await getCurrentUser();
  if (!currentUser) redirect("/auth/login");
  if (!["SELLER", "BANK_PARTNER", "ADMIN"].includes(currentUser.accountType)) redirect("/sell");

  const { id } = await params;
  const [row] = await db.select().from(vehiclesTable).where(eq(vehiclesTable.id, id));
  if (!row) notFound();
  if (currentUser.accountType !== "ADMIN" && row.sellerId !== currentUser.id) {
    redirect("/seller/listings");
  }

  return <EditVehicleClient vehicle={dbToVehicle(row)} />;
}
