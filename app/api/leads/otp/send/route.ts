import twilio from "twilio";

export const runtime = "nodejs";

const indianTenDigitPattern = /^\d{10}$/;

const normalizeIndianPhone = (rawPhone: string) => {
  const digits = rawPhone.replace(/\D/g, "");
  if (indianTenDigitPattern.test(digits)) return `+91${digits}`;
  if (digits.length === 12 && digits.startsWith("91")) return `+${digits}`;
  return null;
};

const getTwilioConfig = () => {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const verifyServiceSid = process.env.TWILIO_VERIFY_SERVICE_SID;
  if (!accountSid || !authToken || !verifyServiceSid) return null;
  return { accountSid, authToken, verifyServiceSid };
};

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { phone?: string };
    const phone = normalizeIndianPhone(body.phone ?? "");
    if (!phone) {
      return Response.json({ message: "Enter a valid Indian mobile number." }, { status: 400 });
    }

    const twilioConfig = getTwilioConfig();
    if (!twilioConfig) {
      return Response.json({ success: true, otpEnabled: false });
    }

    const client = twilio(twilioConfig.accountSid, twilioConfig.authToken);
    await client.verify.v2
      .services(twilioConfig.verifyServiceSid)
      .verifications.create({ to: phone, channel: "sms" });

    return Response.json({ success: true, otpEnabled: true });
  } catch (error) {
    console.error("Lead OTP send failed", error);
    return Response.json({ message: "Failed to send OTP. Please try again." }, { status: 500 });
  }
}
