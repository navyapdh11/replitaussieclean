import { useState } from "react";
import {
  TrendingUp, TrendingDown, Minus, Search, RefreshCw,
  AlertCircle, ExternalLink, ChevronDown, ChevronRight,
  Key, Globe,
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
  source:   "ahrefs" | "semrush" | "demo";
}

interface SeoResponse {
  rankings: SuburbRanking[];
  source:   "ahrefs" | "semrush" | "demo";
  demo:     boolean;
  demoNote: string | undefined;
  timestamp: string;
}

/* ── Helpers ─────────────────────────────────────────────── */
function positionBadge(pos: number) {
  const cls =
    pos <= 3  ? "bg-emerald-900/40 text-emerald-300 font-extrabold" :
    pos <= 10 ? "bg-emerald-900/20 text-emerald-400" :
    pos <= 20 ? "bg-amber-900/30   text-amber-400"   :
    pos <= 50 ? "bg-orange-900/30  text-orange-400"  :
                "bg-red-900/30     text-red-400";
  return (
    <span className={cn("inline-block text-center w-8 text-xs font-semibold px-1 py-0.5 rounded", cls)}>
      {pos}
    </span>
  );
}

function changeCell(change: number) {
  if (change > 0) return (
    <span className="flex items-center gap-0.5 text-emerald-400 text-xs font-semibold">
      <TrendingUp className="w-3.5 h-3.5" />+{change}
    </span>
  );
  if (change < 0) return (
    <span className="flex items-center gap-0.5 text-red-400 text-xs font-semibold">
      <TrendingDown className="w-3.5 h-3.5" />{change}
    </span>
  );
  return <Minus className="w-3.5 h-3.5 text-muted-foreground" />;
}

function difficultyBar(val: number) {
  const w   = Math.min(val, 100);
  const cls = val < 30 ? "bg-emerald-500" : val < 60 ? "bg-amber-500" : "bg-red-500";
  return (
    <div className="flex items-center gap-2">
      <div className="w-16 h-1.5 bg-border rounded-full overflow-hidden">
        <div className={cn("h-full rounded-full", cls)} style={{ width: `${w}%` }} />
      </div>
      <span className="text-xs tabular-nums">{val}</span>
    </div>
  );
}

