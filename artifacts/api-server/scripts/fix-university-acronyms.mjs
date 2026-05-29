import { config } from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
config({ path: path.resolve(__dirname, "..", "..", "..", ".env") });

const { client } = await import("@workspace/db");

await client.execute("UPDATE universities SET acronyms = '[]'");
console.log("Reset all university acronyms (will re-sync)");

const { syncUniversityAcronyms, loadUniversities, clearUniversitiesCache } = await import(
  "../src/lib/universities.ts"
);
clearUniversitiesCache();
await syncUniversityAcronyms();
const loaded = await loadUniversities();
const cut = loaded.find(u => u.name.includes("Chinhoyi"));
console.log("Chinhoyi acronyms:", cut?.acronyms);
