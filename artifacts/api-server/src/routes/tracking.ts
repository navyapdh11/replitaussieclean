import { Router, type IRouter } from "express";
import { db, bookingsTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { logger } from "../lib/logger";
import type { Server as SocketIOServer, Namespace, Socket } from "socket.io";

const router: IRouter = Router();

interface LocationEntry {
  lat: number;
  lng: number;
  heading: number;
  speed: number;
  status: string;
  timestamp: number;
}

interface JoinJobPayload { bookingId: string }
interface UpdateLocationPayload {
  bookingId: string;
  cleanerId: string;
  lat: number;
  lng: number;
  heading: number;
  speed: number;
}
interface JobStatusPayload { bookingId: string; status: string }

const trackingStore = new Map<string, LocationEntry>();
const STORE_TTL_MS = 2 * 60 * 60 * 1000; // 2 hours

function evictStale(): void {
  const cutoff = Date.now() - STORE_TTL_MS;
  for (const [key, val] of trackingStore) {
    if (val.timestamp < cutoff) trackingStore.delete(key);
  }
}
setInterval(evictStale, 10 * 60 * 1000).unref();

/** Status mapping: tracking status → DB booking status */
const TRACKING_TO_DB_STATUS: Record<string, string> = {
  en_route:    "confirmed",
  arrived:     "confirmed",
  in_progress: "in_progress",
  completed:   "completed",
};

/** Secret token cleaners must present on connection to push updates. */
const CLEANER_SECRET = process.env.CLEANER_SOCKET_SECRET ?? "";

export function setupTracking(io: SocketIOServer): Namespace {
  const trackingNS = io.of("/tracking");

  trackingNS.on("connection", (socket: Socket) => {
    logger.info({ socketId: socket.id }, "Tracking client connected");

    // Cleaners authenticate by emitting `auth` with { secret }.
    // Until authenticated, privileged write events are dropped.
    let isCleaner = false;
    socket.on("auth", ({ secret }: { secret?: string }) => {
      if (CLEANER_SECRET && secret === CLEANER_SECRET) {
        isCleaner = true;
        socket.emit("auth_ok");
        logger.info({ socketId: socket.id }, "Cleaner socket authenticated");
      } else {
        socket.emit("auth_fail", { reason: "Invalid secret" });
        logger.warn({ socketId: socket.id }, "Cleaner socket auth failed");
      }
    });

    // Customers (unauthenticated) can only subscribe to a job room.
    socket.on("join_job", ({ bookingId }: JoinJobPayload) => {
      if (typeof bookingId !== "string" || bookingId.length === 0 || bookingId.length > 128) {
        socket.emit("error", { message: "Invalid bookingId" });
        return;
      }
      socket.join(`job:${bookingId}`);
      const current = trackingStore.get(bookingId);
      if (current) {
        socket.emit("cleaner_location", { bookingId, ...current });
        socket.emit("job_status_update", { bookingId, status: current.status, timestamp: current.timestamp });
      }
    });

    socket.on("update_location", async ({ bookingId, cleanerId, lat, lng, heading, speed }: UpdateLocationPayload) => {
      // Only authenticated cleaner sockets may push location data.
      if (!isCleaner) {
        socket.emit("error", { message: "Unauthorised: authenticate first" });
        return;
      }
      // Validate coordinate ranges before storing or broadcasting.
      if (
        typeof lat !== "number" || !isFinite(lat) || lat < -90  || lat > 90 ||
        typeof lng !== "number" || !isFinite(lng) || lng < -180 || lng > 180
      ) {
        socket.emit("error", { message: "Invalid coordinates" });
        return;
      }
      const safeHeading = typeof heading === "number" && isFinite(heading) ? heading : 0;
      const safeSpeed   = typeof speed   === "number" && isFinite(speed)   && speed >= 0 ? speed : 0;
      const prev = trackingStore.get(bookingId);
      const status = prev?.status ?? "en_route";
      const locationData: LocationEntry = { lat, lng, heading: safeHeading, speed: safeSpeed, status, timestamp: Date.now() };
      trackingStore.set(bookingId, locationData);

      trackingNS.to(`job:${bookingId}`).emit("cleaner_location", {
        bookingId,
        cleanerId,
        ...locationData,
      });
    });

    socket.on("job_status", async ({ bookingId, status }: JobStatusPayload) => {
      // Only authenticated cleaner sockets may change job status.
      if (!isCleaner) {
        socket.emit("error", { message: "Unauthorised: authenticate first" });
        return;
      }
      const valid = ["en_route", "arrived", "in_progress", "completed"];
      if (!valid.includes(status)) return;

      const dbStatus = TRACKING_TO_DB_STATUS[status] ?? "confirmed";
      try {
        await db
          .update(bookingsTable)
          .set({ status: dbStatus })
          .where(eq(bookingsTable.id, bookingId));
      } catch (err) {
        logger.warn({ err }, "Failed to update booking status from tracking event");
      }

      const current = trackingStore.get(bookingId) ?? {
        lat: 0, lng: 0, heading: 0, speed: 0, timestamp: Date.now(),
      };
      trackingStore.set(bookingId, { ...current, status });

      trackingNS.to(`job:${bookingId}`).emit("job_status_update", {
        bookingId,
        status,
        timestamp: Date.now(),
      });
    });

    socket.on("disconnect", () => {
      logger.info({ socketId: socket.id }, "Tracking client disconnected");
    });
  });

  return trackingNS;
}

router.get("/tracking/:bookingId", (req, res): void => {
  const { bookingId } = req.params;
  const current = trackingStore.get(bookingId);
  res.json(current ? { bookingId, ...current } : { bookingId, status: "not_started" });
});

export default router;
