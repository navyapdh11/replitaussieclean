import { Router, type IRouter, type Request, type Response } from "express";
import { eq } from "drizzle-orm";
import { db, bookingsTable } from "@workspace/db";
import { logger } from "../lib/logger";
import { webhookLimiter } from "../lib/ratelimit";
import { sendBookingConfirmation } from "../lib/email";
import { getStripe } from "../lib/stripe";

const router: IRouter = Router();

router.post(
  "/webhooks/stripe",
  webhookLimiter,
  async (req: Request, res: Response): Promise<void> => {
    const STRIPE_WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET;

    const stripe = await getStripe();

    if (!stripe || !STRIPE_WEBHOOK_SECRET) {
      logger.warn("Stripe not configured — skipping webhook verification");
      res.json({ received: true });
      return;
    }

    const signature = req.headers["stripe-signature"] as string;
    if (!signature) {
      res.status(400).json({ error: "Missing stripe-signature header" });
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
              const [booking] = await db
                .update(bookingsTable)
                .set({
                  status: "confirmed",
                  stripeSessionId: session.id,
                  stripePaymentId: session.payment_intent as string,
                })
                .where(eq(bookingsTable.id, bookingId))
                .returning();

              if (booking) {
                await sendBookingConfirmation({
                  email: booking.email,
                  firstName: booking.firstName,
                  bookingId: booking.id,
                  serviceType: booking.serviceType,
                  date: booking.date,
                  timeSlot: booking.timeSlot,
                  addressLine1: booking.addressLine1,
                  suburb: booking.suburb,
                  state: booking.state,
                  quoteAmountCents: booking.quoteAmountCents,
                  gstAmountCents: booking.gstAmountCents,
                });
              }
              logger.info({ bookingId }, "Booking confirmed via Stripe webhook");
            }
          }
          break;
        }

        case "checkout.session.expired": {
          const session = event.data.object;
          const bookingId = session.metadata?.bookingId;
          if (bookingId) {
            await db
              .update(bookingsTable)
              .set({ status: "cancelled" })
              .where(eq(bookingsTable.id, bookingId));
            logger.info({ bookingId }, "Booking cancelled — session expired");
          }
          break;
        }

        case "payment_intent.payment_failed": {
          const paymentIntent = event.data.object;
          const bookingId = paymentIntent.metadata?.bookingId;
          if (bookingId) {
            await db
              .update(bookingsTable)
              .set({ status: "pending" })
              .where(eq(bookingsTable.id, bookingId));
            logger.info({ bookingId }, "Booking reverted to pending — payment failed");
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
