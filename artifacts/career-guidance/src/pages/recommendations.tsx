import { useEffect } from "react";
import { Link, useLocation } from "wouter";
import { motion } from "framer-motion";
import { Briefcase, ArrowRight, BrainCircuit, AlertCircle, RefreshCw, GraduationCap } from "lucide-react";
import { Button, Card, Badge, Progress, Skeleton } from "@/components/ui-elements";
import { AiText } from "@/components/AiText";
import { useCareerStore } from "@/store/use-career-store";
import { useGetRecommendations } from "@workspace/api-client-react";

export default function RecommendationsPage() {
  const [, setLocation] = useLocation();
  const profile = useCareerStore(s => s.profile);
  const cached = useCareerStore(s => s.recommendations);
  const setRecommendations = useCareerStore(s => s.setRecommendations);

  const { mutate, data: response, isPending, isError } = useGetRecommendations();

  // Use cached result when available; otherwise use fresh response
  const displayData = response ?? cached;
  const recommendations = displayData?.recommendations ?? [];
  const aiAdvice = displayData?.aiAdvice;
  const aiRecommendedPrograms = displayData?.aiRecommendedPrograms ?? [];
  const aiRecommendedSet = new Set(aiRecommendedPrograms.map((p: { programName: string; schoolName: string }) => `${p.programName}|${p.schoolName}`));

  // Only fetch when we have profile but no cached recommendations
  useEffect(() => {
    if (profile && !cached && !isPending) {
      mutate(
        { data: profile },
        {
          onSuccess: (data) => setRecommendations(data),
        }
      );
    }
  }, [profile, cached, isPending, mutate, setRecommendations]);

  if (!profile) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center p-4 text-center">
        <div className="w-24 h-24 bg-muted rounded-full flex items-center justify-center mb-6">
          <AlertCircle className="w-12 h-12 text-muted-foreground" />
        </div>
        <h2 className="text-3xl font-bold mb-4">No Profile Found</h2>
        <p className="text-muted-foreground max-w-md mb-8">Please complete the career assessment first so our AI can generate personalized recommendations for you.</p>
        <Link href="/assessment">
          <Button size="lg">Take Assessment</Button>
        </Link>
      </div>
    );
  }

  const containerVariants = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.1 } }
  };
  
  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 }
  };

  return (
    <div className="min-h-screen bg-muted/20 py-12 px-4 sm:px-5 lg:px-6">
      <div className="max-w-7xl mx-auto">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-secondary/10 text-secondary font-semibold text-sm mb-4">
              <BrainCircuit className="w-4 h-4" />
              AI Analysis Complete
            </div>
            <h1 className="text-4xl md:text-5xl font-bold mb-4">Career Advice for You</h1>
            <p className="text-lg text-muted-foreground">
              If you have the required subjects (or equivalent) — at least 2 A-Levels and 5 O-Levels — you can pursue these programs. Diplomas don&apos;t require A-Level.
            </p>
            {profile?.cutOffPoints != null && (
              <p className="text-base font-semibold text-primary mt-2">
                Your cut-off points: <strong>{profile.cutOffPoints}</strong> — used for chance analysis on programs with points requirements
              </p>
            )}
          </div>
          <Button
            variant="outline"
            onClick={() =>
              mutate(
                { data: profile },
                { onSuccess: (data) => setRecommendations(data) }
              )
            }
            disabled={isPending}
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${isPending ? 'animate-spin' : ''}`} />
            Recalculate
          </Button>
        </div>

        {/* Loading State */}
        {isPending && (
          <div className="grid lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {[1,2,3].map(i => (
              <Card key={i} className="p-6">
                <Skeleton className="h-8 w-3/4 mb-4" />
                <Skeleton className="h-4 w-full mb-2" />
                <Skeleton className="h-4 w-5/6 mb-8" />
                <Skeleton className="h-2 w-full mb-6" />
                <div className="flex gap-2">
                  <Skeleton className="h-6 w-20 rounded-full" />
                  <Skeleton className="h-6 w-20 rounded-full" />
                </div>
              </Card>
            ))}
          </div>
        )}

        {/* Error State */}
        {isError && (
          <Card className="p-10 text-center border-destructive/50 bg-destructive/5">
            <AlertCircle className="w-12 h-12 text-destructive mx-auto mb-4" />
            <h3 className="text-xl font-bold text-destructive mb-2">Analysis Failed</h3>
            <p className="text-muted-foreground mb-6">There was an error communicating with the AI service. Please try again.</p>
            <Button variant="outline" onClick={() => mutate({ data: profile })}>Try Again</Button>
          </Card>
        )}

        {/* AI Advice from Ollama — cross-referenced with DB programs */}
        {aiAdvice && (
          <Card className="mb-8 p-6 border-primary/30 bg-primary/5">
            <h3 className="text-lg font-bold mb-3 flex items-center gap-2">
              <BrainCircuit className="w-5 h-5 text-primary" />
              AI Career Advice
            </h3>
            <p className="text-xs text-muted-foreground mb-3">
              Personalized advice based on your profile. Programs mentioned are verified against our database.
            </p>
            <AiText text={aiAdvice} className="text-foreground leading-relaxed" as="p" />
            {aiRecommendedPrograms.length > 0 && (
              <p className="text-xs text-muted-foreground mt-3 pt-3 border-t border-primary/20">
                AI recommended {aiRecommendedPrograms.length} program{aiRecommendedPrograms.length !== 1 ? "s" : ""} from our database — shown first below.
              </p>
            )}
          </Card>
        )}

        {/* Honest no-match message */}
        {recommendations && recommendations.length > 0 && (() => {
          const totalQualifying = recommendations.reduce((sum, rec) => 
            sum + (rec.matchedPrograms?.filter((m: { qualifies: boolean }) => m.qualifies).length ?? 0), 0
          );
          return totalQualifying === 0 ? (
            <Card className="mb-8 p-6 border-amber-500/30 bg-amber-50/50 dark:bg-amber-950/20">
              <p className="text-base font-semibold text-foreground">
                With the subjects you have we couldn&apos;t find any match for you.
              </p>
              <p className="text-sm text-muted-foreground mt-2">
                But consider the advice below — it shows what subjects or equivalent you&apos;d need to qualify for programs in each field.
              </p>
            </Card>
          ) : null;
        })()}

        {/* Results */}
        {recommendations && recommendations.length > 0 && (
          <motion.div 
            variants={containerVariants}
            initial="hidden"
            animate="show"
            className="grid lg:grid-cols-2 gap-8"
          >
            {recommendations.map((rec, idx) => (
              <motion.div key={rec.career.id} variants={itemVariants}>
                <Card className={`relative overflow-hidden h-full flex flex-col transition-all duration-300 hover:shadow-2xl hover:border-primary/30 ${idx === 0 ? 'ring-2 ring-primary ring-offset-4' : ''}`}>
                    {idx === 0 && (
                    <div className="absolute top-0 right-0 bg-primary text-primary-foreground px-4 py-1 text-xs font-bold rounded-bl-xl z-10">
                      Best Fit
                    </div>
                  )}
                  
                  <div className="p-6 sm:p-8 flex-1">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <Badge variant="outline" className="mb-3">{rec.career.category}</Badge>
                        <h2 className="text-2xl font-bold">{rec.career.name}</h2>
                      </div>
                      <div className="text-right">
                        <div className="text-3xl font-extrabold text-primary">{rec.matchPercentage}%</div>
                        <div className="text-xs font-bold text-muted-foreground uppercase">Fit</div>
                      </div>
                    </div>

                    <div className="mb-6">
                      <Progress value={rec.matchPercentage} className="h-2 mb-2" indicatorClassName={idx === 0 ? "bg-gradient-to-r from-primary to-accent" : ""} />
                    </div>

                    <p className="text-muted-foreground mb-6 line-clamp-2">{rec.career.description}</p>

                    <div className="space-y-4 mb-8">
                      <div>
                        <h4 className="text-sm font-bold mb-2 flex items-center"><Briefcase className="w-4 h-4 mr-2" /> Advice:</h4>
                        <ul className="space-y-2">
                          {rec.matchReasons.slice(0,2).map((reason, i) => (
                            <li key={i} className="text-sm text-foreground flex items-start gap-2">
                              <span className="text-secondary mt-0.5">•</span> {reason}
                            </li>
                          ))}
                        </ul>
                      </div>
                      
                      <div className="flex items-center gap-4 flex-wrap">
                        <Badge variant={rec.demandLevel === 'High' ? 'success' : rec.demandLevel === 'Medium' ? 'warning' : 'secondary'}>
                          {rec.demandLevel} Demand in ZW
                        </Badge>
                        <span className="text-sm font-semibold text-muted-foreground">{rec.career.averageSalary} avg</span>
                      </div>
                    </div>

                    <div className="mt-6 border-t border-border pt-4">
                      {(() => {
                        const qualifyingCount = rec.matchedPrograms?.filter((m: { qualifies: boolean }) => m.qualifies).length ?? 0;
                        const mySubjects = [
                          ...(profile?.subjects ?? []),
                          ...(profile?.oLevelSubjects ?? []),
                        ].filter(Boolean);
                        const subjectStr = mySubjects.length > 0 ? ` (${mySubjects.join(", ")})` : "";
                        return qualifyingCount === 0 && (rec.matchedPrograms?.length ?? 0) > 0 ? (
                          <p className="text-sm text-amber-600 dark:text-amber-500 font-medium mb-3">
                            With your subjects{subjectStr} we couldn&apos;t find any match for you in {rec.career.name}. Consider the advice below.
                          </p>
                        ) : null;
                      })()}
                      <h4 className="text-sm font-bold mb-3 flex items-center"><GraduationCap className="w-4 h-4 mr-2 text-primary" /> If you have the required subjects (listed below) or equivalent, you can do:</h4>
                      {rec.matchedPrograms && rec.matchedPrograms.length > 0 ? (
                        <div className="space-y-3">
                          {rec.matchedPrograms.slice(0, 3).map((match, i) => {
                            const reqA = (match.program as { requiredSubjects?: string[] }).requiredSubjects ?? [];
                            const reqO = (match.program as { requiredOLevelSubjects?: string[] }).requiredOLevelSubjects ?? [];
                            const minReq = (match.program as { minRequiredSubjects?: number | null }).minRequiredSubjects;
                            const aStr = minReq != null && minReq < reqA.length
                              ? `At least ${minReq} of: ${reqA.join(", ")}`
                              : reqA.map((s: string) => `A: ${s}`).join("; ");
                            const reqStr = [...(aStr ? [aStr] : []), ...reqO.map((s: string) => `O: ${s}`)].join("; ");
                            return (
                            <div key={i} className={`bg-muted/30 p-3 rounded-lg border text-sm ${aiRecommendedSet.has(`${match.program.programName}|${match.program.schoolName}`) ? "border-primary/50 ring-1 ring-primary/20" : "border-border"}`}>
                              <div className="font-semibold text-foreground flex items-center gap-2 flex-wrap">
                                {match.program.programName}
                                {(match.program as { programType?: string }).programType === "diploma" && (
                                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-secondary/20 text-secondary font-medium">Diploma</span>
                                )}
                                {aiRecommendedSet.has(`${match.program.programName}|${match.program.schoolName}`) && (
                                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-primary/20 text-primary font-medium">AI recommended</span>
                                )}
                              </div>
                              {reqStr && (
                                <div className="text-xs text-muted-foreground mt-1">Required: {reqStr}</div>
                              )}
                              <div className="text-xs text-muted-foreground flex justify-between items-center mt-1">
                                <span>{match.program.schoolName}{(match.program as { campus?: string }).campus ? ` (${(match.program as { campus?: string }).campus})` : ""}</span>
                                {match.qualifies && match.meetsOLevelRequirement !== false && match.meetsALevelRequirement !== false ? (
                                  <Badge variant="success" className="text-[10px] px-1.5 py-0">Qualifies</Badge>
                                ) : match.meetsOLevelRequirement === false ? (
                                  <Badge variant="warning" className="text-[10px] px-1.5 py-0">O-Level Passes</Badge>
                                ) : match.meetsALevelRequirement === false ? (
                                  <Badge variant="warning" className="text-[10px] px-1.5 py-0">A-Level Passes</Badge>
                                ) : (
                                  <Badge variant="warning" className="text-[10px] px-1.5 py-0">Missing Subjects: {match.missingSubjects.join(', ')}</Badge>
                                )}
                              </div>
                              {(match as { pointsChance?: string | null }).pointsChance && (
                                <div className="text-xs mt-1 text-muted-foreground">
                                  With your points: <strong>{(match as { pointsChance: string }).pointsChance}</strong> chance to enroll
                                </div>
                              )}
                            </div>
                          );
                          })}
                          {rec.matchedPrograms.length > 3 && (
                            <div className="text-xs text-center text-muted-foreground">+{rec.matchedPrograms.length - 3} more programs available</div>
                          )}
                        </div>
                      ) : (
                        <div className="text-sm text-muted-foreground bg-muted/30 p-3 rounded-lg border border-dashed text-center">
                          No program data yet - admin can add programs
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="p-6 pt-0 mt-auto border-t border-border/50 bg-muted/10">
                    <Link href={`/career/${rec.career.id}`}>
                      <Button className="w-full mt-4" variant={idx === 0 ? "default" : "outline"}>
                        View Full Details <ArrowRight className="w-4 h-4 ml-2" />
                      </Button>
                    </Link>
                  </div>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        )}
      </div>
    </div>
  );
}
