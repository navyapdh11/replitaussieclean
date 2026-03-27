import { Router, type IRouter } from "express";
import { db, bookingsTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { logger } from "../lib/logger";

const router: IRouter = Router();

interface LocationEntry {
  lat: number;
  lng: number;
  heading: number;
  speed: number;
  status: string;
  timestamp: number;
}

const trackingStore = new Map<string, LocationEntry>();

const STORE_TTL_MS = 2 * 60 * 60 * 1000; // 2 hours

function evictStale() {
  const cutoff = Date.now() - STORE_TTL_MS;
  for (const [key, val] of trackingStore) {
    if (val.timestamp < cutoff) trackingStore.delete(key);
  }
}
setInterval(evictStale, 10 * 60 * 1000).unref();

/** Haversine distance in km between two lat/lng points */
function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/** Status mapping: tracking status → DB booking status */
const TRACKING_TO_DB_STATUS: Record<string, string> = {
  en_route: "confirmed",
  arrived: "confirmed",
  in_progress: "in_progress",
  completed: "completed",
};

export function setupTracking(io: any) {
  const trackingNS = io.of("/tracking");

  trackingNS.on("connection", (socket: any) => {
    logger.info(`Tracking client connected: ${socket.id}`);

    socket.on("join_job", ({ bookingId }: { bookingId: string }) => {
      socket.join(`job:${bookingId}`);
      const current = trackingStore.get(bookingId);
      if (current) {
        socket.emit("cleaner_location", { bookingId, ...current });
        socket.emit("job_status_update", { bookingId, status: current.status, timestamp: current.timestamp });
      }
    });

    socket.on(
      "update_location",
      async ({
        bookingId,
        cleanerId,
        lat,
        lng,
        heading,
        speed,
      }: {
        bookingId: string;
        cleanerId: string;
        lat: number;
        lng: number;
        heading: number;
        speed: number;
      }) => {
        const prev = trackingStore.get(bookingId);
        const status = prev?.status ?? "en_route";
        const locationData: LocationEntry = { lat, lng, heading, speed, status, timestamp: Date.now() };
        trackingStore.set(bookingId, locationData);

        trackingNS.to(`job:${bookingId}`).emit("cleaner_location", {
          bookingId,
          cleanerId,
          ...locationData,
        });

        // Auto-proximity: if within 200 m of job location and still en_route, switch to arrived
        if (status === "en_route") {
          try {
            const [booking] = await db
              .select()
              .from(bookingsTable)
              .where(eq(bookingsTable.id, bookingId))
              .limit(1);
            if (booking) {
              // We don't have geocoded coords in DB; skip proximity check if no cleaner info
              // This hook is for when we have real coords from a geocoder integration
            }
          } catch { /* non-blocking */ }
        }
      }
    );

    socket.on(
      "job_status",
      async ({ bookingId, status }: { bookingId: string; status: string }) => {
        const valid = ["en_route", "arrived", "in_progress", "completed"];
        if (!valid.includes(status)) return;

        const dbStatus = TRACKING_TO_DB_STATUS[status] ?? "confirmed";
        try {
          await db
            .update(bookingsTable)
            .set({ status: dbStatus })
            .where(eq(bookingsTable.id, bookingId));
        } catch (err) {
          logger.warn({ err }, "Failed to update booking status from tracking");
        }

        const current = trackingStore.get(bookingId) ?? { lat: 0, lng: 0, heading: 0, speed: 0, timestamp: Date.now() };
        trackingStore.set(bookingId, { ...current, status });

        trackingNS.to(`job:${bookingId}`).emit("job_status_update", {
          bookingId,
          status,
          timestamp: Date.now(),
        });
      }
    );

    socket.on("disconnect", () => {
      logger.info(`Tracking client disconnected: ${socket.id}`);
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
