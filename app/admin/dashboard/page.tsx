import { db } from "@/lib/db";
import { vehicles as vehiclesTable } from "@/lib/schema";
import { dbToVehicle } from "@/lib/mappers";
import { desc } from "drizzle-orm";
import AdminDashboardClient from "./admin-client";
import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function AdminDashboardPage() {
  const currentUser = await getCurrentUser();
  if (!currentUser) redirect("/admin/login");
  if (currentUser.accountType !== "ADMIN") redirect("/admin/login");

  const rows = await db.select().from(vehiclesTable).orderBy(desc(vehiclesTable.createdAt));
  const vehicleList = rows.map(dbToVehicle);

  const stats = [
    { label: "Total listings", value: String(vehicleList.length) },
    { label: "Total verified", value: String(vehicleList.filter((v) => v.listingStatus === "VERIFIED").length) },
    { label: "Pending", value: String(vehicleList.filter((v) => v.listingStatus === "PENDING" || v.listingStatus === "BANK_PENDING_REVIEW").length) },
    { label: "Rejected", value: String(vehicleList.filter((v) => v.listingStatus === "REJECTED").length) },
    { label: "Sold", value: String(vehicleList.filter((v) => v.listingStatus === "SOLD").length) },
  ];

  return <AdminDashboardClient vehicleList={vehicleList} stats={stats} />;
}
