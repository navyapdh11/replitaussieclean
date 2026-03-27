import { useState, useEffect } from "react";
import { Link } from "wouter";
import { motion } from "framer-motion";
import {
  CheckCircle, Star, Shield, Clock, ChevronRight,
  Home as HomeIcon, Wind, Key, Building2, Layers, Phone, Mail,
  MapPin, Clock3, ArrowRight,
} from "lucide-react";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { analytics } from "@/lib/analytics";
import { cn } from "@/lib/utils";

const JSON_LD = JSON.stringify({
  "@context": "https://schema.org",
  "@type": "LocalBusiness",
  "@id": "https://aussieclean.com.au",
  name: "AussieClean",
  description:
    "Australia's premium professional cleaning service. Book vetted, insured cleaners online in 60 seconds with instant transparent quoting.",
  url: "https://aussieclean.com.au",
  telephone: "+611300253262",
  priceRange: "$$",
  image: "https://aussieclean.com.au/images/hero-bg.png",
  address: { "@type": "PostalAddress", addressCountry: "AU" },
  areaServed: [
    { "@type": "State", name: "New South Wales" },
    { "@type": "State", name: "Victoria" },
    { "@type": "State", name: "Queensland" },
    { "@type": "State", name: "Western Australia" },
    { "@type": "State", name: "South Australia" },
  ],
  hasOfferCatalog: {
    "@type": "OfferCatalog",
    name: "Cleaning Services",
    itemListElement: [
      { "@type": "Offer", itemOffered: { "@type": "Service", name: "Standard Home Clean" } },
      { "@type": "Offer", itemOffered: { "@type": "Service", name: "Deep Spring Clean" } },
      { "@type": "Offer", itemOffered: { "@type": "Service", name: "End-of-Lease Bond Clean" } },
      { "@type": "Offer", itemOffered: { "@type": "Service", name: "Office Clean" } },
      { "@type": "Offer", itemOffered: { "@type": "Service", name: "NDIS Support Cleaning" } },
    ],
  },
  aggregateRating: {
    "@type": "AggregateRating",
    ratingValue: "4.9",
    ratingCount: "2847",
    bestRating: "5",
  },
});

const SERVICES = [
  {
    id: "standard_clean",
    label: "Standard Clean",
    icon: HomeIcon,
    price: "From $129",
    desc: "Regular maintenance clean for a fresh, tidy home. Includes all rooms, surfaces, and floors.",
    features: ["All rooms", "Kitchen & bathrooms", "Vacuuming & mopping"],
    popular: false,
  },
  {
    id: "deep_clean",
    label: "Deep Clean",
    icon: Wind,
    price: "From $249",
    desc: "A thorough top-to-bottom clean tackling accumulated grime, skirting boards, and hard-to-reach areas.",
    features: ["Everything in Standard", "Inside oven & fridge", "Skirting & cornices"],
    popular: true,
  },
  {
    id: "end_of_lease",
    label: "End of Lease",
    icon: Key,
    price: "From $349",
    desc: "Bond-back guaranteed. We meet your property manager's checklist so you get every dollar back.",
    features: ["Bond-back guarantee", "Walls & blinds", "Full property report"],
    popular: false,
  },
  {
    id: "office_clean",
    label: "Office Clean",
    icon: Building2,
    price: "From $199",
    desc: "Professional workspace hygiene for offices, co-working spaces, and commercial premises.",
    features: ["Desks & common areas", "Kitchens & bathrooms", "Flexible scheduling"],
    popular: false,
  },
  {
    id: "carpet_clean",
    label: "Carpet Clean",
    icon: Layers,
    price: "From $179",
    desc: "Hot-water extraction steam cleaning that removes deep stains, allergens, and odours.",
    features: ["Steam extraction", "Stain treatment", "Deodorising"],
    popular: false,
  },
] as const;

type ServiceId = typeof SERVICES[number]["id"];

const CONTACT_INFO = [
  { icon: Phone,   label: "Phone",   value: "1300 253 262",             href: "tel:1300253262" },
  { icon: Mail,    label: "Email",   value: "hello@aussieclean.com.au", href: "mailto:hello@aussieclean.com.au" },
  { icon: MapPin,  label: "Service Area", value: "NSW · VIC · QLD · WA · SA", href: undefined },
  { icon: Clock3,  label: "Hours",   value: "Mon–Sat 7 am – 7 pm AEST", href: undefined },
];

const STATES = ["All Areas", "NSW", "VIC", "QLD", "WA", "SA"];

