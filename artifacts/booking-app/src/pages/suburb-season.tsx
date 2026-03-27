import { useEffect } from "react";
import { Link, useParams } from "wouter";
import { ChevronRight, MapPin, Star, Calendar, Shield, Zap } from "lucide-react";
import {
  SEASONAL_CONTENT,
  ALL_SEASONS,
  fillTemplate,
  fillFaqs,
  fillAtomicAnswers,
  fillHowTo,
  type Season,
} from "@/data/seasonal-content";
import { SUBURB_DATA, getSuburb } from "@/data/suburbs";
import { buildSeasonalSuburbSchema } from "@/lib/schema-builder";
import { HowToSection } from "@/components/home/HowToSection";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/* ── Colour map per season ───────────────────────────────── */
const SEASON_COLOURS: Record<Season, { bg: string; border: string; text: string; badge: string }> = {
  spring: { bg: "bg-emerald-950/30", border: "border-emerald-800/40", text: "text-emerald-400", badge: "bg-emerald-900/50 text-emerald-300" },
  summer: { bg: "bg-amber-950/30",   border: "border-amber-800/40",   text: "text-amber-400",   badge: "bg-amber-900/50 text-amber-300"   },
  autumn: { bg: "bg-orange-950/30",  border: "border-orange-800/40",  text: "text-orange-400",  badge: "bg-orange-900/50 text-orange-300"  },
  winter: { bg: "bg-blue-950/30",    border: "border-blue-800/40",    text: "text-blue-400",    badge: "bg-blue-900/50 text-blue-300"      },
};

/* ── Season emoji ────────────────────────────────────────── */
const SEASON_EMOJI: Record<Season, string> = {
  spring: "🌸", summer: "☀️", autumn: "🍂", winter: "❄️",
};

/* ── Not found ───────────────────────────────────────────── */
function SuburbSeasonNotFound({ slug, season }: { slug?: string; season?: string }) {
  return (
    <main id="main-content" className="min-h-screen bg-background flex flex-col items-center justify-center px-4 py-24 text-center">
      <h1 className="text-4xl font-bold text-foreground mb-4">Page not found</h1>
      <p className="text-muted-foreground mb-8 max-w-md">
        {!ALL_SEASONS.includes(season as Season)
          ? `"${season}" is not a valid season. Choose one of: Spring, Summer, Autumn, Winter.`
          : `We don't have a page for "${slug}" yet.`}
      </p>
      <div className="flex flex-wrap gap-4 justify-center">
        {SUBURB_DATA.slice(0, 7).map((s) => (
          <Link key={s.slug} href={`/suburb/${s.slug}`}>
            <span className="px-4 py-2 rounded-lg bg-card border border-border text-sm text-foreground hover:border-primary/60 transition-colors cursor-pointer">
              {s.suburb} {s.postcode}
            </span>
          </Link>
        ))}
      </div>
      <Link href="/booking" className="mt-8">
        <Button>Book Anywhere in Australia</Button>
      </Link>
    </main>
  );
}

