import { type Request, type Response, type NextFunction } from "express";
import { randomUUID } from "crypto";

/**
 * Injects a unique X-Request-Id header into every response.
 * Re-uses the incoming header if already set by a load-balancer / proxy.
 */
export function requestId(req: Request, res: Response, next: NextFunction): void {
  const id = (req.headers["x-request-id"] as string | undefined) ?? randomUUID();
  req.headers["x-request-id"] = id;
  res.setHeader("X-Request-Id", id);
  next();
}
