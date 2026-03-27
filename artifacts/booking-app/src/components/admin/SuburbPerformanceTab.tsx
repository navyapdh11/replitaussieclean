import { useState, Fragment } from "react";
import { Link } from "wouter";
import {
  MapPin, DollarSign, CheckCircle2, XCircle, BarChart3,
  RefreshCw, ExternalLink, ChevronDown, ChevronRight,
  AlertCircle, Layers,
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

/** Match a booking-suburb to the SUBURB_DATA registry (case-insensitive). */
function registrySlug(row: SuburbRow) {
  return SUBURB_DATA.find(
    (s) =>
      s.postcode === row.postcode &&
      s.suburb.trim().toLowerCase() === row.suburb.trim().toLowerCase(),
  )?.slug;
}

/** Green/amber/red badge — with a special "no completed" state. */
function conversionBadge(rate: number, completedCount: number) {
  if (completedCount === 0) {
    return (
      <span className="text-xs text-muted-foreground italic">no completed</span>
    );
  }
  const cls =
    rate >= 70 ? "bg-emerald-900/40 text-emerald-400" :
    rate >= 40 ? "bg-amber-900/40   text-amber-400"   :
                 "bg-red-900/40     text-red-400";
  return (
    <span className={cn("text-xs font-semibold px-2 py-0.5 rounded-full", cls)}>
      {rate}%
    </span>
  );
}

/** Percentage of total revenue for this suburb. */
function revenueSharePct(rowCents: number, totalCents: number) {
  if (!totalCents) return 0;
  return Math.round((rowCents / totalCents) * 100);
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

/* ── Week-trend fetch (fires when a row is expanded) ──────── */
function useRevenueTrend(postcode: string, enabled: boolean) {
  return useQuery({
    queryKey: ["suburb-trend", postcode],
    queryFn: async (): Promise<{ weeks: { week: string; revenueCents: number; bookings: number }[] }> => {
      const r = await fetch(`${BASE_URL}/api/analytics/suburb-revenue-trend?postcode=${postcode}`);
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      return r.json();
    },
    staleTime: 300_000,
    refetchOnWindowFocus: false,
    enabled,
  });
}

/* ── Micro sparkline ─────────────────────────────────────── */
function Sparkline({ values, className }: { values: number[]; className?: string }) {
  if (values.length < 2) return <span className="text-xs text-muted-foreground">—</span>;
  const max = Math.max(...values, 1);
  const w = 72;
  const h = 20;
  const pts = values
    .map((v, i) => `${(i / (values.length - 1)) * w},${h - (v / max) * (h - 2) - 1}`)
    .join(" ");
  return (
    <svg width={w} height={h} className={cn("inline-block", className)}>
      <polyline
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        points={pts}
        className="text-cyan-400"
      />
    </svg>
  );
}

/* ── Expanded detail row ─────────────────────────────────── */
function ExpandedRow({
  row,
  slug,
  totalRevenueCents,
}: {
  row: SuburbRow;
  slug: string | undefined;
  totalRevenueCents: number;
}) {
  const { data: trend, isLoading: trendLoading } = useRevenueTrend(row.postcode, true);
  const trendValues = trend?.weeks.map((w) => w.revenueCents) ?? [];
  const pct = revenueSharePct(row.totalRevenueCents, totalRevenueCents);

  return (
    <tr className="bg-card/30">
      <td colSpan={8} className="px-6 py-5">
        <div className="grid sm:grid-cols-3 gap-6 text-xs">

          {/* ── Booking activity ──── */}
          <div>
            <p className="text-muted-foreground mb-2 font-semibold uppercase tracking-wider text-[10px]">
              Booking Activity
            </p>
            <dl className="space-y-1">
              <div className="flex justify-between">
                <dt className="text-muted-foreground">First booking</dt>
                <dd className="text-foreground font-medium">{row.firstBookingDate?.slice(0, 10) ?? "—"}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Last booking</dt>
                <dd className="text-foreground font-medium">{row.lastBookingDate?.slice(0, 10) ?? "—"}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Confirmed / active</dt>
                <dd className="text-foreground font-medium">{row.confirmedCount}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Completed</dt>
                <dd className="text-emerald-400 font-semibold">{row.completedCount}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Max single order</dt>
                <dd className="font-mono text-foreground">{formatCurrency(row.maxRevenueCents)}</dd>
              </div>
            </dl>
          </div>

          {/* ── Revenue share + sparkline ──── */}
          <div>
            <p className="text-muted-foreground mb-2 font-semibold uppercase tracking-wider text-[10px]">
              Revenue Share · 12-Week Trend
            </p>
            <div className="flex items-center gap-2 mb-3">
              <div className="flex-1 bg-border rounded-full h-2 overflow-hidden">
                <div
                  className="h-full bg-cyan-500 rounded-full"
                  style={{ width: `${pct}%` }}
                />
              </div>
              <span className="font-semibold text-cyan-400 tabular-nums w-8 text-right">{pct}%</span>
            </div>
            <div className="flex items-end gap-3">
              {trendLoading ? (
                <span className="text-muted-foreground italic">Loading…</span>
              ) : (
                <>
                  <Sparkline values={trendValues} />
                  <span className="text-muted-foreground">
                    {trendValues.length} weeks of data
                  </span>
                </>
              )}
            </div>
          </div>

          {/* ── Quick links ──── */}
          <div>
            <p className="text-muted-foreground mb-2 font-semibold uppercase tracking-wider text-[10px]">
              {slug ? "Season Pages" : "Registry"}
            </p>
            {slug ? (
              <div className="grid grid-cols-2 gap-1">
                {["spring", "summer", "autumn", "winter"].map((s) => (
                  <Link key={s} href={`/suburb/${slug}/${s}`}>
                    <span className="flex items-center gap-1 text-primary hover:underline capitalize">
                      <ExternalLink className="w-2.5 h-2.5" /> {s}
                    </span>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="flex items-start gap-2 text-amber-400/80">
                <AlertCircle className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                <p>
                  <strong className="text-amber-300">{row.suburb}</strong> is not in the suburb
                  registry. Add it to <code className="text-[10px] bg-card/50 px-1 rounded">src/data/suburbs.ts</code> to
                  enable season pages and SEO tracking.
                </p>
              </div>
            )}
            {row.cancelledCount > 0 && (
              <p className="mt-3 text-red-400/80">
                Est. cancelled revenue lost:{" "}
                <span className="font-mono font-semibold text-red-400">
                  {formatCurrency(row.cancelledCount * row.avgOrderValueCents)}
                </span>
              </p>
            )}
          </div>
        </div>
      </td>
    </tr>
  );
}

/* ── Main component ──────────────────────────────────────── */
export function SuburbPerformanceTab() {
  const [days, setDays]   = useState(90);
  const [sort, setSort]   = useState<"revenue" | "bookings" | "aov" | "conversion" | "share">("revenue");
  const [expanded, setExpanded] = useState<string | null>(null);

  const { data, isLoading, isError, refetch, isFetching } = useSuburbPerformance(days);

  const totalRevenueCents = data?.summary.totalRevenueCents ?? 0;

  /* ── Sort rows ─────────────────────────────────────────── */
  const sorted = [...(data?.suburbs ?? [])].sort((a, b) => {
    if (sort === "revenue")    return b.totalRevenueCents  - a.totalRevenueCents;
    if (sort === "bookings")   return b.bookingCount       - a.bookingCount;
    if (sort === "aov")        return b.avgOrderValueCents - a.avgOrderValueCents;
    if (sort === "conversion") return b.conversionRate     - a.conversionRate;
    if (sort === "share")      return b.totalRevenueCents  - a.totalRevenueCents;
    return 0;
  });

  /* ── Totals row ────────────────────────────────────────── */
  const totals = {
    bookings:   sorted.reduce((s, r) => s + r.bookingCount,       0),
    completed:  sorted.reduce((s, r) => s + r.completedCount,     0),
    revenue:    sorted.reduce((s, r) => s + r.totalRevenueCents,  0),
    cancelled:  sorted.reduce((s, r) => s + r.cancelledCount,     0),
  };

  /* ── Loading ───────────────────────────────────────────── */
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
        Failed to load suburb performance. Ensure the API server is running.
      </div>
    );
  }

  const summary = data?.summary;

  return (
    <div className="space-y-6">

      {/* ── Summary cards ───────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: "Suburbs with Bookings", value: summary?.totalSuburbs ?? 0,               icon: MapPin,       color: "text-cyan-400"    },
          { label: "Total Bookings",        value: summary?.totalBookings ?? 0,               icon: BarChart3,    color: "text-blue-400"    },
          { label: "Total Revenue",         value: formatCurrency(summary?.totalRevenueCents ?? 0), icon: DollarSign, color: "text-emerald-400" },
          { label: "In Suburb Registry",    value: sorted.filter((r) => !!registrySlug(r)).length,  icon: Layers,   color: "text-violet-400"  },
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
        {/* Date range */}
        <div className="flex gap-1.5 flex-wrap">
          {([30, 90, 180, 365] as const).map((d) => (
            <button
              key={d}
              onClick={() => setDays(d)}
              className={cn(
                "px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors",
                days === d
                  ? "border-primary text-primary bg-primary/10"
                  : "border-border text-muted-foreground hover:border-primary/40",
              )}
            >
              {d}d
            </button>
          ))}
        </div>
        {/* Sort + refresh */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs text-muted-foreground">Sort:</span>
          {(["revenue", "bookings", "aov", "conversion"] as const).map((s) => (
            <button
              key={s}
              onClick={() => setSort(s)}
              className={cn(
                "px-2.5 py-1 rounded-md text-xs font-medium border transition-colors",
                sort === s
                  ? "border-primary text-primary bg-primary/10"
                  : "border-border text-muted-foreground hover:border-primary/40",
              )}
            >
              {s === "aov" ? "AOV" : s.charAt(0).toUpperCase() + s.slice(1)}
            </button>
          ))}
          <button
            onClick={() => refetch()}
            disabled={isFetching}
            className="p-1.5 rounded-lg border border-border text-muted-foreground hover:text-foreground transition-colors"
            aria-label="Refresh data"
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
          <p className="text-sm">
            Revenue data appears here once customers complete bookings with a suburb address.
          </p>
        </div>
      )}

      {/* ── Table ──────────────────────────────────────────── */}
      {sorted.length > 0 && (
        <div className="rounded-2xl border border-border overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-card/50">
                {["Suburb", "Revenue", "Share", "Bookings", "Avg Order", "Conversion", "Cancelled", ""].map((h) => (
                  <th
                    key={h}
                    className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {sorted.map((row) => {
                const slug       = registrySlug(row);
                const rowKey     = `${row.postcode}-${row.suburb}`;
                const isExpanded = expanded === rowKey;
                const pct        = revenueSharePct(row.totalRevenueCents, totalRevenueCents);

                return (
                  <Fragment key={`${row.postcode}-${row.suburb}`}>
                    {/* ── Main row ── */}
                    <tr
                      className={cn(
                        "transition-colors hover:bg-card/40 cursor-pointer",
                        isExpanded && "bg-card/60",
                      )}
                      onClick={() => setExpanded(isExpanded ? null : rowKey)}
                    >
                      {/* Suburb */}
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5">
                          {isExpanded
                            ? <ChevronDown  className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                            : <ChevronRight className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                          }
                          <div>
                            <div className="font-semibold text-foreground leading-tight">
                              {row.suburb}
                              {!slug && (
                                <span className="ml-1.5 text-[10px] text-amber-500/80 font-normal">(unregistered)</span>
                              )}
                            </div>
                            <div className="text-xs text-muted-foreground">{row.postcode} · {row.state}</div>
                          </div>
                        </div>
                      </td>

                      {/* Revenue */}
                      <td className="px-4 py-3 font-mono font-semibold text-emerald-400">
                        {formatCurrency(row.totalRevenueCents)}
                      </td>

                      {/* Share bar */}
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="w-16 h-1.5 bg-border rounded-full overflow-hidden">
                            <div className="h-full bg-cyan-500 rounded-full" style={{ width: `${pct}%` }} />
                          </div>
                          <span className="tabular-nums text-xs text-muted-foreground">{pct}%</span>
                        </div>
                      </td>

                      {/* Bookings */}
                      <td className="px-4 py-3 tabular-nums text-foreground">
                        {row.bookingCount}
                        <span className="text-xs text-muted-foreground ml-1">
                          ({row.completedCount} done)
                        </span>
                      </td>

                      {/* AOV */}
                      <td className="px-4 py-3 font-mono text-foreground">
                        {formatCurrency(row.avgOrderValueCents)}
                      </td>

                      {/* Conversion */}
                      <td className="px-4 py-3">
                        {conversionBadge(row.conversionRate, row.completedCount)}
                      </td>

                      {/* Cancelled */}
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

                      {/* Link */}
                      <td className="px-4 py-3">
                        {slug && (
                          <Link href={`/suburb/${slug}`} onClick={(e) => e.stopPropagation()}>
                            <span className="inline-flex items-center gap-1 text-xs text-primary hover:underline">
                              View <ExternalLink className="w-3 h-3" />
                            </span>
                          </Link>
                        )}
                      </td>
                    </tr>

                    {/* ── Expanded row ── */}
                    {isExpanded && (
                      <ExpandedRow
                        row={row}
                        slug={slug}
                        totalRevenueCents={totalRevenueCents}
                      />
                    )}
                  </Fragment>
                );
              })}
            </tbody>

            {/* ── Totals row ──────────────────────────────────── */}
            <tfoot>
              <tr className="border-t-2 border-border bg-card/70 font-semibold text-sm">
                <td className="px-4 py-3 text-muted-foreground">
                  TOTAL · {sorted.length} suburbs
                </td>
                <td className="px-4 py-3 font-mono text-emerald-400">
                  {formatCurrency(totals.revenue)}
                </td>
                <td className="px-4 py-3 text-muted-foreground">100%</td>
                <td className="px-4 py-3 tabular-nums text-foreground">
                  {totals.bookings}
                  <span className="text-xs font-normal text-muted-foreground ml-1">({totals.completed} done)</span>
                </td>
                <td className="px-4 py-3 font-mono text-foreground">
                  {totals.bookings > 0 ? formatCurrency(Math.round(totals.revenue / totals.bookings)) : "—"}
                </td>
                <td className="px-4 py-3 text-muted-foreground text-xs">
                  {totals.bookings > 0 ? `${Math.round((totals.completed / totals.bookings) * 100)}%` : "—"}
                </td>
                <td className="px-4 py-3 text-red-400/70 text-xs">
                  {totals.cancelled > 0 ? `${totals.cancelled} total` : "—"}
                </td>
                <td />
              </tr>
            </tfoot>
          </table>
        </div>
      )}

      {/* ── Footer ─────────────────────────────────────────── */}
      <p className="text-xs text-muted-foreground">
        Showing last {days} days · Revenue = quote + GST ·
        Click any row to expand the 12-week trend and details ·
        "Unregistered" suburbs have bookings but no season landing pages yet
      </p>
    </div>
  );
}
