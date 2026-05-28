import { useGetCareers } from "@workspace/api-client-react";
import { Card, Skeleton } from "@/components/ui-elements";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import { BookOpenCheck, School, GraduationCap, BriefcaseBusiness } from "lucide-react";
import { useCareerStore } from "@/store/use-career-store";

const COLORS = ['#1e40af', '#0ea5e9', '#f59e0b', '#10b981', '#8b5cf6', '#8b5cf6', '#ec4899'];

export default function DashboardPage() {
  const { data: careers, isLoading } = useGetCareers();
  const profile = useCareerStore((s) => s.profile);
  const user = useCareerStore((s) => s.user);

  const hasALevel = (profile?.subjects?.length ?? 0) > 0;
  const points = profile?.cutOffPoints ?? null;
  const isAdmin = user?.role === "admin";
  const tier: "super_admin" | "certificate_diploma" | "degree_first" | "mixed_low_points" = isAdmin
    ? "super_admin"
    : !hasALevel
      ? "certificate_diploma"
      : points != null && points < 5
        ? "mixed_low_points"
        : "degree_first";
  const tierLabel =
    tier === "super_admin"
      ? "Super Admin"
      : tier === "certificate_diploma"
        ? "Certificate / Diploma Tier"
        : tier === "degree_first"
          ? "Degree Tier"
          : "Mixed Low-Points Tier";
  const tierPathMessage =
    tier === "super_admin"
      ? "You are logged in as Super Admin. You can manage all tiers, pathways, and program guidance system-wide."
      : tier === "certificate_diploma"
        ? "You are a certificate/diploma-tier student. Consider practical certificate and diploma paths first, then upgrade to degree pathways."
        : tier === "degree_first"
          ? "You are a degree-tier student. Consider direct degree pathways first, with diploma/certificate as alternatives."
          : "You are a mixed low-points-tier student. Consider low-threshold degree options, but prioritize diploma routes for stronger enrollment chances.";

  if (isLoading) {
    return (
      <div className="px-4 sm:px-5 lg:px-6 py-8 max-w-7xl mx-auto space-y-8">
        <Skeleton className="h-10 w-64 mb-4" />
        <div className="grid md:grid-cols-3 gap-6">
          {[1,2,3].map(i => <Skeleton key={i} className="h-32 rounded-2xl" />)}
        </div>
        <div className="grid lg:grid-cols-2 gap-6">
          <Skeleton className="h-[400px] rounded-2xl" />
          <Skeleton className="h-[400px] rounded-2xl" />
        </div>
      </div>
    );
  }

  // Transform data for charts
  const categoryCount = careers?.reduce((acc, career) => {
    acc[career.category] = (acc[career.category] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const pieData = Object.entries(categoryCount || {}).map(([name, value]) => ({ name, value }));

  // Mock demand data based on salaries
  const demandData = careers?.slice(0, 7).map(c => ({
    name: c.name,
    demand: Math.floor(Math.random() * 80) + 20, // Mocking numeric demand for the chart
    salary: parseInt(c.averageSalary.replace(/[^0-9]/g, ''), 10) || 0
  })).sort((a,b) => b.demand - a.demand) || [];

  return (
    <div className="min-h-screen bg-muted/20 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-5 lg:px-6">
        <div className="mb-10">
          <h1 className="text-4xl font-extrabold mb-2 text-foreground">Market Dashboard</h1>
          <p className="text-lg text-muted-foreground">Macro view of the Zimbabwean career landscape.</p>
        </div>

        <Card className="p-6 bg-white border-l-4 border-l-primary mb-8">
          <p className="text-sm font-bold text-muted-foreground uppercase mb-1">Your Student Tier</p>
          <h2 className="text-2xl font-extrabold text-primary mb-2">{tierLabel}</h2>
          <p className="text-sm text-muted-foreground">{tierPathMessage}</p>
        </Card>

        {/* Zimbabwe-specific pathway stages */}
        <div className="grid md:grid-cols-2 xl:grid-cols-4 gap-6 mb-8">
          <Card className="p-6 bg-white border-l-4 border-l-primary">
            <BookOpenCheck className="w-7 h-7 text-primary mb-3" />
            <p className="text-sm font-bold text-muted-foreground uppercase mb-1">Stage 1</p>
            <h3 className="text-lg font-extrabold">O-Level Foundation</h3>
            <p className="text-sm text-muted-foreground mt-2">Build core passes and identify strengths, interests, and career direction.</p>
          </Card>
          <Card className="p-6 bg-white border-l-4 border-l-secondary">
            <School className="w-7 h-7 text-secondary mb-3" />
            <p className="text-sm font-bold text-muted-foreground uppercase mb-1">Stage 2</p>
            <h3 className="text-lg font-extrabold">A-Level Or Diploma Path</h3>
            <p className="text-sm text-muted-foreground mt-2">Choose subjects or practical diploma/certificate routes aligned to opportunities.</p>
          </Card>
          <Card className="p-6 bg-white border-l-4 border-l-accent">
            <GraduationCap className="w-7 h-7 text-accent mb-3" />
            <p className="text-sm font-bold text-muted-foreground uppercase mb-1">Stage 3</p>
            <h3 className="text-lg font-extrabold">Program Admission</h3>
            <p className="text-sm text-muted-foreground mt-2">Apply to Zimbabwe universities, polytechnics, and colleges with best-fit entry chances.</p>
          </Card>
          <Card className="p-6 bg-white border-l-4 border-l-emerald-600">
            <BriefcaseBusiness className="w-7 h-7 text-emerald-700 mb-3" />
            <p className="text-sm font-bold text-muted-foreground uppercase mb-1">Stage 4</p>
            <h3 className="text-lg font-extrabold">Career Entry & Growth</h3>
            <p className="text-sm text-muted-foreground mt-2">Move into internships, first jobs, and professional progression pathways in Zimbabwe.</p>
          </Card>
        </div>

        {/* Charts */}
        <div className="grid lg:grid-cols-2 gap-8">
          <Card className="p-6 sm:p-8">
            <h3 className="text-xl font-bold mb-6">High Demand Careers</h3>
            <div className="h-[350px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={demandData} layout="vertical" margin={{ top: 5, right: 30, left: 40, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#e2e8f0" />
                  <XAxis type="number" hide />
                  <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{fill: '#475569', fontSize: 12}} width={120} />
                  <Tooltip 
                    cursor={{fill: '#f1f5f9'}} 
                    contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)'}}
                  />
                  <Bar dataKey="demand" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} barSize={24} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>

          <Card className="p-6 sm:p-8">
            <h3 className="text-xl font-bold mb-6">Careers by Sector</h3>
            <div className="h-[350px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="45%"
                    innerRadius={80}
                    outerRadius={120}
                    paddingAngle={5}
                    dataKey="value"
                    stroke="none"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)'}}
                  />
                  <Legend verticalAlign="bottom" height={36} iconType="circle" />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </div>
      </div>
      <script src="https://wonda.co.zw/wp-content/plugins/wonda-central/widget/embed.js" data-site-id="site_1464caa6362b7e14" data-site-secret="sk_a4db9da0b3d8e842df494ebe42b1add1" async defer></script>
    </div>
  );
}
