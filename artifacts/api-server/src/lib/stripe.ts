/**
 * Lazy Stripe singleton
 * ─────────────────────
 * Reuses the same Stripe instance (and its underlying HTTPS agent) across
 * all requests.  Importing the SDK is cached by Node's module system, but
 * constructing `new Stripe()` on every request wastes memory and doesn't
 * reuse keep-alive connections.
 *
 * Pattern: lazy init on first call, cached forever (key is immutable at
 * runtime; if it changes the process restarts anyway).
 */

import type { Stripe as StripeType } from "stripe";

let _stripe: StripeType | null = null;

/**
 * Returns the shared Stripe client, or null when STRIPE_SECRET_KEY is not
 * configured (dev / test environments where Stripe is optional).
 */
export async function getStripe(): Promise<StripeType | null> {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) return null;
  if (_stripe) return _stripe;

  const Stripe = (await import("stripe")).default;
  _stripe = new Stripe(key, { apiVersion: "2023-10-16" as never });
  return _stripe;
}
