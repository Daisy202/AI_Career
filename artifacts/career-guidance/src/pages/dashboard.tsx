import { useGetCareers } from "@workspace/api-client-react";
import { Card, Skeleton } from "@/components/ui-elements";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import { Briefcase, TrendingUp, Users } from "lucide-react";

const COLORS = ['#1e40af', '#0ea5e9', '#f59e0b', '#10b981', '#8b5cf6', '#8b5cf6', '#ec4899'];

export default function DashboardPage() {
  const { data: careers, isLoading } = useGetCareers();

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

        {/* Stats Row */}
        <div className="grid sm:grid-cols-3 gap-6 mb-8">
          <Card className="p-6 flex items-center justify-between bg-white border-l-4 border-l-primary">
            <div>
              <p className="text-sm font-bold text-muted-foreground uppercase">Tracked Careers</p>
              <h3 className="text-3xl font-black mt-1">{careers?.length || 0}</h3>
            </div>
            <div className="p-4 bg-primary/10 rounded-full"><Briefcase className="w-6 h-6 text-primary" /></div>
          </Card>
          <Card className="p-6 flex items-center justify-between bg-white border-l-4 border-l-secondary">
            <div>
              <p className="text-sm font-bold text-muted-foreground uppercase">Top Industry</p>
              <h3 className="text-2xl font-black mt-1 text-secondary truncate">{pieData.sort((a,b) => b.value - a.value)[0]?.name || "N/A"}</h3>
            </div>
            <div className="p-4 bg-secondary/10 rounded-full"><TrendingUp className="w-6 h-6 text-secondary" /></div>
          </Card>
          <Card className="p-6 flex items-center justify-between bg-white border-l-4 border-l-accent">
            <div>
              <p className="text-sm font-bold text-muted-foreground uppercase">Student Users</p>
              <h3 className="text-3xl font-black mt-1">2,450+</h3>
            </div>
            <div className="p-4 bg-accent/20 rounded-full"><Users className="w-6 h-6 text-accent-foreground" /></div>
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
    </div>
  );
}
