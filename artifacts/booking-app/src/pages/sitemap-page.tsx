import { Link } from "wouter";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { SkipToContent } from "@/components/layout/SkipToContent";
import { SUBURB_DATA } from "@/data/suburbs";
import { ALL_SEASONS, SEASONAL_CONTENT } from "@/data/seasonal-content";
import { buildSuburbSeasonSitemapEntries } from "@/lib/schema-builder";

const SEASON_EMOJI: Record<string, string> = {
  spring: "🌸", summer: "☀️", autumn: "🍂", winter: "❄️",
};

const STATIC_PAGES = [
  { href: "/",          label: "Home — AussieClean Seasonal Cleaning",  priority: "1.0", freq: "Daily"   },
  { href: "/booking",   label: "Book a Clean Online",                    priority: "0.9", freq: "Weekly"  },
  { href: "/dashboard", label: "My Bookings Dashboard",                  priority: "0.7", freq: "Monthly" },
  { href: "/sitemap",   label: "Site Map",                               priority: "0.5", freq: "Monthly" },
];

export default function SitemapPage() {
  const slugs   = SUBURB_DATA.map((s) => s.slug);
  const entries = buildSuburbSeasonSitemapEntries(slugs, ALL_SEASONS);

  return (
    <div className="min-h-screen flex flex-col pt-20">
      <SkipToContent />
      <Navbar />

      <main id="main-content" className="flex-1 bg-background text-foreground">
        <section className="max-w-5xl mx-auto px-4 py-16 sm:py-24">

          <div className="mb-12">
            <h1 className="text-4xl font-bold mb-3">AussieClean — Site Map</h1>
            <p className="text-muted-foreground text-lg">
              Browse every cleaning service page by suburb and season.
              Currently <strong className="text-foreground">{entries.length + STATIC_PAGES.length - 1}</strong> pages indexed — updated monthly.
            </p>
          </div>

          {/* ── Static pages ─────────────────────────────────── */}
          <div className="mb-14">
            <h2 className="text-xl font-semibold mb-4 text-foreground">Core Pages</h2>
            <ul className="space-y-2" role="list">
              {STATIC_PAGES.map(({ href, label, priority, freq }) => (
                <li key={href} className="flex items-center gap-3">
                  <Link href={href}>
                    <span className="text-primary hover:underline cursor-pointer">{label}</span>
                  </Link>
                  <span className="text-xs text-muted-foreground ml-auto tabular-nums">
                    priority {priority} · {freq}
                  </span>
                </li>
              ))}
            </ul>
          </div>

          {/* ── Suburb overview pages ─────────────────────────── */}
          <div className="mb-14">
            <h2 className="text-xl font-semibold mb-4 text-foreground">
              Suburb Cleaning Pages ({SUBURB_DATA.length} suburbs)
            </h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {SUBURB_DATA.map((s) => (
                <div key={s.slug} className="border border-border/50 rounded-xl p-4 bg-card/30">
                  <Link href={`/suburb/${s.slug}`}>
                    <span className="font-semibold text-primary hover:underline cursor-pointer block mb-1">
                      {s.suburb} {s.postcode}
                    </span>
                  </Link>
                  <p className="text-xs text-muted-foreground mb-3">{s.region} · {s.stateCode}</p>
                  <div className="flex flex-wrap gap-1.5">
                    {ALL_SEASONS.map((season) => (
                      <Link key={season} href={`/suburb/${s.slug}/${season}`}>
                        <span className="text-xs px-2 py-0.5 rounded-md border border-border/50 text-muted-foreground hover:text-foreground hover:border-border transition-colors cursor-pointer">
                          <span aria-hidden="true">{SEASON_EMOJI[season]}</span>{" "}
                          {SEASONAL_CONTENT[season].label}
                        </span>
                      </Link>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* ── Season index ──────────────────────────────────── */}
          <div className="mb-14">
            <h2 className="text-xl font-semibold mb-4 text-foreground">
              Season-Specific Pages ({SUBURB_DATA.length * ALL_SEASONS.length} total)
            </h2>
            {ALL_SEASONS.map((season) => (
              <div key={season} className="mb-8">
                <h3 className="text-base font-semibold mb-3 flex items-center gap-2">
                  <span aria-hidden="true">{SEASON_EMOJI[season]}</span>
                  <span>{SEASONAL_CONTENT[season].label} Cleaning</span>
                  <span className="text-xs text-muted-foreground font-normal">
                    — from {SEASONAL_CONTENT[season].fromPrice}
                  </span>
                </h3>
                <ul className="grid sm:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-1.5">
                  {SUBURB_DATA.map((s) => (
                    <li key={s.slug}>
                      <Link href={`/suburb/${s.slug}/${season}`}>
                        <span className="text-sm text-primary hover:underline cursor-pointer">
                          {SEASONAL_CONTENT[season].label} Cleaning — {s.suburb} {s.postcode}
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          {/* ── XML sitemap tip ───────────────────────────────── */}
          <div className="rounded-xl border border-border/50 bg-card/30 p-5 text-sm text-muted-foreground">
            <strong className="text-foreground block mb-1">For Search Engines</strong>
            Submit <code className="text-primary">/sitemap.xml</code> to Google Search Console and Bing Webmaster Tools.
            Every suburb × season combination is individually indexed with unique JSON-LD schema
            (FAQPage + HowTo + LocalBusiness + Speakable).
          </div>

        </section>
      </main>

      <Footer />
    </div>
  );
}
