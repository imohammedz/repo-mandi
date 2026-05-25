export const runtime = "nodejs";

export async function POST(request: Request) {
  void request;
  return Response.json(
    {
      message:
        "This endpoint has been deprecated for login. Start authentication from /auth/login or /admin/login using the MSG91 widget flow.",
    },
    { status: 410 }
  );
}
