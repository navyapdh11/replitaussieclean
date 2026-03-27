import { useState } from "react";
import { motion } from "framer-motion";
import { useBookingStore } from "@/lib/store";
import { UserCircle } from "lucide-react";

export function Step6Details() {
  const store = useBookingStore();
  const [error, setError] = useState("");

  const handleNext = () => {
    if (!store.firstName || !store.lastName || !store.email || !store.phone) {
      setError("Please complete all required contact fields.");
      return;
    }
    // Basic email validation
    if (!/^\S+@\S+\.\S+$/.test(store.email)) {
      setError("Please enter a valid email address.");
      return;
    }
    setError("");
    store.nextStep();
  };

  return (
    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <UserCircle className="w-6 h-6 text-primary" /> Your Details
        </h2>
        <p className="text-muted-foreground mt-2">How can we contact you about this booking?</p>
      </div>

      <div className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">First Name <span className="text-destructive">*</span></label>
            <input 
              type="text" 
              placeholder="Jane"
              value={store.firstName || ""}
              onChange={(e) => store.updateData({ firstName: e.target.value })}
              className="w-full p-3.5 rounded-xl border border-border bg-card text-foreground focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">Last Name <span className="text-destructive">*</span></label>
            <input 
              type="text" 
              placeholder="Doe"
              value={store.lastName || ""}
              onChange={(e) => store.updateData({ lastName: e.target.value })}
              className="w-full p-3.5 rounded-xl border border-border bg-card text-foreground focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-foreground mb-1.5">Email Address <span className="text-destructive">*</span></label>
          <input 
            type="email" 
            placeholder="jane@example.com"
            value={store.email || ""}
            onChange={(e) => store.updateData({ email: e.target.value })}
            className="w-full p-3.5 rounded-xl border border-border bg-card text-foreground focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-foreground mb-1.5">Phone Number <span className="text-destructive">*</span></label>
          <input 
            type="tel" 
            placeholder="0412 345 678"
            value={store.phone || ""}
            onChange={(e) => store.updateData({ phone: e.target.value })}
            className="w-full p-3.5 rounded-xl border border-border bg-card text-foreground focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-foreground mb-1.5">Access Instructions / Notes (Optional)</label>
          <textarea 
            rows={3}
            placeholder="e.g. Key is under the mat, dog is friendly."
            value={store.notes || ""}
            onChange={(e) => store.updateData({ notes: e.target.value })}
            className="w-full p-3.5 rounded-xl border border-border bg-card text-foreground focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all resize-none"
          />
        </div>
      </div>

      {error && <p className="text-destructive text-sm font-medium">{error}</p>}

      <div className="flex gap-4 pt-6 border-t border-border/50">
        <button onClick={store.prevStep} className="px-6 py-3 rounded-xl font-semibold border border-border hover:bg-secondary transition-colors">
          Back
        </button>
        <button onClick={handleNext} className="flex-1 px-6 py-3 rounded-xl font-bold bg-primary text-primary-foreground hover:shadow-lg hover:shadow-primary/20 hover:-translate-y-0.5 transition-all">
          Review Quote
        </button>
      </div>
    </motion.div>
  );
}
