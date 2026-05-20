import { db } from "@/lib/db";
import { vehicles } from "@/lib/schema";
import { eq, ilike, or, desc } from "drizzle-orm";
import { nanoid } from "./nanoid";

export const runtime = "nodejs";

const VALID_TYPES = ["Truck", "Tipper", "Pickup", "Bus", "Trailer", "Tractor"] as const;
type VehicleType = (typeof VALID_TYPES)[number];

// ── GET /api/vehicles?type=&state=&q= ─────────────────────────────────────────
export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const typeParam = url.searchParams.get("type");
    const state = url.searchParams.get("state");
    const query = url.searchParams.get("q");

    if (typeParam && !VALID_TYPES.includes(typeParam as VehicleType)) {
      return Response.json(
        { message: `type must be one of: ${VALID_TYPES.join(", ")}.` },
        { status: 400 }
      );
    }
    const type = typeParam as VehicleType | null;

    const conditions = [];
    if (type) conditions.push(eq(vehicles.type, type));
    if (state) conditions.push(eq(vehicles.state, state));
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
            .where(conditions.length === 1 ? conditions[0] : or(...conditions))
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

    const [inserted] = await db
      .insert(vehicles)
      .values({
        id,
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
        price: String(price),
        reservePrice: reservePrice ? String(reservePrice) : "0",
        repoStatus: (repoStatus as typeof vehicles.repoStatus._.data) ?? "Ready For Sale",
        sellerType: (sellerType as typeof vehicles.sellerType._.data) ?? "Bank Agent",
        sellerName: sellerName ? String(sellerName) : "",
        sellerRole: sellerRole ? String(sellerRole) : "",
        sellerPhone: sellerPhone ? String(sellerPhone) : "",
        condition: (condition as typeof vehicles.condition._.data) ?? "Running",
        conditionNotes: conditionNotes ? String(conditionNotes) : "",
        accidentNotes: accidentNotes ? String(accidentNotes) : "",
        auctionDate: auctionDate ? String(auctionDate) : "",
        yardLocation: yardLocation ? String(yardLocation) : "",
        verifiedBadges: Array.isArray(verifiedBadges) ? (verifiedBadges as string[]) : [],
        inspectionNotes: Array.isArray(inspectionNotes) ? (inspectionNotes as string[]) : [],
      })
      .returning();

    return Response.json(inserted, { status: 201 });
  } catch (error) {
    console.error("POST /api/vehicles failed", error);
    return Response.json({ message: "Failed to create vehicle." }, { status: 500 });
  }
}
