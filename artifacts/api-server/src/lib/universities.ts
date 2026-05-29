import { client, db, universitiesTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { normalizeEducationChatText } from "./chatTextNormalize.js";

/** Well-known Zimbabwe institution acronyms (used when DB acronyms are empty). */
const KNOWN_ACRONYMS: Record<string, string> = {
  cut: "Chinhoyi University of Technology",
  uz: "University of Zimbabwe",
  buse: "Bindura University of Science Education",
  nust: "National University of Science & Technology (NUST)",
  gzu: "Great Zimbabwe University",
  msu: "Midlands State University",
  hit: "Harare Institute of Technology",
  zou: "Zimbabwe Open University",
  au: "Africa University",
};

const ACRONYM_STOP_WORDS = new Set([
  "of",
  "the",
  "and",
  "&",
  "for",
  "in",
  "at",
  "a",
  "an",
]);

/** Build acronym from institution name (e.g. Chinhoyi University of Technology → CUT). */
export function acronymFromSchoolName(name: string): string {
  const fromParen = name.match(/\(([^)]+)\)/);
  if (fromParen?.[1]) {
    const inner = fromParen[1].trim();
    if (inner.length >= 2 && inner.length <= 12 && !inner.includes(" ")) return inner;
  }
  const words = name
    .replace(/\([^)]*\)/g, "")
    .split(/\s+/)
    .map(w => w.replace(/[^A-Za-z]/g, ""))
    .filter(w => w.length > 0 && !ACRONYM_STOP_WORDS.has(w.toLowerCase()));
  if (words.length === 0) return "";
  return words.map(w => w[0]!.toUpperCase()).join("");
}

export function normalizeAcronymsForSchool(name: string): string[] {
  const acronyms: string[] = [];
  const fromParen = name.match(/\(([^)]+)\)/);
  if (fromParen?.[1]) acronyms.push(fromParen[1].trim());
  const letters = acronymFromSchoolName(name);
  if (letters.length >= 2 && letters.length <= 12) acronyms.push(letters);
  const known = Object.entries(KNOWN_ACRONYMS).find(([, full]) => full.toLowerCase() === name.toLowerCase());
  if (known) acronyms.push(known[0].toUpperCase());
  return [...new Set(acronyms.map(a => a.trim()).filter(Boolean))];
}

export interface UniversityRecord {
  id: number;
  name: string;
  acronyms: string[];
}

let cache: UniversityRecord[] | null = null;

export async function loadUniversities(): Promise<UniversityRecord[]> {
  if (cache) return cache;
  const rows = await db.select().from(universitiesTable);
  cache = rows.map(r => ({
    id: r.id,
    name: r.name,
    acronyms: mergeAcronyms(r.name, r.acronyms ?? []),
  }));
  return cache;
}

function mergeAcronyms(name: string, stored: string[]): string[] {
  return [...new Set([...stored, ...normalizeAcronymsForSchool(name)])];
}

export function clearUniversitiesCache(): void {
  cache = null;
}

function schoolNameTokenScore(query: string, schoolName: string): number {
  const stop = new Set(["of", "the", "and", "at", "for", "in"]);
  const qTokens = query
    .toLowerCase()
    .split(/\s+/)
    .map(t => t.replace(/[^a-z]/g, ""))
    .filter(t => t.length > 2 && !stop.has(t));
  if (qTokens.length === 0) return 0;
  const nameLower = schoolName.toLowerCase();
  let hit = 0;
  for (const t of qTokens) {
    if (nameLower.includes(t)) hit++;
  }
  return hit / qTokens.length;
}

function resolveFromProgramSchools(query: string, programSchools: string[]): string | null {
  const q = query.trim().toLowerCase();
  if (!q) return null;
  let best: { name: string; score: number } | null = null;
  for (const name of programSchools) {
    if (name.toLowerCase() === q) return name;
    const ac = acronymFromSchoolName(name).toLowerCase();
    if (ac && ac === q) return name;
    for (const a of normalizeAcronymsForSchool(name)) {
      if (a.toLowerCase() === q) return name;
    }
    if (name.toLowerCase().includes(q) && q.length >= 4) return name;
    if (q.includes(name.toLowerCase())) return name;
    const score = schoolNameTokenScore(q, name);
    if (score >= 0.66 && (!best || score > best.score)) best = { name, score };
  }
  return best?.name ?? null;
}

