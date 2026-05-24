import { getCurrentUser, sessionCookieOptions } from "@/lib/auth";
import { NextResponse } from "next/server";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ authenticated: false }, { status: 401 });
  }
  return NextResponse.json({
    authenticated: true,
    user: {
      id: user.id,
      phone: user.phone,
      fullName: user.fullName,
      accountType: user.accountType,
      sellerRole: user.sellerRole,
      bankRole: user.bankRole,
      businessName: user.businessName,
      city: user.city,
      state: user.state,
      isProfileComplete: user.isProfileComplete,
      verificationStatus: user.verificationStatus,
      trustScore: user.trustScore,
      createdAt: user.createdAt,
    },
  });
}

export async function DELETE() {
  return clearSession();
}

export async function POST() {
  return clearSession();
}

function clearSession() {
  const response = NextResponse.json({ success: true });
  response.cookies.set({
    ...sessionCookieOptions(),
    value: "",
    maxAge: 0,
  });
  return response;
}
