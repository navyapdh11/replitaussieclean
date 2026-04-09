import { Link } from "wouter";
import { motion } from "framer-motion";
import { Home, ArrowRight, Search } from "lucide-react";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";

const QUICK_LINKS = [
  { label: "Book a Clean",    href: "/booking"   },
  { label: "View Services",   href: "/#services" },
  { label: "My Bookings",     href: "/dashboard" },
  { label: "Contact Us",      href: "/#contact"  },
];

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />

      <main className="flex-1 flex flex-col items-center justify-center px-4 py-24 text-center relative overflow-hidden">
        {/* Ambient glow */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-primary/10 rounded-full blur-3xl pointer-events-none" aria-hidden="true" />

        {/* 404 number — large decorative */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="relative mb-6"
          aria-hidden="true"
        >
          <span
            className="text-[10rem] sm:text-[14rem] font-extrabold leading-none select-none"
            style={{
              background: "linear-gradient(135deg, hsl(189 94% 43% / 0.15), hsl(220 90% 60% / 0.12))",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}
          >
            404
          </span>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-20 h-20 sm:w-28 sm:h-28 bg-primary/10 rounded-full flex items-center justify-center border border-primary/20">
              <Search className="w-8 h-8 sm:w-12 sm:h-12 text-primary" />
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.15 }}
          className="space-y-4 max-w-lg"
        >
          <h1 className="text-3xl sm:text-4xl font-extrabold text-foreground">
            Page not found
          </h1>
          <p className="text-muted-foreground text-base sm:text-lg leading-relaxed">
            The page you're looking for doesn't exist or may have been moved.
            Let's get you back to a clean space.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="flex flex-col sm:flex-row gap-3 mt-10"
        >
          <Link
            href="/"
            className="inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-xl font-bold text-base bg-gradient-to-r from-primary to-blue-500 text-primary-foreground shadow-lg shadow-primary/25 hover:shadow-primary/40 hover:-translate-y-0.5 transition-all duration-200"
          >
            <Home className="w-4 h-4" aria-hidden="true" />
            Return Home
          </Link>
          <Link
            href="/booking"
            className="inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-xl font-bold text-base border border-border text-foreground hover:border-primary/50 hover:bg-primary/5 transition-all duration-200"
          >
            Book a Clean <ArrowRight className="w-4 h-4" aria-hidden="true" />
          </Link>
        </motion.div>

        <motion.nav
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.5 }}
          aria-label="Quick links"
          className="mt-12 flex flex-wrap justify-center gap-x-6 gap-y-2"
        >
          {QUICK_LINKS.map(({ label, href }) => (
            <Link
              key={href}
              href={href}
              className="text-sm text-muted-foreground hover:text-primary transition-colors underline-offset-4 hover:underline"
            >
              {label}
            </Link>
          ))}
        </motion.nav>
      </main>

      <Footer />
    </div>
  );
}
