import { useEffect, useState } from "react";
import { Link } from "wouter";
import { motion } from "framer-motion";
import {
  Star, ArrowRight, CheckCircle, Shield, Clock, MapPin,
  ChevronDown, Flower2, Snowflake, Sun, Leaf,
} from "lucide-react";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { SkipToContent } from "@/components/layout/SkipToContent";
import { HowToSection } from "@/components/home/HowToSection";
import { analytics } from "@/lib/analytics";
import { cn } from "@/lib/utils";
import { getSuburb, buildSuburbJsonLd, SUBURB_DATA, type SuburbData } from "@/data/suburbs";

const RISK_COLOR: Record<string, string> = {
  High:     "text-red-400",
  Moderate: "text-amber-400",
  Low:      "text-emerald-400",
};

const SEASON_TIPS: Record<string, { icon: typeof Flower2; text: string }> = {
  spring: { icon: Flower2,    text: "Spring pollen peaks — air vents, upholstery, and window tracks are priority zones." },
  summer: { icon: Sun,        text: "Summer humidity — bathroom mould and fridge seals need attention." },
  autumn: { icon: Leaf,       text: "Autumn reset — pre-winter deep clean to prevent damp buildup." },
  winter: { icon: Snowflake,  text: "Winter mould season — anti-mould treatment lasts 6 months after application." },
};

const FAQS_FOR_SUBURB = (d: SuburbData) => [
  {
    q: `What is seasonal cleaning and why do I need it in ${d.suburb} ${d.postcode}?`,
    a: `Seasonal cleaning is a deep, weather-specific clean tailored to Australia's changing seasons. In ${d.suburb} we tackle spring pollen & dust, summer mould & allergens, autumn leaf buildup, and winter germ protection. Our local ${d.postcode} team uses hospital-grade, pet-safe products to keep your home fresh and healthy year-round.`,
  },
  {
    q: `Do you offer spring cleaning services in ${d.suburb} ${d.postcode}?`,
    a: `Yes! Our spring cleaning package includes pollen removal, window tracks, air vents, and upholstery sanitising — perfect for ${d.suburb} homes affected by high pollen counts. Same-day and next-day slots available across ${d.postcode}.`,
  },
  {
    q: `How much does a seasonal deep clean cost in ${d.postcode}?`,
    a: `Our seasonal cleans start at $179 for a 2-bedroom home in ${d.suburb} ${d.postcode}. Prices include all eco-friendly products and are fully customised. Get an instant online quote or call for a free ${d.suburb}-specific assessment.`,
  },
  {
    q: `Is your cleaning service available across all ${d.suburb} postcodes?`,
    a: `Absolutely. We cover every postcode in ${d.suburb} and surrounding suburbs — ${d.neighbours.slice(0, 3).join(", ")} (${d.neighbourPostcodes.slice(0, 3).join(", ")}). Same local cleaners who live in your suburb — never outsourced.`,
  },
  {
    q: `Do you help with winter mould prevention in ${d.suburb}?`,
    a: `Yes. Our winter mould & mildew deep clean targets bathrooms, laundry areas, and hidden damp spots common in ${d.suburb} homes during cooler months. We use anti-mould treatments that last up to 6 months.`,
  },
  {
    q: `Are your cleaners police-checked and insured for ${d.postcode} homes?`,
    a: `Every cleaner is police-checked, fully insured, and trained for Australian homes. You can relax knowing only trusted local ${d.suburb} professionals enter your property.`,
  },
  {
    q: `How quickly can you book a seasonal clean in ${d.suburb} ${d.postcode}?`,
    a: `Most ${d.suburb} customers book same-day or next-day service. Book online 24/7 or call our local team for instant availability.`,
  },
  {
    q: `Do you offer guarantees on your cleaning in ${d.postcode}?`,
    a: `100% Satisfaction Guarantee. If you're not happy within 48 hours, we return for a free re-clean — no questions asked.`,
  },
  {
    q: `Are your products safe for kids, pets, and allergy sufferers in ${d.suburb}?`,
    a: `Yes — all products are Australian-made, eco-friendly, and certified child- & pet-safe. Ideal for ${d.suburb} families with asthma or allergies.`,
  },
];

/* ─── FAQ accordion (suburb-specific) ────────────────────── */

