import { existsSync, readFileSync } from "node:fs";
import { defineConfig } from "drizzle-kit";

const localEnv = readLocalEnvFile(".env.local");

export default defineConfig({
  schema: "./src/lib/db/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL ?? localEnv.DATABASE_URL ?? "postgres://user:password@localhost:5432/aurum"
  }
});

function readLocalEnvFile(path: string) {
  if (!existsSync(path)) {
    return {} as Record<string, string>;
  }

  return Object.fromEntries(
    readFileSync(path, "utf8")
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter((line) => line && !line.startsWith("#") && line.includes("="))
      .map((line) => {
        const index = line.indexOf("=");
        const key = line.slice(0, index);
        const value = line.slice(index + 1).trim().replace(/^['"]|['"]$/g, "");
        return [key, value];
      })
  );
}
