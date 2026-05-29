/**
 * Backend rules engine: normalize subjects, match programs, rank, build AI payload.
 * AI must only explain results from this module — never search the DB.
 */
import type { DbProgramRow } from "./chatDbContext.js";
import { countSubjectMatches, programMeetsRequiredSubjects } from "./subjectGate.js";
import { normalizeSubjectList } from "./subjectMatch.js";
import {
  meetsCutoffRequirement,
  ZIMSEC_GRADING_EXPLANATION,
} from "./zimsecPoints.js";
import { subjectAlias } from "./subjectMatch.js";

export interface NormalizedStudentProfile {
  aLevelSubjects: string[];
  oLevelSubjects: string[];
  cutOffPoints: number | null;
  interests: string[];
  strengths: string[];
  personalityType?: string | null;
}

export interface ProgramMatchRow {
  program: string;
  school: string;
  career?: string | null;
  programType: string;
  minimumPoints: number | null;
  requiredSubjects: string[];
  missingSubjects: string[];
}

export type ProgramPathwayKind = "eligible" | "alternative" | "near_match";

export interface EligibleProgramSummary extends ProgramMatchRow {
  pathway: ProgramPathwayKind;
}

export function toEligibleProgramSummary(
  row: ProgramMatchRow,
  pathway: ProgramPathwayKind
): EligibleProgramSummary {
  return { ...row, pathway };
}

export function mergeExplorePrograms(payload: AiRecommendationPayload): EligibleProgramSummary[] {
  const seen = new Set<string>();
  const out: EligibleProgramSummary[] = [];
  const add = (rows: ProgramMatchRow[], pathway: ProgramPathwayKind) => {
    for (const row of rows) {
      const key = `${row.program}|${row.school}`;
      if (seen.has(key)) continue;
      seen.add(key);
      out.push(toEligibleProgramSummary(row, pathway));
    }
  };
  add(payload.allEligiblePrograms, "eligible");
  add(payload.alternativePathways, "alternative");
  add(payload.nearMatches, "near_match");
  return out;
}

export interface AiRecommendationPayload {
  status: "matched" | "no_direct_degree_match";
  reason?: string;
  zimsecNote: string;
  studentProfile: {
    educationLevel: string;
    aLevelSubjects: string[];
    oLevelSubjects: string[];
    aLevelPoints: number | null;
    interests: string[];
    strengths: string[];
  };
  degreePrograms: ProgramMatchRow[];
  diplomaPrograms: ProgramMatchRow[];
  polytechnicPrograms: ProgramMatchRow[];
  teacherCollegePrograms: ProgramMatchRow[];
  eligiblePrograms: ProgramMatchRow[];
  /** All subject-qualified programs (for UI explore list; AI payload uses eligiblePrograms slice). */
  allEligiblePrograms: ProgramMatchRow[];
  nearMatches: ProgramMatchRow[];
  alternativePathways: ProgramMatchRow[];
  notEligibleCareers: Array<{ career: string; missingSubjects: string[] }>;
  rules: string[];
}

const INTEREST_CATEGORY_HINTS: Record<string, string[]> = {
  "arts & entertainment": ["media", "communication", "journalism", "art", "design", "film", "radio"],
  "technology & software": ["technology", "computer", "software", "ict", "information", "cyber"],
  "healthcare & medicine": ["health", "medicine", "nursing", "clinical"],
  "business & finance": ["business", "commerce", "account", "finance", "marketing"],
  "engineering & architecture": ["engineer", "civil", "mechanical", "electrical"],
  "education & training": ["education", "teaching", "bed"],
  "media & communication": ["media", "journalism", "communication", "broadcast"],
};

function isDiplomaType(programType?: string | null): boolean {
  const t = (programType ?? "degree").toLowerCase();
  return t === "diploma" || t === "certificate" || t === "short_course";
}

function isShortCourse(programName: string, programType?: string | null): boolean {
  const name = programName.toLowerCase();
  const t = (programType ?? "").toLowerCase();
  return /short course|workshop|bootcamp/i.test(name) || t === "short_course";
}

function isUniversityDegree(program: DbProgramRow): boolean {
  if (isDiplomaType(program.programType) || isShortCourse(program.programName, program.programType)) {
    return false;
  }
  if (isPolytechnicSchool(program.schoolName) && !isTeacherCollege(program.programName, program.schoolName)) {
    return false;
  }
  return true;
}

function isPolytechnicSchool(schoolName: string): boolean {
  return /polytechnic|hexco|tvet|technical college/i.test(schoolName);
}

function isTeacherCollege(programName: string, schoolName: string): boolean {
  return /teacher|education college|bed|teaching/i.test(`${programName} ${schoolName}`);
}

