import { useRoute } from "wouter";
import { Building2, BookOpen, Brain, TrendingUp, CheckCircle, ArrowLeft, MapPin, Search } from "lucide-react";
import { Link } from "wouter";
import { Button, Card, Badge, Skeleton } from "@/components/ui-elements";
import { useGetCareerById, useGetCareerInsights, useGetJobs } from "@workspace/api-client-react";

export default function CareerDetailPage() {
  const [, params] = useRoute("/career/:id");
  const careerId = params?.id ? parseInt(params.id, 10) : 0;

  const { data: career, isLoading: isCareerLoading } = useGetCareerById(careerId, {
    query: { enabled: careerId > 0 }
  });

  const { data: insights, isLoading: isInsightsLoading } = useGetCareerInsights(
    { career: career?.name || "" },
    { query: { enabled: !!career?.name } }
  );

  const { data: jobs, isLoading: isJobsLoading } = useGetJobs(
    { query: career?.name || "" },
    { query: { enabled: !!career?.name } }
  );

  if (isCareerLoading) {
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

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Dynamic Header */}
      <div className="bg-gradient-to-br from-primary to-slate-900 text-white pt-16 pb-24 px-4 relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
        <div className="max-w-5xl mx-auto relative z-10">
          <Link href="/recommendations" className="inline-flex items-center text-white/70 hover:text-white mb-8 transition-colors">
            <ArrowLeft className="w-4 h-4 mr-2" /> Back to Recommendations
          </Link>
          <Badge variant="secondary" className="mb-4 bg-white/20 border-white/30 text-white hover:bg-white/30">{career.category}</Badge>
          <h1 className="text-4xl md:text-6xl font-extrabold mb-6 tracking-tight">{career.name}</h1>
          <p className="text-xl md:text-2xl text-white/80 max-w-3xl leading-relaxed">{career.description}</p>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 -mt-12 relative z-20 space-y-8">
        
        {/* Quick Stats Grid */}
        <div className="grid sm:grid-cols-3 gap-4">
          <Card className="p-6 shadow-xl flex items-center gap-4">
            <div className="p-3 bg-green-100 rounded-xl"><TrendingUp className="w-6 h-6 text-green-600" /></div>
            <div>
              <p className="text-sm font-bold text-muted-foreground uppercase">Job Outlook</p>
              <p className="text-lg font-bold">{career.jobOutlook}</p>
            </div>
          </Card>
          <Card className="p-6 shadow-xl flex items-center gap-4">
            <div className="p-3 bg-amber-100 rounded-xl"><Building2 className="w-6 h-6 text-amber-600" /></div>
            <div>
              <p className="text-sm font-bold text-muted-foreground uppercase">Avg Salary (ZW)</p>
              <p className="text-lg font-bold">{career.averageSalary}</p>
            </div>
          </Card>
          <Card className="p-6 shadow-xl flex items-center gap-4">
            <div className="p-3 bg-blue-100 rounded-xl"><Search className="w-6 h-6 text-blue-600" /></div>
            <div>
              <p className="text-sm font-bold text-muted-foreground uppercase">Demand Level</p>
              {isInsightsLoading ? <Skeleton className="h-6 w-20 mt-1" /> : (
                <p className="text-lg font-bold text-primary">{insights?.demandLevel || "Medium"}</p>
              )}
            </div>
          </Card>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Left Column: Requirements */}
          <div className="lg:col-span-2 space-y-8">
            <Card className="p-8">
              <h3 className="text-2xl font-bold mb-6 flex items-center"><BookOpen className="w-6 h-6 mr-3 text-primary" /> Educational Pathway</h3>
              
              <div className="mb-8">
                <h4 className="text-lg font-bold mb-3 border-b pb-2">Required A-Level Subjects</h4>
                <div className="flex flex-wrap gap-2">
                  {career.aLevelSubjects.map((sub, i) => (
                    <Badge key={i} variant="outline" className="text-sm py-1.5 px-4 bg-muted/50">{sub}</Badge>
                  ))}
                </div>
              </div>

              <div>
                <h4 className="text-lg font-bold mb-3 border-b pb-2">University Programs in Zimbabwe</h4>
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
              <h3 className="text-2xl font-bold mb-6 flex items-center"><Brain className="w-6 h-6 mr-3 text-primary" /> Required Skills & Competencies</h3>
              <div className="grid sm:grid-cols-2 gap-4">
                {career.requiredSkills.map((skill, i) => (
                  <div key={i} className="bg-primary/5 border border-primary/10 rounded-xl p-4 flex items-center font-semibold text-foreground">
                    <span className="w-2 h-2 rounded-full bg-primary mr-3"></span>
                    {skill}
                  </div>
                ))}
              </div>
            </Card>
          </div>

          {/* Right Column: Live Data Sidebar */}
          <div className="space-y-8">
            <Card className="p-6 bg-slate-900 text-white border-none shadow-2xl">
              <h3 className="text-xl font-bold mb-4 flex items-center"><LineChart className="w-5 h-5 mr-2 text-accent" /> Market Insights</h3>
              {isInsightsLoading ? (
                <div className="space-y-4"><Skeleton className="h-4 w-full bg-slate-800" /><Skeleton className="h-4 w-2/3 bg-slate-800" /></div>
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
                        <span key={i} className="text-xs px-2 py-1 rounded bg-slate-800 border border-slate-700">{ts}</span>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <p className="text-slate-400 text-sm">Insights currently unavailable.</p>
              )}
            </Card>

            <div>
              <h3 className="text-xl font-bold mb-4">Live Job Openings</h3>
              {isJobsLoading ? (
                <div className="space-y-4">
                  {[1,2].map(i => <Skeleton key={i} className="h-24 w-full rounded-xl" />)}
                </div>
              ) : jobs && jobs.length > 0 ? (
                <div className="space-y-4">
                  {jobs.slice(0,3).map((job, i) => (
                    <a key={i} href="#" className="block p-4 rounded-xl border border-border bg-card hover:border-primary/50 hover:shadow-md transition-all">
                      <h4 className="font-bold text-base mb-1 truncate">{job.title}</h4>
                      <p className="text-sm text-primary font-semibold mb-2">{job.company}</p>
                      <div className="flex items-center text-xs text-muted-foreground">
                        <MapPin className="w-3 h-3 mr-1" /> {job.location}
                      </div>
                    </a>
                  ))}
                  <Button variant="outline" className="w-full">View All Jobs</Button>
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

// Needed to make sure the icon is imported for the custom header above
import { LineChart } from "lucide-react";
