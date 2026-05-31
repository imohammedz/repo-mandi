import { db } from "@/lib/db";
import { platformSettings } from "@/lib/schema";
import { eq } from "drizzle-orm";
import Msg91LoginForm from "@/components/auth/msg91-login-form";
import WhatsappOtpForm from "@/components/auth/whatsapp-otp-form";

export const dynamic = "force-dynamic";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ phone?: string }>;
}) {
  const params = await searchParams;
  const initialPhone = (params.phone ?? "").replace(/\D/g, "").slice(0, 10);

  const [providerRow] = await db
    .select()
    .from(platformSettings)
    .where(eq(platformSettings.key, "OTP_PROVIDER"));

  const provider = providerRow?.value ?? "MSG91_SMS";

  if (provider !== "MSG91_SMS") {
    return (
      <WhatsappOtpForm
        title="List Your Vehicle"
        subtitle="Sell repossessed commercial vehicles faster."
        backHref="/sell"
        initialPhone={initialPhone}
        deliveryLabel={provider === "TWILIO_SMS" ? "Twilio SMS" : "WhatsApp"}
      />
    );
  }

  return (
    <Msg91LoginForm
      title="List Your Vehicle"
      subtitle="Sell repossessed commercial vehicles faster."
      backHref="/sell"
      initialPhone={initialPhone}
    />
  );
}
