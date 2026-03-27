import { useState } from "react";
import { motion } from "framer-motion";
import { useBookingStore } from "@/lib/store";
import { UserCircle } from "lucide-react";

/** Australian phone: mobile 04XX XXX XXX, 1300/1800, or landline 0X XXXX XXXX */
const AU_PHONE_RE = /^(?:\+?61|0)(?:4\d{8}|[23578]\d{8}|1(?:300|800)\d{6})$/;

function isValidAustralianPhone(raw: string): boolean {
  const digits = raw.replace(/[\s\-().+]/g, "");
  return AU_PHONE_RE.test(digits) || digits.length === 0;
}

export function Step6Details() {
  const store = useBookingStore();
  const [error, setError] = useState("");

  const handleNext = () => {
    if (!store.firstName || !store.lastName || !store.email || !store.phone) {
      setError("Please complete all required contact fields.");
      return;
    }
    if (!/^\S+@\S+\.\S+$/.test(store.email)) {
      setError("Please enter a valid email address.");
      return;
    }
    if (!isValidAustralianPhone(store.phone)) {
      setError("Please enter a valid Australian phone number (e.g. 0412 345 678 or 1300 123 456).");
      return;
    }
    setError("");
    store.nextStep();
  };

  return (
    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <UserCircle className="w-6 h-6 text-primary" aria-hidden="true" /> Your Details
        </h2>
        <p className="text-muted-foreground mt-2">How can we contact you about this booking?</p>
      </div>

      <div className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label htmlFor="contact-first-name" className="block text-sm font-medium text-foreground mb-1.5">
              First Name <span className="text-destructive" aria-hidden="true">*</span>
              <span className="sr-only">(required)</span>
            </label>
            <input 
              id="contact-first-name"
              type="text" 
              placeholder="Jane"
              autoComplete="given-name"
              value={store.firstName || ""}
              onChange={(e) => store.updateData({ firstName: e.target.value })}
              className="w-full p-3.5 rounded-xl border border-border bg-card text-foreground focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
            />
          </div>
          <div>
            <label htmlFor="contact-last-name" className="block text-sm font-medium text-foreground mb-1.5">
              Last Name <span className="text-destructive" aria-hidden="true">*</span>
              <span className="sr-only">(required)</span>
            </label>
            <input 
              id="contact-last-name"
              type="text" 
              placeholder="Doe"
              autoComplete="family-name"
              value={store.lastName || ""}
              onChange={(e) => store.updateData({ lastName: e.target.value })}
              className="w-full p-3.5 rounded-xl border border-border bg-card text-foreground focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
            />
          </div>
        </div>

        <div>
          <label htmlFor="contact-email" className="block text-sm font-medium text-foreground mb-1.5">
            Email Address <span className="text-destructive" aria-hidden="true">*</span>
            <span className="sr-only">(required)</span>
          </label>
          <input 
            id="contact-email"
            type="email" 
            placeholder="jane@example.com"
            autoComplete="email"
            value={store.email || ""}
            onChange={(e) => store.updateData({ email: e.target.value })}
            className="w-full p-3.5 rounded-xl border border-border bg-card text-foreground focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
          />
        </div>

        <div>
          <label htmlFor="contact-phone" className="block text-sm font-medium text-foreground mb-1.5">
            Phone Number <span className="text-destructive" aria-hidden="true">*</span>
            <span className="sr-only">(required, Australian number)</span>
          </label>
          <input 
            id="contact-phone"
            type="tel" 
            placeholder="0412 345 678"
            autoComplete="tel"
            value={store.phone || ""}
            onChange={(e) => store.updateData({ phone: e.target.value })}
            className="w-full p-3.5 rounded-xl border border-border bg-card text-foreground focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
          />
        </div>

        <div>
          <label htmlFor="contact-notes" className="block text-sm font-medium text-foreground mb-1.5">
            Access Instructions / Notes (Optional)
          </label>
          <textarea 
            id="contact-notes"
            rows={3}
            placeholder="e.g. Key is under the mat, dog is friendly."
            value={store.notes || ""}
            onChange={(e) => store.updateData({ notes: e.target.value })}
            className="w-full p-3.5 rounded-xl border border-border bg-card text-foreground focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all resize-none"
          />
        </div>
      </div>

      {error && <p role="alert" className="text-destructive text-sm font-medium">{error}</p>}

      <div className="flex gap-4 pt-6 border-t border-border/50">
        <button type="button" onClick={store.prevStep} className="px-6 py-3 rounded-xl font-semibold border border-border hover:bg-secondary transition-colors">
          Back
        </button>
        <button type="button" onClick={handleNext} className="flex-1 px-6 py-3 rounded-xl font-bold bg-primary text-primary-foreground hover:shadow-lg hover:shadow-primary/20 hover:-translate-y-0.5 transition-all">
          Review Quote
        </button>
      </div>
    </motion.div>
  );
}
