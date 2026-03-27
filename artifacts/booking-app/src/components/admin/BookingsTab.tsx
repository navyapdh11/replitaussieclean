import { Link } from "wouter";
import { format, parseISO } from "date-fns";
import { Search, Calendar, MapPin, CircleDollarSign, RefreshCw, ExternalLink } from "lucide-react";
import { formatCurrency, cn } from "@/lib/utils";
import { StatusBadge } from "./StatusBadge";
import { QuickStatusSelect } from "./QuickStatusSelect";
import { STATUS_ORDER } from "./shared";

interface Props {
  searchEmail: string;
  setSearchEmail: (v: string) => void;
  appliedEmail: string;
  setAppliedEmail: (v: string) => void;
  statusFilter: string;
  setStatusFilter: (v: string) => void;
  filtered: any[];
  stats: { total: number };
  isLoading: boolean;
  isError: boolean;
  bookings: any[];
  onRefresh: () => void;
}

export function BookingsTab({
  searchEmail, setSearchEmail,
  appliedEmail, setAppliedEmail,
  statusFilter, setStatusFilter,
  filtered, stats, isLoading, isError, bookings, onRefresh,
}: Props) {
  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <form
          onSubmit={(e) => { e.preventDefault(); setAppliedEmail(searchEmail.trim()); }}
          className="flex flex-1 max-w-md gap-3"
        >
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="email"
              placeholder="Filter by customer email…"
              value={searchEmail}
              aria-label="Search by email"
              onChange={(e) => { setSearchEmail(e.target.value); if (!e.target.value) setAppliedEmail(""); }}
              className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-border bg-background focus:outline-none focus:border-primary text-sm"
            />
          </div>
          <button type="submit" className="px-4 py-2.5 rounded-xl font-semibold bg-primary text-primary-foreground text-sm hover:shadow-lg hover:shadow-primary/20 transition-all">
            Search
          </button>
        </form>

        <div className="flex gap-2 flex-wrap">
          {["all", ...STATUS_ORDER].map((s) => (
            <button key={s} onClick={() => setStatusFilter(s)}
              className={cn("px-3 py-1.5 rounded-xl text-xs font-semibold border transition-colors capitalize",
                statusFilter === s ? "bg-primary text-primary-foreground border-primary" : "border-border text-muted-foreground hover:border-primary/40",
              )}>
              {s}
            </button>
          ))}
        </div>
      </div>

      {isLoading && (
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-14 rounded-xl bg-slate-800/50 animate-pulse" />
          ))}
        </div>
      )}

      {isError && (
        <div className="text-center py-12 bg-red-500/5 border border-red-500/20 rounded-2xl">
          <p className="text-red-400">Failed to load bookings. Try again.</p>
        </div>
      )}

      {!isLoading && bookings && (
        <>
          <p className="text-sm text-muted-foreground">
            Showing {filtered.length} of {stats.total} booking{stats.total !== 1 ? "s" : ""}
            {appliedEmail ? ` for ${appliedEmail}` : ""}
          </p>

          {filtered.length === 0 ? (
            <div className="text-center py-16 border border-dashed border-border rounded-2xl">
              <p className="text-muted-foreground">No bookings match the current filter.</p>
            </div>
          ) : (
            <div className="overflow-hidden rounded-2xl border border-border">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border bg-slate-900/60">
                      {["Ref", "Customer", "Service", "Date", "Address", "Amount", "Status", ""].map((h) => (
                        <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider whitespace-nowrap">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {filtered.map((b: any) => (
                      <tr key={b.id} className="hover:bg-slate-900/40 transition-colors">
                        <td className="px-4 py-3 font-mono text-xs text-muted-foreground">#{b.id.slice(-6).toUpperCase()}</td>
                        <td className="px-4 py-3">
                          <p className="font-medium text-foreground">{b.firstName} {b.lastName}</p>
                          <p className="text-xs text-muted-foreground">{b.email}</p>
                        </td>
                        <td className="px-4 py-3 capitalize text-foreground">{b.serviceType.replace(/_/g, " ")}</td>
                        <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3.5 h-3.5" />
                            {format(parseISO(b.date), "dd MMM yyyy")}
                          </span>
                          <span className="text-xs">{b.timeSlot}</span>
                        </td>
                        <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">
                          <span className="flex items-center gap-1">
                            <MapPin className="w-3.5 h-3.5" />
                            {b.suburb}, {b.state}
                          </span>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <span className="flex items-center gap-1 font-semibold text-foreground">
                            <CircleDollarSign className="w-3.5 h-3.5 text-muted-foreground" />
                            {formatCurrency(b.quoteAmountCents + b.gstAmountCents)}
                          </span>
                        </td>
                        <td className="px-4 py-3"><StatusBadge status={b.status} /></td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <Link to={`/bookings/${b.id}`} className="inline-flex items-center gap-1 text-xs text-cyan-400 hover:text-cyan-300 transition-colors whitespace-nowrap">
                              View <ExternalLink className="w-3 h-3" />
                            </Link>
                            <QuickStatusSelect bookingId={b.id} current={b.status} onDone={onRefresh} />
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
