import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, Compass } from "lucide-react";
import type { EligibleProgramSummary } from "@workspace/api-client-react";
import { Badge, Button, Card } from "@/components/ui-elements";

const PAGE_SIZE = 8;

function pathwayLabel(pathway?: EligibleProgramSummary["pathway"]): string {
  if (pathway === "alternative") return "Alternative pathway";
  if (pathway === "near_match") return "Near match";
  return "Eligible";
}

function pathwayVariant(
  pathway?: EligibleProgramSummary["pathway"]
): "success" | "warning" | "secondary" {
  if (pathway === "alternative") return "secondary";
  if (pathway === "near_match") return "warning";
  return "success";
}

export function ExploreProgramsList({
  programs,
  status,
}: {
  programs: EligibleProgramSummary[];
  status?: string;
}) {
  const [page, setPage] = useState(0);

  const list = useMemo(() => {
    if (programs.length > 0) return programs;
    return [];
  }, [programs]);

  const totalPages = Math.max(1, Math.ceil(list.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages - 1);
  const slice = list.slice(safePage * PAGE_SIZE, safePage * PAGE_SIZE + PAGE_SIZE);

  if (list.length === 0) return null;

  return (
    <Card className="mb-8 p-6 border-border/80">
      <div className="flex items-start gap-3 mb-4">
        <Compass className="w-5 h-5 text-primary mt-0.5 shrink-0" />
        <div>
          <h3 className="text-lg font-bold">More programs you can explore</h3>
          <p className="text-sm text-muted-foreground mt-1">
            Subject- and points-based matches from our database
            {status === "no_direct_degree_match"
              ? " (no direct degree match — see diplomas and alternatives below)"
              : ""}
            . These are compact summaries; use the career cards above for full detail.
          </p>
        </div>
      </div>

      <ul className="divide-y divide-border rounded-lg border border-border/60 overflow-hidden">
        {slice.map((item, idx) => (
          <li
            key={`${item.program}|${item.school}|${item.pathway ?? "e"}|${safePage}-${idx}`}
            className="px-4 py-3 bg-card hover:bg-muted/30 transition-colors"
          >
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
              <div className="min-w-0 flex-1">
                <p className="font-semibold text-foreground leading-snug">{item.program}</p>
                <p className="text-sm text-muted-foreground truncate">{item.school}</p>
              </div>
              <div className="flex flex-wrap gap-1.5 shrink-0">
                <Badge variant={pathwayVariant(item.pathway)} className="text-[10px]">
                  {pathwayLabel(item.pathway)}
                </Badge>
                <Badge variant="outline" className="text-[10px] capitalize">
                  {item.programType}
                </Badge>
                {item.career ? (
                  <Badge variant="outline" className="text-[10px]">
                    {item.career}
                  </Badge>
                ) : null}
              </div>
            </div>
            <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
              {item.minimumPoints != null ? (
                <span>
                  Min points: <strong className="text-foreground">{item.minimumPoints}</strong>
                </span>
              ) : null}
              {item.requiredSubjects.length > 0 ? (
                <span className="line-clamp-1">
                  Requires: {item.requiredSubjects.join(", ")}
                </span>
              ) : (
                <span>Open entry (check school for O-Level rules)</span>
              )}
            </div>
            {item.missingSubjects.length > 0 ? (
              <p className="text-xs text-amber-700 dark:text-amber-400 mt-1">
                Missing: {item.missingSubjects.join(", ")}
              </p>
            ) : null}
          </li>
        ))}
      </ul>

      {totalPages > 1 ? (
        <div className="flex items-center justify-between mt-4 pt-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={safePage === 0}
            onClick={() => setPage((p) => Math.max(0, p - 1))}
          >
            <ChevronLeft className="w-4 h-4 mr-1" />
            Previous
          </Button>
          <span className="text-sm text-muted-foreground">
            Page {safePage + 1} of {totalPages} ({list.length} programs)
          </span>
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={safePage >= totalPages - 1}
            onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
          >
            Next
            <ChevronRight className="w-4 h-4 ml-1" />
          </Button>
        </div>
      ) : (
        <p className="text-xs text-muted-foreground mt-3">{list.length} program(s) listed</p>
      )}
    </Card>
  );
}
