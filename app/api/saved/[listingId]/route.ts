import { requireUser } from "@/lib/auth";
import { removeSavedListingForUser } from "@/lib/saved-listings";

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ listingId: string }> }
) {
  const current = await requireUser();
  if (!current.ok) {
    return Response.json({ message: current.message }, { status: current.status });
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
