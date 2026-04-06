import { useState } from "react";
import { motion } from "framer-motion";
import { useBookingStore } from "@/lib/store";
import { cn } from "@/lib/utils";
import { Calendar, Clock, AlertTriangle, TrendingUp } from "lucide-react";

const TIME_SLOTS = [
  { id: "08:00-12:00", label: "Morning",   time: "8am – 12pm", peakHour: false },
  { id: "12:00-16:00", label: "Afternoon", time: "12pm – 4pm", peakHour: false },
  { id: "16:00-20:00", label: "Evening",   time: "4pm – 8pm",  peakHour: true  },
];

function isWeekend(dateStr: string): boolean {
  if (!dateStr) return false;
  const d = new Date(dateStr + "T12:00:00");
  return d.getDay() === 0 || d.getDay() === 6;
}

export function Step4Schedule() {
  const store = useBookingStore();
  const [error, setError] = useState("");

  const _now = new Date();
  const today = `${_now.getFullYear()}-${String(_now.getMonth() + 1).padStart(2, "0")}-${String(_now.getDate()).padStart(2, "0")}`;

  const weekend = store.date ? isWeekend(store.date) : false;
  const peakSlot = store.timeSlot === "16:00-20:00";
  const showSurchargeWarning = weekend || peakSlot;

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
            className="w-full p-4 rounded-xl border border-border bg-card text-foreground focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
            style={{ colorScheme: "inherit" }}
          />
          {weekend && store.date && (
            <div className="flex items-center gap-2 px-3 py-2 bg-yellow-500/10 border border-yellow-500/20 rounded-xl text-xs text-yellow-400 font-medium">
              <TrendingUp className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
              Weekend rate applies (+15%) — reflected in your quote
            </div>
          )}
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
                      : "border-border bg-card hover:border-primary/50",
                  )}
                >
                  <div className="flex items-center gap-3">
                    <span className={cn("font-bold", isSelected ? "text-primary" : "text-foreground")}>{slot.label}</span>
                    {slot.peakHour && (
                      <span className="px-1.5 py-0.5 bg-orange-500/15 border border-orange-500/25 text-orange-400 text-[10px] font-bold rounded-md">
                        PEAK RATE
                      </span>
                    )}
                  </div>
                  <span className="text-muted-foreground text-sm font-medium">{slot.time}</span>
                </button>
              );
            })}
          </div>
          {peakSlot && (
            <div className="flex items-center gap-2 px-3 py-2 bg-orange-500/10 border border-orange-500/20 rounded-xl text-xs text-orange-400 font-medium">
              <AlertTriangle className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
              Peak-hour demand pricing applies to 4–8pm slots (+20%) — reflected in your quote
            </div>
          )}
          {showSurchargeWarning && (
            <p className="text-xs text-muted-foreground">
              Surcharges are automatically factored into your dynamic quote in the next step.
            </p>
          )}
        </div>
      </div>

      {error && (
        <p role="alert" aria-live="assertive" className="text-destructive text-sm font-medium flex items-center gap-1.5">
          <span aria-hidden="true">⚠</span> {error}
        </p>
      )}

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
