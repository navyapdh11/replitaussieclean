import { useEffect, useState, useCallback } from "react";
import { motion } from "framer-motion";
import { useBookingStore } from "@/lib/store";
import { useGetQuote, useCreateBooking } from "@workspace/api-client-react";
import { formatCurrency } from "@/lib/utils";
import { Loader2, AlertCircle, FileText, Clock, RefreshCw, ShieldCheck } from "lucide-react";

interface QuoteBreakdown {
  base: number;
  extras: number;
  demand: number;
  weather: number;
  traffic: number;
  staffAvailability: number;
  timeSlot: number;
}

interface QuoteData {
  quoteAmountCents: number;
  gstAmountCents: number;
  totalAmountCents: number;
  dynamicMultiplier: number;
  breakdown: QuoteBreakdown;
  factorsApplied: Record<string, number>;
  validUntil: string;
  currency: string;
}

function useCountdown(validUntil: string | null): { minutes: number; seconds: number; expired: boolean } {
  const [remaining, setRemaining] = useState(0);

  useEffect(() => {
    if (!validUntil) return;
    const target = new Date(validUntil).getTime();
    const tick = () => setRemaining(Math.max(0, target - Date.now()));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [validUntil]);

  const minutes = Math.floor(remaining / 60000);
  const seconds = Math.floor((remaining % 60000) / 1000);
  return { minutes, seconds, expired: remaining === 0 && validUntil !== null };
}

export function Step7Review() {
  const store = useBookingStore();

  const getQuote = useGetQuote();
  const createBooking = useCreateBooking();

  const [quoteData, setQuoteData] = useState<QuoteData | null>(null);

  const fetchQuote = useCallback(() => {
    getQuote.mutate(
      {
        data: {
          serviceType: store.serviceType as any,
          propertyType: store.propertyType as any,
          bedrooms: store.bedrooms || 1,
          bathrooms: store.bathrooms || 1,
          extras: store.extras,
          suburb: store.suburb,
          state: store.state,
          date: store.date,
          timeSlot: store.timeSlot,
        },
      },
      { onSuccess: (data: any) => setQuoteData(data as QuoteData) },
    );
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { fetchQuote(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const { minutes, seconds, expired } = useCountdown(quoteData?.validUntil ?? null);

  // Auto-refresh the quote when the 15-minute window expires
  useEffect(() => {
    if (expired && quoteData) {
      setQuoteData(null);
      fetchQuote();
    }
  }, [expired]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleConfirm = () => {
    if (!quoteData) return;
    createBooking.mutate(
      {
        data: {
          serviceType: store.serviceType as any,
          propertyType: store.propertyType as any,
          bedrooms: store.bedrooms || 1,
          bathrooms: store.bathrooms || 1,
          extras: store.extras,
          date: store.date!,
          timeSlot: store.timeSlot!,
          addressLine1: store.addressLine1!,
          addressLine2: store.addressLine2,
          suburb: store.suburb!,
          state: store.state!,
          postcode: store.postcode!,
          firstName: store.firstName!,
          lastName: store.lastName!,
          email: store.email!,
          phone: store.phone!,
          notes: store.notes,
          quoteAmountCents: quoteData.quoteAmountCents,
          gstAmountCents: quoteData.gstAmountCents,
        },
      },
      {
        onSuccess: (res: any) => {
          store.updateData({
            bookingId: res.id,
            quoteAmountCents: quoteData.quoteAmountCents,
            gstAmountCents: quoteData.gstAmountCents,
          });
          store.nextStep();
        },
      },
    );
  };

  const isUrgent = quoteData && minutes === 0 && seconds <= 60;

  return (
    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <FileText className="w-6 h-6 text-primary" /> Review & Quote
        </h2>
        <p className="text-muted-foreground mt-2">Please review your booking details and dynamic quote.</p>
      </div>

      {/* Booking summary card */}
      <div className="bg-card border border-border rounded-2xl p-6 space-y-6 shadow-sm">
        <div className="grid sm:grid-cols-2 gap-6">
          <div>
            <p className="text-sm text-muted-foreground font-medium mb-1">Service</p>
            <p className="font-semibold text-foreground capitalize">{store.serviceType?.replace(/_/g, " ")}</p>
            <p className="text-sm text-muted-foreground mt-1">
              {store.propertyType} · {store.bedrooms} Bed · {store.bathrooms} Bath
            </p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground font-medium mb-1">Schedule</p>
            <p className="font-semibold text-foreground">{store.date}</p>
            <p className="text-sm text-muted-foreground mt-1">Arrival window: {store.timeSlot}</p>
          </div>
          <div className="sm:col-span-2">
            <p className="text-sm text-muted-foreground font-medium mb-1">Location</p>
            <p className="font-medium text-foreground">
              {store.addressLine1}{store.addressLine2 ? `, ${store.addressLine2}` : ""}<br />
              {store.suburb}, {store.state} {store.postcode}
            </p>
          </div>
        </div>

        {store.extras.length > 0 && (
          <div className="pt-4 border-t border-border/50">
            <p className="text-sm text-muted-foreground font-medium mb-2">Extras Included</p>
            <div className="flex flex-wrap gap-2">
              {store.extras.map((e) => (
                <span key={e} className="px-3 py-1 bg-secondary text-secondary-foreground text-xs font-semibold rounded-full capitalize">
                  {e}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Pricing breakdown */}
      <div className="bg-gradient-to-br from-primary/5 to-transparent border border-primary/20 rounded-2xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-lg text-foreground">Pricing Breakdown</h3>
          {quoteData && (
            <div className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full border ${
              isUrgent
                ? "bg-red-500/10 border-red-500/30 text-red-400"
                : "bg-slate-800/50 border-border text-muted-foreground"
            }`}>
              <Clock className="w-3.5 h-3.5" />
              {expired
                ? "Refreshing…"
                : `Locked ${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`}
            </div>
          )}
        </div>

        {getQuote.isPending ? (
          <div className="flex items-center justify-center py-8 gap-3 text-muted-foreground">
            <Loader2 className="w-6 h-6 text-primary animate-spin" />
            <span className="text-sm">Calculating your dynamic quote…</span>
          </div>
        ) : getQuote.isError ? (
          <div className="space-y-3">
            <div className="flex items-center gap-3 text-destructive p-4 bg-destructive/10 rounded-lg">
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              <p className="text-sm font-medium">Failed to calculate quote. Please check your details.</p>
            </div>
            <button
              onClick={fetchQuote}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold border border-border hover:border-primary/40 transition-colors"
            >
              <RefreshCw className="w-4 h-4" /> Retry
            </button>
          </div>
        ) : quoteData ? (
          <div className="space-y-3">
            <PriceRow label="Base Rate" value={quoteData.breakdown.base} />
            {quoteData.breakdown.extras > 0 && (
              <PriceRow label="Extras" value={quoteData.breakdown.extras} />
            )}
            {quoteData.breakdown.demand > 0 && (
              <PriceRow label="⚡ High Demand" value={quoteData.breakdown.demand} color="text-orange-400" prefix="+" />
            )}
            {quoteData.breakdown.weather > 0 && (
              <PriceRow label="🌦️ Weather Surcharge" value={quoteData.breakdown.weather} color="text-sky-400" prefix="+" />
            )}
            {quoteData.breakdown.traffic > 0 && (
              <PriceRow label="🚗 Traffic / Weekend" value={quoteData.breakdown.traffic} color="text-yellow-400" prefix="+" />
            )}
            {quoteData.breakdown.staffAvailability > 0 && (
              <PriceRow label="👥 Limited Availability" value={quoteData.breakdown.staffAvailability} color="text-rose-400" prefix="+" />
            )}
            {quoteData.breakdown.timeSlot > 0 && (
              <PriceRow label="🌙 Time Slot Premium" value={quoteData.breakdown.timeSlot} color="text-blue-400" prefix="+" />
            )}

            <div className="pt-3 border-t border-border/50 space-y-2">
              <PriceRow label="Subtotal" value={quoteData.quoteAmountCents} muted />
              <PriceRow label="GST (10%)" value={quoteData.gstAmountCents} muted />
            </div>

            <div className="flex justify-between items-center pt-3 border-t border-primary/20">
              <span className="font-bold text-foreground text-lg">Total Due</span>
              <span className="font-display font-extrabold text-3xl text-primary">
                {formatCurrency(quoteData.totalAmountCents)}
              </span>
            </div>

            {quoteData.dynamicMultiplier > 1.02 && (
              <p className="text-xs text-muted-foreground text-right">
                Dynamic rate: {quoteData.dynamicMultiplier.toFixed(2)}× applied
              </p>
            )}
          </div>
        ) : null}
      </div>

      {/* Trust signal */}
      <div className="flex items-start gap-3 p-4 bg-slate-900/50 border border-border rounded-xl">
        <ShieldCheck className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
        <p className="text-xs text-muted-foreground leading-relaxed">
          Your price is locked for 15 minutes. Dynamic pricing ensures fair, real-time rates based on demand, weather,
          and availability. You only pay what is shown here — no hidden fees.
        </p>
      </div>

      {createBooking.isError && (
        <p className="text-destructive text-sm font-medium flex items-center gap-2">
          <AlertCircle className="w-4 h-4" /> Failed to create booking. Please try again.
        </p>
      )}

      <div className="flex gap-4 pt-6 border-t border-border/50">
        <button
          onClick={store.prevStep}
          disabled={createBooking.isPending}
          className="px-6 py-3 rounded-xl font-semibold border border-border hover:bg-secondary transition-colors disabled:opacity-50"
        >
          Back
        </button>
        <button
          onClick={handleConfirm}
          disabled={!quoteData || createBooking.isPending || expired}
          className="flex-1 flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-bold bg-primary text-primary-foreground hover:shadow-lg hover:shadow-primary/20 hover:-translate-y-0.5 transition-all disabled:opacity-50 disabled:transform-none"
        >
          {createBooking.isPending ? (
            <><Loader2 className="w-5 h-5 animate-spin" /> Confirming…</>
          ) : (
            "Confirm Booking"
          )}
        </button>
      </div>
    </motion.div>
  );
}

function PriceRow({
  label,
  value,
  color,
  prefix,
  muted,
}: {
  label: string;
  value: number;
  color?: string;
  prefix?: string;
  muted?: boolean;
}) {
  return (
    <div className={`flex justify-between text-sm font-medium ${color ?? (muted ? "text-muted-foreground" : "text-foreground")}`}>
      <span>{label}</span>
      <span>{prefix}{formatCurrency(value)}</span>
    </div>
  );
}
