import { useState } from "react";
import { Link } from "wouter";
import {
  CheckCircle2, Clock, Package, Wrench, ArrowRight, ChevronDown,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { analytics } from "@/lib/analytics";

export const HOWTO_STEPS = [
  {
    id: "step-1",
    name: "Identify High-Risk Zones",
    duration: "15 mins",
    text: "Check bathrooms, laundry, kitchen corners, and behind furniture for black spots, musty smells, or condensation on windows. In coastal and south-facing Australian homes these zones accumulate the most moisture during winter.",
  },
  {
    id: "step-2",
    name: "Improve Ventilation",
    duration: "10 mins",
    text: "Open windows for 10–15 minutes daily even in winter. Run exhaust fans in bathrooms and the laundry for 20 minutes after every shower or wash cycle. Good airflow is the single most effective mould deterrent.",
  },
  {
    id: "step-3",
    name: "Deep Clean Existing Mould",
    duration: "25 mins",
    text: "Spray affected areas with an eco-friendly anti-mould solution. Scrub tiles, grout lines, and silicone seals firmly with a stiff brush. Wipe completely dry immediately — leaving moisture behind re-seeds the mould.",
  },
  {
    id: "step-4",
    name: "Apply Long-Lasting Anti-Mould Treatment",
    duration: "20 mins",
    text: "Spray professional preventative treatment on shower walls, corners, window sills, and all damp-prone surfaces. Allow to fully air dry — it forms an invisible barrier that actively prevents mould regrowth for up to 6 months.",
  },
  {
    id: "step-5",
    name: "Reduce Indoor Humidity",
    duration: "Ongoing",
    text: "Use a dehumidifier in rooms with poor airflow. Target indoor humidity below 60% — the threshold above which mould spores rapidly colonise surfaces. Humidity monitors are inexpensive and widely available at Australian hardware stores.",
  },
  {
    id: "step-6",
    name: "Clean Air Vents & Filters",
    duration: "15 mins",
    text: "Vacuum AC vents and grilles, replace furnace and ducted heating filters, and wipe ceiling fans. Dirty vents recirculate mould spores through your entire home every time the system runs — especially dangerous for asthma sufferers.",
  },
  {
    id: "step-7",
    name: "Final Inspection & Maintenance Plan",
    duration: "10 mins",
    text: "Walk through every treated area. Mark your calendar to reapply anti-mould treatment every 6 months, or within two weeks of any heavy rain or flooding event. Consistent prevention costs far less than remediation.",
  },
] as const;

export const HOWTO_SUPPLIES = [
  "Eco-friendly anti-mould spray",
  "Microfibre cloths",
  "Dehumidifier",
  "HEPA vacuum cleaner",
  "Exhaust fans (bathroom/laundry)",
];

export const HOWTO_TOOLS = [
  "Stiff scrub brush",
  "Spray bottle",
  "Humidity monitor",
  "Step ladder",
];

interface HowToSectionProps {
  suburb?: string;
  postcode?: string;
  season?: string;
  /* optional overrides supplied by season-specific suburb pages */
  overrideSteps?: { name: string; text: string }[];
  overrideName?: string;
  overrideDescription?: string;
  overrideSupplies?: string[];
  overrideTools?: string[];
  overrideTotalTime?: string; /* ISO 8601 e.g. "PT4H" */
}

export function HowToSection({
  suburb = "Australian",
  postcode,
  season,
  overrideSteps,
  overrideName,
  overrideDescription,
  overrideSupplies,
  overrideTools,
  overrideTotalTime,
}: HowToSectionProps) {
  const [expanded, setExpanded] = useState<number | null>(null);

  const toggle = (i: number) => setExpanded((p) => (p === i ? null : i));

  /* Resolve active steps / metadata — prefer overrides */
  const activeSteps    = overrideSteps    ?? HOWTO_STEPS;
  const activeSupplies = overrideSupplies ?? HOWTO_SUPPLIES;
  const activeTools    = overrideTools    ?? HOWTO_TOOLS;
  const activeName     = overrideName     ?? null;
  const activeDesc     = overrideDescription ?? null;

  /* Duration label */
  const parsedMinutes = (() => {
    if (!overrideTotalTime) return 95;
    const hours   = parseInt(overrideTotalTime.match(/(\d+)H/)?.[1] ?? "0", 10);
    const minutes = parseInt(overrideTotalTime.match(/(\d+)M/)?.[1] ?? "0", 10);
    return hours * 60 + minutes;
  })();
  const h            = Math.floor(parsedMinutes / 60);
  const m            = parsedMinutes % 60;
  const durationLabel = m > 0 ? `${h}h ${m}m total` : `${h}h total`;

  return (
    <section
      id="howto-mould"
      aria-label="Winter mould prevention guide"
      className="py-20 bg-card border-y border-border/50 scroll-mt-24"
    >
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">

        {/* Heading */}
        <div className="text-center space-y-3">
          <p className="text-sm font-semibold text-blue-400 uppercase tracking-widest">
            Step-by-step guide
          </p>
          {activeName ? (
            <h2 className="text-3xl md:text-5xl font-extrabold">{activeName}</h2>
          ) : (
            <h2 className="text-3xl md:text-5xl font-extrabold">
              Winter Mould Prevention Checklist{" "}
              {suburb !== "Australian" && (
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-primary">
                  for {suburb}{postcode ? ` ${postcode}` : ""} Homes
                </span>
              )}
            </h2>
          )}
          <p className="text-muted-foreground max-w-xl mx-auto atomic-answer">
            {activeDesc ?? (
              <>
                Follow this 7-step winter checklist to stop mould before it starts in{" "}
                {suburb} homes. Our local team uses these exact anti-mould treatments on
                every winter deep clean — protection lasts up to 6 months.
              </>
            )}
          </p>
        </div>

        {/* Meta strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { icon: Clock,     label: "Total time",  value: durationLabel    },
            { icon: CheckCircle2, label: "Steps",    value: `${activeSteps.length} proven steps` },
            { icon: Package,   label: "Protection",  value: "Up to 6 months" },
            { icon: Wrench,    label: "Cost",        value: "Free checklist" },
          ].map(({ icon: Icon, label, value }) => (
            <div
              key={label}
              className="rounded-xl border border-border bg-background p-4 flex flex-col items-center text-center gap-1.5"
            >
              <Icon className="w-5 h-5 text-blue-400" aria-hidden="true" />
              <p className="text-xs text-muted-foreground">{label}</p>
              <p className="text-sm font-bold text-foreground">{value}</p>
            </div>
          ))}
        </div>

        {/* Steps */}
        <ol className="space-y-3" aria-label="Checklist steps">
          {activeSteps.map((step, i) => {
            const isOpen   = expanded === i;
            const panelId  = `howto-panel-${i}`;
            const btnId    = `howto-btn-${i}`;
            const stepId   = (step as { id?: string }).id ?? `step-${i + 1}`;

            return (
              <li
                key={stepId}
                id={stepId}
                className={cn(
                  "rounded-2xl border transition-all duration-200",
                  isOpen
                    ? "border-blue-400/40 bg-blue-400/5 shadow-md shadow-blue-400/5"
                    : "border-border bg-background hover:border-blue-400/30",
                )}
              >
                <button
                  id={btnId}
                  aria-expanded={isOpen}
                  aria-controls={panelId}
                  onClick={() => toggle(i)}
                  className="w-full flex items-center gap-4 px-6 py-5 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-2xl"
                >
                  {/* Step number */}
                  <span
                    className={cn(
                      "shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-sm font-extrabold border transition-colors",
                      isOpen
                        ? "bg-blue-400 text-slate-950 border-blue-400"
                        : "border-border text-muted-foreground bg-background",
                    )}
                    aria-hidden="true"
                  >
                    {i + 1}
                  </span>

                  <div className="flex-1 min-w-0">
                    <p className="text-base font-semibold text-foreground">
                      {step.name}
                    </p>
                    {"duration" in step && (
                      <p className="text-xs text-muted-foreground mt-0.5">{(step as { duration: string }).duration}</p>
                    )}
                  </div>

                  <ChevronDown
                    aria-hidden="true"
                    className={cn(
                      "w-5 h-5 text-blue-400 shrink-0 transition-transform duration-300",
                      isOpen && "rotate-180",
                    )}
                  />
                </button>

                {/* Step detail — always in DOM for SEO */}
                <div
                  id={panelId}
                  role="region"
                  aria-labelledby={btnId}
                  className={cn(
                    "overflow-hidden transition-all duration-300 ease-in-out",
                    isOpen ? "max-h-[400px] opacity-100" : "max-h-0 opacity-0",
                  )}
                >
                  <p className="howto-step px-6 pb-5 pl-[4.5rem] text-sm text-muted-foreground leading-relaxed">
                    {step.text}
                  </p>
                </div>
              </li>
            );
          })}
        </ol>

        {/* Supplies + Tools */}
        <div className="grid sm:grid-cols-2 gap-6">
          <div className="rounded-2xl border border-blue-400/20 bg-blue-400/5 p-5 space-y-3">
            <div className="flex items-center gap-2">
              <Package className="w-5 h-5 text-blue-400" aria-hidden="true" />
              <h3 className="font-bold text-foreground">Supplies needed</h3>
            </div>
            <ul className="space-y-1.5" role="list">
              {activeSupplies.map((s) => (
                <li key={s} className="flex items-center gap-2 text-sm text-muted-foreground" role="listitem">
                  <CheckCircle2 className="w-3.5 h-3.5 text-blue-400 shrink-0" aria-hidden="true" />
                  {s}
                </li>
              ))}
            </ul>
          </div>
          <div className="rounded-2xl border border-border bg-background p-5 space-y-3">
            <div className="flex items-center gap-2">
              <Wrench className="w-5 h-5 text-primary" aria-hidden="true" />
              <h3 className="font-bold text-foreground">Tools needed</h3>
            </div>
            <ul className="space-y-1.5" role="list">
              {activeTools.map((t) => (
                <li key={t} className="flex items-center gap-2 text-sm text-muted-foreground" role="listitem">
                  <CheckCircle2 className="w-3.5 h-3.5 text-primary shrink-0" aria-hidden="true" />
                  {t}
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Result + CTA */}
        <div className="rounded-2xl bg-gradient-to-br from-blue-400/10 to-primary/10 border border-blue-400/20 p-6 text-center space-y-4">
          <p className="howto-result text-sm font-semibold text-foreground">
            <strong>Result:</strong> A mould-free, healthy {suburb} home all winter long.
            Book our winter deep clean to get professional anti-mould treatment applied in
            a single visit — guaranteed to last 6 months.
          </p>
          <Link
            href="/booking?service=deep_clean"
            onClick={() => analytics.capture("howto_cta_clicked", { suburb })}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-blue-500 to-primary text-white font-semibold text-sm hover:opacity-90 transition-opacity shadow-md shadow-blue-400/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          >
            Book Winter Deep Clean <ArrowRight className="w-4 h-4" aria-hidden="true" />
          </Link>
        </div>
      </div>
    </section>
  );
}
