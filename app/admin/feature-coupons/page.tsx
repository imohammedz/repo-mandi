import { desc } from "drizzle-orm";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { featureCoupons } from "@/lib/schema";
import FeatureCouponsClient from "./feature-coupons-client";

export const dynamic = "force-dynamic";

export default async function AdminFeatureCouponsPage() {
  const currentUser = await getCurrentUser();
  if (!currentUser) redirect("/admin/login");
  if (currentUser.accountType !== "ADMIN") redirect("/admin/login");

  const coupons = await db
    .select()
    .from(featureCoupons)
    .orderBy(desc(featureCoupons.createdAt));

  return <FeatureCouponsClient initialCoupons={coupons} />;
}
