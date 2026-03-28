import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Sparkles, Home, Building2, Briefcase, HeartHandshake,
  Layers, ShoppingBag, Hotel, Stethoscope, GraduationCap,
  Factory, HardHat, Droplets, Leaf, AlertTriangle, Sun,
  Wind, ChevronDown, Shield, CheckCircle2,
} from "lucide-react";
import { useBookingStore } from "@/lib/store";
import { cn } from "@/lib/utils";

interface ServiceDef {
  id: string;
  label: string;
  desc: string;
  from: string;
  icon: React.ElementType;
  compliance?: string;
  popular?: boolean;
  specialist?: boolean;
}

interface CategoryDef {
  key: string;
  label: string;
  color: string;
  services: ServiceDef[];
}

const CATEGORIES: CategoryDef[] = [
  {
    key: "residential",
    label: "Residential",
    color: "cyan",
    services: [
      {
        id: "standard_clean",
        label: "Standard Home Clean",
        desc: "Regular weekly or fortnightly upkeep for a tidy home.",
        from: "$149",
        icon: Home,
        popular: true,
      },
      {
        id: "deep_clean",
        label: "Deep / Spring Clean",
        desc: "Detailed top-to-bottom clean targeting grime and buildup.",
        from: "$249",
        icon: Sparkles,
      },
      {
        id: "end_of_lease",
        label: "End-of-Lease (Bond-Back)",
        desc: "Rigorous clean with bond-back guarantee per Australian Consumer Law.",
        from: "$349",
        icon: Building2,
        compliance: "ACL Guaranteed",
        popular: true,
      },
      {
        id: "carpet_clean",
        label: "Carpet & Upholstery",
        desc: "Steam or dry carpet cleaning, lounges, and soft furnishings.",
        from: "$189/room",
        icon: Layers,
      },
      {
        id: "window_clean",
        label: "Window Cleaning",
        desc: "Internal and external glass, frames, and sills.",
        from: "$149",
        icon: Droplets,
      },
      {
        id: "eco_clean",
        label: "Eco-Friendly / Green Clean",
        desc: "Non-toxic, biodegradable products — safe for kids and pets.",
        from: "$169",
        icon: Leaf,
      },
    ],
  },
  {
    key: "commercial",
    label: "Commercial",
    color: "blue",
    services: [
      {
        id: "office_clean",
        label: "Office / Commercial Clean",
        desc: "Professional workspace cleaning — daily, weekly, or one-off.",
        from: "$399",
        icon: Briefcase,
        compliance: "WHS Act 2011",
        popular: true,
      },
      {
        id: "strata_clean",
        label: "Strata / Body Corporate",
        desc: "Common areas, lobbies, car parks and shared facilities.",
        from: "$499/wk",
        icon: Layers,
        compliance: "WHS Act 2011",
      },
      {
        id: "retail_clean",
        label: "Retail / Shop Clean",
        desc: "After-hours or early-morning retail space cleaning.",
        from: "$349",
        icon: ShoppingBag,
      },
      {
        id: "hospitality_clean",
        label: "Hospitality / Hotel Clean",
        desc: "Room turnovers, common areas, and kitchen hygiene.",
        from: "$599",
        icon: Hotel,
      },
    ],
  },
  {
    key: "medical",
    label: "Medical & Aged Care",
    color: "rose",
    services: [
      {
        id: "medical_clean",
        label: "Medical / Healthcare Facility",
        desc: "Hospital-grade disinfection to AS/NZS 4187 + NHMRC standards.",
        from: "$899",
        icon: Stethoscope,
        compliance: "AS/NZS 4187 · NHMRC",
        specialist: true,
      },
      {
        id: "aged_care_clean",
        label: "Aged Care & NDIS Clean",
        desc: "Empathetic, structured cleaning for care environments.",
        from: "$649",
        icon: HeartHandshake,
        compliance: "NDIS Quality Standards",
        specialist: true,
      },
    ],
  },
  {
    key: "institutional",
    label: "Institutional",
    color: "purple",
    services: [
      {
        id: "school_clean",
        label: "School / Childcare / Educational",
        desc: "Police-checked staff, child-safe products, supervised access.",
        from: "$549",
        icon: GraduationCap,
        compliance: "WWC Checked",
        specialist: true,
      },
    ],
  },
  {
    key: "industrial",
    label: "Industrial & Specialized",
    color: "orange",
    services: [
      {
        id: "industrial_clean",
        label: "Industrial / Warehouse Clean",
        desc: "Heavy-duty floor, machinery, and facility cleaning.",
        from: "$1,299",
        icon: Factory,
        compliance: "WHS · POEO Act",
        specialist: true,
      },
      {
        id: "post_construction_clean",
        label: "Post-Construction / Builders Clean",
        desc: "Dust, debris, and fit-out cleaning after building works.",
        from: "$899",
        icon: HardHat,
        specialist: true,
      },
      {
        id: "pressure_wash",
        label: "Pressure Wash & Exterior",
        desc: "Driveways, decks, facades, and exterior surfaces.",
        from: "$349",
        icon: Droplets,
      },
      {
        id: "biohazard_clean",
        label: "Biohazard / Sanitisation Clean",
        desc: "Specialist PPE, safe disposal, crime scene & contamination remediation.",
        from: "$1,500",
        icon: AlertTriangle,
        compliance: "WHS · SafeWork",
        specialist: true,
      },
      {
        id: "solar_duct_clean",
        label: "Solar Panel / Duct / Air-Con",
        desc: "Roof-access certified team for panels, ducting, and HVAC systems.",
        from: "$449",
        icon: Sun,
        specialist: true,
      },
    ],
  },
];

