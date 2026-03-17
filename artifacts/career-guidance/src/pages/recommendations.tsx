import { useEffect } from "react";
import { Link, useLocation } from "wouter";
import { motion } from "framer-motion";
import { Briefcase, ArrowRight, BrainCircuit, AlertCircle, RefreshCw } from "lucide-react";
import { Button, Card, Badge, Progress, Skeleton } from "@/components/ui-elements";
import { useCareerStore } from "@/store/use-career-store";
import { useGetRecommendations } from "@workspace/api-client-react";

export default function RecommendationsPage() {
  const [, setLocation] = useLocation();
  const profile = useCareerStore(s => s.profile);
  
  const { mutate, data: recommendations, isPending, isError } = useGetRecommendations();

  useEffect(() => {
    if (profile && !recommendations && !isPending) {
      mutate({ data: profile });
    }
  }, [profile, recommendations, isPending, mutate]);

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
    <div className="min-h-screen bg-muted/20 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-secondary/10 text-secondary font-semibold text-sm mb-4">
              <BrainCircuit className="w-4 h-4" />
              AI Analysis Complete
            </div>
            <h1 className="text-4xl md:text-5xl font-bold mb-4">Your Career Matches</h1>
            <p className="text-lg text-muted-foreground">Based on your interests in {profile.interests.slice(0,2).join(', ')} and {profile.subjects.length} A-Level subjects, here are the best career paths for you in Zimbabwe.</p>
          </div>
          <Button variant="outline" onClick={() => mutate({ data: profile })} disabled={isPending}>
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
                      Top Match
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
                        <div className="text-xs font-bold text-muted-foreground uppercase">Match</div>
                      </div>
                    </div>

                    <div className="mb-6">
                      <Progress value={rec.matchPercentage} className="h-2 mb-2" indicatorClassName={idx === 0 ? "bg-gradient-to-r from-primary to-accent" : ""} />
                    </div>

                    <p className="text-muted-foreground mb-6 line-clamp-2">{rec.career.description}</p>

                    <div className="space-y-4 mb-8">
                      <div>
                        <h4 className="text-sm font-bold mb-2 flex items-center"><Briefcase className="w-4 h-4 mr-2" /> Why it matches you:</h4>
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
