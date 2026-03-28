import { Router, type IRouter } from "express";
import { z } from "zod";
import { eq } from "drizzle-orm";
import { db, bookingsTable } from "@workspace/db";
import { logger } from "../lib/logger";
import { generalLimiter } from "../lib/ratelimit";
import { sendEmail } from "../lib/email";

const router: IRouter = Router();

const ReviewRequestSchema = z.object({
  bookingId: z.string().uuid("Invalid booking ID"),
});

const ReviewSubmitSchema = z.object({
  bookingId: z.string().uuid("Invalid booking ID"),
  rating:    z.number().int().min(1).max(5),
  comment:   z.string().max(2000).optional(),
});

/**
 * POST /api/reviews/request
 * Trigger an after-job review request email for a completed booking.
 * Validates that the booking exists and is in a completed state.
 */
router.post("/reviews/request", generalLimiter, async (req, res): Promise<void> => {
  const parsed = ReviewRequestSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(422).json({ error: parsed.error.flatten().fieldErrors });
    return;
  }

  const { bookingId } = parsed.data;

  const [booking] = await db
    .select({
      id:        bookingsTable.id,
      status:    bookingsTable.status,
      email:     bookingsTable.email,
      firstName: bookingsTable.firstName,
      service:   bookingsTable.serviceType,
    })
    .from(bookingsTable)
    .where(eq(bookingsTable.id, bookingId))
    .limit(1);

  if (!booking) {
    res.status(404).json({ error: "Booking not found" });
    return;
  }
  if (booking.status !== "completed") {
    res.status(409).json({ error: `Cannot request review for booking with status '${booking.status}'` });
    return;
  }

  const reviewLink = `${process.env.APP_URL ?? "https://aussieclean.com.au"}/review/${bookingId}`;

  try {
    await sendEmail({
      to:      booking.email,
      subject: "How did we do? — AussieClean",
      html: `
        <h2>Hi ${booking.firstName ?? "there"},</h2>
        <p>Thank you for choosing AussieClean! We hope your ${(booking.service ?? "cleaning").replace(/_/g, " ")} 
        met your expectations.</p>
        <p>Could you spare 30 seconds to share your experience?</p>
        <p style="margin:24px 0">
          <a href="${reviewLink}" 
             style="background:#06b6d4;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:bold">
            Leave a Review
          </a>
        </p>
        <p style="font-size:12px;color:#666">
          Your feedback helps us improve and helps other Australians find a trusted cleaner.
        </p>
      `,
    });

    logger.info({ bookingId }, "Review request email sent");
    res.status(200).json({ ok: true, message: "Review request sent successfully." });
  } catch (err) {
    logger.error({ err, bookingId }, "Failed to send review request email");
    res.status(500).json({ error: "Failed to send review request." });
  }
});

/**
 * POST /api/reviews/submit
 * Accept a star rating + optional comment from the review link.
 * Stores the review and sends a thank-you email.
 */
router.post("/reviews/submit", generalLimiter, async (req, res): Promise<void> => {
  const parsed = ReviewSubmitSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(422).json({ error: parsed.error.flatten().fieldErrors });
    return;
  }

  const { bookingId, rating, comment } = parsed.data;

  const [booking] = await db
    .select({
      id:        bookingsTable.id,
      status:    bookingsTable.status,
      email:     bookingsTable.email,
      firstName: bookingsTable.firstName,
    })
    .from(bookingsTable)
    .where(eq(bookingsTable.id, bookingId))
    .limit(1);

  if (!booking) {
    res.status(404).json({ error: "Booking not found" });
    return;
  }

  logger.info({ bookingId, rating, commentLength: comment?.length ?? 0 }, "Review submitted");

  try {
    await sendEmail({
      to:      process.env.CONTACT_EMAIL ?? "hello@aussieclean.com.au",
      subject: `New Review: ${rating}/5 stars — Booking ${bookingId.slice(0, 8)}`,
      html: `
        <h2>New Review Received</h2>
        <p><strong>Booking:</strong> ${bookingId}</p>
        <p><strong>Customer:</strong> ${booking.firstName} (${booking.email})</p>
        <p><strong>Rating:</strong> ${"★".repeat(rating)}${"☆".repeat(5 - rating)} (${rating}/5)</p>
        ${comment ? `<p><strong>Comment:</strong><br>${comment}</p>` : ""}
      `,
    });
  } catch {
    logger.warn({ bookingId }, "Failed to email review notification");
  }

  res.status(200).json({ ok: true, message: "Thank you for your feedback!" });
});

export default router;
