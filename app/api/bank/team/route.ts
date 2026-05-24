import { db } from "@/lib/db";
import { users } from "@/lib/schema";
import { and, eq } from "drizzle-orm";
import { requireUser } from "@/lib/auth";

const canManageTeam = new Set(["BANK_ADMIN", "BRANCH_ADMIN", "BANK_MANAGER"]);

export async function GET() {
  const current = await requireUser();
  if (!current.ok) return Response.json({ message: current.message }, { status: current.status });
  if (current.user.accountType !== "BANK_PARTNER" && current.user.accountType !== "ADMIN") {
    return Response.json({ message: "Forbidden." }, { status: 403 });
  }

  const rows = await db
    .select({
      id: users.id,
      fullName: users.fullName,
      phone: users.phone,
      email: users.email,
      bankRole: users.bankRole,
      branchName: users.branchName,
      city: users.city,
      state: users.state,
      verificationStatus: users.verificationStatus,
    })
    .from(users)
    .where(
      current.user.accountType === "ADMIN"
        ? eq(users.accountType, "BANK_PARTNER")
        : and(
            eq(users.accountType, "BANK_PARTNER"),
            eq(users.institutionName, current.user.institutionName),
            eq(users.branchName, current.user.branchName)
          )
    );
  return Response.json(rows);
}

export async function POST(request: Request) {
  const current = await requireUser();
  if (!current.ok) return Response.json({ message: current.message }, { status: current.status });
  if (current.user.accountType !== "BANK_PARTNER") {
    return Response.json({ message: "Forbidden." }, { status: 403 });
  }
  if (!current.user.bankRole || !canManageTeam.has(current.user.bankRole)) {
    return Response.json({ message: "Only bank admins/managers can add team users." }, { status: 403 });
  }

  const body = (await request.json()) as {
    phone?: string;
    fullName?: string;
    email?: string;
    bankRole?: "COLLECTION_AGENT" | "RECOVERY_OFFICER" | "VIEWER";
    city?: string;
    state?: string;
    employeeId?: string;
  };

  const phone = (body.phone ?? "").replace(/\D/g, "").slice(0, 10);
  if (!phone || !body.fullName || !body.bankRole) {
    return Response.json({ message: "Missing required fields." }, { status: 400 });
  }

  const [upserted] = await db
    .insert(users)
    .values({
      phone,
      fullName: body.fullName.trim(),
      email: body.email?.trim() || null,
      accountType: "BANK_PARTNER",
      bankRole: body.bankRole,
      institutionName: current.user.institutionName,
      branchName: current.user.branchName,
      city: body.city?.trim() ?? "",
      state: body.state?.trim() ?? "",
      employeeId: body.employeeId?.trim() || null,
      isProfileComplete: true,
      verificationStatus: "PENDING_VERIFICATION",
      updatedAt: new Date(),
    })
    .onConflictDoUpdate({
      target: users.phone,
      set: {
        fullName: body.fullName.trim(),
        email: body.email?.trim() || null,
        accountType: "BANK_PARTNER",
        bankRole: body.bankRole,
        institutionName: current.user.institutionName,
        branchName: current.user.branchName,
        city: body.city?.trim() ?? "",
        state: body.state?.trim() ?? "",
        employeeId: body.employeeId?.trim() || null,
        updatedAt: new Date(),
      },
    })
    .returning();

  return Response.json(upserted, { status: 201 });
}
