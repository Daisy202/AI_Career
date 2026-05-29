/** ZIMSEC A-Level aggregate points: higher total is better, typically 0–15. */

export const ZIMSEC_CUTOFF_MIN = 0;
export const ZIMSEC_CUTOFF_MAX = 15;
/** Points per subject grade (0 = lowest pass, 5 = best). */
export const ZIMSEC_POINTS_PER_SUBJECT_MIN = 0;
export const ZIMSEC_POINTS_PER_SUBJECT_MAX = 5;

export const ZIMSEC_GRADING_EXPLANATION = `ZIMSEC A-Level point system (Zimbabwe):
- Subject grades range from 0 to 5 points per subject
- 5 points is the highest/best grade
- 0 points is the lowest passing grade
- Total points are calculated from the student's best subjects (maximum 15)
- Higher total points are better
- 15 points is an excellent overall result
- Program minimum in our database is the minimum total usually required to qualify`;

/**
 * Normalize student or program points. Fixes common typo 150 → 15.
 */
export function normalizeZimsecCutoff(points: number | null | undefined): number | null {
  if (points == null || Number.isNaN(points)) return null;
  const n = Math.round(points);
  if (n > ZIMSEC_CUTOFF_MAX && n <= 99 && n % 10 === 0) {
    const scaled = n / 10;
    if (scaled >= ZIMSEC_CUTOFF_MIN && scaled <= ZIMSEC_CUTOFF_MAX) return scaled;
  }
  if (n >= ZIMSEC_CUTOFF_MIN && n <= ZIMSEC_CUTOFF_MAX) return n;
  return null;
}

export function isValidZimsecCutoff(points: number | null | undefined): boolean {
  return normalizeZimsecCutoff(points) !== null;
}

/** Student meets program minimum when their total is at or above the required minimum (higher = better). */
export function meetsCutoffRequirement(
  studentPoints: number,
  programMinimum: number
): boolean {
  return studentPoints >= programMinimum;
}

export function calculatePointsChance(
  studentPoints: number,
  programMinimum: number
): "high" | "equal" | "low" {
  if (studentPoints >= programMinimum + 2) return "high";
  if (studentPoints >= programMinimum) return "equal";
  return "low";
}

export function sanitizeCutoffMentionsInText(text: string): string {
  return sanitizeZimsecPointsInText(text);
}

/** Strip or fix hallucinated point values in AI text. */
export function sanitizeZimsecPointsInText(text: string): string {
  let out = text;

  out = out.replace(
    /([A-Za-z][A-Za-z\s]{2,30}):\s*(\d{1,3})\s*points?/gi,
    (_m, subject: string, numStr: string) => {
      const n = Number(numStr);
      if (n > ZIMSEC_POINTS_PER_SUBJECT_MAX) {
        return `${subject.trim()}: (each subject is only 0–5 points; see total below)`;
      }
      return _m;
    }
  );

  out = out.replace(/\b(\d{2,3})\s*(?:cut[- ]?off|points?|pts)\b/gi, (match, numStr) => {
    const normalized = normalizeZimsecCutoff(Number(numStr));
    if (normalized != null && Number(numStr) !== normalized) {
      return match.replace(numStr, String(normalized));
    }
    if (Number(numStr) > ZIMSEC_CUTOFF_MAX) {
      return match.replace(numStr, "15");
    }
    return match;
  });

  return out;
}

const REFUSAL_PATTERNS = [
  /can'?t answer that question/i,
  /can'?t provide information about specific a-?level subjects/i,
  /breach of privacy/i,
  /potentially discriminatory/i,
  /programmed to avoid answering/i,
];

export function isInScopeRefusal(aiText: string): boolean {
  return REFUSAL_PATTERNS.some(p => p.test(aiText));
}
