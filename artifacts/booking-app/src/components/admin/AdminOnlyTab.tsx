import { useState, useEffect, useCallback } from "react";
import {
  ShieldCheck, RefreshCw, Database, Cpu, Clock, Trash2,
  Save, CheckCircle2, AlertCircle, Loader2, Server,
  BookOpen, Users, Calendar, Brain, TrendingDown, Settings,
} from "lucide-react";
import { BASE_URL } from "./shared";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

const TENANT_ID = "aussieclean-default";

interface SystemStats {
  status: "healthy" | "error";
  dbLatencyMs: number;
  counts: {
    bookings: number;
    staff: number;
    assignments: number;
    mlModels: number;
    forecasts: number;
  };
  bookingsByStatus: Record<string, number>;
  cache: { pricingEntries: number; adminFactorEntries: number };
  nodeEnv: string;
  nodeVersion: string;
  uptime: number;
  error?: string;
}

interface TenantConfig {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  abn: string | null;
  primaryColor: string;
  secondaryColor: string;
  domain: string | null;
  logo: string | null;
  plan: string;
  slug: string;
}

function formatUptime(s: number): string {
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  if (h > 0) return `${h}h ${m}m ${sec}s`;
  if (m > 0) return `${m}m ${sec}s`;
  return `${sec}s`;
}

const STATUS_COLORS: Record<string, string> = {
  confirmed:   "bg-emerald-500/20 text-emerald-400",
  pending:     "bg-yellow-500/20 text-yellow-400",
  in_progress: "bg-blue-500/20 text-blue-400",
  completed:   "bg-slate-600 text-slate-400",
  cancelled:   "bg-red-500/20 text-red-400",
  draft:       "bg-slate-700 text-slate-500",
};

