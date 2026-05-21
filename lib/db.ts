import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import * as schema from "./schema";

// Lazily create the db instance so the missing env var is only surfaced
// at request time (not during `next build`).
let cachedDb: ReturnType<typeof drizzle> | undefined;

export function getDb() {
  if (cachedDb) return cachedDb;
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error("DATABASE_URL environment variable is not set.");
  }
  const client = postgres(url);
  cachedDb = drizzle(client, { schema });
  return cachedDb;
}

// Re-export a Proxy so call sites can use `db.select()…` directly without
// calling getDb() themselves, while still deferring the connection check.
export const db = new Proxy({} as ReturnType<typeof drizzle>, {
  get(_target, prop) {
    return (getDb() as unknown as Record<string | symbol, unknown>)[prop];
  },
});
