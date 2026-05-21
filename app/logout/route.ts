import { NextResponse } from "next/server";
import { sessionCookieOptions } from "@/lib/auth";

export async function GET(request: Request) {
  const response = NextResponse.redirect(new URL("/auth/login", request.url));
  response.cookies.set({
    ...sessionCookieOptions(),
    value: "",
    maxAge: 0,
  });
  return response;
}

