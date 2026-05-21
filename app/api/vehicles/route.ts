import { db } from "@/lib/db";
import { vehicles } from "@/lib/schema";
import { eq, ilike, and, or, desc, gte, lte, ne } from "drizzle-orm";
import { nanoid } from "./nanoid";
import { getCurrentUser } from "@/lib/auth";

export const runtime = "nodejs";

const VALID_TYPES = ["Truck", "Tipper", "Pickup", "Bus", "Trailer", "Tractor"] as const;
type VehicleType = (typeof VALID_TYPES)[number];

// ── GET /api/vehicles?type=&state=&q= ─────────────────────────────────────────
export async function GET(request: Request) {
  try {
    const currentUser = await getCurrentUser();
    const url = new URL(request.url);
    const typeParam = url.searchParams.get("type");
    const state = url.searchParams.get("state") ?? url.searchParams.get("registrationState");
    const query = url.searchParams.get("q");
    const city = url.searchParams.get("city");
    const brand = url.searchParams.get("brand");
    const financeCompany = url.searchParams.get("financeCompany");
    const mine = url.searchParams.get("mine") === "1";
    const includeAll = url.searchParams.get("includeAll") === "1";
    const verifiedOnly = url.searchParams.get("verifiedOnly") === "1";
    const minPrice = url.searchParams.get("minPrice");
    const maxPrice = url.searchParams.get("maxPrice");

    if (typeParam && !VALID_TYPES.includes(typeParam as VehicleType)) {
      return Response.json(
        { message: `type must be one of: ${VALID_TYPES.join(", ")}.` },
        { status: 400 }
      );
    }
    const type = typeParam as VehicleType | null;

    const conditions = [];

    const isAdmin = currentUser?.accountType === "ADMIN";
    const shouldApplyPublicGate = !(isAdmin && includeAll) && !mine;
    if (shouldApplyPublicGate) {
      conditions.push(eq(vehicles.isPublished, true));
      conditions.push(eq(vehicles.listingStatus, "VERIFIED"));
      conditions.push(ne(vehicles.listingStatus, "SOLD"));
    }

    if (mine) {
      if (!currentUser || !["SELLER", "BANK_PARTNER", "ADMIN"].includes(currentUser.accountType)) {
        return Response.json({ message: "Unauthorized." }, { status: 401 });
      }
      conditions.push(eq(vehicles.sellerId, currentUser.id));
    }

    if (type) conditions.push(eq(vehicles.type, type));
    if (state) conditions.push(eq(vehicles.state, state));
    if (city) conditions.push(ilike(vehicles.city, `%${city}%`));
    if (brand) conditions.push(ilike(vehicles.brand, `%${brand}%`));
    if (financeCompany) conditions.push(ilike(vehicles.financeCompany, `%${financeCompany}%`));
    if (verifiedOnly) conditions.push(eq(vehicles.sellerVerified, true));
    if (minPrice) conditions.push(gte(vehicles.price, minPrice));
    if (maxPrice) conditions.push(lte(vehicles.price, maxPrice));
    if (query) {
      conditions.push(
        or(
          ilike(vehicles.title, `%${query}%`),
          ilike(vehicles.brand, `%${query}%`),
          ilike(vehicles.model, `%${query}%`),
          ilike(vehicles.city, `%${query}%`)
        )
      );
    }

    const rows =
      conditions.length > 0
        ? await db
            .select()
            .from(vehicles)
            .where(and(...conditions))
            .orderBy(desc(vehicles.createdAt))
        : await db.select().from(vehicles).orderBy(desc(vehicles.createdAt));

    return Response.json(rows);
  } catch (error) {
    console.error("GET /api/vehicles failed", error);
    return Response.json({ message: "Failed to fetch vehicles." }, { status: 500 });
  }
}

