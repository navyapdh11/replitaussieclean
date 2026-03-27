import { useState } from "react";
import { Link } from "wouter";
import { format, parseISO } from "date-fns";
import { Calendar, MapPin, CheckCircle2, Truck, XCircle, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";
import { StatusBadge } from "./StatusBadge";
import { STATUS_TRANSITIONS, patchBookingStatus } from "./shared";

interface Props {
  bookings: any[];
  onRefresh: () => void;
}

export function DispatchPanel({ bookings, onRefresh }: Props) {
  const actionable = (bookings ?? []).filter((b) =>
    ["pending", "confirmed", "in_progress"].includes(b.status)
  );
  const [updating, setUpdating] = useState<string | null>(null);

  const dispatch = async (id: string, status: string) => {
    setUpdating(id);
    await patchBookingStatus(id, status);
    setUpdating(null);
    onRefresh();
  };

  if (actionable.length === 0) {
    return (
      <div className="text-center py-20 border border-dashed border-border rounded-2xl">
        <CheckCircle2 className="w-10 h-10 text-green-400 mx-auto mb-3" />
        <h3 className="font-semibold text-foreground mb-1">All clear!</h3>
        <p className="text-muted-foreground text-sm">No bookings pending dispatch or active jobs.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        {actionable.length} booking{actionable.length !== 1 ? "s" : ""} requiring action
      </p>

      <div className="grid gap-4">
        {actionable.map((b: any) => {
          const isUpdating = updating === b.id;
          const transitions = STATUS_TRANSITIONS[b.status] ?? [];

          return (
            <div key={b.id} className="bg-card border border-border rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3 mb-2">
                  <StatusBadge status={b.status} />
                  <span className="font-mono text-xs text-muted-foreground">#{b.id.slice(-6).toUpperCase()}</span>
                </div>
                <p className="font-semibold text-foreground">{b.firstName} {b.lastName}</p>
                <p className="text-xs text-muted-foreground">{b.email}</p>
                <div className="flex flex-wrap items-center gap-4 mt-2 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5" />
                    {format(parseISO(b.date), "EEE dd MMM")}
                  </span>
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5" />
                    {b.suburb}, {b.state}
                  </span>
                  <span className="capitalize">{b.serviceType.replace(/_/g, " ")}</span>
                </div>
              </div>

              <div className="flex items-center gap-2 flex-shrink-0 flex-wrap">
                <Link
                  to={`/bookings/${b.id}`}
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold border border-border hover:border-primary/40 text-muted-foreground transition-colors"
                >
                  View
                </Link>

                {transitions.map((next) => {
                  const isConfirm  = next === "confirmed";
                  const isProgress = next === "in_progress";
                  const isComplete = next === "completed";
                  const isCancel   = next === "cancelled";

                  return (
                    <button
                      key={next}
                      disabled={isUpdating}
                      onClick={() => dispatch(b.id, next)}
                      className={cn(
                        "px-3 py-1.5 rounded-lg text-xs font-semibold transition-all disabled:opacity-50 flex items-center gap-1.5 capitalize",
                        isConfirm  && "bg-green-500/10 text-green-400 border border-green-500/20 hover:bg-green-500/20",
                        isProgress && "bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 hover:bg-cyan-500/20",
                        isComplete && "bg-blue-500/10 text-blue-400 border border-blue-500/20 hover:bg-blue-500/20",
                        isCancel   && "bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20",
                      )}
                    >
                      {isUpdating ? (
                        <RefreshCw className="w-3 h-3 animate-spin" />
                      ) : isConfirm ? (
                        <CheckCircle2 className="w-3 h-3" />
                      ) : isProgress ? (
                        <Truck className="w-3 h-3" />
                      ) : isComplete ? (
                        <CheckCircle2 className="w-3 h-3" />
                      ) : (
                        <XCircle className="w-3 h-3" />
                      )}
                      {next.replace("_", " ")}
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
