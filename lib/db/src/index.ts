import { drizzle } from "drizzle-orm/libsql";
import { createClient } from "@libsql/client";
import * as schema from "./schema";
import path from "path";
import { mkdirSync, existsSync } from "fs";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const workspaceRoot = path.resolve(__dirname, "..", "..", "..");

const dbPath =
  process.env.DATABASE_URL ||
  path.resolve(workspaceRoot, "data", "aicareerguide.db");

const url = dbPath.startsWith("file:") || dbPath.startsWith("http")
  ? dbPath
  : `file:${dbPath.replace(/\\/g, "/")}`;

if (!dbPath.startsWith(":") && !dbPath.startsWith("http") && dbPath !== "") {
  const dir = path.dirname(dbPath);
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
  }
}

export const client = createClient({ url });
export const db = drizzle(client, { schema });

export * from "./schema";
