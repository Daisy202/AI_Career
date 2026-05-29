import { useMemo } from "react";
import { useRoute } from "wouter";
import {
  Building2,
  BookOpen,
  Brain,
  TrendingUp,
  CheckCircle,
  ArrowLeft,
  MapPin,
  Search,
  ExternalLink,
  LineChart,
  Briefcase,
} from "lucide-react";
import { Link } from "wouter";
import { Button, Card, Badge, Skeleton, Progress } from "@/components/ui-elements";
import { useGetCareerById, useGetCareerInsights, useGetJobs } from "@workspace/api-client-react";
import { useCareerStore } from "@/store/use-career-store";
import { MatchedProgramsSection } from "@/components/MatchedProgramsList";

export default function CareerDetailPage() {
  const [, params] = useRoute("/career/:id");
  const careerId = params?.id ? parseInt(params.id, 10) : 0;

  const cachedRecommendations = useCareerStore(s => s.recommendations);
  const rec = cachedRecommendations?.recommendations?.find(r => r.career.id === careerId);

  const aiRecommendedKeys = useMemo(
    () =>
      new Set(
        (cachedRecommendations?.aiRecommendedPrograms ?? []).map(
          p => `${p.programName}|${p.schoolName}`
        )
      ),
    [cachedRecommendations?.aiRecommendedPrograms]
  );

  const { data: careerFromApi, isLoading: isCareerLoading } = useGetCareerById(careerId);

  const career = rec?.career ?? careerFromApi;

  const careerName = career?.name ?? "";

  const { data: insights, isLoading: isInsightsLoading } = useGetCareerInsights({
    career: careerName,
  });

  const { data: jobs, isLoading: isJobsLoading } = useGetJobs({
    query: careerName,
  });

  const relatedExplore = useMemo(() => {
    if (!career) return [];
    const explore = cachedRecommendations?.explorePrograms ?? [];
    return explore.filter(
      p =>
        !p.career ||
        p.career.toLowerCase() === career.category.toLowerCase() ||
        p.career.toLowerCase().includes(career.name.split(" ")[0]?.toLowerCase() ?? "")
    );
  }, [cachedRecommendations?.explorePrograms, career]);

  if (isCareerLoading && !career) {
    return (
      <div className="min-h-screen p-8 max-w-5xl mx-auto space-y-8">
        <Skeleton className="h-12 w-32 mb-8" />
        <Skeleton className="h-24 w-3/4" />
        <div className="grid md:grid-cols-3 gap-6">
          <Skeleton className="h-64 rounded-2xl" />
          <Skeleton className="h-64 rounded-2xl md:col-span-2" />
        </div>
      </div>
    );
  }

  if (!career) return <div className="p-10 text-center text-xl font-bold">Career not found</div>;

  const matchedPrograms = rec?.matchedPrograms ?? [];

  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="bg-gradient-to-br from-primary to-slate-900 text-white pt-16 pb-24 px-4 sm:px-5 lg:px-6 relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
        <div className="max-w-5xl mx-auto relative z-10">
          <Link href="/recommendations" className="inline-flex items-center text-white/70 hover:text-white mb-8 transition-colors">
            <ArrowLeft className="w-4 h-4 mr-2" /> Back to Recommendations
          </Link>
          <Badge variant="secondary" className="mb-4 bg-white/20 border-white/30 text-white hover:bg-white/30">
            {career.category}
          </Badge>
          <h1 className="text-4xl md:text-6xl font-extrabold mb-6 tracking-tight">{career.name}</h1>
          <p className="text-xl md:text-2xl text-white/80 max-w-3xl leading-relaxed">{career.description}</p>
          {rec ? (
            <div className="mt-8 flex flex-wrap items-center gap-6">
              <div>
                <div className="text-4xl font-extrabold">{rec.matchPercentage}%</div>
                <div className="text-sm text-white/70 uppercase font-bold">Your fit</div>
              </div>
              <div className="flex-1 min-w-[200px] max-w-md">
                <Progress value={rec.matchPercentage} className="h-2" indicatorClassName="bg-white" />
              </div>
              <Badge variant="secondary" className="bg-white/20 border-white/30 text-white">
                {rec.demandLevel} demand in ZW
              </Badge>
            </div>
          ) : null}
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-5 lg:px-6 -mt-12 relative z-20 space-y-8">
        <div className="grid sm:grid-cols-3 gap-4">
          <Card className="p-6 shadow-xl flex items-center gap-4">
            <div className="p-3 bg-green-100 rounded-xl">
              <TrendingUp className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm font-bold text-muted-foreground uppercase">Job Outlook</p>
              <p className="text-lg font-bold">{career.jobOutlook}</p>
            </div>
          </Card>
          <Card className="p-6 shadow-xl flex items-center gap-4">
            <div className="p-3 bg-amber-100 rounded-xl">
              <Building2 className="w-6 h-6 text-amber-600" />
            </div>
            <div>
              <p className="text-sm font-bold text-muted-foreground uppercase">Avg Salary (ZW)</p>
              <p className="text-lg font-bold">{career.averageSalary}</p>
            </div>
          </Card>
          <Card className="p-6 shadow-xl flex items-center gap-4">
            <div className="p-3 bg-blue-100 rounded-xl">
              <Search className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm font-bold text-muted-foreground uppercase">Demand Level</p>
              {isInsightsLoading ? (
                <Skeleton className="h-6 w-20 mt-1" />
              ) : (
                <p className="text-lg font-bold text-primary">{rec?.demandLevel ?? insights?.demandLevel ?? "Medium"}</p>
              )}
            </div>
          </Card>
        </div>

        {rec && rec.matchReasons.length > 0 ? (
          <Card className="p-6 border-primary/20 bg-primary/5">
            <h3 className="text-lg font-bold mb-3 flex items-center">
              <Briefcase className="w-5 h-5 mr-2 text-primary" />
              Why this fits you
            </h3>
            <ul className="space-y-2">
              {rec.matchReasons.map((reason, i) => (
                <li key={i} className="text-sm flex items-start gap-2">
                  <span className="text-secondary mt-0.5">•</span>
                  {reason}
                </li>
              ))}
            </ul>
          </Card>
        ) : null}

        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            <Card className="p-8">
              <MatchedProgramsSection
                programs={matchedPrograms}
                aiRecommendedKeys={aiRecommendedKeys}
                title={
                  matchedPrograms.length > 0
                    ? "Programs matched to your profile"
                    : "Programs in this field"
                }
              />
              {!rec ? (
                <p className="text-sm text-muted-foreground mt-4">
                  Run recommendations from your profile to see which specific programs you qualify for.
                </p>
              ) : null}
            </Card>

            <Card className="p-8">
              <h3 className="text-2xl font-bold mb-6 flex items-center">
                <BookOpen className="w-6 h-6 mr-3 text-primary" />
                Educational Pathway
              </h3>

              <div className="mb-8">
                <h4 className="text-lg font-bold mb-3 border-b pb-2">Typical A-Level Subjects</h4>
                <div className="flex flex-wrap gap-2">
                  {career.aLevelSubjects.map((sub, i) => (
                    <Badge key={i} variant="outline" className="text-sm py-1.5 px-4 bg-muted/50">
                      {sub}
                    </Badge>
                  ))}
                </div>
              </div>

              <div>
                <h4 className="text-lg font-bold mb-3 border-b pb-2">Example programs in Zimbabwe</h4>
                <ul className="space-y-3">
                  {career.universityPrograms.map((prog, i) => (
                    <li key={i} className="flex items-start gap-3">
                      <CheckCircle className="w-5 h-5 text-secondary shrink-0 mt-0.5" />
                      <span className="font-medium">{prog}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </Card>

            <Card className="p-8">
              <h3 className="text-2xl font-bold mb-6 flex items-center">
                <Brain className="w-6 h-6 mr-3 text-primary" />
                Required Skills & Competencies
              </h3>
              <div className="grid sm:grid-cols-2 gap-4">
                {career.requiredSkills.map((skill, i) => (
                  <div
                    key={i}
                    className="bg-primary/5 border border-primary/10 rounded-xl p-4 flex items-center font-semibold text-foreground"
                  >
                    <span className="w-2 h-2 rounded-full bg-primary mr-3"></span>
                    {skill}
                  </div>
                ))}
              </div>
            </Card>
          </div>

          <div className="space-y-8">
            <Card className="p-6 bg-slate-900 text-white border-none shadow-2xl">
              <h3 className="text-xl font-bold mb-4 flex items-center">
                <LineChart className="w-5 h-5 mr-2 text-accent" />
                Market Insights
              </h3>
              {isInsightsLoading ? (
                <div className="space-y-4">
                  <Skeleton className="h-4 w-full bg-slate-800" />
                  <Skeleton className="h-4 w-2/3 bg-slate-800" />
                </div>
              ) : insights ? (
                <div className="space-y-6">
                  <div>
                    <p className="text-slate-400 text-sm mb-1">Active Job Listings</p>
                    <p className="text-3xl font-bold text-white">{insights.jobCount}+</p>
                  </div>
                  <div>
                    <p className="text-slate-400 text-sm mb-2">Most Requested Skills</p>
                    <div className="flex flex-wrap gap-2">
                      {insights.topSkills.map((ts, i) => (
                        <span key={i} className="text-xs px-2 py-1 rounded bg-slate-800 border border-slate-700">
                          {ts}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <p className="text-slate-400 text-sm">Insights currently unavailable.</p>
              )}
            </Card>

            {relatedExplore.length > 0 ? (
              <Card className="p-6">
                <h3 className="text-lg font-bold mb-3">More to explore in {career.category}</h3>
                <ul className="space-y-2 text-sm">
                  {relatedExplore.slice(0, 6).map((p, i) => (
                    <li key={i} className="text-muted-foreground">
                      <span className="font-medium text-foreground">{p.program}</span>
                      <span className="block text-xs">{p.school}</span>
                    </li>
                  ))}
                </ul>
              </Card>
            ) : null}

            <div>
              <h3 className="text-xl font-bold mb-4">Live Job Openings</h3>
              {isJobsLoading ? (
                <div className="space-y-4">
                  {[1, 2].map(i => (
                    <Skeleton key={i} className="h-24 w-full rounded-xl" />
                  ))}
                </div>
              ) : jobs && jobs.length > 0 ? (
                <div className="space-y-4">
                  {jobs.slice(0, 3).map((job, i) => (
                    <div
                      key={i}
                      className="block p-4 rounded-xl border border-border bg-card hover:border-primary/50 hover:shadow-md transition-all group"
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-bold text-base mb-1 truncate">{job.title}</h4>
                          <p className="text-sm text-primary font-semibold mb-2">{job.company}</p>
                          <div className="flex items-center text-xs text-muted-foreground">
                            <MapPin className="w-3 h-3 mr-1" /> {job.location}
                          </div>
                        </div>
                        {job.url ? (
                          <Button
                            size="sm"
                            variant="outline"
                            className="opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={() => {
                              if (job.url) window.open(job.url, "_blank");
                            }}
                          >
                            <ExternalLink className="w-3 h-3 mr-1" /> View
                          </Button>
                        ) : null}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <Card className="p-6 text-center text-muted-foreground border-dashed">
                  No active listings found for this specific role at the moment.
                </Card>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
