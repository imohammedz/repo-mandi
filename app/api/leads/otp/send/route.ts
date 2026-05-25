export const runtime = "nodejs";

export async function POST(request: Request) {
  void request;
  return Response.json({
    success: true,
    otpEnabled: false,
    message: "OTP verification is disabled for lead submissions.",
  });
}
