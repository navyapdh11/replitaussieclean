import { useState, useRef, useEffect, useCallback, type KeyboardEvent } from "react";
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

const ADMIN_LINKS = [
  { href: "/admin",        label: "Admin Dashboard", icon: ShieldCheck },
  { href: "/saas-admin",   label: "SaaS Admin",      icon: Building2   },
  { href: "/admin#system", label: "Admin Only Tab",  icon: ShieldCheck },
];

/* ─── Hook: click-outside + Escape ──────────────────────────────────────── */

function useDropdown(triggerId: string, panelId: string) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const triggerRef   = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const onMouse = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    const onKey = (e: globalThis.KeyboardEvent) => {
      if (e.key === "Escape" && open) {
        setOpen(false);
        triggerRef.current?.focus();
      }
    };
    document.addEventListener("mousedown", onMouse);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onMouse);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return { open, setOpen, containerRef, triggerRef, triggerId, panelId };
}

/* ─── Keyboard navigation inside a dropdown list ────────────────────────── */

function useMenuKeyboard(open: boolean, panelId: string) {
  const handleKeyDown = useCallback(
    (e: KeyboardEvent<HTMLElement>) => {
      if (!open) return;
      const panel = document.getElementById(panelId);
      if (!panel) return;

      const items = Array.from(
        panel.querySelectorAll<HTMLElement>('[role="menuitem"]'),
      );
      if (items.length === 0) return;

      const current = document.activeElement as HTMLElement;
      const idx = items.indexOf(current);

      if (e.key === "ArrowDown") {
        e.preventDefault();
        items[(idx + 1) % items.length]?.focus();
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        items[(idx - 1 + items.length) % items.length]?.focus();
      } else if (e.key === "Home") {
        e.preventDefault();
        items[0]?.focus();
      } else if (e.key === "End") {
        e.preventDefault();
        items[items.length - 1]?.focus();
      }
    },
    [open, panelId],
  );

  return handleKeyDown;
}

/* ─── Navbar ─────────────────────────────────────────────────────────────── */

