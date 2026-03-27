import { useState } from "react";
import { Link } from "wouter";
import { Flower2, Sun, Leaf, Snowflake, CheckCircle, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { analytics } from "@/lib/analytics";

const SEASONS = [
  {
    id: "spring",
    label: "Spring",
    icon: Flower2,
    months: "Sep – Nov",
    colour: "text-emerald-400",
    bg: "bg-emerald-400/10",
    border: "border-emerald-400/30",
    active: "bg-emerald-400 text-slate-950",
    heading: "Spring Pollen & Allergen Deep Clean",
    subtext:
      "Australia's spring brings high pollen counts that settle into every surface. Our spring clean targets the spots conventional cleaning misses — giving your family relief from hay fever and asthma triggers.",
    includes: [
      "Air vent and duct pollen flush",
      "Window track and blind deep scrub",
      "Upholstery and carpet allergen extraction",
      "Ceiling fans, cornices, and light fittings",
      "Kitchen and bathroom sanitising",
      "Anti-allergen surface treatment",
    ],
    from: "$179",
    service: "deep_clean",
    cta: "Book Spring Clean",
  },
  {
    id: "summer",
    label: "Summer",
    icon: Sun,
    months: "Dec – Feb",
    colour: "text-amber-400",
    bg: "bg-amber-400/10",
    border: "border-amber-400/30",
    active: "bg-amber-400 text-slate-950",
    heading: "Summer Mould & Humidity Protection",
    subtext:
      "Australian summers bring humidity that fuels mould growth — especially in coastal suburbs. Our summer service targets bathroom, laundry, and kitchen moisture before it becomes a health hazard.",
    includes: [
      "Bathroom mould treatment and grout scrub",
      "Laundry and wet area sanitising",
      "Window condensation zones cleaned",
      "Anti-mould surface treatment (lasts 6 months)",
      "Kitchen exhaust fan deep clean",
      "Refrigerator coil and seal clean",
    ],
    from: "$199",
    service: "deep_clean",
    cta: "Book Summer Clean",
  },
  {
    id: "autumn",
    label: "Autumn",
    icon: Leaf,
    months: "Mar – May",
    colour: "text-orange-400",
    bg: "bg-orange-400/10",
    border: "border-orange-400/30",
    active: "bg-orange-400 text-slate-950",
    heading: "Autumn Reset & Pre-Winter Preparation",
    subtext:
      "Autumn is the perfect time to reset your home before winter. We deep clean gutters, outdoor areas, and indoor surfaces to prevent the damp and grime that builds up through the colder months.",
    includes: [
      "Full interior reset and declutter clean",
      "Outdoor entertaining area wash-down",
      "Fireplace surrounds and skirting boards",
      "Carpet and hard floor deep extraction",
      "Wardrobe and storage area clean",
      "Pre-winter germ protection surface spray",
    ],
    from: "$179",
    service: "deep_clean",
    cta: "Book Autumn Clean",
  },
  {
    id: "winter",
    label: "Winter",
    icon: Snowflake,
    months: "Jun – Aug",
    colour: "text-blue-400",
    bg: "bg-blue-400/10",
    border: "border-blue-400/30",
    active: "bg-blue-400 text-slate-950",
    heading: "Winter Germ Shield & Indoor Air Quality",
    subtext:
      "As Australians spend more time indoors, winter is cold and flu season. Our winter clean focuses on high-touch surfaces, air quality, and creating a hygienic sanctuary for your household.",
    includes: [
      "High-touch surface disinfection (handles, switches, remotes)",
      "Bathroom and toilet hospital-grade sanitise",
      "Mattress and bedding surface treatment",
      "HEPA-filtered vacuuming throughout",
      "Kitchen deep clean and bin sanitise",
      "Anti-viral surface protection spray",
    ],
    from: "$179",
    service: "standard_clean",
    cta: "Book Winter Clean",
  },
] as const;

type SeasonId = typeof SEASONS[number]["id"];

export function SeasonalSection() {
  const [active, setActive] = useState<SeasonId>("spring");
  const season = SEASONS.find((s) => s.id === active)!;
  const Icon = season.icon;

  return (
    <section
      id="seasonal"
      aria-label="Seasonal cleaning services"
      className="py-20 bg-background scroll-mt-24"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">

        {/* Heading */}
        <div className="text-center space-y-3">
          <p className="text-sm font-semibold text-primary uppercase tracking-widest">
            Year-round protection
          </p>
          <h2 className="text-3xl md:text-5xl font-extrabold">
            Cleaning for every Australian season
          </h2>
          <p className="text-muted-foreground max-w-xl mx-auto">
            Each season brings different challenges for Australian homes. Our seasonal
            specialists are trained for each one.
          </p>
        </div>

        {/* Season tab switcher */}
        <div
          role="tablist"
          aria-label="Select season"
          className="flex justify-center gap-2 flex-wrap"
        >
          {SEASONS.map((s) => {
            const TabIcon = s.icon;
            const isActive = s.id === active;
            return (
              <button
                key={s.id}
                role="tab"
                id={`tab-${s.id}`}
                aria-selected={isActive}
                aria-controls={`panel-${s.id}`}
                onClick={() => setActive(s.id)}
                className={cn(
                  "flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-semibold border transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary",
                  isActive
                    ? `${s.active} border-transparent shadow-md`
                    : `${s.colour} ${s.bg} ${s.border} hover:opacity-80`,
                )}
              >
                <TabIcon className="w-4 h-4" aria-hidden="true" />
                {s.label}
                <span className="hidden sm:inline text-xs opacity-70">({s.months})</span>
              </button>
            );
          })}
        </div>

        {/* Season panel */}
        <div
          role="tabpanel"
          id={`panel-${season.id}`}
          aria-labelledby={`tab-${season.id}`}
          className="grid md:grid-cols-2 gap-10 items-center"
        >
          {/* Left: description */}
          <div className="space-y-6">
            <div
              className={cn(
                "w-16 h-16 rounded-2xl flex items-center justify-center",
                season.bg,
              )}
            >
              <Icon className={cn("w-8 h-8", season.colour)} aria-hidden="true" />
            </div>
            <div>
              <h3 className="text-2xl md:text-3xl font-bold mb-3">{season.heading}</h3>
              <p className="text-muted-foreground leading-relaxed">{season.subtext}</p>
            </div>
            <div className="flex items-center gap-4">
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wider">Starting from</p>
                <p className={cn("text-3xl font-extrabold", season.colour)}>{season.from}</p>
              </div>
              <div className="border-l border-border/50 pl-4">
                <p className="text-xs text-muted-foreground uppercase tracking-wider">Availability</p>
                <p className="text-sm font-semibold text-foreground">Same-day & next-day</p>
              </div>
            </div>
            <Link
              href={`/booking?service=${season.service}`}
              onClick={() => analytics.capture("seasonal_cta_clicked", { season: season.id })}
              className={cn(
                "inline-flex items-center gap-2 px-6 py-3 rounded-xl font-semibold text-sm transition-all hover:opacity-90 shadow-md",
                season.active,
              )}
            >
              {season.cta} <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          {/* Right: includes list */}
          <div
            className={cn(
              "rounded-2xl border p-6 space-y-3",
              season.bg,
              season.border,
            )}
          >
            <h4 className="font-bold text-foreground mb-4">
              What's included in your {season.label.toLowerCase()} clean
            </h4>
            <ul className="space-y-3" role="list">
              {season.includes.map((item) => (
                <li key={item} className="flex items-start gap-3" role="listitem">
                  <CheckCircle
                    className={cn("w-4 h-4 mt-0.5 shrink-0", season.colour)}
                    aria-hidden="true"
                  />
                  <span className="text-sm text-muted-foreground">{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}