export default function Home() {
  const [activeFilter, setActiveFilter] = useState<ServiceId | "all">("all");
  const [locationFilter, setLocationFilter] = useState("All Areas");

  useEffect(() => {
    analytics.capture("page_view", { page: "home" });
  }, []);

  const visibleServices = activeFilter === "all"
    ? SERVICES
    : SERVICES.filter((s) => s.id === activeFilter);

  return (
    <div className="min-h-screen flex flex-col pt-20">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON_LD }}
      />
      <Navbar />

      <main className="flex-1">

        {/* ── Hero Section ─────────────────────────────── */}
        <section className="relative overflow-hidden">
          <div className="absolute inset-0 bg-background">
            <img
              src={`${import.meta.env.BASE_URL}images/hero-bg.png`}
              alt="Premium abstract background"
              className="w-full h-full object-cover opacity-50"
            />
            <div className="absolute inset-0 bg-gradient-to-b from-background/80 via-background/40 to-background" />
          </div>

          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-32 pb-24 md:pt-48 md:pb-32 flex flex-col items-center text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 text-primary text-sm font-semibold mb-8"
            >
              <Star className="w-4 h-4 fill-primary" />
              <span>Australia's #1 Premium Cleaning Service</span>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="text-5xl md:text-7xl font-extrabold text-foreground max-w-4xl leading-tight mb-8"
            >
              Immaculate spaces, <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-blue-400">
                zero effort.
              </span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="text-lg md:text-xl text-muted-foreground max-w-2xl mb-12"
            >
              Book professional, vetted cleaners in under 60 seconds. Experience
              the standard of clean you deserve with instant transparent quoting.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto"
            >
              <Link
                href="/booking"
                className="px-8 py-4 rounded-xl font-bold text-lg bg-gradient-to-r from-primary to-blue-500 text-primary-foreground shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/40 hover:-translate-y-1 transition-all duration-300 w-full sm:w-auto"
                onClick={() => analytics.capture("cta_clicked", { location: "hero" })}
              >
                Get an Instant Quote
              </Link>
              <a
                href="#services"
                className="px-8 py-4 rounded-xl font-bold text-lg border border-border text-foreground hover:border-primary/50 hover:bg-primary/5 transition-all duration-300 w-full sm:w-auto"
              >
                Browse Services
              </a>
            </motion.div>
          </div>
        </section>

        {/* ── Trust Strip ──────────────────────────────── */}
        <section className="py-8 bg-card border-y border-border/50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
              {[
                { stat: "4.9★",   label: "Average Rating", sub: "from 2,847 reviews"       },
                { stat: "50k+",   label: "Cleans Completed", sub: "across Australia"        },
                { stat: "100%",   label: "Satisfaction Guarantee", sub: "or we re-clean free" },
                { stat: "60 sec", label: "Average Booking Time", sub: "instant online quote"  },
              ].map(({ stat, label, sub }) => (
                <div key={label} className="flex flex-col items-center text-center">
                  <p className="text-2xl md:text-3xl font-extrabold text-primary">{stat}</p>
                  <p className="text-sm font-semibold text-foreground mt-0.5">{label}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Services Section ─────────────────────────── */}
        <section id="services" className="py-20 bg-background scroll-mt-24">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">

            <div className="flex flex-col items-center text-center gap-4">
              <h2 className="text-3xl md:text-5xl font-extrabold">Our Services</h2>
              <p className="text-muted-foreground max-w-xl">
                Choose the cleaning service that suits your space and schedule. All
                services include fully insured, vetted professionals.
              </p>
            </div>

            {/* Filter bar */}
            <div className="flex flex-wrap items-center gap-3 justify-center">
              {/* Service type filters */}
              <div className="flex flex-wrap gap-2 items-center justify-center">
                <button
                  onClick={() => setActiveFilter("all")}
                  className={cn(
                    "px-4 py-2 rounded-full text-sm font-semibold border transition-all",
                    activeFilter === "all"
                      ? "bg-primary text-primary-foreground border-primary shadow-md shadow-primary/20"
                      : "border-border text-muted-foreground hover:border-primary/50 hover:text-foreground",
                  )}
                >
                  All Services
                </button>
                {SERVICES.map((s) => {
                  const Icon = s.icon;
                  return (
                    <button
                      key={s.id}
                      onClick={() => setActiveFilter(s.id)}
                      className={cn(
                        "flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-semibold border transition-all",
                        activeFilter === s.id
                          ? "bg-primary text-primary-foreground border-primary shadow-md shadow-primary/20"
                          : "border-border text-muted-foreground hover:border-primary/50 hover:text-foreground",
                      )}
                    >
                      <Icon className="w-3.5 h-3.5" />
                      {s.label}
                    </button>
                  );
                })}
              </div>

              {/* Location filter */}
              <div className="flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                <select
                  value={locationFilter}
                  onChange={(e) => setLocationFilter(e.target.value)}
                  className="rounded-full border border-border bg-background px-3 py-2 text-sm font-semibold text-muted-foreground hover:border-primary/50 focus:outline-none focus:border-primary cursor-pointer"
                >
                  {STATES.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
            </div>

            {/* Service cards */}
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {visibleServices.map((service) => {
                const Icon = service.icon;
                return (
                  <motion.div
                    key={service.id}
                    layout
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.25 }}
                    className={cn(
                      "relative border rounded-2xl p-6 bg-card flex flex-col gap-4 hover:border-primary/50 hover:shadow-lg hover:shadow-primary/5 transition-all duration-300",
                      service.popular ? "border-primary/50 shadow-md shadow-primary/10" : "border-border",
                    )}
                  >
                    {service.popular && (
                      <div className="absolute -top-3 left-5">
                        <span className="px-3 py-1 rounded-full bg-gradient-to-r from-primary to-blue-500 text-primary-foreground text-xs font-bold shadow-md shadow-primary/20">
                          Most Popular
                        </span>
                      </div>
                    )}

                    <div className="flex items-start justify-between">
                      <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                        <Icon className="w-6 h-6 text-primary" />
                      </div>
                      <p className="text-sm font-bold text-primary">{service.price}</p>
                    </div>

                    <div>
                      <h3 className="text-lg font-bold mb-1">{service.label}</h3>
                      <p className="text-sm text-muted-foreground leading-relaxed">{service.desc}</p>
                    </div>

                    <ul className="space-y-1.5">
                      {service.features.map((f) => (
                        <li key={f} className="flex items-center gap-2 text-sm text-muted-foreground">
                          <CheckCircle className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                          {f}
                        </li>
                      ))}
                    </ul>

                    <Link
                      href={`/booking?service=${service.id}`}
                      className={cn(
                        "mt-auto flex items-center justify-center gap-2 w-full py-3 rounded-xl text-sm font-semibold transition-all duration-300",
                        service.popular
                          ? "bg-gradient-to-r from-primary to-blue-500 text-primary-foreground hover:opacity-90 shadow-md shadow-primary/20"
                          : "border border-border text-foreground hover:border-primary/50 hover:bg-primary/5",
                      )}
                      onClick={() => analytics.capture("service_selected", { service: service.id })}
                    >
                      Book {service.label}
                      <ArrowRight className="w-4 h-4" />
                    </Link>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </section>

        {/* ── Why AussieClean ──────────────────────────── */}
        <section className="py-20 bg-card border-y border-border/50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-3xl md:text-4xl font-extrabold text-center mb-14">
              Why choose AussieClean?
            </h2>
            <div className="grid md:grid-cols-3 gap-12">
              <FeatureCard
                icon={<Shield className="w-8 h-8 text-primary" />}
                title="Fully Vetted & Insured"
                description="Every cleaner passes rigorous background checks and carries full liability insurance. Your home, protected."
              />
              <FeatureCard
                icon={<CheckCircle className="w-8 h-8 text-primary" />}
                title="100% Satisfaction"
                description="Not happy? We'll re-clean for free. Your satisfaction is our highest priority — no questions asked."
              />
              <FeatureCard
                icon={<Clock className="w-8 h-8 text-primary" />}
                title="Instant Booking"
                description="No lengthy quotes. Configure your clean, see your price, and book securely in 60 seconds flat."
              />
            </div>
          </div>
        </section>

        {/* ── Lifestyle Showcase ───────────────────────── */}
        <section className="py-20 bg-background">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="rounded-3xl overflow-hidden relative min-h-[500px] flex items-center shadow-2xl shadow-black/50 border border-border/50">
              <img
                src={`${import.meta.env.BASE_URL}images/clean-home.png`}
                alt="Pristine living room"
                className="absolute inset-0 w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-r from-background via-background/80 to-transparent" />
              <div className="relative z-10 p-8 md:p-16 max-w-2xl">
                <h2 className="text-3xl md:text-5xl font-bold mb-6">
                  Experience the difference.
                </h2>
                <p className="text-lg text-muted-foreground mb-8">
                  Whether it's your home, office, or an end-of-lease bond clean,
                  our teams deliver an uncompromising standard of hygiene and
                  organisation.
                </p>
                <Link
                  href="/booking"
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-lg font-semibold bg-background/50 backdrop-blur border border-border hover:bg-white/10 hover:border-primary transition-all duration-300 text-foreground"
                  onClick={() => analytics.capture("cta_clicked", { location: "lifestyle" })}
                >
                  Start your booking <ChevronRight className="w-4 h-4 text-primary" />
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* ── Contact Section ──────────────────────────── */}
        <section id="contact" className="py-20 bg-card border-t border-border/50 scroll-mt-24">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid md:grid-cols-2 gap-16 items-start">

              {/* Left: Contact info */}
              <div className="space-y-8">
                <div>
                  <h2 className="text-3xl md:text-4xl font-extrabold mb-3">Get in Touch</h2>
                  <p className="text-muted-foreground text-lg">
                    Questions about a booking, service, or partnership? Our team
                    is here Mon–Sat, 7 am to 7 pm AEST.
                  </p>
                </div>

                <div className="space-y-4">
                  {CONTACT_INFO.map(({ icon: Icon, label, value, href }) => (
                    <div key={label} className="flex items-center gap-4">
                      <div className="w-11 h-11 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
                        <Icon className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{label}</p>
                        {href ? (
                          <a href={href} className="text-foreground font-semibold hover:text-primary transition-colors">
                            {value}
                          </a>
                        ) : (
                          <p className="text-foreground font-semibold">{value}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="pt-4">
                  <Link
                    href="/booking"
                    className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-semibold bg-gradient-to-r from-primary to-blue-500 text-primary-foreground hover:opacity-90 transition-opacity shadow-lg shadow-primary/20"
                  >
                    Book Online Now <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              </div>

              {/* Right: Quick contact form */}
              <ContactForm />
            </div>
          </div>
        </section>

      </main>

      <Footer />
    </div>
  );
}

function FeatureCard({
  icon, title, description,
}: {
  icon: React.ReactNode; title: string; description: string;
}) {
  return (
    <div className="flex flex-col items-center text-center p-6">
      <div className="w-16 h-16 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center mb-6">
        {icon}
      </div>
      <h3 className="text-xl font-bold mb-3">{title}</h3>
      <p className="text-muted-foreground leading-relaxed">{description}</p>
    </div>
  );
}

function ContactForm() {
  const [form, setForm] = useState({ name: "", email: "", phone: "", message: "" });
  const [sent, setSent]   = useState(false);
  const [sending, setSending] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSending(true);
    // Simulate a short delay — in production this would POST to a contact endpoint
    await new Promise((r) => setTimeout(r, 800));
    analytics.capture("contact_form_submitted", { email: form.email });
    setSent(true);
    setSending(false);
  };

  if (sent) {
    return (
      <div className="flex flex-col items-center justify-center text-center py-16 px-8 border border-emerald-500/30 bg-emerald-500/5 rounded-2xl">
        <CheckCircle className="w-14 h-14 text-emerald-400 mb-4" />
        <h3 className="text-xl font-bold mb-2">Message received!</h3>
        <p className="text-muted-foreground">We'll get back to you within one business day.</p>
        <button
          onClick={() => { setSent(false); setForm({ name: "", email: "", phone: "", message: "" }); }}
          className="mt-6 text-sm text-muted-foreground hover:text-foreground underline underline-offset-4"
        >
          Send another message
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 border border-border bg-background rounded-2xl p-6">
      <h3 className="font-bold text-lg">Send us a message</h3>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-semibold mb-1 text-muted-foreground">Your Name *</label>
          <input
            required
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            className="w-full rounded-lg border border-border bg-card px-3 py-2 text-sm focus:outline-none focus:border-primary transition-colors"
            placeholder="Jane Smith"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold mb-1 text-muted-foreground">Phone</label>
          <input
            value={form.phone}
            onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
            className="w-full rounded-lg border border-border bg-card px-3 py-2 text-sm focus:outline-none focus:border-primary transition-colors"
            placeholder="04XX XXX XXX"
          />
        </div>
      </div>
      <div>
        <label className="block text-xs font-semibold mb-1 text-muted-foreground">Email *</label>
        <input
          required
          type="email"
          value={form.email}
          onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
          className="w-full rounded-lg border border-border bg-card px-3 py-2 text-sm focus:outline-none focus:border-primary transition-colors"
          placeholder="jane@example.com"
        />
      </div>
      <div>
        <label className="block text-xs font-semibold mb-1 text-muted-foreground">Message *</label>
        <textarea
          required
          value={form.message}
          onChange={(e) => setForm((f) => ({ ...f, message: e.target.value }))}
          rows={4}
          className="w-full rounded-lg border border-border bg-card px-3 py-2 text-sm focus:outline-none focus:border-primary transition-colors resize-none"
          placeholder="How can we help you?"
        />
      </div>
      <button
        type="submit"
        disabled={sending}
        className="w-full py-3 rounded-xl font-semibold bg-gradient-to-r from-primary to-blue-500 text-primary-foreground hover:opacity-90 disabled:opacity-60 transition-opacity shadow-md shadow-primary/20"
      >
        {sending ? "Sending…" : "Send Message"}
      </button>
      <p className="text-xs text-muted-foreground text-center">
        We respect your privacy. No spam, ever.
      </p>
    </form>
  );
}
