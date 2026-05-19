import { NextResponse } from "next/server";
import { updateListingStatus } from "@/lib/vehicle-store";
import type { ListingStatus } from "@/lib/types";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await request.json();

  const status = String(body.status ?? "PENDING") as ListingStatus;
  const updated = updateListingStatus(id, status);

  if (!updated) {
    return NextResponse.json({ error: "Listing not found" }, { status: 404 });
  }

  return NextResponse.json({ data: updated });
}
