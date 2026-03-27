import { Router, type IRouter } from "express";
import { db, bookingsTable } from "@workspace/db";
import { sql, desc, gte, and, ne } from "drizzle-orm";
import https from "node:https";

const router: IRouter = Router();

/* ── Helper: fetch from external URL ──────────────────────── */
function httpsGet(url: string, headers: Record<string, string> = {}): Promise<unknown> {
  return new Promise((resolve, reject) => {
    const req = https.get(url, { headers }, (res) => {
      let body = "";
      res.on("data", (c: Buffer) => (body += c.toString()));
      res.on("end", () => {
        try { resolve(JSON.parse(body)); }
        catch { reject(new Error("JSON parse error")); }
      });
    });
    req.on("error", reject);
    req.setTimeout(10_000, () => { req.destroy(); reject(new Error("Timeout")); });
  });
}

/* ═══════════════════════════════════════════════════════════
   GET /analytics/suburb-performance
   Aggregates booking revenue, counts, and conversion metrics
   grouped by suburb + postcode.
   ─────────────────────────────────────────────────────────── */
router.get("/analytics/suburb-performance", async (req, res): Promise<void> => {
  try {
    /* Optional date range (defaults to last 365 days) */
    const days = parseInt(String(req.query.days ?? "365"), 10);
    const since = new Date(Date.now() - days * 86_400_000);

    const rows = await db
      .select({
        suburb:             bookingsTable.suburb,
        postcode:           bookingsTable.postcode,
        state:              bookingsTable.state,
        bookingCount:       sql<number>`count(*)::int`,
        completedCount:     sql<number>`count(*) filter (where ${bookingsTable.status} = 'completed')::int`,
        confirmedCount:     sql<number>`count(*) filter (where ${bookingsTable.status} in ('confirmed','in_progress','completed'))::int`,
        cancelledCount:     sql<number>`count(*) filter (where ${bookingsTable.status} = 'cancelled')::int`,
        totalRevenueCents:  sql<number>`coalesce(sum(${bookingsTable.quoteAmountCents} + ${bookingsTable.gstAmountCents}), 0)::int`,
        avgOrderValueCents: sql<number>`coalesce(avg(${bookingsTable.quoteAmountCents} + ${bookingsTable.gstAmountCents}), 0)::int`,
        maxRevenueCents:    sql<number>`coalesce(max(${bookingsTable.quoteAmountCents} + ${bookingsTable.gstAmountCents}), 0)::int`,
        firstBookingDate:   sql<string>`min(${bookingsTable.createdAt})::text`,
        lastBookingDate:    sql<string>`max(${bookingsTable.createdAt})::text`,
      })
      .from(bookingsTable)
      .where(
        and(
          gte(bookingsTable.createdAt, since),
          ne(bookingsTable.suburb, ""),
        )
      )
      .groupBy(bookingsTable.suburb, bookingsTable.postcode, bookingsTable.state)
      .orderBy(desc(sql`sum(${bookingsTable.quoteAmountCents} + ${bookingsTable.gstAmountCents})`));

    /* Enrich with derived metrics */
    const enriched = rows.map((r) => ({
      ...r,
      conversionRate: r.bookingCount > 0
        ? Math.round((r.completedCount / r.bookingCount) * 100)
        : 0,
      cancellationRate: r.bookingCount > 0
        ? Math.round((r.cancelledCount / r.bookingCount) * 100)
        : 0,
    }));

    /* Summary row */
    const summary = {
      totalSuburbs:      enriched.length,
      totalBookings:     enriched.reduce((s, r) => s + r.bookingCount,       0),
      totalRevenueCents: enriched.reduce((s, r) => s + r.totalRevenueCents,   0),
      avgConversionRate: enriched.length > 0
        ? Math.round(enriched.reduce((s, r) => s + r.conversionRate, 0) / enriched.length)
        : 0,
    };

    res.json({ suburbs: enriched, summary, since: since.toISOString(), days });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    res.status(500).json({ error: `suburb-performance failed: ${msg}` });
  }
});

