import { useState } from "react";
import { motion } from "framer-motion";
import { useBookingStore } from "@/lib/store";
import { cn } from "@/lib/utils";
import {
  Building, Home, BedDouble, Bath, Layers,
  Factory, Stethoscope, Hotel, GraduationCap,
  ShoppingBag, Users,
} from "lucide-react";

interface PropertyOption {
  id: string;
  label: string;
  icon: React.ElementType;
}

interface ServicePropertyConfig {
  title: string;
  subtitle: string;
  options: PropertyOption[];
  bedroomsLabel: string;
  bathroomsLabel: string;
  bedroomsHint?: string;
}

const RESIDENTIAL_OPTS: PropertyOption[] = [
  { id: "house",     label: "House",     icon: Home      },
  { id: "apartment", label: "Apartment", icon: Building  },
  { id: "townhouse", label: "Townhouse", icon: Home      },
  { id: "unit",      label: "Unit",      icon: Layers    },
];

const COMMERCIAL_OPTS: PropertyOption[] = [
  { id: "office",      label: "Office",      icon: Building  },
  { id: "commercial",  label: "Commercial",  icon: Building  },
  { id: "retail",      label: "Retail",      icon: ShoppingBag },
  { id: "strata",      label: "Strata",      icon: Layers    },
  { id: "hospitality", label: "Hospitality", icon: Hotel     },
];

const INDUSTRIAL_OPTS: PropertyOption[] = [
  { id: "warehouse",  label: "Warehouse",  icon: Factory   },
  { id: "commercial", label: "Commercial", icon: Building  },
];

const MEDICAL_OPTS: PropertyOption[] = [
  { id: "medical_facility", label: "Medical Facility", icon: Stethoscope },
  { id: "commercial",       label: "Commercial",       icon: Building    },
];

const SCHOOL_OPTS: PropertyOption[] = [
  { id: "school",     label: "School / Childcare", icon: GraduationCap },
  { id: "commercial", label: "Commercial",          icon: Building      },
];

const AGED_CARE_OPTS: PropertyOption[] = [
  { id: "medical_facility", label: "Care Facility", icon: Users     },
  { id: "house",            label: "Residence",     icon: Home      },
  { id: "apartment",        label: "Apartment",     icon: Building  },
];

/** Map serviceType → property config */
function getConfig(serviceType?: string): ServicePropertyConfig {
  switch (serviceType) {
    case "office_clean":
    case "strata_clean":
    case "retail_clean":
    case "hospitality_clean":
      return {
        title: "Premises Details",
        subtitle: "Tell us about the commercial space.",
        options: COMMERCIAL_OPTS,
        bedroomsLabel: "Offices / Rooms",
        bathroomsLabel: "Bathrooms",
        bedroomsHint: "Count of individual offices or service rooms",
      };
    case "industrial_clean":
    case "post_construction_clean":
    case "pressure_wash":
      return {
        title: "Site Details",
        subtitle: "Tell us about the site.",
        options: INDUSTRIAL_OPTS,
        bedroomsLabel: "Site Floors / Sections",
        bathroomsLabel: "Bathrooms / Amenities",
      };
    case "medical_clean":
      return {
        title: "Facility Details",
        subtitle: "Tell us about the healthcare facility.",
        options: MEDICAL_OPTS,
        bedroomsLabel: "Treatment Rooms / Bays",
        bathroomsLabel: "Bathrooms / Wet Rooms",
      };
    case "aged_care_clean":
    case "ndis_support":
      return {
        title: "Care Environment",
        subtitle: "Tell us about the care environment.",
        options: AGED_CARE_OPTS,
        bedroomsLabel: "Bedrooms / Rooms",
        bathroomsLabel: "Bathrooms",
      };
    case "school_clean":
      return {
        title: "Educational Facility",
        subtitle: "Tell us about the school or childcare centre.",
        options: SCHOOL_OPTS,
        bedroomsLabel: "Classrooms / Rooms",
        bathroomsLabel: "Bathrooms",
        bedroomsHint: "Number of classrooms or service rooms",
      };
    case "biohazard_clean":
    case "solar_duct_clean":
      return {
        title: "Property Type",
        subtitle: "Tell us about the property.",
        options: [...RESIDENTIAL_OPTS, ...COMMERCIAL_OPTS.slice(0, 2)],
        bedroomsLabel: "Rooms / Areas",
        bathroomsLabel: "Bathrooms",
      };
    default:
      // Residential and everything else
      return {
        title: "Property Details",
        subtitle: "Tell us about the space we'll be cleaning.",
        options: RESIDENTIAL_OPTS,
        bedroomsLabel: "Bedrooms",
        bathroomsLabel: "Bathrooms",
      };
  }
}

