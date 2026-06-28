import { and, desc, eq, isNull } from "drizzle-orm";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { calculateFinanceEstimate, DEFAULT_FINANCE_ASSUMPTIONS } from "@/lib/finance";
import { isLeadOtpVerificationEnabled } from "@/lib/leads-otp";
import { normalizeToE164 } from "@/lib/otp/phone";
import { enforceRateLimit, getClientIp, isSameOriginRequest } from "@/lib/rate-limit";
import { financeInquiries, vehicles } from "@/lib/schema";

const e164Pattern = /^\+[1-9]\d{7,14}$/;
const MAX_REQUIREMENT_TEXT_LENGTH = 1000;

const toNumericValue = (value: unknown) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

export async function GET() {
  const currentUser = await getCurrentUser();
  if (!currentUser) return Response.json({ message: "Unauthorized." }, { status: 401 });
  if (currentUser.accountType !== "ADMIN") return Response.json({ message: "Forbidden." }, { status: 403 });

  const rows = await db
    .select()
    .from(financeInquiries)
    .orderBy(desc(financeInquiries.createdAt));

  return Response.json(rows);
}

export async function POST(request: Request) {
  try {
    if (!isSameOriginRequest(request)) {
      return Response.json({ message: "Invalid request origin." }, { status: 403 });
    }

    const ip = getClientIp(request);
    const ipRateLimit = enforceRateLimit({
      key: `finance-inquiries:create:ip:${ip}`,
      limit: 20,
      windowMs: 10 * 60 * 1000,
    });
    if (!ipRateLimit.ok) {
      return Response.json(
        { message: "Too many finance inquiry requests. Please try again later." },
        { status: 429, headers: { "Retry-After": String(ipRateLimit.retryAfterSeconds) } },
      );
    }

    const body = (await request.json()) as {
      vehicleId?: string;
      buyerName?: string;
      buyerPhone?: string;
      requirementText?: string;
      phoneVerified?: boolean;
    };

    if (!body.vehicleId || !body.buyerName || !body.buyerPhone || !body.requirementText) {
      return Response.json(
        { message: "vehicleId, buyerName, buyerPhone and requirementText are required." },
        { status: 400 }
      );
    }

    const buyerName = body.buyerName.trim();
    const requirementText = body.requirementText.trim();
    if (!buyerName || !requirementText) {
      return Response.json({ message: "Buyer name and requirement text are required." }, { status: 400 });
    }
    if (requirementText.length > MAX_REQUIREMENT_TEXT_LENGTH) {
      return Response.json(
        { message: `Requirement text must be ${MAX_REQUIREMENT_TEXT_LENGTH} characters or less.` },
        { status: 400 },
      );
    }

    const buyerPhone = normalizeToE164(body.buyerPhone ?? "");
    if (!buyerPhone || !e164Pattern.test(buyerPhone)) {
      return Response.json({ message: "Enter a valid buyer phone number." }, { status: 400 });
    }

    if (isLeadOtpVerificationEnabled() && body.phoneVerified !== true) {
      return Response.json({ message: "Phone verification is required." }, { status: 400 });
    }

    const [vehicle] = await db
      .select({
        id: vehicles.id,
        sellerId: vehicles.sellerId,
        title: vehicles.title,
        brand: vehicles.brand,
        model: vehicles.model,
        year: vehicles.year,
        listingType: vehicles.listingType,
        assetStructure: vehicles.assetStructure,
        assetCategory: vehicles.assetCategory,
        bodyApplicationType: vehicles.bodyApplicationType,
        expectedPrice: vehicles.expectedPrice,
        price: vehicles.price,
        city: vehicles.city,
        state: vehicles.state,
        vehicleOrYardLocation: vehicles.vehicleOrYardLocation,
        sellerName: vehicles.sellerName,
        sellerPhone: vehicles.sellerPhone,
        isPublished: vehicles.isPublished,
        listingStatus: vehicles.listingStatus,
        deletedAt: vehicles.deletedAt,
      })
      .from(vehicles)
      .where(and(eq(vehicles.id, body.vehicleId), isNull(vehicles.deletedAt)));

    if (!vehicle) {
      return Response.json({ message: "Vehicle not found." }, { status: 404 });
    }

    const currentUser = await getCurrentUser();
    const isOwner = Boolean(currentUser?.id && vehicle.sellerId === currentUser.id);
    const canBypassPublicCheck = currentUser?.accountType === "ADMIN" || isOwner;
    const isPublicVehicle = vehicle.isPublished && vehicle.listingStatus === "VERIFIED";

    if (!isPublicVehicle && !canBypassPublicCheck) {
      return Response.json({ message: "Vehicle not available for finance inquiries." }, { status: 403 });
    }

    const listingPrice = toNumericValue(vehicle.expectedPrice) ?? toNumericValue(vehicle.price);
    const estimate = calculateFinanceEstimate({
      listingPrice,
      downPaymentPercent: DEFAULT_FINANCE_ASSUMPTIONS.downPaymentPercent,
      annualInterestRate: DEFAULT_FINANCE_ASSUMPTIONS.annualInterestRate,
      tenureMonths: DEFAULT_FINANCE_ASSUMPTIONS.tenureMonths,
    });

    const location = vehicle.vehicleOrYardLocation || [vehicle.city, vehicle.state].filter(Boolean).join(", ") || null;

    const [inserted] = await db
      .insert(financeInquiries)
      .values({
        vehicleId: vehicle.id,
        sellerId: vehicle.sellerId ?? null,
        buyerName,
        buyerPhone,
        requirementText,
        phoneVerified: body.phoneVerified === true,
        listingTitle: vehicle.title || "Vehicle Listing",
        listingPrice: estimate?.listingPrice ?? null,
        estimatedEmi: estimate?.estimatedEmi ?? null,
        loanAmount: estimate?.loanAmount ?? null,
        downPaymentAmount: estimate?.downPaymentAmount ?? null,
        interestRate: String(estimate?.annualInterestRate ?? DEFAULT_FINANCE_ASSUMPTIONS.annualInterestRate),
        tenureMonths: estimate?.tenureMonths ?? DEFAULT_FINANCE_ASSUMPTIONS.tenureMonths,
        vehicleSnapshot: {
          title: vehicle.title || "Vehicle Listing",
          brand: vehicle.brand || null,
          model: vehicle.model || null,
          year: vehicle.year ?? null,
          listingType: vehicle.listingType || null,
          assetStructure: vehicle.assetStructure || null,
          assetCategory: vehicle.assetCategory || null,
          bodyApplicationType: vehicle.bodyApplicationType || null,
          price: estimate?.listingPrice ?? null,
          location,
          sellerName: vehicle.sellerName || null,
          sellerPhone: vehicle.sellerPhone || null,
        },
        status: "NEW",
        updatedAt: new Date(),
      })
      .returning();

    return Response.json(inserted, { status: 201 });
  } catch (error) {
    console.error("POST /api/finance-inquiries failed", error);
    return Response.json({ message: "Failed to create finance inquiry." }, { status: 500 });
  }
}
