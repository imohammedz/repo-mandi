import { db } from "@/lib/db";
import { vehicleSaleFeedback, vehicles as vehiclesTable } from "@/lib/schema";
import { dbToVehicle } from "@/lib/mappers";
import { desc } from "drizzle-orm";
import AdminDashboardClient from "./admin-client";
import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

// Midpoint estimates (in weeks) for each bucket to approximate average time-to-sell.
const TIME_TO_SELL_WEEK_ESTIMATES = {
  LESS_THAN_1_WEEK: 0.5,
  ONE_TO_TWO_WEEKS: 1.5,
  TWO_TO_FOUR_WEEKS: 3,
  MORE_THAN_1_MONTH: 5,
} as const;

export default async function AdminDashboardPage() {
  const currentUser = await getCurrentUser();
  if (!currentUser) redirect("/admin/login");
  if (currentUser.accountType !== "ADMIN") redirect("/admin/login");

  const rows = await db.select().from(vehiclesTable).orderBy(desc(vehiclesTable.createdAt));
  const vehicleList = rows.map(dbToVehicle);
  const saleFeedbackRows = await db.select().from(vehicleSaleFeedback).orderBy(desc(vehicleSaleFeedback.createdAt));

  const soldThroughPlatformCount = saleFeedbackRows.filter((row) => row.soldThroughPlatform === true).length;

  const timeToSellEntries = saleFeedbackRows
    .map((row) => row.timeToSell)
    .filter((value): value is keyof typeof TIME_TO_SELL_WEEK_ESTIMATES => Boolean(value));
  const averageTimeToSellWeeks =
    timeToSellEntries.length > 0
      ? (
          timeToSellEntries.reduce((sum, value) => sum + TIME_TO_SELL_WEEK_ESTIMATES[value], 0) /
          timeToSellEntries.length
        ).toFixed(1)
      : null;

  const methodLabels: Record<NonNullable<typeof saleFeedbackRows[number]["buyerContactMethod"]>, string> = {
    PHONE_CALL: "Phone Call",
    WHATSAPP: "WhatsApp",
    DIRECT_VISIT: "Direct Visit",
    EXISTING_CONTACT: "Existing Contact",
    REQUEST_DETAILS: "RepoMandi Inquiry Form",
    OTHER: "Other",
  };
  const contactMethodCounts = saleFeedbackRows.reduce<Record<string, number>>((acc, row) => {
    if (!row.buyerContactMethod) return acc;
    acc[row.buyerContactMethod] = (acc[row.buyerContactMethod] ?? 0) + 1;
    return acc;
  }, {});
  const sortedContactEntries = Object.entries(contactMethodCounts).sort((a, b) => b[1] - a[1]);
  const mostCommonContactMethodKey = sortedContactEntries[0]?.[0] as keyof typeof methodLabels | undefined;
  const mostCommonContactMethod = mostCommonContactMethodKey ? methodLabels[mostCommonContactMethodKey] : null;

  const stats = [
    { label: "Total listings", value: String(vehicleList.length) },
    { label: "Total verified", value: String(vehicleList.filter((v) => v.listingStatus === "VERIFIED").length) },
    { label: "Pending", value: String(vehicleList.filter((v) => v.listingStatus === "PENDING" || v.listingStatus === "BANK_PENDING_REVIEW").length) },
    { label: "Rejected", value: String(vehicleList.filter((v) => v.listingStatus === "REJECTED").length) },
    { label: "Sold", value: String(vehicleList.filter((v) => v.listingStatus === "SOLD").length) },
    { label: "Sold via RepoMandi", value: String(soldThroughPlatformCount), hint: "Count of seller feedback marked Yes" },
    { label: "Avg time to sell", value: averageTimeToSellWeeks ? `${averageTimeToSellWeeks} weeks` : "N/A" },
    { label: "Top contact method", value: mostCommonContactMethod ?? "N/A" },
  ];

  return <AdminDashboardClient vehicleList={vehicleList} stats={stats} />;
}
