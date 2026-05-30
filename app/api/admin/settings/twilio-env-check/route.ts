import { requireUser } from "@/lib/auth";
import { checkTwilioEnv } from "@/lib/otp/providers/twilio-sms";

export const runtime = "nodejs";

// GET /api/admin/settings/twilio-env-check
// Returns the list of missing Twilio env vars (names only, no values).
// Only accessible by ADMIN.
export async function GET() {
  const current = await requireUser();
  if (!current.ok) {
    return Response.json({ message: current.message }, { status: current.status });
  }
  if (current.user.accountType !== "ADMIN") {
    return Response.json({ message: "Forbidden." }, { status: 403 });
  }

  const result = checkTwilioEnv();
  return Response.json({ missing: result.ok ? [] : result.missing });
}
