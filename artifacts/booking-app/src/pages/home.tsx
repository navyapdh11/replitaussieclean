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
import { SkipToContent } from "@/components/layout/SkipToContent";
import { FaqSection, FAQ_ITEMS } from "@/components/home/FaqSection";
import { ReviewsSection } from "@/components/home/ReviewsSection";
import { SeasonalSection } from "@/components/home/SeasonalSection";
import { HowToSection, HOWTO_STEPS, HOWTO_SUPPLIES, HOWTO_TOOLS } from "@/components/home/HowToSection";
import { analytics } from "@/lib/analytics";
import { cn } from "@/lib/utils";

/* ─── Full @graph JSON-LD ──────────────────────────────────────────────────
 * Combines: LocalBusiness + Service (×5) + FAQPage + SpeakableSpecification
 * Optimised for AEO (AI Overview citations), voice search, and local SEO.
 * ────────────────────────────────────────────────────────────────────────── */
const JSON_LD = JSON.stringify({
  "@context": "https://schema.org",
  "@graph": [
    /* ── WebPage (speakable sections) ──────────────────────── */
    {
      "@type": "WebPage",
      "@id": "https://aussieclean.com.au/#webpage",
      "name": "AussieClean — Professional Cleaning Services Across Australia",
      "description": "Book professional, police-checked, insured cleaners online in 60 seconds. Standard, deep, end-of-lease, office, and carpet cleaning across NSW, VIC, QLD, WA, and SA. From $129.",
      "url": "https://aussieclean.com.au",
      "inLanguage": "en-AU",
      "speakable": {
        "@type": "SpeakableSpecification",
        "cssSelector": [".hero-text", ".faq-answer", ".atomic-answer"],
      },
      "isPartOf": { "@id": "https://aussieclean.com.au/#business" },
    },

    /* ── LocalBusiness ─────────────────────────────────────── */
    {
      "@type": ["LocalBusiness", "CleaningService"],
      "@id": "https://aussieclean.com.au/#business",
      "name": "AussieClean",
      "description": "Australia's premium professional cleaning service. Book vetted, insured cleaners online in 60 seconds with instant transparent quoting.",
      "url": "https://aussieclean.com.au",
      "telephone": "+611300253262",
      "email": "hello@aussieclean.com.au",
      "priceRange": "$$",
      "image": "https://aussieclean.com.au/images/hero-bg.png",
      "address": { "@type": "PostalAddress", "addressCountry": "AU" },
      "areaServed": [
        { "@type": "State", "name": "New South Wales"    },
        { "@type": "State", "name": "Victoria"           },
        { "@type": "State", "name": "Queensland"         },
        { "@type": "State", "name": "Western Australia"  },
        { "@type": "State", "name": "South Australia"    },
      ],
      "openingHoursSpecification": [
        {
          "@type": "OpeningHoursSpecification",
          "dayOfWeek": ["Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"],
          "opens": "07:00", "closes": "19:00",
        },
      ],
      "aggregateRating": {
        "@type": "AggregateRating",
        "ratingValue": 4.9,
        "reviewCount": 2847,
        "bestRating": 5,
        "worstRating": 1,
      },
      "hasOfferCatalog": {
        "@type": "OfferCatalog",
        "name": "Cleaning Services",
        "itemListElement": [
          { "@type": "Offer", "itemOffered": { "@id": "https://aussieclean.com.au/#service-standard" } },
          { "@type": "Offer", "itemOffered": { "@id": "https://aussieclean.com.au/#service-deep"     } },
          { "@type": "Offer", "itemOffered": { "@id": "https://aussieclean.com.au/#service-lease"    } },
          { "@type": "Offer", "itemOffered": { "@id": "https://aussieclean.com.au/#service-office"   } },
          { "@type": "Offer", "itemOffered": { "@id": "https://aussieclean.com.au/#service-carpet"   } },
        ],
      },
    },

    /* ── Service nodes ─────────────────────────────────────── */
    {
      "@type": "Service",
      "@id": "https://aussieclean.com.au/#service-standard",
      "name": "Standard Home Clean",
      "description": "Regular maintenance clean for a fresh, tidy home. All rooms, surfaces, kitchen, bathrooms, vacuuming and mopping. From $129.",
      "provider": { "@id": "https://aussieclean.com.au/#business" },
      "offers": { "@type": "Offer", "priceCurrency": "AUD", "priceRange": "$129–$299" },
    },
    {
      "@type": "Service",
      "@id": "https://aussieclean.com.au/#service-deep",
      "name": "Deep Spring Clean",
      "description": "Thorough top-to-bottom deep clean including oven, fridge, skirting boards, and cornices. Includes allergen treatment. From $249.",
      "provider": { "@id": "https://aussieclean.com.au/#business" },
      "offers": { "@type": "Offer", "priceCurrency": "AUD", "priceRange": "$249–$499" },
    },
    {
      "@type": "Service",
      "@id": "https://aussieclean.com.au/#service-lease",
      "name": "End-of-Lease Bond Clean",
      "description": "Bond-back guaranteed end-of-lease clean. Includes walls, blinds, carpets, and full property report. From $349.",
      "provider": { "@id": "https://aussieclean.com.au/#business" },
      "offers": { "@type": "Offer", "priceCurrency": "AUD", "priceRange": "$349–$699" },
    },
    {
      "@type": "Service",
      "@id": "https://aussieclean.com.au/#service-office",
      "name": "Office & Commercial Clean",
      "description": "Professional workspace hygiene for offices and commercial premises. Flexible scheduling, same cleaners each visit. From $199.",
      "provider": { "@id": "https://aussieclean.com.au/#business" },
      "offers": { "@type": "Offer", "priceCurrency": "AUD", "priceRange": "$199–$599" },
    },
    {
      "@type": "Service",
      "@id": "https://aussieclean.com.au/#service-carpet",
      "name": "Carpet Steam Clean",
      "description": "Hot-water extraction steam cleaning removing deep stains, allergens, and odours. Deodorising included. From $179.",
      "provider": { "@id": "https://aussieclean.com.au/#business" },
      "offers": { "@type": "Offer", "priceCurrency": "AUD", "priceRange": "$179–$399" },
    },

    /* ── FAQPage ────────────────────────────────────────────── */
    {
      "@type": "FAQPage",
      "@id": "https://aussieclean.com.au/#faq",
      "name": "Frequently Asked Questions — AussieClean Professional Cleaning Services",
      "description": "Answers to common questions about seasonal, deep, bond, and regular cleaning services across Australia.",
      "isPartOf": { "@id": "https://aussieclean.com.au/#webpage" },
      "speakable": {
        "@type": "SpeakableSpecification",
        "cssSelector": [".faq-question", ".faq-answer"],
      },
      "mainEntity": FAQ_ITEMS.map((item) => ({
        "@type": "Question",
        "name": item.q,
        "acceptedAnswer": { "@type": "Answer", "text": item.a },
      })),
    },

    /* ── HowTo: Winter Mould Prevention ─────────────────────── */
    {
      "@type": "HowTo",
      "@id": "https://aussieclean.com.au/#howto-mould",
      "name": "Winter Mould Prevention Checklist for Australian Homes",
      "description": "Step-by-step guide to prevent and remove mould in Australian homes during winter. Includes ventilation tips, deep cleaning, and 6-month anti-mould treatment.",
      "totalTime": "PT2H",
      "estimatedCost": { "@type": "MonetaryAmount", "currency": "AUD", "value": "0" },
      "supply": HOWTO_SUPPLIES,
      "tool": HOWTO_TOOLS,
      "isPartOf": { "@id": "https://aussieclean.com.au/#webpage" },
      "step": HOWTO_STEPS.map((s, i) => ({
        "@type": "HowToStep",
        "name": s.name,
        "text": s.text,
        "url": `https://aussieclean.com.au/#${s.id}`,
        "position": i + 1,
      })),
    },
  ],
});

