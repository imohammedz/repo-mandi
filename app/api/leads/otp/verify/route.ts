import twilio from "twilio";

export const runtime = "nodejs";

const otpPattern = /^\d{6}$/;
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
    const body = (await request.json()) as { phone?: string; code?: string };
    const phone = normalizeIndianPhone(body.phone ?? "");
    const code = (body.code ?? "").replace(/\D/g, "").slice(0, 6);

    if (!phone) {
      return Response.json({ message: "Enter a valid Indian mobile number." }, { status: 400 });
    }
    if (!otpPattern.test(code)) {
      return Response.json({ message: "Enter a valid 6-digit OTP." }, { status: 400 });
    }

    const twilioConfig = getTwilioConfig();
    if (!twilioConfig) {
      return Response.json({ message: "OTP verification is unavailable." }, { status: 400 });
    }

    const client = twilio(twilioConfig.accountSid, twilioConfig.authToken);
    const result = await client.verify.v2
      .services(twilioConfig.verifyServiceSid)
      .verificationChecks.create({ to: phone, code });

    if (result.status !== "approved") {
      return Response.json({ message: "Invalid or expired OTP." }, { status: 400 });
    }

    return Response.json({ success: true });
  } catch (error) {
    console.error("Lead OTP verify failed", error);
    return Response.json({ message: "Failed to verify OTP. Please try again." }, { status: 500 });
  }
}
