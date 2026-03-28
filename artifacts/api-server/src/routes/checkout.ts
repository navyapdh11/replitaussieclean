import { Router, type IRouter } from "express";
import {
  CreateCheckoutSessionBody,
  CreateCheckoutSessionResponse,
} from "@workspace/api-zod";
import { logger } from "../lib/logger";
import { getStripe } from "../lib/stripe";

const router: IRouter = Router();

router.post("/checkout/session", async (req, res): Promise<void> => {
  const parsed = CreateCheckoutSessionBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Validation failed", details: parsed.error.errors });
    return;
  }

  const { quoteAmountCents, bookingId, customerEmail, serviceDescription } = parsed.data;

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
      payment_method_types: ["card"],
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
      metadata: { bookingId },
      success_url: `${appUrl}/booking/success?session_id={CHECKOUT_SESSION_ID}&booking_id=${bookingId}`,
      cancel_url: `${appUrl}/booking/cancelled?booking_id=${bookingId}`,
    });

    res.json(
      CreateCheckoutSessionResponse.parse({
        sessionId: session.id,
        url: session.url!,
      })
    );
  } catch (err) {
    logger.error({ err, bookingId }, "Stripe checkout session creation failed");
    res.status(502).json({ error: "Payment provider error. Please try again." });
  }
});

export default router;
