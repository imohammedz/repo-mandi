import { db } from "@/lib/db";
import { platformSettings } from "@/lib/schema";
import { eq } from "drizzle-orm";
import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import AdminSettingsClient from "./settings-client";
import { checkWhatsAppEnv } from "@/lib/otp/providers/whatsapp";
import { checkTwilioEnv } from "@/lib/otp/providers/twilio-sms";

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
  const [autoFeatureApproveRow] = await db
    .select()
    .from(platformSettings)
    .where(eq(platformSettings.key, "AUTO_FEATURE_APPROVAL_ENABLED"));

  const autoApproveListings = autoApproveRow?.value === "true";
  const autoFeatureApprovalEnabled = autoFeatureApproveRow?.value === "true";
  const otpProvider = (otpProviderRow?.value ?? "MSG91_SMS") as "MSG91_SMS" | "WHATSAPP" | "TWILIO_SMS";
  const whatsAppCheck = checkWhatsAppEnv();
  const twilioCheck = checkTwilioEnv();
  const initialWhatsAppEnvMissing = otpProvider === "WHATSAPP" && !whatsAppCheck.ok ? whatsAppCheck.missing : [];
  const initialTwilioEnvMissing = otpProvider === "TWILIO_SMS" && !twilioCheck.ok ? twilioCheck.missing : [];

  return (
    <AdminSettingsClient
      autoApproveListings={autoApproveListings}
      autoFeatureApprovalEnabled={autoFeatureApprovalEnabled}
      otpProvider={otpProvider}
      initialWhatsAppEnvMissing={initialWhatsAppEnvMissing}
      initialTwilioEnvMissing={initialTwilioEnvMissing}
    />
  );
}
