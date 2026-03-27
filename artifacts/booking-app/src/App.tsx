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
import Success from "@/pages/success";
import Cancelled from "@/pages/cancelled";
import NotFound from "@/pages/not-found";
import { BookingDetailPage } from "@/pages/booking-detail";

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
      <Route path="/booking/success" component={Success} />
      <Route path="/booking/cancelled" component={Cancelled} />
      <Route path="/bookings/:id" component={BookingDetailPage} />
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
