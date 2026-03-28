import { useState } from "react";
import { motion } from "framer-motion";
import { useBookingStore } from "@/lib/store";
import { cn } from "@/lib/utils";
import { Calendar, Clock } from "lucide-react";

const TIME_SLOTS = [
  { id: "08:00-12:00", label: "Morning", time: "8am - 12pm" },
  { id: "12:00-16:00", label: "Afternoon", time: "12pm - 4pm" },
  { id: "16:00-20:00", label: "Evening", time: "4pm - 8pm" },
];

export function Step4Schedule() {
  const store = useBookingStore();
  const [error, setError] = useState("");
  
  /* Use the browser's local date so Australian customers see today's date
     correctly rather than UTC midnight (which can be yesterday in AEST/AEDT). */
  const _now = new Date();
  const today = `${_now.getFullYear()}-${String(_now.getMonth() + 1).padStart(2, "0")}-${String(_now.getDate()).padStart(2, "0")}`;

  const handleNext = () => {
    if (!store.date || !store.timeSlot) {
      setError("Please select both a date and an arrival window.");
      return;
    }
    setError("");
    store.nextStep();
  };

  return (
    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-foreground">Schedule your clean</h2>
        <p className="text-muted-foreground mt-2">When should our team arrive?</p>
      </div>

      <div className="space-y-6">
        <div className="space-y-3">
          <label htmlFor="booking-date" className="flex items-center gap-2 text-sm font-semibold text-foreground">
            <Calendar className="w-4 h-4 text-primary" aria-hidden="true" /> Select Date
          </label>
          <input 
            id="booking-date"
            type="date" 
            min={today}
            value={store.date || ""}
            onChange={(e) => store.updateData({ date: e.target.value })}
            className="w-full p-4 rounded-xl border border-border bg-card text-foreground focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all color-scheme-dark"
            style={{ colorScheme: 'dark' }}
          />
        </div>

        <div className="space-y-3">
          <p id="arrival-window-label" className="flex items-center gap-2 text-sm font-semibold text-foreground">
            <Clock className="w-4 h-4 text-primary" aria-hidden="true" /> Arrival Window
          </p>
          <div className="grid gap-3" role="group" aria-labelledby="arrival-window-label">
            {TIME_SLOTS.map((slot) => {
              const isSelected = store.timeSlot === slot.id;
              return (
                <button
                  key={slot.id}
                  type="button"
                  aria-pressed={isSelected}
                  onClick={() => store.updateData({ timeSlot: slot.id })}
                  className={cn(
                    "flex items-center justify-between p-4 rounded-xl border text-left transition-all",
                    isSelected 
                      ? "border-primary bg-primary/10 ring-1 ring-primary shadow-sm" 
                      : "border-border bg-card hover:border-primary/50"
                  )}
                >
                  <span className={cn("font-bold", isSelected ? "text-primary" : "text-foreground")}>{slot.label}</span>
                  <span className="text-muted-foreground text-sm font-medium">{slot.time}</span>
                </button>
              )
            })}
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
