import { useState, useEffect } from "react";
import { Play, UserCheck, XCircle, RefreshCw, CheckCircle2 } from "lucide-react";
import { BASE_URL } from "./shared";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

interface AssignmentRow {
  bookingId:        string;
  staffId:          string;
  staffName:        string;
  matchScore:       number;
  travelDistanceKm: number;
  travelTimeMin:    number;
}

interface OptimizeResult {
  assignments: AssignmentRow[];
  skipped:     string[];
  stats: { total: number; assigned: number; unassigned: number };
}

interface AssignmentRecord {
  assignment: {
    id: string; bookingId: string; staffId: string; status: string;
    matchScore: number; travelDistanceKm: number; travelTimeMin: number;
    assignedAt: string;
  };
  staff: { id: string; name: string; phone: string; rating: number; vehicleType: string } | null;
}

const TENANT_ID = "aussieclean-default";

export function SchedulingTab() {
  const { toast } = useToast();
  const [targetDate, setTargetDate] = useState(new Date().toISOString().slice(0, 10));
  const [running, setRunning]       = useState(false);
  const [result, setResult]         = useState<OptimizeResult | null>(null);
  const [allAssignments, setAllAssignments] = useState<AssignmentRecord[]>([]);
  const [loadingAll, setLoadingAll]         = useState(true);
  const [statusUpdating, setStatusUpdating] = useState<string | null>(null);

  const loadAssignments = async () => {
    setLoadingAll(true);
    try {
      const res = await fetch(`${BASE_URL}/api/scheduling/assignments?tenantId=${TENANT_ID}`);
      if (res.ok) {
        setAllAssignments(await res.json());
      } else {
        toast({ title: "Failed to load assignments", variant: "destructive" });
      }
    } catch {
      toast({ title: "Network error", variant: "destructive" });
    } finally {
      setLoadingAll(false);
    }
  };

  useEffect(() => { loadAssignments(); }, []);

  const runOptimization = async () => {
    setRunning(true);
    setResult(null);
    try {
      const res = await fetch(`${BASE_URL}/api/scheduling/optimize`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tenantId: TENANT_ID, date: targetDate }),
      });
      const data = await res.json();
      if (res.ok) {
        setResult(data as OptimizeResult);
        loadAssignments();
        const { stats } = data as OptimizeResult;
        if (stats.total === 0) {
          toast({ title: "No eligible bookings", description: `No confirmed/pending bookings found for ${targetDate}.` });
        } else if (stats.assigned === stats.total) {
          toast({ title: "All jobs assigned!", description: `${stats.assigned} of ${stats.total} bookings assigned.` });
        } else {
          toast({
            title: `${stats.assigned} of ${stats.total} assigned`,
            description: `${stats.unassigned} booking(s) could not be matched — no available staff with required skills.`,
            variant: "destructive",
          });
        }
      } else {
        toast({
          title: "Optimization failed",
          description: (data as { error?: string }).error ?? "An unexpected error occurred.",
          variant: "destructive",
        });
      }
    } catch {
      toast({ title: "Network error", description: "Could not reach the API server.", variant: "destructive" });
    } finally {
      setRunning(false);
    }
  };

  const removeAssignment = async (bookingId: string) => {
    try {
      const res = await fetch(`${BASE_URL}/api/scheduling/assign/${bookingId}`, { method: "DELETE" });
      if (res.ok || res.status === 204) {
        loadAssignments();
        toast({ title: "Assignment removed" });
      } else {
        toast({ title: "Failed to remove assignment", variant: "destructive" });
      }
    } catch {
      toast({ title: "Network error", variant: "destructive" });
    }
  };

  const updateStatus = async (assignmentId: string, status: string) => {
    setStatusUpdating(assignmentId);
    try {
      const res = await fetch(`${BASE_URL}/api/scheduling/assignments/${assignmentId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (res.ok) {
        loadAssignments();
      } else {
        const err = await res.json().catch(() => ({}));
        toast({ title: "Status update failed", description: (err as { error?: string }).error, variant: "destructive" });
      }
    } catch {
      toast({ title: "Network error", variant: "destructive" });
    } finally {
      setStatusUpdating(null);
    }
  };

  const scoreColor = (score: number) =>
    score >= 80 ? "text-emerald-400 bg-emerald-500/10" :
    score >= 60 ? "text-yellow-400 bg-yellow-500/10" :
    "text-red-400 bg-red-500/10";

  const statusBadge = (s: string) =>
    s === "assigned"    ? "bg-blue-500/15 text-blue-400" :
    s === "in_progress" ? "bg-yellow-500/15 text-yellow-400" :
    s === "completed"   ? "bg-emerald-500/15 text-emerald-400" :
    "bg-slate-700 text-slate-400";

  return (
    <div className="space-y-8">
      {/* Optimizer control */}
      <div className="border border-border bg-card rounded-2xl p-6 space-y-5">
        <div>
          <h2 className="text-xl font-bold flex items-center gap-2">
            <UserCheck className="w-5 h-5 text-primary" /> AI Scheduling Optimizer
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Automatically assign confirmed bookings to available staff using proximity + skills + workload scoring.
          </p>
        </div>

        <div className="flex flex-wrap gap-4 items-end">
          <div>
            <label className="block text-xs font-semibold mb-1 text-muted-foreground">Target Date</label>
            <input
              type="date" value={targetDate}
              onChange={(e) => setTargetDate(e.target.value)}
              className="rounded-lg border border-border bg-background px-3 py-2 text-sm"
            />
          </div>
          <button
            onClick={runOptimization} disabled={running}
            className="flex items-center gap-2 px-5 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-500 text-white text-sm font-semibold disabled:opacity-50 hover:opacity-90 transition-opacity"
          >
            <Play className="w-4 h-4" />
            {running ? "Optimizing…" : "Run Optimization"}
          </button>
          <button
            onClick={loadAssignments}
            className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" /> Refresh
          </button>
        </div>

        {/* Optimization result summary */}
        {result && (
          <div className="grid grid-cols-3 gap-4 pt-2">
            {[
              { label: "Total Jobs",  value: result.stats.total,      color: "text-foreground" },
              { label: "Assigned",   value: result.stats.assigned,   color: "text-emerald-400" },
              { label: "Unassigned", value: result.stats.unassigned, color: "text-orange-400" },
            ].map(({ label, value, color }) => (
              <div key={label} className="bg-muted/30 rounded-xl p-4">
                <p className="text-xs text-muted-foreground">{label}</p>
                <p className={cn("text-2xl font-extrabold", color)}>{value}</p>
              </div>
            ))}
          </div>
        )}

        {/* Just-optimized assignments */}
        {result && result.assignments.length > 0 && (
          <div>
            <p className="text-sm font-semibold mb-3 text-muted-foreground">New assignments from last run</p>
            <div className="rounded-xl border border-border overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-muted/30">
                  <tr>
                    <th className="text-left px-4 py-2.5 font-semibold">Booking</th>
                    <th className="text-left px-4 py-2.5 font-semibold">Staff</th>
                    <th className="text-right px-4 py-2.5 font-semibold">Score</th>
                    <th className="text-right px-4 py-2.5 font-semibold">Travel</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {result.assignments.map((a) => (
                    <tr key={a.bookingId} className="hover:bg-muted/20">
                      <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{a.bookingId.slice(0, 8)}…</td>
                      <td className="px-4 py-3 font-semibold">{a.staffName}</td>
                      <td className="px-4 py-3 text-right">
                        <span className={cn("px-2 py-0.5 rounded text-xs font-bold", scoreColor(a.matchScore))}>
                          {a.matchScore.toFixed(0)}%
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right text-muted-foreground text-xs">
                        {a.travelDistanceKm.toFixed(1)} km · {a.travelTimeMin} min
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* All assignments */}
      <div>
        <h3 className="text-lg font-bold mb-4">All Assignments ({allAssignments.length})</h3>
        {loadingAll ? (
          <div className="space-y-3">
            {[...Array(4)].map((_, i) => <div key={i} className="h-14 rounded-xl bg-muted/30 animate-pulse" />)}
          </div>
        ) : allAssignments.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground border border-border rounded-2xl">
            <CheckCircle2 className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <p className="font-semibold">No assignments yet</p>
            <p className="text-sm mt-1">Run the optimizer above to assign jobs to staff members.</p>
          </div>
        ) : (
          <div className="border border-border rounded-2xl overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-muted/30">
                <tr>
                  <th className="text-left px-4 py-3 font-semibold">Booking</th>
                  <th className="text-left px-4 py-3 font-semibold">Staff</th>
                  <th className="text-left px-4 py-3 font-semibold">Status</th>
                  <th className="text-right px-4 py-3 font-semibold">Score</th>
                  <th className="text-right px-4 py-3 font-semibold">Travel</th>
                  <th className="text-right px-4 py-3 font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {allAssignments.map(({ assignment: a, staff: s }) => (
                  <tr key={a.id} className="hover:bg-muted/10">
                    <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{a.bookingId.slice(0, 8)}…</td>
                    <td className="px-4 py-3">
                      <p className="font-semibold">{s?.name ?? "—"}</p>
                      {s?.phone && <p className="text-xs text-muted-foreground">{s.phone}</p>}
                    </td>
                    <td className="px-4 py-3">
                      <select
                        value={a.status}
                        disabled={statusUpdating === a.id || a.status === "completed" || a.status === "cancelled"}
                        onChange={(e) => updateStatus(a.id, e.target.value)}
                        className={cn(
                          "text-xs px-2 py-1 rounded-lg border border-border bg-background font-semibold cursor-pointer",
                          statusBadge(a.status),
                        )}
                      >
                        <option value="assigned">Assigned</option>
                        <option value="in_progress">In Progress</option>
                        <option value="completed">Completed</option>
                        <option value="cancelled">Cancelled</option>
                      </select>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span className={cn("px-2 py-0.5 rounded text-xs font-bold", scoreColor(a.matchScore))}>
                        {a.matchScore.toFixed(0)}%
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right text-xs text-muted-foreground">
                      {a.travelDistanceKm?.toFixed(1)} km
                    </td>
                    <td className="px-4 py-3 text-right">
                      {a.status !== "completed" && a.status !== "cancelled" && (
                        <button
                          onClick={() => removeAssignment(a.bookingId)}
                          className="text-muted-foreground hover:text-red-400 transition-colors"
                          title="Remove assignment"
                        >
                          <XCircle className="w-4 h-4" />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
