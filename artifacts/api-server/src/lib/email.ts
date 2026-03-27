import { Resend } from "resend";
import { logger } from "./logger";

const resend = process.env.RESEND_API_KEY
  ? new Resend(process.env.RESEND_API_KEY)
  : null;

function formatCurrency(cents: number): string {
  return new Intl.NumberFormat("en-AU", {
    style: "currency",
    currency: "AUD",
  }).format(cents / 100);
}

/** Escape user-supplied strings before injecting into HTML */
function escHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export async function sendBookingConfirmation({
  email,
  firstName,
  bookingId,
  serviceType,
  date,
  timeSlot,
  addressLine1,
  suburb,
  state,
  quoteAmountCents,
  gstAmountCents,
}: {
  email: string;
  firstName: string;
  bookingId: string;
  serviceType: string;
  date: string;
  timeSlot: string;
  addressLine1: string;
  suburb: string;
  state: string;
  quoteAmountCents: number;
  gstAmountCents: number;
}) {
  if (!resend) {
    logger.warn("RESEND_API_KEY not set — skipping email notification");
    return;
  }

  const totalCents = quoteAmountCents + gstAmountCents;
  const serviceName = serviceType.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
  const shortId = bookingId.slice(-8).toUpperCase();

  const safeFirstName = escHtml(firstName);
  const safeServiceName = escHtml(serviceName);
  const safeAddressLine1 = escHtml(addressLine1);
  const safeSuburb = escHtml(suburb);
  const safeState = escHtml(state);
  const safeDate = escHtml(date);
  const safeTimeSlot = escHtml(timeSlot);
  const safeShortId = escHtml(shortId);

  try {
    await resend.emails.send({
      from: "AussieClean <bookings@aussieclean.com.au>",
      to: email,
      subject: `Booking Confirmed – #${safeShortId}`,
      html: `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"/></head>
<body style="font-family:sans-serif;background:#0f172a;color:#f1f5f9;padding:24px;margin:0;">
  <div style="max-width:560px;margin:0 auto;">
    <div style="background:linear-gradient(135deg,#0891b2,#1d4ed8);border-radius:16px;padding:32px;text-align:center;margin-bottom:24px;">
      <h1 style="margin:0;font-size:28px;font-weight:900;color:#fff;">Booking Confirmed! 🎉</h1>
      <p style="margin:8px 0 0;color:#bae6fd;font-size:15px;">Reference #${safeShortId}</p>
    </div>
    <p style="color:#cbd5e1;">Hi ${safeFirstName}, your AussieClean booking is confirmed. Here are the details:</p>
    <div style="background:#1e293b;border-radius:12px;padding:24px;margin:16px 0;">
      <table style="width:100%;border-collapse:collapse;color:#f1f5f9;">
        <tr><td style="padding:8px 0;color:#94a3b8;">Service</td><td style="padding:8px 0;font-weight:600;">${safeServiceName}</td></tr>
        <tr><td style="padding:8px 0;color:#94a3b8;">Date</td><td style="padding:8px 0;font-weight:600;">${safeDate}</td></tr>
        <tr><td style="padding:8px 0;color:#94a3b8;">Time</td><td style="padding:8px 0;font-weight:600;">${safeTimeSlot}</td></tr>
        <tr><td style="padding:8px 0;color:#94a3b8;">Address</td><td style="padding:8px 0;font-weight:600;">${safeAddressLine1}, ${safeSuburb} ${safeState}</td></tr>
        <tr><td style="padding:8px 0;color:#94a3b8;">Subtotal</td><td style="padding:8px 0;">${formatCurrency(quoteAmountCents)}</td></tr>
        <tr><td style="padding:8px 0;color:#94a3b8;">GST (10%)</td><td style="padding:8px 0;">${formatCurrency(gstAmountCents)}</td></tr>
        <tr style="border-top:1px solid #334155;">
          <td style="padding:12px 0 0;font-weight:700;">Total Paid</td>
          <td style="padding:12px 0 0;font-weight:900;font-size:20px;color:#22d3ee;">${formatCurrency(totalCents)}</td>
        </tr>
      </table>
    </div>
    <p style="color:#64748b;font-size:13px;text-align:center;">
      Questions? Call 1300 CLEAN AU (1300 253 262) or reply to this email.<br/>
      AussieClean Pty Ltd | ABN 12 345 678 901
    </p>
  </div>
</body>
</html>
      `.trim(),
    });
    logger.info({ bookingId, email }, "Booking confirmation email sent");
  } catch (err) {
    logger.error({ err, bookingId }, "Failed to send booking confirmation email");
  }
}
