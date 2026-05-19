import { NextResponse } from "next/server";
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
  const body = await request.json();

  const listing = submitVehicleListing({
    vehicleType: body.vehicleType,
    brand: body.brand,
    model: body.model,
    year: Number(body.year),
    registrationState: body.registrationState,
    price: Number(body.price),
    financeCompany: body.financeCompany,
    city: body.city,
    state: body.state,
    yardLocation: body.yardLocation,
    condition: body.condition,
    sellerName: body.sellerName,
    sellerPhone: body.sellerPhone,
  });

  return NextResponse.json({ data: listing }, { status: 201 });
}
