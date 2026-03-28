import express, { type Express, type Request, type Response, type NextFunction } from "express";
import cors from "cors";
import compression from "compression";
import pinoHttp from "pino-http";
import router from "./routes";
import { logger } from "./lib/logger";
import { requestId } from "./middlewares/requestId";
import { responseTime } from "./middlewares/responseTime";
import { securityHeaders } from "./middlewares/securityHeaders";
import { notFound, errorHandler } from "./middlewares/errorHandler";
import { generalLimiter } from "./lib/ratelimit";

const app: Express = express();

/* ── Trust the Replit / load-balancer proxy for rate-limiting & IPs ──────── */
app.set("trust proxy", 1);

/* ── Request ID — inject early so it's available in all downstream logs ── */
app.use(requestId);

/* ── Response time — register before routes so finish event fires correctly */
app.use(responseTime);

/* ── Security headers ────────────────────────────────────────────────────── */
app.use(securityHeaders);

/* ── Structured request logging ──────────────────────────────────────────── */
app.use(
  pinoHttp({
    logger,
    serializers: {
      req(req) {
        return {
          id: req.headers?.["x-request-id"] ?? req.id,
          method: req.method,
          url: req.url?.split("?")[0],
        };
      },
      res(res) {
        return { statusCode: res.statusCode };
      },
    },
  }),
);

/* ── CORS ────────────────────────────────────────────────────────────────── */
const ALLOWED_ORIGINS = (process.env.ALLOWED_ORIGINS ?? "")
  .split(",")
  .map((o) => o.trim())
  .filter(Boolean);

app.use(cors({
  origin: (origin, cb) => {
    // Allow requests with no origin (curl, server-to-server) and any origin
    // that matches the allow-list. In development the allow-list may be empty,
    // in which case we fall back to permissive mode so the dev workflow still works.
    if (!origin || ALLOWED_ORIGINS.length === 0 || ALLOWED_ORIGINS.includes(origin)) {
      cb(null, true);
    } else {
      cb(new Error(`CORS: origin '${origin}' not allowed`));
    }
  },
  credentials: true,
}));

/* ── Gzip (skip Stripe webhook — raw body required) ─────────────────────── */
app.use(compression({
  filter: (req, res) => {
    if (req.headers["x-no-compression"]) return false;
    return compression.filter(req, res);
  },
  level: 6,
}));

/* ── Stripe webhook: raw body BEFORE express.json() ─────────────────────── */
app.use(
  "/api/webhooks/stripe",
  express.raw({ type: "application/json", limit: "512kb" }),
  (req: Request & { rawBody?: Buffer }, _res: Response, next: NextFunction) => {
    req.rawBody = req.body as Buffer;
    next();
  },
);

/* ── Body parsers ────────────────────────────────────────────────────────── */
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true }));

/* ── General rate limit (applied to every /api route) ───────────────────── */
app.use("/api", generalLimiter);

/* ── Routes ──────────────────────────────────────────────────────────────── */
app.use("/api", router);

/* ── 404 fallback ────────────────────────────────────────────────────────── */
app.use(notFound);

/* ── Centralized error handler (must be last, 4-argument signature) ──────── */
app.use(errorHandler);

export default app;
