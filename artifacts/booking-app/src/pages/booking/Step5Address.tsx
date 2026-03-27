import { useState } from "react";
import { motion } from "framer-motion";
import { useBookingStore } from "@/lib/store";
import { MapPin } from "lucide-react";

const STATES = ["NSW", "VIC", "QLD", "WA", "SA", "TAS", "ACT", "NT"];

export function Step5Address() {
  const store = useBookingStore();
  const [error, setError] = useState("");

  const handleNext = () => {
    if (!store.addressLine1 || !store.suburb || !store.state || !store.postcode) {
      setError("Please complete all required address fields.");
      return;
    }
    if (store.postcode.length !== 4 || isNaN(Number(store.postcode))) {
      setError("Please enter a valid 4-digit Australian postcode.");
      return;
    }
    setError("");
    store.nextStep();
  };

  return (
    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <MapPin className="w-6 h-6 text-primary" /> Property Address
        </h2>
        <p className="text-muted-foreground mt-2">Where is the cleaning taking place?</p>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-foreground mb-1.5">Street Address <span className="text-destructive">*</span></label>
          <input 
            type="text" 
            placeholder="123 Example St"
            value={store.addressLine1 || ""}
            onChange={(e) => store.updateData({ addressLine1: e.target.value })}
            className="w-full p-3.5 rounded-xl border border-border bg-card text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-foreground mb-1.5">Apartment, suite, etc. (Optional)</label>
          <input 
            type="text" 
            placeholder="Unit 4"
            value={store.addressLine2 || ""}
            onChange={(e) => store.updateData({ addressLine2: e.target.value })}
            className="w-full p-3.5 rounded-xl border border-border bg-card text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">Suburb <span className="text-destructive">*</span></label>
            <input 
              type="text" 
              placeholder="Sydney"
              value={store.suburb || ""}
              onChange={(e) => store.updateData({ suburb: e.target.value })}
              className="w-full p-3.5 rounded-xl border border-border bg-card text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">Postcode <span className="text-destructive">*</span></label>
            <input 
              type="text" 
              placeholder="2000"
              maxLength={4}
              value={store.postcode || ""}
              onChange={(e) => store.updateData({ postcode: e.target.value })}
              className="w-full p-3.5 rounded-xl border border-border bg-card text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-foreground mb-2">State <span className="text-destructive">*</span></label>
          <div className="flex flex-wrap gap-2">
            {STATES.map((state) => (
              <button
                key={state}
                onClick={() => store.updateData({ state })}
                className={`px-4 py-2 rounded-lg border text-sm font-semibold transition-colors ${
                  store.state === state 
                    ? "bg-primary border-primary text-primary-foreground" 
                    : "bg-card border-border text-muted-foreground hover:border-primary/50 hover:text-foreground"
                }`}
              >
                {state}
              </button>
            ))}
          </div>
        </div>
      </div>

      {error && <p className="text-destructive text-sm font-medium">{error}</p>}

      <div className="flex gap-4 pt-6 border-t border-border/50">
        <button onClick={store.prevStep} className="px-6 py-3 rounded-xl font-semibold border border-border hover:bg-secondary transition-colors">
          Back
        </button>
        <button onClick={handleNext} className="flex-1 px-6 py-3 rounded-xl font-bold bg-primary text-primary-foreground hover:shadow-lg hover:shadow-primary/20 hover:-translate-y-0.5 transition-all">
          Continue
        </button>
      </div>
    </motion.div>
  );
}
