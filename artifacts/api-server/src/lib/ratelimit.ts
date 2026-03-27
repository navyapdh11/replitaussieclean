import rateLimit from "express-rate-limit";

/** Applied to ALL /api routes as a baseline DoS guard */
export const generalLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 120,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many requests. Please slow down.", code: "RATE_LIMIT_EXCEEDED" },
});

/** Quote / pricing endpoints — moderate throughput */
export const quoteLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many quote requests. Please try again later.", code: "RATE_LIMIT_EXCEEDED" },
});

/** Booking creation — strict to prevent spam */
export const bookingLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many booking requests. Please try again later.", code: "RATE_LIMIT_EXCEEDED" },
});

/** Admin dashboard routes — moderate, authenticated in production */
export const adminLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 60,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Admin rate limit exceeded. Please slow down.", code: "RATE_LIMIT_EXCEEDED" },
});

/** AI chat endpoints */
export const chatLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many chat requests. Please slow down.", code: "RATE_LIMIT_EXCEEDED" },
});

/** Stripe webhooks — generous, Stripe retries */
export const webhookLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Rate limit exceeded.", code: "RATE_LIMIT_EXCEEDED" },
});
