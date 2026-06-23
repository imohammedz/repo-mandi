import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { db } from "@/lib/db";
import { users } from "@/lib/schema";
import { eq } from "drizzle-orm";

const SESSION_COOKIE_NAME = process.env.NODE_ENV === "production" ? "__Host-rm_session" : "rm_session";
const parsedSessionTtlDays = Number(process.env.SESSION_TTL_DAYS ?? "14");
if (!Number.isFinite(parsedSessionTtlDays) || parsedSessionTtlDays <= 0) {
  throw new Error("SESSION_TTL_DAYS must be a positive number.");
}
const SESSION_TTL_DAYS = parsedSessionTtlDays;
const SESSION_TTL_SECONDS = 60 * 60 * 24 * SESSION_TTL_DAYS;

type SessionPayload = {
  userId: number;
  phone: string;
  iat: number;
  exp: number;
};

function getSessionSecret() {
  const secret = process.env.SESSION_SECRET;
  if (!secret) {
    throw new Error("SESSION_SECRET environment variable is required.");
  }
  return secret;
}

function encodeBase64Url(input: string) {
  return Buffer.from(input, "utf8").toString("base64url");
}

function decodeBase64Url(input: string) {
  return Buffer.from(input, "base64url").toString("utf8");
}

function signPayload(encodedPayload: string) {
  return createHmac("sha256", getSessionSecret()).update(encodedPayload).digest("base64url");
}

export function createSessionToken(userId: number, phone: string) {
  const now = Math.floor(Date.now() / 1000);
  const payload: SessionPayload = {
    userId,
    phone,
    iat: now,
    exp: now + SESSION_TTL_SECONDS,
  };
  const encodedPayload = encodeBase64Url(JSON.stringify(payload));
  const signature = signPayload(encodedPayload);
  return `${encodedPayload}.${signature}`;
}

export function verifySessionToken(token: string): SessionPayload | null {
  const [encodedPayload, signature] = token.split(".");
  if (!encodedPayload || !signature) return null;

  const expectedSignature = signPayload(encodedPayload);
  const sigBuffer = Buffer.from(signature);
  const expectedBuffer = Buffer.from(expectedSignature);
  if (sigBuffer.length !== expectedBuffer.length) return null;
  if (!timingSafeEqual(sigBuffer, expectedBuffer)) return null;

  try {
    const payload = JSON.parse(decodeBase64Url(encodedPayload)) as SessionPayload;
    if (!payload.userId || !payload.phone) return null;
    if (payload.exp < Math.floor(Date.now() / 1000)) return null;
    return payload;
  } catch {
    return null;
  }
}

export async function getSession() {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE_NAME)?.value;
  if (!token) return null;
  return verifySessionToken(token);
}

export async function getCurrentUser() {
  const session = await getSession();
  if (!session) return null;
  const [user] = await db.select().from(users).where(eq(users.id, session.userId));
  return user ?? null;
}

export function sessionCookieOptions() {
  return {
    name: SESSION_COOKIE_NAME,
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge: SESSION_TTL_SECONDS,
  };
}

export async function requireUser() {
  const user = await getCurrentUser();
  if (!user) {
    return { ok: false as const, status: 401, message: "Unauthorized" };
  }
  return { ok: true as const, user };
}
