import { db } from "@/lib/db";
import { users } from "@/lib/schema";
import { eq } from "drizzle-orm";

export const runtime = "nodejs";

// ── GET /api/users?phone= ─────────────────────────────────────────────────────
export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const phone = url.searchParams.get("phone");

    if (phone) {
      const [row] = await db.select().from(users).where(eq(users.phone, phone));
      return row
        ? Response.json(row)
        : Response.json({ message: "User not found." }, { status: 404 });
    }

    const rows = await db.select().from(users);
    return Response.json(rows);
  } catch (error) {
    console.error("GET /api/users failed", error);
    return Response.json({ message: "Failed to fetch users." }, { status: 500 });
  }
}

// ── POST /api/users ───────────────────────────────────────────────────────────
// Upserts a user by phone (called after OTP verification on the role page).
export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { phone?: string; role?: string };
    const phone = (body.phone ?? "").replace(/\D/g, "");

    if (!phone) {
      return Response.json({ message: "phone is required." }, { status: 400 });
    }

    const [upserted] = await db
      .insert(users)
      .values({ phone, role: body.role ?? null })
      .onConflictDoUpdate({
        target: users.phone,
        set: {
          role: body.role ?? null,
          updatedAt: new Date(),
        },
      })
      .returning();

    return Response.json(upserted, { status: 201 });
  } catch (error) {
    console.error("POST /api/users failed", error);
    return Response.json({ message: "Failed to upsert user." }, { status: 500 });
  }
}
