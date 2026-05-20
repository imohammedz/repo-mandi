import twilio from "twilio";

export const runtime = "nodejs";

const indianMobilePattern = /^\d{10}$/;

const getTwilioConfig = () => {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const verifyServiceSid = process.env.TWILIO_VERIFY_SERVICE_SID;

  if (!accountSid || !authToken || !verifyServiceSid) {
    return null;
  }

  return { accountSid, authToken, verifyServiceSid };
};

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { phone?: string };
    const phone = (body.phone ?? "").replace(/\D/g, "").slice(0, 10);

    if (!indianMobilePattern.test(phone)) {
      return Response.json({ message: "Enter a valid 10-digit mobile number." }, { status: 400 });
    }

    const twilioConfig = getTwilioConfig();
    if (!twilioConfig) {
      return Response.json({ message: "OTP service is not configured." }, { status: 500 });
    }

    const client = twilio(twilioConfig.accountSid, twilioConfig.authToken);
    await client.verify.v2
      .services(twilioConfig.verifyServiceSid)
      .verifications.create({ to: `+91${phone}`, channel: "sms" });

    return Response.json({ success: true });
  } catch {
    return Response.json({ message: "Failed to send OTP. Please try again." }, { status: 500 });
  }
}
