import { useState, useMemo } from "react";
import {
  TrendingUp, TrendingDown, Minus, Search, RefreshCw,
  AlertCircle, ExternalLink, ChevronDown, ChevronRight,
  Key, Globe, Zap,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { cn } from "@/lib/utils";
import { BASE_URL } from "@/components/admin/shared";
import { SUBURB_DATA } from "@/data/suburbs";
import { ALL_SEASONS } from "@/data/seasonal-content";

/* ── Types ───────────────────────────────────────────────── */
interface KeywordRow {
  keyword:          string;
  currentPosition:  number;
  previousPosition: number | null;
  positionChange:   number;
  searchVolume:     number;
  difficulty:       number;
  url:              string;
  traffic:          number;
}

interface SuburbRanking {
  suburb:   string;
  postcode: string;
  slug:     string;
  keywords: KeywordRow[];
  source:   "ahrefs" | "semrush" | "gsc" | "demo";
}

interface SeoResponse {
  rankings:  SuburbRanking[];
  source:    "ahrefs" | "semrush" | "gsc" | "demo";
  demo:      boolean;
  demoNote:  string | undefined;
  timestamp: string;
}

/* ── Visual helpers ──────────────────────────────────────── */
function positionBadge(pos: number) {
  const cls =
    pos <= 3  ? "bg-emerald-900/50 text-emerald-300 ring-1 ring-emerald-700/50 font-extrabold" :
    pos <= 10 ? "bg-emerald-900/25 text-emerald-400" :
    pos <= 20 ? "bg-amber-900/30   text-amber-400"   :
    pos <= 50 ? "bg-orange-900/30  text-orange-400"  :
                "bg-red-900/30     text-red-400";
  return (
    <span className={cn("inline-block text-center w-9 text-xs font-semibold px-1 py-0.5 rounded", cls)}>
      {pos}
    </span>
  );
}

function changeCell(change: number) {
  if (change > 0) return (
    <span className="flex items-center justify-center gap-0.5 text-emerald-400 text-xs font-semibold">
      <TrendingUp className="w-3.5 h-3.5" />+{change}
    </span>
  );
  if (change < 0) return (
    <span className="flex items-center justify-center gap-0.5 text-red-400 text-xs font-semibold">
      <TrendingDown className="w-3.5 h-3.5" />{change}
    </span>
  );
  return (
    <span className="flex justify-center">
      <Minus className="w-3.5 h-3.5 text-muted-foreground" />
    </span>
  );
}

function difficultyBar(val: number) {
  const pct = Math.min(val, 100);
  const cls = val < 30 ? "bg-emerald-500" : val < 60 ? "bg-amber-500" : "bg-red-500";
  return (
    <div className="flex items-center gap-2">
      <div className="w-16 h-1.5 bg-border rounded-full overflow-hidden">
        <div className={cn("h-full rounded-full", cls)} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-xs tabular-nums text-muted-foreground">{val}</span>
    </div>
  );
}

/* ── Source badge ────────────────────────────────────────── */
function SourceBadge({ source }: { source: SeoResponse["source"] }) {
  const map: Record<SeoResponse["source"], { label: string; cls: string }> = {
    ahrefs:  { label: "Ahrefs",         cls: "bg-orange-900/30 text-orange-300" },
    semrush: { label: "Semrush",        cls: "bg-violet-900/30 text-violet-300" },
    gsc:     { label: "Search Console", cls: "bg-blue-900/30   text-blue-300"   },
    demo:    { label: "Demo data",      cls: "bg-slate-700/50  text-slate-400"  },
  };
  const { label, cls } = map[source] ?? map.demo;
  return <span className={cn("text-xs px-2 py-0.5 rounded-full font-semibold", cls)}>{label}</span>;
}

/* ── Fetch hook ──────────────────────────────────────────── */
function useSeoRankings(slugs: string[]) {
  const key = slugs.join(",");
  return useQuery({
    queryKey: ["seo-rankings", key],
    queryFn: async (): Promise<SeoResponse> => {
      const r = await fetch(`${BASE_URL}/api/analytics/seo-rankings?slugs=${encodeURIComponent(key)}`);
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      return r.json();
    },
    staleTime:           5 * 60_000,
    refetchOnWindowFocus: false,
    enabled:             slugs.length > 0,
  });
}

/* ── Opportunities: pos 11-50, volume ≥ 200 ─────────────── */
function opportunities(keywords: KeywordRow[]) {
  return keywords
    .filter((k) => k.currentPosition > 10 && k.currentPosition <= 50 && k.searchVolume >= 200)
    .sort((a, b) => a.currentPosition - b.currentPosition)
    .slice(0, 3);
}

/* ── Suburb summary card ─────────────────────────────────── */
function suburbSummaryColor(avg: number | null) {
  if (avg === null) return "text-muted-foreground";
  if (avg <= 5)  return "text-emerald-400";
  if (avg <= 15) return "text-amber-400";
  return "text-red-400";
}

/* ── Main component ──────────────────────────────────────── */
export function SeoRankingTab() {
  const allSlugs = SUBURB_DATA.map((s) => s.slug);
  const [selected, setSelected] = useState<Set<string>>(new Set(allSlugs.slice(0, 6)));
  /* Default: all collapsed */
  const [expanded, setExpanded] = useState<Set<string>>(new Set<string>());
  const [season,   setSeason]   = useState<string>("all");

  const slugArray = useMemo(() => [...selected], [selected]);
  const { data, isLoading, isError, refetch, isFetching, dataUpdatedAt } = useSeoRankings(slugArray);

  /* ── Suburb selection ──────────────────────────────────── */
  function toggleSuburb(slug: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(slug)) { next.delete(slug); } else { next.add(slug); }
      return next;
    });
  }
  const selectAll   = () => setSelected(new Set(allSlugs));
  const deselectAll = () => setSelected(new Set());

  /* ── Expand / collapse ─────────────────────────────────── */
  function toggleExpand(slug: string) {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(slug)) { next.delete(slug); } else { next.add(slug); }
      return next;
    });
  }
  const expandAll   = () => setExpanded(new Set(data?.rankings.map((r) => r.slug) ?? []));
  const collapseAll = () => setExpanded(new Set());

  /* ── Per-suburb stats ─────────────────────────────────────*/
  function avgPos(keywords: KeywordRow[]): number | null {
    if (!keywords.length) return null;
    return keywords.reduce((s, k) => s + k.currentPosition, 0) / keywords.length;
  }
  function top10Count(keywords: KeywordRow[]) {
    return keywords.filter((k) => k.currentPosition <= 10).length;
  }
  function totalTraffic(keywords: KeywordRow[]) {
    return keywords.reduce((s, k) => s + k.traffic, 0);
  }

  return (
    <div className="space-y-6">

      {/* ── Header ─────────────────────────────────────────── */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
            <Search className="w-5 h-5 text-primary" />
            SEO Keyword Rankings
          </h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            Organic search positions for target keywords per suburb
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {data && <SourceBadge source={data.source} />}
          <button
            onClick={() => refetch()}
            disabled={isFetching}
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border border-border text-xs font-medium hover:border-primary/50 transition-colors"
          >
            <RefreshCw className={cn("w-3.5 h-3.5", isFetching && "animate-spin")} />
            Refresh
          </button>
        </div>
      </div>

      {/* ── Demo mode banner ───────────────────────────────── */}
      {data?.demo && (
        <div className="flex items-start gap-3 rounded-xl border border-amber-800/40 bg-amber-950/20 px-4 py-3 text-amber-300 text-sm">
          <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
          <span>
            <strong>Demo mode</strong> — showing realistic simulated rankings.{" "}
            Connect one of the data sources below to see live positions.
          </span>
        </div>
      )}

      {/* ── Data source connection cards ────────────────────── */}
      {data?.demo && (
        <div className="grid sm:grid-cols-3 gap-4">
          {[
            {
              provider:  "Ahrefs",
              env:       "AHREFS_API_KEY",
              url:       "https://ahrefs.com/api",
              color:     "border-orange-800/40 bg-orange-950/10",
              iconColor: "text-orange-400",
              note:      "Paid — most accurate keyword data",
            },
            {
              provider:  "Semrush",
              env:       "SEMRUSH_API_KEY",
              url:       "https://www.semrush.com/api-documentation/",
              color:     "border-violet-800/40 bg-violet-950/10",
              iconColor: "text-violet-400",
              note:      "Paid — free tier (10 req/day)",
            },
            {
              provider:  "Google Search Console",
              env:       "GOOGLE_GSC_SITE_URL",
              url:       "https://search.google.com/search-console",
              color:     "border-blue-800/40 bg-blue-950/10",
              iconColor: "text-blue-400",
              note:      "Free — your real impressions & clicks",
            },
          ].map(({ provider, env, url, color, iconColor, note }) => (
            <div key={provider} className={cn("rounded-xl border p-4 text-sm", color)}>
              <div className={cn("flex items-center gap-2 font-semibold mb-1.5", iconColor)}>
                <Key className="w-4 h-4" /> {provider}
              </div>
              <p className="text-muted-foreground text-xs mb-2">{note}</p>
              <code className="block text-xs bg-card/50 border border-border px-2.5 py-1.5 rounded-md font-mono break-all">
                {env}=your_key_here
              </code>
              <a
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                className={cn("inline-flex items-center gap-1 text-xs mt-2 hover:underline", iconColor)}
              >
                Get started <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          ))}
        </div>
      )}

      {/* ── Suburb selector ────────────────────────────────── */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Suburbs ({selected.size} / {allSlugs.length} selected)
          </p>
          <div className="flex gap-2">
            <button
              onClick={selectAll}
              className="text-xs text-primary hover:underline"
            >
              Select all
            </button>
            <span className="text-muted-foreground">·</span>
            <button
              onClick={deselectAll}
              className="text-xs text-muted-foreground hover:text-foreground"
            >
              Clear
            </button>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          {SUBURB_DATA.map((s) => (
            <button
              key={s.slug}
              onClick={() => toggleSuburb(s.slug)}
              className={cn(
                "px-3 py-1 rounded-full text-xs font-medium border transition-colors",
                selected.has(s.slug)
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border text-muted-foreground hover:border-primary/30",
              )}
            >
              {s.suburb} {s.postcode}
            </button>
          ))}
        </div>
      </div>

      {/* ── Filters ────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">Keyword type:</span>
          {(["all", ...ALL_SEASONS] as const).map((s) => (
            <button
              key={s}
              onClick={() => setSeason(s)}
              className={cn(
                "px-2.5 py-1 rounded-md text-xs border transition-colors capitalize",
                season === s
                  ? "border-primary text-primary bg-primary/10"
                  : "border-border text-muted-foreground",
              )}
            >
              {s}
            </button>
          ))}
        </div>
        {data?.rankings && data.rankings.length > 0 && (
          <div className="flex items-center gap-2 ml-auto">
            <button onClick={expandAll}   className="text-xs text-muted-foreground hover:text-foreground">Expand all</button>
            <span className="text-muted-foreground">·</span>
            <button onClick={collapseAll} className="text-xs text-muted-foreground hover:text-foreground">Collapse all</button>
          </div>
        )}
      </div>

      {/* ── Loading ─────────────────────────────────────────── */}
      {isLoading && (
        <div className="flex items-center gap-3 py-12 text-muted-foreground">
          <RefreshCw className="w-5 h-5 animate-spin" />
          <span>Fetching keyword rankings…</span>
        </div>
      )}

      {/* ── Error ───────────────────────────────────────────── */}
      {isError && (
        <div className="rounded-xl border border-red-800/40 bg-red-950/20 p-6 text-red-400 text-sm">
          Failed to load SEO rankings. Check the API server is running.
        </div>
      )}

      {/* ── Rankings per suburb ─────────────────────────────── */}
      {data?.rankings && data.rankings.length > 0 && (
        <div className="space-y-3">
          {data.rankings.map((suburbData) => {
            const isOpen = expanded.has(suburbData.slug);

            const keywords = season === "all"
              ? suburbData.keywords
              : suburbData.keywords.filter((k) => k.keyword.includes(season));

            const avg = avgPos(keywords);
            const posColor = suburbSummaryColor(avg);
            const opps = opportunities(keywords);

            return (
              <div key={suburbData.slug} className="rounded-2xl border border-border overflow-hidden">

                {/* ── Card header ── */}
                <button
                  className="w-full flex items-start justify-between px-5 py-4 bg-card/60 hover:bg-card/80 transition-colors text-left"
                  onClick={() => toggleExpand(suburbData.slug)}
                >
                  <div className="flex items-start gap-4 flex-1 min-w-0">
                    <Globe className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-foreground">{suburbData.suburb}</span>
                        <span className="text-xs text-muted-foreground">{suburbData.postcode}</span>
                      </div>
                      <div className="flex items-center gap-4 mt-1 text-xs text-muted-foreground flex-wrap">
                        <span>
                          Avg pos:{" "}
                          <span className={cn("font-bold", posColor)}>
                            {avg !== null ? avg.toFixed(1) : "—"}
                          </span>
                        </span>
                        <span>
                          Top 10:{" "}
                          <span className="text-emerald-400 font-semibold">
                            {top10Count(keywords)}/{keywords.length}
                          </span>
                        </span>
                        <span>
                          Est. traffic:{" "}
                          <span className="text-foreground">
                            {totalTraffic(keywords).toLocaleString()}/mo
                          </span>
                        </span>
                        {opps.length > 0 && (
                          <span className="flex items-center gap-1 text-amber-400">
                            <Zap className="w-3 h-3" />
                            {opps.length} quick {opps.length === 1 ? "win" : "wins"}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  {isOpen
                    ? <ChevronDown  className="w-4 h-4 text-muted-foreground shrink-0 mt-1" />
                    : <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0 mt-1" />
                  }
                </button>

                {/* ── Expanded keyword table ── */}
                {isOpen && (
                  <div>

                    {/* Opportunities banner */}
                    {opps.length > 0 && (
                      <div className="px-5 py-3 bg-amber-950/20 border-t border-amber-800/30">
                        <p className="text-xs font-semibold text-amber-400 flex items-center gap-1.5 mb-1.5">
                          <Zap className="w-3.5 h-3.5" /> Quick wins — position 11–50, high volume
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {opps.map((k) => (
                            <div key={k.keyword} className="text-xs bg-amber-900/20 border border-amber-800/40 rounded-lg px-2.5 py-1.5">
                              <span className="text-amber-300 font-medium">{k.keyword}</span>
                              <span className="text-muted-foreground ml-2">
                                pos {k.currentPosition} · {k.searchVolume.toLocaleString()} vol
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Keyword table */}
                    <div className="overflow-x-auto">
                      <table className="w-full text-xs">
                        <thead>
                          <tr className="border-t border-b border-border bg-card/30">
                            <th className="px-4 py-2.5 text-left   font-semibold uppercase tracking-wider text-muted-foreground">Keyword</th>
                            <th className="px-4 py-2.5 text-center font-semibold uppercase tracking-wider text-muted-foreground">Pos</th>
                            <th className="px-4 py-2.5 text-center font-semibold uppercase tracking-wider text-muted-foreground">Δ</th>
                            <th className="px-4 py-2.5 text-right  font-semibold uppercase tracking-wider text-muted-foreground">Volume</th>
                            <th className="px-4 py-2.5 text-left   font-semibold uppercase tracking-wider text-muted-foreground">Difficulty</th>
                            <th className="px-4 py-2.5 text-right  font-semibold uppercase tracking-wider text-muted-foreground">Traffic</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-border/50">
                          {keywords.length === 0 ? (
                            <tr>
                              <td colSpan={6} className="text-center text-muted-foreground py-4">
                                No keywords match the "{season}" filter for this suburb.
                              </td>
                            </tr>
                          ) : (
                            keywords.map((kw) => (
                              <tr
                                key={kw.keyword}
                                className={cn(
                                  "hover:bg-card/20 transition-colors",
                                  opps.some((o) => o.keyword === kw.keyword) && "bg-amber-950/10",
                                )}
                              >
                                <td className="px-4 py-2.5 font-medium text-foreground max-w-xs">
                                  <span className="block truncate">{kw.keyword}</span>
                                </td>
                                <td className="px-4 py-2.5 text-center">
                                  {positionBadge(kw.currentPosition)}
                                </td>
                                <td className="px-4 py-2.5">
                                  {changeCell(kw.positionChange)}
                                </td>
                                <td className="px-4 py-2.5 text-right tabular-nums text-foreground">
                                  {kw.searchVolume.toLocaleString()}
                                </td>
                                <td className="px-4 py-2.5">
                                  {difficultyBar(kw.difficulty)}
                                </td>
                                <td className="px-4 py-2.5 text-right tabular-nums text-foreground">
                                  {kw.traffic.toLocaleString()}
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* ── Footer ─────────────────────────────────────────── */}
      {dataUpdatedAt > 0 && (
        <p className="text-xs text-muted-foreground">
          Last fetched: {new Date(dataUpdatedAt).toLocaleTimeString()} ·{" "}
          {data?.demo
            ? "Demo data — connect Ahrefs, Semrush, or Google Search Console above"
            : `Live data from ${data?.source}`
          }
        </p>
      )}
    </div>
  );
}
