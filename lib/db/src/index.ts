import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "./schema";

const { Pool } = pg;

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

/**
 * Ensure the connection string has an explicit sslmode so pg does not emit a
 * deprecation warning about implicit SSL-mode aliasing (introduced in pg v8,
 * will become a hard error in pg v9 / pg-connection-string v3).
 *
 * Replit's DATABASE_URL typically omits sslmode, which triggers the warning.
 * We default to verify-full in production and require in development/test,
 * matching what the warning text recommends.
 */
function resolveConnectionString(url: string): string {
  try {
    const u = new URL(url);
    if (!u.searchParams.has("sslmode")) {
      u.searchParams.set(
        "sslmode",
        process.env.NODE_ENV === "production" ? "verify-full" : "require"
      );
    }
    return u.toString();
  } catch {
    // Fallback: return the original string unchanged if it can't be parsed.
    return url;
  }
}

export const pool = new Pool({
  connectionString: resolveConnectionString(process.env.DATABASE_URL),
});
export const db = drizzle(pool, { schema });

export * from "./schema";
