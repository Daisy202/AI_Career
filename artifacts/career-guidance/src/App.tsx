import { Switch, Route, Router as WouterRouter, useLocation } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Layout } from "@/components/layout";
import { useEffect } from "react";
import { useCareerStore } from "@/store/use-career-store";
import { getCurrentUser } from "@workspace/api-client-react";
import { SessionActivity } from "@/components/session-activity";

// Pages
import LandingPage from "@/pages/landing";
import LoginPage from "@/pages/login";
import SignupPage from "@/pages/signup";
import AssessmentPage from "@/pages/assessment";
import RecommendationsPage from "@/pages/recommendations";
import CareerDetailPage from "@/pages/career-detail";
import DashboardPage from "@/pages/dashboard";
import ChatPage from "@/pages/chat";
import FeedbackPage from "@/pages/feedback";
import AdminPage from "@/pages/admin";
import NotFound from "@/pages/not-found";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
      refetchOnWindowFocus: false,
    },
  },
});

function pathOnly(loc: string): string {
  const i = loc.indexOf("?");
  return i === -1 ? loc : loc.slice(0, i);
}

const PUBLIC_PATHS = new Set(["/", "/login", "/signup"]);

function Router() {
  const setUser = useCareerStore((s) => s.setUser);
  const setProfile = useCareerStore((s) => s.setProfile);
  const clearProfile = useCareerStore((s) => s.clearProfile);
  const setAuthHydrated = useCareerStore((s) => s.setAuthHydrated);
  const user = useCareerStore((s) => s.user);
  const authHydrated = useCareerStore((s) => s.authHydrated);
  const [location, setLocation] = useLocation();

  useEffect(() => {
    getCurrentUser()
      .then((u) => setUser(u))
      .catch(() => {
        setUser(null);
        clearProfile();
      })
      .finally(() => setAuthHydrated(true));
  }, [setUser, clearProfile, setAuthHydrated]);

  useEffect(() => {
    if (!user) return;
    fetch("/api/profile", { credentials: "include" })
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data && typeof data === "object" && "interests" in data) setProfile(data);
      })
      .catch(() => {});
  }, [user, setProfile]);

  useEffect(() => {
    if (!authHydrated) return;
    const path = pathOnly(location);
    if (user && (path === "/login" || path === "/signup")) {
      const params = new URLSearchParams(window.location.search);
      const redirect = params.get("redirect") || "/assessment";
      const safe = redirect.startsWith("/") && !redirect.startsWith("//") ? redirect : "/assessment";
      setLocation(safe);
    }
  }, [authHydrated, user, location, setLocation]);

  useEffect(() => {
    if (!authHydrated) return;
    if (user) return;
    const path = pathOnly(location);
    if (PUBLIC_PATHS.has(path)) return;
    const search = location.includes("?") ? location.slice(location.indexOf("?")) : "";
    setLocation(`/login?redirect=${encodeURIComponent(path + search)}`);
  }, [authHydrated, user, location, setLocation]);

  if (!authHydrated) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background gap-3">
        <div className="h-9 w-9 rounded-full border-2 border-primary border-t-transparent animate-spin" />
        <p className="text-sm text-muted-foreground">Loading…</p>
      </div>
    );
  }

  const path = pathOnly(location);
  if (!user && !PUBLIC_PATHS.has(path)) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background gap-3">
        <div className="h-9 w-9 rounded-full border-2 border-primary border-t-transparent animate-spin" />
        <p className="text-sm text-muted-foreground">Redirecting to sign in…</p>
      </div>
    );
  }

  return (
    <>
      <Layout>
        <Switch>
          <Route path="/" component={LandingPage} />
          <Route path="/login" component={LoginPage} />
          <Route path="/signup" component={SignupPage} />
          <Route path="/assessment" component={AssessmentPage} />
          <Route path="/recommendations" component={RecommendationsPage} />
          <Route path="/career/:id" component={CareerDetailPage} />
          <Route path="/dashboard" component={DashboardPage} />
          <Route path="/chat" component={ChatPage} />
          <Route path="/feedback" component={FeedbackPage} />
          <Route path="/admin" component={AdminPage} />
          <Route component={NotFound} />
        </Switch>
      </Layout>
      {user ? <SessionActivity /> : null}
    </>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
          <Router />
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
