import { requireUser } from "@/lib/auth";
import { checkWhatsAppEnv } from "@/lib/otp/providers/whatsapp";

export const runtime = "nodejs";

// GET /api/admin/settings/whatsapp-env-check
// Returns the list of missing WhatsApp env vars (names only, no values).
// Only accessible by ADMIN. Used by the admin settings UI to show a warning
// when WhatsApp provider is selected but credentials are not configured.
export async function GET() {
  const current = await requireUser();
  if (!current.ok) {
    return Response.json({ message: current.message }, { status: current.status });
  }
  if (current.user.accountType !== "ADMIN") {
    return Response.json({ message: "Forbidden." }, { status: 403 });
  }

  const result = checkWhatsAppEnv();
  return Response.json({ missing: result.ok ? [] : result.missing });
}
