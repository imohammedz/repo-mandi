import { db } from "@/lib/db";
import { leads, vehicles } from "@/lib/schema";
import { desc, eq, and, isNull, ne, sql } from "drizzle-orm";
import { getCurrentUser } from "@/lib/auth";
import { normalizeToE164 } from "@/lib/otp/phone";
import { enforceRateLimit, getClientIp, isSameOriginRequest } from "@/lib/rate-limit";

type LeadSource = "CALL" | "WHATSAPP" | "REQUEST_DETAILS";
const e164Pattern = /^\+[1-9]\d{7,14}$/;

export async function GET(request: Request) {
  const currentUser = await getCurrentUser();
  if (!currentUser) {
    return Response.json({ message: "Unauthorized." }, { status: 401 });
  }

  const url = new URL(request.url);
  const mine = url.searchParams.get("mine") === "1";
  const sellerIdParam = url.searchParams.get("sellerId");

  if (currentUser.accountType !== "ADMIN" && !mine) {
    return Response.json({ message: "Forbidden." }, { status: 403 });
  }

  const filterSellerId = mine
    ? currentUser.id
    : sellerIdParam
      ? Number(sellerIdParam)
      : null;

  const query = db
    .select({
      id: leads.id,
      vehicleId: leads.vehicleId,
      sellerId: leads.sellerId,
      buyerName: leads.buyerName,
      buyerPhone: leads.buyerPhone,
      source: leads.source,
      message: leads.message,
      phoneVerified: leads.phoneVerified,
      createdAt: leads.createdAt,
      vehicleTitle: vehicles.title,
    })
    .from(leads)
    .leftJoin(vehicles, eq(leads.vehicleId, vehicles.id))
    .orderBy(desc(leads.createdAt));

  const rows = filterSellerId
    ? await query.where(eq(leads.sellerId, filterSellerId))
    : await query;

  return Response.json(rows);
}

export async function POST(request: Request) {
  try {
    if (!isSameOriginRequest(request)) {
      return Response.json({ message: "Invalid request origin." }, { status: 403 });
    }

    const ip = getClientIp(request);
    const ipRateLimit = enforceRateLimit({
      key: `leads:create:ip:${ip}`,
      limit: 20,
      windowMs: 10 * 60 * 1000,
    });
    if (!ipRateLimit.ok) {
      return Response.json(
        { message: "Too many inquiry requests. Please try again later." },
        { status: 429, headers: { "Retry-After": String(ipRateLimit.retryAfterSeconds) } },
      );
    }

    const body = (await request.json()) as {
      vehicleId?: string;
      source?: LeadSource;
      buyerName?: string;
      buyerPhone?: string;
      message?: string;
      phoneVerified?: boolean;
    };

    if (!body.vehicleId || !body.source || !body.buyerName || !body.buyerPhone) {
      return Response.json({ message: "vehicleId, source, buyerName and buyerPhone are required." }, { status: 400 });
    }
    if (!["CALL", "WHATSAPP", "REQUEST_DETAILS"].includes(body.source)) {
      return Response.json({ message: "Invalid source." }, { status: 400 });
    }
    const buyerName = body.buyerName.trim();
    if (!buyerName) {
      return Response.json({ message: "Buyer name is required." }, { status: 400 });
    }
    const buyerPhone = normalizeToE164(body.buyerPhone ?? "");
    if (!buyerPhone || !e164Pattern.test(buyerPhone)) {
      return Response.json({ message: "Enter a valid buyer phone number." }, { status: 400 });
    }

    const [vehicle] = await db
      .select({
        id: vehicles.id,
        sellerId: vehicles.sellerId,
        isPublished: vehicles.isPublished,
        listingStatus: vehicles.listingStatus,
      })
      .from(vehicles)
      .where(
        and(
          eq(vehicles.id, body.vehicleId),
          eq(vehicles.isPublished, true),
          isNull(vehicles.deletedAt),
          ne(vehicles.status, "SOLD")
        )
      );

    if (!vehicle?.sellerId) {
      return Response.json({ message: "Vehicle not found." }, { status: 404 });
    }

    const [inserted] = await db
      .insert(leads)
      .values({
        vehicleId: body.vehicleId,
        sellerId: vehicle.sellerId,
        buyerName,
        buyerPhone,
        source: body.source,
        message: body.message?.trim() || null,
        phoneVerified: body.phoneVerified === true,
      })
      .returning();

    await db
      .update(vehicles)
      .set({
        inquiries: sql`${vehicles.inquiries} + 1`,
        updatedAt: new Date(),
      })
      .where(eq(vehicles.id, body.vehicleId));

    return Response.json(inserted, { status: 201 });
  } catch (error) {
    console.error("POST /api/leads failed", error);
    return Response.json({ message: "Failed to create lead." }, { status: 500 });
  }
}
