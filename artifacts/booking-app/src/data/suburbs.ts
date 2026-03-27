export interface SuburbData {
  slug: string;
  suburb: string;
  postcode: string;
  state: string;
  stateCode: string;
  region: string;
  neighbours: string[];
  neighbourPostcodes: string[];
  pollensRisk: "High" | "Moderate" | "Low";
  mouldRisk: "High" | "Moderate" | "Low";
  climate: string;
  localNote: string;
  population: number;
  reviewCount: number;
  rating: string;
}

export const SUBURB_DATA: SuburbData[] = [
  {
    slug: "chatswood-2067",
    suburb: "Chatswood",
    postcode: "2067",
    state: "New South Wales",
    stateCode: "NSW",
    region: "Lower North Shore, Sydney",
    neighbours: ["Artarmon", "Lane Cove", "Willoughby", "Roseville", "Gordon"],
    neighbourPostcodes: ["2064", "2066", "2068", "2069"],
    pollensRisk: "High",
    mouldRisk: "Moderate",
    climate: "Humid subtropical — warm, humid summers with mild winters and spring pollen peaks",
    localNote: "Chatswood's high-density apartments and north-facing blocks see elevated spring pollen from Willoughby Road's street trees. Winter condensation in older brick apartments is common.",
    population: 34000,
    reviewCount: 312,
    rating: "4.9",
  },
  {
    slug: "richmond-3121",
    suburb: "Richmond",
    postcode: "3121",
    state: "Victoria",
    stateCode: "VIC",
    region: "Inner East, Melbourne",
    neighbours: ["Hawthorn", "Abbotsford", "Burnley", "Cremorne", "East Melbourne"],
    neighbourPostcodes: ["3122", "3067", "3121", "3002"],
    pollensRisk: "High",
    mouldRisk: "High",
    climate: "Cool temperate — variable springs, cold wet winters with very high grass pollen peaks in October–November",
    localNote: "Richmond's Victorian terraces and period homes are highly susceptible to winter damp. The Yarra River corridor elevates winter humidity significantly. Spring pollen counts among Melbourne's highest.",
    population: 30000,
    reviewCount: 287,
    rating: "4.9",
  },
  {
    slug: "south-yarra-3141",
    suburb: "South Yarra",
    postcode: "3141",
    state: "Victoria",
    stateCode: "VIC",
    region: "Inner South, Melbourne",
    neighbours: ["Toorak", "Prahran", "St Kilda Road", "Windsor", "Armadale"],
    neighbourPostcodes: ["3142", "3181", "3143", "3182"],
    pollensRisk: "High",
    mouldRisk: "Moderate",
    climate: "Cool temperate — cold wet winters; high spring pollen; summer heat spikes to 40°C",
    localNote: "South Yarra's luxury apartments and older heritage homes both face mould risk in winter. High-density living means shared HVAC systems can distribute spores rapidly.",
    population: 28000,
    reviewCount: 268,
    rating: "4.9",
  },
  {
    slug: "new-farm-4005",
    suburb: "New Farm",
    postcode: "4005",
    state: "Queensland",
    stateCode: "QLD",
    region: "Inner North Brisbane",
    neighbours: ["Fortitude Valley", "Newstead", "Teneriffe", "Bowen Hills", "Kangaroo Point"],
    neighbourPostcodes: ["4006", "4007", "4000", "4169"],
    pollensRisk: "Moderate",
    mouldRisk: "High",
    climate: "Humid subtropical — hot humid summers with heavy rainfall; mild winters",
    localNote: "New Farm's subtropical humidity and frequent summer downpours create ideal mould conditions year-round. Post-flood remediation cleans are a significant seasonal service need.",
    population: 14000,
    reviewCount: 201,
    rating: "4.8",
  },
  {
    slug: "subiaco-6008",
    suburb: "Subiaco",
    postcode: "6008",
    state: "Western Australia",
    stateCode: "WA",
    region: "Inner West, Perth",
    neighbours: ["Shenton Park", "West Perth", "Jolimont", "Floreat", "Leederville"],
    neighbourPostcodes: ["6008", "6005", "6014", "6007"],
    pollensRisk: "Moderate",
    mouldRisk: "Low",
    climate: "Mediterranean — hot dry summers, mild wet winters; spring pollen from native acacias",
    localNote: "Subiaco's Mediterranean climate means dry conditions limit mould risk except in winter. Spring acacia pollen is a significant allergen for local residents.",
    population: 14000,
    reviewCount: 178,
    rating: "4.9",
  },
  {
    slug: "norwood-5067",
    suburb: "Norwood",
    postcode: "5067",
    state: "South Australia",
    stateCode: "SA",
    region: "Eastern Suburbs, Adelaide",
    neighbours: ["Kensington", "Marryatville", "Beulah Park", "St Peters", "College Park"],
    neighbourPostcodes: ["5068", "5070", "5007", "5069"],
    pollensRisk: "Moderate",
    mouldRisk: "Moderate",
    climate: "Semi-arid Mediterranean — hot summers, cool wet winters; moderate pollen season",
    localNote: "Norwood's older sandstone and bluestone cottages are particularly susceptible to rising damp in winter. Post-winter deep cleans are popular in the heritage suburb.",
    population: 11000,
    reviewCount: 156,
    rating: "4.8",
  },
  {
    slug: "manly-2095",
    suburb: "Manly",
    postcode: "2095",
    state: "New South Wales",
    stateCode: "NSW",
    region: "Northern Beaches, Sydney",
    neighbours: ["Balgowlah", "Fairlight", "Seaforth", "Freshwater", "Queenscliff"],
    neighbourPostcodes: ["2093", "2096", "2097"],
    pollensRisk: "Moderate",
    mouldRisk: "High",
    climate: "Humid subtropical coastal — high year-round humidity; sea spray adds salt residue to surfaces",
    localNote: "Manly's coastal position means persistent salt air and humidity drive mould into bathroom grout and window seals. Post-storm clean-outs are a common seasonal request.",
    population: 17000,
    reviewCount: 245,
    rating: "4.9",
  },
  {
    slug: "fitzroy-3065",
    suburb: "Fitzroy",
    postcode: "3065",
    state: "Victoria",
    stateCode: "VIC",
    region: "Inner North, Melbourne",
    neighbours: ["Collingwood", "Carlton", "Northcote", "Clifton Hill", "Brunswick"],
    neighbourPostcodes: ["3066", "3053", "3070", "3068", "3056"],
    pollensRisk: "High",
    mouldRisk: "High",
    climate: "Cool temperate — very cold wet winters; Melbourne's notorious pollen thunderstorms in October–November",
    localNote: "Fitzroy's Victorian-era terraces and converted warehouses are notorious for rising damp and brick moisture absorption. Thunderstorm asthma events make spring deep cleans critical for residents.",
    population: 10000,
    reviewCount: 198,
    rating: "4.8",
  },
  {
    slug: "paddington-4064",
    suburb: "Paddington",
    postcode: "4064",
    state: "Queensland",
    stateCode: "QLD",
    region: "Inner West, Brisbane",
    neighbours: ["Bardon", "Auchenflower", "Milton", "Red Hill", "Rosalie"],
    neighbourPostcodes: ["4065", "4066", "4064", "4059", "4065"],
    pollensRisk: "Moderate",
    mouldRisk: "High",
    climate: "Humid subtropical — very hot humid summers with heavy afternoon storms; mild dry winters",
    localNote: "Paddington's Queenslander homes with open sub-floor spaces and high ceilings accumulate mould rapidly in summer. The elevated humidity from afternoon storms makes regular anti-mould treatment essential.",
    population: 8500,
    reviewCount: 167,
    rating: "4.9",
  },
  {
    slug: "fremantle-6160",
    suburb: "Fremantle",
    postcode: "6160",
    state: "Western Australia",
    stateCode: "WA",
    region: "Port City, Perth",
    neighbours: ["East Fremantle", "North Fremantle", "White Gum Valley", "Beaconsfield", "South Fremantle"],
    neighbourPostcodes: ["6158", "6159", "6162", "6162", "6162"],
    pollensRisk: "Moderate",
    mouldRisk: "Moderate",
    climate: "Mediterranean — hot dry summers with sea breezes; mild wet winters; strong Fremantle Doctor winds",
    localNote: "Fremantle's historic limestone buildings and coastal position create unique salt damp issues. The famous 'Fremantle Doctor' afternoon sea breeze brings moisture to west-facing rooms daily.",
    population: 29000,
    reviewCount: 183,
    rating: "4.9",
  },
  {
    slug: "glebe-2037",
    suburb: "Glebe",
    postcode: "2037",
    state: "New South Wales",
    stateCode: "NSW",
    region: "Inner West, Sydney",
    neighbours: ["Forest Lodge", "Ultimo", "Pyrmont", "Annandale", "Camperdown"],
    neighbourPostcodes: ["2037", "2007", "2009", "2038", "2050"],
    pollensRisk: "Moderate",
    mouldRisk: "Moderate",
    climate: "Humid subtropical — warm humid summers; mild winters; harbour proximity elevates humidity year-round",
    localNote: "Glebe's mix of heritage terraces and modern apartments means highly varied mould risk profiles. Older terrace homes with poor subfloor ventilation see the highest winter damp rates.",
    population: 14000,
    reviewCount: 212,
    rating: "4.8",
  },
  {
    slug: "glenelg-5045",
    suburb: "Glenelg",
    postcode: "5045",
    state: "South Australia",
    stateCode: "SA",
    region: "Beachside, Adelaide",
    neighbours: ["Somerton Park", "Glenelg North", "Brighton", "Hove", "Glenelg East"],
    neighbourPostcodes: ["5044", "5045", "5048", "5048", "5045"],
    pollensRisk: "Moderate",
    mouldRisk: "Moderate",
    climate: "Mediterranean — hot dry summers; cool wet winters; coastal humidity from Gulf St Vincent",
    localNote: "Glenelg's beachside location creates persistent salt air and winter condensation in coastal-facing rooms. Pre-summer deep cleans are popular before the holiday rental season.",
    population: 11000,
    reviewCount: 142,
    rating: "4.8",
  },
  {
    slug: "toorak-3142",
    suburb: "Toorak",
    postcode: "3142",
    state: "Victoria",
    stateCode: "VIC",
    region: "Inner South East, Melbourne",
    neighbours: ["South Yarra", "Armadale", "Malvern", "Kooyong", "Hawksburn"],
    neighbourPostcodes: ["3141", "3143", "3144", "3144", "3142"],
    pollensRisk: "High",
    mouldRisk: "Moderate",
    climate: "Cool temperate — cold dry winters; high spring grass pollen; large garden estates increase outdoor allergen loads",
    localNote: "Toorak's large heritage mansions and established gardens generate significant pollen loads in spring. Many properties have mature deciduous trees whose autumn leaves clog gutters and create debris that requires professional removal.",
    population: 13000,
    reviewCount: 276,
    rating: "4.9",
  },
] as const;

