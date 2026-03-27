export type Season = "spring" | "summer" | "autumn" | "winter";

export interface SeasonFaq {
  question: string;
  answer: string;
}

export interface HowToStep {
  name: string;
  text: string;
}

export interface SeasonHowTo {
  name: string;
  description: string;
  totalTime: string;
  steps: HowToStep[];
  supply: string[];
  tool: string[];
}

export interface AtomicAnswer {
  question: string;
  answer: string;
}

export interface SeasonalTemplate {
  season: Season;
  label: string;
  metaTitle: string;
  metaDescription: string;
  heroHeading: string;
  heroSubtext: string;
  fromPrice: string;
  duration: string;
  colour: string;
  ctaText: string;
  atomicAnswers: AtomicAnswer[];
  faqs: SeasonFaq[];
  howTo: SeasonHowTo;
}

/* ── Shared FAQs (suburb/postcode injected at render time) ── */

const SHARED_FAQS: SeasonFaq[] = [
  {
    question: "Is your cleaning service available across all [Suburb] postcodes?",
    answer: "Absolutely. We cover every postcode in [Suburb] and surrounding suburbs. Same local cleaners who live in your area — never outsourced.",
  },
  {
    question: "Are your cleaners police-checked and insured for [Postcode] homes?",
    answer: "Every cleaner is police-checked, fully insured with public liability coverage, and trained for Australian homes. We send a cleaner profile before every booking.",
  },
  {
    question: "What payment options are available in [Suburb]?",
    answer: "We accept all major credit cards, debit cards, bank transfer, and cash on completion. No hidden fees, no surcharges for card payments for [Postcode] customers.",
  },
  {
    question: "Do you offer guarantees on your cleaning in [Postcode]?",
    answer: "100% Satisfaction Guarantee. If you're not happy within 48 hours, we return for a free re-clean — no questions asked. Our re-clean rate across [Suburb] is under 1%.",
  },
  {
    question: "Are your products safe for kids, pets, and allergy sufferers in [Suburb]?",
    answer: "Yes — all products are Australian-made, eco-certified, and child- & pet-safe. Ideal for [Suburb] families with asthma, hay fever, eczema, or pet allergies.",
  },
  {
    question: "How quickly can I book a same-day or next-day clean in [Suburb] [Postcode]?",
    answer: "Over 70% of [Suburb] customers book same-day or next-day service. Our online booking takes 60 seconds, and you'll receive instant confirmation. Available 7 days a week.",
  },
];

/* ─────────────────────────────────────────────────────────── */

