import { Link } from "wouter";
import { XCircle } from "lucide-react";
import { motion } from "framer-motion";

export default function Cancelled() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-card border border-border p-8 md:p-12 rounded-3xl max-w-lg text-center shadow-2xl"
      >
        <div className="w-24 h-24 bg-destructive/10 rounded-full flex items-center justify-center mx-auto mb-6">
          <XCircle className="w-12 h-12 text-destructive" />
        </div>
        <h1 className="text-3xl font-extrabold text-foreground mb-4">Payment Cancelled</h1>
        <p className="text-muted-foreground mb-8 text-lg">
          No charges were made. Your booking is currently saved as a draft. You can try again whenever you're ready.
        </p>
        <Link 
          href="/booking" 
          className="inline-block px-8 py-4 rounded-xl font-bold bg-secondary text-secondary-foreground hover:bg-secondary/80 transition-colors w-full"
        >
          Return to Booking Flow
        </Link>
      </motion.div>
    </div>
  );
}
