import type { Season } from "@/data/seasonal-content";
import type { SuburbData } from "@/data/suburbs";
import type { SeasonFaq, SeasonHowTo } from "@/data/seasonal-content";

/* ── Individual schema builders ──────────────────────────── */

export function buildFAQSchema(faqs: SeasonFaq[]) {
  return faqs.map((faq) => ({
    "@type": "Question",
    name: faq.question,
    acceptedAnswer: { "@type": "Answer", text: faq.answer },
  }));
}

export function buildHowToSchema(
  howTo: SeasonHowTo,
  baseUrl: string,
) {
  return {
    "@type": "HowTo",
    name: howTo.name,
    description: howTo.description,
    totalTime: howTo.totalTime,
    estimatedCost: { "@type": "MonetaryAmount", currency: "AUD", value: "0" },
    supply: howTo.supply,
    tool: howTo.tool,
    step: howTo.steps.map((s, i) => ({
      "@type": "HowToStep",
      position: i + 1,
      name: s.name,
      text: s.text,
      url: `${baseUrl}/#step-${i + 1}`,
    })),
  };
}

/* ── Combined @graph schema builder ──────────────────────── */

export function buildSeasonalSuburbSchema({
  data,
  season,
  seasonLabel,
  filledFaqs,
  filledHowTo,
  metaTitle,
}: {
  data: SuburbData;
  season: Season;
  seasonLabel: string;
  filledFaqs: SeasonFaq[];
  filledHowTo: SeasonHowTo;
  metaTitle: string;
}) {
  const BASE = "https://aussieclean.com.au";
  const url  = `${BASE}/suburb/${data.slug}/${season}`;

  return {
    "@context": "https://schema.org",
    "@graph": [

      /* WebPage */
      {
        "@type": "WebPage",
        "@id": `${url}/#page`,
        name: metaTitle,
        url,
        inLanguage: "en-AU",
        speakable: {
          "@type": "SpeakableSpecification",
          cssSelector: [".atomic-answer", ".faq-answer", ".howto-step", ".hero-text"],
        },
        isPartOf: { "@id": `${BASE}/#business` },
      },

      /* LocalBusiness */
      {
        "@type": ["LocalBusiness", "CleaningService"],
        "@id": `${BASE}/#business`,
        name: "AussieClean",
        description: `Professional ${season} cleaning in ${data.suburb} ${data.postcode} — ${season === "spring" || season === "summer" ? "pollen & mould removal" : season === "winter" ? "mould prevention & germ protection" : "pre-winter reset"}, same-day service.`,
        url: BASE,
        telephone: "+611300253262",
        email: "hello@aussieclean.com.au",
        priceRange: "$$",
        address: {
          "@type": "PostalAddress",
          addressLocality: data.suburb,
          postalCode: data.postcode,
          addressRegion: data.stateCode,
          addressCountry: "AU",
        },
        areaServed: [
          { "@type": "City", name: data.suburb, postalCode: data.postcode },
          ...data.neighbours.map((n, i) => ({
            "@type": "City",
            name: n,
            postalCode: data.neighbourPostcodes[i] ?? data.postcode,
          })),
        ],
        openingHoursSpecification: [{
          "@type": "OpeningHoursSpecification",
          dayOfWeek: ["Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"],
          opens: "07:00",
          closes: "19:00",
        }],
        aggregateRating: {
          "@type": "AggregateRating",
          ratingValue: Number(data.rating),
          reviewCount: data.reviewCount,
          bestRating: 5,
        },
        hasOfferCatalog: {
          "@type": "OfferCatalog",
          name: `${seasonLabel} Cleaning Services in ${data.suburb}`,
          itemListElement: [
            {
              "@type": "Offer",
              itemOffered: {
                "@type": "Service",
                name: `2-Bedroom ${seasonLabel} Clean — ${data.suburb}`,
                description: `Full ${season} deep clean for 2-bedroom homes in ${data.suburb} ${data.postcode}.`,
              },
              price: season === "summer" ? "199.00" : "179.00",
              priceCurrency: "AUD",
            },
            {
              "@type": "Offer",
              itemOffered: {
                "@type": "Service",
                name: `3–4 Bedroom ${seasonLabel} Clean — ${data.suburb}`,
                description: `Extended ${season} deep clean for larger homes in ${data.suburb}.`,
              },
              price: season === "summer" ? "279.00" : "249.00",
              priceCurrency: "AUD",
            },
          ],
        },
      },

      /* Service */
      {
        "@type": "Service",
        "@id": `${url}/#service`,
        name: `${seasonLabel} Cleaning Service — ${data.suburb} ${data.postcode}`,
        serviceType: season === "spring"
          ? "Pollen removal, allergen treatment, deep clean"
          : season === "summer"
          ? "Mould removal, humidity protection, deep sanitise"
          : season === "autumn"
          ? "Pre-winter reset, germ protection, deep clean"
          : "Mould prevention, anti-viral disinfection, germ shield",
        provider: { "@id": `${BASE}/#business` },
        areaServed: [data.postcode, ...data.neighbourPostcodes],
      },

      /* FAQPage */
      {
        "@type": "FAQPage",
        "@id": `${url}/#faq`,
        name: `Frequently Asked Questions — ${seasonLabel} Cleaning in ${data.suburb} ${data.postcode}`,
        isPartOf: { "@id": `${url}/#page` },
        speakable: {
          "@type": "SpeakableSpecification",
          cssSelector: [".faq-question", ".faq-answer"],
        },
        mainEntity: buildFAQSchema(filledFaqs),
      },

      /* HowTo */
      {
        ...buildHowToSchema(filledHowTo, url),
        "@id": `${url}/#checklist`,
        isPartOf: { "@id": `${url}/#page` },
      },
    ],
  };
}

/* ── Sitemap entry builder ───────────────────────────────── */

export interface SitemapEntry {
  url: string;
  lastModified: string;
  changeFrequency: "daily" | "weekly" | "monthly";
  priority: number;
}

export function buildSuburbSeasonSitemapEntries(
  slugs: string[],
  seasons: Season[],
  base = "https://aussieclean.com.au",
): SitemapEntry[] {
  const today = new Date().toISOString().slice(0, 10);
  return [
    { url: base, lastModified: today, changeFrequency: "daily",   priority: 1.0 },
    ...slugs.flatMap((slug) =>
      [
        { url: `${base}/suburb/${slug}`,           lastModified: today, changeFrequency: "weekly"  as const, priority: 0.9 },
        ...seasons.map((season) => ({
          url: `${base}/suburb/${slug}/${season}`, lastModified: today, changeFrequency: "monthly" as const, priority: 0.8,
        })),
      ]
    ),
  ];
}
