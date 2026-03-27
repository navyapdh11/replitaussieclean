import { Router, type IRouter } from "express";
import { db, bookingsTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { logger } from "../lib/logger";

const router: IRouter = Router();

const trackingStore = new Map<string, {
  lat: number;
  lng: number;
  heading: number;
  speed: number;
  status: string;
  timestamp: number;
}>();

export function setupTracking(io: any) {
  const trackingNS = io.of("/tracking");

  trackingNS.on("connection", (socket: any) => {
    logger.info(`Tracking client connected: ${socket.id}`);

    socket.on("join_job", ({ bookingId }: { bookingId: string }) => {
      socket.join(`job:${bookingId}`);
      const current = trackingStore.get(bookingId);
      if (current) {
        socket.emit("cleaner_location", { bookingId, ...current });
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
        const locationData = { lat, lng, heading, speed, status: "en_route", timestamp: Date.now() };
        trackingStore.set(bookingId, locationData);

        trackingNS.to(`job:${bookingId}`).emit("cleaner_location", {
          bookingId,
          cleanerId,
          ...locationData,
        });
      }
    );

    socket.on(
      "job_status",
      async ({ bookingId, status }: { bookingId: string; status: string }) => {
        const valid = ["en_route", "arrived", "in_progress", "completed"];
        if (!valid.includes(status)) return;

        const dbStatus = status === "completed" ? "completed" : status === "in_progress" ? "confirmed" : "confirmed";
        try {
          await db
            .update(bookingsTable)
            .set({ status: dbStatus })
            .where(eq(bookingsTable.id, bookingId));
        } catch {}

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

router.get("/tracking/:bookingId", async (req, res): Promise<void> => {
  const { bookingId } = req.params;
  const current = trackingStore.get(bookingId);
  if (current) {
    res.json({ bookingId, ...current });
  } else {
    res.json({ bookingId, status: "not_started" });
  }
});

export default router;
