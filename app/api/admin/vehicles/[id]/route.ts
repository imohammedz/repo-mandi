import { NextResponse } from "next/server";
import { parseListingStatus } from "@/lib/validation";
import { updateListingStatus } from "@/lib/vehicle-store";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  let status;
  try {
    const body = await request.json();
    status = parseListingStatus(body.status);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Invalid listing status" },
      { status: 400 },
    );
  }

  const updated = updateListingStatus(id, status);

  if (!updated) {
    return NextResponse.json({ error: "Listing not found" }, { status: 404 });
  }

  return NextResponse.json({ data: updated });
}