function SuburbFaq({ data }: { data: SuburbData }) {
  const faqs = FAQS_FOR_SUBURB(data);
  const [openIdx, setOpenIdx] = useState<number | null>(null);
  const toggle = (i: number) => setOpenIdx((p) => (p === i ? null : i));

  return (
    <section id="faq" aria-label="Frequently asked questions" className="py-20 bg-background scroll-mt-24">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        <div className="text-center space-y-3">
          <h2 className="text-3xl md:text-4xl font-extrabold">
            Frequently Asked Questions — {data.suburb} {data.postcode}
          </h2>
          <p className="text-muted-foreground max-w-xl mx-auto">
            Everything {data.suburb} residents ask about AussieClean.
          </p>
        </div>
        <div className="space-y-3" role="list">
          {faqs.map((item, i) => {
            const isOpen   = openIdx === i;
            const panelId  = `sfaq-panel-${i}`;
            const btnId    = `sfaq-btn-${i}`;
            return (
              <div
                key={i}
                role="listitem"
                className={cn(
                  "rounded-2xl border transition-all",
                  isOpen ? "border-primary/40 bg-primary/5" : "border-border bg-card hover:border-primary/30",
                )}
              >
                <button
                  id={btnId}
                  aria-expanded={isOpen}
                  aria-controls={panelId}
                  onClick={() => toggle(i)}
                  className="w-full flex items-center justify-between gap-4 px-6 py-5 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-2xl"
                >
                  <span className="text-base font-semibold faq-question">{item.q}</span>
                  <ChevronDown aria-hidden="true" className={cn("w-5 h-5 text-primary shrink-0 transition-transform duration-300", isOpen && "rotate-180")} />
                </button>
                <div
                  id={panelId}
                  role="region"
                  aria-labelledby={btnId}
                  className={cn("overflow-hidden transition-all duration-300", isOpen ? "max-h-[600px] opacity-100" : "max-h-0 opacity-0")}
                >
                  <p className="faq-answer px-6 pb-5 text-sm text-muted-foreground leading-relaxed">{item.a}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

/* ─── Main suburb page ───────────────────────────────────── */

interface SuburbPageProps {
  params: { slug: string };
}

export default function SuburbPage({ params }: SuburbPageProps) {
  const data = getSuburb(params.slug);

  useEffect(() => {
    if (data) analytics.capture("suburb_page_view", { suburb: data.suburb, postcode: data.postcode });
  }, [data]);

  if (!data) {
    return <SuburbNotFound slug={params.slug} />;
  }

  const jsonLd = JSON.stringify(buildSuburbJsonLd(data));
  const currentMonth   = new Date().getMonth(); // 0-indexed
  const currentSeason  =
    currentMonth >= 8  && currentMonth <= 10 ? "spring" :
    currentMonth >= 11 || currentMonth <= 1  ? "summer" :
    currentMonth >= 2  && currentMonth <= 4  ? "autumn" : "winter";
  const seasonTip = SEASON_TIPS[currentSeason];
  const SeasonIcon = seasonTip.icon;

  return (
    <div className="min-h-screen flex flex-col pt-20">
      <SkipToContent />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd }} />
      <Navbar />

      <main id="main-content" className="flex-1" tabIndex={-1}>

        {/* ── Hero ──────────────────────────────────────────── */}
        <section aria-label={`Cleaning services in ${data.suburb}`} className="relative overflow-hidden">
          <div className="absolute inset-0 bg-background" aria-hidden="true">
            <img
              src={`${import.meta.env.BASE_URL}images/hero-bg.png`}
              alt=""
              className="w-full h-full object-cover opacity-40"
            />
            <div className="absolute inset-0 bg-gradient-to-b from-background/80 via-background/40 to-background" />
          </div>

          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-20 md:pt-36 md:pb-28 flex flex-col items-center text-center">

            {/* Breadcrumb */}
            <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-xs text-muted-foreground mb-8">
              <Link href="/" className="hover:text-primary transition-colors">Home</Link>
              <span aria-hidden="true">/</span>
              <span>Suburbs</span>
              <span aria-hidden="true">/</span>
              <span className="text-foreground">{data.suburb} {data.postcode}</span>
            </nav>

            {/* Seasonal badge */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 text-primary text-sm font-semibold mb-6"
            >
              <Star className="w-4 h-4 fill-primary" aria-hidden="true" />
              {data.rating}★ from {data.reviewCount} {data.suburb} reviews
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-4xl md:text-6xl font-extrabold max-w-4xl leading-tight mb-6"
            >
              Cleaning Services in{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-blue-400">
                {data.suburb} {data.postcode}
              </span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="hero-text text-lg text-muted-foreground max-w-2xl mb-10"
            >
              Australia's pollen season hits {data.suburb} hard — our local team delivers
              deep cleans that protect your family from allergens, mould, and dust.
              Same-day & next-day availability across {data.postcode}.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="flex flex-col sm:flex-row gap-4"
            >
              <Link
                href="/booking"
                onClick={() => analytics.capture("suburb_cta_clicked", { suburb: data.suburb, location: "hero" })}
                className="px-8 py-4 rounded-xl font-bold text-lg bg-gradient-to-r from-primary to-blue-500 text-primary-foreground shadow-lg shadow-primary/25 hover:-translate-y-1 transition-all duration-300"
              >
                Book a Clean in {data.suburb}
              </Link>
              <a
                href="#faq"
                className="px-8 py-4 rounded-xl font-bold text-lg border border-border text-foreground hover:border-primary/50 hover:bg-primary/5 transition-all text-center"
              >
                Common Questions
              </a>
            </motion.div>
          </div>
        </section>

        {/* ── Suburb profile strip ──────────────────────────── */}
        <section aria-label="Local suburb profile" className="py-8 bg-card border-y border-border/50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              <div className="flex items-center gap-3">
                <MapPin className="w-5 h-5 text-primary shrink-0" aria-hidden="true" />
                <div>
                  <p className="text-xs text-muted-foreground">Region</p>
                  <p className="text-sm font-semibold">{data.region}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Flower2 className="w-5 h-5 text-emerald-400 shrink-0" aria-hidden="true" />
                <div>
                  <p className="text-xs text-muted-foreground">Pollen Risk</p>
                  <p className={cn("text-sm font-semibold", RISK_COLOR[data.pollensRisk])}>{data.pollensRisk}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Snowflake className="w-5 h-5 text-blue-400 shrink-0" aria-hidden="true" />
                <div>
                  <p className="text-xs text-muted-foreground">Mould Risk</p>
                  <p className={cn("text-sm font-semibold", RISK_COLOR[data.mouldRisk])}>{data.mouldRisk}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Star className="w-5 h-5 text-amber-400 fill-amber-400 shrink-0" aria-hidden="true" />
                <div>
                  <p className="text-xs text-muted-foreground">Local rating</p>
                  <p className="text-sm font-semibold">{data.rating}★ ({data.reviewCount} reviews)</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── Seasonal tip banner ───────────────────────────── */}
        <section aria-label="Current season tip" className="py-6 bg-background">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-start gap-4 rounded-2xl border border-primary/30 bg-primary/5 p-5">
              <SeasonIcon className="w-6 h-6 text-primary shrink-0 mt-0.5" aria-hidden="true" />
              <p className="atomic-answer text-sm text-muted-foreground leading-relaxed">
                <strong className="text-foreground capitalize">{currentSeason} tip for {data.suburb}:</strong>{" "}
                {seasonTip.text}
              </p>
            </div>
          </div>
        </section>

        {/* ── Pricing table ─────────────────────────────────── */}
        <section aria-label="Cleaning service pricing" className="py-16 bg-background">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
            <div className="text-center space-y-2">
              <h2 className="text-3xl font-extrabold">
                Pricing for {data.suburb} {data.postcode} Homes
              </h2>
              <p className="text-muted-foreground">All prices include eco-friendly products, equipment, and our 100% satisfaction guarantee.</p>
            </div>
            <div className="grid md:grid-cols-3 gap-6">
              {[
                { name: "Standard Clean",       from: "$129", beds: "1–2 bedrooms", popular: false, features: ["All rooms & surfaces", "Kitchen & bathrooms", "Vacuuming & mopping", "Same-day available"], service: "standard_clean" },
                { name: "Seasonal Deep Clean",  from: "$179", beds: "2 bedrooms",   popular: true,  features: ["Everything in Standard", "Air vents & window tracks", "Anti-allergen treatment", "Inside oven & fridge", "6-month mould protection"], service: "deep_clean" },
                { name: "End-of-Lease Clean",   from: "$349", beds: "Any size",     popular: false, features: ["Bond-back guaranteed", "Walls, blinds & carpets", "Full property report", "Return visit if needed"], service: "end_of_lease" },
              ].map((pkg) => (
                <div
                  key={pkg.name}
                  className={cn(
                    "relative rounded-2xl border p-6 flex flex-col gap-4 transition-all",
                    pkg.popular ? "border-primary/50 bg-primary/5 shadow-lg shadow-primary/10" : "border-border bg-card",
                  )}
                >
                  {pkg.popular && (
                    <div className="absolute -top-3 left-5">
                      <span className="px-3 py-1 rounded-full bg-gradient-to-r from-primary to-blue-500 text-primary-foreground text-xs font-bold shadow-md shadow-primary/20">
                        Most Popular in {data.suburb}
                      </span>
                    </div>
                  )}
                  <div>
                    <h3 className="font-bold text-lg">{pkg.name}</h3>
                    <p className="text-xs text-muted-foreground mt-0.5">{pkg.beds}</p>
                  </div>
                  <p className="text-3xl font-extrabold text-primary">{pkg.from}</p>
                  <ul className="space-y-2 flex-1" role="list">
                    {pkg.features.map((f) => (
                      <li key={f} className="flex items-center gap-2 text-sm text-muted-foreground" role="listitem">
                        <CheckCircle className="w-3.5 h-3.5 text-emerald-400 shrink-0" aria-hidden="true" />
                        {f}
                      </li>
                    ))}
                  </ul>
                  <Link
                    href={`/booking?service=${pkg.service}`}
                    onClick={() => analytics.capture("suburb_service_booked", { suburb: data.suburb, service: pkg.service })}
                    className={cn(
                      "flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary",
                      pkg.popular
                        ? "bg-gradient-to-r from-primary to-blue-500 text-primary-foreground hover:opacity-90 shadow-md shadow-primary/20"
                        : "border border-border text-foreground hover:border-primary/50 hover:bg-primary/5",
                    )}
                  >
                    Book {pkg.name} <ArrowRight className="w-4 h-4" aria-hidden="true" />
                  </Link>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Atomic answer sections ────────────────────────── */}
        <section aria-label="Service details" className="py-16 bg-card border-y border-border/50">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
            <h2 className="text-2xl md:text-3xl font-extrabold text-center">
              Everything you need to know about cleaning in {data.suburb} {data.postcode}
            </h2>

            {[
              {
                q: `What's included in our spring pollen deep clean for ${data.suburb} homes?`,
                a: `Our spring cleaning in ${data.suburb} ${data.postcode} removes high pollen counts from air vents, window tracks, upholstery, and ceilings — plus full bathroom & kitchen sanitising. Every job uses Australian-made, pet-safe & child-safe products. Most ${data.postcode} homes take 3–5 hours and start at $179. ${data.localNote}`,
              },
              {
                q: `How does spring cleaning help with allergies in ${data.suburb}?`,
                a: `${data.suburb}'s ${data.pollensRisk.toLowerCase()} spring pollen risk triggers asthma & hay fever across ${data.postcode}. Our deep clean removes 99% of airborne allergens from ducts, carpets, and blinds. Families report fewer symptoms within 48 hours — particularly important in ${data.suburb} households with children or pets.`,
              },
              {
                q: `Do your cleaners handle mould prevention during winter in ${data.postcode}?`,
                a: `Yes. ${data.suburb}'s ${data.mouldRisk.toLowerCase()} mould risk in winter is well known among local homeowners. We apply professional anti-mould treatments to bathrooms, laundry & hidden damp spots that last up to 6 months — far longer than DIY spray-and-wipe approaches.`,
              },
            ].map(({ q, a }) => (
              <div key={q} className="space-y-2">
                <h3 className="text-lg font-bold">{q}</h3>
                <p className="atomic-answer text-muted-foreground leading-relaxed text-sm">{a}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ── Trust section ─────────────────────────────────── */}
        <section aria-label="Why families in this suburb choose us" className="py-16 bg-background">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-2xl md:text-3xl font-extrabold text-center mb-10">
              Why {data.suburb} families choose AussieClean
            </h2>
            <div className="grid md:grid-cols-3 gap-8">
              {[
                { icon: Shield,       title: "Police-Checked Locals",     desc: `Every ${data.suburb} cleaner is background-checked, insured, and lives in your area. We never send unknown contractors.` },
                { icon: CheckCircle,  title: "48-Hour Re-Clean Guarantee", desc: `Not satisfied? We return within 48 hours free of charge. Our re-clean rate in ${data.postcode} is under 1%.`          },
                { icon: Clock,        title: "Same-Day Availability",      desc: `Over 70% of ${data.suburb} customers book same-day or next-day. Online booking takes 60 seconds.`                           },
              ].map(({ icon: Icon, title, desc }) => (
                <div key={title} className="flex flex-col items-center text-center p-6 rounded-2xl border border-border bg-card">
                  <div className="w-14 h-14 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center mb-5" aria-hidden="true">
                    <Icon className="w-7 h-7 text-primary" />
                  </div>
                  <h3 className="text-lg font-bold mb-2">{title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── HowTo: Winter Mould Prevention ───────────────── */}
        <HowToSection suburb={data.suburb} postcode={data.postcode} />

        {/* ── FAQ (suburb-specific) ─────────────────────────── */}
        <SuburbFaq data={data} />

        {/* ── Neighbour suburbs ─────────────────────────────── */}
        <section aria-label="Neighbouring suburbs we service" className="py-12 bg-card border-t border-border/50">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
            <h2 className="text-xl font-bold text-center">We also service neighbouring suburbs</h2>
            <div className="flex flex-wrap justify-center gap-3">
              {SUBURB_DATA
                .filter((s) => s.slug !== data.slug)
                .slice(0, 6)
                .map((s) => (
                  <Link
                    key={s.slug}
                    href={`/suburb/${s.slug}`}
                    className="px-4 py-2 rounded-full border border-border text-sm text-muted-foreground hover:border-primary/50 hover:text-primary transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                  >
                    {s.suburb} {s.postcode}
                  </Link>
                ))}
              {data.neighbours.map((n, i) => (
                <span
                  key={n}
                  className="px-4 py-2 rounded-full border border-border text-sm text-muted-foreground"
                >
                  {n} {data.neighbourPostcodes[i] ?? ""}
                </span>
              ))}
            </div>
          </div>
        </section>

        {/* ── Final CTA ─────────────────────────────────────── */}
        <section aria-label="Book now" className="py-16 bg-background border-t border-border/50">
          <div className="max-w-2xl mx-auto px-4 sm:px-6 text-center space-y-6">
            <h2 className="text-2xl md:text-4xl font-extrabold">
              Ready for a fresher {data.suburb} home?
            </h2>
            <p className="text-muted-foreground">
              Book in 60 seconds. Same-day available across {data.postcode}. Police-checked cleaners, eco-friendly products, 100% satisfaction guarantee.
            </p>
            <Link
              href="/booking"
              onClick={() => analytics.capture("suburb_cta_clicked", { suburb: data.suburb, location: "bottom" })}
              className="inline-flex items-center gap-2 px-8 py-4 rounded-xl font-bold text-lg bg-gradient-to-r from-primary to-blue-500 text-primary-foreground shadow-lg shadow-primary/25 hover:-translate-y-1 transition-all"
            >
              Book Now for {data.suburb} <ArrowRight className="w-5 h-5" aria-hidden="true" />
            </Link>
          </div>
        </section>

      </main>
      <Footer />
    </div>
  );
}

/* ─── Not-found fallback for unknown slugs ───────────────── */

function SuburbNotFound({ slug }: { slug: string }) {
  return (
    <div className="min-h-screen flex flex-col pt-20">
      <Navbar />
      <main id="main-content" className="flex-1 flex flex-col items-center justify-center gap-6 py-24 px-4 text-center" tabIndex={-1}>
        <MapPin className="w-16 h-16 text-muted-foreground" aria-hidden="true" />
        <h1 className="text-3xl font-extrabold">Suburb not found</h1>
        <p className="text-muted-foreground max-w-sm">
          We couldn't find a page for <strong>{slug}</strong>. Try browsing our available suburb pages below, or book a clean for any Australian address.
        </p>
        <div className="flex flex-wrap justify-center gap-3">
          {SUBURB_DATA.map((s) => (
            <Link
              key={s.slug}
              href={`/suburb/${s.slug}`}
              className="px-4 py-2 rounded-full border border-border text-sm hover:border-primary/50 hover:text-primary transition-colors"
            >
              {s.suburb} {s.postcode}
            </Link>
          ))}
        </div>
        <Link href="/booking" className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-primary to-blue-500 text-primary-foreground font-semibold hover:opacity-90 transition-opacity">
          Book Anywhere in Australia <ArrowRight className="w-4 h-4" />
        </Link>
      </main>
      <Footer />
    </div>
  );
}
