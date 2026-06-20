import { and, desc, eq, isNull } from "drizzle-orm";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { insuranceInquiries, vehicles } from "@/lib/schema";
import { isLeadOtpVerificationEnabled } from "@/lib/leads-otp";

const e164Pattern = /^\+[1-9]\d{7,14}$/;
const indianTenDigitPattern = /^\d{10}$/;
const MAX_REQUIREMENT_TEXT_LENGTH = 1000;

const normalizeIndianPhone = (rawPhone: string) => {
  const digits = rawPhone.replace(/\D/g, "");
  if (indianTenDigitPattern.test(digits)) return `+91${digits}`;
  if (digits.length === 12 && digits.startsWith("91")) return `+${digits}`;
  return null;
};

export async function GET() {
  const currentUser = await getCurrentUser();
  if (!currentUser) return Response.json({ message: "Unauthorized." }, { status: 401 });
  if (currentUser.accountType !== "ADMIN") return Response.json({ message: "Forbidden." }, { status: 403 });

  const rows = await db.select().from(insuranceInquiries).orderBy(desc(insuranceInquiries.createdAt));
  return Response.json(rows);
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      vehicleId?: string;
      buyerName?: string;
      buyerPhone?: string;
      requirementText?: string;
      phoneVerified?: boolean;
    };

    if (!body.vehicleId || !body.buyerName || !body.buyerPhone) {
      return Response.json({ message: "vehicleId, buyerName and buyerPhone are required." }, { status: 400 });
    }

    const buyerName = body.buyerName.trim();
    if (!buyerName) {
      return Response.json({ message: "Buyer name is required." }, { status: 400 });
    }

    const buyerPhone = normalizeIndianPhone(body.buyerPhone);
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
        insuranceValidity: vehicles.insuranceValidity,
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
      return Response.json({ message: "Vehicle not available for insurance inquiries." }, { status: 403 });
    }

    const location = vehicle.vehicleOrYardLocation || [vehicle.city, vehicle.state].filter(Boolean).join(", ") || null;
    const requirementText = body.requirementText?.trim() || "Need insurance support for this vehicle.";
    if (requirementText.length > MAX_REQUIREMENT_TEXT_LENGTH) {
      return Response.json(
        { message: `Requirement text must be ${MAX_REQUIREMENT_TEXT_LENGTH} characters or less.` },
        { status: 400 },
      );
    }

    const [inserted] = await db
      .insert(insuranceInquiries)
      .values({
        vehicleId: vehicle.id,
        sellerId: vehicle.sellerId ?? null,
        buyerName,
        buyerPhone,
        requirementText,
        phoneVerified: body.phoneVerified === true,
        listingTitle: vehicle.title || "Vehicle Listing",
        insuranceValidTill: vehicle.insuranceValidity ?? null,
        vehicleSnapshot: {
          title: vehicle.title || "Vehicle Listing",
          brand: vehicle.brand || null,
          model: vehicle.model || null,
          year: vehicle.year ?? null,
          listingType: vehicle.listingType || null,
          assetStructure: vehicle.assetStructure || null,
          assetCategory: vehicle.assetCategory || null,
          bodyApplicationType: vehicle.bodyApplicationType || null,
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
    console.error("POST /api/insurance-inquiries failed", error);
    return Response.json({ message: "Failed to create insurance inquiry." }, { status: 500 });
  }
}