/* ═══════════════════════════════════════════════════════════
   GET /analytics/seo-rankings
   Returns keyword rankings per suburb.
   – If AHREFS_API_KEY is set → calls Ahrefs Data for SEO API
   – If SEMRUSH_API_KEY  is set → calls Semrush API
   – Otherwise returns realistic mock data with a "demo" flag
   ─────────────────────────────────────────────────────────── */

interface KeywordRow {
  keyword:         string;
  currentPosition: number;
  previousPosition: number | null;
  positionChange:  number;
  searchVolume:    number;
  difficulty:      number;
  url:             string;
  traffic:         number;
}

interface SuburbRanking {
  suburb:   string;
  postcode: string;
  slug:     string;
  keywords: KeywordRow[];
  source:   "ahrefs" | "semrush" | "demo";
}

/* Generate target keywords for each suburb */
function targetKeywords(suburb: string, postcode: string): string[] {
  return [
    `cleaning services ${suburb}`,
    `spring cleaning ${suburb} ${postcode}`,
    `winter cleaning ${suburb}`,
    `end of lease cleaning ${suburb}`,
    `deep clean ${suburb} ${postcode}`,
    `house cleaning ${suburb}`,
    `${suburb} cleaning service`,
    `mould removal ${suburb}`,
    `pollen cleaning ${suburb}`,
  ];
}

/* Realistic mock rankings — seeded from suburb name length */
function mockRankings(suburb: string, postcode: string): KeywordRow[] {
  const seed = suburb.charCodeAt(0) + suburb.length;
  const keywords = targetKeywords(suburb, postcode);

  return keywords.map((keyword, i) => {
    const base      = ((seed * (i + 7)) % 40) + 1;
    const prev      = Math.max(1, base + Math.floor((seed % 7) - 3));
    const volume    = [480, 1200, 590, 320, 210, 720, 390, 150, 110][i % 9];
    const traffic   = Math.round(volume * (1 / base) * 0.25 * 100) / 100;
    return {
      keyword,
      currentPosition:  base,
      previousPosition: prev,
      positionChange:   prev - base,   /* positive = improved */
      searchVolume:     volume,
      difficulty:       30 + ((seed * i) % 50),
      url:              `https://aussieclean.com.au/suburb/${suburb.toLowerCase().replace(/\s+/g, "-")}-${postcode}`,
      traffic:          Math.round(traffic),
    };
  });
}

/* Ahrefs Data for SEO — v3 organic keywords */
async function ahrefsRankings(suburb: string, postcode: string, apiKey: string): Promise<KeywordRow[]> {
  const domain = "aussieclean.com.au";
  const encoded = encodeURIComponent(`/suburb/${suburb.toLowerCase().replace(/\s+/g, "-")}-${postcode}`);
  const url = `https://api.ahrefs.com/v3/site-explorer/organic-keywords?select=keyword,position,prev_pos,volume,difficulty,traffic&target=${domain}&url=${encoded}&country=au&limit=10`;

  const data = await httpsGet(url, {
    Authorization: `Bearer ${apiKey}`,
    Accept: "application/json",
  }) as { organicKeywords?: { keyword: string; position: number; prev_pos: number; volume: number; difficulty: number; traffic: number }[] };

  const rows = data?.organicKeywords ?? [];
  return rows.map((r) => ({
    keyword:          r.keyword,
    currentPosition:  r.position,
    previousPosition: r.prev_pos ?? null,
    positionChange:   r.prev_pos != null ? r.prev_pos - r.position : 0,
    searchVolume:     r.volume   ?? 0,
    difficulty:       r.difficulty ?? 0,
    url:              `https://aussieclean.com.au/suburb/${suburb.toLowerCase().replace(/\s+/g, "-")}-${postcode}`,
    traffic:          r.traffic ?? 0,
  }));
}

