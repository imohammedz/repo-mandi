import { db } from "@/lib/db";
import { users } from "@/lib/schema";
import { requireUser } from "@/lib/auth";
import { normalizeIndianPhone } from "@/lib/otp/phone";

export async function POST(request: Request) {
  const current = await requireUser();
  if (!current.ok) {
    return Response.json({ message: current.message }, { status: current.status });
  }
  if (current.user.accountType !== "ADMIN") {
    return Response.json({ message: "Forbidden." }, { status: 403 });
  }

  const body = (await request.json()) as {
    phone?: string;
    fullName?: string;
    email?: string;
    institutionName?: string;
    branchName?: string;
    bankRole?: "BANK_MANAGER" | "COLLECTION_AGENT" | "RECOVERY_OFFICER" | "BRANCH_ADMIN" | "NBFC_PARTNER" | "BANK_ADMIN" | "VIEWER";
    city?: string;
    state?: string;
    employeeId?: string;
  };

  const phone = normalizeIndianPhone(body.phone ?? "");
  if (!phone || !body.fullName || !body.bankRole || !body.institutionName || !body.branchName) {
    return Response.json({ message: "Missing required fields." }, { status: 400 });
  }

  try {
    const [created] = await db
      .insert(users)
      .values({
        phone,
        fullName: body.fullName.trim(),
        email: body.email?.trim() || null,
        accountType: "BANK_PARTNER",
        bankRole: body.bankRole,
        institutionName: body.institutionName.trim(),
        branchName: body.branchName.trim(),
        city: body.city?.trim() ?? "",
        state: body.state?.trim() ?? "",
        employeeId: body.employeeId?.trim() || null,
        isProfileComplete: true,
        isVerified: false,
        verificationStatus: "PENDING_VERIFICATION",
        updatedAt: new Date(),
      })
      .returning();

    return Response.json(created, { status: 201 });
  } catch (error) {
    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      error.code === "23505"
    ) {
      return Response.json({ message: "An account with this phone number already exists." }, { status: 409 });
    }
    throw error;
  }
}