const ALL_SERVICES = CATEGORIES.flatMap((c) => c.services);

const COLOR_MAP: Record<string, { badge: string; selected: string; icon: string; hover: string }> = {
  cyan:   { badge: "bg-cyan-500/15 text-cyan-400 border-cyan-500/30",   selected: "border-cyan-400 bg-cyan-500/10 ring-cyan-400/30",   icon: "bg-cyan-500 text-white",   hover: "hover:border-cyan-400/50" },
  blue:   { badge: "bg-blue-500/15 text-blue-400 border-blue-500/30",   selected: "border-blue-400 bg-blue-500/10 ring-blue-400/30",   icon: "bg-blue-500 text-white",   hover: "hover:border-blue-400/50" },
  rose:   { badge: "bg-rose-500/15 text-rose-400 border-rose-500/30",   selected: "border-rose-400 bg-rose-500/10 ring-rose-400/30",   icon: "bg-rose-500 text-white",   hover: "hover:border-rose-400/50" },
  purple: { badge: "bg-purple-500/15 text-purple-400 border-purple-500/30", selected: "border-purple-400 bg-purple-500/10 ring-purple-400/30", icon: "bg-purple-500 text-white", hover: "hover:border-purple-400/50" },
  orange: { badge: "bg-orange-500/15 text-orange-400 border-orange-500/30", selected: "border-orange-400 bg-orange-500/10 ring-orange-400/30", icon: "bg-orange-500 text-white", hover: "hover:border-orange-400/50" },
};

