import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useBookingStore } from "@/lib/store";
import { useGetQuote, useCreateBooking } from "@workspace/api-client-react";
import { formatCurrency } from "@/lib/utils";
import { Loader2, AlertCircle, FileText } from "lucide-react";

export function Step7Review() {
  const store = useBookingStore();
  
  const getQuote = useGetQuote();
  const createBooking = useCreateBooking();
  
  const [quoteData, setQuoteData] = useState<Record<string, any> | null>(null);

  useEffect(() => {
    getQuote.mutate({
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
      }
    }, {
      onSuccess: (data: Record<string, any>) => setQuoteData(data)
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleConfirm = () => {
    if (!quoteData) return;
    
    createBooking.mutate({
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
      }
    }, {
      onSuccess: (res: Record<string, any>) => {
        store.updateData({ 
          bookingId: res.id, 
          quoteAmountCents: quoteData.quoteAmountCents,
          gstAmountCents: quoteData.gstAmountCents
        });
        store.nextStep();
      }
    });
  };

  return (
    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <FileText className="w-6 h-6 text-primary" /> Review & Quote
        </h2>
        <p className="text-muted-foreground mt-2">Please review your booking details and dynamic quote.</p>
      </div>

      <div className="bg-card border border-border rounded-2xl p-6 space-y-6 shadow-sm">
        <div className="grid sm:grid-cols-2 gap-6">
          <div>
            <p className="text-sm text-muted-foreground font-medium mb-1">Service</p>
            <p className="font-semibold text-foreground capitalize">{store.serviceType?.replace('_', ' ')}</p>
            <p className="text-sm text-muted-foreground mt-1">
              {store.propertyType} • {store.bedrooms} Bed • {store.bathrooms} Bath
            </p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground font-medium mb-1">Schedule</p>
            <p className="font-semibold text-foreground">{store.date}</p>
            <p className="text-sm text-muted-foreground mt-1">Arrival Window: {store.timeSlot}</p>
          </div>
          <div className="sm:col-span-2">
            <p className="text-sm text-muted-foreground font-medium mb-1">Location</p>
            <p className="font-medium text-foreground">
              {store.addressLine1} {store.addressLine2 ? `, ${store.addressLine2}` : ''}<br/>
              {store.suburb}, {store.state} {store.postcode}
            </p>
          </div>
        </div>

        {store.extras.length > 0 && (
          <div className="pt-4 border-t border-border/50">
            <p className="text-sm text-muted-foreground font-medium mb-2">Extras Included</p>
            <div className="flex flex-wrap gap-2">
              {store.extras.map(e => (
                <span key={e} className="px-3 py-1 bg-secondary text-secondary-foreground text-xs font-semibold rounded-full capitalize">
                  {e}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="bg-gradient-to-br from-primary/5 to-transparent border border-primary/20 rounded-2xl p-6">
        <h3 className="font-bold text-lg text-foreground mb-4">Pricing Breakdown</h3>
        
        {getQuote.isPending ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-8 h-8 text-primary animate-spin" />
          </div>
        ) : getQuote.isError ? (
          <div className="flex items-center gap-3 text-destructive p-4 bg-destructive/10 rounded-lg">
            <AlertCircle className="w-5 h-5" />
            <p className="text-sm font-medium">Failed to calculate quote. Please go back and check your details.</p>
          </div>
        ) : quoteData ? (
          <div className="space-y-3">
            <div className="flex justify-between text-muted-foreground text-sm font-medium">
              <span>Base Rate</span>
              <span>{formatCurrency(quoteData.breakdown.base)}</span>
            </div>
            {quoteData.breakdown.extras > 0 && (
              <div className="flex justify-between text-muted-foreground text-sm font-medium">
                <span>Extras</span>
                <span>{formatCurrency(quoteData.breakdown.extras)}</span>
              </div>
            )}
            {quoteData.breakdown.demand > 0 && (
              <div className="flex justify-between text-orange-400 text-sm font-medium">
                <span>High Demand Premium</span>
                <span>+{formatCurrency(quoteData.breakdown.demand)}</span>
              </div>
            )}
            {quoteData.breakdown.timeSlot > 0 && (
              <div className="flex justify-between text-blue-400 text-sm font-medium">
                <span>Time Slot Premium</span>
                <span>+{formatCurrency(quoteData.breakdown.timeSlot)}</span>
              </div>
            )}
            <div className="flex justify-between text-muted-foreground text-sm font-medium pt-3 border-t border-border/50">
              <span>Subtotal</span>
              <span>{formatCurrency(quoteData.quoteAmountCents)}</span>
            </div>
            <div className="flex justify-between text-muted-foreground text-sm font-medium">
              <span>GST (10%)</span>
              <span>{formatCurrency(quoteData.gstAmountCents)}</span>
            </div>
            <div className="flex justify-between items-center pt-3 border-t border-primary/20">
              <span className="font-bold text-foreground">Total Due</span>
              <span className="font-display font-extrabold text-2xl text-primary">{formatCurrency(quoteData.totalAmountCents)}</span>
            </div>
          </div>
        ) : null}
      </div>

      {createBooking.isError && (
        <p className="text-destructive text-sm font-medium">Failed to create booking. Please try again.</p>
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
          disabled={!quoteData || createBooking.isPending}
          className="flex-1 flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-bold bg-primary text-primary-foreground hover:shadow-lg hover:shadow-primary/20 hover:-translate-y-0.5 transition-all disabled:opacity-50 disabled:transform-none"
        >
          {createBooking.isPending ? <><Loader2 className="w-5 h-5 animate-spin" /> Confirming...</> : "Confirm Booking"}
        </button>
      </div>
    </motion.div>
  );
}
