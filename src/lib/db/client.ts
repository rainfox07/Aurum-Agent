import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { getDatabaseUrl } from "@/lib/env";
import * as schema from "@/lib/db/schema";

let cachedDb: ReturnType<typeof createDb> | null = null;

export function getDb() {
  if (!cachedDb) {
    cachedDb = createDb();
  }
  return cachedDb;
}

function createDb() {
  const databaseUrl = getDatabaseUrl();
  if (!databaseUrl) {
    throw new Error("DATABASE_URL is not configured.");
  }

  const client = postgres(databaseUrl, {
    max: 1,
    prepare: false
  });

  return drizzle(client, { schema });
}
