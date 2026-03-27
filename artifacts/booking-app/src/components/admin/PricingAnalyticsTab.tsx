import { useState, useEffect } from "react";
import { format, parseISO } from "date-fns";
import {
  TrendingUp, Zap, BarChart3, Plus, Trash2, ToggleLeft, ToggleRight, AlertCircle, ChevronUp, ChevronDown,
} from "lucide-react";
import { formatCurrency, cn } from "@/lib/utils";
import { BASE_URL } from "./shared";

interface PricingFactor {
  id: string;
  name: string;
  label: string;
  multiplier: number;
  active: boolean;
  validFrom: string;
  validUntil: string;
}

/** datetime-local "2026-01-01T00:00" → proper ISO with seconds */
function toIso(localStr: string): string {
  if (!localStr) throw new Error("Date is required");
  const padded = localStr.length === 16 ? `${localStr}:00` : localStr;
  const d = new Date(padded);
  if (isNaN(d.getTime())) throw new Error("Invalid date — please use the date picker");
  return d.toISOString();
}

export function PricingAnalyticsTab() {
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
      const validFrom = toIso(formData.validFrom);
      const validUntil = toIso(formData.validUntil);
      const mult = parseFloat(formData.multiplier);
      if (isNaN(mult) || mult < 0.5 || mult > 3.0) throw new Error("Multiplier must be between 0.5 and 3.0");

      const res = await fetch(`${BASE_URL}/api/pricing-factors`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: formData.name.trim(), label: formData.label.trim(), multiplier: mult, validFrom, validUntil, active: true }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error((body as any).error ?? `Server error ${res.status}`);
      }
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
      {/* Summary stats */}
      <div className="grid sm:grid-cols-3 gap-4">
        {[
          { label: "Avg Dynamic Multiplier", value: analytics ? `${analytics.avgMultiplier.toFixed(3)}×` : "—", icon: TrendingUp, color: "text-cyan-400" },
          { label: "Active Surge Factors",   value: activeCount, icon: Zap, color: "text-yellow-400" },
          { label: "Composite Multiplier",   value: `${compositeMultiplier.toFixed(3)}×`, icon: BarChart3, color: "text-green-400" },
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

      {/* Price history */}
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
                  const isUp   = mult > 1.05;
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

      {/* Surge factors */}
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

            {formError && (
              <p className="text-red-400 text-sm flex items-center gap-2">
                <AlertCircle className="w-4 h-4" /> {formError}
              </p>
            )}

            <div className="flex gap-3">
              <button type="submit" disabled={submitting}
                className="px-5 py-2.5 rounded-xl text-sm font-semibold bg-primary text-primary-foreground hover:shadow-lg transition-all disabled:opacity-50">
                {submitting ? "Creating…" : "Create Factor"}
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
                  <button onClick={() => handleDelete(f.id)} className="p-2 rounded-lg hover:bg-red-500/10 transition-colors text-muted-foreground hover:text-red-400" title="Delete factor">
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