export function getSuburb(slug: string): SuburbData | undefined {
  return SUBURB_DATA.find((s) => s.slug === slug);
}

export function buildSuburbJsonLd(data: SuburbData, base = "https://aussieclean.com.au") {
  const url = `${base}/suburb/${data.slug}`;
  return {
    "@context": "https://schema.org",
    "@graph": [
      /* ── WebPage ────────────────────────────────────────── */
      {
        "@type": "WebPage",
        "@id": `${url}/#page`,
        name: `Cleaning Services in ${data.suburb} ${data.postcode} | AussieClean`,
        description: `Professional spring & winter cleaning in ${data.suburb} ${data.postcode}. Police-checked, insured cleaners. Same-day available. From $179.`,
        url,
        inLanguage: "en-AU",
        speakable: {
          "@type": "SpeakableSpecification",
          cssSelector: [".atomic-answer", ".faq-answer", ".howto-step", ".hero-text"],
        },
        isPartOf: { "@id": "https://aussieclean.com.au/#business" },
      },

      /* ── LocalBusiness (suburb-specific) ───────────────── */
      {
        "@type": ["LocalBusiness", "CleaningService"],
        "@id": "https://aussieclean.com.au/#business",
        name: "AussieClean",
        description: `Professional seasonal house cleaning in ${data.suburb} ${data.postcode} — spring pollen removal, winter mould prevention, end-of-lease, and same-day service.`,
        url: base,
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
        openingHoursSpecification: [
          {
            "@type": "OpeningHoursSpecification",
            dayOfWeek: ["Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"],
            opens: "07:00",
            closes: "19:00",
          },
        ],
        aggregateRating: {
          "@type": "AggregateRating",
          ratingValue: data.rating,
          reviewCount: String(data.reviewCount),
          bestRating: "5",
        },
        hasOfferCatalog: {
          "@type": "OfferCatalog",
          name: `Cleaning Services in ${data.suburb}`,
          itemListElement: [
            {
              "@type": "Offer",
              itemOffered: {
                "@type": "Service",
                name: `2-Bedroom Deep Clean ${data.suburb}`,
                description: `Full pollen removal, window tracks, air vents, bathroom & kitchen sanitising for ${data.postcode} homes.`,
              },
              price: "179.00",
              priceCurrency: "AUD",
            },
            {
              "@type": "Offer",
              itemOffered: {
                "@type": "Service",
                name: `3–4 Bedroom Deep Clean ${data.suburb}`,
                description: `Extended deep clean for larger ${data.suburb} homes with extra bedrooms and living areas.`,
              },
              price: "249.00",
              priceCurrency: "AUD",
            },
            {
              "@type": "Offer",
              itemOffered: {
                "@type": "Service",
                name: `End-of-Lease Bond Clean ${data.suburb}`,
                description: `Bond-back guaranteed end-of-lease clean for ${data.postcode} rental properties.`,
              },
              price: "349.00",
              priceCurrency: "AUD",
            },
          ],
        },
      },

      /* ── FAQPage ────────────────────────────────────────── */
      {
        "@type": "FAQPage",
        "@id": `${url}/#faq`,
        name: `Frequently Asked Questions — Cleaning in ${data.suburb} ${data.postcode}`,
        isPartOf: { "@id": `${url}/#page` },
        speakable: {
          "@type": "SpeakableSpecification",
          cssSelector: [".faq-question", ".faq-answer"],
        },
        mainEntity: [
          {
            "@type": "Question",
            name: `What is seasonal cleaning and why do I need it in ${data.suburb} ${data.postcode}?`,
            acceptedAnswer: {
              "@type": "Answer",
              text: `Seasonal cleaning is a deep, weather-specific clean tailored to Australia's changing seasons. In ${data.suburb} we tackle spring pollen & dust, summer mould & allergens, autumn leaf buildup, and winter germ protection. Our local ${data.postcode} team uses hospital-grade, pet-safe products to keep your home fresh and healthy year-round.`,
            },
          },
          {
            "@type": "Question",
            name: `Do you offer spring cleaning services in ${data.suburb} ${data.postcode}?`,
            acceptedAnswer: {
              "@type": "Answer",
              text: `Yes! Our spring cleaning package includes pollen removal, window tracks, air vents, and upholstery sanitising — perfect for ${data.suburb} homes affected by high pollen counts. Same-day and next-day slots available across ${data.postcode}.`,
            },
          },
          {
            "@type": "Question",
            name: `How much does a seasonal deep clean cost in ${data.postcode}?`,
            acceptedAnswer: {
              "@type": "Answer",
              text: `Our seasonal cleans start at $179 for a 2-bedroom home in ${data.suburb} ${data.postcode}. Prices include all eco-friendly products and are fully customised. Get an instant online quote or call for a free ${data.suburb}-specific assessment.`,
            },
          },
          {
            "@type": "Question",
            name: `Is your cleaning service available across all ${data.suburb} postcodes?`,
            acceptedAnswer: {
              "@type": "Answer",
              text: `Absolutely. We cover every postcode in ${data.suburb} and surrounding suburbs (${data.neighbours.slice(0, 3).join(", ")} — postcodes ${data.neighbourPostcodes.slice(0, 3).join(", ")}). Same local cleaners who live in your suburb — never outsourced.`,
            },
          },
          {
            "@type": "Question",
            name: `Do you help with winter mould prevention in ${data.suburb}?`,
            acceptedAnswer: {
              "@type": "Answer",
              text: `Yes. Our winter mould & mildew deep clean targets bathrooms, laundry areas, and hidden damp spots common in ${data.suburb} homes during cooler months. We use anti-mould treatments that last up to 6 months.`,
            },
          },
          {
            "@type": "Question",
            name: `Are your cleaners police-checked and insured for ${data.postcode} homes?`,
            acceptedAnswer: {
              "@type": "Answer",
              text: `Every cleaner is police-checked, fully insured, and trained for Australian homes. You can relax knowing only trusted local ${data.suburb} professionals enter your property.`,
            },
          },
          {
            "@type": "Question",
            name: `How quickly can you book a seasonal clean in ${data.suburb} ${data.postcode}?`,
            acceptedAnswer: {
              "@type": "Answer",
              text: `Most ${data.suburb} customers book same-day or next-day service. Book online 24/7 or call our local team for instant availability.`,
            },
          },
          {
            "@type": "Question",
            name: `Do you offer a satisfaction guarantee on your cleaning in ${data.suburb} ${data.postcode}?`,
            acceptedAnswer: {
              "@type": "Answer",
              text: `100% Satisfaction Guarantee. If you're not happy within 48 hours, we return for a free re-clean — no questions asked. Our re-clean rate across ${data.suburb} is under 1%.`,
            },
          },
          {
            "@type": "Question",
            name: `Are your products safe for kids, pets, and allergy sufferers in ${data.suburb}?`,
            acceptedAnswer: {
              "@type": "Answer",
              text: `Yes — all products are Australian-made, eco-friendly, and certified child- & pet-safe. Ideal for ${data.suburb} families with asthma or allergies.`,
            },
          },
        ],
      },

      /* ── HowTo (Spring Cleaning Checklist) ─────────────── */
      {
        "@type": "HowTo",
        "@id": `${url}/#checklist`,
        name: `Spring Cleaning Checklist for ${data.suburb} ${data.postcode} Homes`,
        description: `Step-by-step guide to remove pollen, dust, and allergens from your ${data.suburb} home. Takes 2–4 hours depending on home size.`,
        totalTime: "PT3H",
        estimatedCost: { "@type": "MonetaryAmount", currency: "AUD", value: "0" },
        supply: ["Eco-friendly all-purpose cleaner", "Microfibre cloths", "Vacuum with HEPA filter", "Anti-mould treatment spray"],
        tool: ["Step ladder", "Mop and bucket", "Window squeegee", "HEPA vacuum"],
        step: [
          { "@type": "HowToStep", name: "Preparation", text: `Open all windows for ventilation. Remove clutter from surfaces. Gather supplies. ${data.suburb} spring days are ideal — aim for 18°C+ outside temperature.`, url: `${url}/#step-1` },
          { "@type": "HowToStep", name: "High Dusting & Pollen Traps", text: `Start at the ceiling: light fixtures, fans, blinds, and window tracks. Use microfibre cloths to trap pollen. ${data.pollensRisk} pollen risk in ${data.suburb} makes this step critical.`, url: `${url}/#step-2` },
          { "@type": "HowToStep", name: "Vacuum & Upholstery", text: "Vacuum carpets, sofas, and curtains with a HEPA filter vacuum. Spot-clean pet hair and surface allergens.", url: `${url}/#step-3` },
          { "@type": "HowToStep", name: "Kitchen Deep Clean", text: "Sanitise benchtops, oven, fridge seals, and splashbacks with eco-friendly spray.", url: `${url}/#step-4` },
          { "@type": "HowToStep", name: "Bathroom Mould Prevention", text: `Scrub showers, tiles, and grout. Apply anti-mould treatment that lasts 6 months — particularly important given ${data.suburb}'s ${data.mouldRisk.toLowerCase()} mould risk.`, url: `${url}/#step-5` },
          { "@type": "HowToStep", name: "Floors & Baseboards", text: `Mop hard floors and wipe skirting boards — ideal for ${data.suburb} dust levels.`, url: `${url}/#step-6` },
          { "@type": "HowToStep", name: "Windows & Air Vents", text: "Clean inside tracks and wipe vents to improve airflow during spring.", url: `${url}/#step-7` },
          { "@type": "HowToStep", name: "Final Air-Out & Inspection", text: `Let fresh air circulate for 30 minutes. Your ${data.postcode} home is now sparkling and healthy.`, url: `${url}/#step-8` },
        ],
      },
    ],
  };
}
