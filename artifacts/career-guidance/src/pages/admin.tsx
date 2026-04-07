import { useState, useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { ShieldAlert, Plus, Upload, BarChart3, MessageSquare, FileText } from "lucide-react";
import { Button, Card, Input, Label, Textarea, Badge } from "@/components/ui-elements";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useGetPrograms, useCreateProgram, useUploadPrograms } from "@workspace/api-client-react";
import { useToast } from "@/hooks/use-toast";
import { useCareerStore } from "@/store/use-career-store";

const programSchema = z.object({
  schoolName: z.string().min(1, "School Name is required"),
  programName: z.string().min(1, "Program Name is required"),
  faculty: z.string().optional(),
  requiredSubjects: z.string().min(1, "At least one subject is required"), // comma separated string for form
  minRequiredSubjects: z.coerce.number().min(1).optional().nullable(),
  minimumPoints: z.coerce.number().optional().nullable(),
  minOLevelPasses: z.coerce.number().min(0).max(10).optional().nullable(),
  minALevelPasses: z.coerce.number().min(0).max(5).optional().nullable(),
  duration: z.string().optional(),
  description: z.string().optional(),
  careerCategory: z.string().optional()
});

const careerCategories = [
  "Technology", "Healthcare", "Engineering", "Business & Finance", 
  "Law", "Agriculture", "Education", "Media & Communication", "Social Sciences"
];

