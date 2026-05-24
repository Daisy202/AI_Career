import { normalizeZimsecCutoff, ZIMSEC_CUTOFF_MAX, ZIMSEC_CUTOFF_MIN } from "./zimsecPoints.js";

export interface ProgramInput {
  schoolName: string;
  programName: string;
  faculty?: string | null;
  requiredSubjects: string[];
  minRequiredSubjects?: number | null;
  minimumPoints?: number | null;
  minOLevelPasses?: number | null;
  minALevelPasses?: number | null;
  duration?: string | null;
  description?: string | null;
  careerCategory?: string | null;
  programType?: string | null;
  requiredOLevelSubjects?: string[] | null;
  campus?: string | null;
}

export function sanitizeProgramInput<T extends ProgramInput>(data: T): T {
  const out = { ...data };
  if (out.minimumPoints != null) {
    const normalized = normalizeZimsecCutoff(out.minimumPoints);
    out.minimumPoints = normalized;
  }
  return out;
}

export function validateProgramMinimumPoints(
  minimumPoints: number | null | undefined
): string | null {
  if (minimumPoints == null) return null;
  const normalized = normalizeZimsecCutoff(minimumPoints);
  if (normalized == null) {
    return `Cut-off points must be between ${ZIMSEC_CUTOFF_MIN} and ${ZIMSEC_CUTOFF_MAX} (ZIMSEC scale; lower is better)`;
  }
  return null;
}
