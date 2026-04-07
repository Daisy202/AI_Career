import { defineConfig } from "drizzle-kit";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const dbPath =
  process.env.DATABASE_URL ||
  path.resolve(process.cwd(), "data", "aicareerguide.db");

const url = dbPath.startsWith("file:") ? dbPath : `file:${dbPath.replace(/\\/g, "/")}`;

export default defineConfig({
  schema: path.join(__dirname, "src", "schema"),
  dialect: "sqlite",
  driver: "libsql",
  dbCredentials: {
    url,
  },
  out: path.join(__dirname, "drizzle"),
});
