import { db, universityProgramsTable, careersTable } from "@workspace/db";
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
import { programMeetsRequiredSubjects } from "./subjectGate.js";
import { subjectAlias } from "./subjectMatch.js";
import {
  buildAiRecommendationPayload,
  payloadToPromptBlock,
} from "./programRecommendationEngine.js";
import { normalizeSubjectList } from "./subjectMatch.js";

export interface DbProgramRow {
  programName: string;
  schoolName: string;
  programType?: string | null;
  minimumPoints: number | null;
  requiredSubjects: string[];
  minRequiredSubjects: number | null;
  careerCategory: string | null;
}

export interface CareerRow {
  name: string;
  description: string;
  category: string;
  aLevelSubjects: string[];
  averageSalary: string;
  jobOutlook: string;
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

export async function loadCareersForChat(): Promise<CareerRow[]> {
  const rows = await db.select().from(careersTable);
  return rows.map(r => ({
    name: r.name,
    description: r.description,
    category: r.category,
    aLevelSubjects: r.aLevelSubjects ?? [],
    averageSalary: r.averageSalary,
    jobOutlook: r.jobOutlook,
  }));
}

const TOPIC_FILTERS: Array<{ keys: string[]; match: (p: DbProgramRow) => boolean }> = [
  {
    keys: ["medicine", "doctor", "mbchb", "medical", "surgery", "healthcare", "nursing", "pharmacy"],
    match: p =>
      (p.careerCategory ?? "").toLowerCase().includes("health") ||
      /medicine|nursing|health|pharmacy|clinical/i.test(p.programName),
  },
  {
    keys: ["engineer", "engineering", "civil", "mechanical", "electrical", "mining"],
    match: p =>
      (p.careerCategory ?? "").toLowerCase().includes("engineer") ||
      p.programName.toLowerCase().includes("engineer"),
  },
  {
    keys: ["law", "lawyer", "llb", "legal"],
    match: p =>
      (p.careerCategory ?? "").toLowerCase().includes("law") ||
      p.programName.toLowerCase().includes("law"),
  },
  {
    keys: ["account", "commerce", "business", "finance", "marketing", "entrepreneur"],
    match: p =>
      (p.careerCategory ?? "").toLowerCase().includes("business") ||
      /account|commerce|business|finance|marketing|management/i.test(p.programName),
  },
  {
    keys: ["software", "computer", "programming", "ict", "cyber", "data science", "developer"],
    match: p =>
      (p.careerCategory ?? "").toLowerCase().includes("technology") ||
      /computer|software|information|cyber|data|ict/i.test(p.programName),
  },
  {
    keys: ["teach", "education", "teacher", "bed"],
    match: p =>
      (p.careerCategory ?? "").toLowerCase().includes("education") ||
      p.programName.toLowerCase().includes("education"),
  },
  {
    keys: ["agriculture", "farming", "agronomy", "veterinary"],
    match: p =>
      (p.careerCategory ?? "").toLowerCase().includes("agriculture") ||
      /agriculture|agri|animal|crop/i.test(p.programName),
  },
  {
    keys: ["journalism", "media", "communication", "graphic", "film"],
    match: p =>
      /media|journalism|communication|graphic|film|radio/i.test(p.programName) ||
      (p.careerCategory ?? "").toLowerCase().includes("media"),
  },
  {
    keys: ["tourism", "hospitality", "hotel"],
    match: p => /tourism|hospitality|hotel/i.test(p.programName),
  },
  {
    keys: ["polytechnic", "hexco", "tvet", "diploma", "certificate", "welding", "automotive"],
    match: p => {
      const t = (p.programType ?? "degree").toLowerCase();
      return t === "diploma" || t === "certificate" || /welding|automotive|trade/i.test(p.programName);
    },
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
  studentSubjectsLower: string[],
  studentOLevelLower: string[] = []
): number {
  let score = 0;
  const name = program.programName.toLowerCase();
  const category = (program.careerCategory ?? "").toLowerCase();
  const school = program.schoolName.toLowerCase();
  if (messageLower.includes(name)) score += 8;
  if (messageLower.includes(category) && category) score += 5;
  if (messageLower.includes(school)) score += 4;
  if (studentSubjectsLower.length > 0) {
    const meetsSubjects = programMeetsRequiredSubjects(
      program.requiredSubjects,
      program.minRequiredSubjects,
      studentSubjectsLower,
      studentOLevelLower
    );
    if (meetsSubjects) score += 25;
    else score -= 12;
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
  studentProfile?: {
    cutOffPoints?: number | null;
    oLevelSubjects?: string[];
    interests?: string[];
    strengths?: string[];
    personalityType?: string | null;
  }
): Promise<string> {
  const programs = await loadAllPrograms();
  const aLevelSubjects = normalizeSubjectList(studentSubjects ?? []);
  const oLevelSubjects = normalizeSubjectList(studentProfile?.oLevelSubjects ?? []);
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

  const messageLower = message.toLowerCase();
  const studentSubjectsLower = aLevelSubjects.map(s => s.toLowerCase());
  const studentOLevelLower = oLevelSubjects.map(s => s.toLowerCase());

  if (studentSubjectsLower.length > 0 && relevant.length > 0) {
    const subjectQualified = relevant.filter(p =>
      programMeetsRequiredSubjects(
        p.requiredSubjects,
        p.minRequiredSubjects,
        aLevelSubjects,
        oLevelSubjects
      )
    );
    if (subjectQualified.length > 0) {
      relevant = subjectQualified;
    }
  }
  const tier = determineStudentTier({
    aLevelSubjects,
    cutOffPoints: studentProfile?.cutOffPoints ?? undefined,
  });
  const ranked = [...relevant].sort((a, b) => {
    const relevanceDelta =
      scoreProgramRelevance(b, messageLower, studentSubjectsLower, studentOLevelLower) -
      scoreProgramRelevance(a, messageLower, studentSubjectsLower, studentOLevelLower);
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

  const payload = buildAiRecommendationPayload(programs, {
    subjects: aLevelSubjects,
    oLevelSubjects,
    cutOffPoints: studentProfile?.cutOffPoints ?? null,
    interests: studentProfile?.interests ?? [],
    strengths: studentProfile?.strengths ?? [],
    personalityType: studentProfile?.personalityType,
  });

  return `\n\nAI_GROUNDED_CONTEXT_JSON:\n${payloadToPromptBlock(payload)}`;
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