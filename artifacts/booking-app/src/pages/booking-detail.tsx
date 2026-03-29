import { useEffect, useState, type ComponentType } from "react";
import { useParams, Link } from "wouter";
import { motion } from "framer-motion";
import {
  ArrowLeft, Calendar, Clock, MapPin, CheckCircle, AlertCircle,
  CreditCard, Phone, Mail, User, Navigation, Play, Loader2,
} from "lucide-react";
import { PhotoUploadPanel } from "@/components/PhotoUploadPanel";
import { formatCurrency } from "@/lib/utils";
import { simulateCleaner } from "@/lib/tracking";

interface BookingDetail {
  id: string;
  serviceType: string;
  propertyType: string;
  bedrooms: number;
  bathrooms: number;
  date: string;
  timeSlot: string;
  addressLine1: string;
  addressLine2?: string;
  suburb: string;
  state: string;
  postcode: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  status: string;
  quoteAmountCents: number;
  gstAmountCents: number;
  extras: string[];
  notes?: string;
  createdAt: string;
}

const STATUS_LABELS: Record<string, { label: string; color: string; bg: string }> = {
  pending:     { label: "Pending",     color: "text-yellow-400", bg: "bg-yellow-500/10 border-yellow-500/20" },
  confirmed:   { label: "Confirmed",   color: "text-cyan-400",   bg: "bg-cyan-500/10 border-cyan-500/20" },
  in_progress: { label: "In Progress", color: "text-green-400",  bg: "bg-green-500/10 border-green-500/20" },
  completed:   { label: "Completed",   color: "text-blue-400",   bg: "bg-blue-500/10 border-blue-500/20" },
  cancelled:   { label: "Cancelled",   color: "text-red-400",    bg: "bg-red-500/10 border-red-500/20" },
};

const BASE_URL = (import.meta.env.BASE_URL ?? "/booking-app").replace(/\/$/, "");

// Approximate lat/lng for Australian state capitals (used for demo simulation)
const STATE_COORDS: Record<string, [number, number]> = {
  NSW: [-33.8688, 151.2093],
  VIC: [-37.8136, 144.9631],
  QLD: [-27.4698, 153.0251],
  WA:  [-31.9505, 115.8605],
  SA:  [-34.9285, 138.6007],
  TAS: [-42.8821, 147.3272],
  ACT: [-35.2809, 149.1300],
  NT:  [-12.4634, 130.8456],
};

function BookingSkeleton() {
  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <header className="border-b border-slate-800 bg-slate-900/80 sticky top-0 z-20 py-4 px-4 sm:px-8">
        <div className="max-w-4xl mx-auto flex items-center gap-4">
          <div className="w-16 h-5 bg-slate-800 rounded-full animate-pulse" />
          <div className="flex-1 space-y-1.5">
            <div className="h-5 w-40 bg-slate-800 rounded animate-pulse" />
            <div className="h-3 w-64 bg-slate-800 rounded animate-pulse" />
          </div>
          <div className="w-20 h-6 bg-slate-800 rounded-full animate-pulse" />
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-8 py-10">
        <div className="h-16 rounded-2xl bg-slate-900 border border-slate-800 animate-pulse mb-6" />
        <div className="grid md:grid-cols-2 gap-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="rounded-2xl bg-slate-900 border border-slate-800 p-6 space-y-3">
              <div className="h-4 w-32 bg-slate-800 rounded animate-pulse" />
              {[...Array(3)].map((_, j) => (
                <div key={j} className="h-3 bg-slate-800/70 rounded animate-pulse" style={{ width: `${60 + Math.random() * 30}%` }} />
              ))}
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}