/* ── Source badge ────────────────────────────────────────── */
function SourceBadge({ source }: { source: "ahrefs" | "semrush" | "demo" }) {
  if (source === "ahrefs")  return <span className="text-xs bg-orange-900/30 text-orange-300 px-2 py-0.5 rounded-full font-semibold">Ahrefs</span>;
  if (source === "semrush") return <span className="text-xs bg-violet-900/30 text-violet-300 px-2 py-0.5 rounded-full font-semibold">Semrush</span>;
  return <span className="text-xs bg-slate-700/50 text-slate-400 px-2 py-0.5 rounded-full font-semibold">Demo data</span>;
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

/* ── Main component ──────────────────────────────────────── */
export function SeoRankingTab() {
  /* Suburb selection: default first 6 */
  const allSlugs   = SUBURB_DATA.map((s) => s.slug);
  const [selected, setSelected] = useState<Set<string>>(new Set(allSlugs.slice(0, 6)));
  const [expanded, setExpanded] = useState<Set<string>>(new Set([allSlugs[0] ?? ""]));
  const [season,   setSeason]   = useState<string>("all");

  const slugArray = [...selected];
  const { data, isLoading, isError, refetch, isFetching, dataUpdatedAt } = useSeoRankings(slugArray);

  function toggleSuburb(slug: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(slug)) { next.delete(slug); } else { next.add(slug); }
      return next;
    });
  }

  function toggleExpand(slug: string) {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(slug)) { next.delete(slug); } else { next.add(slug); }
      return next;
    });
  }

  /* ── Average position across all keywords ──────────────── */
  function avgPosition(keywords: KeywordRow[]) {
    if (!keywords.length) return "—";
    const avg = keywords.reduce((s, k) => s + k.currentPosition, 0) / keywords.length;
    return avg.toFixed(1);
  }

  /* ── Top-10 keyword count ──────────────────────────────── */
  function top10Count(keywords: KeywordRow[]) {
    return keywords.filter((k) => k.currentPosition <= 10).length;
  }

  /* ── Total estimated traffic ───────────────────────────── */
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
          <div>
            <strong>Demo mode — </strong>showing realistic simulated rankings.{" "}
            <span className="text-amber-400/80">
              Set <code className="bg-amber-900/40 px-1 rounded">AHREFS_API_KEY</code> or{" "}
              <code className="bg-amber-900/40 px-1 rounded">SEMRUSH_API_KEY</code>{" "}
              in the environment to connect real data.
            </span>
          </div>
        </div>
      )}

      {/* ── Connect API keys prompt ─────────────────────────── */}
      {data?.demo && (
        <div className="grid sm:grid-cols-2 gap-4">
          {[
            {
              provider: "Ahrefs",
              env: "AHREFS_API_KEY",
              url: "https://ahrefs.com/api",
              color: "border-orange-800/40 bg-orange-950/10",
              iconColor: "text-orange-400",
            },
            {
              provider: "Semrush",
              env: "SEMRUSH_API_KEY",
              url: "https://www.semrush.com/api-documentation/",
              color: "border-violet-800/40 bg-violet-950/10",
              iconColor: "text-violet-400",
            },
          ].map(({ provider, env, url, color, iconColor }) => (
            <div key={provider} className={cn("rounded-xl border p-4 text-sm", color)}>
              <div className={cn("flex items-center gap-2 font-semibold mb-2", iconColor)}>
                <Key className="w-4 h-4" /> Connect {provider}
              </div>
              <p className="text-muted-foreground text-xs mb-3">
                Add your API key to see real keyword positions, search volume and traffic data.
              </p>
              <code className="block text-xs bg-card/50 border border-border px-3 py-2 rounded-lg font-mono">
                {env}=your_key_here
              </code>
              <a
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                className={cn("inline-flex items-center gap-1 text-xs mt-2 hover:underline", iconColor)}
              >
                Get API key <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          ))}
        </div>
      )}

      {/* ── Suburb selector ────────────────────────────────── */}
      <div>
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
          Suburbs ({selected.size} selected)
        </p>
        <div className="flex flex-wrap gap-2">
          {SUBURB_DATA.map((s) => (
            <button
              key={s.slug}
              onClick={() => toggleSuburb(s.slug)}
              className={cn(
                "px-3 py-1 rounded-full text-xs font-medium border transition-colors",
                selected.has(s.slug)
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border text-muted-foreground hover:border-border/80",
              )}
            >
              {s.suburb} {s.postcode}
            </button>
          ))}
        </div>
      </div>

      {/* ── Season filter ──────────────────────────────────── */}
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-xs text-muted-foreground">Filter keyword type:</span>
        {(["all", ...ALL_SEASONS] as const).map((s) => (
          <button
            key={s}
            onClick={() => setSeason(s)}
            className={cn(
              "px-2.5 py-1 rounded-md text-xs border transition-colors capitalize",
              season === s ? "border-primary text-primary bg-primary/10" : "border-border text-muted-foreground",
            )}
          >
            {s}
          </button>
        ))}
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
        <div className="space-y-4">
          {data.rankings.map((suburbData) => {
            const isOpen = expanded.has(suburbData.slug);

            /* Filter keywords by season if not "all" */
            const keywords = season === "all"
              ? suburbData.keywords
              : suburbData.keywords.filter((k) => k.keyword.includes(season));

            const posColor =
              Number(avgPosition(keywords)) <= 5  ? "text-emerald-400" :
              Number(avgPosition(keywords)) <= 15 ? "text-amber-400"   : "text-red-400";

            return (
              <div
                key={suburbData.slug}
                className="rounded-2xl border border-border overflow-hidden"
              >
                {/* Card header */}
                <button
                  className="w-full flex items-center justify-between px-5 py-4 bg-card/60 hover:bg-card/80 transition-colors text-left"
                  onClick={() => toggleExpand(suburbData.slug)}
                >
                  <div className="flex items-center gap-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <Globe className="w-4 h-4 text-primary" />
                        <span className="font-semibold text-foreground">
                          {suburbData.suburb}
                        </span>
                        <span className="text-xs text-muted-foreground">{suburbData.postcode}</span>
                      </div>
                      <div className="flex items-center gap-4 mt-1 text-xs text-muted-foreground">
                        <span>Avg position: <span className={cn("font-bold", posColor)}>{avgPosition(keywords)}</span></span>
                        <span>Top 10: <span className="text-emerald-400 font-semibold">{top10Count(keywords)}/{keywords.length}</span></span>
                        <span>Est. traffic: <span className="text-foreground">{totalTraffic(keywords).toLocaleString()}/mo</span></span>
                      </div>
                    </div>
                  </div>
                  {isOpen
                    ? <ChevronDown  className="w-4 h-4 text-muted-foreground shrink-0" />
                    : <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
                  }
                </button>

                {/* Keyword table */}
                {isOpen && (
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="border-t border-b border-border bg-card/30">
                          <th className="px-4 py-2.5 text-left text-muted-foreground font-semibold uppercase tracking-wider">Keyword</th>
                          <th className="px-4 py-2.5 text-center text-muted-foreground font-semibold uppercase tracking-wider">Pos</th>
                          <th className="px-4 py-2.5 text-center text-muted-foreground font-semibold uppercase tracking-wider">Change</th>
                          <th className="px-4 py-2.5 text-right text-muted-foreground font-semibold uppercase tracking-wider">Volume</th>
                          <th className="px-4 py-2.5 text-left text-muted-foreground font-semibold uppercase tracking-wider">Difficulty</th>
                          <th className="px-4 py-2.5 text-right text-muted-foreground font-semibold uppercase tracking-wider">Traffic</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border/50">
                        {keywords.map((kw) => (
                          <tr key={kw.keyword} className="hover:bg-card/20 transition-colors">
                            <td className="px-4 py-2.5 font-medium text-foreground max-w-xs truncate">
                              {kw.keyword}
                            </td>
                            <td className="px-4 py-2.5 text-center">
                              {positionBadge(kw.currentPosition)}
                            </td>
                            <td className="px-4 py-2.5 text-center">
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
                        ))}
                      </tbody>
                    </table>

                    {keywords.length === 0 && (
                      <p className="text-center text-muted-foreground text-xs py-4">
                        No keywords match the "{season}" filter for this suburb.
                      </p>
                    )}
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
          Last updated: {new Date(dataUpdatedAt).toLocaleTimeString()} ·{" "}
          {data?.demo ? "Demo data — no API key connected" : `Live data from ${data?.source}`}
        </p>
      )}
    </div>
  );
}
