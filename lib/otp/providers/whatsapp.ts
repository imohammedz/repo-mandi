/**
 * WhatsApp OTP provider.
 *
 * Uses the Meta WhatsApp Cloud API to send a one-time password via a
 * pre-approved WhatsApp message template.
 *
 * Required environment variables (server-only):
 *   WHATSAPP_ACCESS_TOKEN       — Meta permanent / temporary access token
 *   WHATSAPP_PHONE_NUMBER_ID    — WhatsApp Business phone number ID
 *   WHATSAPP_TEMPLATE_NAME      — approved template name (e.g. "otp_login")
 *   WHATSAPP_TEMPLATE_LANGUAGE  — template language code (default "en_US")
 */

export const WHATSAPP_PROVIDER = "WHATSAPP" as const;

/** Validate that all required env vars are present at call time. */
export function checkWhatsAppEnv(): { ok: true } | { ok: false; missing: string[] } {
  const required = ["WHATSAPP_ACCESS_TOKEN", "WHATSAPP_PHONE_NUMBER_ID", "WHATSAPP_TEMPLATE_NAME"];
  const missing = required.filter((key) => !process.env[key]);
  if (missing.length > 0) return { ok: false, missing };
  return { ok: true };
}

/**
 * Send an OTP code to the given phone number via WhatsApp template message.
 *
 * @param phoneE164  Phone in E.164 format (e.g. "+919876543210")
 * @param otpCode    The plain-text 6-digit OTP code to embed in the template
 */
export async function sendWhatsAppOtp(phoneE164: string, otpCode: string): Promise<void> {
  const envCheck = checkWhatsAppEnv();
  if (!envCheck.ok) {
    throw new Error(
      `WhatsApp OTP: missing environment variables: ${envCheck.missing.join(", ")}`
    );
  }

  const accessToken = process.env.WHATSAPP_ACCESS_TOKEN!;
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID!;
  const templateName = process.env.WHATSAPP_TEMPLATE_NAME!;
  const templateLanguage = process.env.WHATSAPP_TEMPLATE_LANGUAGE ?? "en_US";

  // Strip leading + for WhatsApp API (expects digits only)
  const recipient = phoneE164.replace(/^\+/, "");

  const body = {
    messaging_product: "whatsapp",
    to: recipient,
    type: "template",
    template: {
      name: templateName,
      language: { code: templateLanguage },
      components: [
        {
          type: "body",
          parameters: [{ type: "text", text: otpCode }],
        },
        {
          // Button component for copy-code button (standard OTP template)
          type: "button",
          sub_type: "url",
          index: "0",
          parameters: [{ type: "text", text: otpCode }],
        },
      ],
    },
  };

  const response = await fetch(
    `https://graph.facebook.com/v20.0/${phoneNumberId}/messages`,
    {
      method: "POST",
      headers: {
        Authorization: "Bearer " + accessToken,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
      cache: "no-store",
    }
  );

  if (!response.ok) {
    const errorPayload = await response.json().catch(() => null);
    const errorMessage =
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (errorPayload as any)?.error?.message ?? `WhatsApp API error ${response.status}`;
    throw new Error(`WhatsApp OTP send failed: ${errorMessage}`);
  }
}