/* Semrush API — organic keyword positions */
async function semrushRankings(suburb: string, postcode: string, apiKey: string): Promise<KeywordRow[]> {
  const keywords = targetKeywords(suburb, postcode);
  const results: KeywordRow[] = [];

  for (const kw of keywords.slice(0, 5)) {
    const url = `https://api.semrush.com/?type=phrase_organic&phrase=${encodeURIComponent(kw)}&key=${apiKey}&database=au&display_limit=1&export_columns=Ph,Po,Pp,Nq,Kd`;
    const csv = await httpsGet(url, {}) as string;

    if (typeof csv === "string" && csv.includes(kw)) {
      const [, pos, prevPos, volume, difficulty] = csv.split("\n")[1]?.split(";") ?? [];
      results.push({
        keyword:          kw,
        currentPosition:  parseInt(pos ?? "99", 10),
        previousPosition: parseInt(prevPos ?? "99", 10),
        positionChange:   parseInt(prevPos ?? "0", 10) - parseInt(pos ?? "0", 10),
        searchVolume:     parseInt(volume ?? "0", 10),
        difficulty:       parseInt(difficulty ?? "0", 10),
        url:              `https://aussieclean.com.au/suburb/${suburb.toLowerCase().replace(/\s+/g, "-")}-${postcode}`,
        traffic:          0,
      });
    }
  }
  return results;
}

router.get("/analytics/seo-rankings", async (req, res): Promise<void> => {
  const slugs = String(req.query.slugs ?? "").split(",").filter(Boolean);

  if (slugs.length === 0) {
    res.status(400).json({ error: "Provide ?slugs=chatswood-2067,richmond-3121 etc." });
    return;
  }
  if (slugs.length > 20) {
    res.status(400).json({ error: "Max 20 slugs per request." });
    return;
  }

  const ahrefsKey  = process.env.AHREFS_API_KEY;
  const semrushKey = process.env.SEMRUSH_API_KEY;
  const source: "ahrefs" | "semrush" | "demo" = ahrefsKey ? "ahrefs" : semrushKey ? "semrush" : "demo";

  const results: SuburbRanking[] = await Promise.allSettled(
    slugs.map(async (slug) => {
      const parts    = slug.split("-");
      const postcode = parts[parts.length - 1] ?? slug;
      const suburb   = parts.slice(0, -1).map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");

      let keywords: KeywordRow[];
      try {
        if (ahrefsKey)        keywords = await ahrefsRankings(suburb, postcode, ahrefsKey);
        else if (semrushKey)  keywords = await semrushRankings(suburb, postcode, semrushKey);
        else                  keywords = mockRankings(suburb, postcode);
      } catch {
        keywords = mockRankings(suburb, postcode);
      }

      return { suburb, postcode, slug, keywords, source };
    })
  ).then((results) =>
    results
      .filter((r): r is PromiseFulfilledResult<SuburbRanking> => r.status === "fulfilled")
      .map((r) => r.value)
  );

  res.json({
    rankings: results,
    source,
    demo: source === "demo",
    demoNote: source === "demo"
      ? "Set AHREFS_API_KEY or SEMRUSH_API_KEY environment variable for real data."
      : undefined,
    timestamp: new Date().toISOString(),
  });
});

/* ═══════════════════════════════════════════════════════════
   GET /analytics/suburb-revenue-trend
   Returns weekly revenue for a single suburb over 12 weeks
   ─────────────────────────────────────────────────────────── */
router.get("/analytics/suburb-revenue-trend", async (req, res): Promise<void> => {
  const { postcode } = req.query;
  if (!postcode) {
    res.status(400).json({ error: "?postcode= required" });
    return;
  }

  try {
    const rows = await db
      .select({
        week:               sql<string>`date_trunc('week', ${bookingsTable.createdAt})::date::text`,
        revenueCents:       sql<number>`coalesce(sum(${bookingsTable.quoteAmountCents} + ${bookingsTable.gstAmountCents}), 0)::int`,
        bookings:           sql<number>`count(*)::int`,
      })
      .from(bookingsTable)
      .where(
        and(
          sql`${bookingsTable.postcode} = ${String(postcode)}`,
          gte(bookingsTable.createdAt, new Date(Date.now() - 84 * 86_400_000)), // 12 weeks
        )
      )
      .groupBy(sql`date_trunc('week', ${bookingsTable.createdAt})::date`)
      .orderBy(sql`date_trunc('week', ${bookingsTable.createdAt})::date`);

    res.json({ postcode, weeks: rows });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    res.status(500).json({ error: `suburb-revenue-trend failed: ${msg}` });
  }
});

export default router;
