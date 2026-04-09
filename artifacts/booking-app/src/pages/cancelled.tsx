import { Link } from "wouter";
import { XCircle, RefreshCcw, Phone } from "lucide-react";
import { motion } from "framer-motion";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";

export default function Cancelled() {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />

      <main className="flex-1 flex flex-col items-center justify-center p-4 py-24 gap-6 relative overflow-hidden">
        {/* Ambient glow */}
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[500px] h-[300px] bg-destructive/5 rounded-full blur-3xl pointer-events-none" aria-hidden="true" />

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4, ease: "easeOut" }}
          className="bg-card border border-border p-8 md:p-12 rounded-3xl max-w-lg w-full text-center shadow-2xl space-y-6 relative"
        >
          {/* Icon */}
          <div className="relative w-24 h-24 mx-auto flex-shrink-0">
            <span className="absolute inset-2 rounded-full bg-destructive/8" aria-hidden="true" />
            <div className="relative w-full h-full bg-destructive/10 rounded-full flex items-center justify-center border border-destructive/20">
              <XCircle className="w-12 h-12 text-destructive" aria-hidden="true" />
            </div>
          </div>

          <div>
            <h1 className="text-3xl font-extrabold text-foreground mb-3">Payment Cancelled</h1>
            <p className="text-muted-foreground text-base leading-relaxed">
              No charges were made. Your booking details are saved as a draft — you can pick up right where you left off.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <Link
              href="/booking"
              className="inline-flex items-center justify-center gap-2 flex-1 px-6 py-3.5 rounded-xl font-bold bg-gradient-to-r from-primary to-blue-500 text-primary-foreground shadow-md shadow-primary/20 hover:shadow-primary/40 hover:-translate-y-0.5 transition-all duration-200"
            >
              <RefreshCcw className="w-4 h-4" aria-hidden="true" />
              Try Again
            </Link>
            <a
              href="tel:1300253262"
              className="inline-flex items-center justify-center gap-2 flex-1 px-6 py-3.5 rounded-xl font-bold border border-border text-foreground hover:border-primary/50 hover:bg-primary/5 transition-all duration-200"
            >
              <Phone className="w-4 h-4" aria-hidden="true" />
              Call Us
            </a>
          </div>

          <p className="text-xs text-muted-foreground">
            Need help?{" "}
            <a href="mailto:hello@aussieclean.com.au" className="text-primary hover:underline">
              hello@aussieclean.com.au
            </a>
          </p>
        </motion.div>
      </main>

      <Footer />
    </div>
  );
}
