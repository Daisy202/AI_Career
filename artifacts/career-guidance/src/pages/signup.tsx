import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Link, useLocation } from "wouter";
import { Loader2, ArrowLeft } from "lucide-react";
import { Button, Input, Label, Card } from "@/components/ui-elements";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useRegisterUser } from "@workspace/api-client-react";
import { useCareerStore } from "@/store/use-career-store";
import { useToast } from "@/hooks/use-toast";

const registerSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  school: z.string().optional(),
  level: z.string().optional(),
});

export default function SignupPage() {
  const { toast } = useToast();
  const setUser = useCareerStore((s) => s.setUser);
  const [, setLocation] = useLocation();
  const registerMutation = useRegisterUser();

  const form = useForm<z.infer<typeof registerSchema>>({
    resolver: zodResolver(registerSchema),
    defaultValues: { name: "", email: "", password: "", school: "", level: "" },
  });

  const onSubmit = (data: z.infer<typeof registerSchema>) => {
    registerMutation.mutate(
      { data },
      {
        onSuccess: (res) => {
          setUser(res.user);
          const params = new URLSearchParams(window.location.search);
          const redirect = params.get("redirect") || "/assessment";
          toast({ title: "Account created", description: "Welcome to CareerGuideZW." });
          setLocation(redirect.startsWith("/") ? redirect : "/assessment");
        },
        onError: (err: unknown) => {
          const msg =
            typeof err === "object" && err !== null && "data" in err && err.data && typeof err.data === "object" && "error" in err.data
              ? String((err.data as { error?: string }).error)
              : "Could not create account";
          toast({ title: "Registration failed", description: msg, variant: "destructive" });
        },
      }
    );
  };

  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4 py-16">
      <Card className="w-full max-w-md p-8 shadow-xl border-border">
        <Link href="/" className="inline-flex items-center text-sm text-muted-foreground hover:text-primary mb-6">
          <ArrowLeft className="w-4 h-4 mr-2" /> Back to home
        </Link>
        <h1 className="text-2xl font-bold mb-1">Create account</h1>
        <p className="text-muted-foreground text-sm mb-6">Sign up to save your profile and get personalized career guidance.</p>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="reg-name">Full name</Label>
            <Input id="reg-name" {...form.register("name")} autoComplete="name" />
            {form.formState.errors.name && (
              <p className="text-sm text-destructive">{form.formState.errors.name.message}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="reg-email">Email</Label>
            <Input id="reg-email" type="email" {...form.register("email")} autoComplete="email" />
            {form.formState.errors.email && (
              <p className="text-sm text-destructive">{form.formState.errors.email.message}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="reg-password">Password</Label>
            <Input id="reg-password" type="password" {...form.register("password")} autoComplete="new-password" />
            {form.formState.errors.password && (
              <p className="text-sm text-destructive">{form.formState.errors.password.message}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="reg-school">School (optional)</Label>
            <Input id="reg-school" {...form.register("school")} />
          </div>
          <div className="space-y-2">
            <Label>Level (optional)</Label>
            <Select onValueChange={(v) => form.setValue("level", v)}>
              <SelectTrigger className="bg-card">
                <SelectValue placeholder="Select your level" />
              </SelectTrigger>
              <SelectContent className="bg-card border-border shadow-lg">
                <SelectItem value="Form 4">Form 4</SelectItem>
                <SelectItem value="Form 6">Form 6</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button type="submit" className="w-full" disabled={registerMutation.isPending}>
            {registerMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Create account
          </Button>
        </form>
        <p className="text-center text-sm text-muted-foreground mt-6">
          Already have an account?{" "}
          <Link href="/login" className="font-semibold text-primary hover:underline">
            Sign in
          </Link>
        </p>
      </Card>
    </div>
  );
}
