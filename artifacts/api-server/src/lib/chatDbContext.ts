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
import { determineStudentTier, programTypePriority } from "./studentTier.js";

export interface DbProgramRow {
  programName: string;
  schoolName: string;
  programType?: string | null;
  minimumPoints: number | null;
  requiredSubjects: string[];
  minRequiredSubjects: number | null;
  careerCategory: string | null;
}

export async function loadAllPrograms(): Promise<DbProgramRow[]> {
  const rows = await db.select().from(universityProgramsTable);
  return rows.map(r => ({
    programName: r.programName,
    schoolName: r.schoolName,
    programType: r.programType,
    minimumPoints: r.minimumPoints,
    requiredSubjects: r.requiredSubjects,
    minRequiredSubjects: r.minRequiredSubjects,
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

function scoreProgramRelevance(
  program: DbProgramRow,
  messageLower: string,
  studentSubjectsLower: string[]
): number {
  let score = 0;
  const name = program.programName.toLowerCase();
  const category = (program.careerCategory ?? "").toLowerCase();
  const school = program.schoolName.toLowerCase();
  if (messageLower.includes(name)) score += 8;
  if (messageLower.includes(category) && category) score += 5;
  if (messageLower.includes(school)) score += 4;
  if (studentSubjectsLower.length > 0) {
    const subjectHits = (program.requiredSubjects ?? []).filter(req =>
      studentSubjectsLower.some(s => s.includes(req.toLowerCase()) || req.toLowerCase().includes(s))
    ).length;
    score += subjectHits * 3;
  }
  if ((program.programName || "").toLowerCase().includes("diploma")) score += 1;
  return score;
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
  studentSubjects?: string[],
  conversationText?: string,
  studentProfile?: { cutOffPoints?: number | null }
): Promise<string> {
  const programs = await loadAllPrograms();
  const topicText = conversationText ?? message;
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

  const topicHits = programsForMessageTopic(topicText, programs);
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

  const messageLower = message.toLowerCase();
  const studentSubjectsLower = (studentSubjects ?? []).map(s => s.toLowerCase());
  const tier = determineStudentTier({
    aLevelSubjects: studentSubjects ?? [],
    cutOffPoints: studentProfile?.cutOffPoints ?? undefined,
  });
  const ranked = [...relevant].sort((a, b) => {
    const relevanceDelta =
      scoreProgramRelevance(b, messageLower, studentSubjectsLower) -
      scoreProgramRelevance(a, messageLower, studentSubjectsLower);
    if (relevanceDelta !== 0) return relevanceDelta;
    return programTypePriority(a.programType, tier) - programTypePriority(b.programType, tier);
  });

  const bySchool = new Map<string, DbProgramRow[]>();
  for (const p of ranked) {
    const key = p.schoolName;
    if (!bySchool.has(key)) bySchool.set(key, []);
    bySchool.get(key)!.push(p);
  }

  const diversified: DbProgramRow[] = [];
  const schools = [...bySchool.keys()];
  let index = 0;
  while (diversified.length < 80 && schools.length > 0) {
    let addedAny = false;
    for (const school of schools) {
      const list = bySchool.get(school)!;
      if (index < list.length) {
        diversified.push(list[index]);
        addedAny = true;
      }
    }
    if (!addedAny) break;
    index++;
  }

  const slice = diversified.slice(0, 80);
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

  const topicLine = topicText.match(/\b(medicine|doctor|mbchb)\b/i)
    ? "\nCONVERSATION TOPIC: Medicine — stay on medicine/healthcare only; do NOT suggest agriculture or unrelated careers.\n"
    : "";

  const coverage = `Coverage: ${new Set(slice.map(s => s.schoolName)).size} school(s), ${new Set(slice.map(s => s.careerCategory ?? "Uncategorized")).size} category(ies), ${slice.length} program(s) shown.`;
  const tierInstruction =
    tier === "certificate_diploma"
      ? "STUDENT TIER: Certificate/Diploma first. Prioritize certificate and diploma guidance before degrees."
      : tier === "degree_first"
      ? "STUDENT TIER: Degree first. Prioritize degree options, then include diploma/certificate alternatives."
      : "STUDENT TIER: Mixed low-points profile. Prioritize low-threshold degree options and encourage diploma pathways for higher enrollment chances.";

  return `

${ZIMSEC_GRADING_EXPLANATION}
${topicLine}
${coverage}
${tierInstruction}
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

  // Removed the "Verified from our database" footer - no longer added to message

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