import { useState } from "react";
import { Link } from "wouter";
import {
  TrendingUp, TrendingDown, Minus, MapPin, DollarSign,
  CheckCircle2, XCircle, BarChart3, RefreshCw, ExternalLink,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { formatCurrency, cn } from "@/lib/utils";
import { BASE_URL } from "@/components/admin/shared";
import { SUBURB_DATA } from "@/data/suburbs";

/* ── Types ───────────────────────────────────────────────── */
interface SuburbRow {
  suburb:             string;
  postcode:           string;
  state:              string;
  bookingCount:       number;
  completedCount:     number;
  confirmedCount:     number;
  cancelledCount:     number;
  totalRevenueCents:  number;
  avgOrderValueCents: number;
  maxRevenueCents:    number;
  conversionRate:     number;
  cancellationRate:   number;
  firstBookingDate:   string;
  lastBookingDate:    string;
}

interface SuburbPerfResponse {
  suburbs: SuburbRow[];
  summary: {
    totalSuburbs:      number;
    totalBookings:     number;
    totalRevenueCents: number;
    avgConversionRate: number;
  };
  days: number;
}

/* ── Helpers ─────────────────────────────────────────────── */
function trendIcon(val: number) {
  if (val > 0)  return <TrendingUp  className="w-3.5 h-3.5 text-emerald-400 inline" />;
  if (val < 0)  return <TrendingDown className="w-3.5 h-3.5 text-red-400   inline" />;
  return              <Minus         className="w-3.5 h-3.5 text-muted-foreground inline" />;
}

function conversionBadge(rate: number) {
  const cls = rate >= 70
    ? "bg-emerald-900/40 text-emerald-400"
    : rate >= 40
    ? "bg-amber-900/40 text-amber-400"
    : "bg-red-900/40 text-red-400";
  return (
    <span className={cn("text-xs font-semibold px-2 py-0.5 rounded-full", cls)}>
      {rate}%
    </span>
  );
}

/* ── Fetch hook ──────────────────────────────────────────── */
function useSuburbPerformance(days: number) {
  return useQuery({
    queryKey: ["suburb-performance", days],
    queryFn: async (): Promise<SuburbPerfResponse> => {
      const r = await fetch(`${BASE_URL}/api/analytics/suburb-performance?days=${days}`);
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      return r.json();
    },
    staleTime: 60_000,
    refetchOnWindowFocus: false,
  });
}

/* ── Trend sparkline (uses data from the API) ─────────────── */
function useTrend(postcode: string) {
  return useQuery({
    queryKey: ["suburb-trend", postcode],
    queryFn: async () => {
      const r = await fetch(`${BASE_URL}/api/analytics/suburb-revenue-trend?postcode=${postcode}`);
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      return r.json() as Promise<{ weeks: { week: string; revenueCents: number }[] }>;
    },
    staleTime: 300_000,
    refetchOnWindowFocus: false,
    enabled: false, /* fetched on expand */
  });
}

/* ── Inline sparkline svg ──────────────────────────────────── */
function Sparkline({ values }: { values: number[] }) {
  if (values.length < 2) return null;
  const max  = Math.max(...values, 1);
  const w    = 80;
  const h    = 24;
  const pts  = values.map((v, i) => `${(i / (values.length - 1)) * w},${h - (v / max) * h}`).join(" ");
  return (
    <svg width={w} height={h} className="inline-block">
      <polyline fill="none" stroke="currentColor" strokeWidth="1.5" points={pts} className="text-cyan-400" />
    </svg>
  );
}

/* ── Main component ──────────────────────────────────────── */
export function SuburbPerformanceTab() {
  const [days, setDays]     = useState(90);
  const [sort, setSort]     = useState<"revenue" | "bookings" | "aov" | "conversion">("revenue");
  const [expanded, setExpanded] = useState<string | null>(null);

  const { data, isLoading, isError, refetch, isFetching } = useSuburbPerformance(days);

  /* ── Sort rows ─────────────────────────────────────────── */
  const sorted = [...(data?.suburbs ?? [])].sort((a, b) => {
    if (sort === "revenue")    return b.totalRevenueCents - a.totalRevenueCents;
    if (sort === "bookings")   return b.bookingCount       - a.bookingCount;
    if (sort === "aov")        return b.avgOrderValueCents - a.avgOrderValueCents;
    if (sort === "conversion") return b.conversionRate     - a.conversionRate;
    return 0;
  });

  /* ── Merge with suburb registry to add links ───────────── */
  function registrySlug(row: SuburbRow) {
    return SUBURB_DATA.find(
      (s) => s.postcode === row.postcode && s.suburb.toLowerCase() === row.suburb.toLowerCase()
    )?.slug;
  }

  /* ── Empty / loading states ─────────────────────────────── */
  if (isLoading) {
    return (
      <div className="flex items-center gap-3 py-12 text-muted-foreground">
        <RefreshCw className="w-5 h-5 animate-spin" />
        <span>Loading suburb performance data…</span>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="rounded-xl border border-red-800/40 bg-red-950/20 p-6 text-red-400 text-sm">
        Failed to load suburb performance. Check the API server is running.
      </div>
    );
  }

  const summary = data?.summary;

  return (
    <div className="space-y-6">

      {/* ── Summary cards ───────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: "Suburbs Tracked",   value: summary?.totalSuburbs ?? 0,              icon: MapPin,       color: "text-cyan-400"   },
          { label: "Total Bookings",    value: summary?.totalBookings ?? 0,              icon: BarChart3,    color: "text-blue-400"   },
          { label: "Total Revenue",     value: formatCurrency(summary?.totalRevenueCents ?? 0), icon: DollarSign, color: "text-emerald-400" },
          { label: "Avg Conversion",    value: `${summary?.avgConversionRate ?? 0}%`,   icon: CheckCircle2, color: "text-violet-400"  },
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="bg-card border border-border rounded-2xl p-4">
            <div className={cn("flex items-center gap-2 mb-2", color)}>
              <Icon className="w-4 h-4" />
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{label}</span>
            </div>
            <p className="text-xl font-extrabold text-foreground">{String(value)}</p>
          </div>
        ))}
      </div>

      {/* ── Controls ───────────────────────────────────────── */}
      <div className="flex flex-wrap items-center gap-3 justify-between">
        <div className="flex gap-1.5 flex-wrap">
          {([30, 90, 180, 365] as const).map((d) => (
            <button
              key={d}
              onClick={() => setDays(d)}
              className={cn(
                "px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors",
                days === d ? "border-primary text-primary bg-primary/10" : "border-border text-muted-foreground hover:border-border/80",
              )}
            >
              {d}d
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">Sort:</span>
          {(["revenue","bookings","aov","conversion"] as const).map((s) => (
            <button
              key={s}
              onClick={() => setSort(s)}
              className={cn(
                "px-2.5 py-1 rounded-md text-xs font-medium border transition-colors",
                sort === s ? "border-primary text-primary bg-primary/10" : "border-border text-muted-foreground hover:border-border/80",
              )}
            >
              {s === "aov" ? "AOV" : s.charAt(0).toUpperCase() + s.slice(1)}
            </button>
          ))}
          <button
            onClick={() => refetch()}
            disabled={isFetching}
            className="p-1.5 rounded-lg border border-border text-muted-foreground hover:text-foreground transition-colors"
            aria-label="Refresh"
          >
            <RefreshCw className={cn("w-3.5 h-3.5", isFetching && "animate-spin")} />
          </button>
        </div>
      </div>

      {/* ── Empty state ────────────────────────────────────── */}
      {sorted.length === 0 && (
        <div className="rounded-xl border border-border/50 bg-card/30 p-12 text-center text-muted-foreground">
          <BarChart3 className="w-10 h-10 mx-auto mb-3 opacity-30" />
          <p className="font-semibold mb-1">No suburb data yet</p>
          <p className="text-sm">Revenue data will appear here once customers complete bookings with suburb addresses.</p>
        </div>
      )}

      {/* ── Table ──────────────────────────────────────────── */}
      {sorted.length > 0 && (
        <div className="rounded-2xl border border-border overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-card/50">
                {[
                  { key: "suburb",     label: "Suburb"     },
                  { key: "revenue",    label: "Revenue"    },
                  { key: "bookings",   label: "Bookings"   },
                  { key: "aov",        label: "Avg Order"  },
                  { key: "conversion", label: "Conversion" },
                  { key: "cancelled",  label: "Cancelled"  },
                  { key: "actions",    label: ""           },
                ].map(({ key, label }) => (
                  <th
                    key={key}
                    className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground"
                  >
                    {label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {sorted.map((row) => {
                const slug      = registrySlug(row);
                const isExpanded = expanded === row.postcode;

                return [
                  /* Main row */
                  <tr
                    key={row.postcode}
                    className={cn(
                      "transition-colors hover:bg-card/40 cursor-pointer",
                      isExpanded && "bg-card/60",
                    )}
                    onClick={() => setExpanded(isExpanded ? null : row.postcode)}
                  >
                    <td className="px-4 py-3">
                      <div className="font-semibold text-foreground">{row.suburb}</div>
                      <div className="text-xs text-muted-foreground">{row.postcode} · {row.state}</div>
                    </td>
                    <td className="px-4 py-3 font-mono font-semibold text-emerald-400">
                      {formatCurrency(row.totalRevenueCents)}
                    </td>
                    <td className="px-4 py-3 tabular-nums text-foreground">
                      {row.bookingCount}
                      <span className="text-xs text-muted-foreground ml-1">
                        ({row.completedCount} done)
                      </span>
                    </td>
                    <td className="px-4 py-3 font-mono text-foreground">
                      {formatCurrency(row.avgOrderValueCents)}
                    </td>
                    <td className="px-4 py-3">
                      {conversionBadge(row.conversionRate)}
                    </td>
                    <td className="px-4 py-3">
                      {row.cancelledCount > 0 ? (
                        <span className="flex items-center gap-1 text-red-400 text-xs">
                          <XCircle className="w-3.5 h-3.5" />
                          {row.cancelledCount} ({row.cancellationRate}%)
                        </span>
                      ) : (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {slug && (
                        <Link href={`/suburb/${slug}`} onClick={(e) => e.stopPropagation()}>
                          <span className="inline-flex items-center gap-1 text-xs text-primary hover:underline">
                            View page <ExternalLink className="w-3 h-3" />
                          </span>
                        </Link>
                      )}
                    </td>
                  </tr>,

                  /* Expanded detail row */
                  isExpanded && (
                    <tr key={`${row.postcode}-detail`} className="bg-card/40">
                      <td colSpan={7} className="px-6 py-4">
                        <div className="grid sm:grid-cols-3 gap-6 text-xs">
                          <div>
                            <p className="text-muted-foreground mb-1 font-semibold uppercase tracking-wider">Booking Activity</p>
                            <p>First booking: <span className="text-foreground">{row.firstBookingDate?.slice(0, 10) ?? "—"}</span></p>
                            <p>Last booking:  <span className="text-foreground">{row.lastBookingDate?.slice(0, 10)  ?? "—"}</span></p>
                            <p className="mt-1">Confirmed/In-Progress: <span className="text-foreground">{row.confirmedCount}</span></p>
                            <p>Max single order: <span className="font-mono text-foreground">{formatCurrency(row.maxRevenueCents)}</span></p>
                          </div>
                          <div>
                            <p className="text-muted-foreground mb-1 font-semibold uppercase tracking-wider">Quick Links</p>
                            {slug ? (
                              ["spring","summer","autumn","winter"].map((s) => (
                                <div key={s}>
                                  <Link href={`/suburb/${slug}/${s}`}>
                                    <span className="text-primary hover:underline capitalize">{s} page</span>
                                  </Link>
                                </div>
                              ))
                            ) : (
                              <p className="text-muted-foreground">Not in suburb registry</p>
                            )}
                          </div>
                          <div>
                            <p className="text-muted-foreground mb-1 font-semibold uppercase tracking-wider">Revenue Split</p>
                            <div className="flex items-center gap-2">
                              <div className="flex-1 bg-border rounded-full h-2 overflow-hidden">
                                <div
                                  className="h-full bg-emerald-500 rounded-full"
                                  style={{ width: `${Math.min(row.conversionRate, 100)}%` }}
                                />
                              </div>
                              <span className="text-foreground">{row.conversionRate}% converted</span>
                            </div>
                            <p className="mt-2">Cancelled revenue lost: <span className="text-red-400">est. {formatCurrency(row.cancelledCount * row.avgOrderValueCents)}</span></p>
                          </div>
                        </div>
                      </td>
                    </tr>
                  ),
                ];
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* ── Footer note ─────────────────────────────────────── */}
      <p className="text-xs text-muted-foreground">
        Showing last {days} days · Revenue = quote + GST · Click any row to expand details
      </p>
    </div>
  );
}