/* ─── Services ─────────────────────────────────────────────────────────── */

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
  { icon: Phone,   label: "Phone",        value: "1300 253 262",             href: "tel:1300253262"                   },
  { icon: Mail,    label: "Email",        value: "hello@aussieclean.com.au", href: "mailto:hello@aussieclean.com.au" },
  { icon: MapPin,  label: "Service Area", value: "NSW · VIC · QLD · WA · SA", href: undefined                        },
  { icon: Clock3,  label: "Hours",        value: "Mon–Sat 7 am – 7 pm AEST", href: undefined                         },
];

const STATES = ["All Areas", "NSW", "VIC", "QLD", "WA", "SA"];

/* ─── Page component ────────────────────────────────────────────────────── */

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
      <SkipToContent />

      {/* Full @graph JSON-LD: LocalBusiness + Services + FAQPage + Speakable */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON_LD }}
      />

      <Navbar />

      <main id="main-content" className="flex-1" tabIndex={-1}>

        {/* ── Hero ─────────────────────────────────────────── */}
        <section aria-label="Hero" className="relative overflow-hidden">
          <div className="absolute inset-0 bg-background" aria-hidden="true">
            <img
              src={`${import.meta.env.BASE_URL}images/hero-bg.png`}
              alt=""
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
              <Star className="w-4 h-4 fill-primary" aria-hidden="true" />
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
              className="hero-text text-lg md:text-xl text-muted-foreground max-w-2xl mb-12"
            >
              Book professional, vetted cleaners in under 60 seconds. Experience
              the standard of clean you deserve with instant transparent quoting
              across NSW, VIC, QLD, WA, and SA.
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
                className="px-8 py-4 rounded-xl font-bold text-lg border border-border text-foreground hover:border-primary/50 hover:bg-primary/5 transition-all duration-300 w-full sm:w-auto text-center"
              >
                Browse Services
              </a>
            </motion.div>
          </div>
        </section>

        {/* ── Trust Strip ──────────────────────────────────── */}
        <section aria-label="Key statistics" className="py-8 bg-card border-y border-border/50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
              {[
                { stat: "4.9★",   label: "Average Rating",       sub: "from 2,847 reviews"        },
                { stat: "50k+",   label: "Cleans Completed",      sub: "across Australia"           },
                { stat: "100%",   label: "Satisfaction Guarantee", sub: "or we re-clean free"       },
                { stat: "60 sec", label: "Average Booking Time",  sub: "instant online quote"       },
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

        {/* ── Services Section ─────────────────────────────── */}
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
            <div
              role="group"
              aria-label="Filter services"
              className="flex flex-wrap items-center gap-3 justify-center"
            >
              <div role="group" aria-label="Filter by service type" className="flex flex-wrap gap-2 items-center justify-center">
                <button
                  onClick={() => setActiveFilter("all")}
                  aria-pressed={activeFilter === "all"}
                  className={cn(
                    "px-4 py-2 rounded-full text-sm font-semibold border transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary",
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
                      aria-pressed={activeFilter === s.id}
                      className={cn(
                        "flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-semibold border transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary",
                        activeFilter === s.id
                          ? "bg-primary text-primary-foreground border-primary shadow-md shadow-primary/20"
                          : "border-border text-muted-foreground hover:border-primary/50 hover:text-foreground",
                      )}
                    >
                      <Icon className="w-3.5 h-3.5" aria-hidden="true" />
                      {s.label}
                    </button>
                  );
                })}
              </div>

              <div className="flex items-center gap-1.5">
                <label htmlFor="location-filter" className="sr-only">Filter by state</label>
                <MapPin className="w-3.5 h-3.5 text-muted-foreground shrink-0" aria-hidden="true" />
                <select
                  id="location-filter"
                  value={locationFilter}
                  onChange={(e) => setLocationFilter(e.target.value)}
                  className="rounded-full border border-border bg-background px-3 py-2 text-sm font-semibold text-muted-foreground hover:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary cursor-pointer"
                >
                  {STATES.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>

              <div role="status" aria-live="polite" aria-atomic="true" className="sr-only">
                {activeFilter === "all"
                  ? `Showing all ${SERVICES.length} services`
                  : `Showing 1 service: ${SERVICES.find((s) => s.id === activeFilter)?.label}`}
                {/* locationFilter affects quote pricing only — not card visibility.
                    Omit it from this announcement to avoid misleading screen readers. */}
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
                      <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center" aria-hidden="true">
                        <Icon className="w-6 h-6 text-primary" />
                      </div>
                      <p className="text-sm font-bold text-primary">{service.price}</p>
                    </div>
                    <div>
                      <h3 className="text-lg font-bold mb-1">{service.label}</h3>
                      <p className="text-sm text-muted-foreground leading-relaxed">{service.desc}</p>
                    </div>
                    <ul className="space-y-1.5" role="list">
                      {service.features.map((f) => (
                        <li key={f} className="flex items-center gap-2 text-sm text-muted-foreground" role="listitem">
                          <CheckCircle className="w-3.5 h-3.5 text-emerald-400 shrink-0" aria-hidden="true" />
                          {f}
                        </li>
                      ))}
                    </ul>
                    <Link
                      href={`/booking?service=${service.id}`}
                      className={cn(
                        "mt-auto flex items-center justify-center gap-2 w-full py-3 rounded-xl text-sm font-semibold transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary",
                        service.popular
                          ? "bg-gradient-to-r from-primary to-blue-500 text-primary-foreground hover:opacity-90 shadow-md shadow-primary/20"
                          : "border border-border text-foreground hover:border-primary/50 hover:bg-primary/5",
                      )}
                      onClick={() => analytics.capture("service_selected", { service: service.id })}
                    >
                      Book {service.label}
                      <ArrowRight className="w-4 h-4" aria-hidden="true" />
                    </Link>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </section>

        {/* ── Seasonal Cleaning ─────────────────────────────── */}
        <SeasonalSection />

        {/* ── Why AussieClean ──────────────────────────────── */}
        <section aria-label="Why choose AussieClean" className="py-20 bg-card border-y border-border/50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-3xl md:text-4xl font-extrabold text-center mb-14">
              Why choose AussieClean?
            </h2>
            <div className="grid md:grid-cols-3 gap-12">
              <FeatureCard
                icon={<Shield className="w-8 h-8 text-primary" aria-hidden="true" />}
                title="Fully Vetted & Insured"
                description="Every cleaner passes rigorous police checks and carries full public liability insurance. Your home, always protected."
              />
              <FeatureCard
                icon={<CheckCircle className="w-8 h-8 text-primary" aria-hidden="true" />}
                title="100% Satisfaction"
                description="Not happy? We'll re-clean within 48 hours for free. Our re-clean rate is under 1% — because our standards are that high."
              />
              <FeatureCard
                icon={<Clock className="w-8 h-8 text-primary" aria-hidden="true" />}
                title="Instant Booking"
                description="No lengthy back-and-forth. Configure your clean, see your price, and book securely in 60 seconds flat, 24/7."
              />
            </div>
          </div>
        </section>

        {/* ── Lifestyle Showcase ───────────────────────────── */}
        <section aria-label="Our quality showcase" className="py-20 bg-background">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="rounded-3xl overflow-hidden relative min-h-[500px] flex items-center shadow-2xl shadow-black/50 border border-border/50">
              <img
                src={`${import.meta.env.BASE_URL}images/clean-home.png`}
                alt="Pristine, spotless living room after an AussieClean deep clean"
                className="absolute inset-0 w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-r from-background via-background/80 to-transparent" aria-hidden="true" />
              <div className="relative z-10 p-8 md:p-16 max-w-2xl">
                <h2 className="text-3xl md:text-5xl font-bold mb-6">
                  Experience the difference.
                </h2>
                <p className="text-lg text-muted-foreground mb-8 atomic-answer">
                  Whether it's your home, office, or an end-of-lease bond clean,
                  our teams deliver an uncompromising standard of hygiene and
                  organisation — backed by a 100% satisfaction guarantee.
                </p>
                <Link
                  href="/booking"
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-lg font-semibold bg-background/50 backdrop-blur border border-border hover:bg-white/10 hover:border-primary transition-all duration-300 text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                  onClick={() => analytics.capture("cta_clicked", { location: "lifestyle" })}
                >
                  Start your booking <ChevronRight className="w-4 h-4 text-primary" aria-hidden="true" />
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* ── Customer Reviews ─────────────────────────────── */}
        <ReviewsSection />

        {/* ── HowTo: Winter Mould Prevention ───────────────── */}
        <HowToSection />

        {/* ── FAQ Accordion ────────────────────────────────── */}
        <FaqSection />

        {/* ── Contact Section ──────────────────────────────── */}
        <section id="contact" className="py-20 bg-card border-t border-border/50 scroll-mt-24">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid md:grid-cols-2 gap-16 items-start">

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
                      <div className="w-11 h-11 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0" aria-hidden="true">
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
                    className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-semibold bg-gradient-to-r from-primary to-blue-500 text-primary-foreground hover:opacity-90 transition-opacity shadow-lg shadow-primary/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                  >
                    Book Online Now <ArrowRight className="w-4 h-4" aria-hidden="true" />
                  </Link>
                </div>
              </div>

              <ContactForm />
            </div>
          </div>
        </section>

      </main>

      <Footer />
    </div>
  );
}

