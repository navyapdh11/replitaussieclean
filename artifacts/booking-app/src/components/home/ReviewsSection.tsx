import { Star, Quote } from "lucide-react";

const REVIEWS = [
  {
    name: "Sarah M.",
    suburb: "Mosman, NSW",
    rating: 5,
    date: "March 2026",
    text: "Absolutely blown away. The spring clean was thorough, professional, and the team were incredibly respectful of our home. My toddler's allergy symptoms improved noticeably within 48 hours. AussieClean is the only cleaner I'll ever use.",
    service: "Spring Deep Clean",
  },
  {
    name: "James K.",
    suburb: "South Yarra, VIC",
    rating: 5,
    date: "February 2026",
    text: "Used them for an end-of-lease bond clean in South Yarra — got every dollar of our bond back first try. The checklist they followed was incredibly detailed. Worth every cent and the team arrived right on time.",
    service: "End of Lease Clean",
  },
  {
    name: "Priya T.",
    suburb: "New Farm, QLD",
    rating: 5,
    date: "January 2026",
    text: "Booked a same-day clean with 3 hours notice and they arrived within the window, no issues. Our office is now spotless. The eco-friendly products were a big selling point — no chemical smells lingering. Will be setting up a monthly plan.",
    service: "Office Clean",
  },
  {
    name: "David W.",
    suburb: "Subiaco, WA",
    rating: 5,
    date: "March 2026",
    text: "The winter mould treatment they applied to our bathroom three months ago is still holding up. Haven't seen a single spot of mould return. Truly professional work from a local team who knows Western Australian homes.",
    service: "Winter Mould Treatment",
  },
  {
    name: "Emma L.",
    suburb: "Norwood, SA",
    rating: 5,
    date: "February 2026",
    text: "We have three cats and finding a cleaning service that uses truly pet-safe products was a struggle — until AussieClean. The cleaners were gentle, efficient, and our cats didn't even stress. Highly recommend to any pet owner.",
    service: "Standard Home Clean",
  },
  {
    name: "Michael C.",
    suburb: "Manly, NSW",
    rating: 5,
    date: "January 2026",
    text: "Set up a fortnightly plan and the consistency is unreal — same cleaner every time, knows exactly how we like things. The 15% discount on the recurring plan is genuinely good value. Best decision we've made for our home.",
    service: "Fortnightly Recurring",
  },
] as const;

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex gap-0.5" aria-label={`${rating} out of 5 stars`}>
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          aria-hidden="true"
          className={`w-4 h-4 ${i < rating ? "fill-amber-400 text-amber-400" : "text-muted-foreground/30"}`}
        />
      ))}
    </div>
  );
}

export function ReviewsSection() {
  return (
    <section
      id="reviews"
      aria-label="Customer reviews and testimonials"
      className="py-20 bg-card border-y border-border/50 scroll-mt-24"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">

        {/* Heading */}
        <div className="text-center space-y-3">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-amber-400/10 border border-amber-400/20 text-amber-400 text-sm font-semibold">
            <Star className="w-4 h-4 fill-amber-400" aria-hidden="true" />
            <span>4.9 average from 2,847 verified reviews</span>
          </div>
          <h2 className="text-3xl md:text-5xl font-extrabold">
            What our customers say
          </h2>
          <p className="text-muted-foreground max-w-xl mx-auto">
            Trusted by families and businesses across Australia — from Sydney to Perth.
          </p>
        </div>

        {/* Review grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {REVIEWS.map((review, i) => (
            <article
              key={i}
              aria-label={`Review by ${review.name} from ${review.suburb}`}
              className="relative bg-background rounded-2xl border border-border p-6 flex flex-col gap-4 hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5 transition-all duration-300"
            >
              <Quote
                className="w-8 h-8 text-primary/20 absolute top-4 right-4"
                aria-hidden="true"
              />
              <StarRating rating={review.rating} />
              <p className="text-sm text-muted-foreground leading-relaxed flex-1">
                "{review.text}"
              </p>
              <div className="border-t border-border/50 pt-4">
                <p className="text-sm font-semibold text-foreground">{review.name}</p>
                <p className="text-xs text-muted-foreground">{review.suburb}</p>
                <div className="flex items-center justify-between mt-1">
                  <span className="text-xs text-primary font-medium">{review.service}</span>
                  <span className="text-xs text-muted-foreground">{review.date}</span>
                </div>
              </div>
            </article>
          ))}
        </div>

        {/* Aggregate stats strip */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 pt-4">
          {[
            { stat: "2,847",   label: "Verified Reviews" },
            { stat: "4.9 / 5", label: "Average Rating"   },
            { stat: "< 1%",    label: "Re-clean Rate"    },
            { stat: "48 hrs",  label: "Guarantee Window" },
          ].map(({ stat, label }) => (
            <div key={label} className="text-center">
              <p className="text-2xl font-extrabold text-primary">{stat}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{label}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
