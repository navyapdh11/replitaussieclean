import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { useBookingStore, TOTAL_STEPS } from "@/lib/store";
import { Step1Service } from "./Step1Service";
import { Step2Property } from "./Step2Property";
import { Step3Addons } from "./Step3Addons";
import { Step4Schedule } from "./Step4Schedule";
import { Step5Address } from "./Step5Address";
import { Step6Details } from "./Step6Details";
import { Step7Review } from "./Step7Review";
import { Step8Payment } from "./Step8Payment";
import { motion } from "framer-motion";
import { useEffect, useRef } from "react";

const STEP_LABELS: Record<number, string> = {
  1: "Choose service",
  2: "Property details",
  3: "Optional add-ons",
  4: "Schedule",
  5: "Property address",
  6: "Your details",
  7: "Review & quote",
  8: "Payment",
};

export default function BookingFlow() {
  const step = useBookingStore(s => s.step);
  const pct = Math.round((step / TOTAL_STEPS) * 100);

  // Move focus to the step heading each time the step changes so screen readers
  // announce the new step immediately without waiting for a live region poll.
  const headingRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    headingRef.current?.focus();
  }, [step]);

  const renderStep = () => {
    switch (step) {
      case 1: return <Step1Service />;
      case 2: return <Step2Property />;
      case 3: return <Step3Addons />;
      case 4: return <Step4Schedule />;
      case 5: return <Step5Address />;
      case 6: return <Step6Details />;
      case 7: return <Step7Review />;
      case 8: return <Step8Payment />;
      default: return <Step1Service />;
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-background pt-20">
      {/* ── Skip Navigation (WCAG 2.4.1) ─────────────────────────────────── */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:z-50 focus:top-4 focus:left-4 focus:px-4 focus:py-2 focus:bg-primary focus:text-primary-foreground focus:rounded-lg focus:font-semibold focus:outline-none focus:ring-2 focus:ring-primary-foreground"
      >
        Skip to main content
      </a>

      <Navbar />

      <main id="main-content" className="flex-1 py-12 px-4 sm:px-6">
        <div className="max-w-2xl mx-auto">

          {/* ── Progress Bar (WCAG 1.3.1, 4.1.2) ─────────────────────────── */}
          <div className="mb-8">
            <div className="flex justify-between items-center mb-3 text-sm font-semibold">
              <span className="text-muted-foreground" aria-hidden="true">
                Step {step} of {TOTAL_STEPS}
              </span>
              <span className="text-primary" aria-hidden="true">{pct}%</span>
            </div>
            {/* Visually-hidden label read by screen readers for the progress bar */}
            <div
              role="progressbar"
              aria-label={`Booking progress: step ${step} of ${TOTAL_STEPS}, ${pct}% complete`}
              aria-valuenow={step}
              aria-valuemin={1}
              aria-valuemax={TOTAL_STEPS}
              className="w-full bg-secondary h-2.5 rounded-full overflow-hidden"
            >
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${pct}%` }}
                transition={{ duration: 0.5, ease: "easeOut" }}
                className="bg-primary h-full rounded-full"
              />
            </div>
          </div>

          {/* ── Focus target: announced on step change ─────────────────────── */}
          {/*
            tabIndex={-1} makes this programmatically focusable without inserting
            it into the natural tab order. outline:none hides the focus ring on
            this invisible anchor (WCAG 2.4.3 / focus management pattern).
          */}
          <div
            ref={headingRef}
            tabIndex={-1}
            aria-label={`Step ${step} of ${TOTAL_STEPS}: ${STEP_LABELS[step]}`}
            className="outline-none"
          />

          {/* ── Step Container ─────────────────────────────────────────────── */}
          <div
            className="bg-card/50 backdrop-blur-sm border border-border/50 rounded-3xl p-6 sm:p-8 shadow-2xl shadow-black/10"
            aria-live="polite"
            aria-atomic="false"
          >
            {renderStep()}
          </div>

        </div>
      </main>

      <Footer />
    </div>
  );
}
