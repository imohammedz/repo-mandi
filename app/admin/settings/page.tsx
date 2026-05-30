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

  const [autoApproveRow] = await db
    .select()
    .from(platformSettings)
    .where(eq(platformSettings.key, "AUTO_APPROVE_LISTINGS"));

  const [otpProviderRow] = await db
    .select()
    .from(platformSettings)
    .where(eq(platformSettings.key, "OTP_PROVIDER"));

  const autoApproveListings = autoApproveRow?.value === "true";
  const otpProvider = (otpProviderRow?.value ?? "MSG91_SMS") as "MSG91_SMS" | "WHATSAPP" | "TWILIO_SMS";

  return (
    <AdminSettingsClient
      autoApproveListings={autoApproveListings}
      otpProvider={otpProvider}
    />
  );
}
