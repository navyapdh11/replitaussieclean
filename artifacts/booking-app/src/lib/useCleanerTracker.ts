import { useEffect, useRef, useState, useCallback } from "react";
import { getTrackingSocket } from "./tracking";

export type TrackingStatus = "en_route" | "arrived" | "in_progress" | "completed";

interface UseCleanerTrackerOptions {
  cleanerId: string;
  bookingId: string;
  enabled?: boolean;
}

export function useCleanerTracker({ cleanerId, bookingId, enabled = false }: UseCleanerTrackerOptions) {
  const [isTracking, setIsTracking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<TrackingStatus>("en_route");
  const watchIdRef = useRef<number | null>(null);

  const updateStatus = useCallback((newStatus: TrackingStatus) => {
    setStatus(newStatus);
    const sock = getTrackingSocket();
    sock.emit("job_status", { bookingId, status: newStatus });
  }, [bookingId]);

  useEffect(() => {
    if (!enabled) return;

    const sock = getTrackingSocket();
    if (!sock.connected) sock.connect();

    sock.on("connect", () => setError(null));
    sock.on("connect_error", () => setError("Connection lost. Retrying..."));

    if (!("geolocation" in navigator)) {
      setError("Geolocation not supported on this device.");
      return;
    }

    watchIdRef.current = navigator.geolocation.watchPosition(
      (pos) => {
        const { latitude, longitude, heading, speed } = pos.coords;
        sock.emit("update_location", {
          cleanerId,
          bookingId,
          lat: latitude,
          lng: longitude,
          heading: heading ?? 0,
          speed: speed ?? 0,
        });
        setIsTracking(true);
        setError(null);
      },
      (err) => {
        console.error("Geolocation error:", err);
        setError("Unable to access GPS. Please enable location permissions.");
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );

    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
      setIsTracking(false);
    };
  }, [cleanerId, bookingId, enabled]);

  return { isTracking, error, status, updateStatus };
}
