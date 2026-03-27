import { useState, useEffect } from "react";
import { Link } from "wouter";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { useListBookings } from "@workspace/api-client-react";
import { formatCurrency, cn } from "@/lib/utils";
import { format, parseISO } from "date-fns";
import {
  Search, MapPin, Calendar, CircleDollarSign, RefreshCw, Users,
  TrendingUp, ClipboardList, BarChart3, Zap, Plus, Trash2, ToggleLeft, ToggleRight,
  ExternalLink, AlertCircle, ChevronUp, ChevronDown,
} from "lucide-react";

const BASE_URL = (import.meta.env.BASE_URL ?? "/booking-app").replace(/\/$/, "");
const STATUS_ORDER = ["confirmed", "pending", "in_progress", "completed", "cancelled", "draft"];

type AdminTab = "bookings" | "pricing";

export default function AdminDashboard() {
  const [tab, setTab] = useState<AdminTab>("bookings");
  const [searchEmail, setSearchEmail] = useState("");
  const [appliedEmail, setAppliedEmail] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const { data: bookings, isLoading, isError, refetch } = useListBookings(
    appliedEmail ? { email: appliedEmail } : {},
    { query: { retry: false } as any }
  );

  const filtered = (bookings as any[])?.filter(
    (b) => statusFilter === "all" || b.status === statusFilter
  ) ?? [];

  const stats = {
    total: (bookings as any[])?.length ?? 0,
    confirmed: (bookings as any[])?.filter((b) => b.status === "confirmed").length ?? 0,
    pending: (bookings as any[])?.filter((b) => b.status === "pending").length ?? 0,
    revenue: (bookings as any[])?.reduce((s, b) => s + (b.quoteAmountCents ?? 0) + (b.gstAmountCents ?? 0), 0) ?? 0,
  };

  return (
    <div className="min-h-screen flex flex-col pt-20">
      <Navbar />

      <main className="flex-1 py-10 px-4 sm:px-6 max-w-7xl mx-auto w-full space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-extrabold text-foreground">Admin Dashboard</h1>
            <p className="text-muted-foreground mt-1">Manage bookings, pricing, and operations.</p>
          </div>
          <button
            onClick={() => refetch()}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold border border-border hover:border-primary/50 transition-colors"
          >
            <RefreshCw className="w-4 h-4" /> Refresh
          </button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: "Total Bookings", value: stats.total, icon: ClipboardList, color: "text-cyan-400" },
            { label: "Confirmed", value: stats.confirmed, icon: Users, color: "text-green-400" },
            { label: "Pending", value: stats.pending, icon: Calendar, color: "text-yellow-400" },
            { label: "Total Revenue", value: formatCurrency(stats.revenue), icon: TrendingUp, color: "text-blue-400" },
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

        <div className="flex gap-1 border-b border-border">
          {([
            { id: "bookings" as const, label: "Bookings", icon: ClipboardList },
            { id: "pricing" as const, label: "Pricing Analytics", icon: BarChart3 },
          ] as const).map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setTab(id)}
              className={cn(
                "flex items-center gap-2 px-5 py-3 text-sm font-semibold border-b-2 transition-colors -mb-px",
                tab === id
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              )}
            >
              <Icon className="w-4 h-4" />{label}
            </button>
          ))}
        </div>

        {tab === "bookings" && (
          <BookingsTab
            searchEmail={searchEmail} setSearchEmail={setSearchEmail}
            appliedEmail={appliedEmail} setAppliedEmail={setAppliedEmail}
            statusFilter={statusFilter} setStatusFilter={setStatusFilter}
            filtered={filtered} stats={stats} isLoading={isLoading} isError={isError}
            bookings={bookings as any[]}
          />
        )}
        {tab === "pricing" && <PricingAnalyticsTab />}
      </main>

      <Footer />
    </div>
  );
}

interface BookingsTabProps {
  searchEmail: string; setSearchEmail: (v: string) => void;
  appliedEmail: string; setAppliedEmail: (v: string) => void;
  statusFilter: string; setStatusFilter: (v: string) => void;
  filtered: any[]; stats: any; isLoading: boolean; isError: boolean; bookings: any[];
}