/* ── Main page ───────────────────────────────────────────── */
export default function SuburbSeasonPage() {
  const params = useParams<{ slug: string; season: string }>();
  const slug   = params.slug   ?? "";
  const season = (params.season ?? "") as Season;

  const data    = getSuburb(slug);
  const content = SEASONAL_CONTENT[season];

  /* Inject JSON-LD + update document title */
  useEffect(() => {
    if (!data || !content) return;

    const filledFaqs  = fillFaqs(content.faqs, data.suburb, data.postcode);
    const filledHowTo = fillHowTo(content.howTo, data.suburb, data.postcode);
    const schema      = buildSeasonalSuburbSchema({
      data,
      season,
      seasonLabel: content.label,
      filledFaqs,
      filledHowTo,
      metaTitle: fillTemplate(content.metaTitle, data.suburb, data.postcode),
    });

    const script      = document.createElement("script");
    script.type       = "application/ld+json";
    script.id         = "suburb-season-schema";
    script.text       = JSON.stringify(schema);
    document.head.appendChild(script);

    document.title = fillTemplate(content.metaTitle, data.suburb, data.postcode);

    const desc = document.querySelector("meta[name='description']");
    if (desc) desc.setAttribute("content", fillTemplate(content.metaDescription, data.suburb, data.postcode));

    return () => {
      document.getElementById("suburb-season-schema")?.remove();
    };
  }, [data, content, season]);

  if (!data || !content) {
    return <SuburbSeasonNotFound slug={slug} season={season} />;
  }

  const colours        = SEASON_COLOURS[season];
  const emoji          = SEASON_EMOJI[season];
  const filledFaqs     = fillFaqs(content.faqs, data.suburb, data.postcode);
  const filledAnswers  = fillAtomicAnswers(content.atomicAnswers, data.suburb, data.postcode);
  const filledHowTo    = fillHowTo(content.howTo, data.suburb, data.postcode);
  const filledHero     = fillTemplate(content.heroSubtext, data.suburb, data.postcode);
  const filledHeading  = fillTemplate(content.heroHeading, data.suburb, data.postcode);

  return (
    <main id="main-content" className="bg-background text-foreground">

      {/* ── Hero ─────────────────────────────────────────────── */}
      <section className={cn("relative border-b border-border/50 py-20 px-4", colours.bg)}>
        <div className="max-w-5xl mx-auto">

          {/* Breadcrumb */}
          <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-sm text-muted-foreground mb-8">
            <Link href="/"><span className="hover:text-foreground transition-colors cursor-pointer">Home</span></Link>
            <ChevronRight className="w-3.5 h-3.5" />
            <Link href={`/suburb/${data.slug}`}><span className="hover:text-foreground transition-colors cursor-pointer">{data.suburb} {data.postcode}</span></Link>
            <ChevronRight className="w-3.5 h-3.5" />
            <span className="text-foreground">{content.label} Clean</span>
          </nav>

          {/* Season badge */}
          <div className="mb-5">
            <span className={cn("inline-flex items-center gap-2 text-sm font-medium px-3 py-1.5 rounded-full border", colours.badge, colours.border)}>
              <span>{emoji}</span> {content.label} 2025 Special
            </span>
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight leading-tight mb-6">
            {filledHeading}
          </h1>

          <p className="hero-text text-lg text-muted-foreground max-w-2xl mb-10 leading-relaxed">
            {filledHero}
          </p>

          <div className="flex flex-wrap gap-4 items-center">
            <Link href={`/booking?suburb=${data.slug}&season=${season}`}>
              <Button size="lg" className={cn("font-semibold px-8")}>
                {fillTemplate(content.ctaText, data.suburb, data.postcode)}
              </Button>
            </Link>
            <Link href="#faq">
              <Button variant="outline" size="lg">Common Questions</Button>
            </Link>
          </div>

          {/* Meta strip */}
          <div className="mt-12 grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
              { icon: Star,     label: `${data.rating}★ rating`,   value: `${data.reviewCount} reviews` },
              { icon: Zap,      label: "From",                       value: content.fromPrice          },
              { icon: Calendar, label: "Duration",                   value: content.duration           },
              { icon: Shield,   label: "Guarantee",                  value: "48-hr re-clean"           },
            ].map(({ icon: Icon, label, value }) => (
              <div key={label} className={cn("rounded-xl border p-4 text-center", colours.border, colours.bg)}>
                <Icon className={cn("w-5 h-5 mx-auto mb-1", colours.text)} />
                <div className="text-xs text-muted-foreground">{label}</div>
                <div className="text-sm font-semibold mt-0.5">{value}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Atomic Answers ───────────────────────────────────── */}
      <section className="py-16 px-4 border-b border-border/50">
        <div className="max-w-4xl mx-auto space-y-12">
          {filledAnswers.map((a, i) => (
            <div key={i}>
              <h2 className="text-2xl font-bold mb-3">{a.question}</h2>
              <p className="atomic-answer text-muted-foreground leading-relaxed text-lg">{a.answer}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── HowTo Section ────────────────────────────────────── */}
      <HowToSection
        suburb={data.suburb}
        postcode={data.postcode}
        season={season}
        overrideSteps={filledHowTo.steps}
        overrideName={filledHowTo.name}
        overrideDescription={filledHowTo.description}
        overrideSupplies={filledHowTo.supply}
        overrideTools={filledHowTo.tool}
        overrideTotalTime={filledHowTo.totalTime}
      />

      {/* ── FAQ Section ──────────────────────────────────────── */}
      <section id="faq" className="py-16 px-4 border-b border-border/50 scroll-mt-24">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold mb-10">
            Frequently Asked Questions — {content.label} Cleaning in {data.suburb} {data.postcode}
          </h2>
          <div className="space-y-2">
            {filledFaqs.map((faq, i) => (
              <details key={i} className="group border border-border/50 rounded-xl overflow-hidden">
                <summary className="faq-question flex items-center justify-between gap-4 px-5 py-4 cursor-pointer select-none font-semibold text-foreground hover:bg-accent/30 transition-colors list-none">
                  {faq.question}
                  <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0 transition-transform group-open:rotate-90" />
                </summary>
                <p className="faq-answer px-5 pb-5 pt-1 text-muted-foreground leading-relaxed text-sm">
                  {faq.answer}
                </p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* ── Season switcher ──────────────────────────────────── */}
      <section className="py-12 px-4 border-b border-border/50 bg-card/30">
        <div className="max-w-4xl mx-auto">
          <h3 className="text-lg font-semibold mb-6 text-center">Browse by Season in {data.suburb}</h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {ALL_SEASONS.map((s) => {
              const c  = SEASONAL_CONTENT[s];
              const co = SEASON_COLOURS[s];
              const isActive = s === season;
              return (
                <Link key={s} href={`/suburb/${data.slug}/${s}`}>
                  <div className={cn(
                    "rounded-xl border p-4 text-center transition-all cursor-pointer",
                    isActive ? cn(co.bg, co.border, "shadow-lg") : "border-border/50 hover:border-border"
                  )}>
                    <div className="text-2xl mb-1">{SEASON_EMOJI[s]}</div>
                    <div className={cn("text-sm font-semibold", isActive ? co.text : "text-foreground")}>{c.label}</div>
                    <div className="text-xs text-muted-foreground mt-0.5">from {c.fromPrice}</div>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── Suburb switcher links ─────────────────────────────── */}
      <section className="py-12 px-4 border-b border-border/50">
        <div className="max-w-4xl mx-auto">
          <h3 className="text-lg font-semibold mb-6 text-center">Also Available Near {data.suburb}</h3>
          <div className="flex flex-wrap gap-2 justify-center">
            {data.neighbours.map((n, i) => {
              const postcode = data.neighbourPostcodes[i];
              const match    = SUBURB_DATA.find((s) => s.suburb === n);
              const href     = match ? `/suburb/${match.slug}/${season}` : `/suburb/${data.slug}`;
              return (
                <Link key={n} href={href}>
                  <span className="px-3 py-1.5 text-sm rounded-lg border border-border/50 text-muted-foreground hover:text-foreground hover:border-border transition-colors cursor-pointer">
                    {n} {postcode}
                  </span>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── CTA ──────────────────────────────────────────────── */}
      <section className="py-20 px-4 text-center">
        <div className="max-w-2xl mx-auto">
          <p className={cn("text-sm font-semibold uppercase tracking-wider mb-3", colours.text)}>
            {emoji} {content.label} Special
          </p>
          <h2 className="text-3xl sm:text-4xl font-bold mb-5">
            Ready for a cleaner {data.suburb} home this {content.label.toLowerCase()}?
          </h2>
          <p className="text-muted-foreground mb-8">
            {data.reviewCount} verified reviews · {data.rating}★ average · 48-hour satisfaction guarantee
          </p>
          <Link href={`/booking?suburb=${data.slug}&season=${season}`}>
            <Button size="lg" className="px-10 font-semibold">
              Book Now for {data.suburb} — from {content.fromPrice}
            </Button>
          </Link>
        </div>
      </section>

    </main>
  );
}
