import { db } from "@/lib/db";
import { platformSettings } from "@/lib/schema";
import { eq } from "drizzle-orm";
import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import AdminSettingsClient from "./settings-client";

export const dynamic = "force-dynamic";

export default async function AdminSettingsPage() {
  const currentUser = await getCurrentUser();
  if (!currentUser) redirect("/admin/login");
  if (currentUser.accountType !== "ADMIN") redirect("/admin/login");

  const [row] = await db
    .select()
    .from(platformSettings)
    .where(eq(platformSettings.key, "AUTO_APPROVE_LISTINGS"));

  const autoApproveListings = row?.value === "true";

  return <AdminSettingsClient autoApproveListings={autoApproveListings} />;
}
