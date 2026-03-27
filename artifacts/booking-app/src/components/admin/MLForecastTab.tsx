import { useState, useEffect } from "react";
import { Brain, TrendingUp, RefreshCw, Zap, Info } from "lucide-react";
import { BASE_URL } from "./shared";
import { cn } from "@/lib/utils";

interface ForecastPoint {
  date: string;
  predictedDemand: number;
  confidenceLow: number;
  confidenceHigh: number;
  modelVersion: string;
  isHeuristic: boolean;
  features: Record<string, number>;
}

interface ModelVersion {
  id: string;
  name: string;
  version: string;
  metrics: { mae: number; rmse: number; r2: number };
  trainingDataCount: number;
  isActive: boolean;
  trainedAt: string;
}

const SERVICE_TYPES = [
  { value: "standard_clean", label: "Standard Clean" },
  { value: "deep_clean",     label: "Deep Clean" },
  { value: "end_of_lease",   label: "End of Lease" },
  { value: "office_clean",   label: "Office Clean" },
  { value: "carpet_clean",   label: "Carpet Clean" },
];

const TENANT_ID = "aussieclean-default";

function getDates(startStr: string, days: number): string[] {
  const result: string[] = [];
  const start = new Date(startStr);
  for (let i = 0; i < days; i++) {
    const d = new Date(start);
    d.setDate(d.getDate() + i);
    result.push(d.toISOString().slice(0, 10));
  }
  return result;
}

const MAX_BAR = 8;

