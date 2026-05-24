import { db, universitiesTable } from "@workspace/db";

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
    acronyms: r.acronyms ?? [],
  }));
  return cache;
}

export function clearUniversitiesCache(): void {
  cache = null;
}

/** Resolve acronym or partial name to canonical university name from DB. */
export async function resolveUniversityName(query: string): Promise<string | null> {
  const q = query.trim().toLowerCase();
  if (!q) return null;
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
  return null;
}

/** Find university names/acronyms mentioned in free text. */
export async function findUniversitiesInText(text: string): Promise<string[]> {
  const lower = text.toLowerCase();
  const found = new Set<string>();
  const universities = await loadUniversities();
  for (const u of universities) {
    if (lower.includes(u.name.toLowerCase())) {
      found.add(u.name);
      continue;
    }
    for (const ac of u.acronyms) {
      const pattern = new RegExp(`\\b${escapeRegex(ac)}\\b`, "i");
      if (pattern.test(text)) found.add(u.name);
    }
  }
  return [...found];
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