export function BookingDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [booking, setBooking] = useState<BookingDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showTracker, setShowTracker] = useState(false);
  const [LiveTrackerComponent, setLiveTrackerComponent] = useState<ComponentType<any> | null>(null);
  const [simRunning, setSimRunning] = useState(false);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    fetch(`${BASE_URL}/api/bookings/${id}`)
      .then((r) => {
        if (!r.ok) throw new Error("Booking not found");
        return r.json();
      })
      .then((data) => { setBooking(data); setLoading(false); })
      .catch((err) => { setError(err.message); setLoading(false); });
  }, [id]);

  const handleShowTracker = async () => {
    if (!LiveTrackerComponent) {
      const mod = await import("@/components/tracking/LiveTracker");
      setLiveTrackerComponent(() => mod.LiveTracker);
    }
    setShowTracker(true);
  };

  const handleDemoSimulate = async () => {
    if (!booking || simRunning) return;
    // Lazy-load the tracker if not visible yet
    if (!LiveTrackerComponent) {
      const mod = await import("@/components/tracking/LiveTracker");
      setLiveTrackerComponent(() => mod.LiveTracker);
      setShowTracker(true);
    } else if (!showTracker) {
      setShowTracker(true);
    }
    const [lat, lng] = STATE_COORDS[booking.state] ?? [-33.8688, 151.2093];
    setSimRunning(true);
    const stop = simulateCleaner(booking.id, lat, lng);
    // Simulation runs ~70s; clean up after 90s as safety net
    setTimeout(() => { stop(); setSimRunning(false); }, 90000);
  };

  if (loading) return <BookingSkeleton />;

  if (error || !booking) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center gap-6 p-8">
        <AlertCircle className="w-14 h-14 text-red-400" />
        <h1 className="text-xl font-bold text-white">Booking Not Found</h1>
        <p className="text-slate-400 text-center">
          We couldn't find booking <code className="text-cyan-400">{id}</code>.
        </p>
        <Link to="/" className="px-5 py-2.5 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold rounded-xl transition-colors">
          Back to Home
        </Link>
      </div>
    );
  }

  const statusCfg = STATUS_LABELS[booking.status] ?? STATUS_LABELS.pending;
  const totalCents = booking.quoteAmountCents + booking.gstAmountCents;
  const canTrack = ["confirmed", "in_progress"].includes(booking.status);

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <header className="border-b border-slate-800 bg-slate-900/80 backdrop-blur-md sticky top-0 z-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-8 py-4 flex items-center gap-4">
          <Link to="/" className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors group">
            <ArrowLeft className="w-5 h-5 group-hover:-translate-x-0.5 transition-transform" />
            <span className="text-sm font-medium">Back</span>
          </Link>
          <div className="flex-1">
            <h1 className="text-lg font-bold text-white">Booking Details</h1>
            <p className="text-xs text-slate-500 font-mono mt-0.5">{booking.id}</p>
          </div>
          <span className={`px-3 py-1 rounded-full text-xs font-bold border ${statusCfg.bg} ${statusCfg.color}`}>
            {statusCfg.label}
          </span>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-8 py-10 space-y-8">
        {/* Live tracking / demo banner */}
        {canTrack && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
            className="rounded-2xl bg-gradient-to-r from-cyan-500/10 to-emerald-500/10 border border-cyan-500/20 p-5"
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <Navigation className="w-6 h-6 text-cyan-400 flex-shrink-0" />
                <div>
                  <p className="font-bold text-white">Live GPS Tracking Available</p>
                  <p className="text-sm text-slate-400">Track your cleaner's location in real time</p>
                </div>
              </div>
              <div className="flex gap-2 flex-shrink-0">
                <button
                  onClick={handleShowTracker}
                  className="px-4 py-2 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold rounded-xl text-sm transition-colors"
                >
                  {showTracker ? "Refresh Map" : "Track Cleaner"}
                </button>
                <button
                  onClick={handleDemoSimulate}
                  disabled={simRunning}
                  title="Simulate a cleaner moving towards this booking"
                  className="px-4 py-2 border border-cyan-500/40 text-cyan-400 hover:bg-cyan-500/10 font-semibold rounded-xl text-sm transition-colors disabled:opacity-60 flex items-center gap-2"
                >
                  {simRunning ? (
                    <><Loader2 className="w-4 h-4 animate-spin" /> Simulating…</>
                  ) : (
                    <><Play className="w-4 h-4" /> Demo Mode</>
                  )}
                </button>
              </div>
            </div>
          </motion.div>
        )}

        {showTracker && LiveTrackerComponent && (
          <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }}>
            <LiveTrackerComponent bookingId={booking.id} suburb={booking.suburb} state={booking.state} />
          </motion.div>
        )}

        {/* Detail cards */}
        <div className="grid md:grid-cols-2 gap-6">
          <div className="rounded-2xl bg-slate-900 border border-slate-800 p-6 space-y-4">
            <h2 className="font-bold text-white flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-cyan-400" /> Service Details
            </h2>
            <dl className="space-y-3 text-sm">
              <DetailRow label="Service Type" value={booking.serviceType.replace(/_/g, " ")} capitalize />
              <DetailRow label="Property" value={booking.propertyType} capitalize />
              <DetailRow label="Bedrooms / Baths" value={`${booking.bedrooms} bed · ${booking.bathrooms} bath`} />
              {booking.extras?.length > 0 && (
                <div>
                  <dt className="text-slate-400 mb-1.5">Extras</dt>
                  <dd className="flex flex-wrap gap-1.5">
                    {booking.extras.map((e) => (
                      <span key={e} className="px-2.5 py-0.5 bg-slate-800 text-slate-300 rounded-full text-xs font-medium capitalize">{e}</span>
                    ))}
                  </dd>
                </div>
              )}
            </dl>
          </div>

          <div className="rounded-2xl bg-slate-900 border border-slate-800 p-6 space-y-4">
            <h2 className="font-bold text-white flex items-center gap-2">
              <Calendar className="w-5 h-5 text-cyan-400" /> Schedule
            </h2>
            <dl className="space-y-3 text-sm">
              <DetailRow label="Date" value={booking.date} icon={<Calendar className="w-3.5 h-3.5" />} />
              <DetailRow label="Arrival Window" value={booking.timeSlot} icon={<Clock className="w-3.5 h-3.5" />} />
              <div>
                <dt className="text-slate-400 flex items-center gap-1.5 mb-1.5">
                  <MapPin className="w-3.5 h-3.5" /> Address
                </dt>
                <dd className="font-medium leading-relaxed">
                  {booking.addressLine1}{booking.addressLine2 ? `, ${booking.addressLine2}` : ""}<br />
                  {booking.suburb}, {booking.state} {booking.postcode}
                </dd>
              </div>
            </dl>
          </div>

          <div className="rounded-2xl bg-slate-900 border border-slate-800 p-6 space-y-4">
            <h2 className="font-bold text-white flex items-center gap-2">
              <User className="w-5 h-5 text-cyan-400" /> Contact Details
            </h2>
            <dl className="space-y-3 text-sm">
              <DetailRow label="Name" value={`${booking.firstName} ${booking.lastName}`} />
              <div className="flex justify-between items-center">
                <dt className="text-slate-400 flex items-center gap-1.5"><Mail className="w-3.5 h-3.5" /> Email</dt>
                <dd className="font-medium text-cyan-400">{booking.email}</dd>
              </div>
              <DetailRow label="Phone" value={booking.phone} icon={<Phone className="w-3.5 h-3.5" />} />
            </dl>
          </div>

          <div className="rounded-2xl bg-slate-900 border border-slate-800 p-6 space-y-4">
            <h2 className="font-bold text-white flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-cyan-400" /> Payment Summary
            </h2>
            <dl className="space-y-3 text-sm">
              <DetailRow label="Service Subtotal" value={formatCurrency(booking.quoteAmountCents)} />
              <DetailRow label="GST (included)" value={formatCurrency(booking.gstAmountCents)} />
              <div className="flex justify-between pt-3 border-t border-slate-700">
                <dt className="font-bold text-white">Total Charged</dt>
                <dd className="font-extrabold text-xl text-cyan-400">{formatCurrency(totalCents)}</dd>
              </div>
            </dl>
          </div>
        </div>

        {booking.notes && (
          <div className="rounded-2xl bg-slate-900 border border-slate-800 p-6">
            <h2 className="font-bold text-white mb-3">Special Instructions</h2>
            <p className="text-slate-300 text-sm leading-relaxed">{booking.notes}</p>
          </div>
        )}

        {/* Photo upload panel – shown when photo add-on included or booking is in progress/completed */}
        {(booking.extras?.includes("photo") || ["in_progress", "completed"].includes(booking.status)) && (
          <PhotoUploadPanel
            bookingId={booking.id}
            hasPhotoAddon={booking.extras?.includes("photo") ?? false}
          />
        )}

        <div className="text-center pt-4">
          <p className="text-slate-600 text-xs">
            Booked on {new Date(booking.createdAt).toLocaleDateString("en-AU", { dateStyle: "long" })}
          </p>
        </div>
      </main>
    </div>
  );
}

function DetailRow({
  label,
  value,
  capitalize,
  icon,
}: {
  label: string;
  value: string;
  capitalize?: boolean;
  icon?: React.ReactNode;
}) {
  return (
    <div className="flex justify-between">
      <dt className="text-slate-400 flex items-center gap-1.5">
        {icon}
        {label}
      </dt>
      <dd className={`font-semibold ${capitalize ? "capitalize" : ""}`}>{value}</dd>
    </div>
  );
}
