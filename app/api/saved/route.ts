import { requireUser } from "@/lib/auth";
import {
  getSavedListingForUser,
  getSavedListingsForUser,
  saveListingForUser,
} from "@/lib/saved-listings";

export async function GET() {
  const current = await requireUser();
  if (!current.ok) {
    return Response.json({ message: current.message }, { status: current.status });
  }

  const items = await getSavedListingsForUser(current.user.id);
  return Response.json({ items });
}

export async function POST(request: Request) {
  const current = await requireUser();
  if (!current.ok) {
    return Response.json({ message: current.message }, { status: current.status });
  }

  try {
    const body = (await request.json()) as { listingId?: string; vehicleId?: string };
    const listingId = (body.listingId ?? body.vehicleId ?? "").trim();

    if (!listingId) {
      return Response.json({ message: "listingId is required." }, { status: 400 });
    }

    const result = await saveListingForUser(current.user.id, listingId);
    if (!result.ok) {
      return Response.json({ message: result.message }, { status: result.status });
    }

    const item = await getSavedListingForUser(current.user.id, listingId);
    return Response.json(
      {
        success: true,
        created: result.created,
        item,
      },
      { status: result.created ? 201 : 200 }
    );
  } catch (error) {
    console.error("POST /api/saved failed", error);
    return Response.json({ message: "Failed to save listing." }, { status: 500 });
  }
}
