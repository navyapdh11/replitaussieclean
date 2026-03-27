import { useEffect, useState, useRef } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { joinJobTracking } from "@/lib/tracking";
import { Navigation, Clock, CheckCircle, Truck, Loader2 } from "lucide-react";

interface CleanerLocation {
  lat: number;
  lng: number;
  heading: number;
  speed: number;
  status: string;
  timestamp: number;
}

interface JobStatus {
  status: string;
  timestamp: number;
}

interface Props {
  bookingId: string;
  suburb: string;
  state: string;
}

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: typeof Navigation }> = {
  en_route: { label: "Cleaner En Route", color: "text-cyan-400", icon: Truck },
  arrived: { label: "Cleaner Arrived", color: "text-yellow-400", icon: Navigation },
  in_progress: { label: "Cleaning In Progress", color: "text-green-400", icon: CheckCircle },
  completed: { label: "Job Completed", color: "text-blue-400", icon: CheckCircle },
  not_started: { label: "Not Yet Started", color: "text-slate-400", icon: Clock },
};

const PROGRESS: Record<string, number> = {
  not_started: 0, en_route: 25, arrived: 60, in_progress: 80, completed: 100,
};

const cleanerIcon = L.divIcon({
  className: "",
  html: `<div style="font-size:28px;filter:drop-shadow(0 2px 8px rgba(0,0,0,0.6))">🚐</div>`,
  iconSize: [32, 32],
  iconAnchor: [16, 16],
});

const homeIcon = L.divIcon({
  className: "",
  html: `<div style="font-size:28px;filter:drop-shadow(0 2px 8px rgba(0,0,0,0.6))">🏠</div>`,
  iconSize: [32, 32],
  iconAnchor: [16, 32],
});

function MapController({ center }: { center: [number, number] | null }) {
  const map = useMap();
  useEffect(() => {
    if (center) map.flyTo(center, 14, { duration: 1.5 });
  }, [center, map]);
  return null;
}

const AU_COORDS: Record<string, [number, number]> = {
  "Sydney": [-33.8688, 151.2093],
  "Melbourne": [-37.8136, 144.9631],
  "Brisbane": [-27.4698, 153.0251],
  "Perth": [-31.9505, 115.8605],
  "Adelaide": [-34.9285, 138.6007],
  "Canberra": [-35.2809, 149.1300],
  "Hobart": [-42.8821, 147.3272],
  "Darwin": [-12.4634, 130.8456],
  "Gold Coast": [-28.0167, 153.4000],
  "Newcastle": [-32.9283, 151.7817],
};

function guessCoords(suburb: string, state: string): [number, number] {
  for (const [name, coords] of Object.entries(AU_COORDS)) {
    if (suburb.toLowerCase().includes(name.toLowerCase())) return coords;
  }
  const STATE_DEFAULTS: Record<string, [number, number]> = {
    NSW: [-33.8688, 151.2093], VIC: [-37.8136, 144.9631],
    QLD: [-27.4698, 153.0251], WA: [-31.9505, 115.8605],
    SA: [-34.9285, 138.6007], ACT: [-35.2809, 149.1300],
    TAS: [-42.8821, 147.3272], NT: [-12.4634, 130.8456],
  };
  return STATE_DEFAULTS[state.toUpperCase()] ?? [-33.8688, 151.2093];
}

export function LiveTracker({ bookingId, suburb, state }: Props) {
  const [location, setLocation] = useState<CleanerLocation | null>(null);
  const [jobStatus, setJobStatus] = useState<string>("not_started");
  const [connected, setConnected] = useState(false);
  const jobCoords = guessCoords(suburb, state);
  const mapCenter = location ? [location.lat, location.lng] as [number, number] : null;
  const unsubRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    fetch(`${import.meta.env.BASE_URL?.replace(/\/$/, "")}/api/tracking/${bookingId}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.lat) setLocation(data);
        if (data.status) setJobStatus(data.status);
      })
      .catch(() => {});

    unsubRef.current = joinJobTracking(
      bookingId,
      (loc) => { setLocation(loc); setConnected(true); },
      (stat) => { setJobStatus(stat.status); setConnected(true); }
    );

    setConnected(true);
    return () => { unsubRef.current?.(); };
  }, [bookingId]);

  const cfg = STATUS_CONFIG[jobStatus] ?? STATUS_CONFIG.not_started;
  const StatusIcon = cfg.icon;
  const progress = PROGRESS[jobStatus] ?? 0;

  return (
    <div className="rounded-2xl border border-slate-700 overflow-hidden shadow-2xl bg-slate-900">
      <div className="h-[360px] relative">
        <MapContainer
          center={jobCoords}
          zoom={13}
          style={{ width: "100%", height: "100%" }}
          zoomControl={false}
          className="z-0"
        >
          <TileLayer
            url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
            subdomains="abcd"
            maxZoom={20}
          />
          <MapController center={mapCenter} />
          <Marker position={jobCoords} icon={homeIcon}>
            <Popup>Job location: {suburb}, {state}</Popup>
          </Marker>
          {location && (
            <Marker position={[location.lat, location.lng]} icon={cleanerIcon}>
              <Popup>Your cleaner is here</Popup>
            </Marker>
          )}
        </MapContainer>

        <div className="absolute top-3 right-3 z-10">
          <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold backdrop-blur-md border ${connected ? "bg-green-500/20 border-green-500/30 text-green-400" : "bg-slate-800/80 border-slate-700 text-slate-400"}`}>
            <span className={`w-2 h-2 rounded-full ${connected ? "bg-green-400 animate-pulse" : "bg-slate-500"}`} />
            {connected ? "Live" : "Connecting..."}
          </div>
        </div>
      </div>

      <div className="p-5 border-t border-slate-700 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${cfg.color.replace("text-", "bg-").replace("-400", "-500/10")} border ${cfg.color.replace("text-", "border-").replace("-400", "-500/20")}`}>
              <StatusIcon className={`w-5 h-5 ${cfg.color}`} />
            </div>
            <div>
              <p className={`font-bold ${cfg.color}`}>{cfg.label}</p>
              {location && (
                <p className="text-xs text-slate-500">
                  Speed: {Math.round((location.speed ?? 0) * 3.6)} km/h
                </p>
              )}
            </div>
          </div>
          {!location && jobStatus === "not_started" && (
            <div className="flex items-center gap-2 text-slate-500 text-sm">
              <Loader2 className="w-4 h-4 animate-spin" />
              Awaiting cleaner
            </div>
          )}
        </div>

        <div className="space-y-1.5">
          <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-cyan-500 to-emerald-500 transition-all duration-1000 ease-in-out"
              style={{ width: `${progress}%` }}
            />
          </div>
          <div className="flex justify-between text-xs text-slate-600">
            <span>Assigned</span><span>En Route</span><span>Arrived</span><span>Cleaning</span><span>Done</span>
          </div>
        </div>
      </div>
    </div>
  );
}
