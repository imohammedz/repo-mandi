import { db } from "@/lib/db";
import { platformSettings } from "@/lib/schema";
import { eq } from "drizzle-orm";
import { requireUser } from "@/lib/auth";

export const runtime = "nodejs";

const ALLOWED_KEYS = ["AUTO_APPROVE_LISTINGS"] as const;
type SettingKey = (typeof ALLOWED_KEYS)[number];

async function getSetting(key: SettingKey): Promise<string | null> {
  const [row] = await db
    .select()
    .from(platformSettings)
    .where(eq(platformSettings.key, key));
  return row?.value ?? null;
}

// GET /api/admin/settings
export async function GET() {
  const current = await requireUser();
  if (!current.ok) {
    return Response.json({ message: current.message }, { status: current.status });
  }
  if (current.user.accountType !== "ADMIN") {
    return Response.json({ message: "Forbidden." }, { status: 403 });
  }

  const autoApprove = await getSetting("AUTO_APPROVE_LISTINGS");

  return Response.json({
    AUTO_APPROVE_LISTINGS: autoApprove === "true",
  });
}

// PATCH /api/admin/settings
export async function PATCH(request: Request) {
  const current = await requireUser();
  if (!current.ok) {
    return Response.json({ message: current.message }, { status: current.status });
  }
  if (current.user.accountType !== "ADMIN") {
    return Response.json({ message: "Forbidden." }, { status: 403 });
  }

  const body = (await request.json()) as Record<string, unknown>;

  for (const key of Object.keys(body)) {
    if (!ALLOWED_KEYS.includes(key as SettingKey)) {
      return Response.json({ message: `Unknown setting key: ${key}` }, { status: 400 });
    }
  }

  const results: Record<string, boolean> = {};

  for (const key of ALLOWED_KEYS) {
    if (!(key in body)) continue;
    const boolValue = Boolean(body[key]);
    await db
      .insert(platformSettings)
      .values({ key, value: String(boolValue), updatedAt: new Date() })
      .onConflictDoUpdate({
        target: platformSettings.key,
        set: { value: String(boolValue), updatedAt: new Date() },
      });
    results[key] = boolValue;
  }

  return Response.json(results);
}
