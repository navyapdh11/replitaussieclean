import { cn } from "@/lib/utils";

const STYLES: Record<string, string> = {
  pending:     "bg-yellow-500/10 text-yellow-500 border-yellow-500/20",
  confirmed:   "bg-green-500/10 text-green-500 border-green-500/20",
  in_progress: "bg-cyan-500/10 text-cyan-400 border-cyan-500/20",
  completed:   "bg-blue-500/10 text-blue-400 border-blue-500/20",
  cancelled:   "bg-red-500/10 text-red-400 border-red-500/20",
  draft:       "bg-slate-500/10 text-slate-400 border-slate-500/20",
};

export function StatusBadge({ status }: { status: string }) {
  return (
    <span className={cn(
      "px-2 py-0.5 text-xs font-bold rounded-full border uppercase tracking-wider",
      STYLES[status] ?? STYLES.draft,
    )}>
      {status.replace("_", " ")}
    </span>
  );
}
