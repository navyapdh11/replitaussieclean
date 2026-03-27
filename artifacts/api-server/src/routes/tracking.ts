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

export function setupTracking(io: SocketIOServer): Namespace {
  const trackingNS = io.of("/tracking");

  trackingNS.on("connection", (socket: Socket) => {
    logger.info({ socketId: socket.id }, "Tracking client connected");

    socket.on("join_job", ({ bookingId }: JoinJobPayload) => {
      socket.join(`job:${bookingId}`);
      const current = trackingStore.get(bookingId);
      if (current) {
        socket.emit("cleaner_location", { bookingId, ...current });
        socket.emit("job_status_update", { bookingId, status: current.status, timestamp: current.timestamp });
      }
    });

    socket.on("update_location", async ({ bookingId, cleanerId, lat, lng, heading, speed }: UpdateLocationPayload) => {
      const prev = trackingStore.get(bookingId);
      const status = prev?.status ?? "en_route";
      const locationData: LocationEntry = { lat, lng, heading, speed, status, timestamp: Date.now() };
      trackingStore.set(bookingId, locationData);

      trackingNS.to(`job:${bookingId}`).emit("cleaner_location", {
        bookingId,
        cleanerId,
        ...locationData,
      });
    });

    socket.on("job_status", async ({ bookingId, status }: JobStatusPayload) => {
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
