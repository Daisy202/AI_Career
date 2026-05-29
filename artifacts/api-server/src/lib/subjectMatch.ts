import {
  A_LEVEL_SUBJECTS,
  O_LEVEL_SUBJECTS,
  subjectAlias as baseSubjectAlias,
} from "@workspace/zimsec-subjects";

export const subjectAlias = baseSubjectAlias;

const KNOWN_SUBJECTS = [...new Set([...A_LEVEL_SUBJECTS, ...O_LEVEL_SUBJECTS])];

const KNOWN_BY_LOWER = new Map(KNOWN_SUBJECTS.map(s => [s.toLowerCase(), s]));

/** Typos / informal names only — never merge distinct ZIMSEC subjects (e.g. Pure Mathematics → Mathematics). */
const CANONICAL_ALIASES: Record<string, string> = {
  maths: "Mathematics",
  math: "Mathematics",
  bio: "Biology",
  chem: "Chemistry",
  lit: "Literature in English",
  literature: "Literature in English",
  english: "English Language",
  ict: "Computer Science",
  historry: "History",
  "english literature": "Literature in English",
  "eng lit": "Literature in English",
  shona: "Shona",
  "pure maths": "Pure Mathematics",
  "pure math": "Pure Mathematics",
  "additional maths": "Additional Mathematics",
  "additional math": "Additional Mathematics",
  stats: "Statistics",
};

/**
 * Canonicalize a subject for storage and display.
 * Preserves distinct checkbox labels (Pure Mathematics, Statistics, etc.).
 * Fuzzy subjectAlias() is only used when matching program requirements, not here.
 */
export function normalizeSubjectName(input: string): string | null {
  const raw = input.trim();
  if (!raw) return null;
  const lower = raw.toLowerCase();

  const exact = KNOWN_BY_LOWER.get(lower);
  if (exact) return exact;

  if (CANONICAL_ALIASES[lower]) return CANONICAL_ALIASES[lower];

  return null;
}

function escapeRegExp(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export function extractNormalizedSubjectsFromText(text: string): string[] {
  const tokens = text
    .split(/[,/&]| and | with |\n|\t/gi)
    .map(t => t.trim())
    .filter(Boolean);

  const out = new Set<string>();

  for (const token of tokens) {
    const normalized = normalizeSubjectName(token);
    if (normalized) out.add(normalized);
  }

  const lower = text.toLowerCase();
  const sortedKnown = [...KNOWN_SUBJECTS].sort((a, b) => b.length - a.length);
  for (const known of sortedKnown) {
    const k = known.toLowerCase();
    const re = new RegExp(`\\b${escapeRegExp(k)}\\b`, "i");
    if (!re.test(lower)) continue;

    for (const existing of [...out]) {
      const e = existing.toLowerCase();
      if (e.includes(k) && existing.length > known.length) continue;
      if (k.includes(e) && known.length > existing.length) out.delete(existing);
    }
    out.add(known);
  }

  return [...out];
}

/** Canonicalize subject names before matching, DB queries, or AI prompts. */
export function normalizeSubjectList(subjects: string[]): string[] {
  const out: string[] = [];
  for (const raw of subjects) {
    const normalized = normalizeSubjectName(raw);
    if (normalized && !out.includes(normalized)) out.push(normalized);
  }
  return out;
}
