import { NextResponse } from "next/server";
import { parseListingPayload } from "@/lib/validation";
import { listVehicles, submitVehicleListing } from "@/lib/vehicle-store";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const vehicles = listVehicles({
    search: searchParams.get("search") ?? undefined,
    vehicleType: searchParams.get("vehicleType") ?? undefined,
    brand: searchParams.get("brand") ?? undefined,
    city: searchParams.get("city") ?? undefined,
    state: searchParams.get("state") ?? undefined,
    financeCompany: searchParams.get("financeCompany") ?? undefined,
    verificationStatus: searchParams.get("verificationStatus") ?? undefined,
    minPrice: Number(searchParams.get("minPrice") || "") || undefined,
    maxPrice: Number(searchParams.get("maxPrice") || "") || undefined,
  });

  return NextResponse.json({ data: vehicles });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const payload = parseListingPayload(body);
    const listing = submitVehicleListing(payload);

    return NextResponse.json({ data: listing }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Invalid request payload" },
      { status: 400 },
    );
  }
}