// ── POST /api/vehicles ────────────────────────────────────────────────────────
export async function POST(request: Request) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return Response.json({ message: "Unauthorized." }, { status: 401 });
    }
    if (!["SELLER", "BANK_PARTNER", "ADMIN"].includes(currentUser.accountType)) {
      return Response.json({ message: "Only sellers or bank partners can post listings." }, { status: 403 });
    }
    if (!currentUser.isProfileComplete) {
      return Response.json({ message: "Complete your profile before posting." }, { status: 403 });
    }

    const body = (await request.json()) as Record<string, unknown>;

    const {
      title,
      type,
      brand,
      model,
      year,
      kmDriven,
      fuelType,
      axleType,
      registrationState,
      city,
      state,
      image,
      gallery,
      financeCompany,
      price,
      reservePrice,
      repoStatus,
      sellerType,
      sellerName,
      sellerRole,
      sellerPhone,
      condition,
      conditionNotes,
      accidentNotes,
      auctionDate,
      yardLocation,
      verifiedBadges,
      inspectionNotes,
    } = body;

    if (!title || !type || !brand || !model || !year || !city || !state || !financeCompany || !price) {
      return Response.json(
        { message: "Missing required fields: title, type, brand, model, year, city, state, financeCompany, price." },
        { status: 400 }
      );
    }

    const id = nanoid(title as string, brand as string, model as string, year as string | number);

    const listingStatus =
      currentUser.accountType === "BANK_PARTNER" ? "BANK_PENDING_REVIEW" : "PENDING";

    const [inserted] = await db
      .insert(vehicles)
      .values({
        id,
        sellerId: currentUser.id,
        createdByUserId: currentUser.id,
        title: String(title),
        type: type as typeof vehicles.type._.data,
        brand: String(brand),
        model: String(model),
        year: Number(year),
        kmDriven: kmDriven ? Number(kmDriven) : 0,
        fuelType: (fuelType as typeof vehicles.fuelType._.data) ?? "Diesel",
        axleType: axleType ? String(axleType) : "",
        registrationState: registrationState ? String(registrationState) : "",
        city: String(city),
        state: String(state),
        image: image ? String(image) : "",
        gallery: Array.isArray(gallery) ? (gallery as string[]) : [],
        financeCompany: String(financeCompany),
        bankInstitutionName:
          currentUser.accountType === "BANK_PARTNER" ? currentUser.institutionName : "",
        branchName: currentUser.accountType === "BANK_PARTNER" ? currentUser.branchName : "",
        price: String(price),
        reservePrice: reservePrice ? String(reservePrice) : "0",
        repoStatus: (repoStatus as typeof vehicles.repoStatus._.data) ?? "Ready For Sale",
        sellerType:
          currentUser.accountType === "BANK_PARTNER"
            ? "Bank Agent"
            : ((sellerType as typeof vehicles.sellerType._.data) ?? "Yard Partner"),
        sellerName: currentUser.fullName || (sellerName ? String(sellerName) : ""),
        sellerRole: currentUser.sellerRole || currentUser.bankRole || (sellerRole ? String(sellerRole) : ""),
        sellerPhone: currentUser.phone || (sellerPhone ? String(sellerPhone) : ""),
        condition: (condition as typeof vehicles.condition._.data) ?? "Running",
        conditionNotes: conditionNotes ? String(conditionNotes) : "",
        accidentNotes: accidentNotes ? String(accidentNotes) : "",
        auctionDate: auctionDate ? String(auctionDate) : "",
        yardLocation: yardLocation ? String(yardLocation) : "",
        verifiedBadges: Array.isArray(verifiedBadges) ? (verifiedBadges as string[]) : [],
        inspectionNotes: Array.isArray(inspectionNotes) ? (inspectionNotes as string[]) : [],
        listingStatus,
        verificationStatus: "PENDING_VERIFICATION",
        isPublished: false,
        rcVerified: false,
        photosVerified: false,
        yardVerified: false,
        sellerVerified: currentUser.isVerified,
        missingPhotos: !Array.isArray(gallery) || gallery.length < 3,
        priceTooLow: Number(price) < 100000,
        duplicateRegistration: false,
        newSeller: !currentUser.isVerified,
        missingYardLocation: !yardLocation,
        rejectionReason: "",
        verifiedBy: null,
        verifiedAt: null,
      })
      .returning();

    return Response.json(inserted, { status: 201 });
  } catch (error) {
    console.error("POST /api/vehicles failed", error);
    return Response.json({ message: "Failed to create vehicle." }, { status: 500 });
  }
}
