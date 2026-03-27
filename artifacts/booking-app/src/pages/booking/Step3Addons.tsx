import { motion } from "framer-motion";
import { useBookingStore } from "@/lib/store";
import { cn } from "@/lib/utils";
import { Check } from "lucide-react";

const ADDONS = [
  { id: "oven", label: "Oven Cleaning", price: "$49" },
  { id: "fridge", label: "Fridge Cleaning", price: "$39" },
  { id: "windows", label: "Internal Windows", price: "$59" },
  { id: "carpet", label: "Carpet Steam Cleaning", price: "$89/room" },
];

export function Step3Addons() {
  const store = useBookingStore();
  const selected = new Set(store.extras);

  const toggleAddon = (id: string) => {
    const newExtras = new Set(selected);
    if (newExtras.has(id)) newExtras.delete(id);
    else newExtras.add(id);
    store.updateData({ extras: Array.from(newExtras) });
  };

  return (
    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-foreground">Extra Services</h2>
        <p className="text-muted-foreground mt-2">Add optional deep-cleaning tasks (can be skipped).</p>
      </div>

      <div className="grid sm:grid-cols-2 gap-4" role="group" aria-label="Optional add-on services">
        {ADDONS.map((addon) => {
          const isSelected = selected.has(addon.id);
          return (
            <button
              key={addon.id}
              type="button"
              aria-pressed={isSelected}
              onClick={() => toggleAddon(addon.id)}
              className={cn(
                "flex items-center justify-between p-5 rounded-2xl border transition-all duration-200 text-left",
                isSelected 
                  ? "border-primary bg-primary/10 shadow-sm ring-1 ring-primary" 
                  : "border-border bg-card hover:border-primary/50"
              )}
            >
              <div>
                <h4 className="font-semibold text-foreground">{addon.label}</h4>
                <p className="text-sm text-primary font-medium mt-1">{addon.price}</p>
              </div>
              <div
                aria-hidden="true"
                className={cn(
                  "w-6 h-6 rounded-full flex items-center justify-center border transition-colors",
                  isSelected ? "bg-primary border-primary text-primary-foreground" : "border-muted-foreground/50 text-transparent"
                )}
              >
                <Check className="w-4 h-4" />
              </div>
            </button>
          )
        })}
      </div>

      <div className="flex gap-4 pt-6 border-t border-border/50">
        <button type="button" onClick={store.prevStep} className="px-6 py-3 rounded-xl font-semibold border border-border hover:bg-secondary transition-colors">
          Back
        </button>
        <button type="button" onClick={store.nextStep} className="flex-1 px-6 py-3 rounded-xl font-bold bg-primary text-primary-foreground hover:shadow-lg hover:shadow-primary/20 hover:-translate-y-0.5 transition-all">
          Continue
        </button>
      </div>
    </motion.div>
  );
}
