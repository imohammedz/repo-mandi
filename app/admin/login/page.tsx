import { db } from "@/lib/db";
import { platformSettings } from "@/lib/schema";
import { eq } from "drizzle-orm";
import Msg91LoginForm from "@/components/auth/msg91-login-form";
import WhatsappOtpForm from "@/components/auth/whatsapp-otp-form";

export const dynamic = "force-dynamic";

export default async function AdminLoginPage() {
  const [providerRow] = await db
    .select()
    .from(platformSettings)
    .where(eq(platformSettings.key, "OTP_PROVIDER"));

  const provider = providerRow?.value ?? "MSG91_SMS";

  if (provider === "WHATSAPP") {
    return (
      <WhatsappOtpForm
        title="Admin Login"
        subtitle="Enter your approved admin number."
        intent="admin"
      />
    );
  }

  return (
    <Msg91LoginForm
      title="Admin Login"
      subtitle="Enter your approved admin number."
      intent="admin"
    />
  );
}
