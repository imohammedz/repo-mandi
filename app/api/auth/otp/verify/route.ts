import twilio from "twilio";

export const runtime = "nodejs";

const indianMobilePattern = /^\d{10}$/;
const otpPattern = /^\d{6}$/;

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
    const body = (await request.json()) as { phone?: string; code?: string };
    const phone = (body.phone ?? "").replace(/\D/g, "").slice(0, 10);
    const code = (body.code ?? "").replace(/\D/g, "").slice(0, 6);

    if (!indianMobilePattern.test(phone)) {
      return Response.json({ message: "Enter a valid 10-digit mobile number." }, { status: 400 });
    }

    if (!otpPattern.test(code)) {
      return Response.json({ message: "Enter a valid 6-digit OTP." }, { status: 400 });
    }

    const twilioConfig = getTwilioConfig();
    if (!twilioConfig) {
      return Response.json({ message: "OTP service is not configured." }, { status: 500 });
    }

    const client = twilio(twilioConfig.accountSid, twilioConfig.authToken);
    const result = await client.verify.v2
      .services(twilioConfig.verifyServiceSid)
      .verificationChecks.create({ to: `+91${phone}`, code });

    if (result.status !== "approved") {
      return Response.json({ message: "Invalid or expired OTP." }, { status: 400 });
    }

    return Response.json({ success: true });
  } catch (error) {
    console.error("OTP verify failed", error);
    return Response.json({ message: "Failed to verify OTP. Please try again." }, { status: 500 });
  }
}
