import { useState, useRef, useEffect } from "react";
import { Link, useLocation } from "wouter";
import {
  Sparkles, ChevronDown, ClipboardList, Phone, Star, Home,
  Brush, Wind, Key, Building2, Layers, ShieldCheck, Menu, X,
} from "lucide-react";
import { cn } from "@/lib/utils";

const SERVICES = [
  { label: "Standard Clean",  value: "standard_clean",  icon: Home,        desc: "Regular home maintenance clean" },
  { label: "Deep Clean",      value: "deep_clean",       icon: Wind,        desc: "Thorough top-to-bottom clean" },
  { label: "End of Lease",    value: "end_of_lease",     icon: Key,         desc: "Bond-back guaranteed" },
  { label: "Office Clean",    value: "office_clean",     icon: Building2,   desc: "Professional workspace hygiene" },
  { label: "Carpet Clean",    value: "carpet_clean",     icon: Layers,      desc: "Deep steam carpet treatment" },
];

const NAV_LINKS = [
  { href: "/booking",   label: "My Bookings",  icon: ClipboardList },
  { href: "/dashboard", label: "Track Booking", icon: Star          },
];

const ADMIN_LINKS = [
  { href: "/admin",       label: "Admin Dashboard", icon: ShieldCheck },
  { href: "/saas-admin",  label: "SaaS Admin",      icon: Building2   },
];

function useDropdown() {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const esc = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    document.addEventListener("mousedown", handler);
    document.addEventListener("keydown", esc);
    return () => { document.removeEventListener("mousedown", handler); document.removeEventListener("keydown", esc); };
  }, []);
  return { open, setOpen, ref };
}

