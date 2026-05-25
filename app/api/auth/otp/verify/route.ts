export const runtime = "nodejs";

export async function POST(request: Request) {
  void request;
  return Response.json(
    {
      message:
        "This endpoint has been deprecated for login. Use /api/auth/msg91/verify after the MSG91 widget success callback.",
    },
    { status: 410 }
  );
}
