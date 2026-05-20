import { db } from "@/lib/db";
import { vehicles as vehiclesTable } from "@/lib/schema";
import { dbToVehicle } from "@/lib/mappers";
import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import EditVehicleClient from "./edit-client";

export const dynamic = "force-dynamic";

export default async function EditVehiclePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [row] = await db.select().from(vehiclesTable).where(eq(vehiclesTable.id, id));
  if (!row) notFound();

  return <EditVehicleClient vehicle={dbToVehicle(row)} />;
}
