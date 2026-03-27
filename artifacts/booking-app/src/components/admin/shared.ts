export const BASE_URL = (import.meta.env.BASE_URL ?? "/booking-app").replace(/\/$/, "");

export const TENANT_ID = "aussieclean-default";

export const STATUS_ORDER = ["confirmed", "pending", "in_progress", "completed", "cancelled", "draft"];

export const STATUS_TRANSITIONS: Record<string, string[]> = {
  pending:     ["confirmed", "cancelled"],
  confirmed:   ["in_progress", "cancelled"],
  in_progress: ["completed", "cancelled"],
  completed:   [],
  cancelled:   ["pending"],
  draft:       ["pending", "cancelled"],
};

export async function patchBookingStatus(id: string, status: string): Promise<boolean> {
  try {
    const res = await fetch(`${BASE_URL}/api/bookings/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    return res.ok;
  } catch {
    return false;
  }
}
