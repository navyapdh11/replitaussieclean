import { motion } from "framer-motion";
import { useBookingStore } from "@/lib/store";
import { cn } from "@/lib/utils";
import { Check, RefreshCw, CalendarDays, Repeat } from "lucide-react";

interface Addon {
  id: string;
  label: string;
  price: string;
}

const RESIDENTIAL_ADDONS: Addon[] = [
  { id: "oven",      label: "Oven Cleaning",              price: "$49"      },
  { id: "fridge",    label: "Fridge Cleaning",            price: "$39"      },
  { id: "windows",   label: "Internal Window Wash",       price: "$59"      },
  { id: "carpet",    label: "Carpet Steam Cleaning",      price: "$89/room" },
  { id: "balcony",   label: "Balcony / Outdoor Area",     price: "$45"      },
  { id: "garage",    label: "Garage / Laundry",           price: "$55"      },
  { id: "photo",     label: "Before/After Photo Report",  price: "$49"      },
];

const END_OF_LEASE_ADDONS: Addon[] = [
  { id: "oven",      label: "Oven Deep Clean",            price: "$65"      },
  { id: "fridge",    label: "Fridge Deep Clean",          price: "$55"      },
  { id: "walls",     label: "Wall Scuff Removal",         price: "$99"      },
  { id: "carpet",    label: "Carpet Steam Clean",         price: "$89/room" },
  { id: "blinds",    label: "Blind Cleaning",             price: "$79"      },
  { id: "pressure",  label: "Pressure Wash (exterior)",   price: "$149"     },
  { id: "photo",     label: "Before/After Photo Report",  price: "$49"      },
];

const COMMERCIAL_ADDONS: Addon[] = [
  { id: "windows",      label: "External Window Clean",    price: "$89"      },
  { id: "kitchen",      label: "Commercial Kitchen Clean", price: "$149"     },
  { id: "sanitise",     label: "Full Sanitisation",        price: "$119"     },
  { id: "waste",        label: "Waste Station Service",    price: "$49"      },
  { id: "carpet_comm",  label: "Carpet Cleaning",          price: "$89/room" },
];

const MEDICAL_ADDONS: Addon[] = [
  { id: "terminal",  label: "Terminal Disinfection",      price: "$299"     },
  { id: "ppe",       label: "Enhanced PPE Protocol",      price: "$129"     },
  { id: "log",       label: "Compliance Log Report",      price: "$89"      },
  { id: "surface",   label: "Surface ATP Testing",        price: "$149"     },
];

const INDUSTRIAL_ADDONS: Addon[] = [
  { id: "chemical",   label: "Chemical Spill Remediation", price: "$299"   },
  { id: "highreach",  label: "High-Reach Cleaning",        price: "$199"   },
  { id: "forklift",   label: "Forklift Bay Degreasing",    price: "$149"   },
  { id: "grease",     label: "Grease Trap Cleaning",       price: "$179"   },
];

const SPECIALIZED_ADDONS: Addon[] = [
  { id: "sanitise",  label: "Sanitisation Treatment",     price: "$99"      },
  { id: "deodour",   label: "Odour Neutralisation",       price: "$79"      },
  { id: "photo",     label: "Before/After Photo Report",  price: "$49"      },
];

function getAddons(serviceType?: string): { addons: Addon[]; skipable: boolean } {
  switch (serviceType) {
    case "end_of_lease":
      return { addons: END_OF_LEASE_ADDONS, skipable: true };
    case "office_clean":
    case "strata_clean":
    case "retail_clean":
    case "hospitality_clean":
      return { addons: COMMERCIAL_ADDONS, skipable: true };
    case "medical_clean":
    case "aged_care_clean":
    case "ndis_support":
      return { addons: MEDICAL_ADDONS, skipable: true };
    case "industrial_clean":
    case "post_construction_clean":
      return { addons: INDUSTRIAL_ADDONS, skipable: true };
    case "biohazard_clean":
    case "pressure_wash":
    case "solar_duct_clean":
    case "school_clean":
      return { addons: SPECIALIZED_ADDONS, skipable: true };
    case "carpet_clean":
    case "window_clean":
    case "eco_clean":
      return { addons: RESIDENTIAL_ADDONS.slice(0, 5), skipable: true };
    default:
      return { addons: RESIDENTIAL_ADDONS, skipable: true };
  }
}

const FREQUENCY_OPTIONS = [
  {
    id: "once" as const,
    label: "Once-off",
    desc: "Single booking",
    icon: CalendarDays,
    badge: null,
  },
  {
    id: "fortnightly" as const,
    label: "Fortnightly",
    desc: "Every 2 weeks",
    icon: Repeat,
    badge: "Save 5%",
  },
  {
    id: "weekly" as const,
    label: "Weekly",
    desc: "Every week",
    icon: Repeat,
    badge: "Save 10%",
  },
];