function missingRequiredSubjects(
  program: DbProgramRow,
  aLevel: string[],
  oLevel: string[]
): string[] {
  const required = program.requiredSubjects ?? [];
  if (required.length === 0) return [];
  const pool = [...aLevel, ...oLevel].map(s => s.toLowerCase().trim());
  return required.filter(req => {
    const r = req.toLowerCase().trim();
    return !pool.some(s => s.includes(r) || r.includes(s) || subjectAlias(s, r));
  });
}

/** Degree: ≥2 A-Level subject matches when requirements exist; diploma: ≥5 O-Level passes or relaxed A-Level. */
export function programQualifiesBySubjects(
  program: DbProgramRow,
  aLevel: string[],
  oLevel: string[]
): boolean {
  const required = program.requiredSubjects ?? [];
  const minReq = program.minRequiredSubjects ?? (required.length > 0 ? Math.min(2, required.length) : 0);

  if (isDiplomaType(program.programType)) {
    if (required.length === 0 && (oLevel.length >= 5 || aLevel.length >= 2)) return true;
    if (oLevel.length >= 5) {
      const oMatches = countSubjectMatches(required, oLevel);
      if (required.length === 0 || oMatches >= Math.min(minReq || 5, 5)) return true;
      return (
        oMatches >= Math.min(minReq, 2) ||
        countSubjectMatches(required, [...aLevel, ...oLevel]) >= 1
      );
    }
    if (aLevel.length >= 2 && required.length > 0) {
      return countSubjectMatches(required, aLevel) >= Math.min(minReq, 2);
    }
    return oLevel.length >= 5 || (required.length === 0 && oLevel.length >= 3);
  }

  if (aLevel.length < 2) return false;
  // Open-entry degrees (no listed A-Level requirements) are ranked separately, not auto-eligible.
  if (required.length === 0) return false;
  const aMatches = countSubjectMatches(required, aLevel);
  const need =
    required.length >= 3
      ? required.length
      : Math.max(minReq, Math.min(2, required.length));
  return aMatches >= need;
}

function scoreProgramForStudent(
  program: DbProgramRow,
  student: NormalizedStudentProfile
): number {
  const a = student.aLevelSubjects;
  const o = student.oLevelSubjects;
  const required = program.requiredSubjects ?? [];
  let score = 0;

  const aMatches = countSubjectMatches(required, a);
  const combinedMatches = countSubjectMatches(required, [...a, ...o]);
  const qualifies = programQualifiesBySubjects(program, a, o);

  if (qualifies) {
    score += 80;
    score += aMatches * 12 + combinedMatches * 4;
  } else if (required.length > 0) {
    const missing = missingRequiredSubjects(program, a, o);
    score += Math.max(0, 25 - missing.length * 6);
  } else {
    score += 8;
  }

  if (student.cutOffPoints != null && program.minimumPoints != null) {
    if (meetsCutoffRequirement(student.cutOffPoints, program.minimumPoints)) score += 20;
    else score -= 10;
  }

  if (isShortCourse(program.programName, program.programType)) score -= 50;

  // Interests/strengths: tie-breaker only among subject-qualified options (max +5).
  if (qualifies && student.interests.length > 0) {
    const interestHints = student.interests.flatMap(i => INTEREST_CATEGORY_HINTS[i.toLowerCase()] ?? []);
    const cat = (program.careerCategory ?? "").toLowerCase();
    const name = program.programName.toLowerCase();
    const interestHits = interestHints.filter(h => cat.includes(h) || name.includes(h)).length;
    if (interestHits > 0) score += Math.min(interestHits, 3);
  }

  return score;
}

function toMatchRow(program: DbProgramRow, aLevel: string[], oLevel: string[]): ProgramMatchRow {
  return {
    program: program.programName,
    school: program.schoolName,
    career: program.careerCategory,
    programType: program.programType ?? "degree",
    minimumPoints: program.minimumPoints,
    requiredSubjects: program.requiredSubjects ?? [],
    missingSubjects: missingRequiredSubjects(program, aLevel, oLevel).slice(0, 6),
  };
}

function interestRelevant(program: DbProgramRow, interests: string[]): boolean {
  if (interests.length === 0) return true;
  const hints = interests.flatMap(i => INTEREST_CATEGORY_HINTS[i.toLowerCase()] ?? [i.toLowerCase()]);
  const cat = (program.careerCategory ?? "").toLowerCase();
  const name = program.programName.toLowerCase();
  return hints.some(h => cat.includes(h) || name.includes(h) || h.includes(cat.split(" ")[0] ?? ""));
}

