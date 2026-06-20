import { desc } from "drizzle-orm";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { featureCoupons } from "@/lib/schema";
import { redirect } from "next/navigation";
import AdminCouponsClient from "./coupons-client";

export const dynamic = "force-dynamic";

export default async function AdminCouponsPage() {
  const currentUser = await getCurrentUser();
  if (!currentUser) redirect("/admin/login");
  if (currentUser.accountType !== "ADMIN") redirect("/admin/login");

  const coupons = await db
    .select()
    .from(featureCoupons)
    .orderBy(desc(featureCoupons.createdAt));

  return <AdminCouponsClient initialCoupons={coupons} />;
}