export const SEASONAL_CONTENT: Record<Season, SeasonalTemplate> = {

  /* ── SPRING ─────────────────────────────────────────────── */
  spring: {
    season: "spring",
    label: "Spring",
    metaTitle: "Spring Cleaning in [Suburb] [Postcode] | Pollen Removal & Deep Clean",
    metaDescription: "Professional spring cleaning in [Suburb] [Postcode]. Remove pollen, dust & allergens fast. Same-day slots, $179 start, 100% satisfaction guarantee. Book online 24/7.",
    heroHeading: "Spring Cleaning Made for [Suburb] [Postcode] Homes",
    heroSubtext: "Australia's pollen season hits [Suburb] hard — our local team delivers deep cleans that protect your family from allergens, mould & dust. Same-day & next-day availability across [Postcode].",
    fromPrice: "$179",
    duration: "3–5 hours",
    colour: "text-emerald-400",
    ctaText: "Book Spring Clean Now",
    atomicAnswers: [
      {
        question: "What's included in our spring pollen deep clean for [Suburb] homes?",
        answer: "Our spring cleaning in [Suburb] [Postcode] removes high pollen counts from air vents, window tracks, upholstery, and ceilings — plus full bathroom & kitchen sanitising. Every job uses Australian-made, pet-safe & child-safe products. Most [Postcode] homes take 3–5 hours and start at $179.",
      },
      {
        question: "How much does spring cleaning cost in [Postcode]?",
        answer: "Spring cleaning in [Suburb] [Postcode] starts at $179 for 2-bedroom homes and $249 for 3–4 bedrooms. Prices include all products, equipment, and a 100% satisfaction guarantee. Get an instant online quote in 30 seconds — no hidden fees.",
      },
      {
        question: "How does spring cleaning help with allergies in [Suburb]?",
        answer: "[Suburb]'s spring pollen spikes trigger asthma & hay fever. Our deep clean removes 99% of airborne allergens from ducts, carpets, and blinds. Families report fewer symptoms within 48 hours — ideal for [Postcode] households with kids or pets.",
      },
    ],
    faqs: [
      {
        question: "What is spring cleaning and why do I need it in [Suburb] [Postcode]?",
        answer: "Spring cleaning is a deep, weather-specific clean tailored to Australia's pollen season. In [Suburb] we tackle pollen buildup in air vents, window tracks, upholstery, and hard-to-reach areas. Our local [Postcode] team uses hospital-grade, pet-safe products to eliminate allergens and keep your home fresh.",
      },
      {
        question: "Do you offer spring cleaning services in [Suburb] [Postcode]?",
        answer: "Yes! Our spring cleaning package includes pollen removal, window tracks, air vents, and upholstery sanitising — perfect for [Suburb] homes affected by high pollen counts. Same-day and next-day slots available across [Postcode].",
      },
      {
        question: "How much does a spring deep clean cost in [Postcode]?",
        answer: "Our spring cleans start at $179 for a 2-bedroom home in [Suburb] [Postcode]. Prices include all eco-friendly products and are fully customised. Get an instant online quote or call for a free [Suburb]-specific assessment.",
      },
      {
        question: "Do your cleaners handle mould prevention during spring in [Postcode]?",
        answer: "Yes. Spring humidity in [Suburb] creates mould risk. We apply anti-mould treatments to bathrooms, laundry & hidden damp spots that last up to 6 months.",
      },
      ...SHARED_FAQS,
    ],
    howTo: {
      name: "Spring Cleaning Checklist for [Suburb] [Postcode] Homes",
      description: "Complete step-by-step guide to remove pollen, dust and allergens from your [Suburb] home. Takes 3–5 hours depending on home size.",
      totalTime: "PT4H",
      steps: [
        { name: "Preparation & Ventilation", text: "Open all windows for airflow. Remove clutter from surfaces. Gather supplies. [Suburb] spring days are ideal for ventilating when outdoor temp is 18°C+." },
        { name: "High Dusting & Pollen Traps", text: "Start at the ceiling: light fixtures, fans, blinds, and window tracks. Use microfibre cloths to trap pollen rather than redistribute it." },
        { name: "Air Vents & Filters", text: "Vacuum all AC vents and grilles. Replace ducted heating filters. [Suburb] pollen easily accumulates in vents and recirculates through the home if left uncleaned." },
        { name: "Upholstery & Carpet Vacuum", text: "Vacuum carpets, sofas, curtains, and mattress surfaces with a HEPA filter vacuum. Spot-clean pet hair and surface allergens." },
        { name: "Kitchen Deep Clean", text: "Sanitise benchtops, oven exterior, fridge seals, and splashbacks with eco-friendly spray. Wipe down all cabinet fronts and handles." },
        { name: "Bathroom Sanitise & Mould Prevention", text: "Scrub showers, tiles, and grout. Apply professional anti-mould treatment — especially important given [Suburb]'s spring humidity. Lasts 6 months." },
        { name: "Floors & Skirting Boards", text: "Mop hard floors and wipe all skirting boards. [Suburb] spring dust settles heavily on floor-level surfaces." },
        { name: "Windows & Final Air-Out", text: "Clean inside window tracks and wipe glass. Let fresh air circulate for 30 minutes. Your [Postcode] home is now allergen-free and sparkling." },
      ],
      supply: ["Eco-friendly all-purpose cleaner", "Anti-allergen spray", "Microfibre cloths", "HEPA vacuum bags"],
      tool: ["HEPA vacuum cleaner", "Step ladder", "Mop and bucket", "Window squeegee"],
    },
  },

  /* ── SUMMER ─────────────────────────────────────────────── */
  summer: {
    season: "summer",
    label: "Summer",
    metaTitle: "Summer Cleaning in [Suburb] [Postcode] | Mould & Humidity Protection",
    metaDescription: "Professional summer cleaning in [Suburb] [Postcode]. Mould removal, humidity protection & sanitising. Same-day slots, $199 start, 100% guarantee. Book online 24/7.",
    heroHeading: "Summer Mould Protection for [Suburb] [Postcode] Homes",
    heroSubtext: "Australian summers bring humidity that fuels mould growth in [Suburb] — particularly in bathrooms, kitchens, and coastal-facing rooms. Our summer clean protects your family all season.",
    fromPrice: "$199",
    duration: "3–5 hours",
    colour: "text-amber-400",
    ctaText: "Book Summer Clean Now",
    atomicAnswers: [
      {
        question: "What's included in our summer mould protection clean for [Suburb] homes?",
        answer: "Our summer clean in [Suburb] [Postcode] targets humidity-driven mould in bathrooms, kitchens, and laundry areas — plus full surface sanitising and anti-mould treatment application. Protection lasts up to 6 months. Most [Postcode] homes take 3–5 hours, starting at $199.",
      },
      {
        question: "Why does [Suburb] have elevated mould risk in summer?",
        answer: "Summer humidity in [Suburb] [Postcode] — especially after rain — creates ideal conditions for mould spores to colonise bathroom grout, window seals, and ceiling corners. Our professional anti-mould treatment eliminates existing mould and prevents regrowth for 6 months.",
      },
      {
        question: "How much does summer cleaning cost in [Postcode]?",
        answer: "Summer cleaning in [Suburb] [Postcode] starts at $199 for 2-bedroom homes and $279 for 3–4 bedrooms. Prices include anti-mould treatment, all products, equipment, and our 100% satisfaction guarantee.",
      },
    ],
    faqs: [
      {
        question: "What is summer cleaning and why do I need it in [Suburb] [Postcode]?",
        answer: "Australian summer brings heat and humidity that drives mould growth in [Suburb] homes. Our summer clean targets bathrooms, laundry, kitchen, and window condensation zones — preventing the health risks of mould exposure for your family in [Postcode].",
      },
      {
        question: "Do you offer summer mould removal services in [Suburb] [Postcode]?",
        answer: "Yes! Our summer package includes bathroom mould scrubbing, grout treatment, anti-mould spray application, kitchen sanitising, and fridge seal cleaning — all with eco-friendly products. Same-day and next-day slots available across [Postcode].",
      },
      {
        question: "How much does a summer deep clean cost in [Postcode]?",
        answer: "Summer cleans in [Suburb] [Postcode] start at $199 for a 2-bedroom home. Includes anti-mould treatment, all eco-friendly products, and our satisfaction guarantee.",
      },
      {
        question: "Is summer the highest mould risk season for [Suburb] homes?",
        answer: "Yes — along with early autumn. High humidity and warm temperatures in [Suburb] create rapid mould growth on grout, silicone, and ceiling plaster. Our 6-month treatment is most effective when applied at the start of summer.",
      },
      ...SHARED_FAQS,
    ],
    howTo: {
      name: "Summer Mould Prevention Checklist for [Suburb] [Postcode] Homes",
      description: "Step-by-step guide to prevent mould and humidity damage in your [Suburb] home during Australian summer. Takes 3–5 hours.",
      totalTime: "PT4H",
      steps: [
        { name: "Identify Mould-Prone Zones", text: "Check bathrooms, laundry, kitchen splashbacks, and window sills for black spots, musty odours, or condensation rings — common in [Suburb] summer homes." },
        { name: "Ventilate Effectively", text: "Run exhaust fans for 20 minutes after every shower. Open windows during the coolest part of the day to reduce indoor humidity below 60%." },
        { name: "Scrub Bathrooms & Grout", text: "Apply eco-friendly anti-mould solution to shower tiles, grout lines, and silicone seals. Scrub with a stiff brush and wipe completely dry." },
        { name: "Apply 6-Month Anti-Mould Barrier", text: "Spray professional preventative treatment on all wet area surfaces, window sills, and damp-prone walls. Allow to fully air dry — forms an invisible protective barrier." },
        { name: "Clean Fridge Seals & Drip Trays", text: "Summer heat makes fridge condensation a mould hotspot in [Suburb] kitchens. Remove and scrub seals, clean drip trays, and wipe behind the unit." },
        { name: "Dehumidify Closed Rooms", text: "Use dehumidifiers in bedrooms and living areas with poor airflow. Target humidity below 60% — the key threshold for mould prevention in [Postcode] summers." },
        { name: "Final Check & Ongoing Plan", text: "Check all treated areas after any heavy rainfall. Reapply treatment every 6 months or after flooding. Book a seasonal follow-up for maximum protection in [Suburb]." },
      ],
      supply: ["Eco-friendly anti-mould spray", "Microfibre cloths", "Dehumidifier", "HEPA vacuum", "Exhaust fans"],
      tool: ["Stiff scrub brush", "Spray bottle", "Humidity monitor", "Step ladder"],
    },
  },

  /* ── AUTUMN ─────────────────────────────────────────────── */
  autumn: {
    season: "autumn",
    label: "Autumn",
    metaTitle: "Autumn Cleaning in [Suburb] [Postcode] | Pre-Winter Reset & Deep Clean",
    metaDescription: "Professional autumn cleaning in [Suburb] [Postcode]. Pre-winter reset, deep clean & germ protection. Same-day slots, $179 start, 100% guarantee. Book online.",
    heroHeading: "Autumn Reset Cleaning for [Suburb] [Postcode] Homes",
    heroSubtext: "Autumn is the ideal time to reset your [Suburb] home before winter. Our autumn deep clean removes summer grime, outdoor debris, and prepares every surface for the cooler months ahead.",
    fromPrice: "$179",
    duration: "3–5 hours",
    colour: "text-orange-400",
    ctaText: "Book Autumn Clean Now",
    atomicAnswers: [
      {
        question: "What's included in our autumn reset clean for [Suburb] homes?",
        answer: "Our autumn clean in [Suburb] [Postcode] covers a full interior reset: carpets, hard floors, kitchen deep clean, bathroom sanitising, skirting boards, outdoor entertaining area wash-down, and a pre-winter anti-mould treatment. Most [Postcode] homes take 3–5 hours, from $179.",
      },
      {
        question: "Why is autumn the best time to deep clean in [Postcode]?",
        answer: "Autumn gives you a window before winter when windows can still be opened for ventilation. Clearing summer grime, dead leaves, and humidity residue now prevents damp and mould from building up through the coldest months in [Suburb].",
      },
      {
        question: "Do you offer pre-winter germ protection in [Suburb] [Postcode]?",
        answer: "Yes — our autumn clean includes a pre-winter germ protection surface spray on high-touch areas: door handles, light switches, remote controls, and bathroom fixtures. This significantly reduces the spread of colds and flu in [Suburb] households.",
      },
    ],
    faqs: [
      {
        question: "What is autumn cleaning and why do I need it in [Suburb] [Postcode]?",
        answer: "Autumn cleaning is a pre-winter reset that removes summer grime and prepares your [Suburb] home for cooler months. We deep clean carpets, floors, kitchen, bathrooms, and apply pre-winter germ protection — all with eco-friendly, pet-safe products for [Postcode] families.",
      },
      {
        question: "Do you offer autumn reset services in [Suburb] [Postcode]?",
        answer: "Yes! Our autumn package includes a full interior reset, outdoor area wash-down, fireplace surround cleaning, carpet extraction, and pre-winter germ protection spray. Same-day and next-day slots available across [Postcode].",
      },
      {
        question: "How much does an autumn reset clean cost in [Postcode]?",
        answer: "Autumn cleans in [Suburb] [Postcode] start at $179 for a 2-bedroom home. Includes all eco-friendly products, pre-winter treatment, and our 100% satisfaction guarantee.",
      },
      {
        question: "Does your autumn clean include outdoor entertaining areas in [Suburb]?",
        answer: "Yes — outdoor decks, alfresco areas, and BBQ surrounds are included in our autumn package for [Suburb] [Postcode]. We wash down surfaces, remove leaf and debris buildup, and prepare outdoor areas before the wet season arrives.",
      },
      ...SHARED_FAQS,
    ],
    howTo: {
      name: "Autumn Pre-Winter Cleaning Checklist for [Suburb] [Postcode] Homes",
      description: "Step-by-step guide to reset your [Suburb] home for winter. Complete this checklist to prevent damp, grime buildup, and cold-season germ spread. Takes 3–5 hours.",
      totalTime: "PT4H",
      steps: [
        { name: "Outdoor Reset", text: "Clear leaf and debris buildup from outdoor areas, decks, and alfresco zones in [Suburb] before winter rains make it harder to remove." },
        { name: "Carpet & Upholstery Extraction", text: "Deep extract carpets, rugs, and sofas to remove summer sweat, pet dander, and dust mites. Far more effective than surface vacuuming." },
        { name: "Full Kitchen Deep Clean", text: "Degrease oven, rangehood filter, fridge coils and seals, dishwasher filter, and all surfaces. Summer cooking residue hardens over winter." },
        { name: "Bathroom Sanitise", text: "Scrub showers, tiles, grout, and toilet areas. Apply pre-winter anti-mould treatment to reduce risk through cooler months in [Postcode]." },
        { name: "Skirting Boards & Cornices", text: "Wipe all skirting boards, window sills, and cornices. These attract autumn dust and spider webs which harden if left through winter." },
        { name: "Wardrobe & Storage Areas", text: "Vacuum wardrobe interiors, wipe shelves, and check for damp. Swap summer clothing out and ensure winter items are clean before storing." },
        { name: "Pre-Winter Germ Protection Spray", text: "Apply surface disinfectant to all high-touch zones: door handles, light switches, remote controls, and bathroom fixtures — reducing cold and flu spread in [Suburb] through winter." },
      ],
      supply: ["Eco-friendly all-purpose cleaner", "Pre-winter surface disinfectant", "Microfibre cloths", "Carpet extraction solution"],
      tool: ["HEPA vacuum", "Carpet extraction machine", "Step ladder", "Mop and bucket"],
    },
  },

  /* ── WINTER ─────────────────────────────────────────────── */
  winter: {
    season: "winter",
    label: "Winter",
    metaTitle: "Winter Cleaning in [Suburb] [Postcode] | Mould & Germ Protection",
    metaDescription: "Professional winter cleaning in [Suburb] [Postcode]. Hospital-grade disinfection, mould & mildew treatment, anti-viral spray. Same-day, $179 start. Book 24/7.",
    heroHeading: "Winter Germ Shield Cleaning for [Suburb] [Postcode] Homes",
    heroSubtext: "As [Suburb] families spend more time indoors, winter is cold and flu season. Our winter clean disinfects high-touch surfaces, treats mould, and creates a hygienically safe sanctuary for your household in [Postcode].",
    fromPrice: "$179",
    duration: "2–4 hours",
    colour: "text-blue-400",
    ctaText: "Book Winter Clean Now",
    atomicAnswers: [
      {
        question: "What's included in our winter germ shield clean for [Suburb] homes?",
        answer: "Our winter clean in [Suburb] [Postcode] covers hospital-grade disinfection of all high-touch surfaces, bathroom & toilet sanitising, mattress surface treatment, HEPA vacuuming throughout, anti-viral surface protection spray, and mould treatment for bathrooms. Starting at $179 for [Postcode] homes.",
      },
      {
        question: "How does our winter clean reduce cold and flu spread in [Suburb]?",
        answer: "We use hospital-grade disinfectant on every surface that hands touch frequently in [Suburb] homes: door handles, light switches, remote controls, phone-charging areas, taps, and toilet flushers. Clinical studies show this reduces household cold transmission by up to 80%.",
      },
      {
        question: "Do you help with winter mould prevention in [Suburb] [Postcode]?",
        answer: "Yes. Our winter mould & mildew deep clean targets bathrooms, laundry areas, and hidden damp spots common in [Suburb] homes during cooler months. We use anti-mould treatments that last up to 6 months — applied on every winter clean.",
      },
    ],
    faqs: [
      {
        question: "What is winter cleaning and why do I need it in [Suburb] [Postcode]?",
        answer: "Winter cleaning focuses on two things: stopping germ spread as families stay indoors, and preventing mould from the increased condensation in [Suburb] [Postcode] homes. Our winter service combines hospital-grade disinfection with anti-mould treatment for complete protection.",
      },
      {
        question: "Do you offer winter mould removal services in [Suburb] [Postcode]?",
        answer: "Yes — our winter package targets every mould-prone area in [Suburb] homes: bathroom tiles, grout, shower silicone, laundry wet areas, and ceiling corners. We apply professional treatment that actively prevents mould regrowth for 6 months.",
      },
      {
        question: "How much does a winter deep clean cost in [Postcode]?",
        answer: "Winter cleans in [Suburb] [Postcode] start at $179 for a 2-bedroom home. Includes anti-viral surface spray, anti-mould treatment, all eco-friendly products, and our satisfaction guarantee.",
      },
      {
        question: "Do you help with indoor air quality during winter in [Suburb]?",
        answer: "Yes. We clean all AC vents, ducted heating grilles, and ceiling fans as part of our winter service. Contaminated filters and vents recirculate mould spores and bacteria through [Suburb] homes every time the heating system runs — particularly dangerous for asthma sufferers.",
      },
      ...SHARED_FAQS,
    ],
    howTo: {
      name: "Winter Mould Prevention Checklist for [Suburb] [Postcode] Homes",
      description: "Follow this 7-step winter checklist to stop mould before it starts in [Suburb] homes. Protects for up to 6 months.",
      totalTime: "PT2H",
      steps: [
        { name: "Identify High-Risk Zones", text: "Check bathrooms, laundry, kitchen corners, and behind furniture for black spots, musty smells, or condensation. These are the highest-risk zones in [Suburb] winter homes." },
        { name: "Improve Ventilation", text: "Open windows for 10–15 minutes daily even in winter. Run exhaust fans in bathrooms and laundry for 20 minutes after every shower or wash cycle in [Postcode] homes." },
        { name: "Deep Clean Existing Mould", text: "Spray affected areas with eco-friendly anti-mould solution. Scrub tiles, grout, and silicone seals firmly. Wipe completely dry immediately — leaving moisture re-seeds mould." },
        { name: "Apply Long-Lasting Anti-Mould Treatment", text: "Spray professional preventative treatment on shower walls, corners, and all damp-prone surfaces. Allow to fully air dry — forms an invisible barrier protecting [Suburb] homes for 6 months." },
        { name: "Reduce Indoor Humidity", text: "Use dehumidifiers in rooms with poor airflow. Target indoor humidity below 60% — the threshold above which mould spores rapidly colonise surfaces in [Postcode] winter homes." },
        { name: "Clean Air Vents & Filters", text: "Vacuum AC vents and grilles, replace furnace filters, and wipe ceiling fans. Dirty vents recirculate mould spores through your entire [Suburb] home every time the system runs." },
        { name: "Final Inspection & Maintenance Plan", text: "Walk through every treated area. Reapply anti-mould treatment every 6 months or within two weeks of any heavy rain or flooding event in [Postcode]." },
      ],
      supply: ["Eco-friendly anti-mould spray", "Microfibre cloths", "Dehumidifier", "HEPA vacuum", "Exhaust fans"],
      tool: ["Stiff scrub brush", "Spray bottle", "Humidity monitor", "Step ladder"],
    },
  },
};