export default function AdminPage() {
  const { toast } = useToast();
  const user = useCareerStore(s => s.user);
  const [uploadData, setUploadData] = useState("");
  
  const { data: programs, refetch } = useGetPrograms();
  const createMutation = useCreateProgram();
  const uploadMutation = useUploadPrograms();

  const [stats, setStats] = useState<{ totalRequests: number; avgResponseTimeMs: number; errorCount: number; chatRequests: number; feedbackCount: number; newChatSessions: number; periodHours: number } | null>(null);
  const [logs, setLogs] = useState<{ id: number; path: string; method: string; status: number; responseTimeMs: number; userId?: number; createdAt: string }[]>([]);
  const [feedbacks, setFeedbacks] = useState<{ id: number; userId?: number; rating: number; comment?: string; careerName?: string; helpful: string; createdAt: string }[]>([]);
  const [fileLogs, setFileLogs] = useState<{ entries: Array<{ timestamp: string; log_type: string; severity: string; user_id?: number | null; message: string; details?: unknown }>; total: number }>({ entries: [], total: 0 });
  const [fileLogType, setFileLogType] = useState<string>("all");

  useEffect(() => {
    if (!user || user.role !== "admin") return;
    fetch("/api/admin/stats?hours=24", { credentials: "include" })
      .then((r) => r.ok ? r.json() : null)
      .then(setStats)
      .catch(() => {});
    fetch("/api/admin/logs?limit=100", { credentials: "include" })
      .then((r) => r.ok ? r.json() : [])
      .then(setLogs)
      .catch(() => setLogs([]));
    fetch("/api/admin/feedback?limit=50", { credentials: "include" })
      .then((r) => r.ok ? r.json() : [])
      .then(setFeedbacks)
      .catch(() => setFeedbacks([]));
  }, [user]);

  useEffect(() => {
    if (!user || user.role !== "admin") return;
    const url = new URL("/api/admin/file-logs", window.location.origin);
    url.searchParams.set("limit", "100");
    if (fileLogType && fileLogType !== "all") url.searchParams.set("type", fileLogType);
    fetch(url.toString(), { credentials: "include" })
      .then((r) => r.ok ? r.json() : { entries: [], total: 0 })
      .then(setFileLogs)
      .catch(() => setFileLogs({ entries: [], total: 0 }));
  }, [user, fileLogType]);

  const form = useForm<z.infer<typeof programSchema>>({
    resolver: zodResolver(programSchema),
    defaultValues: {
      schoolName: "", programName: "", faculty: "", requiredSubjects: "", 
      minRequiredSubjects: null, minimumPoints: null, minOLevelPasses: 5, minALevelPasses: 2, duration: "", description: "", careerCategory: ""
    }
  });

  if (!user || user.role !== 'admin') {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center p-4 text-center">
        <ShieldAlert className="w-16 h-16 text-destructive mb-4" />
        <h2 className="text-3xl font-bold mb-2">Access Denied</h2>
        <p className="text-muted-foreground">You do not have permission to view this page.</p>
      </div>
    );
  }

  const onAddProgram = (data: z.infer<typeof programSchema>) => {
    const subjectsArray = data.requiredSubjects.split(',').map(s => s.trim()).filter(Boolean);
    
    createMutation.mutate({
      data: {
        schoolName: data.schoolName,
        programName: data.programName,
        faculty: data.faculty || null,
        requiredSubjects: subjectsArray,
        minRequiredSubjects: data.minRequiredSubjects ?? null,
        minimumPoints: data.minimumPoints ?? null,
        minOLevelPasses: data.minOLevelPasses ?? 5,
        minALevelPasses: data.minALevelPasses ?? 2,
        duration: data.duration || null,
        description: data.description || null,
        careerCategory: data.careerCategory || null,
      }
    }, {
      onSuccess: () => {
        toast({ title: "Success", description: "Program created successfully." });
        form.reset();
        refetch();
      },
      onError: (err: any) => {
        toast({ title: "Error", description: err.data?.error || "Failed to create program", variant: "destructive" });
      }
    });
  };

  const handleUpload = () => {
    try {
      let parsedPrograms = [];
      if (uploadData.trim().startsWith('[')) {
        parsedPrograms = JSON.parse(uploadData);
      } else {
        // CSV parsing logic: schoolName,programName,faculty,requiredSubjects(semicolon-separated),minimumPoints,duration,description,careerCategory
        const lines = uploadData.trim().split('\n');
        // skip header if exists
        const startIdx = lines[0].toLowerCase().includes('schoolname') ? 1 : 0;
        for (let i = startIdx; i < lines.length; i++) {
          const parts = lines[i].split(',').map(s => s.trim());
          if (parts.length >= 2) {
            parsedPrograms.push({
              schoolName: parts[0],
              programName: parts[1],
              faculty: parts[2] || undefined,
              requiredSubjects: parts[3] ? parts[3].split(';').map(s=>s.trim()).filter(Boolean) : [],
              minimumPoints: parts[4] ? parseInt(parts[4], 10) : undefined,
              duration: parts[5] || undefined,
              description: parts[6] || undefined,
              careerCategory: parts[7] || undefined
            });
          }
        }
      }

      uploadMutation.mutate({
        data: {
          programs: parsedPrograms,
          replace: false
        }
      }, {
        onSuccess: (res) => {
          toast({ title: "Upload Success", description: `Imported ${res.imported} programs.` });
          setUploadData("");
          refetch();
        },
        onError: (err: any) => {
          toast({ title: "Error", description: err.data?.error || "Upload failed", variant: "destructive" });
        }
      });
    } catch (e) {
      toast({ title: "Invalid Format", description: "Could not parse JSON or CSV", variant: "destructive" });
    }
  };

  return (
    <div className="min-h-screen bg-muted/20 py-12 px-4 sm:px-5 lg:px-6">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-4xl font-bold mb-8 flex items-center">
          <ShieldAlert className="w-8 h-8 mr-3 text-primary" /> Admin Panel
        </h1>

        <Tabs defaultValue="programs" className="w-full">
          <TabsList className="mb-8 bg-white border shadow-sm flex-wrap">
            <TabsTrigger value="programs" className="data-[state=active]:bg-primary/10 data-[state=active]:text-primary">Programs</TabsTrigger>
            <TabsTrigger value="add" className="data-[state=active]:bg-primary/10 data-[state=active]:text-primary">Add Program</TabsTrigger>
            <TabsTrigger value="upload" className="data-[state=active]:bg-primary/10 data-[state=active]:text-primary">Bulk Upload</TabsTrigger>
            <TabsTrigger value="monitoring" className="data-[state=active]:bg-primary/10 data-[state=active]:text-primary">
              <BarChart3 className="w-4 h-4 mr-2" /> Monitoring
            </TabsTrigger>
            <TabsTrigger value="feedback" className="data-[state=active]:bg-primary/10 data-[state=active]:text-primary">
              <MessageSquare className="w-4 h-4 mr-2" /> Feedback
            </TabsTrigger>
            <TabsTrigger value="file-logs" className="data-[state=active]:bg-primary/10 data-[state=active]:text-primary">
              <FileText className="w-4 h-4 mr-2" /> File Logs
            </TabsTrigger>
          </TabsList>

          <TabsContent value="programs">
            <Card className="p-6 overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>School</TableHead>
                    <TableHead>Program</TableHead>
                    <TableHead>Subjects</TableHead>
                    <TableHead>Cut-off</TableHead>
                    <TableHead>O/A Level</TableHead>
                    <TableHead>Category</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {programs?.length ? programs.map((p) => (
                    <TableRow key={p.id}>
                      <TableCell className="font-semibold">{p.schoolName}</TableCell>
                      <TableCell>{p.programName}</TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {p.requiredSubjects.map((s, i) => <Badge key={i} variant="outline" className="text-[10px]">{s}</Badge>)}
                        </div>
                      </TableCell>
                      <TableCell>{p.minimumPoints || '-'}</TableCell>
                      <TableCell className="text-xs">{p.minOLevelPasses ?? 5}O / {p.minALevelPasses ?? 2}A</TableCell>
                      <TableCell>{p.careerCategory}</TableCell>
                    </TableRow>
                  )) : (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center text-muted-foreground h-32">No programs available. Add some data.</TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </Card>
          </TabsContent>

          <TabsContent value="add">
            <Card className="p-6">
              <form onSubmit={form.handleSubmit(onAddProgram)} className="space-y-6 max-w-3xl">
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label>School Name</Label>
                    <Input {...form.register("schoolName")} placeholder="e.g. University of Zimbabwe" />
                    {form.formState.errors.schoolName && <p className="text-sm text-destructive">{form.formState.errors.schoolName.message}</p>}
                  </div>
                  <div className="space-y-2">
                    <Label>Program Name</Label>
                    <Input {...form.register("programName")} placeholder="e.g. BSc Computer Science" />
                    {form.formState.errors.programName && <p className="text-sm text-destructive">{form.formState.errors.programName.message}</p>}
                  </div>
                  <div className="space-y-2">
                    <Label>Faculty (Optional)</Label>
                    <Input {...form.register("faculty")} />
                  </div>
                  <div className="space-y-2">
                    <Label>Career Category</Label>
                    <Controller
                      name="careerCategory"
                      control={form.control}
                      render={({ field }) => (
                        <Select onValueChange={field.onChange} value={field.value}>
                          <SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger>
                          <SelectContent>
                            {careerCategories.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      )}
                    />
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <Label>Required Subjects (Comma-separated)</Label>
                    <Input {...form.register("requiredSubjects")} placeholder="e.g. Mathematics, Physics" />
                    {form.formState.errors.requiredSubjects && <p className="text-sm text-destructive">{form.formState.errors.requiredSubjects.message}</p>}
                  </div>
                  <div className="space-y-2">
                    <Label>Min of Required (Optional)</Label>
                    <Input type="number" min={1} {...form.register("minRequiredSubjects")} placeholder="e.g. 2 = at least 2 of the listed subjects" />
                    <p className="text-xs text-muted-foreground">Leave empty to require all listed subjects</p>
                  </div>
                  <div className="space-y-2">
                    <Label>Minimum Points (Optional)</Label>
                    <Input type="number" {...form.register("minimumPoints")} />
                  </div>
                  <div className="space-y-2">
                    <Label>Min O-Level Passes (default 5)</Label>
                    <Input type="number" min={0} max={10} {...form.register("minOLevelPasses")} placeholder="5" />
                  </div>
                  <div className="space-y-2">
                    <Label>Min A-Level Passes (default 2)</Label>
                    <Input type="number" min={0} max={5} {...form.register("minALevelPasses")} placeholder="2" />
                  </div>
                  <div className="space-y-2">
                    <Label>Duration (Optional)</Label>
                    <Input {...form.register("duration")} placeholder="e.g. 4 years" />
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <Label>Description (Optional)</Label>
                    <Textarea {...form.register("description")} />
                  </div>
                </div>
                <Button type="submit" disabled={createMutation.isPending}>
                  <Plus className="w-4 h-4 mr-2" /> Add Program
                </Button>
              </form>
            </Card>
          </TabsContent>

          <TabsContent value="monitoring">
            <Card className="p-6">
              <h2 className="text-lg font-bold mb-4 flex items-center"><BarChart3 className="w-5 h-5 mr-2" /> System Monitoring</h2>
              {stats && (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
                  <div className="p-4 rounded-xl bg-muted/50 border">
                    <p className="text-xs font-semibold text-muted-foreground">Total Requests</p>
                    <p className="text-2xl font-bold">{stats.totalRequests}</p>
                    <p className="text-xs text-muted-foreground">Last {stats.periodHours}h</p>
                  </div>
                  <div className="p-4 rounded-xl bg-muted/50 border">
                    <p className="text-xs font-semibold text-muted-foreground">Avg Response (ms)</p>
                    <p className="text-2xl font-bold">{stats.avgResponseTimeMs}</p>
                  </div>
                  <div className="p-4 rounded-xl bg-muted/50 border">
                    <p className="text-xs font-semibold text-muted-foreground">Errors</p>
                    <p className="text-2xl font-bold text-destructive">{stats.errorCount}</p>
                  </div>
                  <div className="p-4 rounded-xl bg-muted/50 border">
                    <p className="text-xs font-semibold text-muted-foreground">Chat Requests</p>
                    <p className="text-2xl font-bold">{stats.chatRequests}</p>
                  </div>
                  <div className="p-4 rounded-xl bg-muted/50 border">
                    <p className="text-xs font-semibold text-muted-foreground">New Sessions</p>
                    <p className="text-2xl font-bold">{stats.newChatSessions}</p>
                  </div>
                  <div className="p-4 rounded-xl bg-muted/50 border">
                    <p className="text-xs font-semibold text-muted-foreground">Feedback</p>
                    <p className="text-2xl font-bold">{stats.feedbackCount}</p>
                  </div>
                </div>
              )}
              <h3 className="font-bold mb-2">Recent API Logs</h3>
              <div className="overflow-x-auto max-h-96 overflow-y-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Time</TableHead>
                      <TableHead>Path</TableHead>
                      <TableHead>Method</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Response (ms)</TableHead>
                      <TableHead>User</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {logs.map((log) => (
                      <TableRow key={log.id}>
                        <TableCell className="text-xs">{new Date(log.createdAt).toLocaleString()}</TableCell>
                        <TableCell className="font-mono text-xs">{log.path}</TableCell>
                        <TableCell><Badge variant="outline">{log.method}</Badge></TableCell>
                        <TableCell><Badge variant={log.status >= 400 ? "warning" : "default"}>{log.status}</Badge></TableCell>
                        <TableCell>{log.responseTimeMs}ms</TableCell>
                        <TableCell>{log.userId ?? "-"}</TableCell>
                      </TableRow>
                    ))}
                    {logs.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center text-muted-foreground py-8">No logs yet</TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </Card>
          </TabsContent>

          <TabsContent value="file-logs">
            <Card className="p-6">
              <h2 className="text-lg font-bold mb-4 flex items-center"><FileText className="w-5 h-5 mr-2" /> Structured File Logs</h2>
              <p className="text-sm text-muted-foreground mb-4">Prediction, user activity, auth, errors, admin actions. Pretty-printed in data/logs/AICareer.logs</p>
              <div className="flex gap-2 mb-4">
                <Select value={fileLogType} onValueChange={setFileLogType}>
                  <SelectTrigger className="w-48 bg-card border-border shadow-sm">
                    <SelectValue placeholder="All types" />
                  </SelectTrigger>
                  <SelectContent className="bg-card text-card-foreground border-border shadow-lg opacity-100">
                    <SelectItem value="all">All types</SelectItem>
                    <SelectItem value="prediction">Prediction</SelectItem>
                    <SelectItem value="user_activity">User Activity</SelectItem>
                    <SelectItem value="auth">Auth</SelectItem>
                    <SelectItem value="error">Error</SelectItem>
                    <SelectItem value="api">API</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                    <SelectItem value="system">System</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="overflow-x-auto max-h-[500px] overflow-y-auto space-y-4">
                {fileLogs.entries.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">No file logs yet</p>
                ) : (
                  fileLogs.entries.map((entry, i) => (
                    <div key={i} className="p-4 rounded-lg border bg-muted/30 text-sm font-mono">
                      <div className="flex flex-wrap gap-2 mb-2">
                        <Badge variant="outline">{entry.log_type}</Badge>
                        <Badge variant={entry.severity === "ERROR" ? "warning" : "secondary"}>{entry.severity}</Badge>
                        <span className="text-muted-foreground">{new Date(entry.timestamp).toLocaleString()}</span>
                        {entry.user_id != null && <span>User #{entry.user_id}</span>}
                      </div>
                      <p className="font-semibold mb-1">{entry.message}</p>
                      {entry.details && (
                        <pre className="text-xs overflow-x-auto whitespace-pre-wrap break-words mt-2 p-2 bg-background rounded">
                          {JSON.stringify(entry.details, null, 2)}
                        </pre>
                      )}
                    </div>
                  ))
                )}
              </div>
              <p className="text-xs text-muted-foreground mt-4">Showing {fileLogs.entries.length} of {fileLogs.total} entries</p>
            </Card>
          </TabsContent>

          <TabsContent value="feedback">
            <Card className="p-6">
              <h2 className="text-lg font-bold mb-4 flex items-center"><MessageSquare className="w-5 h-5 mr-2" /> User Feedback</h2>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Rating</TableHead>
                      <TableHead>Helpful</TableHead>
                      <TableHead>Career</TableHead>
                      <TableHead>Comment</TableHead>
                      <TableHead>User</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {feedbacks.map((f) => (
                      <TableRow key={f.id}>
                        <TableCell className="text-xs">{new Date(f.createdAt).toLocaleString()}</TableCell>
                        <TableCell>{f.rating}/5</TableCell>
                        <TableCell>{f.helpful === "true" ? "Yes" : "No"}</TableCell>
                        <TableCell>{f.careerName ?? "-"}</TableCell>
                        <TableCell className="max-w-xs truncate">{f.comment ?? "-"}</TableCell>
                        <TableCell>{f.userId ?? "Guest"}</TableCell>
                      </TableRow>
                    ))}
                    {feedbacks.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center text-muted-foreground py-8">No feedback yet</TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </Card>
          </TabsContent>

          <TabsContent value="upload">
            <Card className="p-6">
              <h2 className="text-lg font-bold mb-4">Bulk Upload JSON/CSV</h2>
              <p className="text-sm text-muted-foreground mb-4">
                Paste JSON array or CSV text here. <br/>
                JSON Example: <code className="bg-muted px-1 rounded">[{`{"schoolName":"UZ","programName":"BSc CS","requiredSubjects":["Math","Physics"],"minimumPoints":10,"duration":"4 years","careerCategory":"Technology"}`}]</code><br/>
                CSV Format: <code className="bg-muted px-1 rounded">schoolName,programName,faculty,requiredSubjects(semicolon-separated),minimumPoints,duration,description,careerCategory</code>
              </p>
              <Textarea 
                value={uploadData} 
                onChange={(e) => setUploadData(e.target.value)} 
                className="h-64 mb-4 font-mono text-sm" 
                placeholder="Paste data here..."
              />
              <Button onClick={handleUpload} disabled={uploadMutation.isPending || !uploadData.trim()}>
                <Upload className="w-4 h-4 mr-2" /> Process Upload
              </Button>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}