import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Link, useLocation } from "wouter";
import { Loader2, ArrowLeft } from "lucide-react";
import { Button, Input, Label, Card } from "@/components/ui-elements";
import { useLoginUser } from "@workspace/api-client-react";
import { useCareerStore } from "@/store/use-career-store";
import { useToast } from "@/hooks/use-toast";

const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

export default function LoginPage() {
  const { toast } = useToast();
  const setUser = useCareerStore((s) => s.setUser);
  const [, setLocation] = useLocation();
  const loginMutation = useLoginUser();

  const form = useForm<z.infer<typeof loginSchema>>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  const onSubmit = (data: z.infer<typeof loginSchema>) => {
    loginMutation.mutate(
      { data },
      {
        onSuccess: (res) => {
          setUser(res.user);
          const params = new URLSearchParams(window.location.search);
          const redirect = params.get("redirect") || "/assessment";
          toast({ title: "Welcome back", description: "Signed in successfully." });
          setLocation(redirect.startsWith("/") ? redirect : "/assessment");
        },
        onError: (err: unknown) => {
          const msg =
            typeof err === "object" && err !== null && "data" in err && err.data && typeof err.data === "object" && "error" in err.data
              ? String((err.data as { error?: string }).error)
              : "Invalid email or password";
          toast({ title: "Sign in failed", description: msg, variant: "destructive" });
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
        <h1 className="text-2xl font-bold mb-1">Sign in</h1>
        <p className="text-muted-foreground text-sm mb-6">Use your account to access assessments and recommendations.</p>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="login-email">Email</Label>
            <Input id="login-email" type="email" {...form.register("email")} autoComplete="email" />
            {form.formState.errors.email && (
              <p className="text-sm text-destructive">{form.formState.errors.email.message}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="login-password">Password</Label>
            <Input id="login-password" type="password" {...form.register("password")} autoComplete="current-password" />
            {form.formState.errors.password && (
              <p className="text-sm text-destructive">{form.formState.errors.password.message}</p>
            )}
          </div>
          <Button type="submit" className="w-full" disabled={loginMutation.isPending}>
            {loginMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Sign in
          </Button>
        </form>
        <p className="text-center text-sm text-muted-foreground mt-6">
          No account?{" "}
          <Link href="/signup" className="font-semibold text-primary hover:underline">
            Create one
          </Link>
        </p>
      </Card>
    </div>
  );
}
