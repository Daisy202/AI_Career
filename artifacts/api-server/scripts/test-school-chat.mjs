import { config } from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
config({ path: path.resolve(__dirname, "..", "..", "..", ".env") });

const { syncUniversityAcronyms, resolveUniversityName } = await import("../src/lib/universities.ts");
const { answerFromDatabase } = await import("../src/lib/chatQuestionRouter.ts");
const { loadAllPrograms, loadCareersForChat } = await import("../src/lib/chatDbContext.ts");

await syncUniversityAcronyms();
const programs = await loadAllPrograms();
const careers = await loadCareersForChat();
const programSchools = [...new Set(programs.map(p => p.schoolName))];

const tests = [
  "what programs are offered at CUT",
  "what programs are offered at Univesity of zimbabwe",
];

for (const msg of tests) {
const { isClearlyOutOfScope } = await import("../src/lib/chatQuestionRouter.ts");
console.log("\n---", msg);
console.log("out_of_scope?", isClearlyOutOfScope(msg));
const mention = msg.match(/at\s+(.+)$/i)?.[1];
if (mention) console.log("resolve ->", await resolveUniversityName(mention, programSchools));
const ans = await answerFromDatabase({
  message: msg,
  conversationText: msg,
  programs,
  careers,
});
console.log(ans ? ans.slice(0, 280) : "NULL");
}
