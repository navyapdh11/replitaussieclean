import { type Request, type Response, type NextFunction } from "express";

/**
 * Injects an X-Response-Time header (ms) by hooking into res.writeHead.
 * writeHead is always called before headers are flushed, even when compression
 * is active — so this is safe and always fires before headersSent === true.
 */
export function responseTime(_req: Request, res: Response, next: NextFunction): void {
  const start = process.hrtime.bigint();

  const originalWriteHead = res.writeHead.bind(res) as (
    statusCode: number,
    ...args: unknown[]
  ) => Response;

  (res as unknown as Record<string, unknown>).writeHead = function (
    statusCode: number,
    ...args: unknown[]
  ) {
    const ms = Number(process.hrtime.bigint() - start) / 1_000_000;
    res.setHeader("X-Response-Time", `${ms.toFixed(2)}ms`);
    return originalWriteHead(statusCode, ...args);
  };

  next();
}
