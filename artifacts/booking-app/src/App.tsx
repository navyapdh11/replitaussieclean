import { useEffect } from "react";
import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { AIChatWidget } from "@/components/AIChatWidget";
import { initAnalytics } from "@/lib/analytics";

import Home from "@/pages/home";
import BookingFlow from "@/pages/booking/index";
import Dashboard from "@/pages/dashboard";
import Admin from "@/pages/admin";
import SaasAdmin from "@/pages/saas-admin";
import Success from "@/pages/success";
import Cancelled from "@/pages/cancelled";
import NotFound from "@/pages/not-found";
import { BookingDetailPage } from "@/pages/booking-detail";
import SuburbPage from "@/pages/suburb";
import SuburbSeasonPage from "@/pages/suburb-season";
import SitemapPage from "@/pages/sitemap-page";
import PrivacyPolicy from "@/pages/privacy";
import TermsAndConditions from "@/pages/terms";
import AccessibilityStatement from "@/pages/accessibility";
import RefundPolicy from "@/pages/refund-policy";

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
      <Route component={NotFound} />
    </Switch>
  );
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
            <AIChatWidget />
          </WouterRouter>
          <Toaster />
        </TooltipProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

export default App;
