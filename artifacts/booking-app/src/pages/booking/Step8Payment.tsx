import { motion } from "framer-motion";
import { useBookingStore } from "@/lib/store";
import { useCreateCheckoutSession } from "@/lib/api-client";
import { formatCurrency } from "@/lib/utils";
import { CreditCard, Loader2, ShieldCheck, RefreshCw, AlertCircle } from "lucide-react";

export function Step8Payment() {
  // Granular selectors prevent re-renders caused by unrelated state changes.
  const bookingId       = useBookingStore((s) => s.bookingId);
  const quoteAmountCents = useBookingStore((s) => s.quoteAmountCents);
  const gstAmountCents   = useBookingStore((s) => s.gstAmountCents);
  const email            = useBookingStore((s) => s.email);
  const serviceType      = useBookingStore((s) => s.serviceType);
  const extras           = useBookingStore((s) => s.extras);
  const suburb           = useBookingStore((s) => s.suburb);
  const frequency        = useBookingStore((s) => s.frequency);
  const tipAmountCents   = useBookingStore((s) => s.tipAmountCents ?? 0);
  const date             = useBookingStore((s) => s.date);

  const createSession = useCreateCheckoutSession();

  const baseTotal = (quoteAmountCents || 0) + (gstAmountCents || 0);
  const total     = baseTotal + tipAmountCents;

  const handlePay = () => {
    if (!bookingId || !quoteAmountCents || !email) return;

    createSession.mutate(
      {
        data: {
          bookingId,
          quoteAmountCents: total,
          customerEmail:    email,
          serviceDescription: `AussieClean: ${serviceType?.replace(/_/g, " ")}`,
          serviceType:      serviceType ?? undefined,
          extrasStr:        extras.join(","),
          suburb:           suburb ?? undefined,
          frequency:        (frequency ?? "once") as "once" | "fortnightly" | "weekly",
          tipAmountCents:   tipAmountCents > 0 ? tipAmountCents : undefined,
        },
      },
      {
        onSuccess: (res: { url: string }) => {
          window.location.href = res.url;
        },
      }
    );
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="space-y-8 text-center py-8"
    >
      <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto border border-primary/20">
        <CreditCard className="w-10 h-10 text-primary" />
      </div>

      <div>
        <h2 className="text-3xl font-extrabold text-foreground">Secure Payment</h2>
        <p className="text-muted-foreground mt-3 max-w-sm mx-auto">
          Your booking is reserved! Complete payment to confirm our cleaners for{" "}
          <strong className="text-foreground">{date}</strong>.
        </p>
      </div>

      {/* Amount card */}
      <div className="bg-card border border-border rounded-2xl p-6 max-w-sm mx-auto shadow-xl shadow-black/20 space-y-3">
        <p className="text-sm text-muted-foreground font-medium">Amount Due</p>
        <p className="font-display font-bold text-4xl text-primary">{formatCurrency(total)}</p>

        {tipAmountCents > 0 && (
          <div className="text-xs text-muted-foreground space-y-1 pt-2 border-t border-border/50">
            <div className="flex justify-between">
              <span>Service total (inc. GST)</span>
              <span>{formatCurrency(baseTotal)}</span>
            </div>
            <div className="flex justify-between text-yellow-400 font-medium">
              <span>💛 Cleaner tip</span>
              <span>+{formatCurrency(tipAmountCents)}</span>
            </div>
          </div>
        )}

        <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground font-medium bg-secondary p-2 rounded-lg">
          <ShieldCheck className="w-4 h-4 text-green-500" aria-hidden="true" />
          Powered securely by Stripe
        </div>
      </div>

      {/* Error state with retry */}
      {createSession.isError && (
        <div className="max-w-sm mx-auto space-y-3">
          <div className="flex items-center gap-3 p-4 bg-destructive/10 border border-destructive/20 rounded-xl text-destructive">
            <AlertCircle className="w-5 h-5 flex-shrink-0" aria-hidden="true" />
            <p className="text-sm font-medium text-left">
              Could not initiate payment. Please try again or contact support.
            </p>
          </div>
          <button
            onClick={handlePay}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold border border-border hover:border-primary/40 transition-colors"
          >
            <RefreshCw className="w-4 h-4" aria-hidden="true" /> Retry Payment
          </button>
        </div>
      )}

      {/* Primary CTA */}
      <div className="max-w-sm mx-auto">
        <button
          onClick={handlePay}
          disabled={createSession.isPending}
          aria-busy={createSession.isPending}
          className="w-full flex items-center justify-center gap-2 px-6 py-4 rounded-xl font-bold text-lg bg-gradient-to-r from-primary to-blue-500 text-primary-foreground shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/40 hover:-translate-y-0.5 transition-all disabled:opacity-50 disabled:transform-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
        >
          {createSession.isPending ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" aria-hidden="true" />
              Redirecting to Stripe…
            </>
          ) : (
            "Pay securely via Stripe"
          )}
        </button>
        <p className="text-xs text-muted-foreground mt-3">
          You will be redirected to Stripe's secure payment page. Card &amp; AU bank transfer accepted.
        </p>
      </div>
    </motion.div>
  );
}
