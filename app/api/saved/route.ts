import { requireUser } from "@/lib/auth";
import {
  getSavedListingForUser,
  getSavedListingsForUser,
  saveListingForUser,
} from "@/lib/saved-listings";
import { enforceRateLimit, getClientIp } from "@/lib/rate-limit";

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

  const ip = getClientIp(request);
  const userRateLimit = enforceRateLimit({
    key: `saved-toggle:user:${current.user.id}`,
    limit: 40,
    windowMs: 10 * 60 * 1000,
  });
  if (!userRateLimit.ok) {
    return Response.json(
      { message: "Too many save actions. Please try again in a few minutes." },
      { status: 429, headers: { "Retry-After": String(userRateLimit.retryAfterSeconds) } },
    );
  }

  const ipRateLimit = enforceRateLimit({
    key: `saved-toggle:ip:${ip}`,
    limit: 100,
    windowMs: 10 * 60 * 1000,
  });
  if (!ipRateLimit.ok) {
    return Response.json(
      { message: "Too many save actions from this network. Please try again later." },
      { status: 429, headers: { "Retry-After": String(ipRateLimit.retryAfterSeconds) } },
    );
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