function BookingsTab({ searchEmail, setSearchEmail, appliedEmail, setAppliedEmail, statusFilter, setStatusFilter, filtered, stats, isLoading, isError, bookings }: BookingsTabProps) {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row gap-4">
        <form
          onSubmit={(e) => { e.preventDefault(); setAppliedEmail(searchEmail.trim()); }}
          className="flex flex-1 max-w-md gap-3"
        >
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="email"
              placeholder="Filter by customer email..."
              value={searchEmail}
              onChange={(e) => { setSearchEmail(e.target.value); if (!e.target.value) setAppliedEmail(""); }}
              className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-border bg-background focus:outline-none focus:border-primary text-sm"
            />
          </div>
          <button type="submit" className="px-4 py-2.5 rounded-xl font-semibold bg-primary text-primary-foreground text-sm hover:shadow-lg hover:shadow-primary/20 transition-all">
            Search
          </button>
        </form>
        <div className="flex gap-2 flex-wrap">
          {["all", ...STATUS_ORDER].map((s) => (
            <button key={s} onClick={() => setStatusFilter(s)}
              className={cn("px-3 py-1.5 rounded-xl text-xs font-semibold border transition-colors capitalize",
                statusFilter === s ? "bg-primary text-primary-foreground border-primary" : "border-border text-muted-foreground hover:border-primary/40"
              )}>
              {s}
            </button>
          ))}
        </div>
      </div>

      {isLoading && <div className="flex items-center justify-center py-16"><RefreshCw className="w-6 h-6 text-muted-foreground animate-spin" /></div>}
      {isError && (
        <div className="text-center py-12 bg-red-500/5 border border-red-500/20 rounded-2xl">
          <p className="text-red-400">Failed to load bookings. Try again.</p>
        </div>
      )}

      {!isLoading && bookings && (
        <>
          <p className="text-sm text-muted-foreground">
            Showing {filtered.length} of {stats.total} booking{stats.total !== 1 ? "s" : ""}
          </p>
          {filtered.length === 0 ? (
            <div className="text-center py-16 border border-dashed border-border rounded-2xl">
              <p className="text-muted-foreground">No bookings match the current filter.</p>
            </div>
          ) : (
            <div className="overflow-hidden rounded-2xl border border-border">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-slate-900/60">
                    {["Ref", "Customer", "Service", "Date", "Address", "Amount", "Status", ""].map((h) => (
                      <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {filtered.map((b: any) => (
                    <tr key={b.id} className="hover:bg-slate-900/40 transition-colors">
                      <td className="px-4 py-3 font-mono text-xs text-muted-foreground">#{b.id.slice(-6).toUpperCase()}</td>
                      <td className="px-4 py-3">
                        <p className="font-medium text-foreground">{b.firstName} {b.lastName}</p>
                        <p className="text-xs text-muted-foreground">{b.email}</p>
                      </td>
                      <td className="px-4 py-3 capitalize text-foreground">{b.serviceType.replace(/_/g, " ")}</td>
                      <td className="px-4 py-3 text-muted-foreground">
                        <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5" />{format(parseISO(b.date), "dd MMM yyyy")}</span>
                        <span className="text-xs">{b.timeSlot}</span>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5" />{b.suburb}, {b.state}</span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="flex items-center gap-1 font-semibold text-foreground">
                          <CircleDollarSign className="w-3.5 h-3.5 text-muted-foreground" />
                          {formatCurrency(b.quoteAmountCents + b.gstAmountCents)}
                        </span>
                      </td>
                      <td className="px-4 py-3"><StatusBadge status={b.status} /></td>
                      <td className="px-4 py-3">
                        <Link to={`/bookings/${b.id}`} className="inline-flex items-center gap-1 text-xs text-cyan-400 hover:text-cyan-300 transition-colors">
                          View <ExternalLink className="w-3 h-3" />
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </div>
  );
}

interface PricingFactor {
  id: string;
  name: string;
  label: string;
  multiplier: number;
  active: boolean;
  validFrom: string;
  validUntil: string;
}

function PricingAnalyticsTab() {
  const [factors, setFactors] = useState<PricingFactor[]>([]);
  const [analytics, setAnalytics] = useState<{ avgMultiplier: number; priceHistory: any[] } | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({ name: "", label: "", multiplier: "1.10", validFrom: "", validUntil: "" });
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");

  const loadData = () => {
    fetch(`${BASE_URL}/api/pricing-factors`)
      .then((r) => r.json()).then(setFactors).catch(() => {});
    fetch(`${BASE_URL}/api/pricing-factors/analytics`)
      .then((r) => r.json()).then(setAnalytics).catch(() => {});
  };

  useEffect(() => { loadData(); }, []);

  const handleToggle = async (id: string) => {
    await fetch(`${BASE_URL}/api/pricing-factors/${id}/toggle`, { method: "PATCH" });
    loadData();
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this pricing factor?")) return;
    await fetch(`${BASE_URL}/api/pricing-factors/${id}`, { method: "DELETE" });
    loadData();
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setFormError("");
    try {
      const res = await fetch(`${BASE_URL}/api/pricing-factors`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.name,
          label: formData.label,
          multiplier: parseFloat(formData.multiplier),
          validFrom: new Date(formData.validFrom).toISOString(),
          validUntil: new Date(formData.validUntil).toISOString(),
          active: true,
        }),
      });
      if (!res.ok) throw new Error("Failed to create");
      setShowForm(false);
      setFormData({ name: "", label: "", multiplier: "1.10", validFrom: "", validUntil: "" });
      loadData();
    } catch (err: any) {
      setFormError(err.message ?? "Failed to create factor");
    } finally {
      setSubmitting(false);
    }
  };

  const activeCount = factors.filter((f) => f.active).length;
  const compositeMultiplier = factors.filter((f) => f.active).reduce((acc, f) => acc * f.multiplier, 1.0);

  return (
    <div className="space-y-8">
      <div className="grid sm:grid-cols-3 gap-4">
        {[
          { label: "Avg Dynamic Multiplier", value: analytics ? `${analytics.avgMultiplier.toFixed(3)}×` : "—", icon: TrendingUp, color: "text-cyan-400" },
          { label: "Active Surge Factors", value: activeCount, icon: Zap, color: "text-yellow-400" },
          { label: "Composite Multiplier", value: `${compositeMultiplier.toFixed(3)}×`, icon: BarChart3, color: "text-green-400" },
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

      {analytics && analytics.priceHistory.length > 0 && (
        <div className="bg-card border border-border rounded-2xl p-6">
          <h3 className="font-bold text-foreground mb-4 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-cyan-400" /> Recent Price History
          </h3>
          <div className="overflow-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-border">
                  {["Service", "Base", "Final", "Multiplier", "Time"].map((h) => (
                    <th key={h} className="text-left px-3 py-2 text-muted-foreground font-semibold uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {analytics.priceHistory.slice(-10).reverse().map((p: any) => {
                  const mult = parseFloat(p.dynamicMultiplier);
                  const isUp = mult > 1.05;
                  const isDown = mult < 0.95;
                  return (
                    <tr key={p.id} className="hover:bg-slate-900/40">
                      <td className="px-3 py-2 font-medium capitalize">{p.serviceType.replace(/_/g, " ")}</td>
                      <td className="px-3 py-2 text-muted-foreground">{formatCurrency(p.basePriceCents)}</td>
                      <td className="px-3 py-2 font-semibold">{formatCurrency(p.finalPriceCents)}</td>
                      <td className="px-3 py-2">
                        <span className={cn("flex items-center gap-1 font-bold", isUp ? "text-rose-400" : isDown ? "text-green-400" : "text-muted-foreground")}>
                          {isUp ? <ChevronUp className="w-3 h-3" /> : isDown ? <ChevronDown className="w-3 h-3" /> : null}
                          {mult.toFixed(3)}×
                        </span>
                      </td>
                      <td className="px-3 py-2 text-muted-foreground font-mono">
                        {p.createdAt ? format(parseISO(p.createdAt), "dd/MM HH:mm") : "—"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <div className="bg-card border border-border rounded-2xl p-6 space-y-5">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-foreground flex items-center gap-2">
            <Zap className="w-5 h-5 text-yellow-400" /> Surge Pricing Factors
          </h3>
          <button
            onClick={() => setShowForm(!showForm)}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold bg-primary text-primary-foreground hover:shadow-lg hover:shadow-primary/20 transition-all"
          >
            <Plus className="w-4 h-4" /> Add Factor
          </button>
        </div>

        {showForm && (
          <form onSubmit={handleCreate} className="bg-slate-900/60 border border-border rounded-xl p-5 space-y-4">
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-muted-foreground mb-1 block">Internal Name</label>
                <input value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} required placeholder="e.g. summer_surge"
                  className="w-full px-3 py-2 rounded-xl border border-border bg-background text-sm focus:outline-none focus:border-primary" />
              </div>
              <div>
                <label className="text-xs font-semibold text-muted-foreground mb-1 block">Display Label</label>
                <input value={formData.label} onChange={(e) => setFormData({ ...formData, label: e.target.value })} required placeholder="e.g. Summer Peak"
                  className="w-full px-3 py-2 rounded-xl border border-border bg-background text-sm focus:outline-none focus:border-primary" />
              </div>
              <div>
                <label className="text-xs font-semibold text-muted-foreground mb-1 block">Multiplier (0.5 – 3.0)</label>
                <input type="number" step="0.01" min="0.5" max="3.0" value={formData.multiplier}
                  onChange={(e) => setFormData({ ...formData, multiplier: e.target.value })} required
                  className="w-full px-3 py-2 rounded-xl border border-border bg-background text-sm focus:outline-none focus:border-primary" />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs font-semibold text-muted-foreground mb-1 block">Valid From</label>
                  <input type="datetime-local" value={formData.validFrom} onChange={(e) => setFormData({ ...formData, validFrom: e.target.value })} required
                    className="w-full px-3 py-2 rounded-xl border border-border bg-background text-sm focus:outline-none focus:border-primary" />
                </div>
                <div>
                  <label className="text-xs font-semibold text-muted-foreground mb-1 block">Valid Until</label>
                  <input type="datetime-local" value={formData.validUntil} onChange={(e) => setFormData({ ...formData, validUntil: e.target.value })} required
                    className="w-full px-3 py-2 rounded-xl border border-border bg-background text-sm focus:outline-none focus:border-primary" />
                </div>
              </div>
            </div>
            {formError && <p className="text-red-400 text-sm flex items-center gap-2"><AlertCircle className="w-4 h-4" />{formError}</p>}
            <div className="flex gap-3">
              <button type="submit" disabled={submitting}
                className="px-5 py-2.5 rounded-xl text-sm font-semibold bg-primary text-primary-foreground hover:shadow-lg transition-all disabled:opacity-50">
                {submitting ? "Creating..." : "Create Factor"}
              </button>
              <button type="button" onClick={() => setShowForm(false)}
                className="px-5 py-2.5 rounded-xl text-sm font-semibold border border-border hover:border-primary/40 transition-colors">
                Cancel
              </button>
            </div>
          </form>
        )}

        {factors.length === 0 ? (
          <div className="text-center py-10 border border-dashed border-border rounded-xl">
            <Zap className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
            <p className="text-muted-foreground text-sm">No surge pricing factors configured.</p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {factors.map((f) => (
              <div key={f.id} className="flex items-center justify-between py-4 gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3">
                    <span className={cn("w-2 h-2 rounded-full flex-shrink-0", f.active ? "bg-green-400" : "bg-slate-600")} />
                    <p className="font-semibold text-foreground truncate">{f.label}</p>
                    <span className={cn("px-2 py-0.5 text-xs font-bold rounded-full", f.multiplier > 1 ? "bg-rose-500/10 text-rose-400" : "bg-green-500/10 text-green-400")}>
                      {f.multiplier > 1 ? "+" : ""}{((f.multiplier - 1) * 100).toFixed(0)}%
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1 font-mono">{f.name}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {format(parseISO(f.validFrom), "dd/MM/yy HH:mm")} → {format(parseISO(f.validUntil), "dd/MM/yy HH:mm")}
                  </p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <span className="text-lg font-bold text-foreground">{f.multiplier.toFixed(2)}×</span>
                  <button onClick={() => handleToggle(f.id)} className="p-2 rounded-lg hover:bg-slate-800 transition-colors" title={f.active ? "Deactivate" : "Activate"}>
                    {f.active ? <ToggleRight className="w-5 h-5 text-green-400" /> : <ToggleLeft className="w-5 h-5 text-slate-500" />}
                  </button>
                  <button onClick={() => handleDelete(f.id)} className="p-2 rounded-lg hover:bg-red-500/10 transition-colors text-muted-foreground hover:text-red-400">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    pending: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20",
    confirmed: "bg-green-500/10 text-green-500 border-green-500/20",
    in_progress: "bg-cyan-500/10 text-cyan-400 border-cyan-500/20",
    completed: "bg-blue-500/10 text-blue-400 border-blue-500/20",
    cancelled: "bg-red-500/10 text-red-400 border-red-500/20",
    draft: "bg-slate-500/10 text-slate-400 border-slate-500/20",
  };
  return (
    <span className={cn("px-2 py-0.5 text-xs font-bold rounded-full border uppercase tracking-wider", styles[status] ?? styles.draft)}>
      {status.replace("_", " ")}
    </span>
  );
}
