import { useState, useMemo } from "react";
import { Link } from "wouter";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { useListBookings, type Booking } from "@/lib/api-client";
import { formatCurrency, cn } from "@/lib/utils";
import { format, parseISO } from "date-fns";
import { Search, MapPin, Calendar, CircleDollarSign } from "lucide-react";

export default function Dashboard() {
  const [email, setEmail] = useState("");
  const [searchedEmail, setSearchedEmail] = useState("");

  const { data: bookings, isLoading, isError } = useListBookings(
    searchedEmail ? { email: searchedEmail } : undefined,
  );

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (email.trim()) {
      setSearchedEmail(email.trim());
    }
  };

  // Safely typed bookings list (React Query returns Booking[] | undefined)
  const bookingList = useMemo<Booking[]>(
    () => (Array.isArray(bookings) ? bookings : []),
    [bookings],
  );

  return (
    <div className="min-h-screen flex flex-col pt-20">
      <Navbar />

      <main className="flex-1 py-12 px-4 sm:px-6 max-w-7xl mx-auto w-full space-y-8">
        <div>
          <h1 className="text-3xl font-extrabold text-foreground">Client Portal</h1>
          <p className="text-muted-foreground mt-2">View your past and upcoming bookings.</p>
        </div>

        <form onSubmit={handleSearch} className="bg-card border border-border p-6 rounded-2xl flex flex-col sm:flex-row gap-4 max-w-xl">
          <div className="flex-1">
            <label htmlFor="dashboard-email" className="sr-only">Email Address</label>
            <input
              id="dashboard-email"
              type="email"
              placeholder="Enter your booking email..."
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              className="w-full p-3.5 rounded-xl border border-border bg-background focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
            />
          </div>
          <button
            type="submit"
            className="flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl font-bold bg-primary text-primary-foreground hover:shadow-lg hover:shadow-primary/20 transition-all"
          >
            <Search className="w-4 h-4" /> Find Bookings
          </button>
        </form>

        {isLoading && (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="bg-card border border-border rounded-2xl p-6 animate-pulse">
                <div className="h-6 w-20 bg-muted rounded mb-3" />
                <div className="h-5 w-32 bg-muted rounded mb-2" />
                <div className="h-4 w-40 bg-muted rounded mt-3" />
                <div className="h-4 w-24 bg-muted rounded mt-2" />
              </div>
            ))}
          </div>
        )}
        {isError && <p className="text-destructive font-medium">Could not fetch bookings. Please try again.</p>}

        {searchedEmail && bookingList.length > 0 && (
          <div className="space-y-6">
            <h2 className="text-xl font-bold border-b border-border/50 pb-2">Results for {searchedEmail}</h2>

            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {bookingList.map((b: Booking) => (
                <Link key={b.id} href={`/bookings/${b.id}`} className="block">
                  <div className="bg-card border border-border hover:border-primary/50 transition-colors rounded-2xl p-6 flex flex-col cursor-pointer">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <StatusBadge status={b.status} />
                        <h3 className="font-bold text-foreground mt-3 capitalize">{b.serviceType.replace(/_/g, " ")}</h3>
                      </div>
                      <span className="text-xs text-muted-foreground font-mono bg-secondary px-2 py-1 rounded-md">
                        #{b.id.slice(-6).toUpperCase()}
                      </span>
                    </div>

                    <div className="space-y-3 flex-1">
                      <p className="text-sm text-muted-foreground flex items-center gap-2">
                        <Calendar className="w-4 h-4" />
                        {format(parseISO(b.date), "MMMM do, yyyy")} • {b.timeSlot}
                      </p>
                      <p className="text-sm text-muted-foreground flex items-center gap-2">
                        <MapPin className="w-4 h-4" />
                        {b.suburb}, {b.state}
                      </p>
                      <p className="text-sm text-muted-foreground flex items-center gap-2">
                        <CircleDollarSign className="w-4 h-4" />
                        {formatCurrency(b.quoteAmountCents + b.gstAmountCents)}
                      </p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {searchedEmail && !isLoading && bookingList.length === 0 && (
          <div className="text-center py-12 bg-card/50 rounded-2xl border border-border border-dashed">
            <p className="text-muted-foreground">No bookings found for this email address.</p>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    pending: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20",
    confirmed: "bg-green-500/10 text-green-500 border-green-500/20",
    completed: "bg-blue-500/10 text-blue-500 border-blue-500/20",
    cancelled: "bg-red-500/10 text-red-500 border-red-500/20",
    draft: "bg-slate-500/10 text-slate-400 border-slate-500/20",
  };

  return (
    <span className={cn("px-2.5 py-1 text-xs font-bold rounded-full border uppercase tracking-wider", styles[status] || styles.draft)}>
      {status}
    </span>
  );
}
