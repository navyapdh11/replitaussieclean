import { useEffect, lazy, Suspense } from "react";
import { Switch, Route, Router as WouterRouter, useLocation } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { AIChatWidget } from "@/components/AIChatWidget";
import { initAnalytics } from "@/lib/analytics";

// Code-split heavy admin/dashboard pages — loaded on demand
const Home = lazy(() => import("@/pages/home"));
const BookingFlow = lazy(() => import("@/pages/booking/index"));
const Dashboard = lazy(() => import("@/pages/dashboard"));
const Admin = lazy(() => import("@/pages/admin"));
const SaasAdmin = lazy(() => import("@/pages/saas-admin"));
const Success = lazy(() => import("@/pages/success"));
const Cancelled = lazy(() => import("@/pages/cancelled"));
const NotFound = lazy(() => import("@/pages/not-found"));
const BookingDetailPage = lazy(() => import("@/pages/booking-detail"));
const SuburbPage = lazy(() => import("@/pages/suburb"));
const SuburbSeasonPage = lazy(() => import("@/pages/suburb-season"));
const SitemapPage = lazy(() => import("@/pages/sitemap-page"));
const PrivacyPolicy = lazy(() => import("@/pages/privacy"));
const TermsAndConditions = lazy(() => import("@/pages/terms"));
const AccessibilityStatement = lazy(() => import("@/pages/accessibility"));
const RefundPolicy = lazy(() => import("@/pages/refund-policy"));
const ReferralPage = lazy(() => import("@/pages/referral"));
const StaffDashboard = lazy(() => import("@/pages/staff"));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

function Router() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="w-10 h-10 border-4 border-primary/30 border-t-primary rounded-full animate-spin mx-auto" />
          <p className="text-muted-foreground mt-3 text-sm">Loading...</p>
        </div>
      </div>
    }>
      <Switch>
      <Route path="/" component={Home} />
      <Route path="/booking" component={BookingFlow} />
      <Route path="/dashboard" component={Dashboard} />
      <Route path="/admin" component={Admin} />
      <Route path="/saas-admin" component={SaasAdmin} />
      <Route path="/booking/success" component={Success} />
      <Route path="/booking/cancelled" component={Cancelled} />
      <Route path="/bookings/:id" component={BookingDetailPage} />
      <Route path="/suburb/:slug/:season" component={SuburbSeasonPage} />
      <Route path="/suburb/:slug" component={SuburbPage} />
      <Route path="/sitemap" component={SitemapPage} />
      <Route path="/privacy" component={PrivacyPolicy} />
      <Route path="/terms" component={TermsAndConditions} />
      <Route path="/accessibility" component={AccessibilityStatement} />
      <Route path="/refund-policy" component={RefundPolicy} />
      <Route path="/referral" component={ReferralPage} />
      <Route path="/staff" component={StaffDashboard} />
      <Route component={NotFound} />
    </Switch>
    </Suspense>
  );
}

const CHAT_EXCLUDED_PATHS = ["/staff"];

function ConditionalChatWidget() {
  const [location] = useLocation();
  const hide = CHAT_EXCLUDED_PATHS.some((p) => location === p || location.startsWith(p + "/"));
  if (hide) return null;
  return <AIChatWidget />;
}

function App() {
  useEffect(() => {
    initAnalytics();
  }, []);

  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
            <Router />
            <ConditionalChatWidget />
          </WouterRouter>
          <Toaster />
        </TooltipProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

export default App;
