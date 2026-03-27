import { useState } from "react";
import { Link } from "wouter";
import { ChevronDown, ArrowRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

export const FAQ_ITEMS = [
  {
    q: "What is seasonal cleaning and why do Australian homes need it?",
    a: "Seasonal cleaning is a deep, weather-specific clean tailored to Australia's four distinct seasons. In spring we tackle pollen & dust; summer brings mould & humidity; autumn means leaf and debris buildup; winter calls for germ & mildew protection. Our teams use hospital-grade, pet-safe products to keep your home fresh and healthy year-round across NSW, VIC, QLD, WA, and SA.",
  },
  {
    q: "Do you offer spring cleaning and pollen removal services?",
    a: "Yes! Our spring cleaning package includes pollen removal from air vents, window tracks, upholstery, and ceilings — plus full bathroom and kitchen sanitising. Same-day and next-day slots are available across all major Australian cities. Spring is our busiest season, so we recommend booking 48 hours in advance.",
  },
  {
    q: "How much does a deep clean or seasonal clean cost?",
    a: "Our seasonal cleans start at $179 for a 2-bedroom home and $249 for 3–4 bedrooms. Prices include all eco-friendly products, equipment, and our 100% satisfaction guarantee. Get an instant quote online in 60 seconds — no hidden fees, ever.",
  },
  {
    q: "Which areas and suburbs do you service?",
    a: "We service all major Australian suburbs and postcodes across Sydney, Melbourne, Brisbane, Perth, and Adelaide — plus surrounding areas. Our cleaners are always local professionals who live in your area, never outsourced. Enter your postcode on the booking page for instant availability.",
  },
  {
    q: "Do you help with winter mould and mildew prevention?",
    a: "Yes. Our winter mould & mildew deep clean targets bathrooms, laundry rooms, and hidden damp spots common in Australian homes during cooler months. We apply professional anti-mould treatments that last up to 6 months, keeping your family safe through the full winter season.",
  },
  {
    q: "Are your cleaners police-checked and fully insured?",
    a: "Every AussieClean professional is police-checked, fully insured with public liability coverage, and trained specifically for Australian homes. Our vetting process includes reference checks and a trial period. You'll always know who is coming — we send a cleaner profile before every booking.",
  },
  {
    q: "What payment options are available?",
    a: "We accept all major credit cards, debit cards, bank transfer, and cash on completion. Pay securely online before the clean or on the day. No hidden fees, no surcharges for card payments. Enterprise and regular clients can also set up monthly invoicing.",
  },
  {
    q: "How quickly can I book a same-day or next-day clean?",
    a: "Over 70% of our customers book same-day or next-day service. Our online booking takes 60 seconds, and you'll receive instant confirmation. We're available 7 days a week including public holidays. For urgent bookings, call our local team directly for availability.",
  },
  {
    q: "What is your satisfaction guarantee policy?",
    a: "We offer a 100% Satisfaction Guarantee. If you're not completely happy with any part of your clean within 48 hours of completion, we'll return for a free re-clean — no questions asked. Our re-clean rate is under 1% because our standards are that high.",
  },
  {
    q: "Are your cleaning products safe for children, pets, and allergy sufferers?",
    a: "Yes — all our products are Australian-made, eco-certified, and approved as child-safe and pet-safe. We avoid harsh bleaches and synthetic fragrances. Our range is ideal for households with asthma, hay fever, eczema, or pet allergies. We can also accommodate specific product requests — just ask when booking.",
  },
  {
    q: "Can I set up a regular recurring cleaning schedule?",
    a: "Absolutely. We offer weekly, fortnightly, and monthly recurring plans with discounted rates (up to 15% off). Regular clients get the same cleaner every visit, priority scheduling, and a dedicated account manager. Set up or pause your plan anytime through your online dashboard.",
  },
  {
    q: "Do you offer end-of-lease and bond cleaning?",
    a: "Yes — our end-of-lease bond clean is our most thorough service and comes with a bond-back guarantee. We follow the exact cleaning checklist required by property managers across Australia. If your property manager isn't satisfied, we return free of charge until the bond is released.",
  },
] as const;

export function FaqSection() {
  const [openIdx, setOpenIdx] = useState<number | null>(null);

  const toggle = (i: number) => setOpenIdx((prev) => (prev === i ? null : i));

  return (
    <section
      id="faq"
      aria-label="Frequently asked questions"
      className="py-20 bg-background scroll-mt-24"
    >
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">

        {/* Heading */}
        <div className="text-center space-y-3">
          <p className="text-sm font-semibold text-primary uppercase tracking-widest">
            Got questions?
          </p>
          <h2 className="text-3xl md:text-5xl font-extrabold">
            Frequently Asked Questions
          </h2>
          <p className="text-muted-foreground max-w-xl mx-auto">
            Everything you need to know about AussieClean — from pricing and availability
            to products and our satisfaction guarantee.
          </p>
        </div>

        {/* Accordion */}
        <div className="space-y-3" role="list">
          {FAQ_ITEMS.map((item, i) => {
            const isOpen = openIdx === i;
            const panelId = `faq-panel-${i}`;
            const btnId   = `faq-btn-${i}`;

            return (
              <div
                key={item.q}
                role="listitem"
                className={cn(
                  "rounded-2xl border transition-all duration-200",
                  isOpen
                    ? "border-primary/40 bg-primary/5 shadow-md shadow-primary/5"
                    : "border-border bg-card hover:border-primary/30",
                )}
              >
                {/* Question button */}
                <button
                  id={btnId}
                  aria-expanded={isOpen}
                  aria-controls={panelId}
                  onClick={() => toggle(i)}
                  className="w-full flex items-center justify-between gap-4 px-6 py-5 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-2xl"
                >
                  <span className="text-base font-semibold text-foreground leading-snug faq-question">
                    {item.q}
                  </span>
                  <ChevronDown
                    aria-hidden="true"
                    className={cn(
                      "w-5 h-5 text-primary shrink-0 transition-transform duration-300",
                      isOpen && "rotate-180",
                    )}
                  />
                </button>

                {/* Answer — always in DOM for SEO; CSS-height collapse only */}
                <div
                  id={panelId}
                  role="region"
                  aria-labelledby={btnId}
                  className={cn(
                    "overflow-hidden transition-all duration-300 ease-in-out",
                    isOpen ? "max-h-[600px] opacity-100" : "max-h-0 opacity-0",
                  )}
                >
                  <p className="faq-answer px-6 pb-5 text-sm text-muted-foreground leading-relaxed">
                    {item.a}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Bottom CTA */}
        <div className="text-center pt-4 space-y-4">
          <p className="text-muted-foreground text-sm">
            Still have questions? Our local team is here Mon–Sat, 7 am – 7 pm AEST.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <a
              href="#contact"
              className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl border border-border text-sm font-semibold text-foreground hover:border-primary/50 hover:bg-primary/5 transition-colors"
            >
              Contact our team
            </a>
            <Link
              href="/booking"
              className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-primary to-blue-500 text-primary-foreground text-sm font-semibold hover:opacity-90 shadow-md shadow-primary/20 transition-opacity"
            >
              Book a clean now <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
