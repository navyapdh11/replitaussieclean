import { useState } from "react";
import { motion } from "framer-motion";
import { useBookingStore } from "@/lib/store";
import { cn } from "@/lib/utils";
import { Building, Home, BedDouble, Bath } from "lucide-react";

const PROPERTY_TYPES = [
  { id: "house", label: "House", icon: Home },
  { id: "apartment", label: "Apartment", icon: Building },
  { id: "townhouse", label: "Townhouse", icon: Home },
  { id: "office", label: "Office", icon: Building },
];

export function Step2Property() {
  const store = useBookingStore();
  const [error, setError] = useState("");

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
        <h2 className="text-2xl font-bold text-foreground">Property Details</h2>
        <p className="text-muted-foreground mt-2">Tell us about the space we'll be cleaning.</p>
      </div>

      <div className="space-y-4">
        <p className="text-sm font-semibold text-foreground" id="property-type-label">Property Type</p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3" role="group" aria-labelledby="property-type-label">
          {PROPERTY_TYPES.map((t) => {
            const isSelected = store.propertyType === t.id;
            const Icon = t.icon;
            return (
              <button
                key={t.id}
                type="button"
                aria-pressed={isSelected}
                onClick={() => store.updateData({ propertyType: t.id })}
                className={cn(
                  "flex flex-col items-center gap-3 p-4 rounded-xl border transition-all duration-200",
                  isSelected 
                    ? "border-primary bg-primary/10 text-primary ring-1 ring-primary shadow-[0_0_10px_rgba(6,182,212,0.1)]" 
                    : "border-border bg-card hover:border-primary/50 text-muted-foreground hover:text-foreground"
                )}
              >
                <Icon className="w-6 h-6" aria-hidden="true" />
                <span className="font-medium text-sm">{t.label}</span>
              </button>
            )
          })}
        </div>
      </div>

      <div className="grid sm:grid-cols-2 gap-6">
        <div className="space-y-3">
          <label htmlFor="bedrooms-display" className="flex items-center gap-2 text-sm font-semibold text-foreground">
            <BedDouble className="w-4 h-4 text-primary" aria-hidden="true" /> Bedrooms
          </label>
          <div className="flex bg-card border border-border rounded-xl overflow-hidden h-12">
            <button 
              type="button"
              aria-label="Decrease bedrooms"
              onClick={() => store.updateData({ bedrooms: Math.max(1, (store.bedrooms || 1) - 1) })}
              className="px-4 text-xl hover:bg-secondary transition-colors border-r border-border"
            >-</button>
            <div
              id="bedrooms-display"
              role="status"
              aria-live="polite"
              aria-label={`${store.bedrooms || 1} bedroom${(store.bedrooms || 1) !== 1 ? "s" : ""}`}
              className="flex-1 flex items-center justify-center font-bold text-lg"
            >
              {store.bedrooms || 1}
            </div>
            <button 
              type="button"
              aria-label="Increase bedrooms"
              onClick={() => store.updateData({ bedrooms: Math.min(10, (store.bedrooms || 1) + 1) })}
              className="px-4 text-xl hover:bg-secondary transition-colors border-l border-border"
            >+</button>
          </div>
        </div>

        <div className="space-y-3">
          <label htmlFor="bathrooms-display" className="flex items-center gap-2 text-sm font-semibold text-foreground">
            <Bath className="w-4 h-4 text-primary" aria-hidden="true" /> Bathrooms
          </label>
          <div className="flex bg-card border border-border rounded-xl overflow-hidden h-12">
            <button 
              type="button"
              aria-label="Decrease bathrooms"
              onClick={() => store.updateData({ bathrooms: Math.max(1, (store.bathrooms || 1) - 1) })}
              className="px-4 text-xl hover:bg-secondary transition-colors border-r border-border"
            >-</button>
            <div
              id="bathrooms-display"
              role="status"
              aria-live="polite"
              aria-label={`${store.bathrooms || 1} bathroom${(store.bathrooms || 1) !== 1 ? "s" : ""}`}
              className="flex-1 flex items-center justify-center font-bold text-lg"
            >
              {store.bathrooms || 1}
            </div>
            <button 
              type="button"
              aria-label="Increase bathrooms"
              onClick={() => store.updateData({ bathrooms: Math.min(10, (store.bathrooms || 1) + 1) })}
              className="px-4 text-xl hover:bg-secondary transition-colors border-l border-border"
            >+</button>
          </div>
        </div>
      </div>

      {error && <p role="alert" className="text-destructive text-sm font-medium">{error}</p>}

      <div className="flex gap-4 pt-6 border-t border-border/50">
        <button type="button" onClick={store.prevStep} className="px-6 py-3 rounded-xl font-semibold border border-border hover:bg-secondary transition-colors">
          Back
        </button>
        <button type="button" onClick={handleNext} className="flex-1 px-6 py-3 rounded-xl font-bold bg-primary text-primary-foreground hover:shadow-lg hover:shadow-primary/20 hover:-translate-y-0.5 transition-all">
          Continue
        </button>
      </div>
    </motion.div>
  );
}