function Counter({
  value,
  min,
  max,
  onChange,
  label,
  hint,
  id,
}: {
  value: number;
  min: number;
  max: number;
  onChange: (v: number) => void;
  label: string;
  hint?: string;
  id: string;
}) {
  return (
    <div className="space-y-2">
      <div>
        <label htmlFor={id} className="text-sm font-semibold text-foreground flex items-center gap-1.5">
          {label === "Bedrooms" || label === "Rooms / Areas" || label.includes("Room") ? (
            <BedDouble className="w-4 h-4 text-primary" aria-hidden="true" />
          ) : (
            <Bath className="w-4 h-4 text-primary" aria-hidden="true" />
          )}
          {label}
        </label>
        {hint && <p className="text-xs text-muted-foreground mt-0.5">{hint}</p>}
      </div>
      <div className="flex bg-card border border-border rounded-xl overflow-hidden h-12">
        <button
          type="button"
          aria-label={`Decrease ${label}`}
          onClick={() => onChange(Math.max(min, value - 1))}
          className="px-4 text-xl hover:bg-secondary transition-colors border-r border-border"
        >
          −
        </button>
        <div
          id={id}
          role="status"
          aria-live="polite"
          aria-label={`${value} ${label}`}
          className="flex-1 flex items-center justify-center font-bold text-lg"
        >
          {value}
        </div>
        <button
          type="button"
          aria-label={`Increase ${label}`}
          onClick={() => onChange(Math.min(max, value + 1))}
          className="px-4 text-xl hover:bg-secondary transition-colors border-l border-border"
        >
          +
        </button>
      </div>
    </div>
  );
}

export function Step2Property() {
  const store = useBookingStore();
  const [error, setError] = useState("");

  const config = getConfig(store.serviceType);

  const handleNext = () => {
    if (!store.propertyType) {
      setError("Please select a property type.");
      return;
    }
    setError("");
    store.nextStep();
  };

  return (
    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-foreground">{config.title}</h2>
        <p className="text-muted-foreground mt-2">{config.subtitle}</p>
      </div>

      <div className="space-y-4">
        <p className="text-sm font-semibold text-foreground" id="property-type-label">
          Property Type
        </p>
        <div
          className={cn(
            "grid gap-3",
            config.options.length <= 4 ? "grid-cols-2 sm:grid-cols-4" : "grid-cols-2 sm:grid-cols-3",
          )}
          role="group"
          aria-labelledby="property-type-label"
        >
          {config.options.map((t) => {
            const isSelected = store.propertyType === t.id;
            const Icon = t.icon;
            return (
              <button
                key={t.id}
                type="button"
                aria-pressed={isSelected}
                onClick={() => { store.updateData({ propertyType: t.id }); setError(""); }}
                className={cn(
                  "flex flex-col items-center gap-3 p-4 rounded-xl border transition-all duration-200",
                  isSelected
                    ? "border-primary bg-primary/10 text-primary ring-1 ring-primary shadow-[0_0_10px_rgba(6,182,212,0.1)]"
                    : "border-border bg-card hover:border-primary/50 text-muted-foreground hover:text-foreground",
                )}
              >
                <Icon className="w-6 h-6" aria-hidden="true" />
                <span className="font-medium text-sm text-center leading-tight">{t.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="grid sm:grid-cols-2 gap-6">
        <Counter
          id="bedrooms-display"
          label={config.bedroomsLabel}
          hint={config.bedroomsHint}
          value={store.bedrooms || 1}
          min={1}
          max={20}
          onChange={(v) => store.updateData({ bedrooms: v })}
        />
        <Counter
          id="bathrooms-display"
          label={config.bathroomsLabel}
          value={store.bathrooms || 1}
          min={1}
          max={20}
          onChange={(v) => store.updateData({ bathrooms: v })}
        />
      </div>

      {error && <p role="alert" className="text-destructive text-sm font-medium">{error}</p>}

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
          onClick={handleNext}
          className="flex-1 px-6 py-3 rounded-xl font-bold bg-primary text-primary-foreground hover:shadow-lg hover:shadow-primary/20 hover:-translate-y-0.5 transition-all"
        >
          Continue
        </button>
      </div>
    </motion.div>
  );
}
