import { useState, useEffect } from "react";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { SkipToContent } from "@/components/layout/SkipToContent";
import { useListBookings } from "@workspace/api-client-react";
import { formatCurrency, cn } from "@/lib/utils";
import { RefreshCw, ClipboardList, Users, Calendar, TrendingUp, BarChart3, Truck, Brain, UserCheck, ShieldCheck, MapPin, Search, Activity } from "lucide-react";
import { BookingsTab } from "@/components/admin/BookingsTab";
import { DispatchPanel } from "@/components/admin/DispatchPanel";
import { PricingAnalyticsTab } from "@/components/admin/PricingAnalyticsTab";
import { StaffTab } from "@/components/admin/StaffTab";
import { SchedulingTab } from "@/components/admin/SchedulingTab";
import { MLForecastTab } from "@/components/admin/MLForecastTab";
import { AdminOnlyTab } from "@/components/admin/AdminOnlyTab";
import { SuburbPerformanceTab } from "@/components/admin/SuburbPerformanceTab";
import { SeoRankingTab } from "@/components/admin/SeoRankingTab";
import { ObservabilityTab } from "@/components/admin/ObservabilityTab";

type AdminTab = "bookings" | "dispatch" | "pricing" | "staff" | "scheduling" | "ml" | "system" | "suburbs" | "seo" | "observability";

const VALID_TABS: AdminTab[] = ["bookings", "dispatch", "pricing", "staff", "scheduling", "ml", "system", "suburbs", "seo", "observability"];

function getHashTab(): AdminTab {
  const hash = window.location.hash.replace("#", "") as AdminTab;
  return VALID_TABS.includes(hash) ? hash : "bookings";
}

export default function AdminDashboard() {
  const [tab, setTab] = useState<AdminTab>(getHashTab);
  const [searchEmail, setSearchEmail]   = useState("");
  const [appliedEmail, setAppliedEmail] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  // Sync URL hash when tab changes
  const switchTab = (id: AdminTab) => {
    setTab(id);
    window.location.hash = id;
  };

  // Handle browser back/forward
  useEffect(() => {
    const onHashChange = () => setTab(getHashTab());
    window.addEventListener("hashchange", onHashChange);
    return () => window.removeEventListener("hashchange", onHashChange);
  }, []);

  const { data: rawBookings, isLoading, isError, refetch } = useListBookings(
    appliedEmail ? { email: appliedEmail } : {},
    { query: { retry: false } as never },
  );

  const list = Array.isArray(rawBookings) ? rawBookings : [];
  const filtered = list.filter((b) => statusFilter === "all" || b.status === statusFilter);

  const stats = {
    total:     list.length,
    confirmed: list.filter((b) => b.status === "confirmed").length,
    pending:   list.filter((b) => b.status === "pending").length,
    revenue:   list.reduce((s, b) => s + (b.quoteAmountCents ?? 0) + (b.gstAmountCents ?? 0), 0),
  };

  const TABS = [
    { id: "bookings"    as const, label: "Bookings",    icon: ClipboardList },
    { id: "dispatch"    as const, label: "Dispatch",    icon: Truck         },
    { id: "pricing"     as const, label: "Pricing",     icon: BarChart3     },
    { id: "staff"       as const, label: "Staff",       icon: Users         },
    { id: "scheduling"  as const, label: "Scheduling",  icon: UserCheck     },
    { id: "ml"          as const, label: "ML Forecast", icon: Brain         },
    { id: "suburbs"     as const, label: "Suburbs",     icon: MapPin        },
    { id: "seo"         as const, label: "SEO Rankings",icon: Search        },
    { id: "observability" as const, label: "Observability", icon: Activity  },
    { id: "system"      as const, label: "Admin Only",  icon: ShieldCheck   },
  ];

  return (
    <div className="min-h-screen flex flex-col pt-20">
      <SkipToContent />
      <Navbar />

      <main id="main-content" tabIndex={-1} className="flex-1 py-10 px-4 sm:px-6 max-w-7xl mx-auto w-full space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-extrabold text-foreground">Admin Dashboard</h1>
            <p className="text-muted-foreground mt-1">Manage bookings, staff, pricing, and ML forecasts.</p>
          </div>
          <div className="flex items-center gap-3">
            <a
              href="/saas-admin"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold border border-purple-500/40 text-purple-400 hover:bg-purple-500/10 transition-colors"
            >
              SaaS Admin
            </a>
            <button
              onClick={() => refetch()}
              aria-label="Refresh bookings"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold border border-border hover:border-primary/50 transition-colors"
            >
              <RefreshCw className="w-4 h-4" /> Refresh
            </button>
          </div>
        </div>

        {/* Stat cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: "Total Bookings", value: stats.total,                   icon: ClipboardList, color: "text-cyan-400"   },
            { label: "Confirmed",      value: stats.confirmed,               icon: Users,         color: "text-green-400"  },
            { label: "Pending",        value: stats.pending,                 icon: Calendar,      color: "text-yellow-400" },
            { label: "Total Revenue",  value: formatCurrency(stats.revenue), icon: TrendingUp,    color: "text-blue-400"   },
          ].map(({ label, value, icon: Icon, color }) => (
            <div key={label} className="bg-card border border-border rounded-2xl p-5">
              <div className={`flex items-center gap-2 ${color} mb-2`}>
                <Icon className="w-5 h-5" />
                <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{label}</span>
              </div>
              <p className="text-2xl font-extrabold text-foreground">{value}</p>
            </div>
          ))}
        </div>

        {/* Tab navigation */}
        <div role="tablist" aria-label="Admin sections" className="flex gap-0.5 border-b border-border overflow-x-auto">
          {TABS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              role="tab"
              aria-selected={tab === id}
              aria-controls={`tabpanel-${id}`}
              onClick={() => switchTab(id)}
              className={cn(
                "flex items-center gap-2 px-4 py-3 text-sm font-semibold border-b-2 transition-colors -mb-px whitespace-nowrap",
                tab === id
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground",
              )}
            >
              <Icon className="w-4 h-4" /> {label}
            </button>
          ))}
        </div>

        {/* Tab bodies */}
        <div role="tabpanel" id={`tabpanel-${tab}`} aria-label={TABS.find(t => t.id === tab)?.label}>
          {tab === "bookings" && (
            <BookingsTab
              searchEmail={searchEmail}   setSearchEmail={setSearchEmail}
              appliedEmail={appliedEmail} setAppliedEmail={setAppliedEmail}
              statusFilter={statusFilter} setStatusFilter={setStatusFilter}
              filtered={filtered} stats={stats}
              isLoading={isLoading} isError={isError}
              bookings={list}
              onRefresh={refetch}
            />
          )}
          {tab === "dispatch"   && <DispatchPanel bookings={list} onRefresh={refetch} />}
          {tab === "pricing"    && <PricingAnalyticsTab />}
          {tab === "staff"      && <StaffTab />}
          {tab === "scheduling" && <SchedulingTab />}
          {tab === "ml"         && <MLForecastTab />}
          {tab === "suburbs"    && <SuburbPerformanceTab />}
          {tab === "seo"        && <SeoRankingTab />}
          {tab === "observability" && <ObservabilityTab />}
          {tab === "system"     && <AdminOnlyTab />}
        </div>
      </main>

      <Footer />
    </div>
  );
}
