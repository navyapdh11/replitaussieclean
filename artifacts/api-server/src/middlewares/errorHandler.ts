import { type Request, type Response, type NextFunction } from "express";
import { logger } from "../lib/logger";

/* ─── Typed API error ─────────────────────────────────────────────────── */

export class ApiError extends Error {
  constructor(
    public readonly statusCode: number,
    message: string,
    public readonly code?: string,
    public readonly details?: unknown,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

/* ─── 404 fallback ────────────────────────────────────────────────────── */

export function notFound(req: Request, res: Response): void {
  res.status(404).json({
    error: `Route not found: ${req.method} ${req.path}`,
    code: "NOT_FOUND",
    requestId: req.headers["x-request-id"],
  });
}

/* ─── Centralized error handler ───────────────────────────────────────── */

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function errorHandler(
  err: unknown,
  req: Request,
  res: Response,
  _next: NextFunction,
): void {
  const requestId = req.headers["x-request-id"] as string | undefined;

  // Known ApiError — predictable, low severity
  if (err instanceof ApiError) {
    if (err.statusCode >= 500) {
      logger.error({ err, requestId }, "API error");
    } else {
      logger.warn({ err, requestId }, "Client error");
    }

    res.status(err.statusCode).json({
      error: err.message,
      code: err.code ?? "API_ERROR",
      details: err.details,
      requestId,
    });
    return;
  }

  // JSON parse error from express.json()
  if (err instanceof SyntaxError && "status" in err && (err as any).status === 400) {
    res.status(400).json({
      error: "Invalid JSON in request body",
      code: "INVALID_JSON",
      requestId,
    });
    return;
  }

  // Unknown error — log at error level
  logger.error({ err, requestId }, "Unhandled server error");

  const message =
    process.env["NODE_ENV"] === "production"
      ? "Internal server error"
      : err instanceof Error
        ? err.message
        : String(err);

  res.status(500).json({
    error: message,
    code: "INTERNAL_ERROR",
    requestId,
  });
}
