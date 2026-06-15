import { getCurrentUser } from "@/lib/auth";
import {
  getSellerListings,
  type SellerListingSearchParams,
} from "@/lib/seller-listings";

export const runtime = "nodejs";

export async function GET(request: Request) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return Response.json({ message: "Unauthorized." }, { status: 401 });
    }

    if (!currentUser.isProfileComplete) {
      return Response.json({ message: "Complete your profile first." }, { status: 403 });
    }

    if (!["SELLER", "BANK_PARTNER", "ADMIN"].includes(currentUser.accountType)) {
      return Response.json({ message: "Forbidden." }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const params: SellerListingSearchParams = {
      sort: searchParams.get("sort") ?? undefined,
      page: searchParams.get("page") ?? undefined,
      limit: searchParams.get("limit") ?? undefined,
    };

    const result = await getSellerListings(currentUser.id, params);

    return Response.json({ items: result.items, pagination: result.pagination }, { status: 200 });
  } catch (error) {
    console.error("GET /api/seller/listings failed", error);
    return Response.json({ message: "Failed to load seller listings." }, { status: 500 });
  }
}
