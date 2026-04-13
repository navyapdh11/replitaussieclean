import { useState, useEffect, useMemo, useCallback } from "react";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { SkipToContent } from "@/components/layout/SkipToContent";
import { useListBookings } from "@/lib/api-client";
import { formatCurrency, cn } from "@/lib/utils";
import { useAdminMenu, type Role, type Permission } from "@/hooks/use-admin-menu";
import { RefreshCw, ClipboardList, Users, Calendar, TrendingUp, BarChart3, Truck, Brain, UserCheck, ShieldCheck, MapPin, Search, Activity, ChevronRight, Layers } from "lucide-react";
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

const TAB_PERMISSIONS: Record<AdminTab, Permission> = {
  bookings: "bookings:read",
  dispatch: "dispatch:read",
  pricing: "pricing:read",
  staff: "staff:read",
  scheduling: "scheduling:read",
  ml: "ml:read",
  suburbs: "suburbs:read",
  seo: "seo:read",
  observability: "observability:read",
  system: "system:read",
};

const TAB_ICONS: Record<AdminTab, typeof ClipboardList> = {
  bookings: ClipboardList,
  dispatch: Truck,
  pricing: BarChart3,
  staff: Users,
  scheduling: UserCheck,
  ml: Brain,
  suburbs: MapPin,
  seo: Search,
  observability: Activity,
  system: ShieldCheck,
};

function getHashTab(): AdminTab {
  const hash = window.location.hash.replace("#", "") as AdminTab;
  return VALID_TABS.includes(hash) ? hash : "bookings";
}

export default function AdminDashboard() {
  const currentRole: Role = "manager";
  const { canAccess, getGroupItemCount } = useAdminMenu(currentRole);
  const [tab, setTab] = useState<AdminTab>(getHashTab);
  const [searchEmail, setSearchEmail]   = useState("");
  const [appliedEmail, setAppliedEmail] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set(["operations"]));

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

  const { data: bookings, isLoading, isError, refetch } = useListBookings(
    appliedEmail ? { email: appliedEmail } : {},
  );

  const list = useMemo(() => {
    if (!bookings || !Array.isArray(bookings)) return [];
    return bookings;
  }, [bookings]);

  const filtered = useMemo(
    () => list.filter((b) => statusFilter === "all" || b.status === statusFilter),
    [list, statusFilter],
  );

  const stats = useMemo(
    () => ({
      total:     list.length,
      confirmed: list.filter((b) => b.status === "confirmed").length,
      pending:   list.filter((b) => b.status === "pending").length,
      revenue:   list.reduce((s, b) => s + (b.quoteAmountCents ?? 0) + (b.gstAmountCents ?? 0), 0),
    }),
    [list],
  );

  // Tab definitions — hoisted to constant to avoid runtime TABS reference error
  const TABS = [
    { id: "bookings" as const, label: "Bookings" },
    { id: "dispatch" as const, label: "Dispatch" },
    { id: "scheduling" as const, label: "Scheduling" },
    { id: "pricing" as const, label: "Pricing" },
    { id: "suburbs" as const, label: "Suburbs" },
    { id: "seo" as const, label: "SEO Rankings" },
    { id: "staff" as const, label: "Staff" },
    { id: "ml" as const, label: "ML Forecast" },
    { id: "observability" as const, label: "Observability" },
    { id: "system" as const, label: "Admin Only" },
  ];

  const MENU_GROUPS = useMemo(() => [
    {
      id: "operations",
      label: "Operations",
      icon: Layers,
      items: [
        { id: "bookings", label: "Bookings", permission: "bookings:read" as Permission },
        { id: "dispatch", label: "Dispatch", permission: "dispatch:read" as Permission },
        { id: "scheduling", label: "Scheduling", permission: "scheduling:read" as Permission },
      ],
    },
    {
      id: "analytics",
      label: "Analytics",
      icon: BarChart3,
      items: [
        { id: "pricing", label: "Pricing", permission: "pricing:read" as Permission },
        { id: "suburbs", label: "Suburbs", permission: "suburbs:read" as Permission },
        { id: "seo", label: "SEO Rankings", permission: "seo:read" as Permission },
      ],
    },
    {
      id: "management",
      label: "Management",
      icon: Users,
      items: [
        { id: "staff", label: "Staff", permission: "staff:read" as Permission },
        { id: "ml", label: "ML Forecast", permission: "ml:read" as Permission },
      ],
    },
    {
      id: "system",
      label: "System",
      icon: ShieldCheck,
      items: [
        { id: "observability", label: "Observability", permission: "observability:read" as Permission },
        { id: "system", label: "Admin Only", permission: "system:read" as Permission },
      ],
    },
  ], []); // eslint-disable-line react-hooks/exhaustive-deps — static config

  const toggleGroup = (groupId: string) => {
    setExpandedGroups(prev => {
      const next = new Set(prev);
      if (next.has(groupId)) next.delete(groupId);
      else next.add(groupId);
      return next;
    });
  };

  const getItemCount = (groupId: string): number => {
    return getGroupItemCount(groupId);
  };

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

        {/* DFS-driven permission-filtered navigation */}
        <div className="space-y-2">
          {MENU_GROUPS.map(group => {
            const accessibleItems = group.items.filter(item => canAccess(item.permission));
            if (accessibleItems.length === 0) return null;
            
            const isExpanded = expandedGroups.has(group.id);
            const Icon = group.icon;
            
            return (
              <div key={group.id} className="border border-border rounded-xl overflow-hidden">
                <button
                  onClick={() => toggleGroup(group.id)}
                  className="w-full flex items-center justify-between px-4 py-3 bg-card hover:bg-secondary/50 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <Icon className="w-5 h-5 text-primary" />
                    <span className="font-semibold">{group.label}</span>
                    <span className="text-xs text-muted-foreground">({getItemCount(group.id)})</span>
                  </div>
                  <ChevronRight className={cn("w-4 h-4 transition-transform", isExpanded && "rotate-90")} />
                </button>
                
                {isExpanded && (
                  <div className="border-t border-border">
                    <div role="tablist" aria-label={group.label} className="flex gap-0.5 p-2 overflow-x-auto">
                      {accessibleItems.map(item => {
                        const TabIcon = TAB_ICONS[item.id as AdminTab];
                        return (
                          <button
                            key={item.id}
                            role="tab"
                            aria-selected={tab === item.id}
                            aria-controls={`tabpanel-${item.id}`}
                            onClick={() => switchTab(item.id as AdminTab)}
                            className={cn(
                              "flex items-center gap-2 px-4 py-2.5 text-sm font-semibold border-b-2 rounded-lg transition-colors -mb-px whitespace-nowrap",
                              tab === item.id
                                ? "border-primary bg-primary/10 text-primary"
                                : "border-transparent text-muted-foreground hover:text-foreground hover:bg-secondary/50",
                            )}
                          >
                            <TabIcon className="w-4 h-4" /> {item.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
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
