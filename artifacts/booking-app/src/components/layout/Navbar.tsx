import { Link, useLocation } from "wouter";
import { Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

export function Navbar() {
  const [location] = useLocation();

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          <Link href="/" className="flex items-center gap-2 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-blue-600 flex items-center justify-center shadow-lg shadow-primary/20 group-hover:shadow-primary/40 transition-all duration-300">
              <Sparkles className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="font-display font-bold text-xl tracking-wide text-foreground">
              Aussie<span className="text-primary">Clean</span>
            </span>
          </Link>

          <div className="flex items-center gap-6">
            <Link 
              href="/dashboard" 
              className={cn(
                "text-sm font-medium transition-colors hover:text-primary",
                location === "/dashboard" ? "text-primary" : "text-muted-foreground"
              )}
            >
              My Bookings
            </Link>
            <Link 
              href="/booking" 
              className="px-5 py-2.5 rounded-full font-semibold bg-primary/10 text-primary border border-primary/20 hover:bg-primary hover:text-primary-foreground hover:shadow-lg hover:shadow-primary/20 hover:-translate-y-0.5 transition-all duration-300"
            >
              Book Now
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
}