/* ─── FeatureCard ─────────────────────────────────────────────────────── */

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

/* ─── ContactForm ─────────────────────────────────────────────────────── */

function ContactForm() {
  const [form, setForm] = useState({ name: "", email: "", phone: "", message: "" });
  const [sent, setSent]       = useState(false);
  const [sending, setSending] = useState(false);
  const [errors, setErrors]   = useState<Partial<typeof form>>({});

  const validate = () => {
    const e: Partial<typeof form> = {};
    if (!form.name.trim())              e.name    = "Name is required";
    if (!form.email.trim())             e.email   = "Email is required";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(form.email)) e.email = "Enter a valid email";
    if (!form.message.trim())           e.message = "Message is required";
    if (form.phone && !/^(\+?61|0)[2-9]\d{8}$/.test(form.phone.replace(/\s/g, "")))
      e.phone = "Enter a valid Australian phone number";
    return e;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }
    setErrors({});
    setSending(true);
    await new Promise((r) => setTimeout(r, 800));
    analytics.capture("contact_form_submitted", { email: form.email });
    setSent(true);
    setSending(false);
  };

  if (sent) {
    return (
      <div
        role="alert"
        className="flex flex-col items-center justify-center text-center py-16 px-8 border border-emerald-500/30 bg-emerald-500/5 rounded-2xl"
      >
        <CheckCircle className="w-14 h-14 text-emerald-400 mb-4" aria-hidden="true" />
        <h3 className="text-xl font-bold mb-2">Message received!</h3>
        <p className="text-muted-foreground">We'll get back to you within one business day.</p>
        <button
          onClick={() => { setSent(false); setForm({ name: "", email: "", phone: "", message: "" }); }}
          className="mt-6 text-sm text-muted-foreground hover:text-foreground underline underline-offset-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded"
        >
          Send another message
        </button>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      aria-label="Contact form"
      noValidate
      className="space-y-4 border border-border bg-background rounded-2xl p-6"
    >
      <h3 className="font-bold text-lg" id="contact-form-heading">Send us a message</h3>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="cf-name" className="block text-xs font-semibold mb-1 text-muted-foreground">
            Your Name <span aria-hidden="true">*</span>
            <span className="sr-only">(required)</span>
          </label>
          <input
            id="cf-name"
            required
            aria-required="true"
            aria-invalid={!!errors.name}
            aria-describedby={errors.name ? "cf-name-err" : undefined}
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            className={cn(
              "w-full rounded-lg border bg-card px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary transition-colors",
              errors.name ? "border-red-500" : "border-border",
            )}
            placeholder="Jane Smith"
          />
          {errors.name && <p id="cf-name-err" role="alert" className="text-xs text-red-500 mt-1">{errors.name}</p>}
        </div>
        <div>
          <label htmlFor="cf-phone" className="block text-xs font-semibold mb-1 text-muted-foreground">
            Phone
          </label>
          <input
            id="cf-phone"
            type="tel"
            aria-invalid={!!errors.phone}
            aria-describedby={errors.phone ? "cf-phone-err" : undefined}
            value={form.phone}
            onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
            className={cn(
              "w-full rounded-lg border bg-card px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary transition-colors",
              errors.phone ? "border-red-500" : "border-border",
            )}
            placeholder="04XX XXX XXX"
          />
          {errors.phone && <p id="cf-phone-err" role="alert" className="text-xs text-red-500 mt-1">{errors.phone}</p>}
        </div>
      </div>
      <div>
        <label htmlFor="cf-email" className="block text-xs font-semibold mb-1 text-muted-foreground">
          Email <span aria-hidden="true">*</span>
          <span className="sr-only">(required)</span>
        </label>
        <input
          id="cf-email"
          required
          type="email"
          aria-required="true"
          aria-invalid={!!errors.email}
          aria-describedby={errors.email ? "cf-email-err" : undefined}
          value={form.email}
          onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
          className={cn(
            "w-full rounded-lg border bg-card px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary transition-colors",
            errors.email ? "border-red-500" : "border-border",
          )}
          placeholder="jane@example.com"
        />
        {errors.email && <p id="cf-email-err" role="alert" className="text-xs text-red-500 mt-1">{errors.email}</p>}
      </div>
      <div>
        <label htmlFor="cf-message" className="block text-xs font-semibold mb-1 text-muted-foreground">
          Message <span aria-hidden="true">*</span>
          <span className="sr-only">(required)</span>
        </label>
        <textarea
          id="cf-message"
          required
          aria-required="true"
          aria-invalid={!!errors.message}
          aria-describedby={errors.message ? "cf-message-err" : undefined}
          value={form.message}
          onChange={(e) => setForm((f) => ({ ...f, message: e.target.value }))}
          rows={4}
          className={cn(
            "w-full rounded-lg border bg-card px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary transition-colors resize-none",
            errors.message ? "border-red-500" : "border-border",
          )}
          placeholder="How can we help you?"
        />
        {errors.message && <p id="cf-message-err" role="alert" className="text-xs text-red-500 mt-1">{errors.message}</p>}
      </div>
      <button
        type="submit"
        disabled={sending}
        aria-disabled={sending}
        className="w-full py-3 rounded-xl font-semibold bg-gradient-to-r from-primary to-blue-500 text-primary-foreground hover:opacity-90 disabled:opacity-60 transition-opacity shadow-md shadow-primary/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
      >
        {sending ? "Sending…" : "Send Message"}
      </button>
      <p className="text-xs text-muted-foreground text-center">
        We respect your privacy. No spam, ever.
      </p>
    </form>
  );
}
