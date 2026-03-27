import { motion } from "framer-motion";
import { Sparkles, Home, Building2, Briefcase, HeartHandshake } from "lucide-react";
import { useBookingStore } from "@/lib/store";
import { cn } from "@/lib/utils";

const SERVICES = [
  { id: "standard_clean", label: "Standard Home Clean", icon: Home, desc: "Regular upkeep for a tidy, comfortable home." },
  { id: "deep_clean", label: "Deep / Spring Clean", icon: Sparkles, desc: "Detailed cleaning targeting grime and buildup." },
  { id: "end_of_lease", label: "End-of-Lease (Bond-back)", icon: Building2, desc: "Rigorous cleaning guaranteed to satisfy agents." },
  { id: "office_clean", label: "Office / Commercial", icon: Briefcase, desc: "Professional environment maintenance." },
  { id: "ndis_support", label: "NDIS Support Cleaning", icon: HeartHandshake, desc: "Empathetic, structured assistance cleaning." },
];

export function Step1Service() {
  const { serviceType, updateData, nextStep } = useBookingStore();

  const handleSelect = (id: string) => {
    updateData({ serviceType: id });
    setTimeout(nextStep, 250); // slight delay for visual feedback
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      className="space-y-6"
    >
      <div>
        <h2 className="text-2xl font-bold text-foreground">What type of clean do you need?</h2>
        <p className="text-muted-foreground mt-2">Select the primary service type for your property.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2" role="group" aria-label="Service type">
        {SERVICES.map((s) => {
          const isSelected = serviceType === s.id;
          const Icon = s.icon;
          return (
            <button
              key={s.id}
              type="button"
              aria-pressed={isSelected}
              onClick={() => handleSelect(s.id)}
              className={cn(
                "flex items-start gap-4 p-5 rounded-2xl border text-left transition-all duration-300",
                "hover:border-primary/50 hover:bg-primary/5",
                isSelected 
                  ? "border-primary bg-primary/10 shadow-[0_0_15px_rgba(6,182,212,0.15)] ring-1 ring-primary" 
                  : "border-border bg-card shadow-sm"
              )}
            >
              <div className={cn(
                "p-3 rounded-xl",
                isSelected ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground"
              )}>
                <Icon className="w-6 h-6" aria-hidden="true" />
              </div>
              <div>
                <h3 className={cn("font-bold", isSelected ? "text-foreground" : "text-foreground")}>{s.label}</h3>
                <p className="text-sm text-muted-foreground mt-1 leading-snug">{s.desc}</p>
              </div>
            </button>
          )
        })}
      </div>
    </motion.div>
  );
}
