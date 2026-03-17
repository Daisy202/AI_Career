import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Layout } from "@/components/layout";
import { useEffect } from "react";
import { useCareerStore } from "@/store/use-career-store";
import { getCurrentUser } from "@workspace/api-client-react";

// Pages
import LandingPage from "@/pages/landing";
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

function Router() {
  const setUser = useCareerStore((state) => state.setUser);

  useEffect(() => {
    // Restore session on app load
    getCurrentUser()
      .then((user) => setUser(user))
      .catch(() => setUser(null));
  }, [setUser]);

  return (
    <Layout>
      <Switch>
        <Route path="/" component={LandingPage} />
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