export function buildFallbackPathways(
  programs: DbProgramRow[],
  student: NormalizedStudentProfile,
  limit = 8
): ProgramMatchRow[] {
  const { aLevelSubjects: a, oLevelSubjects: o } = student;
  const pathwayPool = programs.filter(
    p =>
      isDiplomaType(p.programType) ||
      isPolytechnicSchool(p.schoolName) ||
      isTeacherCollege(p.programName, p.schoolName)
  );

  const scoreAndRank = (pool: DbProgramRow[]) =>
    pool
      .map(p => ({ p, score: scoreProgramForStudent(p, student) }))
      .sort((x, y) => y.score - x.score)
      .slice(0, limit)
      .map(({ p }) => toMatchRow(p, a, o));

  const interestOrProfile =
    student.interests.length > 0 || a.length >= 2 || o.length >= 5;

  const candidates = scoreAndRank(
    pathwayPool.filter(
      p =>
        !interestOrProfile ||
        interestRelevant(p, student.interests) ||
        o.length >= 5 ||
        a.length >= 2
    )
  );
  if (candidates.length > 0) return candidates;

  const diplomas = scoreAndRank(pathwayPool.filter(p => isDiplomaType(p.programType)));
  if (diplomas.length > 0) return diplomas;

  return scoreAndRank(programs);
}

export function buildAiRecommendationPayload(
  programs: DbProgramRow[],
  studentInput: {
    subjects?: string[];
    oLevelSubjects?: string[];
    cutOffPoints?: number | null;
    interests?: string[];
    strengths?: string[];
    personalityType?: string | null;
  },
  notEligibleCareers: Array<{ career: string; missingSubjects: string[] }> = []
): AiRecommendationPayload {
  const aLevelSubjects = normalizeSubjectList(studentInput.subjects ?? []);
  const oLevelSubjects = normalizeSubjectList(studentInput.oLevelSubjects ?? []);
  const student: NormalizedStudentProfile = {
    aLevelSubjects,
    oLevelSubjects,
    cutOffPoints: studentInput.cutOffPoints ?? null,
    interests: studentInput.interests ?? [],
    strengths: studentInput.strengths ?? [],
    personalityType: studentInput.personalityType,
  };

  const ranked = [...programs]
    .map(p => ({ p, score: scoreProgramForStudent(p, student) }))
    .sort((a, b) => b.score - a.score);

  const degreePrograms: ProgramMatchRow[] = [];
  const diplomaPrograms: ProgramMatchRow[] = [];
  const polytechnicPrograms: ProgramMatchRow[] = [];
  const teacherCollegePrograms: ProgramMatchRow[] = [];
  const nearMatches: ProgramMatchRow[] = [];

  for (const { p } of ranked) {
    const row = toMatchRow(p, aLevelSubjects, oLevelSubjects);
    const qualifies = programQualifiesBySubjects(p, aLevelSubjects, oLevelSubjects);
    const diploma = isDiplomaType(p.programType);
    const poly = isPolytechnicSchool(p.schoolName);
    const teacher = isTeacherCollege(p.programName, p.schoolName);

    if (qualifies) {
      if (diploma || isShortCourse(p.programName, p.programType)) diplomaPrograms.push(row);
      else if (teacher) teacherCollegePrograms.push(row);
      else if (poly) polytechnicPrograms.push(row);
      else if (isUniversityDegree(p)) degreePrograms.push(row);
      else diplomaPrograms.push(row);
    } else if (row.missingSubjects.length > 0 && nearMatches.length < 8) {
      nearMatches.push(row);
    }
  }

  let alternativePathways = [
    ...diplomaPrograms,
    ...polytechnicPrograms,
    ...teacherCollegePrograms,
  ].slice(0, 8);

  if (degreePrograms.length === 0 && alternativePathways.length === 0) {
    alternativePathways = buildFallbackPathways(programs, student, 8);
  } else if (alternativePathways.length < 3 && degreePrograms.length === 0) {
    const extra = buildFallbackPathways(programs, student, 8 - alternativePathways.length);
    const keys = new Set(alternativePathways.map(r => `${r.program}|${r.school}`));
    for (const e of extra) {
      const k = `${e.program}|${e.school}`;
      if (!keys.has(k)) alternativePathways.push(e);
    }
  }

  if (alternativePathways.length === 0 && programs.length > 0) {
    alternativePathways = buildFallbackPathways(programs, student, 8);
  }

  const sortBySubjectFit = (rows: ProgramMatchRow[]) => {
    const byKey = new Map(programs.map(p => [`${p.programName}|${p.schoolName}`, p]));
    return [...rows].sort((a, b) => {
      const pa = byKey.get(`${a.program}|${a.school}`);
      const pb = byKey.get(`${b.program}|${b.school}`);
      if (!pa || !pb) return 0;
      const scoreDelta = scoreProgramForStudent(pb, student) - scoreProgramForStudent(pa, student);
      if (scoreDelta !== 0) return scoreDelta;
      const interestDelta =
        (interestRelevant(pb, student.interests) ? 1 : 0) -
        (interestRelevant(pa, student.interests) ? 1 : 0);
      return interestDelta;
    });
  };

  const allQualified: ProgramMatchRow[] = [];
  const qualSeen = new Set<string>();
  for (const { p } of ranked) {
    if (!programQualifiesBySubjects(p, aLevelSubjects, oLevelSubjects)) continue;
    const row = toMatchRow(p, aLevelSubjects, oLevelSubjects);
    const key = `${row.program}|${row.school}`;
    if (qualSeen.has(key)) continue;
    qualSeen.add(key);
    allQualified.push(row);
  }
  const allEligiblePrograms = sortBySubjectFit(allQualified).slice(0, 60);

  const eligiblePrograms = sortBySubjectFit([...degreePrograms, ...diplomaPrograms]).slice(0, 8);
  degreePrograms.splice(0, degreePrograms.length, ...sortBySubjectFit(degreePrograms).slice(0, 5));
  diplomaPrograms.splice(0, diplomaPrograms.length, ...sortBySubjectFit(diplomaPrograms).slice(0, 5));
  alternativePathways = sortBySubjectFit(alternativePathways).slice(0, 8);
  const status = degreePrograms.length > 0 ? "matched" : "no_direct_degree_match";
  const reason =
    status === "no_direct_degree_match"
      ? "No university degree in our database met the minimum A-Level subject match (at least 2 required subjects)."
      : undefined;

  return {
    status,
    reason,
    zimsecNote: ZIMSEC_GRADING_EXPLANATION,
    studentProfile: {
      educationLevel:
        aLevelSubjects.length >= 2
          ? "Has A-Level"
          : oLevelSubjects.length >= 5
            ? "O-Level only"
            : "Incomplete",
      aLevelSubjects,
      oLevelSubjects,
      aLevelPoints: student.cutOffPoints,
      interests: student.interests,
      strengths: student.strengths,
    },
    degreePrograms: degreePrograms.slice(0, 5),
    diplomaPrograms: diplomaPrograms.slice(0, 5),
    polytechnicPrograms: polytechnicPrograms.slice(0, 5),
    teacherCollegePrograms: teacherCollegePrograms.slice(0, 5),
    eligiblePrograms,
    allEligiblePrograms,
    nearMatches: nearMatches.slice(0, 12),
    alternativePathways: alternativePathways.slice(0, 12),
    notEligibleCareers: notEligibleCareers.slice(0, 6),
    rules: [
      "Use ONLY programs listed in this payload.",
      "Do NOT invent schools, programs, careers, or requirements.",
      "Do NOT calculate eligibility yourself.",
      "Do NOT suggest improving points unless aLevelPoints is provided and relevant.",
      "Do NOT suggest speaking to counselors or give generic motivational advice.",
      "If no direct degree match, explain using alternativePathways only.",
      "Never mention internal architecture or JSON.",
      "Maximum 5 sentences.",
    ],
  };
}

