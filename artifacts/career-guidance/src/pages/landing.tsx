import { Link } from "wouter";
import { motion } from "framer-motion";
import { ArrowRight, BrainCircuit, LineChart, Target, Zap, LogIn, UserPlus, BookOpen } from "lucide-react";
import { Button, Card } from "@/components/ui-elements";

export default function LandingPage() {
  const features = [
    {
      title: "AI-Powered Matching",
      description: "Our AI analyzes your strengths, subjects, and interests to find career fits and programs in our database.",
      icon: <BrainCircuit className="w-8 h-8 text-primary" />,
    },
    {
      title: "Zimbabwe-Focused Programs",
      description: "University and polytechnic programs, entry requirements, and cut-off points tailored to the local context.",
      icon: <LineChart className="w-8 h-8 text-secondary" />,
    },
    {
      title: "Personalized Roadmap",
      description: "See which O-Level and A-Level subjects align with degree and diploma pathways.",
      icon: <Target className="w-8 h-8 text-accent" />,
    },
  ];

  return (
    <div className="overflow-hidden">
      {/* Hero Section */}
      <section className="relative pt-20 pb-32 lg:pt-32 lg:pb-40 px-4 sm:px-5 lg:px-6 max-w-7xl mx-auto">
        <div className="absolute top-0 left-1/2 w-[1000px] h-[600px] -translate-x-1/2 bg-gradient-to-b from-primary/10 to-transparent rounded-full blur-3xl -z-10 pointer-events-none" />
        <div className="absolute top-40 right-0 w-[500px] h-[500px] bg-accent/10 rounded-full blur-3xl -z-10 pointer-events-none" />

        <div className="grid lg:grid-cols-2 gap-12 lg:gap-8 items-center">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="max-w-2xl"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary font-semibold text-sm mb-6 border border-primary/20 shadow-sm">
              <Zap className="w-4 h-4 fill-current" />
              Empowering Zimbabwean Students
            </div>
            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-extrabold leading-[1.1] mb-6">
              Find Your True Calling with <span className="gradient-text">AI Precision.</span>
            </h1>
            <p className="text-lg sm:text-xl text-muted-foreground mb-8 leading-relaxed">
              Sign in to take the career assessment, get AI-powered recommendations, and explore programs at universities and polytechnics across Zimbabwe.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 flex-wrap">
              <Link href="/signup">
                <Button size="lg" className="w-full sm:w-auto text-lg group">
                  Get started
                  <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
              <Link href="/login">
                <Button variant="outline" size="lg" className="w-full sm:w-auto text-lg">
                  <LogIn className="mr-2 w-5 h-5" />
                  Log in
                </Button>
              </Link>
              <Link href="/signup">
                <Button variant="secondary" size="lg" className="w-full sm:w-auto text-lg">
                  <UserPlus className="mr-2 w-5 h-5" />
                  Sign up
                </Button>
              </Link>
              <a href="#features">
                <Button variant="ghost" size="lg" className="w-full sm:w-auto text-lg">
                  <BookOpen className="mr-2 w-5 h-5" />
                  Learn more
                </Button>
              </a>
            </div>

            <div className="mt-10 flex items-center gap-4 text-sm font-semibold text-muted-foreground">
              <div className="flex -space-x-3">
                {[1, 2, 3, 4].map((i) => (
                  <div
                    key={i}
                    className="w-10 h-10 rounded-full border-2 border-background bg-muted flex items-center justify-center overflow-hidden"
                  >
                    <img src={`https://i.pravatar.cc/100?img=${i + 10}`} alt="" className="w-full h-full object-cover" />
                  </div>
                ))}
              </div>
              <p>Built for A-Level students planning their next step</p>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 30 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
            className="relative lg:ml-auto w-full max-w-lg mx-auto"
          >
            <div className="absolute inset-0 bg-gradient-to-tr from-primary/20 to-secondary/20 rounded-[2.5rem] transform rotate-3 scale-105 -z-10 transition-transform duration-500 hover:rotate-6" />
            <div className="rounded-[2.5rem] overflow-hidden border-8 border-white shadow-2xl bg-white">
              <img
                src={`${import.meta.env.BASE_URL}images/hero-bg.png`}
                alt="Students walking to university"
                className="w-full h-auto object-cover aspect-[4/5] sm:aspect-[4/3] lg:aspect-square hover:scale-105 transition-transform duration-700"
              />
            </div>

            <motion.div
              animate={{ y: [0, -10, 0] }}
              transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
              className="absolute -bottom-6 -left-6 glass-card p-4 rounded-2xl flex items-center gap-4"
            >
              <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center">
                <Target className="w-6 h-6 text-emerald-600" />
              </div>
              <div>
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Top Match</p>
                <p className="text-lg font-bold text-foreground">Your path</p>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-24 bg-white relative scroll-mt-24">
        <div className="w-full max-w-7xl mx-auto px-4 sm:px-5 lg:px-6">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">What CareerGuideZW does</h2>
            <p className="text-lg text-muted-foreground">
              A guided career and program matching system for Zimbabwean students—assessment, recommendations, and AI advice.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {features.map((feature, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
              >
                <Card className="h-full p-8 hover:shadow-xl hover:border-primary/30 transition-all duration-300 group bg-gray-50/50">
                  <div className="w-16 h-16 rounded-2xl bg-white shadow-sm border border-border flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                    {feature.icon}
                  </div>
                  <h3 className="text-xl font-bold mb-3">{feature.title}</h3>
                  <p className="text-muted-foreground leading-relaxed">{feature.description}</p>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 relative overflow-hidden">
        <img
          src={`${import.meta.env.BASE_URL}images/abstract-success.png`}
          alt=""
          className="absolute inset-0 w-full h-full object-cover opacity-10"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background to-transparent" />

        <div className="w-full max-w-7xl mx-auto px-4 sm:px-5 lg:px-6 relative z-10 text-center max-w-3xl">
          <h2 className="text-4xl md:text-5xl font-bold mb-6">Ready to shape your future?</h2>
          <p className="text-xl text-muted-foreground mb-10">
            Create a free account to take the assessment and unlock your personalized roadmap.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/signup">
              <Button size="lg" variant="accent" className="text-xl px-12 h-16 rounded-2xl shadow-xl shadow-accent/20">
                Get started
              </Button>
            </Link>
            <Link href="/login">
              <Button size="lg" variant="outline" className="text-xl px-12 h-16 rounded-2xl">
                Log in
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
