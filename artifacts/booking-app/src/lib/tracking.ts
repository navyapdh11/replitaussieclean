import { io, type Socket } from "socket.io-client";

let socket: Socket | null = null;

const BASE_URL = import.meta.env.BASE_URL?.replace(/\/$/, "") ?? "";
const TRACKING_URL = BASE_URL || window.location.origin;

export function getTrackingSocket(): Socket {
  if (!socket) {
    socket = io(`${TRACKING_URL}/tracking`, {
      transports: ["websocket", "polling"],
      autoConnect: false,
    });
  }
  return socket;
}

export function joinJobTracking(
  bookingId: string,
  onLocation: (data: any) => void,
  onStatus: (data: any) => void,
) {
  const sock = getTrackingSocket();
  if (!sock.connected) sock.connect();
  sock.emit("join_job", { bookingId });
  sock.on("cleaner_location", onLocation);
  sock.on("job_status_update", onStatus);
  return () => {
    sock.off("cleaner_location", onLocation);
    sock.off("job_status_update", onStatus);
  };
}

/**
 * Demo: simulate a cleaner approaching the given coordinates over ~60 seconds.
 * Emits update_location events from a random start point 3–5 km away,
 * then fires arrived → in_progress status events.
 * Returns a cleanup function that cancels the simulation.
 */
export function simulateCleaner(bookingId: string, jobLat: number, jobLng: number): () => void {
  const sock = getTrackingSocket();
  if (!sock.connected) sock.connect();
  sock.emit("join_job", { bookingId });

  const OFFSET = 0.035 + Math.random() * 0.02; // ~3.9–5.6 km offset
  const angle = Math.random() * 2 * Math.PI;
  const startLat = jobLat + Math.cos(angle) * OFFSET;
  const startLng = jobLng + Math.sin(angle) * OFFSET;

  const STEPS = 24;
  const INTERVAL_MS = 2500;
  let step = 0;
  let timers: ReturnType<typeof setTimeout>[] = [];

  // Announce en_route
  sock.emit("job_status", { bookingId, status: "en_route" });

  const intervalId = setInterval(() => {
    step++;
    const progress = Math.min(1, step / STEPS);
    const easedProgress = 1 - Math.pow(1 - progress, 2); // ease-in curve

    const lat = startLat + (jobLat - startLat) * easedProgress;
    const lng = startLng + (jobLng - startLng) * easedProgress;
    const heading = (Math.atan2(jobLng - startLng, jobLat - startLat) * 180) / Math.PI;

    sock.emit("update_location", {
      bookingId,
      cleanerId: "demo-cleaner-01",
      lat,
      lng,
      heading,
      speed: 30 / 3.6, // 30 km/h in m/s
    });

    if (step === STEPS) {
      clearInterval(intervalId);
      // Arrived
      sock.emit("job_status", { bookingId, status: "arrived" });
      // Start cleaning 5s later
      const t1 = setTimeout(() => {
        sock.emit("job_status", { bookingId, status: "in_progress" });
      }, 5000);
      timers.push(t1);
    }
  }, INTERVAL_MS);

  return () => {
    clearInterval(intervalId);
    timers.forEach(clearTimeout);
  };
}