export function MLForecastTab() {
  const [serviceType, setServiceType] = useState("standard_clean");
  const [startDate, setStartDate] = useState(new Date().toISOString().slice(0, 10));
  const [days, setDays] = useState(14);
  const [forecasts, setForecasts] = useState<ForecastPoint[]>([]);
  const [models, setModels] = useState<ModelVersion[]>([]);
  const [loading, setLoading] = useState(false);
  const [training, setTraining] = useState(false);

  const loadModels = async () => {
    const res = await fetch(`${BASE_URL}/api/ml/models?tenantId=${TENANT_ID}`);
    if (res.ok) setModels(await res.json());
  };

  useEffect(() => { loadModels(); }, []);

  const runForecast = async () => {
    setLoading(true);
    try {
      const dates = getDates(startDate, days);
      const res = await fetch(`${BASE_URL}/api/ml/forecast`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tenantId: TENANT_ID, serviceType, dates }),
      });
      if (res.ok) {
        const data = await res.json();
        setForecasts(data.forecasts ?? []);
      }
    } finally { setLoading(false); }
  };

  const trainModel = async () => {
    setTraining(true);
    try {
      const res = await fetch(`${BASE_URL}/api/ml/train`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tenantId: TENANT_ID, serviceType }),
      });
      if (res.ok) {
        const data = await res.json();
        loadModels();
        alert(`Model trained! Version: ${data.version} · R²: ${data.metrics.r2.toFixed(3)} · MAE: ${data.metrics.mae.toFixed(2)}`);
      }
    } finally { setTraining(false); }
  };

  const maxDemand = Math.max(...forecasts.map((f) => f.confidenceHigh), 1);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Brain className="w-5 h-5 text-primary" /> ML Demand Forecasting
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Predict booking demand using multivariate regression trained on historical data.
          </p>
        </div>
        <button
          onClick={trainModel} disabled={training}
          className="flex items-center gap-2 px-4 py-2 rounded-xl border border-primary text-primary text-sm font-semibold hover:bg-primary/10 disabled:opacity-50 transition-colors"
        >
          <Zap className="w-4 h-4" />
          {training ? "Training…" : "Retrain Model"}
        </button>
      </div>

      {/* Controls */}
      <div className="border border-border bg-card rounded-2xl p-5 space-y-4">
        <div className="flex flex-wrap gap-4 items-end">
          <div>
            <label className="block text-xs font-semibold mb-1 text-muted-foreground">Service Type</label>
            <select value={serviceType} onChange={(e) => setServiceType(e.target.value)}
              className="rounded-lg border border-border bg-background px-3 py-2 text-sm min-w-[160px]">
              {SERVICE_TYPES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold mb-1 text-muted-foreground">Start Date</label>
            <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)}
              className="rounded-lg border border-border bg-background px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="block text-xs font-semibold mb-1 text-muted-foreground">Days</label>
            <select value={days} onChange={(e) => setDays(+e.target.value)}
              className="rounded-lg border border-border bg-background px-3 py-2 text-sm">
              {[7, 14, 21, 30].map((d) => <option key={d} value={d}>{d} days</option>)}
            </select>
          </div>
          <button
            onClick={runForecast} disabled={loading}
            className="flex items-center gap-2 px-5 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-500 text-white text-sm font-semibold disabled:opacity-50 hover:opacity-90 transition-opacity"
          >
            <TrendingUp className="w-4 h-4" />
            {loading ? "Forecasting…" : "Generate Forecast"}
          </button>
        </div>
      </div>

      {/* Chart */}
      {forecasts.length > 0 && (
        <div className="border border-border bg-card rounded-2xl p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-sm">
              {SERVICE_TYPES.find((s) => s.value === serviceType)?.label} Demand Forecast
            </h3>
            {forecasts[0]?.isHeuristic && (
              <span className="flex items-center gap-1 text-xs text-amber-400 bg-amber-400/10 px-2 py-0.5 rounded-full">
                <Info className="w-3.5 h-3.5" /> Heuristic mode (insufficient training data)
              </span>
            )}
          </div>

          {/* Bar chart */}
          <div className="overflow-x-auto pb-2">
            <div className="flex items-end gap-1.5 min-w-0" style={{ minHeight: "160px" }}>
              {forecasts.map((f) => {
                const barH = Math.max(8, (f.predictedDemand / maxDemand) * 140);
                const ciLoH = Math.max(4, (f.confidenceLow / maxDemand) * 140);
                const ciHiH = Math.max(4, (f.confidenceHigh / maxDemand) * 140);
                const dow = new Date(f.date).getDay();
                const isWE = dow === 0 || dow === 6;
                return (
                  <div key={f.date} className="flex flex-col items-center gap-1 flex-1 min-w-[30px]" title={`${f.date}: ${f.predictedDemand} bookings (CI: ${f.confidenceLow}–${f.confidenceHigh})`}>
                    <span className="text-[9px] text-muted-foreground font-semibold">{f.predictedDemand.toFixed(1)}</span>
                    <div className="relative flex flex-col items-center" style={{ height: "140px", justifyContent: "flex-end" }}>
                      {/* CI range */}
                      <div className="absolute bottom-0 w-2 rounded-sm bg-primary/20"
                        style={{ height: `${ciHiH}px` }} />
                      {/* Forecast bar */}
                      <div className={cn("w-4 rounded-sm transition-all", isWE ? "bg-cyan-400" : "bg-primary")}
                        style={{ height: `${barH}px`, position: "absolute", bottom: 0 }} />
                    </div>
                    <span className="text-[9px] text-muted-foreground"
                      title={f.date}>{f.date.slice(5)}</span>
                  </div>
                );
              })}
            </div>
          </div>
          <div className="flex items-center gap-4 text-xs text-muted-foreground pt-1">
            <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm bg-primary inline-block" />Weekday</span>
            <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm bg-cyan-400 inline-block" />Weekend</span>
            <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm bg-primary/20 inline-block" />95% CI</span>
          </div>
        </div>
      )}

      {/* Model versions table */}
      {models.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-bold">Model Versions</h3>
            <button onClick={loadModels} className="text-muted-foreground hover:text-foreground">
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
          <div className="border border-border rounded-2xl overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-muted/30">
                <tr>
                  <th className="text-left px-4 py-2.5 font-semibold">Name</th>
                  <th className="text-left px-4 py-2.5 font-semibold">Version</th>
                  <th className="text-right px-4 py-2.5 font-semibold">MAE</th>
                  <th className="text-right px-4 py-2.5 font-semibold">RMSE</th>
                  <th className="text-right px-4 py-2.5 font-semibold">R²</th>
                  <th className="text-right px-4 py-2.5 font-semibold">Samples</th>
                  <th className="text-right px-4 py-2.5 font-semibold">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {models.map((m) => (
                  <tr key={m.id} className="hover:bg-muted/10">
                    <td className="px-4 py-3 font-medium">{m.name}</td>
                    <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{m.version}</td>
                    <td className="px-4 py-3 text-right">{m.metrics.mae.toFixed(2)}</td>
                    <td className="px-4 py-3 text-right">{m.metrics.rmse.toFixed(2)}</td>
                    <td className="px-4 py-3 text-right">{(m.metrics.r2 * 100).toFixed(1)}%</td>
                    <td className="px-4 py-3 text-right">{m.trainingDataCount}</td>
                    <td className="px-4 py-3 text-right">
                      <span className={cn(
                        "px-2 py-0.5 rounded-full text-xs font-semibold",
                        m.isActive ? "bg-emerald-500/15 text-emerald-400" : "bg-muted text-muted-foreground",
                      )}>
                        {m.isActive ? "Active" : "Archived"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
