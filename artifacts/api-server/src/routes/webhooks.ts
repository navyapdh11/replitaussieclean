import { Router, type IRouter, type Request, type Response } from "express";
import { eq, and, inArray } from "drizzle-orm";
import { db, bookingsTable } from "@workspace/db";
import { logger } from "../lib/logger";
import { webhookLimiter } from "../lib/ratelimit";
import { sendBookingConfirmation } from "../lib/email";
import { getStripe } from "../lib/stripe";

const router: IRouter = Router();

/** Statuses that indicate the booking is still "in-progress" and
 *  can safely be mutated by Stripe webhook events. Bookings that have
 *  been manually cancelled, completed, or refunded by an admin must
 *  never be overwritten by a late-arriving or replayed webhook. */
const MUTABLE_STATUSES = ["pending", "draft"] as const;

router.post(
  "/webhooks/stripe",
  webhookLimiter,
  async (req: Request, res: Response): Promise<void> => {
    const STRIPE_WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET;

    const stripe = await getStripe();

    // Always require the stripe-signature header, even in dev.
    // Without it there is no way to distinguish a real Stripe event from
    // a forged request — accept nothing that looks unsigned.
    const signature = req.headers["stripe-signature"] as string | undefined;
    if (!signature) {
      res.status(400).json({ error: "Missing stripe-signature header" });
      return;
    }

    // In production the webhook secret MUST be configured.
    if (!stripe || !STRIPE_WEBHOOK_SECRET) {
      if (process.env.NODE_ENV === "production") {
        logger.error("STRIPE_WEBHOOK_SECRET not configured in production — rejecting webhook");
        res.status(503).json({ error: "Payment provider not configured" });
      } else {
        // Development bypass: Stripe is not configured, log and ack.
        // The signature header was at least present (checked above).
        logger.warn("Stripe not configured (dev mode) — acknowledging webhook without verification");
        res.json({ received: true });
      }
      return;
    }

    let event: import("stripe").Stripe.Event;
    try {
      event = stripe.webhooks.constructEvent(
        (req as Request & { rawBody?: Buffer }).rawBody ?? Buffer.from(JSON.stringify(req.body)),
        signature,
        STRIPE_WEBHOOK_SECRET
      );
    } catch (err) {
      logger.error({ err }, "Stripe webhook signature verification failed");
      res.status(400).json({ error: "Webhook signature verification failed" });
      return;
    }

    try {
      switch (event.type) {
        case "checkout.session.completed": {
          const session = event.data.object;
          if (session.payment_status === "paid") {
            const bookingId = session.metadata?.bookingId;
            if (bookingId) {
              // CAS guard: only update if the booking is still pending/draft.
              // A late webhook must NOT overwrite a booking that was already
              // cancelled by an admin or completed through a different session.
              const [booking] = await db
                .update(bookingsTable)
                .set({
                  status:           "confirmed",
                  stripeSessionId:  session.id,
                  stripePaymentId:  session.payment_intent as string,
                })
                .where(
                  and(
                    eq(bookingsTable.id, bookingId),
                    inArray(bookingsTable.status, [...MUTABLE_STATUSES])
                  )
                )
                .returning();

              if (booking) {
                await sendBookingConfirmation({
                  email:             booking.email,
                  firstName:         booking.firstName,
                  bookingId:         booking.id,
                  serviceType:       booking.serviceType,
                  date:              booking.date,
                  timeSlot:          booking.timeSlot,
                  addressLine1:      booking.addressLine1,
                  suburb:            booking.suburb,
                  state:             booking.state,
                  quoteAmountCents:  booking.quoteAmountCents,
                  gstAmountCents:    booking.gstAmountCents,
                });
                logger.info({ bookingId }, "Booking confirmed via Stripe webhook");
              } else {
                logger.warn(
                  { bookingId },
                  "checkout.session.completed: booking not updated — already past mutable state or not found"
                );
              }
            }
          }
          break;
        }

        case "checkout.session.expired": {
          const session = event.data.object;
          const bookingId = session.metadata?.bookingId;
          if (bookingId) {
            // CAS guard: only cancel if still pending/draft.
            const [current] = await db
              .select({ status: bookingsTable.status })
              .from(bookingsTable)
              .where(eq(bookingsTable.id, bookingId))
              .limit(1);
            if (current && MUTABLE_STATUSES.includes(current.status as typeof MUTABLE_STATUSES[number])) {
              await db
                .update(bookingsTable)
                .set({ status: "cancelled" })
                .where(eq(bookingsTable.id, bookingId));
              logger.info({ bookingId }, "Booking cancelled — session expired");
            } else {
              logger.info(
                { bookingId, status: current?.status },
                "Skipping session.expired cancel — booking already past pending"
              );
            }
          }
          break;
        }

        case "payment_intent.payment_failed": {
          const paymentIntent = event.data.object;
          const bookingId     = paymentIntent.metadata?.bookingId;
          if (bookingId) {
            // Only revert to pending if still in a mutable state.
            const [current] = await db
              .select({ status: bookingsTable.status })
              .from(bookingsTable)
              .where(eq(bookingsTable.id, bookingId))
              .limit(1);
            if (current && MUTABLE_STATUSES.includes(current.status as typeof MUTABLE_STATUSES[number])) {
              await db
                .update(bookingsTable)
                .set({ status: "pending" })
                .where(eq(bookingsTable.id, bookingId));
              logger.info({ bookingId }, "Booking reverted to pending — payment failed");
            }
          }
          break;
        }

        default:
          logger.info({ eventType: event.type }, "Unhandled Stripe webhook");
      }

      res.json({ received: true });
    } catch (err) {
      logger.error({ err }, "Stripe webhook handler error");
      res.status(500).json({ error: "Webhook handler failed" });
    }
  }
);

export default router;
