import { isLeadOtpVerificationEnabled } from "@/lib/leads-otp";

export const runtime = "nodejs";

export async function POST(request: Request) {
  void request;
  if (isLeadOtpVerificationEnabled()) {
    return Response.json({ message: "Lead OTP verification is enabled but provider is not configured." }, { status: 503 });
  }
  return Response.json({ message: "OTP verification is disabled for lead submissions." }, { status: 410 });
}