/** Resolve acronym or partial name to canonical university name from DB. */
export async function resolveUniversityName(
  query: string,
  programSchools?: string[]
): Promise<string | null> {
  const q = normalizeEducationChatText(query).trim().toLowerCase();
  if (!q) return null;

  if (KNOWN_ACRONYMS[q]) return KNOWN_ACRONYMS[q];

  const universities = await loadUniversities();
  for (const u of universities) {
    if (u.name.toLowerCase() === q) return u.name;
    for (const ac of u.acronyms) {
      if (ac.toLowerCase() === q) return u.name;
    }
  }
  for (const u of universities) {
    if (u.name.toLowerCase().includes(q) || q.includes(u.name.toLowerCase().slice(0, 12))) {
      return u.name;
    }
  }

  if (programSchools?.length) {
    return resolveFromProgramSchools(query, programSchools);
  }
  return null;
}

/** Find university names/acronyms mentioned in free text. */
export async function findUniversitiesInText(
  text: string,
  programSchools?: string[]
): Promise<string[]> {
  const normalized = normalizeEducationChatText(text);
  const lower = normalized.toLowerCase();
  const found = new Set<string>();
  const universities = await loadUniversities();
  for (const u of universities) {
    if (lower.includes(u.name.toLowerCase())) {
      found.add(u.name);
      continue;
    }
    for (const ac of u.acronyms) {
      const pattern = new RegExp(`\\b${escapeRegex(ac)}\\b`, "i");
      if (pattern.test(normalized)) found.add(u.name);
    }
  }

  for (const [acronym, fullName] of Object.entries(KNOWN_ACRONYMS)) {
    if (new RegExp(`\\b${escapeRegex(acronym)}\\b`, "i").test(normalized)) found.add(fullName);
  }

  if (programSchools) {
    for (const name of programSchools) {
      if (lower.includes(name.toLowerCase())) found.add(name);
      const ac = acronymFromSchoolName(name);
      if (ac && new RegExp(`\\b${escapeRegex(ac)}\\b`, "i").test(text)) found.add(name);
    }
  }

  return [...found];
}

/** Parse school name after "at/from/for" when acronym is used (e.g. "offered at CUT"). */
export function extractSchoolMention(message: string): string | null {
  const text = normalizeEducationChatText(message);
  const m = text.match(
    /\b(?:at|from|for)\s+([A-Za-z][A-Za-z0-9&.'()\- ]{1,58}?)(?:\s*\?|\s*$|\s+and\s|\s+with\s)/i
  );
  if (m?.[1]) return m[1].trim().replace(/[?.!,]+$/, "");
  const end = text.match(/\b(?:at|from|for)\s+([A-Za-z][A-Za-z0-9&.'()\- ]{1,58})\s*$/i);
  return end?.[1]?.trim().replace(/[?.!,]+$/, "") ?? null;
}

function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export async function seedUniversitiesIfEmpty(): Promise<void> {
  const existing = await db.select({ id: universitiesTable.id }).from(universitiesTable).limit(1);
  if (existing.length > 0) return;

  const defaults: Array<{ name: string; acronyms: string[] }> = [
    { name: "University of Zimbabwe", acronyms: ["UZ", "U.Z."] },
    { name: "Bindura University of Science Education", acronyms: ["BUSE", "Bindura"] },
    { name: "Chinhoyi University of Technology", acronyms: ["CUT", "Chinhoyi"] },
    {
      name: "National University of Science & Technology (NUST)",
      acronyms: ["NUST", "NUST ZW"],
    },
    { name: "Africa University", acronyms: ["AU", "Africa U"] },
    { name: "Great Zimbabwe University", acronyms: ["GZU", "Great Zimbabwe"] },
    { name: "TelOne Centre for Learning", acronyms: ["TelOne", "TCL"] },
  ];

  for (const u of defaults) {
    await db.insert(universitiesTable).values(u);
  }
  clearUniversitiesCache();
}

function parseStoredAcronyms(raw: unknown): string[] {
  if (Array.isArray(raw)) return raw.map(String);
  if (typeof raw !== "string" || !raw.trim()) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.map(String) : [];
  } catch {
    return [];
  }
}

/** Backfill empty acronym arrays so chat can resolve CUT, UZ, etc. */
export async function syncUniversityAcronyms(): Promise<void> {
  const result = await client.execute("SELECT id, name, acronyms FROM universities");
  let updated = 0;
  for (const row of result.rows) {
    const id = Number(row.id);
    const name = String(row.name);
    const stored = parseStoredAcronyms(row.acronyms);
    const merged = mergeAcronyms(name, stored);
    if (merged.length === stored.length && merged.every((a, i) => a === stored[i])) continue;
    await db
      .update(universitiesTable)
      .set({ acronyms: merged })
      .where(eq(universitiesTable.id, id));
    updated++;
  }
  if (updated > 0) clearUniversitiesCache();
}
