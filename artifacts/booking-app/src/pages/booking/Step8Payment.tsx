import { motion } from "framer-motion";
import { useBookingStore } from "@/lib/store";
import { useCreateCheckoutSession } from "@workspace/api-client-react";
import { formatCurrency } from "@/lib/utils";
import { CreditCard, Loader2, ShieldCheck } from "lucide-react";

export function Step8Payment() {
  const store = useBookingStore();
  const createSession = useCreateCheckoutSession();

  const tip = store.tipAmountCents ?? 0;
  const baseTotal = (store.quoteAmountCents || 0) + (store.gstAmountCents || 0);
  const total = baseTotal + tip;

  const handlePay = () => {
    if (!store.bookingId || !store.quoteAmountCents || !store.email) return;

    createSession.mutate({
      data: {
        bookingId: store.bookingId,
        quoteAmountCents: total,
        customerEmail: store.email,
        serviceDescription: `AussieClean: ${store.serviceType?.replace(/_/g, " ")}`,
        serviceType: store.serviceType,
        extrasStr: store.extras.join(","),
        suburb: store.suburb,
        frequency: (store.frequency ?? "once") as "once" | "fortnightly" | "weekly",
        tipAmountCents: tip,
      }
    }, {
      onSuccess: (res: { url: string }) => {
        window.location.href = res.url;
      }
    });
  };

  return (
    <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="space-y-8 text-center py-8">
      <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto border border-primary/20">
        <CreditCard className="w-10 h-10 text-primary" />
      </div>

      <div>
        <h2 className="text-3xl font-extrabold text-foreground">Secure Payment</h2>
        <p className="text-muted-foreground mt-3 max-w-sm mx-auto">
          Your booking is reserved! Complete payment to confirm our cleaners for {store.date}.
        </p>
      </div>

      <div className="bg-card border border-border rounded-2xl p-6 max-w-sm mx-auto shadow-xl shadow-black/20 space-y-3">
        <p className="text-sm text-muted-foreground font-medium">Amount Due</p>
        <p className="font-display font-bold text-4xl text-primary">{formatCurrency(total)}</p>
        {tip > 0 && (
          <div className="text-xs text-muted-foreground space-y-1 pt-2 border-t border-border/50">
            <div className="flex justify-between">
              <span>Service total (inc. GST)</span>
              <span>{formatCurrency(baseTotal)}</span>
            </div>
            <div className="flex justify-between text-yellow-400 font-medium">
              <span>💛 Cleaner tip</span>
              <span>+{formatCurrency(tip)}</span>
            </div>
          </div>
        )}
        <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground font-medium bg-secondary p-2 rounded-lg">
          <ShieldCheck className="w-4 h-4 text-green-500" />
          Powered securely by Stripe
        </div>
      </div>

      {createSession.isError && (
        <p className="text-destructive text-sm font-medium">Could not initiate payment session. Please try again.</p>
      )}

      <div className="max-w-sm mx-auto">
        <button 
          onClick={handlePay}
          disabled={createSession.isPending}
          className="w-full flex items-center justify-center gap-2 px-6 py-4 rounded-xl font-bold text-lg bg-gradient-to-r from-primary to-blue-500 text-primary-foreground shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/40 hover:-translate-y-0.5 transition-all disabled:opacity-50 disabled:transform-none"
        >
          {createSession.isPending ? <><Loader2 className="w-5 h-5 animate-spin" /> Redirecting...</> : "Pay securely via Stripe"}
        </button>
      </div>
    </motion.div>
  );
}