export function Step3Addons() {
  const store = useBookingStore();
  const { addons, skipable } = getAddons(store.serviceType);
  const selected = new Set(store.extras);
  const frequency = store.frequency ?? "once";

  const toggleAddon = (id: string) => {
    const next = new Set(selected);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    store.updateData({ extras: Array.from(next) });
  };

  return (
    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-foreground">Customise Your Clean</h2>
        <p className="text-muted-foreground mt-2">
          Add extras and choose how often you'd like your clean
          {skipable ? " — or skip to continue." : "."}
        </p>
      </div>

      {/* Booking Frequency */}
      <div className="space-y-3">
        <p id="frequency-label" className="text-sm font-semibold text-foreground">
          Booking Frequency
        </p>
        <div className="grid grid-cols-3 gap-3" role="group" aria-labelledby="frequency-label">
          {FREQUENCY_OPTIONS.map(({ id, label, desc, icon: Icon, badge }) => {
            const isSelected = frequency === id;
            return (
              <button
                key={id}
                type="button"
                aria-pressed={isSelected}
                onClick={() => store.updateData({ frequency: id })}
                className={cn(
                  "relative flex flex-col items-center gap-1.5 p-4 rounded-2xl border text-center transition-all duration-200",
                  isSelected
                    ? "border-primary bg-primary/10 shadow-sm ring-1 ring-primary"
                    : "border-border bg-card hover:border-primary/50",
                )}
              >
                {badge && (
                  <span className="absolute -top-2 left-1/2 -translate-x-1/2 px-2 py-0.5 bg-emerald-500 text-white text-[10px] font-bold rounded-full whitespace-nowrap">
                    {badge}
                  </span>
                )}
                <Icon className={cn("w-5 h-5", isSelected ? "text-primary" : "text-muted-foreground")} aria-hidden="true" />
                <span className={cn("text-sm font-bold", isSelected ? "text-primary" : "text-foreground")}>{label}</span>
                <span className="text-xs text-muted-foreground">{desc}</span>
              </button>
            );
          })}
        </div>
        {frequency !== "once" && (
          <div className="flex items-center gap-2 px-3 py-2 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-sm text-emerald-400 font-medium">
            <RefreshCw className="w-4 h-4 shrink-0" aria-hidden="true" />
            {frequency === "weekly"
              ? "10% recurring discount applied at checkout — cancel anytime."
              : "5% recurring discount applied at checkout — cancel anytime."}
          </div>
        )}
      </div>

      {/* Add-ons */}
      <div className="space-y-3">
        <p className="text-sm font-semibold text-foreground">Optional Add-ons</p>
        <div className="grid sm:grid-cols-2 gap-3" role="group" aria-label="Optional add-on services">
          {addons.map((addon) => {
            const isSelected = selected.has(addon.id);
            return (
              <button
                key={addon.id}
                type="button"
                aria-pressed={isSelected}
                onClick={() => toggleAddon(addon.id)}
                className={cn(
                  "flex items-center justify-between p-4 rounded-2xl border transition-all duration-200 text-left",
                  isSelected
                    ? "border-primary bg-primary/10 shadow-sm ring-1 ring-primary"
                    : "border-border bg-card hover:border-primary/50",
                )}
              >
                <div>
                  <h4 className="font-semibold text-foreground text-sm">{addon.label}</h4>
                  <p className="text-sm text-primary font-medium mt-0.5">{addon.price}</p>
                </div>
                <div
                  aria-hidden="true"
                  className={cn(
                    "w-6 h-6 rounded-full flex items-center justify-center border transition-colors flex-shrink-0",
                    isSelected
                      ? "bg-primary border-primary text-primary-foreground"
                      : "border-muted-foreground/50 text-transparent",
                  )}
                >
                  <Check className="w-4 h-4" />
                </div>
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex gap-4 pt-6 border-t border-border/50">
        <button
          type="button"
          onClick={store.prevStep}
          className="px-6 py-3 rounded-xl font-semibold border border-border hover:bg-secondary transition-colors"
        >
          Back
        </button>
        <button
          type="button"
          onClick={store.nextStep}
          className="flex-1 px-6 py-3 rounded-xl font-bold bg-primary text-primary-foreground hover:shadow-lg hover:shadow-primary/20 hover:-translate-y-0.5 transition-all"
        >
          {selected.size > 0
            ? `Continue with ${selected.size} add-on${selected.size !== 1 ? "s" : ""}`
            : "Continue (skip)"}
        </button>
      </div>
    </motion.div>
  );
}
