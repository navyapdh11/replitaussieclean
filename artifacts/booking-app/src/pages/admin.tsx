import { useState } from "react";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { useListBookings } from "@workspace/api-client-react";
import { formatCurrency, cn } from "@/lib/utils";
import { format, parseISO } from "date-fns";
import {
  Search,
  MapPin,
  Calendar,
  CircleDollarSign,
  RefreshCw,
  Users,
  TrendingUp,
  ClipboardList,
} from "lucide-react";

const STATUS_ORDER = ["confirmed", "pending", "in_progress", "completed", "cancelled", "draft"];

export default function AdminDashboard() {
  const [searchEmail, setSearchEmail] = useState("");
  const [appliedEmail, setAppliedEmail] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const { data: bookings, isLoading, isError, refetch } = useListBookings(
    appliedEmail ? { email: appliedEmail } : {},
    { query: { retry: false } as any }
  );

  const filtered = (bookings as any[])?.filter(
    (b) => statusFilter === "all" || b.status === statusFilter
  ) ?? [];

  const stats = {
    total: (bookings as any[])?.length ?? 0,
    confirmed: (bookings as any[])?.filter((b) => b.status === "confirmed").length ?? 0,
    pending: (bookings as any[])?.filter((b) => b.status === "pending").length ?? 0,
    revenue: (bookings as any[])?.reduce((s, b) => s + (b.quoteAmountCents ?? 0) + (b.gstAmountCents ?? 0), 0) ?? 0,
  };

  return (
    <div className="min-h-screen flex flex-col pt-20">
      <Navbar />

      <main className="flex-1 py-10 px-4 sm:px-6 max-w-7xl mx-auto w-full space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-extrabold text-foreground">Admin Dashboard</h1>
            <p className="text-muted-foreground mt-1">Manage all bookings and operations.</p>
          </div>
          <button
            onClick={() => refetch()}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold border border-border hover:border-primary/50 transition-colors"
          >
            <RefreshCw className="w-4 h-4" /> Refresh
          </button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: "Total Bookings", value: stats.total, icon: ClipboardList, color: "text-cyan-400" },
            { label: "Confirmed", value: stats.confirmed, icon: Users, color: "text-green-400" },
            { label: "Pending", value: stats.pending, icon: Calendar, color: "text-yellow-400" },
            { label: "Total Revenue", value: formatCurrency(stats.revenue), icon: TrendingUp, color: "text-blue-400" },
          ].map(({ label, value, icon: Icon, color }) => (
            <div key={label} className="bg-card border border-border rounded-2xl p-5">
              <div className={`flex items-center gap-2 ${color} mb-2`}>
                <Icon className="w-5 h-5" />
                <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{label}</span>
              </div>
              <p className="text-2xl font-extrabold text-foreground">{value}</p>
            </div>
          ))}
        </div>

        <div className="flex flex-col sm:flex-row gap-4">
          <form
            onSubmit={(e) => { e.preventDefault(); setAppliedEmail(searchEmail.trim()); }}
            className="flex flex-1 max-w-md gap-3"
          >
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="email"
                placeholder="Filter by customer email..."
                value={searchEmail}
                onChange={(e) => { setSearchEmail(e.target.value); if (!e.target.value) setAppliedEmail(""); }}
                className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-border bg-background focus:outline-none focus:border-primary text-sm"
              />
            </div>
            <button
              type="submit"
              className="px-4 py-2.5 rounded-xl font-semibold bg-primary text-primary-foreground text-sm hover:shadow-lg hover:shadow-primary/20 transition-all"
            >
              Search
            </button>
          </form>

          <div className="flex gap-2 flex-wrap">
            {["all", ...STATUS_ORDER].map((s) => (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                className={cn(
                  "px-3 py-1.5 rounded-xl text-xs font-semibold border transition-colors capitalize",
                  statusFilter === s
                    ? "bg-primary text-primary-foreground border-primary"
                    : "border-border text-muted-foreground hover:border-primary/40"
                )}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        {isLoading && (
          <div className="flex items-center justify-center py-16">
            <RefreshCw className="w-6 h-6 text-muted-foreground animate-spin" />
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
            </p>
            {filtered.length === 0 ? (
              <div className="text-center py-16 border border-dashed border-border rounded-2xl">
                <p className="text-muted-foreground">No bookings match the current filter.</p>
              </div>
            ) : (
              <div className="overflow-hidden rounded-2xl border border-border">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border bg-slate-900/60">
                      {["Ref", "Customer", "Service", "Date", "Address", "Amount", "Status"].map((h) => (
                        <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {filtered.map((b: any) => (
                      <tr key={b.id} className="hover:bg-slate-900/40 transition-colors">
                        <td className="px-4 py-3 font-mono text-xs text-muted-foreground">
                          #{b.id.slice(-6).toUpperCase()}
                        </td>
                        <td className="px-4 py-3">
                          <p className="font-medium text-foreground">{b.firstName} {b.lastName}</p>
                          <p className="text-xs text-muted-foreground">{b.email}</p>
                        </td>
                        <td className="px-4 py-3 capitalize text-foreground">
                          {b.serviceType.replace(/_/g, " ")}
                        </td>
                        <td className="px-4 py-3 text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3.5 h-3.5" />
                            {format(parseISO(b.date), "dd MMM yyyy")}
                          </span>
                          <span className="text-xs">{b.timeSlot}</span>
                        </td>
                        <td className="px-4 py-3 text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <MapPin className="w-3.5 h-3.5" />
                            {b.suburb}, {b.state}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className="flex items-center gap-1 font-semibold text-foreground">
                            <CircleDollarSign className="w-3.5 h-3.5 text-muted-foreground" />
                            {formatCurrency(b.quoteAmountCents + b.gstAmountCents)}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <StatusBadge status={b.status} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
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
    in_progress: "bg-cyan-500/10 text-cyan-400 border-cyan-500/20",
    completed: "bg-blue-500/10 text-blue-400 border-blue-500/20",
    cancelled: "bg-red-500/10 text-red-400 border-red-500/20",
    draft: "bg-slate-500/10 text-slate-400 border-slate-500/20",
  };

  return (
    <span className={cn("px-2 py-0.5 text-xs font-bold rounded-full border uppercase tracking-wider", styles[status] ?? styles.draft)}>
      {status.replace("_", " ")}
    </span>
  );
}
