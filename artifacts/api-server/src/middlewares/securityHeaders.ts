import { type Request, type Response, type NextFunction } from "express";

/**
 * Enterprise-grade security response headers.
 * Prevents clickjacking, MIME-sniffing, and XSS reflection attacks.
 */
export function securityHeaders(_req: Request, res: Response, next: NextFunction): void {
  // Prevent MIME type sniffing
  res.setHeader("X-Content-Type-Options", "nosniff");

  // Deny iframe embedding (clickjacking protection)
  res.setHeader("X-Frame-Options", "DENY");

  // Legacy XSS filter for old browsers
  res.setHeader("X-XSS-Protection", "1; mode=block");

  // Control referrer information
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");

  // Disable browser features that aren't needed
  res.setHeader(
    "Permissions-Policy",
    "camera=(), microphone=(), geolocation=(self), payment=(self)",
  );

  // Enforce HTTPS with a one-year max-age (only meaningful in production behind TLS)
  res.setHeader(
    "Strict-Transport-Security",
    "max-age=31536000; includeSubDomains",
  );

  // Loose CSP for a JSON API — tighten further in production
  res.setHeader(
    "Content-Security-Policy",
    "default-src 'none'; frame-ancestors 'none'",
  );

  next();
}