export function Navbar() {
  const [location] = useLocation();
  const services   = useDropdown("services-trigger", "services-menu");
  const admin      = useDropdown("admin-trigger",    "admin-menu");
  const [mobileOpen, setMobileOpen] = useState(false);

  const svcKey  = useMenuKeyboard(services.open, "services-menu");
  const admKey  = useMenuKeyboard(admin.open,    "admin-menu");

  const closeAll = () => {
    services.setOpen(false);
    admin.setOpen(false);
    setMobileOpen(false);
  };

  const toggleServices = () => {
    services.setOpen((o) => !o);
    admin.setOpen(false);
  };

  const toggleAdmin = () => {
    admin.setOpen((o) => !o);
    services.setOpen(false);
  };

  return (
    <nav
      role="navigation"
      aria-label="Main navigation"
      className="fixed top-0 left-0 right-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-xl"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">

          {/* Logo */}
          <Link href="/" onClick={closeAll} aria-label="AussieClean — go to home page" className="flex items-center gap-2 group shrink-0">
            <div
              aria-hidden="true"
              className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-blue-600 flex items-center justify-center shadow-lg shadow-primary/20 group-hover:shadow-primary/40 transition-all duration-300"
            >
              <Sparkles className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="font-display font-bold text-xl tracking-wide text-foreground">
              Aussie<span className="text-primary">Clean</span>
            </span>
          </Link>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-1" role="menubar" aria-label="Desktop navigation">

            {/* ── Services dropdown ──────────────────────────────── */}
            <div ref={services.containerRef} className="relative">
              <button
                id={services.triggerId}
                ref={services.triggerRef}
                onClick={toggleServices}
                onKeyDown={(e) => {
                  if (e.key === "ArrowDown" && !services.open) {
                    services.setOpen(true);
                    // Focus first item after render
                    setTimeout(() => {
                      document.querySelector<HTMLElement>(`#${services.panelId} [role="menuitem"]`)?.focus();
                    }, 50);
                  }
                  svcKey(e);
                }}
                aria-haspopup="menu"
                aria-expanded={services.open}
                aria-controls={services.panelId}
                className={cn(
                  "flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary",
                  services.open ? "text-primary bg-primary/10" : "text-muted-foreground hover:text-foreground hover:bg-muted/50",
                )}
              >
                <Brush className="w-4 h-4" aria-hidden="true" />
                Services
                <ChevronDown className={cn("w-3.5 h-3.5 transition-transform", services.open && "rotate-180")} aria-hidden="true" />
              </button>

              {services.open && (
                <div
                  id={services.panelId}
                  role="menu"
                  aria-labelledby={services.triggerId}
                  onKeyDown={svcKey}
                  className="absolute top-full left-0 mt-2 w-72 rounded-2xl border border-border bg-card shadow-2xl shadow-black/30 overflow-hidden"
                >
                  <div className="p-2 space-y-0.5">
                    {SERVICES.map(({ label, value, icon: Icon, desc }) => (
                      <Link
                        key={value}
                        href={`/booking?service=${value}`}
                        role="menuitem"
                        onClick={closeAll}
                        className="flex items-start gap-3 px-3 py-2.5 rounded-xl hover:bg-muted/60 focus-visible:bg-muted/60 focus-visible:outline-none transition-colors group"
                      >
                        <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 group-hover:bg-primary/20 transition-colors" aria-hidden="true">
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
                      role="menuitem"
                      onClick={closeAll}
                      className="flex items-center justify-center gap-2 w-full px-4 py-2 rounded-xl bg-primary/10 text-primary text-sm font-semibold hover:bg-primary/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary transition-colors"
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
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary transition-colors"
            >
              <Phone className="w-4 h-4" aria-hidden="true" />
              Contact
            </Link>

            {/* My Bookings */}
            <Link
              href="/dashboard"
              onClick={closeAll}
              aria-current={location === "/dashboard" ? "page" : undefined}
              className={cn(
                "flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary",
                location === "/dashboard" ? "text-primary bg-primary/10" : "text-muted-foreground hover:text-foreground hover:bg-muted/50",
              )}
            >
              <ClipboardList className="w-4 h-4" aria-hidden="true" />
              My Bookings
            </Link>

            {/* ── Admin Only dropdown ────────────────────────────── */}
            <div ref={admin.containerRef} className="relative">
              <button
                id={admin.triggerId}
                ref={admin.triggerRef}
                onClick={toggleAdmin}
                onKeyDown={(e) => {
                  if (e.key === "ArrowDown" && !admin.open) {
                    admin.setOpen(true);
                    setTimeout(() => {
                      document.querySelector<HTMLElement>(`#${admin.panelId} [role="menuitem"]`)?.focus();
                    }, 50);
                  }
                  admKey(e);
                }}
                aria-haspopup="menu"
                aria-expanded={admin.open}
                aria-controls={admin.panelId}
                className={cn(
                  "flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-400",
                  admin.open ? "text-purple-400 bg-purple-500/10" : "text-muted-foreground hover:text-foreground hover:bg-muted/50",
                )}
              >
                <ShieldCheck className="w-4 h-4" aria-hidden="true" />
                Admin Only
                <ChevronDown className={cn("w-3.5 h-3.5 transition-transform", admin.open && "rotate-180")} aria-hidden="true" />
              </button>

              {admin.open && (
                <div
                  id={admin.panelId}
                  role="menu"
                  aria-labelledby={admin.triggerId}
                  onKeyDown={admKey}
                  className="absolute top-full right-0 mt-2 w-56 rounded-2xl border border-purple-500/30 bg-card shadow-2xl shadow-black/30 overflow-hidden"
                >
                  <div className="p-1.5 space-y-0.5">
                    {ADMIN_LINKS.map(({ href, label, icon: Icon }) => (
                      <Link
                        key={href}
                        href={href}
                        role="menuitem"
                        onClick={closeAll}
                        aria-current={location === href ? "page" : undefined}
                        className={cn(
                          "flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-400",
                          location === href
                            ? "bg-purple-500/15 text-purple-400"
                            : "text-muted-foreground hover:bg-muted/60 hover:text-foreground",
                        )}
                      >
                        <Icon className="w-4 h-4 text-purple-400 shrink-0" aria-hidden="true" />
                        {label}
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Book Now CTA */}
            <Link
              href="/booking"
              onClick={closeAll}
              className="ml-2 px-5 py-2.5 rounded-full font-semibold bg-primary/10 text-primary border border-primary/20 hover:bg-primary hover:text-primary-foreground hover:shadow-lg hover:shadow-primary/20 hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary transition-all duration-300 text-sm"
            >
              Book Now
            </Link>
          </div>

          {/* Mobile hamburger */}
          <button
            className="md:hidden p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary transition-colors"
            onClick={() => setMobileOpen((o) => !o)}
            aria-label={mobileOpen ? "Close navigation menu" : "Open navigation menu"}
            aria-expanded={mobileOpen}
            aria-controls="mobile-menu"
          >
            {mobileOpen ? <X className="w-5 h-5" aria-hidden="true" /> : <Menu className="w-5 h-5" aria-hidden="true" />}
          </button>
        </div>
      </div>

      {/* ── Mobile menu ────────────────────────────────────────────────── */}
      <div
        id="mobile-menu"
        hidden={!mobileOpen}
        role="region"
        aria-label="Mobile navigation"
        className={cn(
          "md:hidden border-t border-border/50 bg-background/95 backdrop-blur-xl",
          !mobileOpen && "hidden",
        )}
      >
        <div className="max-w-7xl mx-auto px-4 py-4 space-y-1">

          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground px-3 py-2" aria-hidden="true">Services</p>
          {SERVICES.map(({ label, value, icon: Icon }) => (
            <Link
              key={value}
              href={`/booking?service=${value}`}
              onClick={closeAll}
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-muted-foreground hover:text-foreground hover:bg-muted/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary transition-colors"
            >
              <Icon className="w-4 h-4 text-primary shrink-0" aria-hidden="true" />
              {label}
            </Link>
          ))}

          <div className="border-t border-border/50 pt-2 mt-2" role="separator" />
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground px-3 py-2" aria-hidden="true">Navigation</p>
          <Link href="/#contact" onClick={closeAll} className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-muted-foreground hover:text-foreground hover:bg-muted/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary transition-colors">
            <Phone className="w-4 h-4 shrink-0" aria-hidden="true" /> Contact
          </Link>
          <Link href="/dashboard" onClick={closeAll} aria-current={location === "/dashboard" ? "page" : undefined} className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-muted-foreground hover:text-foreground hover:bg-muted/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary transition-colors">
            <ClipboardList className="w-4 h-4 shrink-0" aria-hidden="true" /> My Bookings
          </Link>
          <Link href="/booking" onClick={closeAll} className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-muted-foreground hover:text-foreground hover:bg-muted/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary transition-colors">
            <Star className="w-4 h-4 shrink-0" aria-hidden="true" /> Get a Quote
          </Link>

          <div className="border-t border-border/50 pt-2 mt-2" role="separator" />
          <p className="text-xs font-semibold uppercase tracking-wider text-purple-400/70 px-3 py-2" aria-hidden="true">Admin Only</p>
          {ADMIN_LINKS.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              onClick={closeAll}
              aria-current={location === href ? "page" : undefined}
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-muted-foreground hover:text-foreground hover:bg-muted/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-400 transition-colors"
            >
              <Icon className="w-4 h-4 text-purple-400 shrink-0" aria-hidden="true" /> {label}
            </Link>
          ))}

          <div className="pt-3">
            <Link
              href="/booking"
              onClick={closeAll}
              className="block w-full text-center px-5 py-3 rounded-xl font-semibold bg-gradient-to-r from-primary to-blue-500 text-primary-foreground shadow-lg hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary transition-opacity"
            >
              Book Now
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
}
