import { createServer } from "http";
import { Server as SocketIOServer } from "socket.io";
import app from "./app";
import { logger } from "./lib/logger";
import { setupTracking } from "./routes/tracking";

const rawPort = process.env["PORT"];

if (!rawPort) {
  throw new Error(
    "PORT environment variable is required but was not provided.",
  );
}

const port = Number(rawPort);

if (Number.isNaN(port) || port <= 0) {
  throw new Error(`Invalid PORT value: "${rawPort}"`);
}

const httpServer = createServer(app);

/* ── Socket.IO: respect the same origin allowlist as the HTTP CORS config ── */
const ALLOWED_ORIGINS = (process.env.ALLOWED_ORIGINS ?? "")
  .split(",")
  .map((o) => o.trim())
  .filter(Boolean);

const io = new SocketIOServer(httpServer, {
  cors: {
    /* In development ALLOWED_ORIGINS is empty so we allow all to keep the
       local workflow functional. In production the allowlist must be set. */
    origin: ALLOWED_ORIGINS.length > 0 ? ALLOWED_ORIGINS : "*",
    methods: ["GET", "POST"],
  },
  transports: ["websocket", "polling"],
});

setupTracking(io);

const server = httpServer.listen(port, () => {
  logger.info({ port }, "Server listening");
});

/* ── Graceful shutdown ────────────────────────────────────────────────────
   SIGTERM is sent by container orchestrators (Replit, Docker, k8s) before
   SIGKILL. We stop accepting new connections, wait for in-flight requests
   to complete, then exit cleanly so no requests are dropped mid-flight.   */
function shutdown(signal: string) {
  logger.info({ signal }, "Shutdown signal received — draining connections");

  server.close((err) => {
    if (err) {
      logger.error({ err }, "Error during server close");
      process.exit(1);
    }
    logger.info("All connections closed — exiting");
    process.exit(0);
  });

  /* Safety net: force-exit after 10 s if connections stall */
  setTimeout(() => {
    logger.warn("Shutdown timeout — forcing exit");
    process.exit(1);
  }, 10_000).unref();
}

process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT",  () => shutdown("SIGINT"));