export function payloadToPromptBlock(payload: AiRecommendationPayload): string {
  return `BACKEND RESULTS (use ONLY this data):
${JSON.stringify(
  {
    status: payload.status,
    reason: payload.reason ?? null,
    studentProfile: payload.studentProfile,
    degreePrograms: payload.degreePrograms,
    diplomaPrograms: payload.diplomaPrograms,
    polytechnicPrograms: payload.polytechnicPrograms,
    teacherCollegePrograms: payload.teacherCollegePrograms,
    eligiblePrograms: payload.eligiblePrograms,
    nearMatches: payload.nearMatches,
    alternativePathways: payload.alternativePathways,
    notEligibleCareers: payload.notEligibleCareers,
  },
  null,
  2
)}`;
}

export const AI_EXPLANATION_SYSTEM_RULES = `You are a Zimbabwean academic and career guidance advisor for Form 4 and Form 6 students.
Your role is ONLY to explain recommendations already calculated by the backend.
You must NEVER invent schools, programs, careers, requirements, or cutoff points.

${ZIMSEC_GRADING_EXPLANATION}

STRICT RULES:
- Use ONLY the structured BACKEND RESULTS supplied
- Mention ONLY programs in eligiblePrograms or alternativePathways (or pathway lists provided)
- Never calculate eligibility yourself
- Never recommend careers listed in notEligibleCareers
- Rank by subject fit and points first; use interests only to choose among programs already listed
- Do NOT mention interests unless selecting between programs in the payload
- Keep responses under 5 sentences
- Never use "currently", "today", or "as of"
- Format programs as **Program Name at School Name**
- Do NOT suggest improving points unless aLevelPoints is in the profile and relevant
- Do NOT suggest speaking to counselors
- Do NOT give generic fallback advice when alternatives are provided
- Never mention internal system architecture, backend, or database access`;
