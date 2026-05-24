import { db, universityProgramsTable } from "@workspace/db";
import { extractProgramsFromAiText } from "./aiAdvice.js";
import { findUniversitiesInText, resolveUniversityName } from "./universities.js";
import {
  normalizeZimsecCutoff,
  sanitizeZimsecPointsInText,
  ZIMSEC_CUTOFF_MAX,
  ZIMSEC_CUTOFF_MIN,
  ZIMSEC_GRADING_EXPLANATION,
} from "./zimsecPoints.js";

export interface DbProgramRow {
  programName: string;
  schoolName: string;
  minimumPoints: number | null;
  requiredSubjects: string[];
  careerCategory: string | null;
}

export async function loadAllPrograms(): Promise<DbProgramRow[]> {
  const rows = await db.select().from(universityProgramsTable);
  return rows.map(r => ({
    programName: r.programName,
    schoolName: r.schoolName,
    minimumPoints: r.minimumPoints,
    requiredSubjects: r.requiredSubjects,
    careerCategory: r.careerCategory,
  }));
}

const TOPIC_FILTERS: Array<{ keys: string[]; match: (p: DbProgramRow) => boolean }> = [
  {
    keys: ["medicine", "doctor", "mbchb", "medical", "surgery", "healthcare", "nursing"],
    match: p =>
      (p.careerCategory ?? "").toLowerCase().includes("health") ||
      p.programName.toLowerCase().includes("medicine") ||
      p.programName.toLowerCase().includes("nursing"),
  },
  {
    keys: ["engineer", "engineering"],
    match: p =>
      (p.careerCategory ?? "").toLowerCase().includes("engineer") ||
      p.programName.toLowerCase().includes("engineer"),
  },
  {
    keys: ["law", "lawyer", "llb"],
    match: p =>
      (p.careerCategory ?? "").toLowerCase().includes("law") ||
      p.programName.toLowerCase().includes("law"),
  },
];

function programsForMessageTopic(message: string, programs: DbProgramRow[]): DbProgramRow[] {
  const lower = message.toLowerCase();
  for (const t of TOPIC_FILTERS) {
    if (t.keys.some(k => lower.includes(k))) {
      const hits = programs.filter(t.match);
      if (hits.length > 0) return hits;
    }
  }
  return [];
}

function messageMentionsPrograms(message: string, programs: DbProgramRow[]): DbProgramRow[] {
  const lower = message.toLowerCase();
  const hits: DbProgramRow[] = [];
  for (const p of programs) {
    const words = p.programName.toLowerCase().split(/\s+/).filter(w => w.length > 3);
    const matchCount = words.filter(w => lower.includes(w)).length;
    if (matchCount >= 2 || lower.includes(p.programName.toLowerCase())) {
      hits.push(p);
    }
  }
  return hits;
}

export async function buildChatDbContext(
  message: string,
  studentSubjects?: string[]
): Promise<string> {
  const programs = await loadAllPrograms();
  const mentionedSchools = await findUniversitiesInText(message);
  const resolved = await resolveUniversityName(message);
  if (resolved && !mentionedSchools.includes(resolved)) mentionedSchools.push(resolved);

  let relevant = programs;
  if (mentionedSchools.length > 0) {
    relevant = programs.filter(p =>
      mentionedSchools.some(
        s =>
          p.schoolName.toLowerCase() === s.toLowerCase() ||
          p.schoolName.toLowerCase().includes(s.toLowerCase().slice(0, 10))
      )
    );
  }

  const topicHits = programsForMessageTopic(message, programs);
  if (topicHits.length > 0) {
    relevant = topicHits;
  }

  const programHits = messageMentionsPrograms(message, programs);
  if (programHits.length > 0) {
    const keys = new Set(relevant.map(p => `${p.schoolName}|${p.programName}`));
    for (const p of programHits) {
      const k = `${p.schoolName}|${p.programName}`;
      if (!keys.has(k)) {
        relevant.push(p);
        keys.add(k);
      }
    }
  }

  if (studentSubjects && studentSubjects.length > 0 && relevant.length > 40) {
    const subLower = studentSubjects.map(s => s.toLowerCase());
    relevant = relevant
      .filter(p =>
        p.requiredSubjects.length === 0 ||
        p.requiredSubjects.some(req =>
          subLower.some(s => s.includes(req.toLowerCase()) || req.toLowerCase().includes(s))
        )
      )
      .slice(0, 25);
  }

  const slice = relevant.slice(0, 30);
  if (slice.length === 0) return "";

  const lines = slice.map(p => {
    const pts =
      p.minimumPoints != null
        ? `cut-off ≤${p.minimumPoints} pts`
        : "no cut-off on file";
    const subs =
      p.requiredSubjects.length > 0
        ? `A-Level: ${p.requiredSubjects.join(", ")}`
        : "no A-Level required";
    return `- **${p.programName}** @ ${p.schoolName} (${pts}; ${subs})`;
  });

  return `

${ZIMSEC_GRADING_EXPLANATION}

VERIFIED DATABASE PROGRAMS (you MUST use these for subject and cut-off answers; never refuse A-Level requirement questions):
${lines.join("\n")}`;
}

export function enrichChatResponse(
  aiText: string,
  dbPrograms: Array<{ programName: string; schoolName: string }>,
  studentCutoff?: number | null
): { message: string; verifiedPrograms: Array<{ programName: string; schoolName: string }> } {
  let message = aiText;
  message = sanitizeZimsecPointsInText(message);

  const verified = extractProgramsFromAiText(message, dbPrograms);
  const normalizedCutoff = normalizeZimsecCutoff(studentCutoff ?? undefined);

  if (verified.length > 0) {
    const footer = verified
      .slice(0, 5)
      .map(p => `• ${p.programName} (${p.schoolName})`)
      .join("\n");
    if (!message.includes("Verified from our database")) {
      message += `\n\n**Verified from our database:**\n${footer}`;
    }
  }

  if (normalizedCutoff != null && message.match(/\b1[0-9]{2}\b/)) {
    message = message.replace(/\b1[0-9]{2}\b/g, String(normalizedCutoff));
  }

  return {
    message,
    verifiedPrograms: verified.map(p => ({
      programName: p.programName,
      schoolName: p.schoolName,
    })),
  };
}

