import { requireUser } from "@/lib/auth";
import { getSavedListingsForUser } from "@/lib/saved-listings";

export async function GET() {
  const current = await requireUser();
  if (!current.ok) {
    return Response.json({ message: current.message }, { status: current.status });
  }

  const items = await getSavedListingsForUser(current.user.id, { limit: 10 });
  return Response.json({ items });
}
