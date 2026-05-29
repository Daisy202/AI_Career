import { GraduationCap } from "lucide-react";
import type { ProgramMatch } from "@workspace/api-client-react";
import { Badge } from "@/components/ui-elements";

export function MatchedProgramsList({
  programs,
  aiRecommendedKeys,
  emptyMessage = "No program matches for your profile in this field yet.",
}: {
  programs: ProgramMatch[];
  aiRecommendedKeys?: Set<string>;
  emptyMessage?: string;
}) {
  if (programs.length === 0) {
    return (
      <p className="text-sm text-muted-foreground bg-muted/30 p-4 rounded-lg border border-dashed text-center">
        {emptyMessage}
      </p>
    );
  }

  return (
    <div className="space-y-3">
      {programs.map((match, i) => {
        const reqA = match.program.requiredSubjects ?? [];
        const reqO = (match.program as { requiredOLevelSubjects?: string[] }).requiredOLevelSubjects ?? [];
        const minReq = match.program.minRequiredSubjects;
        const aStr =
          minReq != null && minReq < reqA.length
            ? `At least ${minReq} of: ${reqA.join(", ")}`
            : reqA.map(s => `A: ${s}`).join("; ");
        const reqStr = [...(aStr ? [aStr] : []), ...reqO.map(s => `O: ${s}`)].join("; ");
        const key = `${match.program.programName}|${match.program.schoolName}`;
        const aiPick = aiRecommendedKeys?.has(key);

        return (
          <div
            key={`${key}-${i}`}
            className={`bg-muted/30 p-4 rounded-lg border text-sm ${
              aiPick ? "border-primary/50 ring-1 ring-primary/20" : "border-border"
            }`}
          >
            <div className="font-semibold text-foreground flex items-center gap-2 flex-wrap">
              {match.program.programName}
              {(match.program as { programType?: string }).programType === "diploma" && (
                <Badge variant="secondary" className="text-[10px]">
                  Diploma
                </Badge>
              )}
              {aiPick && (
                <Badge variant="outline" className="text-[10px] border-primary text-primary">
                  AI recommended
                </Badge>
              )}
            </div>
            {reqStr ? <div className="text-xs text-muted-foreground mt-1">Required: {reqStr}</div> : null}
            {match.program.duration ? (
              <div className="text-xs text-muted-foreground mt-1">Duration: {match.program.duration}</div>
            ) : null}
            {match.program.description ? (
              <p className="text-xs text-muted-foreground mt-2 line-clamp-2">{match.program.description}</p>
            ) : null}
            <div className="text-xs text-muted-foreground flex justify-between items-center mt-2 flex-wrap gap-2">
              <span>
                {match.program.schoolName}
                {(match.program as { campus?: string }).campus
                  ? ` (${(match.program as { campus?: string }).campus})`
                  : ""}
              </span>
              {match.qualifies && match.meetsOLevelRequirement !== false && match.meetsALevelRequirement !== false ? (
                <Badge variant="success" className="text-[10px] px-1.5 py-0">
                  Qualifies
                </Badge>
              ) : match.meetsOLevelRequirement === false ? (
                <Badge variant="warning" className="text-[10px] px-1.5 py-0">
                  O-Level passes
                </Badge>
              ) : match.meetsALevelRequirement === false ? (
                <Badge variant="warning" className="text-[10px] px-1.5 py-0">
                  A-Level passes
                </Badge>
              ) : (
                <Badge variant="warning" className="text-[10px] px-1.5 py-0">
                  Missing: {match.missingSubjects.join(", ")}
                </Badge>
              )}
            </div>
            {match.pointsChance ? (
              <div className="text-xs mt-1 text-muted-foreground">
                With your points: <strong>{match.pointsChance}</strong> chance to enroll
              </div>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}

export function MatchedProgramsSection({
  programs,
  aiRecommendedKeys,
  title = "Programs matched to your profile",
}: {
  programs: ProgramMatch[];
  aiRecommendedKeys?: Set<string>;
  title?: string;
}) {
  return (
    <div>
      <h4 className="text-lg font-bold mb-4 flex items-center">
        <GraduationCap className="w-5 h-5 mr-2 text-primary" />
        {title}
      </h4>
      <MatchedProgramsList programs={programs} aiRecommendedKeys={aiRecommendedKeys} />
    </div>
  );
}
