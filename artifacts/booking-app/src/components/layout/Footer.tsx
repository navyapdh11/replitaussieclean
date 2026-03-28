import { Sparkles, Phone, Mail, MapPin } from "lucide-react";
import { Link } from "wouter";

const CURRENT_YEAR = new Date().getFullYear();

const SERVICES = [
  { label: "Standard House Clean", href: "/booking" },
  { label: "End of Lease Clean", href: "/booking" },
  { label: "Deep Cleaning", href: "/booking" },
  { label: "Office Cleaning", href: "/booking" },
  { label: "Carpet Steam Clean", href: "/booking" },
  { label: "Window Cleaning", href: "/booking" },
];

const COMPANY = [
  { label: "Book Online", href: "/booking" },
  { label: "Service Areas", href: "/sitemap" },
  { label: "Dashboard", href: "/dashboard" },
];

const LEGAL = [
  { label: "Privacy Policy", href: "/privacy" },
  { label: "Terms & Conditions", href: "/terms" },
  { label: "Refund & Cancellation", href: "/refund-policy" },
  { label: "Accessibility Statement", href: "/accessibility" },
];

export function Footer() {
  return (
    <footer className="border-t border-border bg-card mt-auto" aria-label="Site footer">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">

        {/* ── Top grid ───────────────────────────────────────────────────── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10 mb-12">

          {/* Brand column */}
          <div className="space-y-4">
            <div className="flex items-center gap-2" aria-label="AussieClean home">
              <Sparkles className="w-5 h-5 text-primary" aria-hidden="true" />
              <span className="font-display font-bold text-lg text-foreground">AussieClean</span>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Australia's trusted enterprise cleaning platform. Residential, commercial,
              and specialised cleaning services nationwide.
            </p>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-primary flex-shrink-0" aria-hidden="true" />
                <a href="tel:1300287743" className="hover:text-foreground transition-colors">
                  1300 287 743
                </a>
              </li>
              <li className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-primary flex-shrink-0" aria-hidden="true" />
                <a href="mailto:hello@aussieclean.com.au" className="hover:text-foreground transition-colors">
                  hello@aussieclean.com.au
                </a>
              </li>
              <li className="flex items-start gap-2">
                <MapPin className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" aria-hidden="true" />
                <span>Serving NSW · VIC · QLD · WA · SA · ACT · TAS · NT</span>
              </li>
            </ul>
          </div>

          {/* Services */}
          <nav aria-label="Our services">
            <h3 className="text-sm font-semibold text-foreground uppercase tracking-wider mb-4">Services</h3>
            <ul className="space-y-2">
              {SERVICES.map(({ label, href }) => (
                <li key={label}>
                  <Link
                    href={href}
                    className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          {/* Company */}
          <nav aria-label="Company">
            <h3 className="text-sm font-semibold text-foreground uppercase tracking-wider mb-4">Company</h3>
            <ul className="space-y-2">
              {COMPANY.map(({ label, href }) => (
                <li key={label}>
                  <Link
                    href={href}
                    className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          {/* Legal */}
          <nav aria-label="Legal and compliance">
            <h3 className="text-sm font-semibold text-foreground uppercase tracking-wider mb-4">Legal</h3>
            <ul className="space-y-2">
              {LEGAL.map(({ label, href }) => (
                <li key={label}>
                  <Link
                    href={href}
                    className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </div>

        {/* ── Bottom bar ─────────────────────────────────────────────────── */}
        <div className="border-t border-border/50 pt-8 flex flex-col sm:flex-row justify-between items-center gap-4">
          <p className="text-xs text-muted-foreground">
            © {CURRENT_YEAR} AussieClean Enterprise Services Pty Ltd. All rights reserved.
            ABN: [XX XXX XXX XXX]
          </p>
          <p className="text-xs text-muted-foreground">
            Fully insured · Police-checked staff · NDIS registered
          </p>
        </div>

      </div>
    </footer>
  );
}
