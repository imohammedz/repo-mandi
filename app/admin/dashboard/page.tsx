import { db } from "@/lib/db";
import { vehicles as vehiclesTable } from "@/lib/schema";
import { dbToVehicle } from "@/lib/mappers";
import { desc } from "drizzle-orm";
import AdminDashboardClient from "./admin-client";

export const dynamic = "force-dynamic";

export default async function AdminDashboardPage() {
  const rows = await db.select().from(vehiclesTable).orderBy(desc(vehiclesTable.createdAt));
  const vehicleList = rows.map(dbToVehicle);

  const stats = [
    { label: "Total listings", value: String(vehicleList.length) },
    { label: "Total verified", value: String(vehicleList.filter((v) => v.listingStatus === "Verified").length) },
    { label: "Most active city", value: "Pune" },
    { label: "Most viewed type", value: "Tipper" },
    { label: "Inquiry trends", value: "+18%", hint: "Last 30 days" },
  ];

  return <AdminDashboardClient vehicleList={vehicleList} stats={stats} />;
}
