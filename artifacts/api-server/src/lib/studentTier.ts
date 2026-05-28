export type StudentTier = "certificate_diploma" | "degree_first" | "mixed_low_points";

export function determineStudentTier(input: {
  aLevelSubjects?: string[];
  cutOffPoints?: number | null;
}): StudentTier {
  const hasALevel = (input.aLevelSubjects ?? []).length > 0;
  if (!hasALevel) return "certificate_diploma";
  if (input.cutOffPoints != null && input.cutOffPoints < 5) return "mixed_low_points";
  return "degree_first";
}

export function programTypePriority(programType: string | null | undefined, tier: StudentTier): number {
  const type = (programType ?? "degree").toLowerCase();
  if (tier === "certificate_diploma") {
    if (type === "certificate") return 0;
    if (type === "diploma") return 1;
    return 3;
  }
  if (tier === "mixed_low_points") {
    if (type === "diploma") return 0;
    if (type === "certificate") return 1;
    if (type === "degree") return 2;
    return 3;
  }
  if (type === "degree") return 0;
  if (type === "diploma") return 1;
  if (type === "certificate") return 2;
  return 3;
}
