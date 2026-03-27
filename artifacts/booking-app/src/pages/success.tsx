import { Link } from "wouter";
import { CheckCircle } from "lucide-react";
import { motion } from "framer-motion";

export default function Success() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-card border border-border p-8 md:p-12 rounded-3xl max-w-lg text-center shadow-2xl"
      >
        <div className="w-24 h-24 bg-green-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
          <CheckCircle className="w-12 h-12 text-green-500" />
        </div>
        <h1 className="text-3xl font-extrabold text-foreground mb-4">Booking Confirmed!</h1>
        <p className="text-muted-foreground mb-8 text-lg">
          Thank you for choosing AussieClean. We've received your payment and our team will be in touch shortly.
        </p>
        <Link 
          href="/dashboard" 
          className="inline-block px-8 py-4 rounded-xl font-bold bg-primary text-primary-foreground hover:bg-primary/90 transition-colors w-full"
        >
          View My Bookings
        </Link>
      </motion.div>
    </div>
  );
}
