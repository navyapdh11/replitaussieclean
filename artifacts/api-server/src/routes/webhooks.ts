import { Router, type IRouter, type Request, type Response } from "express";
import { eq } from "drizzle-orm";
import { db, bookingsTable } from "@workspace/db";
import { logger } from "../lib/logger";
import { webhookLimiter } from "../lib/ratelimit";
import { sendBookingConfirmation } from "../lib/email";

const router: IRouter = Router();

router.post(
  "/webhooks/stripe",
  webhookLimiter,
  async (req: Request, res: Response): Promise<void> => {
    const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY;
    const STRIPE_WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET;

    if (!STRIPE_SECRET_KEY || !STRIPE_WEBHOOK_SECRET) {
      logger.warn("Stripe not configured — skipping webhook verification");
      res.json({ received: true });
      return;
    }

    const signature = req.headers["stripe-signature"] as string;
    if (!signature) {
      res.status(400).json({ error: "Missing stripe-signature header" });
      return;
    }

    let event: any;
    try {
      const Stripe = (await import("stripe")).default;
      const stripe = new Stripe(STRIPE_SECRET_KEY, { apiVersion: "2023-10-16" as any });
      event = stripe.webhooks.constructEvent(
        (req as any).rawBody || JSON.stringify(req.body),
        signature,
        STRIPE_WEBHOOK_SECRET
      );
    } catch (err) {
      logger.error("Stripe webhook signature verification failed", { err });
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
              logger.info("Booking confirmed via Stripe webhook", { bookingId });
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
            logger.info("Booking cancelled — session expired", { bookingId });
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
            logger.info("Booking reverted to pending — payment failed", { bookingId });
          }
          break;
        }

        default:
          logger.info(`Unhandled Stripe webhook: ${event.type}`);
      }

      res.json({ received: true });
    } catch (err) {
      logger.error("Stripe webhook handler error", { err });
      res.status(500).json({ error: "Webhook handler failed" });
    }
  }
);

export default router;
