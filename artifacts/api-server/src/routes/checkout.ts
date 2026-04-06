import { Router, type IRouter } from "express";
import type { z } from "zod";
import {
  CreateCheckoutSessionBody,
  CreateCheckoutSessionResponse,
} from "@workspace/api-zod";
import { logger } from "../lib/logger";
import { getStripe } from "../lib/stripe";

const router: IRouter = Router();

type CheckoutBody = z.infer<typeof CreateCheckoutSessionBody>;

router.post("/checkout/session", async (req, res): Promise<void> => {
  const parsed = CreateCheckoutSessionBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Validation failed", details: parsed.error.errors });
    return;
  }

  const data: CheckoutBody = parsed.data;
  const {
    quoteAmountCents, bookingId, customerEmail, serviceDescription,
    serviceType, extrasStr, suburb, frequency, tipAmountCents,
  } = data;

  const stripe = await getStripe();

  if (!stripe) {
    logger.warn("STRIPE_SECRET_KEY not configured — returning mock checkout URL");
    const appUrl = process.env.APP_URL || "http://localhost:3000";
    res.json(
      CreateCheckoutSessionResponse.parse({
        sessionId: `mock_${bookingId}`,
        url: `${appUrl}/booking/success?session_id=mock_${bookingId}&booking_id=${bookingId}`,
      })
    );
    return;
  }

  const appUrl = process.env.APP_URL ?? "http://localhost:3000";

  try {
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      // Stripe v21: use explicit payment_method_types instead of
      // automatic_payment_methods which only applies to PaymentIntents.
      // au_becs_debit covers Australian bank transfer (BECS Direct Debit).
      payment_method_types: ["card", "au_becs_debit"],
      customer_email: customerEmail,
      line_items: [
        {
          price_data: {
            currency: "aud",
            product_data: {
              name: serviceDescription ?? "Cleaning Service Booking",
            },
            unit_amount: quoteAmountCents,
          },
          quantity: 1,
        },
      ],
      metadata: {
        bookingId,
        ...(serviceType       && { serviceType }),
        ...(extrasStr         && { extras: extrasStr }),
        ...(suburb            && { suburb }),
        ...(frequency         && { frequency }),
        ...(tipAmountCents    && { tipAmountCents: String(tipAmountCents) }),
      },
      success_url: `${appUrl}/booking/success?session_id={CHECKOUT_SESSION_ID}&booking_id=${bookingId}`,
      cancel_url:  `${appUrl}/booking/cancelled?booking_id=${bookingId}`,
    });

    if (!session.url) {
      logger.error({ bookingId }, "Stripe returned no checkout URL");
      res.status(502).json({ error: "Payment provider returned no checkout URL. Please try again." });
      return;
    }

    res.json(
      CreateCheckoutSessionResponse.parse({
        sessionId: session.id,
        url:       session.url,
      })
    );
  } catch (err) {
    logger.error({ err, bookingId }, "Stripe checkout session creation failed");
    res.status(502).json({ error: "Payment provider error. Please try again." });
  }
});

export default router;
