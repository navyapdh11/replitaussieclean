import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { useBookingStore } from "@/lib/store";
import { Step1Service } from "./Step1Service";
import { Step2Property } from "./Step2Property";
import { Step3Addons } from "./Step3Addons";
import { Step4Schedule } from "./Step4Schedule";
import { Step5Address } from "./Step5Address";
import { Step6Details } from "./Step6Details";
import { Step7Review } from "./Step7Review";
import { Step8Payment } from "./Step8Payment";
import { motion } from "framer-motion";

export default function BookingFlow() {
  const step = useBookingStore(s => s.step);

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
      <Navbar />
      
      <main className="flex-1 py-12 px-4 sm:px-6">
        <div className="max-w-2xl mx-auto">
          {/* Progress Bar */}
          <div className="mb-8">
            <div className="flex justify-between items-center mb-3 text-sm font-semibold">
              <span className="text-muted-foreground">Step {step} of 8</span>
              <span className="text-primary">{Math.round((step / 8) * 100)}%</span>
            </div>
            <div className="w-full bg-secondary h-2.5 rounded-full overflow-hidden">
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: `${(step / 8) * 100}%` }}
                transition={{ duration: 0.5, ease: "easeOut" }}
                className="bg-primary h-full rounded-full"
              />
            </div>
          </div>

          {/* Step Container */}
          <div className="bg-card/50 backdrop-blur-sm border border-border/50 rounded-3xl p-6 sm:p-8 shadow-2xl shadow-black/10">
            {renderStep()}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
