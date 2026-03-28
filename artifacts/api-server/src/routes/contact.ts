import { Router, type IRouter } from "express";
import { z } from "zod";
import { logger } from "../lib/logger";
import { generalLimiter } from "../lib/ratelimit";
import { sendEmail } from "../lib/email";

const router: IRouter = Router();

/** Australian phone: mobile 04XX XXX XXX, 1300/1800, or STD 0X XXXX XXXX */
const AU_PHONE_RE = /^(?:\+?61|0)(?:4\d{8}|[23578]\d{8}|1(?:300|800)\d{6})$/;

const ContactSchema = z.object({
  name:        z.string().min(2, "Name must be at least 2 characters").max(100),
  email:       z.string().email("Invalid email address"),
  phone:       z.string()
               .transform(v => v.replace(/[\s\-().+]/g, ""))
               .refine(v => v === "" || AU_PHONE_RE.test(v), {
                 message: "Enter a valid Australian phone number (e.g. 0412 345 678)",
               })
               .optional(),
  serviceType: z.string().max(60).optional(),
  suburb:      z.string().max(80).optional(),
  message:     z.string().min(10, "Message must be at least 10 characters").max(2000),
  /** Honeypot field — must remain empty */
  website:     z.string().max(0, "Spam detected").optional(),
});

/**
 * POST /api/contact
 * General contact / enquiry form submission.
 * Rate-limited; honeypot anti-spam; server-side AU validation.
 */
router.post("/contact", generalLimiter, async (req, res): Promise<void> => {
  const parsed = ContactSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(422).json({
      error: "Validation failed",
      details: parsed.error.flatten().fieldErrors,
    });
    return;
  }

  const { name, email, phone, serviceType, suburb, message } = parsed.data;

  try {
    await sendEmail({
      to:      process.env.CONTACT_EMAIL ?? "hello@aussieclean.com.au",
      subject: `New Contact Enquiry from ${name}`,
      html: `
        <h2>New Enquiry — AussieClean</h2>
        <table cellpadding="6" style="font-family:sans-serif;font-size:14px">
          <tr><th align="left">Name</th><td>${name}</td></tr>
          <tr><th align="left">Email</th><td>${email}</td></tr>
          ${phone ? `<tr><th align="left">Phone</th><td>${phone}</td></tr>` : ""}
          ${serviceType ? `<tr><th align="left">Service</th><td>${serviceType}</td></tr>` : ""}
          ${suburb ? `<tr><th align="left">Suburb</th><td>${suburb}</td></tr>` : ""}
          <tr><th align="left" valign="top">Message</th><td style="white-space:pre-wrap">${message}</td></tr>
        </table>
      `,
    });

    logger.info({ name, email, serviceType, suburb }, "Contact enquiry received");
    res.status(200).json({ ok: true, message: "Enquiry received. We will be in touch within 1 business day." });
  } catch (err) {
    logger.error({ err }, "Failed to send contact enquiry email");
    res.status(500).json({ error: "Failed to submit enquiry. Please call us directly." });
  }
});

export default router;