export function Step1Service() {
  const { serviceType, updateData, nextStep } = useBookingStore();
  const [openCategory, setOpenCategory] = useState<string>("residential");

  const handleSelect = (id: string) => {
    updateData({ serviceType: id });
    setTimeout(nextStep, 280);
  };

  const selectedService = ALL_SERVICES.find((s) => s.id === serviceType);

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      className="space-y-6"
    >
      <div>
        <h2 className="text-2xl font-bold text-foreground">
          What type of clean do you need?
        </h2>
        <p className="text-muted-foreground mt-2">
          Australia's most comprehensive service catalogue — 18 categories.
        </p>
      </div>

      {selectedService && (
        <div className="flex items-center gap-2 px-4 py-2.5 bg-primary/10 border border-primary/20 rounded-xl text-sm font-medium text-primary">
          <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
          Selected: <span className="font-bold">{selectedService.label}</span>
          <span className="text-muted-foreground ml-auto text-xs">Click Continue below or change selection</span>
        </div>
      )}

      <div className="space-y-3" role="group" aria-label="Service categories">
        {CATEGORIES.map((cat) => {
          const colors = COLOR_MAP[cat.color];
          const isOpen = openCategory === cat.key;
          const hasSelection = cat.services.some((s) => s.id === serviceType);

          return (
            <div key={cat.key} className="rounded-2xl border border-border overflow-hidden">
              <button
                type="button"
                onClick={() => setOpenCategory(isOpen ? "" : cat.key)}
                className={cn(
                  "w-full flex items-center justify-between px-5 py-4 transition-colors",
                  isOpen ? "bg-card" : "bg-card/50 hover:bg-card",
                )}
                aria-expanded={isOpen}
              >
                <div className="flex items-center gap-3">
                  <span className={cn("text-sm font-bold px-3 py-1 rounded-full border", colors.badge)}>
                    {cat.label}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {cat.services.length} service{cat.services.length !== 1 ? "s" : ""}
                  </span>
                  {hasSelection && (
                    <CheckCircle2 className="w-4 h-4 text-primary" aria-label="Has selected service" />
                  )}
                </div>
                <ChevronDown className={cn(
                  "w-4 h-4 text-muted-foreground transition-transform duration-200",
                  isOpen && "rotate-180",
                )} />
              </button>

              <AnimatePresence initial={false}>
                {isOpen && (
                  <motion.div
                    key="content"
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden"
                  >
                    <div className="px-4 pb-4 pt-1 grid sm:grid-cols-2 gap-3">
                      {cat.services.map((s) => {
                        const isSelected = serviceType === s.id;
                        const Icon = s.icon;
                        return (
                          <button
                            key={s.id}
                            type="button"
                            aria-pressed={isSelected}
                            onClick={() => handleSelect(s.id)}
                            className={cn(
                              "relative flex items-start gap-3 p-4 rounded-xl border text-left transition-all duration-200",
                              isSelected
                                ? `${colors.selected} ring-1 shadow-lg`
                                : `border-border bg-background/50 ${colors.hover}`,
                            )}
                          >
                            <div className={cn(
                              "p-2.5 rounded-xl flex-shrink-0 transition-colors",
                              isSelected ? colors.icon : "bg-secondary text-muted-foreground",
                            )}>
                              <Icon className="w-5 h-5" aria-hidden="true" />
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="flex items-start justify-between gap-2">
                                <h3 className={cn(
                                  "font-semibold text-sm leading-tight",
                                  isSelected ? "text-foreground" : "text-foreground",
                                )}>
                                  {s.label}
                                </h3>
                                {s.popular && (
                                  <span className="flex-shrink-0 text-[10px] font-bold px-1.5 py-0.5 bg-primary text-primary-foreground rounded-full leading-none">
                                    Popular
                                  </span>
                                )}
                              </div>
                              <p className="text-xs text-muted-foreground mt-1 leading-snug">{s.desc}</p>
                              <div className="flex items-center gap-2 mt-2 flex-wrap">
                                <span className="text-xs font-bold text-primary">from {s.from}</span>
                                {s.compliance && (
                                  <span className="flex items-center gap-1 text-[10px] font-semibold px-1.5 py-0.5 bg-slate-800 border border-slate-700 rounded text-slate-400">
                                    <Shield className="w-2.5 h-2.5" />
                                    {s.compliance}
                                  </span>
                                )}
                                {s.specialist && !s.compliance && (
                                  <span className="flex items-center gap-1 text-[10px] font-semibold px-1.5 py-0.5 bg-slate-800 border border-slate-700 rounded text-slate-400">
                                    <Wind className="w-2.5 h-2.5" />
                                    Specialist
                                  </span>
                                )}
                              </div>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </div>

      {serviceType && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="pt-2"
        >
          <button
            type="button"
            onClick={nextStep}
            className="w-full px-6 py-3.5 rounded-xl font-bold bg-primary text-primary-foreground hover:shadow-lg hover:shadow-primary/20 hover:-translate-y-0.5 transition-all"
          >
            Continue with {selectedService?.label}
          </button>
        </motion.div>
      )}
    </motion.div>
  );
}
