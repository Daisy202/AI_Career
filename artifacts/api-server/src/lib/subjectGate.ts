/**
 * Subject requirements must be satisfied before interests/strengths affect ranking.
 */
import { subjectAlias } from "./subjectMatch.js";

export interface SubjectGateProfile {
  subjects?: string[];
  oLevelSubjects?: string[];
}

export interface CareerSubjectTarget {
  aLevelSubjects: string[];
  keywords: string[];
  category: string;
}

function normalizeSubject(s: string): string {
  return s.toLowerCase().trim();
}

export function countSubjectMatches(
  required: string[],
  studentSubjects: string[]
): number {
  const student = studentSubjects.map(normalizeSubject);
  return required.filter(req => {
    const r = normalizeSubject(req);
    return student.some(
      s => s.includes(r) || r.includes(s) || subjectAlias(s, r)
    );
  }).length;
}

/** Minimum A-Level subject overlap needed for a career to pass the gate. */
export function minCareerSubjectMatches(careerReqs: string[]): number {
  if (careerReqs.length === 0) return 0;
  if (careerReqs.length === 1) return 1;
  const scienceCore = careerReqs.filter(r =>
    /biology|chemistry|physics|mathematics|maths/i.test(r)
  ).length;
  if (careerReqs.length >= 4 && scienceCore >= 2) return 3;
  if (careerReqs.length >= 3 && scienceCore >= 2) return 3;
  return Math.min(2, careerReqs.length);
}

export function getCareerRequiredSubjects(career: CareerSubjectTarget): string[] {
  return career.aLevelSubjects.filter(s => !/any|relevant|combination/i.test(s));
}

/**
 * True when the student's subjects satisfy career/program requirements enough
 * to consider interests and strengths.
 */
export function meetsCareerSubjectGate(
  career: CareerSubjectTarget,
  profile: SubjectGateProfile
): boolean {
  const aLevel = profile.subjects ?? [];
  const oLevel = profile.oLevelSubjects ?? [];
  const careerReqs = getCareerRequiredSubjects(career);

  if (aLevel.length >= 2) {
    if (careerReqs.length === 0) return true;
    const matched = countSubjectMatches(careerReqs, aLevel);
    return matched >= minCareerSubjectMatches(careerReqs);
  }

  if (aLevel.length === 0 && oLevel.length >= 5) {
    const oTerms = oLevel.map(normalizeSubject);
    const keywordHit = career.keywords.some(k => {
      const kl = k.toLowerCase();
      return oTerms.some(t => t.includes(kl) || kl.includes(t));
    });
    const diplomaPath = ["Technology", "Business & Finance"].includes(career.category);
    return keywordHit || diplomaPath;
  }

  return false;
}

export function programMeetsRequiredSubjects(
  requiredSubjects: string[],
  minRequiredSubjects: number | null,
  studentALevel: string[],
  studentOLevel: string[] = []
): boolean {
  const required = requiredSubjects ?? [];
  if (required.length === 0) return true;
  const minReq = minRequiredSubjects ?? required.length;
  const pool = [...studentALevel, ...studentOLevel];
  return countSubjectMatches(required, pool) >= minReq;
}
