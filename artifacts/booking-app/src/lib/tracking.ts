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

export function joinJobTracking(bookingId: string, onLocation: (data: any) => void, onStatus: (data: any) => void) {
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