export function Navbar() {
  const [location] = useLocation();
  const services   = useDropdown();
  const admin      = useDropdown();
  const [mobileOpen, setMobileOpen] = useState(false);

  const closeAll = () => {
    services.setOpen(false);
    admin.setOpen(false);
    setMobileOpen(false);
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">

          {/* Logo */}
          <Link href="/" onClick={closeAll} className="flex items-center gap-2 group shrink-0">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-blue-600 flex items-center justify-center shadow-lg shadow-primary/20 group-hover:shadow-primary/40 transition-all duration-300">
              <Sparkles className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="font-display font-bold text-xl tracking-wide text-foreground">
              Aussie<span className="text-primary">Clean</span>
            </span>
          </Link>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-1">

            {/* Services dropdown */}
            <div ref={services.ref} className="relative">
              <button
                onClick={() => { services.setOpen((o) => !o); admin.setOpen(false); }}
                className={cn(
                  "flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-colors",
                  services.open ? "text-primary bg-primary/10" : "text-muted-foreground hover:text-foreground hover:bg-muted/50",
                )}
              >
                <Brush className="w-4 h-4" />
                Services
                <ChevronDown className={cn("w-3.5 h-3.5 transition-transform", services.open && "rotate-180")} />
              </button>

              {services.open && (
                <div className="absolute top-full left-0 mt-2 w-72 rounded-2xl border border-border bg-card shadow-2xl shadow-black/30 overflow-hidden">
                  <div className="p-2 space-y-0.5">
                    {SERVICES.map(({ label, value, icon: Icon, desc }) => (
                      <Link
                        key={value}
                        href={`/booking?service=${value}`}
                        onClick={closeAll}
                        className="flex items-start gap-3 px-3 py-2.5 rounded-xl hover:bg-muted/60 transition-colors group"
                      >
                        <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 group-hover:bg-primary/20 transition-colors">
                          <Icon className="w-4 h-4 text-primary" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-foreground">{label}</p>
                          <p className="text-xs text-muted-foreground leading-tight">{desc}</p>
                        </div>
                      </Link>
                    ))}
                  </div>
                  <div className="border-t border-border p-2">
                    <Link
                      href="/booking"
                      onClick={closeAll}
                      className="flex items-center justify-center gap-2 w-full px-4 py-2 rounded-xl bg-primary/10 text-primary text-sm font-semibold hover:bg-primary/20 transition-colors"
                    >
                      View all services →
                    </Link>
                  </div>
                </div>
              )}
            </div>

            {/* Contact */}
            <Link
              href="/#contact"
              onClick={closeAll}
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
            >
              <Phone className="w-4 h-4" />
              Contact
            </Link>

            {/* My Bookings */}
            <Link
              href="/dashboard"
              onClick={closeAll}
              className={cn(
                "flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-colors",
                location === "/dashboard" ? "text-primary bg-primary/10" : "text-muted-foreground hover:text-foreground hover:bg-muted/50",
              )}
            >
              <ClipboardList className="w-4 h-4" />
              My Bookings
            </Link>

            {/* Admin dropdown */}
            <div ref={admin.ref} className="relative">
              <button
                onClick={() => { admin.setOpen((o) => !o); services.setOpen(false); }}
                className={cn(
                  "flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-colors",
                  admin.open
                    ? "text-purple-400 bg-purple-500/10"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/50",
                )}
              >
                <ShieldCheck className="w-4 h-4" />
                Admin Only
                <ChevronDown className={cn("w-3.5 h-3.5 transition-transform", admin.open && "rotate-180")} />
              </button>

              {admin.open && (
                <div className="absolute top-full right-0 mt-2 w-56 rounded-2xl border border-purple-500/30 bg-card shadow-2xl shadow-black/30 overflow-hidden">
                  <div className="p-1.5 space-y-0.5">
                    {ADMIN_LINKS.map(({ href, label, icon: Icon }) => (
                      <Link
                        key={href}
                        href={href}
                        onClick={closeAll}
                        className={cn(
                          "flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors",
                          location === href
                            ? "bg-purple-500/15 text-purple-400"
                            : "text-muted-foreground hover:bg-muted/60 hover:text-foreground",
                        )}
                      >
                        <Icon className="w-4 h-4 text-purple-400 shrink-0" />
                        {label}
                      </Link>
                    ))}
                    <div className="border-t border-border/50 mt-1 pt-1">
                      <Link
                        href="/admin#system"
                        onClick={closeAll}
                        className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-medium text-muted-foreground hover:bg-muted/60 hover:text-foreground transition-colors"
                      >
                        <ShieldCheck className="w-4 h-4 text-purple-400 shrink-0" />
                        Admin Only Tab
                      </Link>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Book Now CTA */}
            <Link
              href="/booking"
              onClick={closeAll}
              className="ml-2 px-5 py-2.5 rounded-full font-semibold bg-primary/10 text-primary border border-primary/20 hover:bg-primary hover:text-primary-foreground hover:shadow-lg hover:shadow-primary/20 hover:-translate-y-0.5 transition-all duration-300 text-sm"
            >
              Book Now
            </Link>
          </div>

          {/* Mobile hamburger */}
          <button
            className="md:hidden p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
            onClick={() => setMobileOpen((o) => !o)}
            aria-label="Toggle menu"
          >
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="md:hidden border-t border-border/50 bg-background/95 backdrop-blur-xl">
          <div className="max-w-7xl mx-auto px-4 py-4 space-y-1">

            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground px-3 py-2">Services</p>
            {SERVICES.map(({ label, value, icon: Icon }) => (
              <Link
                key={value}
                href={`/booking?service=${value}`}
                onClick={closeAll}
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
              >
                <Icon className="w-4 h-4 text-primary shrink-0" />
                {label}
              </Link>
            ))}

            <div className="border-t border-border/50 pt-2 mt-2">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground px-3 py-2">Navigation</p>
              <Link href="/#contact" onClick={closeAll} className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors">
                <Phone className="w-4 h-4 shrink-0" /> Contact
              </Link>
              <Link href="/dashboard" onClick={closeAll} className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors">
                <ClipboardList className="w-4 h-4 shrink-0" /> My Bookings
              </Link>
            </div>

            <div className="border-t border-border/50 pt-2 mt-2">
              <p className="text-xs font-semibold uppercase tracking-wider text-purple-400/70 px-3 py-2">Admin Only</p>
              {ADMIN_LINKS.map(({ href, label, icon: Icon }) => (
                <Link key={href} href={href} onClick={closeAll} className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors">
                  <Icon className="w-4 h-4 text-purple-400 shrink-0" /> {label}
                </Link>
              ))}
              <Link href="/admin#system" onClick={closeAll} className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors">
                <ShieldCheck className="w-4 h-4 text-purple-400 shrink-0" /> Admin Only Tab
              </Link>
            </div>

            <div className="pt-3">
              <Link
                href="/booking"
                onClick={closeAll}
                className="block w-full text-center px-5 py-3 rounded-xl font-semibold bg-gradient-to-r from-primary to-blue-500 text-primary-foreground shadow-lg hover:opacity-90 transition-opacity"
              >
                Book Now
              </Link>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}
