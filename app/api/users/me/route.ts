import { db } from "@/lib/db";
import { accountTypeEnum, bankRoleEnum, sellerRoleEnum, users } from "@/lib/schema";
import { eq } from "drizzle-orm";
import { requireUser } from "@/lib/auth";

type SellerRole = (typeof sellerRoleEnum.enumValues)[number];
type BankRole = (typeof bankRoleEnum.enumValues)[number];

const ACCOUNT_TYPES = new Set(accountTypeEnum.enumValues);
const SELLER_ROLES = new Set(sellerRoleEnum.enumValues);
const BANK_ROLES = new Set(bankRoleEnum.enumValues);

function trimString(value: unknown) {
  return typeof value === "string" ? value.trim() : null;
}

function parseOptionalEnum<T extends string>(value: unknown, allowed: Set<T>, field: string) {
  if (value === undefined) {
    return { ok: true as const, value: undefined };
  }

  if (value === null || value === "") {
    return { ok: true as const, value: null };
  }

  if (typeof value !== "string") {
    return { ok: false as const, message: `${field} must be a string.` };
  }

  const normalized = value.trim().toUpperCase() as T;
  if (!allowed.has(normalized)) {
    return { ok: false as const, message: `Invalid ${field}.` };
  }

  return { ok: true as const, value: normalized };
}

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

  let body: Record<string, unknown>;
  try {
    const parsed = await request.json();
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      return Response.json({ message: "Invalid profile payload." }, { status: 400 });
    }
    body = parsed as Record<string, unknown>;
  } catch {
    return Response.json({ message: "Invalid profile payload." }, { status: 400 });
  }

  const parsedAccountType = parseOptionalEnum(body.accountType, ACCOUNT_TYPES, "accountType");
  if (!parsedAccountType.ok) {
    return Response.json({ message: parsedAccountType.message }, { status: 400 });
  }
  const parsedSellerRole = parseOptionalEnum(body.sellerRole, SELLER_ROLES, "sellerRole");
  if (!parsedSellerRole.ok) {
    return Response.json({ message: parsedSellerRole.message }, { status: 400 });
  }
  const parsedBankRole = parseOptionalEnum(body.bankRole, BANK_ROLES, "bankRole");
  if (!parsedBankRole.ok) {
    return Response.json({ message: parsedBankRole.message }, { status: 400 });
  }

  for (const field of ["fullName", "email", "businessName", "institutionName", "branchName", "employeeId", "city", "state"]) {
    if (field in body && typeof body[field] !== "string") {
      return Response.json({ message: `${field} must be a string.` }, { status: 400 });
    }
  }

  const nextAccountType =
    current.user.accountType === "BANK_PARTNER"
      ? current.user.accountType
      : (parsedAccountType.value ?? current.user.accountType);

  if (nextAccountType === "BANK_PARTNER" && current.user.accountType !== "BANK_PARTNER") {
    return Response.json({ message: "Bank onboarding is admin-controlled." }, { status: 403 });
  }
  if (nextAccountType === "ADMIN" && current.user.accountType !== "ADMIN") {
    return Response.json({ message: "Admin role escalation is restricted." }, { status: 403 });
  }

  const isSelfManagedBankPartner = current.user.accountType === "BANK_PARTNER";

  const merged = {
    fullName: trimString(body.fullName) ?? current.user.fullName,
    email: trimString(body.email) ?? current.user.email ?? null,
    accountType: nextAccountType,
    sellerRole: (parsedSellerRole.value ?? current.user.sellerRole) as SellerRole | null,
    bankRole:
      isSelfManagedBankPartner
        ? current.user.bankRole
        : ((parsedBankRole.value ?? current.user.bankRole) as BankRole | null),
    businessName: trimString(body.businessName) ?? current.user.businessName,
    institutionName:
      isSelfManagedBankPartner
        ? current.user.institutionName
        : (trimString(body.institutionName) ?? current.user.institutionName),
    branchName:
      isSelfManagedBankPartner
        ? current.user.branchName
        : (trimString(body.branchName) ?? current.user.branchName),
    employeeId: trimString(body.employeeId) ?? current.user.employeeId ?? null,
    city: trimString(body.city) ?? current.user.city,
    state: trimString(body.state) ?? current.user.state,
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
