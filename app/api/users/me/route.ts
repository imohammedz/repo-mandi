import { db } from "@/lib/db";
import { users } from "@/lib/schema";
import { eq } from "drizzle-orm";
import { requireUser } from "@/lib/auth";

type AccountType = "BUYER" | "SELLER" | "BANK_PARTNER" | "ADMIN";

function isSellerProfileComplete(data: {
  fullName?: string;
  city?: string;
  state?: string;
  sellerRole?: string | null;
}) {
  return Boolean(data.fullName && data.city && data.state && data.sellerRole);
}

function isBuyerProfileComplete(data: {
  fullName?: string;
}) {
  return Boolean(data.fullName);
}

function isBankProfileComplete(data: {
  fullName?: string;
  email?: string | null;
  institutionName?: string;
  branchName?: string;
  city?: string;
  state?: string;
  bankRole?: string | null;
}) {
  return Boolean(
    data.fullName &&
      data.email &&
      data.institutionName &&
      data.branchName &&
      data.city &&
      data.state &&
      data.bankRole
  );
}

export async function GET() {
  const current = await requireUser();
  if (!current.ok) {
    return Response.json({ message: current.message }, { status: current.status });
  }
  return Response.json(current.user);
}

export async function PATCH(request: Request) {
  const current = await requireUser();
  if (!current.ok) {
    return Response.json({ message: current.message }, { status: current.status });
  }

  const body = (await request.json()) as {
    fullName?: string;
    email?: string;
    accountType?: AccountType;
    sellerRole?: "BROKER" | "DEALER" | "YARD_OWNER" | "RECOVERY_AGENT" | "TRUCK_OWNER" | "FLEET_OWNER";
    bankRole?: "BANK_MANAGER" | "COLLECTION_AGENT" | "RECOVERY_OFFICER" | "BRANCH_ADMIN" | "NBFC_PARTNER" | "BANK_ADMIN" | "VIEWER";
    businessName?: string;
    institutionName?: string;
    branchName?: string;
    employeeId?: string;
    city?: string;
    state?: string;
  };

  const nextAccountType = body.accountType ?? current.user.accountType;

  if (nextAccountType === "BANK_PARTNER" && current.user.accountType !== "BANK_PARTNER") {
    return Response.json({ message: "Bank onboarding is admin-controlled." }, { status: 403 });
  }
  if (nextAccountType === "ADMIN" && current.user.accountType !== "ADMIN") {
    return Response.json({ message: "Admin role escalation is restricted." }, { status: 403 });
  }

  const merged = {
    fullName: (body.fullName ?? current.user.fullName).trim(),
    email: (body.email ?? current.user.email ?? "").trim() || null,
    accountType: nextAccountType,
    sellerRole: body.sellerRole ?? current.user.sellerRole,
    bankRole: body.bankRole ?? current.user.bankRole,
    businessName: (body.businessName ?? current.user.businessName).trim(),
    institutionName: (body.institutionName ?? current.user.institutionName).trim(),
    branchName: (body.branchName ?? current.user.branchName).trim(),
    employeeId: (body.employeeId ?? current.user.employeeId ?? "").trim() || null,
    city: (body.city ?? current.user.city).trim(),
    state: (body.state ?? current.user.state).trim(),
  };

  const isProfileComplete =
    merged.accountType === "SELLER"
      ? isSellerProfileComplete(merged)
      : merged.accountType === "BANK_PARTNER"
        ? isBankProfileComplete(merged)
        : isBuyerProfileComplete(merged);

  const verificationStatus =
    merged.accountType === "BANK_PARTNER" ? "PENDING_VERIFICATION" : current.user.verificationStatus;

  const [updated] = await db
    .update(users)
    .set({
      fullName: merged.fullName,
      email: merged.email,
      accountType: merged.accountType,
      sellerRole: merged.accountType === "SELLER" ? merged.sellerRole : null,
      bankRole: merged.accountType === "BANK_PARTNER" ? merged.bankRole : null,
      businessName: merged.businessName,
      institutionName: merged.institutionName,
      branchName: merged.branchName,
      employeeId: merged.employeeId,
      city: merged.city,
      state: merged.state,
      isProfileComplete,
      verificationStatus,
      updatedAt: new Date(),
    })
    .where(eq(users.id, current.user.id))
    .returning();

  return Response.json(updated);
}
