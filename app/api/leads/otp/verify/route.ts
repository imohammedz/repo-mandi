export const runtime = "nodejs";

export async function POST(request: Request) {
  void request;
  return Response.json({ message: "OTP verification is disabled for lead submissions." }, { status: 410 });
}
