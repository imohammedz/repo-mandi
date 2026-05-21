import { db } from "@/lib/db";
import { leads, vehicles } from "@/lib/schema";
import { desc, eq, and, sql } from "drizzle-orm";
import { getCurrentUser } from "@/lib/auth";

type LeadSource = "CALL" | "WHATSAPP" | "REQUEST_DETAILS";

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
    const body = (await request.json()) as {
      vehicleId?: string;
      source?: LeadSource;
      buyerName?: string;
      buyerPhone?: string;
      message?: string;
    };

    if (!body.vehicleId || !body.source) {
      return Response.json({ message: "vehicleId and source are required." }, { status: 400 });
    }
    if (!["CALL", "WHATSAPP", "REQUEST_DETAILS"].includes(body.source)) {
      return Response.json({ message: "Invalid source." }, { status: 400 });
    }

    const [vehicle] = await db
      .select({
        id: vehicles.id,
        sellerId: vehicles.sellerId,
        isPublished: vehicles.isPublished,
      })
      .from(vehicles)
      .where(and(eq(vehicles.id, body.vehicleId), eq(vehicles.isPublished, true)));

    if (!vehicle?.sellerId) {
      return Response.json({ message: "Vehicle not found." }, { status: 404 });
    }

    const [inserted] = await db
      .insert(leads)
      .values({
        vehicleId: body.vehicleId,
        sellerId: vehicle.sellerId,
        buyerName: body.buyerName?.trim() || null,
        buyerPhone: body.buyerPhone?.trim() || null,
        source: body.source,
        message: body.message?.trim() || null,
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
