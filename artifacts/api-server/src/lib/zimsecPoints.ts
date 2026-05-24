/** ZIMSEC A-Level cut-off points in Zimbabwe: lower is better, typically 1–15. */

export const ZIMSEC_CUTOFF_MIN = 1;
export const ZIMSEC_CUTOFF_MAX = 15;
/** Points assigned per A-Level subject grade (1 = best, 5 = weakest pass). */
export const ZIMSEC_POINTS_PER_SUBJECT_MIN = 1;
export const ZIMSEC_POINTS_PER_SUBJECT_MAX = 5;

export const ZIMSEC_GRADING_EXPLANATION = `ZIMSEC A-Level scoring (Zimbabwe):
- Each subject grade = 1 to 5 points only (1 = best, 5 = weakest pass). Never say a single subject needs 6+ points.
- University cut-off is your TOTAL aggregate (sum of best subjects), between 1 and 15. Lower total = better. Never say 38, 150, etc.
- Program cut-off in our database is the maximum total still accepted (e.g. ≤15 means you need 15 or fewer total points).`;

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

/** Student meets program cutoff when their points are at or below the program maximum (lower = better). */
export function meetsCutoffRequirement(
  studentPoints: number,
  programMinimum: number
): boolean {
  return studentPoints <= programMinimum;
}

export function calculatePointsChance(
  studentPoints: number,
  programMinimum: number
): "high" | "equal" | "low" {
  if (studentPoints <= programMinimum - 2) return "high";
  if (studentPoints <= programMinimum) return "equal";
  return "low";
}

export function sanitizeCutoffMentionsInText(text: string): string {
  return sanitizeZimsecPointsInText(text);
}

/** Strip or fix hallucinated point values in AI text. */
export function sanitizeZimsecPointsInText(text: string): string {
  let out = text;

  // Per-subject lines like "Biology: 18 points"
  out = out.replace(
    /([A-Za-z][A-Za-z\s]{2,30}):\s*(\d{1,3})\s*points?/gi,
    (_m, subject: string, numStr: string) => {
      const n = Number(numStr);
      if (n > ZIMSEC_POINTS_PER_SUBJECT_MAX) {
        return `${subject.trim()}: (each subject is only 1–5 points; see total cut-off below)`;
      }
      return _m;
    }
  );

  // Totals above 15 e.g. "minimum of 38 points"
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
