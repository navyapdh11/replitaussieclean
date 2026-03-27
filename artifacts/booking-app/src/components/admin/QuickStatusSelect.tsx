import { useState } from "react";
import { STATUS_TRANSITIONS, patchBookingStatus } from "./shared";

interface Props {
  bookingId: string;
  current: string;
  onDone: () => void;
}

export function QuickStatusSelect({ bookingId, current, onDone }: Props) {
  const [busy, setBusy] = useState(false);
  const next = STATUS_TRANSITIONS[current] ?? [];
  if (next.length === 0) return null;

  const handleChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    if (!val) return;
    setBusy(true);
    await patchBookingStatus(bookingId, val);
    setBusy(false);
    onDone();
  };

  return (
    <select
      onChange={handleChange}
      defaultValue=""
      disabled={busy}
      aria-label="Change booking status"
      className="text-xs rounded-lg border border-border bg-background px-2 py-1 text-muted-foreground hover:border-primary/40 transition-colors cursor-pointer focus:outline-none disabled:opacity-50"
    >
      <option value="" disabled>Move to…</option>
      {next.map((s) => (
        <option key={s} value={s}>{s.replace("_", " ")}</option>
      ))}
    </select>
  );
}
