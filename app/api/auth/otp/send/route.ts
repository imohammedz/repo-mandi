import { sendOtp, getActiveOtpProvider } from "@/lib/otp/otp-service";
import { normalizeIndianPhone } from "@/lib/otp/phone";
import { enforceRateLimit, getClientIp } from "@/lib/rate-limit";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const ip = getClientIp(request);
    const provider = await getActiveOtpProvider();

    if (provider === "MSG91_SMS") {
      return Response.json(
        {
          message:
            "MSG91 SMS OTP uses the widget flow. Start authentication from /auth/login using the MSG91 widget.",
        },
        { status: 410 }
      );
    }

    const body = (await request.json()) as { phone?: string; purpose?: string };
    const phone = normalizeIndianPhone(String(body.phone ?? ""));

    if (!phone) {
      return Response.json({ message: "Enter a valid 10-digit mobile number." }, { status: 400 });
    }

    const phoneRateLimit = enforceRateLimit({
      key: `otp-send:phone:${phone}`,
      limit: 5,
      windowMs: 60 * 60 * 1000,
    });
    if (!phoneRateLimit.ok) {
      return Response.json(
        { message: "Too many OTP requests for this number. Please try again later." },
        { status: 429, headers: { "Retry-After": String(phoneRateLimit.retryAfterSeconds) } },
      );
    }

    const ipRateLimit = enforceRateLimit({
      key: `otp-send:ip:${ip}`,
      limit: 20,
      windowMs: 60 * 60 * 1000,
    });
    if (!ipRateLimit.ok) {
      return Response.json(
        { message: "Too many OTP requests from this network. Please try again later." },
        { status: 429, headers: { "Retry-After": String(ipRateLimit.retryAfterSeconds) } },
      );
    }

    const purpose = typeof body.purpose === "string" && body.purpose ? body.purpose : "login";
    const result = await sendOtp(phone, purpose);

    if (!result.ok) {
      return Response.json({ message: result.message }, { status: 400 });
    }

    return Response.json({ success: true, provider });
  } catch (error) {
    console.error("POST /api/auth/otp/send failed", error);
    return Response.json({ message: "Failed to send OTP. Please try again." }, { status: 500 });
  }
}
