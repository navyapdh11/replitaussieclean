import type { Request, Response, NextFunction } from "express";
import { ApiError } from "./errorHandler";

/**
 * Simple API key / bearer token authentication middleware.
 *
 * Usage:
 *   router.use(requireAuth(["admin"]));
 *   router.use(requireAuth(["admin", "manager"]));
 *
 * Env vars:
 *   ADMIN_API_KEY — single shared secret for admin endpoints
 *
 * In development (NODE_ENV !== "production") the middleware is permissive
 * when ADMIN_API_KEY is not set, but still honours it when provided.
 */
export function requireAuth(allowedRoles: string[] = ["admin"]) {
  return (req: Request, _res: Response, next: NextFunction) => {
    const apiKey = process.env.ADMIN_API_KEY;

    // Dev mode: skip auth when no key configured
    if (process.env.NODE_ENV !== "production" && !apiKey) {
      req.user = { role: "admin" };
      return next();
    }

    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return next(new ApiError(401, "Missing Authorization header"));
    }

    // Support both "Bearer <token>" and raw API key
    const token = authHeader.startsWith("Bearer ")
      ? authHeader.slice(7)
      : authHeader;

    if (token !== apiKey) {
      return next(new ApiError(403, "Invalid credentials"));
    }

    req.user = { role: "admin" };
    next();
  };
}

// Extend Express Request to include user
declare global {
  namespace Express {
    interface Request {
      user?: { role: string };
    }
  }
}
