import { requireUser } from "@/lib/auth";
import { removeSavedListingForUser } from "@/lib/saved-listings";
import { enforceRateLimit, getClientIp, isSameOriginRequest } from "@/lib/rate-limit";

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ listingId: string }> }
) {
  if (!isSameOriginRequest(request)) {
    return Response.json({ message: "Invalid request origin." }, { status: 403 });
  }

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

  const { listingId } = await params;
  if (!listingId) {
    return Response.json({ message: "listingId is required." }, { status: 400 });
  }

  const removed = await removeSavedListingForUser(current.user.id, listingId);
  if (!removed) {
    return Response.json({ message: "Listing was not saved." }, { status: 404 });
  }

  return Response.json({ success: true });
}