export function AdminOnlyTab() {
  const { toast } = useToast();
  const [stats, setStats]           = useState<SystemStats | null>(null);
  const [loadingStats, setLoadingStats] = useState(true);
  const [tenant, setTenant]         = useState<TenantConfig | null>(null);
  const [form, setForm]             = useState<Partial<TenantConfig>>({});
  const [savingConfig, setSavingConfig] = useState(false);
  const [clearingCache, setClearingCache] = useState(false);

  const fetchStats = useCallback(async () => {
    setLoadingStats(true);
    try {
      const res = await fetch(`${BASE_URL}/api/admin/system/stats?tenantId=${TENANT_ID}`);
      const data = await res.json();
      setStats(data);
    } catch {
      setStats({ status: "error", error: "Could not reach API server" } as SystemStats);
    } finally {
      setLoadingStats(false);
    }
  }, []);

  const fetchTenant = useCallback(async () => {
    try {
      const res = await fetch(`${BASE_URL}/api/admin/system/tenant?tenantId=${TENANT_ID}`);
      if (res.ok) {
        const data = await res.json();
        setTenant(data);
        setForm({
          name:           data.name,
          email:          data.email ?? "",
          phone:          data.phone ?? "",
          abn:            data.abn ?? "",
          primaryColor:   data.primaryColor,
          secondaryColor: data.secondaryColor,
          domain:         data.domain ?? "",
          logo:           data.logo ?? "",
        });
      }
    } catch { /* non-critical */ }
  }, []);

  useEffect(() => {
    fetchStats();
    fetchTenant();
  }, [fetchStats, fetchTenant]);

  const saveConfig = async () => {
    setSavingConfig(true);
    try {
      const body: Record<string, string | undefined> = {};
      if (form.name)           body.name           = form.name;
      if (form.email)          body.email          = form.email;
      if (form.phone)          body.phone          = form.phone;
      if (form.abn !== undefined) body.abn         = form.abn;
      if (form.primaryColor)   body.primaryColor   = form.primaryColor;
      if (form.secondaryColor) body.secondaryColor = form.secondaryColor;
      if (form.domain !== undefined) body.domain   = form.domain;
      if (form.logo !== undefined)   body.logo     = form.logo;

      const res = await fetch(`${BASE_URL}/api/admin/system/tenant?tenantId=${TENANT_ID}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (res.ok) {
        const updated = await res.json();
        setTenant(updated);
        toast({ title: "Platform settings saved", description: "Configuration updated successfully." });
      } else {
        const err = await res.json().catch(() => ({}));
        toast({ title: "Save failed", description: (err as { error?: string }).error ?? "Unknown error", variant: "destructive" });
      }
    } catch {
      toast({ title: "Network error", variant: "destructive" });
    } finally {
      setSavingConfig(false);
    }
  };

  const clearCache = async () => {
    setClearingCache(true);
    try {
      const res = await fetch(`${BASE_URL}/api/admin/system/cache/clear`, { method: "POST" });
      const data = await res.json();
      if (res.ok) {
        toast({ title: "Cache cleared", description: data.message });
        fetchStats();
      } else {
        toast({ title: "Clear failed", description: (data as { error?: string }).error, variant: "destructive" });
      }
    } catch {
      toast({ title: "Network error", variant: "destructive" });
    } finally {
      setClearingCache(false);
    }
  };

  const STAT_CARDS = [
    { label: "Bookings",    value: stats?.counts.bookings    ?? 0, icon: BookOpen,    color: "text-cyan-400",    bg: "from-cyan-500/10 to-blue-500/10 border-cyan-500/30" },
    { label: "Staff",       value: stats?.counts.staff       ?? 0, icon: Users,       color: "text-emerald-400", bg: "from-emerald-500/10 to-green-500/10 border-emerald-500/30" },
    { label: "Assignments", value: stats?.counts.assignments ?? 0, icon: Calendar,    color: "text-blue-400",    bg: "from-blue-500/10 to-indigo-500/10 border-blue-500/30" },
    { label: "ML Models",   value: stats?.counts.mlModels   ?? 0, icon: Brain,       color: "text-purple-400",  bg: "from-purple-500/10 to-pink-500/10 border-purple-500/30" },
    { label: "Forecasts",   value: stats?.counts.forecasts  ?? 0, icon: TrendingDown, color: "text-amber-400",  bg: "from-amber-500/10 to-orange-500/10 border-amber-500/30" },
  ];

  return (
    <div className="space-y-8">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-primary" /> Admin Control Panel
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            System health, platform configuration, and maintenance controls.
          </p>
        </div>
        <button
          onClick={fetchStats}
          disabled={loadingStats}
          className="flex items-center gap-2 px-4 py-2 rounded-xl border border-border text-sm font-semibold hover:border-primary/40 transition-colors disabled:opacity-50"
        >
          <RefreshCw className={cn("w-4 h-4", loadingStats && "animate-spin")} />
          Refresh Stats
        </button>
      </div>

      {/* System Health */}
      <div className="border border-border bg-card rounded-2xl p-6 space-y-5">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-base flex items-center gap-2">
            <Server className="w-4 h-4 text-muted-foreground" /> System Health
          </h3>
          {stats && (
            <span className={cn(
              "flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full",
              stats.status === "healthy"
                ? "bg-emerald-500/15 text-emerald-400"
                : "bg-red-500/15 text-red-400",
            )}>
              {stats.status === "healthy"
                ? <CheckCircle2 className="w-3.5 h-3.5" />
                : <AlertCircle className="w-3.5 h-3.5" />}
              {stats.status === "healthy" ? "All systems healthy" : "Error detected"}
            </span>
          )}
        </div>

        {loadingStats ? (
          <div className="flex items-center justify-center h-24 text-muted-foreground">
            <Loader2 className="w-5 h-5 animate-spin mr-2" /> Loading…
          </div>
        ) : stats?.status === "error" ? (
          <div className="text-center py-6 text-red-400">
            <AlertCircle className="w-8 h-8 mx-auto mb-2 opacity-60" />
            <p className="text-sm">{stats.error}</p>
          </div>
        ) : stats && (
          <>
            {/* Server info row */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
              {[
                { icon: Database,  label: "DB Latency",    value: `${stats.dbLatencyMs} ms`,           color: stats.dbLatencyMs < 100 ? "text-emerald-400" : "text-orange-400" },
                { icon: Clock,     label: "API Uptime",    value: formatUptime(stats.uptime),           color: "text-cyan-400" },
                { icon: Cpu,       label: "Node",          value: stats.nodeVersion,                    color: "text-blue-400" },
                { icon: ShieldCheck, label: "Environment", value: stats.nodeEnv,                        color: stats.nodeEnv === "production" ? "text-emerald-400" : "text-yellow-400" },
              ].map(({ icon: Icon, label, value, color }) => (
                <div key={label} className="bg-muted/30 rounded-xl p-3">
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1">
                    <Icon className="w-3.5 h-3.5" /> {label}
                  </div>
                  <p className={cn("font-mono font-bold text-sm", color)}>{value}</p>
                </div>
              ))}
            </div>

            {/* Cache info */}
            <div className="flex items-center gap-4 text-xs text-muted-foreground pt-1">
              <span>Pricing cache: <span className="text-foreground font-semibold">{stats.cache.pricingEntries}</span> entries</span>
              <span>Factor cache: <span className="text-foreground font-semibold">{stats.cache.adminFactorEntries}</span> entries</span>
            </div>
          </>
        )}
      </div>

      {/* DB Record Counts */}
      <div>
        <h3 className="font-bold text-base mb-4">Database Overview</h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {STAT_CARDS.map(({ label, value, icon: Icon, color, bg }) => (
            <div key={label} className={cn("bg-gradient-to-br border rounded-2xl p-4", bg)}>
              <div className={cn("flex items-center gap-1.5 mb-1.5", color)}>
                <Icon className="w-4 h-4" />
                <span className="text-xs text-muted-foreground font-semibold">{label}</span>
              </div>
              <p className={cn("text-2xl font-extrabold", color)}>{value.toLocaleString()}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Booking status breakdown */}
      {stats?.bookingsByStatus && Object.keys(stats.bookingsByStatus).length > 0 && (
        <div className="border border-border bg-card rounded-2xl p-5">
          <h3 className="font-bold text-sm mb-4">Bookings by Status</h3>
          <div className="flex flex-wrap gap-2">
            {Object.entries(stats.bookingsByStatus)
              .sort(([, a], [, b]) => b - a)
              .map(([status, cnt]) => (
                <span key={status} className={cn(
                  "flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold",
                  STATUS_COLORS[status] ?? "bg-muted text-muted-foreground",
                )}>
                  {status.replace(/_/g, " ")}
                  <span className="font-mono font-bold">{cnt}</span>
                </span>
              ))}
          </div>
        </div>
      )}

      {/* Platform Configuration */}
      <div className="border border-border bg-card rounded-2xl p-6 space-y-5">
        <h3 className="font-bold text-base flex items-center gap-2">
          <Settings className="w-4 h-4 text-muted-foreground" /> Platform Configuration
          {tenant && (
            <span className="ml-auto text-xs text-muted-foreground font-normal font-mono">
              {tenant.slug} · {tenant.plan}
            </span>
          )}
        </h3>

        {!tenant ? (
          <div className="flex items-center justify-center h-24 text-muted-foreground">
            <Loader2 className="w-5 h-5 animate-spin mr-2" /> Loading…
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold mb-1 text-muted-foreground">Business Name</label>
              <input
                value={form.name ?? ""}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
                placeholder="AussieClean"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1 text-muted-foreground">ABN</label>
              <input
                value={form.abn ?? ""}
                onChange={(e) => setForm((f) => ({ ...f, abn: e.target.value }))}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
                placeholder="98 765 432 109"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1 text-muted-foreground">Contact Email</label>
              <input
                type="email"
                value={form.email ?? ""}
                onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
                placeholder="hello@aussieclean.com.au"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1 text-muted-foreground">Contact Phone</label>
              <input
                value={form.phone ?? ""}
                onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
                placeholder="1300 XXX XXX"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1 text-muted-foreground">Custom Domain (optional)</label>
              <input
                value={form.domain ?? ""}
                onChange={(e) => setForm((f) => ({ ...f, domain: e.target.value }))}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
                placeholder="book.aussieclean.com.au"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1 text-muted-foreground">Logo URL (optional)</label>
              <input
                value={form.logo ?? ""}
                onChange={(e) => setForm((f) => ({ ...f, logo: e.target.value }))}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
                placeholder="https://cdn.example.com/logo.png"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1 text-muted-foreground">Primary Colour</label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={form.primaryColor ?? "#22d3ee"}
                  onChange={(e) => setForm((f) => ({ ...f, primaryColor: e.target.value }))}
                  className="w-10 h-9 rounded border border-border bg-background cursor-pointer"
                />
                <input
                  value={form.primaryColor ?? ""}
                  onChange={(e) => setForm((f) => ({ ...f, primaryColor: e.target.value }))}
                  className="flex-1 rounded-lg border border-border bg-background px-3 py-2 text-sm font-mono"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1 text-muted-foreground">Secondary Colour</label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={form.secondaryColor ?? "#0f172a"}
                  onChange={(e) => setForm((f) => ({ ...f, secondaryColor: e.target.value }))}
                  className="w-10 h-9 rounded border border-border bg-background cursor-pointer"
                />
                <input
                  value={form.secondaryColor ?? ""}
                  onChange={(e) => setForm((f) => ({ ...f, secondaryColor: e.target.value }))}
                  className="flex-1 rounded-lg border border-border bg-background px-3 py-2 text-sm font-mono"
                />
              </div>
            </div>
          </div>
        )}

        {tenant && (
          <div className="flex justify-end pt-2">
            <button
              onClick={saveConfig}
              disabled={savingConfig}
              className="flex items-center gap-2 px-5 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 disabled:opacity-50 transition-colors"
            >
              {savingConfig ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              {savingConfig ? "Saving…" : "Save Configuration"}
            </button>
          </div>
        )}
      </div>

      {/* Danger Zone */}
      <div className="border border-red-500/30 bg-red-500/5 rounded-2xl p-6 space-y-4">
        <h3 className="font-bold text-base text-red-400 flex items-center gap-2">
          <AlertCircle className="w-4 h-4" /> Maintenance Actions
        </h3>
        <p className="text-sm text-muted-foreground">
          These actions affect live system behaviour. Use with care.
        </p>
        <div className="flex flex-wrap gap-3">
          <button
            onClick={clearCache}
            disabled={clearingCache}
            className="flex items-center gap-2 px-4 py-2 rounded-xl border border-red-500/40 text-red-400 text-sm font-semibold hover:bg-red-500/10 disabled:opacity-50 transition-colors"
          >
            {clearingCache ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
            {clearingCache ? "Clearing…" : "Clear Pricing Cache"}
          </button>
        </div>
        <p className="text-xs text-muted-foreground">
          Clearing the pricing cache forces the next quote request to re-compute all multipliers from the database instead of memory. Useful after updating admin pricing factors.
        </p>
      </div>
    </div>
  );
}