/* ─── Template replacement utility ──────────────────────── */

export function fillTemplate(text: string, suburb: string, postcode: string): string {
  return text
    .replace(/\[Suburb\]/g, suburb)
    .replace(/\[Postcode\]/g, postcode);
}

export function fillFaqs(faqs: SeasonFaq[], suburb: string, postcode: string): SeasonFaq[] {
  return faqs.map((f) => ({
    question: fillTemplate(f.question, suburb, postcode),
    answer:   fillTemplate(f.answer,   suburb, postcode),
  }));
}

export function fillAtomicAnswers(answers: AtomicAnswer[], suburb: string, postcode: string): AtomicAnswer[] {
  return answers.map((a) => ({
    question: fillTemplate(a.question, suburb, postcode),
    answer:   fillTemplate(a.answer,   suburb, postcode),
  }));
}

export function fillHowTo(howTo: SeasonHowTo, suburb: string, postcode: string): SeasonHowTo {
  return {
    ...howTo,
    name:        fillTemplate(howTo.name,        suburb, postcode),
    description: fillTemplate(howTo.description, suburb, postcode),
    steps: howTo.steps.map((s) => ({
      name: fillTemplate(s.name, suburb, postcode),
      text: fillTemplate(s.text, suburb, postcode),
    })),
  };
}

export function getSeasonalContent(season: Season): SeasonalTemplate {
  return SEASONAL_CONTENT[season];
}

export const ALL_SEASONS: Season[] = ["spring", "summer", "autumn", "winter"];
